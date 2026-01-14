import { ViterbiState, ALL_STATES } from '../types/types';
import { ScreenplayClassifier } from './ScreenplayClassifier';
import { DocumentMemory } from './DocumentMemory';

/**
 * سياق مبسط يمكن استخدامه عند حساب الانبعاثات
 */
interface EmissionContext {
  lineLength: number;
  wordCount: number;
  nextLine: string | null;
  prevLine: string | null;
}

/**
 * مسؤول عن حساب احتمالية/درجة أن يكون كل سطر من كل نوع (Emission Scores).
 */
export class EmissionCalculator {

  /**
   * حساب درجات الانبعاث لكل الحالات لسطر معين.
   */
  static calculateEmissions(
    rawLine: string,
    index: number,
    allLines: string[],
    documentMemory?: DocumentMemory
  ): { [state in ViterbiState]: number } {

    const emissions = {} as { [state in ViterbiState]: number };

    // إذا كان السطر فارغًا، فإن الحالة الوحيدة المنطقية هي 'blank'
    if (ScreenplayClassifier.isBlank(rawLine)) {
      for (const state of ALL_STATES) {
        emissions[state] = state === 'blank' ? 100 : 0;
      }
      return emissions;
    }

    const trimmed = rawLine.trim();

    // === تصنيفات سريعة بثقة عالية ===

    // 1. البسملة
    if (ScreenplayClassifier.isBasmala(trimmed)) {
      this.setHighConfidence(emissions, 'basmala');
      return emissions;
    }

    // 2. بداية رأس المشهد
    if (ScreenplayClassifier.isSceneHeaderStart(trimmed)) {
      this.setHighConfidence(emissions, 'scene-header-top-line');
      return emissions;
    }

    // 3. مشهد-1 (مشهد + رقم فقط)
    if (ScreenplayClassifier.isSceneHeader1(trimmed)) {
      this.setHighConfidence(emissions, 'scene-header-1');
      return emissions;
    }

    // 4. جملة انتقال
    if (ScreenplayClassifier.isTransition(trimmed)) {
      this.setHighConfidence(emissions, 'transition');
      return emissions;
    }

    // 5. بين قوسين (ملاحظة إخراجية)
    if (ScreenplayClassifier.isParenShaped(trimmed)) {
      this.setHighConfidence(emissions, 'parenthetical');
      return emissions;
    }

    // === حساب درجات الانبعاث بناءً على خصائص النص ===

    const ctx = this.buildEmissionContext(rawLine, index, allLines);
    const normalized = ScreenplayClassifier.normalizeLine(rawLine);

    emissions['character'] = this.calculateCharacterEmission(rawLine, normalized, ctx, documentMemory);
    emissions['dialogue'] = this.calculateDialogueEmission(rawLine, normalized, ctx);
    emissions['action'] = this.calculateActionEmission(rawLine, normalized, ctx, documentMemory);
    emissions['parenthetical'] = this.calculateParentheticalEmission(rawLine, normalized, ctx);
    emissions['scene-header-2'] = this.calculateSceneHeader2Emission(rawLine, normalized);
    emissions['scene-header-3'] = this.calculateSceneHeader3Emission(rawLine, normalized);

    // الأنواع الأخرى نعطيها قيم افتراضية منخفضة
    emissions['basmala'] = emissions['basmala'] ?? 0;
    emissions['transition'] = emissions['transition'] ?? 5;
    emissions['scene-header-1'] = emissions['scene-header-1'] ?? 5;
    emissions['scene-header-top-line'] = emissions['scene-header-top-line'] ?? 5;
    emissions['blank'] = 0;

    return emissions;
  }

  /**
   * بناء سياق مبسط للسطر
   */
  private static buildEmissionContext(
    rawLine: string,
    index: number,
    allLines: string[]
  ): EmissionContext {
    return {
      lineLength: rawLine.length,
      wordCount: ScreenplayClassifier.wordCount(rawLine),
      nextLine: index < allLines.length - 1 ? allLines[index + 1] : null,
      prevLine: index > 0 ? allLines[index - 1] : null
    };
  }

  /**
   * دالة مساعدة لتعيين ثقة عالية لنوع واحد
   */
  private static setHighConfidence(emissions: { [state: string]: number }, state: ViterbiState): void {
    for (const s of ALL_STATES) {
      emissions[s] = s === state ? 100 : 0;
    }
  }

  /**
   * حساب درجة احتمال أن يكون السطر اسم شخصية (Character)
   */
  private static calculateCharacterEmission(
    rawLine: string,
    normalized: string,
    ctx: EmissionContext,
    documentMemory?: DocumentMemory
  ): number {
    let score = 30;

    const trimmed = rawLine.trim();
    const wordCount = ctx.wordCount;

    // 1. إذا انتهى السطر بنقطتين ":" → مؤشر قوي أنه اسم شخصية
    if (trimmed.endsWith(':') || trimmed.endsWith('：')) {
      score += 50;
    }

    // 2. طول السطر صغير
    if (wordCount <= 3) score += 20;
    else if (wordCount <= 5) score += 10;
    else if (wordCount > 7) score -= 30;

    // 3. اسم موجود مسبقاً في ذاكرة المستند
    if (documentMemory) {
      const name = trimmed.replace(/[:：\s]+$/, '');
      const known = documentMemory.isKnownCharacter(name);
      if (known?.confidence === 'high') score += 40;
      else if (known?.confidence === 'medium') score += 25;
    }

    // 4. يبدأ بفعل
    if (ScreenplayClassifier.isActionVerbStart(normalized)) {
      score -= 35;
    }

    // 5. لا يحتوي علامات ترقيم نهائية
    if (!ScreenplayClassifier.hasSentencePunctuation(normalized)) {
      score += 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * حساب درجة احتمال أن يكون السطر حوار (Dialogue)
   */
  private static calculateDialogueEmission(
    rawLine: string,
    normalized: string,
    ctx: EmissionContext
  ): number {
    let score = 25;

    const trimmed = rawLine.trim();
    const wordCount = ctx.wordCount;

    // 1. طول مناسب للحوار
    if (wordCount >= 2 && wordCount <= 50) score += 20;

    // 2. يحتوي علامات ترقيم جملية
    if (ScreenplayClassifier.hasSentencePunctuation(normalized)) {
      score += 15;
    }

    // 3. يحتوي على ضمائر
    if (/أنا|إنت|أنت|إحنا|نحن|هو|هي/.test(normalized)) {
      score += 15;
    }

    // 4. وجود علامة استفهام
    if (/\?|؟/.test(normalized)) {
      score += 10;
    }

    // 5. يبدأ بفعل حركي
    if (ScreenplayClassifier.isActionVerbStart(normalized)) {
      score -= 20;
    }

    // 6. لا ينتهي بنقطتين
    if (!trimmed.endsWith(':') && !trimmed.endsWith('：')) {
      score += 5;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * حساب درجة احتمال أن يكون السطر وصف حركة/مشهد (Action)
   */
  private static calculateActionEmission(
    rawLine: string,
    normalized: string,
    ctx: EmissionContext,
    documentMemory?: DocumentMemory
  ): number {
    let score = 35;

    const trimmed = rawLine.trim();
    const wordCount = ctx.wordCount;

    // 1. يبدأ بفعل حركي
    if (ScreenplayClassifier.isActionVerbStart(normalized)) {
      score += 40;
    }

    // 2. يطابق أنماط جمل الوصف
    if (ScreenplayClassifier.matchesActionStartPattern(normalized)) {
      score += 30;
    }

    // 3. طول السطر أطول من 5 كلمات
    if (wordCount > 5) score += 15;

    // 4. يحتوي كلمات وصفية شائعة
    if (/بطيء|سريع|فجأة|ببطء|بسرعة|هدوء|صمت/.test(normalized)) {
      score += 10;
    }

    // 5. ينتهي بنقطتين
    if (trimmed.endsWith(':') || trimmed.endsWith('：')) {
      score -= 30;
    }

    // 6. إذا كانت الكلمة معروفة كشخصية
    if (documentMemory) {
      const name = trimmed.replace(/[:：\s]+$/, '');
      const known = documentMemory.isKnownCharacter(name);
      if (known) score -= 25;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * حساب درجة احتمال أن يكون السطر ملاحظة إخراجية (Parenthetical)
   */
  private static calculateParentheticalEmission(
    rawLine: string,
    normalized: string,
    ctx: EmissionContext
  ): number {
    let score = 10;

    const trimmed = rawLine.trim();

    // 1. يبدأ بقوس "("
    if (trimmed.startsWith('(')) {
      score += 40;
    }

    // 2. يحتوي على كلمات إخراجية شائعة
    const parentheticalWords = ['همساً', 'بصوت', 'مبتسماً', 'بحزن', 'بغضب', 'ساخراً'];
    if (parentheticalWords.some(w => normalized.includes(w))) {
      score += 30;
    }

    // 3. السطر قصير
    if (ctx.wordCount <= 4) {
      score += 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * حساب درجة احتمال أن يكون السطر هو الجزء الثاني من رأس المشهد (Scene Header 2)
   */
  private static calculateSceneHeader2Emission(
    rawLine: string,
    normalized: string
  ): number {
    let score = 5;

    // 1. يحتوي على كلمة دالة على المكان
    if (/داخلي|خارجي|د\.|خ\./.test(normalized)) {
      score += 40;
    }

    // 2. يحتوي على كلمة زمن
    if (/ليل|نهار|صباح|مساء|فجر/.test(normalized)) {
      score += 35;
    }

    // 3. يحتوي على شرطة "-"
    if (/[-–—]/.test(normalized)) {
      score += 10;
    }

    // 4. قصير
    if (ScreenplayClassifier.wordCount(normalized) <= 5) {
      score += 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * حساب درجة احتمال أن يكون السطر هو الجزء الثالث من رأس المشهد (Scene Header 3)
   */
  private static calculateSceneHeader3Emission(
    rawLine: string,
    normalized: string
  ): number {
    let score = 5;

    const trimmed = rawLine.trim();
    const wordCount = ScreenplayClassifier.wordCount(normalized);

    // 1. قصير (اسم مكان عادة كلمة أو كلمتين)
    if (wordCount <= 4) score += 15;

    // 2. لا يحتوي علامات ترقيم نهائية
    if (!ScreenplayClassifier.hasSentencePunctuation(normalized)) {
      score += 10;
    }

    // 3. لا ينتهي بنقطتين
    if (!trimmed.endsWith(':') && !trimmed.endsWith('：')) {
      score += 5;
    }

    return Math.max(0, Math.min(100, score));
  }
}
