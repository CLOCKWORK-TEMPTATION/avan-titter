خطة تفصيلية لدمج نظام Viterbi/HMM في التطبيق
نظرة عامة على المشكلة والحل المقترح
يعاني نظام تصنيف السطور الحالي من النهج الجشع (Greedy)، حيث يتم تصنيف كل سطر بشكل مستقل عن السياق الكامل (أو اعتمادًا على نافذة قصيرة فقط). هذا يؤدي إلى أخطاء تنتج عنها سلاسل تصنيف غير صحيحة تؤثر على السطور التالية. على سبيل المثال، إذا تم تصنيف سطر واحد خطأ كـ حركة (action) بدلًا من اسم شخصية (character)، فقد يتبعه تصنيف خاطئ للسطر التالي كـ حوار (dialogue) أو حركة بناءً على القرار السابق، مما يُفسد تسلسل المشهد بالكامل.
مثال على مشكلة التصنيف الجشع:
مشهد 1                ← scene-header-1 (صحيح)
داخلي - بيت - ليل     ← scene-header-2 (صحيح)
ياسين                 ← action (خطأ – المفترض شخصية)
مرحباً يا أبي         ← action (خطأ – لأن السطر السابق صُنّف كحركة)
أحمد:                 ← character (صحيح)
كيف حالك؟             ← dialogue (صحيح)
في المثال أعلاه، خطأ تصنيف كلمة "ياسين" كسطر حركة أدى إلى خطأ في تصنيف السطر الذي يليه أيضًا. الحل المقترح لتجنب هذه الأخطاء هو استخدام خوارزمية فيتربي (Viterbi) ضمن نموذج ماركوف مخفي (HMM) للبحث عن أفضل تسلسل ممكن للأنواع عبر النص بالكامل[1] بدلاً من اتخاذ قرار محلي عند كل سطر. خوارزمية فيتربي ستأخذ في الاعتبار احتمالات الانبعاث (Emission) لكل نوع لكل سطر، بالإضافة إلى احتمالات الانتقال (Transition) بين أنواع السطور المتتالية، لإيجاد المسار الأمثل للتصنيفات عبر النص.
باستخدام Viterbi، نقوم بحساب المسار الأكثر احتمالاً للأنواع بحيث يعظم مجموع (درجات الانبعاث + درجات الانتقال) لجميع السطور:
Best sequence = argmax ( Σ [Emission_score(line_i, type) + Transition_score(prev_type, type)] )
بهذا الأسلوب، يتم اختيار التسلسل الكلي الذي يعطي أعلى احتمال بشكل شامل وليس مجرد القرار المحلي الأفضل لكل سطر على حدة[1]. وهذا يعني أنه حتى لو كان تصنيف نوع معين لسطر مفرد يبدو أفضل بشكل محلي، فقد يتم تفضيل نوع آخر إذا كان يؤدي إلى تسلسل إجمالي أكثر اتساقًا ومنطقيًا عبر المشهد.
خطوات تنفيذ دمج Viterbi في النظام
سنقوم الآن بشرح الخطوات التقنية لدمج نظام Viterbi/HMM في التطبيق الحالي. سنحدد بالتفصيل التعديلات المطلوبة في الملفات المختلفة، مع تضمين أمثلة على الأكواد جاهزة للنسخ لكل خطوة.
الخطوة 1: تعريف حالات Viterbi في ملف الأنواع (types.ts)
نعرّف جميع أنواع السطور (States) التي سيستخدمها نموذج Viterbi كحالات ممكنة، بما في ذلك الأنواع الموجودة حاليًا (مثل scene headers, character, dialogue, action, إلخ) بالإضافة لأي أنواع خاصة نريد تضمينها. سنضيف أيضًا هيكل بيانات للاحتفاظ بجميع الحالات (مصوفة ALL_STATES) وتعريف هيكل نتيجة لكل خلية Viterbi إذا لزم الأمر.
تعديل ملف types.ts: إضافة نوع جديد ViterbiState ليشمل جميع حالات الـ Viterbi، بالإضافة إلى مصفوفة ALL_STATES وواجهة ViterbiCell لحفظ معلومات الحالة في خطوة Viterbi واحدة:
// في types.ts

/**
 * الأنواع المستخدمة في Viterbi (الحالات الممكنة)
 */
export type ViterbiState = 
  | 'basmala'
  | 'scene-header-1'
  | 'scene-header-2'
  | 'scene-header-3'
  | 'scene-header-top-line'
  | 'character'
  | 'dialogue'
  | 'parenthetical'
  | 'action'
  | 'transition'
  | 'blank';

/** جميع الحالات (states) كمصفوفة لاستخدامها في الحسابات */
export const ALL_STATES: ViterbiState[] = [
  'basmala',
  'scene-header-1',
  'scene-header-2',
  'scene-header-3',
  'scene-header-top-line',
  'character',
  'dialogue',
  'parenthetical',
  'action',
  'transition',
  'blank'
];

/** تمثيل خلية واحدة في جدول Viterbi لسطر محدد */
export interface ViterbiCell {
  state: ViterbiState;
  score: number;
  previousState: ViterbiState | null;
  emissionScore: number;
  transitionScore: number;
}
ملاحظة:
- الحالة 'basmala' تمثل بسملة المشهد (مثال: "بسم الله الرحمن الرحيم") إن وجدت في النص.
- حالة 'blank' لتمثيل السطر الفارغ.
- يمكن تعديل قائمة الحالات وفق ما هو مستخدم في التطبيق لديك.
الخطوة 2: إنشاء مصفوفة الانتقال TransitionMatrix (ملف جديد TransitionMatrix.ts)
الآن سننشئ مصفوفة الانتقال (Transition Matrix) التي تحدد مدى احتمالية انتقال التصنيف من نوع سطر معين إلى نوع السطر التالي. هذه المصفوفة تعبر عن معرفتنا المسبقة بتسلسل نص السيناريو. على سبيل المثال: من المنطقي جدًا أن يتبع اسم شخصية (character) سطر حوار (dialogue)، لذا ستكون احتمالية انتقال character -> dialogue عالية؛ وبالمقابل نادرًا ما يتبع اسم شخصية اسم شخصية أخرى مباشرة، لذا انتقال character -> character سيكون احتماليته منخفضة.
سنمثل مصفوفة الانتقال ككائن (object) يحتوي على مفاتيح هي الحالة الحالية وقيم هي كائن للاحتمالات نحو الحالات التالية. سنستخدم درجات (scores) تتراوح مثلاً بين 0 و 100 بدلًا من الاحتمالات الصرف، حيث الرقم الأعلى يعني انتقال أكثر احتمالًا. بهذه الطريقة نتجنب التعامل مع كسور الاحتمالات مباشرة، ونستطيع استخدام هذه الدرجات في حساب مجموع الامتياز (score) بسهولة.
إنشاء ملف TransitionMatrix.ts:
/**
 * مصفوفة الاحتمالات الانتقالية بين أنواع السطور (States) في السيناريو.
 * القيم عبارة عن درجات من 0 إلى 100 تعبر عن قوة الترجيح (100 = انتقال شائع جداً، 0 = انتقال نادر جداً أو مستحيل).
 */
export class TransitionMatrix {

  /**
   * جدول الانتقال (Transition scores) بين كل زوج من الحالات.
   * الصيغة: transition[fromState][toState] = score
   */
  private static readonly TRANSITIONS: { [from in ViterbiState]?: { [to in ViterbiState]?: number } } = {
    // *** من basmala (البسملة في بداية النص) ***
    'basmala': {
      'scene-header-1': 95,
      'scene-header-top-line': 95,
      'action': 30,
      'character': 10,
      'dialogue': 0,
      'parenthetical': 0,
      'transition': 20,
      'scene-header-2': 20,
      'scene-header-3': 20,
      'blank': 80,
      'basmala': 0
    },

    // *** من scene-header-top-line (أول سطر في رأس المشهد) ***
    'scene-header-top-line': {
      'scene-header-2': 90,      // غالباً يأتي بعده: داخلي/خارجي + زمن
      'scene-header-3': 85,      // أو قد يكون سطر المكان
      'action': 70,              // أو مباشرة وصف مشهد (أكشن)
      'character': 40,           // ممكن لكن أقل شيوعاً
      'dialogue': 5,             // نادر جداً أن يلي رأس المشهد حوار مباشر
      'parenthetical': 5,
      'transition': 10,
      'scene-header-1': 5,
      'scene-header-top-line': 5,
      'blank': 60,
      'basmala': 0
    },

    // *** من scene-header-1 (مشهد X: رقم المشهد) ***
    'scene-header-1': {
      'scene-header-2': 90,      // غالباً بعد رقم المشهد يأتي وصف الموقع/الزمن
      'scene-header-3': 85,      // أو ربما يأتي بعده المكان مباشرة
      'action': 70,              // يمكن أن يبدأ المشهد بوصف
      'character': 40,           // ظهور شخصية مباشرة بعد رقم المشهد ممكن
      'dialogue': 5,
      'parenthetical': 5,
      'transition': 10,
      'scene-header-1': 5,
      'scene-header-top-line': 5,
      'blank': 60,
      'basmala': 0
    },

    // *** من scene-header-2 (وصف المكان/الزمن: داخلي/خارجي - زمن) ***
    'scene-header-2': {
      'scene-header-3': 90,      // من الشائع ذكر المكان بعد ذكر داخلي/خارجي
      'action': 80,              // أو البدء في وصف المشهد
      'character': 50,           // يمكن ظهور شخصية بعد تحديد الزمن
      'dialogue': 5,
      'parenthetical': 5,
      'transition': 10,
      'scene-header-1': 5,
      'scene-header-2': 30,      // احتمال استمرار وصف T/L على سطرين
      'scene-header-top-line': 5,
      'blank': 50,
      'basmala': 0
    },

    // *** من scene-header-3 (المكان) ***
    'scene-header-3': {
      'action': 90,              // عادة يأتي وصف مشهد بعد المكان
      'character': 60,           // ممكن ظهور شخصية بعد المكان
      'dialogue': 10,
      'parenthetical': 10,
      'transition': 15,
      'scene-header-1': 5,
      'scene-header-2': 10,
      'scene-header-3': 40,      // احتمال استمرار اسم المكان عبر عدة أسطر
      'scene-header-top-line': 5,
      'blank': 70,
      'basmala': 0
    },

    // *** من character (اسم شخصية) ***
    'character': {
      'dialogue': 95,            // الحالة الأكثر شيوعاً: يتبع اسم الشخصية حوار
      'parenthetical': 85,       // أو ملاحظة إخراجية (parenthetical) قبل الحوار
      'action': 15,              // نادر: قد يأتي وصف حركة بعد اسم شخصية مباشرة
      'character': 8,            // نادر جداً: اسمان لشخصيتين متتاليتين دون حوار بينهما
      'transition': 5,
      'scene-header-1': 3,
      'scene-header-2': 3,
      'scene-header-3': 3,
      'scene-header-top-line': 3,
      'blank': 40,               // ممكن وجود سطر فارغ بعد اسم شخصية (مثلاً قبل الحوار)
      'basmala': 0
    },

    // *** من dialogue (حوار) ***
    'dialogue': {
      'dialogue': 80,            // حوار مستمر عبر عدة أسطر
      'character': 75,           // انتهاء الحوار ثم ظهور شخصية جديدة
      'action': 60,              // أو انتهاء الحوار ثم وصف حركة/مشهد
      'parenthetical': 50,       // ملاحظة ضمن الحوار أو بعده
      'transition': 40,
      'scene-header-1': 30,
      'scene-header-top-line': 30,
      'scene-header-2': 10,
      'scene-header-3': 10,
      'blank': 70,
      'basmala': 0
    },

    // *** من parenthetical (توجيه ضمن الحوار) ***
    'parenthetical': {
      'dialogue': 95,            // غالباً بعد التوجيه (مثل "بغضب") يعود للحوار
      'parenthetical': 30,       // توجيه آخر متتال (غير شائع)
      'action': 20,
      'character': 15,
      'transition': 5,
      'scene-header-1': 3,
      'scene-header-2': 3,
      'scene-header-3': 3,
      'scene-header-top-line': 3,
      'blank': 30,
      'basmala': 0
    },

    // *** من action (وصف حركة/مشهد) ***
    'action': {
      'action': 85,              // من الشائع استمرار الوصف لعدة أسطر
      'character': 80,           // أو ظهور شخصية بعد وصف المشهد
      'dialogue': 30,            // أحياناً يأتي حوار بدون ذكر اسم شخصية (نادر ولكنه ممكن)
      'parenthetical': 20,
      'transition': 50,
      'scene-header-1': 40,
      'scene-header-top-line': 40,
      'scene-header-2': 15,
      'scene-header-3': 15,
      'blank': 75,
      'basmala': 0
    },

    // *** من transition (جملة انتقالية بين المشاهد) ***
    'transition': {
      'scene-header-1': 95,      // عادةً بعد Transition يأتي رأس مشهد جديد
      'scene-header-top-line': 95,
      'action': 30,
      'character': 20,
      'dialogue': 5,
      'parenthetical': 5,
      'transition': 10,
      'scene-header-2': 20,
      'scene-header-3': 20,
      'blank': 80,
      'basmala': 0
    },

    // *** من blank (سطر فارغ) ***
    'blank': {
      'action': 70,              // السطر الفارغ يتبعه غالباً وصف أو حركة
      'character': 70,           // أو قد يتبعه اسم شخصية جديدة
      'scene-header-1': 60,      // ممكن بدء مشهد جديد بعد فراغ
      'scene-header-top-line': 60,
      'dialogue': 50,            // استمرار الحوار بعد فراغ (مثلاً حوار فقرة جديدة)
      'transition': 40,
      'parenthetical': 30,
      'scene-header-2': 30,
      'scene-header-3': 30,
      'blank': 60,               // أسطر فارغة متتالية
      'basmala': 20
    }
  };

  /**
   * الحصول على درجة الانتقال من حالة إلى أخرى.
   * إذا لم تكن الحالة معرّفة في الجدول، نرجع قيمة افتراضية (مثلاً 30).
   */
  static getTransitionScore(fromState: ViterbiState, toState: ViterbiState): number {
    const fromTransitions = this.TRANSITIONS[fromState];
    if (!fromTransitions) return 30; // قيمة افتراضية في حال غياب التعريف
    return fromTransitions[toState] ?? 30;
  }

  /**
   * (دالة اختيارية) الحصول على قائمة مرتبة بأكثر الانتقالات احتمالاً من حالة معينة.
   * يمكن استخدامها لأغراض التشخيص أو التحسين.
   */
  static getMostLikelyNextStates(fromState: ViterbiState): { state: ViterbiState; score: number }[] {
    const fromTransitions = this.TRANSITIONS[fromState];
    if (!fromTransitions) return [];
    return Object.entries(fromTransitions)
      .sort((a, b) => b[1] - a[1])
      .map(([state, score]) => ({ state: state as ViterbiState, score }));
  }
}
ملاحظات حول مصفوفة الانتقال أعلاه:
- القيم المحددة تقريبية وقابلة للتعديل بناءً على تجاربك في النصوص.
- 100 تعني انتقال شبه مؤكد (شائع جدًا)، و0 تعني انتقال مستحيل أو نادر جدًا.
- استخدمنا قيمًا بين 0 و 100 لتبسيط الحسابات دون الحاجة لتحويلها إلى لوغاريتمات (نظرًا لأننا لا نجري ضرب احتمالات بل نجمع درجات).
- بعض الانتقالات "غير منطقية" تم وضعها بقيمة منخفضة جدًا (مثلاً basmala -> basmala = 0، لأن البسملة عادة لا تتكرر).
- يمكنك إضافة أو تعديل الانتقالات بناءً على بنية سيناريوهاتك (مثلاً إذا كان هناك هيكل خاص).
الخطوة 3: إنشاء وحدة حساب احتمالات الانبعاث EmissionCalculator (ملف جديد EmissionCalculator.ts)
الـ Emission Scores تعبر عن درجة احتمال أن يكون السطر من نوع معين بناءً على محتواه فقط (دون النظر للسياق). لدينا بالفعل في النظام الحالي دوال أو منطق لحساب درجة انطباق كل نوع على سطر (مثل scoreAsCharacter, scoreAsDialogue ... إلخ). سنقوم بدمج هذه المنطق في كلاس موحد يسمى EmissionCalculator الذي يحسب درجات الانبعاث لكل نوع لسطر معين.
سوف تستخدم هذه الوحدة دوال التصنيف الحالية ولكن بدون اتخاذ قرار نهائي، فقط ترجيح لكل نوع. سيتم استدعاؤها أثناء تشغيل Viterbi للحصول على scores لكل (سطر, نوع).
إنشاء ملف EmissionCalculator.ts:
/**
 * مسؤول عن حساب احتمالية/درجة أن يكون كل سطر من كل نوع (Emission Scores).
 */
export class EmissionCalculator {

  /**
   * حساب درجات الانبعاث لكل الحالات لسطر معين.
   * @param rawLine النص الأصلي للسطر
   * @param index رقم السطر ضمن النص
   * @param allLines مصفوفة بكل السطور (لاستخدام سياق قريب إذا لزم)
   * @param documentMemory كائن الذاكرة (لحفظ أسماء الشخصيات وما إلى ذلك)
   * @returns كائن يحتوي على درجة لكل حالة من حالات Viterbi
   */
  static calculateEmissions(
    rawLine: string,
    index: number,
    allLines: string[],
    documentMemory?: DocumentMemory
  ): { [state in ViterbiState]: number } {

    const emissions: { [state in ViterbiState]: number } = {};

    // إذا كان السطر فارغًا، فإن الحالة الوحيدة المنطقية هي 'blank'
    if (ScreenplayClassifier.isBlank(rawLine)) {
      for (const state of ALL_STATES) {
        emissions[state] = state === 'blank' ? 100 : 0;
      }
      return emissions;
    }

    // تحضير نص السطر للتحليل
    const normalized = ScreenplayClassifier.normalizeForAnalysis(rawLine);
    const trimmed = rawLine.trim();

    // === تصنيفات سريعة بثقة عالية (إذا انطبق أحدها نحدد نوع السطر مباشرة) ===

    // 1. البسملة
    if (ScreenplayClassifier.isBasmala(trimmed)) {
      this.setHighConfidence(emissions, 'basmala');
      return emissions;
    }

    // 2. بداية رأس المشهد (مثال: "مشهد 5" أو "المشهد الخامس")
    if (ScreenplayClassifier.isSceneHeaderStart(trimmed)) {
      this.setHighConfidence(emissions, 'scene-header-top-line');
      return emissions;
    }

    // 3. مشهد-1 (مشهد + رقم فقط)
    if (ScreenplayClassifier.isSceneHeader1(trimmed)) {
      this.setHighConfidence(emissions, 'scene-header-1');
      return emissions;
    }

    // 4. جملة انتقال (مثل "إظلام." أو "إلى ذلك:")
    if (ScreenplayClassifier.isTransition(trimmed)) {
      this.setHighConfidence(emissions, 'transition');
      return emissions;
    }

    // 5. بين قوسين (ملاحظة إخراجية)
    if (ScreenplayClassifier.isParenShaped(trimmed)) {
      this.setHighConfidence(emissions, 'parenthetical');
      return emissions;
    }

    // === حساب درجات الانبعاث بناءً على خصائص النص (حالات متعددة) ===

    // نبني سياق مبسط للسطر (بدون استخدام previousTypes لأن Viterbi سيتكفل بالسياق عبر transition)
    const ctx = ScreenplayClassifier.buildContextForEmission(rawLine, index, allLines);

    // حساب درجة كل نوع باستخدام دوال مساعدة (تفاصيلها أدناه)
    emissions['character']      = this.calculateCharacterEmission(rawLine, normalized, ctx, documentMemory);
    emissions['dialogue']       = this.calculateDialogueEmission(rawLine, normalized, ctx);
    emissions['action']         = this.calculateActionEmission(rawLine, normalized, ctx, documentMemory);
    emissions['parenthetical']  = this.calculateParentheticalEmission(rawLine, normalized, ctx);
    emissions['scene-header-2'] = this.calculateSceneHeader2Emission(rawLine, normalized);
    emissions['scene-header-3'] = this.calculateSceneHeader3Emission(rawLine, normalized);

    // الأنواع الأخرى (التي لم تتحدد ضمن ما سبق) نعطيها قيم افتراضية منخفضة كي لا تُختار غالبًا إلا إذا غيرها 0
    emissions['basmala'] = emissions['basmala'] ?? 0;
    emissions['transition'] = emissions['transition'] ?? 5;
    emissions['scene-header-1'] = emissions['scene-header-1'] ?? 5;
    emissions['scene-header-top-line'] = emissions['scene-header-top-line'] ?? 5;
    emissions['blank'] = 0;  // لو لم يكن السطر فارغ فهو 0 لغير blank

    return emissions;
  }

  /**
   * دالة مساعدة لتعيين ثقة عالية لنوع واحد وجعل بقية الانواع 0 (تستخدم في الحالات الواضحة).
   */
  private static setHighConfidence(emissions: { [state: string]: number }, state: ViterbiState): void {
    for (const s of ALL_STATES) {
      emissions[s] = s === state ? 100 : 0;
    }
  }

  /**
   * حساب درجة احتمال أن يكون السطر اسم شخصية (Character)
   * (منطقي مأخوذ من دالة scoreAsCharacter مع تبسيط)
   */
  private static calculateCharacterEmission(
    rawLine: string,
    normalized: string,
    ctx: EmissionContext,
    documentMemory?: DocumentMemory
  ): number {
    let score = 30; // نقطة أساس

    const trimmed = rawLine.trim();
    const wordCount = ScreenplayClassifier.wordCount(normalized);

    // 1. إذا انتهى السطر بنقطتين ":" → مؤشر قوي أنه اسم شخصية
    if (trimmed.endsWith(':') || trimmed.endsWith('：')) {
      score += 50;
    }

    // 2. طول السطر صغير (الاسم غالباً يكون كلمة أو كلمتين)
    if (wordCount <= 3) score += 20;
    else if (wordCount <= 5) score += 10;
    else if (wordCount > 7) score -= 30; // لو أكثر من 7 كلمات يقل احتمال أنه اسم شخصية

    // 3. اسم موجود مسبقاً في ذاكرة المستند (شخصية معروفة)
    if (documentMemory) {
      const name = trimmed.replace(/[:：\s]+$/, '');  // إزالة النقطتين والمسافات من النهاية
      const known = documentMemory.isKnownCharacter(name);
      if (known?.confidence === 'high') score += 40;
      else if (known?.confidence === 'medium') score += 25;
    }

    // 4. يبدأ بفعل (مثال "يخرج", "يدخل") → هذا مؤشر على أنه ربما أكشن وليس اسم شخصية
    if (ScreenplayClassifier.isActionVerbStart(normalized)) {
      score -= 35;
    }

    // 5. لا يحتوي علامات ترقيم نهائية (مثل . ! ?) → غالباً الأسماء كذلك
    if (!ScreenplayClassifier.hasSentencePunctuation(normalized)) {
      score += 10;
    }

    // تأكد أن النتيجة بين 0 و 100
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
    let score = 25; // نقطة أساس

    const wordCount = ScreenplayClassifier.wordCount(normalized);

    // 1. طول مناسب للحوار (جملة أو أكثر ولكن ليس كلمة واحدة فقط)
    if (wordCount >= 2 && wordCount <= 50) score += 20;

    // 2. يحتوي علامات ترقيم جملية (مثل . ؟ ! ...) كدليل على وجود جملة
    if (ScreenplayClassifier.hasSentencePunctuation(normalized)) {
      score += 15;
    }

    // 3. يحتوي على ضمائر المتكلم أو المخاطب (أنا، أنت، نحن، هو، هي...) مما يوحي بأنه كلام
    if (/أنا|إنت|أنت|إحنا|نحن|هو|هي/.test(normalized)) {
      score += 15;
    }

    // 4. وجود علامة استفهام يعني سؤال في الحوار
    if (/\?|؟/.test(normalized)) {
      score += 10;
    }

    // 5. يبدأ بفعل حركي (مثل "يخرج") وهذا مؤشر سلبي للحوار (لأنه يبدو كأكشن)
    if (ScreenplayClassifier.isActionVerbStart(normalized)) {
      score -= 20;
    }

    // 6. لا ينتهي بنقطتين (الحوار لا ينتهي بنقطتين غالباً، إذا انتهى يعني ربما اسم شخصية)
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
    let score = 35; // نقطة أساس (نفترض الوضع الافتراضي أكشن إلى أن يثبت العكس)

    const wordCount = ScreenplayClassifier.wordCount(normalized);

    // 1. يبدأ بفعل حركي (مثل "يبتسم", "تركض") → مؤشر قوي أنه جملة وصف حركة
    if (ScreenplayClassifier.isActionVerbStart(normalized)) {
      score += 40;
    }

    // 2. يطابق أنماط جمل الوصف (مثلاً يبدأ بصفة مشهدية أو فعل أمر إخراجي)
    if (ScreenplayClassifier.matchesActionStartPattern(normalized)) {
      score += 30;
    }

    // 3. طول السطر أطول من 5 كلمات (الوصف عادة جملة طويلة نسبياً)
    if (wordCount > 5) score += 15;

    // 4. يحتوي كلمات وصفية شائعة (مثل "ببطء", "بسرعة", "فجأة", "هدوء", "صمت")
    if (/بطيء|سريع|فجأة|ببطء|بسرعة|هدوء|صمت/.test(normalized)) {
      score += 10;
    }

    // 5. ينتهي بنقطتين → هذا مؤشر سلبي (لأنه يوحي بأنه اسم شخصية وليس وصف)
    if (trimmed.endsWith(':') || trimmed.endsWith('：')) {
      score -= 30;
    }

    // 6. إذا كانت الكلمة معروفة كشخصية في الذاكرة (لكن جاءت هنا بدون نقطتين) نقلل لأننا ربما أمام اسم شخصية مكتوب خطأ
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
    let score = 10; // نقطة أساس

    // 1. يبدأ بقوس "(" → مؤشر قوي على أنه توجيه إخراجي
    if (trimmed.startsWith('(')) {
      score += 40;
    }

    // 2. يحتوي على كلمات إخراجية شائعة (مثلاً "همساً", "بغضب", "بحزن"...)
    const parentheticalWords = ['همساً', 'بصوت', 'مبتسماً', 'بحزن', 'بغضب', 'ساخراً'];
    if (parentheticalWords.some(w => normalized.includes(w))) {
      score += 30;
    }

    // 3. السطر قصير (غالباً الملاحظات تكون قصيرة من كلمة إلى ثلاث)
    if (ScreenplayClassifier.wordCount(normalized) <= 4) {
      score += 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * حساب درجة احتمال أن يكون السطر هو الجزء الثاني من رأس المشهد (Scene Header 2: داخلي/خارجي - زمن)
   */
  private static calculateSceneHeader2Emission(
    rawLine: string,
    normalized: string
  ): number {
    let score = 5;

    // 1. يحتوي على كلمة دالة على المكان (داخلي/خارجي أو مختصرهما)
    if (/داخلي|خارجي|د\\.|خ\\./.test(normalized)) {
      score += 40;
    }

    // 2. يحتوي على كلمة زمن (ليل، نهار، صباح، مساء، فجر)
    if (/ليل|نهار|صباح|مساء|فجر/.test(normalized)) {
      score += 35;
    }

    // 3. يحتوي على شرطة "-" بين عناصر (مثلاً "داخلي - منزل - ليل")
    if (/[-–—]/.test(normalized)) {
      score += 10;
    }

    // 4. قصير (عادة رأس المشهد 2 يكون موجزاً)
    if (ScreenplayClassifier.wordCount(normalized) <= 5) {
      score += 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * حساب درجة احتمال أن يكون السطر هو الجزء الثالث من رأس المشهد (Scene Header 3: المكان)
   */
  private static calculateSceneHeader3Emission(
    rawLine: string,
    normalized: string
  ): number {
    let score = 5;

    // 1. إذا كان يطابق مكان معروف (يمكن أن يكون لديك قائمة بأسماء مواقع معروفة)
    if (ScreenplayClassifier.KNOWN_PLACES_RE.test(normalized)) {
      score += 50;
    }

    // 2. قصير (اسم مكان عادة كلمة أو كلمتين)
    const wordCount = ScreenplayClassifier.wordCount(normalized);
    if (wordCount <= 4) score += 15;

    // 3. لا يحتوي علامات ترقيم نهائية (غالباً اسم المكان لا يحتوي . أو ! أو ؟)
    if (!ScreenplayClassifier.hasSentencePunctuation(normalized)) {
      score += 10;
    }

    // 4. لا ينتهي بنقطتين
    if (!trimmed.endsWith(':') && !trimmed.endsWith('：')) {
      score += 5;
    }

    return Math.max(0, Math.min(100, score));
  }
}

/**
 * سياق مبسط يمكن استخدامه عند حساب الانبعاثات (إن احتجنا لبعض المعلومات الإضافية مستقبلاً).
 * يتضمن طول السطر، عدد الكلمات، والسطر السابق واللاحق (إن وجد).
 */
interface EmissionContext {
  lineLength: number;
  wordCount: number;
  nextLine: string | null;
  prevLine: string | null;
}
شرح موجز لما قمنا به في EmissionCalculator:
•	في بداية الدالة calculateEmissions، قمنا بالتعرف على بعض الحالات الخاصة بسرعة (مثل السطر الفارغ، البسملة، رأس المشهد، الانتقال، الملاحظة الإخراجية). هذه الحالات لو انطبقت، نعين النوع مباشرة بثقة عالية (درجة 100 لذلك النوع و0 للبقية) لتجنب أي تضارب.
•	بعدها، نستخدم منطق مقارب لما كان في المصنف الجشع السابق ولكن لإنتاج درجات لكل نوع بدلاً من اختيار نوع واحد. على سبيل المثال:
•	calculateCharacterEmission: يعطي درجة أعلى إذا انتهى السطر بنقطتين، أو كان قصيرًا، أو اسم معروف من الشخصيات، وينقص الدرجة إذا بدأ بفعل أو كان طويلاً.
•	calculateDialogueEmission: يعطي درجة أعلى إذا كان السطر متوسط الطول ويحتوي علامات ترقيم أو ضمائر، وينقصها إذا بدأ بفعل حركة.
•	calculateActionEmission: يرفع الدرجة إن بدأ السطر بفعل أو تطابق أنماط الوصف وكان طويلاً نسبيًا، ويخفضها إن انتهى بنقطتين أو كان اسم شخصية معروف.
•	calculateParentheticalEmission: يتحقق إن كان السطر داخل أقواس أو يحتوي كلمات دلالية.
•	calculateSceneHeader2Emission و calculateSceneHeader3Emission: تتحقق من وجود كلمات تدل على الموقع/الزمن أو الأماكن المعروفة.
•	الدوال setHighConfidence تستخدم لتعيين حالة مؤكدة وإقصاء غيرها (عندما نكتشف سطرًا ينتمي بوضوح لنوع معين).
•	تأكدنا أن نطاق كل درجة بين 0 و 100 وعدم خروجه عنه.
الخطوة 4: إنشاء وحدة فك الشفرة ViterbiDecoder (ملف جديد ViterbiDecoder.ts)
هذه هي الخطوة الرئيسية التي تنفذ خوارزمية فيتربي للعثور على أفضل تسلسل للحالات عبر النص بالكامل. سننشئ كلاس ViterbiDecoder يحتوي على دالة decode تأخذ السطور الخام كمدخلات (مع ذاكرة المستند الاختيارية ووزن للتحكم في تأثير الانبعاث مقابل الانتقال)، وتعيد مصفوفة بنتائج Viterbi لكل سطر.
إنشاء ملف ViterbiDecoder.ts:
/**
 * خوارزمية Viterbi Decoder للبحث عن التسلسل الأمثل لأنواع السطور.
 */
export class ViterbiDecoder {

  /**
   * تنفيذ خوارزمية Viterbi على قائمة السطور المعطاة.
   * @param lines مصفوفة السطور النصية الكاملة (النص بأكمله مقسم أسطر).
   * @param documentMemory (اختياري) ذاكرة المستند لمعرفة الشخصيات المعروفة.
   * @param emissionWeight وزن تأثير درجة الانبعاث (بين 0 و 1).
   * @param transitionWeight وزن تأثير درجة الانتقال (بين 0 و 1).
   * @returns مصفوفة نتائج تصنيف لكل سطر، وفق أفضل تسلسل تم إيجاده.
   */
  static decode(
    lines: string[],
    documentMemory?: DocumentMemory,
    emissionWeight: number = 0.6,
    transitionWeight: number = 0.4
  ): ViterbiResult[] {

    const n = lines.length;
    if (n === 0) return [];

    // === المرحلة 1: حساب جميع درجات الانبعاث لجميع السطور وجميع الحالات ===
    const allEmissions: { [state in ViterbiState]: number }[] = [];
    for (let i = 0; i < n; i++) {
      const emissions = EmissionCalculator.calculateEmissions(
        lines[i],
        i,
        lines,
        documentMemory
      );
      allEmissions.push(emissions);
    }

    // === المرحلة 2: تهيئة جدول Viterbi ===
    // سنستخدم مصفوفة viterbi بطول عدد السطور، كل عنصر فيها خريطة (Map) من الحالة إلى أفضل نتيجة وصولاً لتلك الحالة.
    const viterbi: Array<Map<ViterbiState, { score: number; prev: ViterbiState | null }>> = [];

    // السطر الأول: لا يوجد حالة سابقة، فقط نأخذ درجة الانبعاث للحالة كدرجة ابتدائية.
    const firstRow = new Map<ViterbiState, { score: number; prev: ViterbiState | null }>();
    for (const state of ALL_STATES) {
      const emissionScore = allEmissions[0][state] ?? 0;
      // نضرب درجة الانبعاث في وزنها (emissionWeight). الانتقال لا يؤخذ بالاعتبار هنا لعدم وجود سابق.
      firstRow.set(state, { 
        score: emissionScore * emissionWeight, 
        prev: null 
      });
    }
    viterbi[0] = firstRow;

    // === المرحلة 3: ملء الجدول لبقية السطور ===
    for (let i = 1; i < n; i++) {
      const currentRow = new Map<ViterbiState, { score: number; prev: ViterbiState | null }>();
      const prevRow = viterbi[i - 1];

      for (const currentState of ALL_STATES) {
        const emissionScore = allEmissions[i][currentState] ?? 0;

        let bestScore = -Infinity;
        let bestPrev: ViterbiState | null = null;

        // جرّب كل حالة سابقة محتملة لمعرفة أيها يعطي أفضل مسار حتى الحالة الحالية
        for (const prevState of ALL_STATES) {
          const prevEntry = prevRow.get(prevState);
          if (!prevEntry) continue;

          const transitionScore = TransitionMatrix.getTransitionScore(prevState, currentState);

          // الحساب: مجموع (أفضل Score للحالة السابقة + وزن الانبعاث * درجة انبعاث الحالية + وزن الانتقال * درجة الانتقال من السابقة لهذه)
          const totalScore = prevEntry.score 
                            + (emissionScore * emissionWeight) 
                            + (transitionScore * transitionWeight);

          if (totalScore > bestScore) {
            bestScore = totalScore;
            bestPrev = prevState;
          }
        }

        currentRow.set(currentState, { score: bestScore, prev: bestPrev });
      }

      viterbi[i] = currentRow;
    }

    // === المرحلة 4: تحديد أفضل تسلسل (Backtracking التتبع الخلفي) ===
    const bestPath: ViterbiState[] = new Array(n);

    // نحدد أعلى درجة نهائية في آخر سطر لنبدأ منها التتبع للخلف
    let bestFinalScore = -Infinity;
    let bestFinalState: ViterbiState = 'action';  // سنفترض action افتراض مبدئي
    const lastRow = viterbi[n - 1];
    for (const [state, entry] of lastRow.entries()) {
      if (entry.score > bestFinalScore) {
        bestFinalScore = entry.score;
        bestFinalState = state;
      }
    }
    bestPath[n - 1] = bestFinalState;

    // تتبع المسار الأفضل للخلف من الحالة النهائية المختارة
    for (let i = n - 1; i > 0; i--) {
      const currentState = bestPath[i];
      const entry = viterbi[i].get(currentState);
      bestPath[i - 1] = entry?.prev ?? 'action';  // إذا حصل ظرف غير متوقع نفترض 'action'
    }

    // === المرحلة 5: بناء مصفوفة النتائج التفصيلية ===
    const results: ViterbiResult[] = [];
    for (let i = 0; i < n; i++) {
      const state = bestPath[i];
      const emissions = allEmissions[i];
      const entry = viterbi[i].get(state);

      // حساب مستوى الثقة بناءً على الفرق بين أعلى احتمالين (gap) أو القيمة المطلقة لأعلى احتمال
      const sortedEmissions = Object.entries(emissions).sort((a, b) => b[1] - a[1]);
      const topEmission = sortedEmissions[0];
      const secondEmission = sortedEmissions[1];
      const emissionGap = topEmission && secondEmission 
        ? topEmission[1] - secondEmission[1] 
        : 100;  // إذا ما في إلا نوع واحد مرشح (حالة نادرة)، نعتبر الثقة عالية جداً.

      let confidence: 'high' | 'medium' | 'low';
      if (emissionGap > 30 || emissions[state] > 70) {
        confidence = 'high';
      } else if (emissionGap > 15 || emissions[state] > 50) {
        confidence = 'medium';
      } else {
        confidence = 'low';
      }

      // معرفة خيار التصنيف الجشع (لو كنا اخترنا فقط أعلى emission بدون Viterbi)
      const greedyChoice = topEmission ? topEmission[0] : 'action';
      const viterbiOverride = greedyChoice !== state;

      results.push({
        lineIndex: i,
        text: lines[i],
        type: state,
        confidence,
        emissionScores: emissions,
        viterbiScore: entry?.score ?? 0,
        greedyChoice: greedyChoice as ViterbiState,
        viterbiOverride,
        overrideReason: viterbiOverride 
          ? this.explainOverride(greedyChoice, state, i, bestPath)
          : undefined
      });
    }

    return results;
  }

  /**
   * دالة مساعدة لشرح سبب تغيير Viterbi للقرار المتوقع (لماذا المسار الكلي فضّل نوع آخر عن الخيار الجشع).
   * تحاول تغطية بعض الحالات الشائعة لتسهيل الفهم.
   */
  private static explainOverride(
    greedyChoice: string,
    viterbiChoice: string,
    index: number,
    path: ViterbiState[]
  ): string {
    const prevState = index > 0 ? path[index - 1] : null;
    const nextState = index < path.length - 1 ? path[index + 1] : null;

    // حالة: اختار Viterbi "character" بدل "action"
    if (greedyChoice === 'action' && viterbiChoice === 'character') {
      if (nextState === 'dialogue') {
        return 'السطر التالي هو حوار → الأرجح أن السطر الحالي اسم شخصية.';
      }
      if (prevState?.startsWith('scene-header')) {
        return 'يأتي بعد رأس مشهد مباشرة → غالباً يكون اسم شخصية وليس وصف.';
      }
    }

    // حالة: اختار Viterbi "dialogue" بدل "action"
    if (greedyChoice === 'action' && viterbiChoice === 'dialogue') {
      if (prevState === 'character' || prevState === 'parenthetical') {
        return 'يأتي بعد شخصية أو ملاحظة → الأرجح أنه حوار تكملةً لذلك.';
      }
      if (prevState === 'dialogue') {
        return 'استمرار للحوار من السطر السابق.';
      }
    }

    // حالة: اختار Viterbi "scene-header-3" بدل "character"
    if (greedyChoice === 'character' && viterbiChoice === 'scene-header-3') {
      if (prevState === 'scene-header-2' || prevState === 'scene-header-1') {
        return 'يأتي بعد جزء من رأس المشهد → على الأرجح هذا السطر مكمّل للمكان.';
      }
    }

    // افتراضي: إذا لم تنطبق الحالات أعلاه نشرح بشكل عام
    return `تم تعديل النوع لتحقيق تسلسل أفضل: ${prevState} → ${viterbiChoice} → ${nextState}`;
  }
}

/**
 * بنية البيانات لنتيجة Viterbi لسطر واحد
 */
export interface ViterbiResult {
  lineIndex: number;
  text: string;
  type: ViterbiState;
  confidence: 'high' | 'medium' | 'low';
  emissionScores: { [state in ViterbiState]: number };
  viterbiScore: number;
  greedyChoice: ViterbiState;
  viterbiOverride: boolean;
  overrideReason?: string;
}
ما تقوم به دالة ViterbiDecoder.decode:
1.	حساب الانبعاثات: تمر على كل سطر وتحسب احتمال كل نوع باستخدام EmissionCalculator الذي أنشأناه (مصفوفة allEmissions).
2.	تهيئة الصف الأول من الـ Viterbi: يعبر عن احتمالات كل حالة للسطر الأول فقط بناءً على الانبعاث (لأنه لا يوجد سطر سابق، فلا تؤخذ الانتقالات في الاعتبار هنا).
3.	ملء الجدول ديناميكياً: لكل سطر من 2 إلى آخر سطر:
4.	نأخذ كل احتمال حالة ممكنة في السطر الحالي (currentState)، وننظر لكل حالة ممكنة في السطر السابق (prevState) ونأخذ أفضل مسار ممكن انتهى بذلك prevState ثم ينتقل إلى currentState.
5.	نحسب totalScore = أفضل درجة للحالة السابقة + (درجة الانبعاث الحالية * وزنها) + (درجة الانتقال من السابقة للحالية * وزنها).
6.	نخزن أفضل نتيجة في viterbi[i][currentState] من حيث أعلى totalScore مع مرجع لـ prevState الذي أدى إلى هذه النتيجة.
7.	التتبع الخلفي (Backtracking): بعد ملء الجدول، ننظر إلى صف آخر سطر (lastRow) ونختار الحالة التي لديها أعلى درجة نهائية كحالة أخيرة في المسار. ثم نتتبع مؤشر prev المخزن في كل مرحلة بشكل عكسي لنستخرج المسار الكامل bestPath.
8.	بناء النتائج: نجهز المخرجات بحيث تتضمن لكل سطر:
9.	النوع النهائي المختار type من bestPath.
10.	الثقة بالتقدير (confidence) محسوبة استنادًا إلى الفرق بين أعلى احتمالين كما سبق شرحه.
11.	الأنواع المرشحة أعلى احتمال (greedyChoice يمثل اختيار التصنيف الجشع قبل تطبيق Viterbi).
12.	علامة توضح هل غيّر Viterbi الاختيار (viterbiOverride), وإذا نعم ما هو السبب (overrideReason) بواسطة الدالة المساعدة explainOverride.
13.	درجات الانبعاث التفصيلية لكل الأنواع (emissionScores) للمراجعة أو التشخيص.
14.	تتضمن explainOverride قواعد نصيّة بسيطة لشرح بعض أشهر الأسباب لتغيير التصنيف بسبب السياق:
15.	إذا اختار Viterbi تصنيف السطر كشخصية بينما التصنيف الجشع قال أكشن، قد يكون السبب أن السطر التالي كان حواراً أو أن هذا السطر أتى مباشرة بعد رأس مشهد، وكلاهما يزيد احتمال كونه اسم شخصية.
16.	إذا اختار Viterbi تصنيف السطر كحوار بدلاً من أكشن، غالبًا لأنه جاء بعد اسم شخصية أو ملاحظة (فمنطقي أن يكون الحوار تابعًا)، أو كان الحوار مستمرًا من السطر السابق.
17.	إذا اختار Viterbi تصنيف السطر كمكان (scene-header-3) بدل شخصية، فهذا لأنه جاء بعد سطر تحديد زمن أو رقم مشهد مما يشير أنه تكملة لرأس المشهد وليس شخصية.
الخطوة 5: دمج طريقة Viterbi في مصنف السيناريو (تعديل ScreenplayClassifier.ts)
بعد إنشاء الوحدات أعلاه، سنضيف طريقة جديدة في ScreenplayClassifier لاستخدام Viterbi. هذه الطريقة ستشبه إلى حد ما classifyBatch (التي تقوم بالتصنيف التقليدي لكل سطر)، لكن بدلاً من اتخاذ قرار لكل سطر بشكل مباشر، ستستخدم ViterbiDecoder.decode للحصول على أفضل تسلسل ثم تعود بالنتائج.
كما سنضيف دالة مقارنة اختيارية للمساعدة على التشخيص بمقارنة نتائج التصنيف الجشع مقابل تصنيف Viterbi، لمعرفة مدى الاختلافات بينهما (قد تفيد أثناء التطوير أو تحسين النموذج).
تعديلات في ملف ScreenplayClassifier.ts:
export class ScreenplayClassifier {
  // ... الكود الحالي للمصنف ...

  /**
   * تصنيف مجموعة من السطور باستخدام خوارزمية Viterbi للحصول على التسلسل الأمثل.
   * @param lines مصفوفة السطور النصية
   * @param options خيارات تخصيص (أوزان الانبعاث/الانتقال وتحديث الذاكرة)
   * @returns مصفوفة نتائج التصنيف لكل سطر (BatchClassificationResult لكل سطر)
   */
  classifyWithViterbi(
    lines: string[],
    options: {
      emissionWeight?: number;
      transitionWeight?: number;
      updateMemory?: boolean;
    } = {}
  ): BatchClassificationResult[] {

    const {
      emissionWeight = 0.6,
      transitionWeight = 0.4,
      updateMemory = true
    } = options;

    // قبل البدء، نقوم بعملية "Pre-process" لجمع أسماء الشخصيات من النص إذا سنستخدم الذاكرة
    // مثلا: أي سطر من نوع 'character' بثقة عالية نضيف اسمه إلى documentMemory
    if (updateMemory) {
      this.preProcessForCharacters(lines);
    }

    // تشغيل Viterbi للحصول على أفضل تسلسل أنواع
    const viterbiResults = ViterbiDecoder.decode(
      lines,
      this.documentMemory,
      emissionWeight,
      transitionWeight
    );

    // تحويل ViterbiResult إلى BatchClassificationResult (البنية المستخدمة حاليًا في التطبيق)
    const results: BatchClassificationResult[] = [];
    for (const vr of viterbiResults) {
      // تحديث ذاكرة الشخصيات إذا لزم الأمر (نضيف أي شخصية جديدة)
      if (updateMemory && vr.type === 'character') {
        const name = vr.text.replace(/[:：\s]+$/, '').trim();
        const confidence = vr.text.trim().endsWith(':') ? 'high' : 'medium';
        this.documentMemory.addCharacter(name, confidence);
      }

      // حساب درجة الشك (doubtScore) بناءً على تقارب احتمالات التصنيف
      const sortedEmissions = Object.entries(vr.emissionScores)
        .sort((a, b) => b[1] - a[1]);
      const gap = sortedEmissions[0] && sortedEmissions[1]
        ? sortedEmissions[0][1] - sortedEmissions[1][1]
        : 100;
      const doubtScore = gap < 15 ? 80 
                        : gap < 25 ? 50 
                        : gap < 40 ? 30 
                        : 10;
      const needsReview = doubtScore >= 60 || vr.viterbiOverride;

      results.push({
        text: vr.text,
        type: vr.type === 'blank' ? 'action' : vr.type,  // نعامل 'blank' كـ 'action' في المخرج النهائي
        confidence: vr.confidence,
        doubtScore,
        needsReview,
        top2Candidates: sortedEmissions.length >= 2 ? [
          {
            type: sortedEmissions[0][0],
            score: sortedEmissions[0][1],
            confidence: 'medium',  // تقدير ثقة مبدئي
            reasons: []
          },
          {
            type: sortedEmissions[1][0],
            score: sortedEmissions[1][1],
            confidence: 'low',
            reasons: []
          }
        ] : null,
        viterbiOverride: vr.viterbiOverride ? {
          greedyChoice: vr.greedyChoice,
          viterbiChoice: vr.type,
          reason: vr.overrideReason || ''
        } : undefined,
        fallbackApplied: undefined  // للحفاظ على هيكل BatchClassificationResult, لا نستخدم fallback هنا
      });
    }

    return results;
  }

  /**
   * دالة اختيارية للمقارنة بين تصنيف Greedy وتصنيف Viterbi لكل سطر.
   * تعيد قائمة تبين لكل سطر ما كان تصنيفه الجشع وما أصبح تصنيفه وفق Viterbi وأسباب الاختلاف.
   * تستخدم لأغراض التشخيص والتجربة.
   */
  compareGreedyVsViterbi(lines: string[]): {
    lineIndex: number;
    text: string;
    greedyType: string;
    viterbiType: string;
    agreement: boolean;
    viterbiReason?: string;
  }[] {

    // 1. تصنيف Greedy المعتاد
    const greedyResults = this.classifyBatch(lines);

    // 2. تصنيف باستخدام Viterbi (دون تحديث الذاكرة أثناء المقارنة حتى لا تتأثر نتائج greedy)
    const viterbiResults = this.classifyWithViterbi(lines, { updateMemory: false });

    // 3. تجميع النتائج المقارنة
    const comparisons: {
      lineIndex: number;
      text: string;
      greedyType: string;
      viterbiType: string;
      agreement: boolean;
      viterbiReason?: string;
    }[] = [];

    for (let i = 0; i < lines.length; i++) {
      comparisons.push({
        lineIndex: i,
        text: lines[i],
        greedyType: greedyResults[i].type,
        viterbiType: viterbiResults[i].type,
        agreement: greedyResults[i].type === viterbiResults[i].type,
        viterbiReason: viterbiResults[i].viterbiOverride?.reason
      });
    }

    return comparisons;
  }
}
في الكود أعلاه:
•	classifyWithViterbi يستخدم خيارات emissionWeight و transitionWeight (مع قيم افتراضية 0.6 و 0.4 على التوالي) لإعطاء مرونة في ضبط تأثير كل من نموذج الانبعاث ونموذج الانتقال على القرار النهائي. كما يقبل خيار updateMemory لتحديد ما إذا كان يجب تحديث ذاكرة الشخصيات أثناء التصنيف (عادةً نعم في الاستخدام الفعلي).
•	قمنا باستدعاء preProcessForCharacters (إن وجدت لديك) لاستخراج أسماء الشخصيات الواضحة قبل تطبيق Viterbi، حتى يتسنى لمصحح الانبعاث إعطاء وزن أعلى للشخصيات المعروفة في النص.
•	بعد الحصول على نتائج Viterbi، تم تحويل كل نتيجة إلى BatchClassificationResult، وهو النوع المستخدم حاليًا في التطبيق لتمثيل نتيجة التصنيف لكل سطر:
•	إذا كان نوع Viterbi هو 'blank' جعلناه 'action' في المخرج (لأن النظام النهائي ربما لا يتوقع نوع "blank" كنوع سطر، ويستعمل blank فقط داخليًا).
•	تعبئة doubtScore و needsReview اعتمادًا على قرب أعلى احتمالية من الثانية أو إذا كان Viterbi غيّر التصنيف (override).
•	ملء top2Candidates بأعلى احتمالين للتصنيف (للشفافية أو لواجهات الاستخدام).
•	ملء تفاصيل viterbiOverride إذا حدث تغيير عن التصنيف الجشع.
•	compareGreedyVsViterbi دالة مساعدة لا تُستخدم في الإنتاج عادة، ولكنها مفيدة لفهم أين يختلف النظامان. يمكن استخدامها مثلاً لطباعة جدول مقارنة أثناء التطوير.
الخطوة 6: إضافة أدوات تشخيصية اختيارية (ملف جديد ViterbiDiagnostics.ts)
للمساعدة في تحسين النموذج ومعايرة مصفوفة الانتقال والانبعاث، من المفيد وجود بعض الدوال التشخيصية. سننشئ كلاس ViterbiDiagnostics يحتوي على بعض الوظائف مثل طباعة مصفوفة الانتقال بصيغة مقروءة، وتحليل مسار Viterbi الناتج، واقتراح تحسينات على مصفوفة الانتقال بناءً على أخطاء التصنيف مقارنة بالحقيقة الأرضية (ground truth) إن توفرت.
إنشاء ملف ViterbiDiagnostics.ts:
/**
 * أدوات تشخيص وتحليل نتائج Viterbi ونموذج HMM.
 */
export class ViterbiDiagnostics {

  /**
   * طباعة مصفوفة الانتقال (TransitionMatrix) بشكل جدولي مفهوم (لبعض الحالات المهمة فقط).
   */
  static printTransitionMatrix(): void {
    console.log('\n=== Transition Matrix (Partial) ===\n');

    const states = ['character', 'dialogue', 'action', 'parenthetical'];
    // الطباعة الرأسية
    console.log('From/To'.padEnd(15) + states.map(s => s.padEnd(12)).join(''));
    console.log('-'.repeat(15 + states.length * 12));
    for (const from of states) {
      let row = from.padEnd(15);
      for (const to of states) {
        const score = TransitionMatrix.getTransitionScore(from as ViterbiState, to as ViterbiState);
        row += score.toString().padEnd(12);
      }
      console.log(row);
    }
  }

  /**
   * تحليل مسار Viterbi وإعطاء إحصائيات عامة عنه:
   * - المجموع الكلي للدرجات.
   * - عدد المرات التي غيّر فيها Viterbi قرار التصنيف الجشع (overrides).
   * - توزيع الحالات (كم سطر من كل نوع).
   * - عدد السطور ذات الثقة المنخفضة.
   */
  static analyzePath(results: ViterbiResult[]): {
    totalScore: number;
    overrideCount: number;
    overrides: { index: number; from: string; to: string; reason: string }[];
    lowConfidenceCount: number;
    stateDistribution: { [state: string]: number };
  } {
    let totalScore = 0;
    const overrides: { index: number; from: string; to: string; reason: string }[] = [];
    let lowConfidenceCount = 0;
    const stateDistribution: { [state: string]: number } = {};

    for (const r of results) {
      totalScore += r.viterbiScore;
      if (r.viterbiOverride) {
        overrides.push({
          index: r.lineIndex,
          from: r.greedyChoice,
          to: r.type,
          reason: r.overrideReason || ''
        });
      }
      if (r.confidence === 'low') {
        lowConfidenceCount++;
      }
      stateDistribution[r.type] = (stateDistribution[r.type] || 0) + 1;
    }

    return {
      totalScore,
      overrideCount: overrides.length,
      overrides,
      lowConfidenceCount,
      stateDistribution
    };
  }

  /**
   * اقتراح تحسينات لمصفوفة الانتقال بناءً على نتائج مقارنة مع التصنيف الصحيح (الحقيقة الأرضية).
   * @param results نتائج Viterbi الحالية
   * @param groundTruth مصفوفة الأنواع الصحيحة (إذا كانت متوفرة لكل سطر)
   * @returns قائمة باقتراحات تعديل (من حالة -> إلى حالة) مع السبب
   */
  static suggestTransitionImprovements(
    results: ViterbiResult[],
    groundTruth?: ViterbiState[]
  ): { from: string; to: string; currentScore: number; suggestedScore: number; reason: string }[] {

    if (!groundTruth || groundTruth.length !== results.length) {
      return [];
    }

    const suggestions: { from: string; to: string; currentScore: number; suggestedScore: number; reason: string }[] = [];
    const transitionCounts: Map<string, { correct: number; incorrect: number }> = new Map();

    for (let i = 1; i < results.length; i++) {
      const prevTrue = groundTruth[i - 1];
      const currTrue = groundTruth[i];
      const key = `${prevTrue}->${currTrue}`;

      const predicted = results[i].type;
      const isCorrect = predicted === currTrue;

      const counts = transitionCounts.get(key) || { correct: 0, incorrect: 0 };
      if (isCorrect) counts.correct++;
      else counts.incorrect++;
      transitionCounts.set(key, counts);
    }

    // المرور على كل انتقال ومقارنة معدلات الخطأ
    for (const [key, counts] of transitionCounts.entries()) {
      const [from, to] = key.split('->') as [ViterbiState, ViterbiState];
      const currentScore = TransitionMatrix.getTransitionScore(from, to);
      const accuracy = counts.correct / (counts.correct + counts.incorrect);

      // إذا كان الانتقال كثير الأخطاء (أقل من 50% دقة مع وجود 3 أخطاء فأكثر):
      if (accuracy < 0.5 && counts.incorrect >= 3) {
        suggestions.push({
          from,
          to,
          currentScore,
          suggestedScore: Math.min(100, currentScore + 20),  // نقترح زيادة 20 (أو الوصول إلى 100 كحد أقصى)
          reason: `دقة منخفضة (${Math.round(accuracy * 100)}%) مع ${counts.incorrect} أخطاء`
        });
      }
    }

    return suggestions;
  }
}
الدوال التشخيصية أعلاه اختيارية، لكنها مفيدة في فهم النموذج بعد دمجه:
•	printTransitionMatrix: تطبع جزءًا من مصفوفة الانتقال (يمكن تعديلها لطباعة الكل) لتفقد القيم والتأكد من منطقيتها.
•	analyzePath: تعطي بعض الإحصائيات عن نتيجة التصنيف لسلسلة معينة: مجموع الدرجات (يمكن استخدامه لمقارنة تحسينات على نفس النص)، وعدد التغييرات التي أجراها Viterbi مقارنة بالتصنيف الجشع (كم override حصل), وعدد السطور منخفضة الثقة، وتوزيع الأنواع في المخرج (كم سطر حوار، كم شخصية، إلخ).
•	suggestTransitionImprovements: إذا كان لديك تصنيف صحيح معروف (ground truth) لمشهد أو نص معين، يمكن استخدام هذه الدالة لمقارنة المسار الناتج مع الصحيح واقتراح أماكن يجب رفع احتمالية الانتقال فيها. فهي تجمع معدلات الأخطاء لكل انتقال من حالة إلى حالة، وإذا وجدت انتقالًا معينًا كثير الأخطاء، تقترح زيادة درجته في المصفوفة.
الخطوة 7: تحديث الواجهات والأنواع (تعديل إضافي في types.ts)
لنحدّث الآن نوع المخرجات BatchClassificationResult المستخدم في التطبيق لإضافة معلومات تتعلق بنظام Viterbi (مثل تفاصيل override إن حصل). أيضًا سنضيف واجهة خيارات التصنيف ClassificationOptions لدعم اختيار استخدام Viterbi أو لا.
تعديل ملف types.ts:
// ... ضمن ملف types.ts ...

export interface BatchClassificationResult {
  text: string;
  type: string;
  confidence: 'high' | 'medium' | 'low';
  doubtScore: number;
  needsReview: boolean;
  top2Candidates?: [CandidateType, CandidateType] | null;
  fallbackApplied?: {
    originalType: string;
    fallbackType: string;
    reason: string;
  };
  // === الحقول الجديدة الخاصة بـ Viterbi ===
  viterbiOverride?: {
    greedyChoice: string;
    viterbiChoice: string;
    reason: string;
  };
}

export interface ClassificationOptions {
  /** استخدام خوارزمية Viterbi بدلاً من التصنيف الجشع */
  useViterbi?: boolean;
  /** وزن الـ emission scores في حساب المسار (من 0 إلى 1) */
  emissionWeight?: number;
  /** وزن الـ transition scores في حساب المسار (من 0 إلى 1) */
  transitionWeight?: number;
  /** تحديث ذاكرة المستند أثناء التصنيف */
  updateMemory?: boolean;
}
قمنا بإضافة حقل اختياري viterbiOverride لنتيجة التصنيف يحتوي على معلومات التعديل الذي أجراه Viterbi (النوع الذي اختاره التصنيف الجشع مقابل النوع النهائي وسبب التغيير). كما أضفنا ClassificationOptions.useViterbi لتفعيل/تعطيل استخدام Viterbi عند طلب التصنيف.
الخطوة 8: توحيد واجهة التصنيف الرئيسية (تعديل ScreenplayClassifier.ts)
أخيرًا، لنعدل دالة التصنيف الرئيسية classify (إن وجدت) أو ننشئ واحدة، بحيث تسمح باختيار إما استخدام Viterbi أو الطريقة الجشعة حسب ما يطلبه المستخدم أو ما يراه التطبيق مناسبًا. هذا يجعل التكامل سلسًا دون كسر التوافق مع الواجهة الحالية.
تعديل في ScreenplayClassifier.ts:
export class ScreenplayClassifier {
  // ... باقي الكود ...

  /**
   * الدالة الرئيسية لتصنيف السطور – تسمح باستخدام Viterbi أو Greedy حسب الخيار.
   */
  classify(
    lines: string[],
    options: ClassificationOptions = {}
  ): BatchClassificationResult[] {
    const { useViterbi = false } = options;
    if (useViterbi) {
      return this.classifyWithViterbi(lines, options);
    } else {
      return this.classifyBatch(lines);
    }
  }
}
هكذا، إذا أردنا استخدام النظام الجديد، نمرر { useViterbi: true } إلى دالة التصنيف. أما إذا لم نمرر شيئًا فتبقى على الطريقة القديمة (الجشعة) بشكل افتراضي. يمكننا أيضًا ضبط الأوزان عبر الخيارات إذا احتجنا.
________________________________________
ملخص التغييرات في المشروع
فيما يلي قائمة بالملفات والوظائف التي أضفناها أو عدلناها ضمن المشروع لدمج نظام Viterbi/HMM:
الملف / الوحدة	التعديل الحاصل
types.ts	إضافة نوع ViterbiState ومصفوفة ALL_STATES وواجهات ViterbiCell وClassificationOptions وتحديث BatchClassificationResult
TransitionMatrix.ts	إنشاء صنف جديد TransitionMatrix يحتوي مصفوفة الانتقال والدوال المساعدة لها.
EmissionCalculator.ts	إنشاء صنف جديد EmissionCalculator لحساب درجات الانبعاث لكل نوع لكل سطر (يتضمن عدة دوال فرعية خاصة بكل نوع).
ViterbiDecoder.ts	إنشاء صنف جديد ViterbiDecoder لتنفيذ خوارزمية فيتربي واستخراج أفضل تسلسل مع تفسير التغييرات.
ScreenplayClassifier.ts (جديد)	إضافة الدالة classifyWithViterbi لتنفيذ التصنيف باستخدام Viterbi، والدالة compareGreedyVsViterbi للمقارنة التشخيصية. تعديل الدالة classify الرئيسية لدعم خيار useViterbi.
ViterbiDiagnostics.ts (اختياري)	إنشاء صنف جديد يحتوي دوال تشخيصية مفيدة لتحسين وضبط النموذج (طباعة المصفوفات، تحليل النتائج، اقتراح تعديلات).
ملاحظة: لم نقم بتعديل دوال التصنيف الجشع الأصلية (مثل classifyBatch ودوال scoreAsType الحالية) إلا بشكل طفيف لاستغلالها في حساب الانبعاث. النظام الجديد يضاف بطريقة مستقلة ويمكن تشغيله أو إيقافه عبر الخيار useViterbi، مما يجعل عملية الدمج آمنة دون إفساد السلوك القديم إن دعت الحاجة للرجوع إليه.
مثال عملي: مقارنة المخرجات قبل وبعد Viterbi
لنفترض أن لدينا المشهد التالي كمدخل للتصنيف:
مشهد 1  
داخلي - بيت - ليل  
ياسين  
مرحباً يا أبي  
أحمد:  
كيف حالك؟  
المخرجات بطريقة التصنيف الجشع (قبل دمج Viterbi):
مشهد 1             ← scene-header-1 ✅
داخلي - بيت - ليل  ← scene-header-2 ✅
ياسين              ← action ❌ (خطأ: اعتقدها جملة وصف لأن الكلمة تبدأ بحرف "ي")
مرحباً يا أبي      ← action ❌ (تابع للخطأ السابق، اعتبر الحوار وصفاً لأنه جاء بعد action)
أحمد:              ← character ✅
كيف حالك؟          ← dialogue ✅
نلاحظ كما أسلفنا أن خطأ في تصنيف "ياسين" كسطر حركة جرّ خلفه خطأ آخر في تصنيف "مرحباً يا أبي".
المخرجات باستخدام خوارزمية Viterbi (بعد الدمج):
مشهد 1             ← scene-header-1 ✅
داخلي - بيت - ليل  ← scene-header-2 ✅
ياسين              ← character ✅ (تم تصحيحه إلى شخصية بفضل النظر للسياق)
مرحباً يا أبي      ← dialogue ✅ (لأنه تبيّن أنه حوار تابع لشخصية "ياسين")
أحمد:              ← character ✅
كيف حالك؟          ← dialogue ✅
الآن صنّف "ياسين" بشكل صحيح كاسم شخصية، وبالتالي "مرحباً يا أبي" تم تصنيفه كحوار تابع له. خوارزمية Viterbi نظرت إلى السطر التالي ولاحظت أنه حوار، فأدركت أن هذا السطر على الأرجح اسم شخصية رغم أن خصائصه اللغوية وحدها لم تكن كافية لحسم ذلك. تمت التضحية بالقرار الجشع المحلي (الذي مال نحو action بدرجة 55 مقابل 50 للشخصية) لصالح تسلسل إجمالي أفضل.
تفصيل النتيجة لسطر "ياسين":
{
  lineIndex: 2,
  text: "ياسين",
  greedyChoice: "action",        // التصنيف الجشع قبل Viterbi
  type: "character",             // التصنيف النهائي بعد Viterbi
  viterbiOverride: true,         // يدل أن Viterbi غيّر القرار
  overrideReason: "السطر التالي هو حوار → الأرجح أن السطر الحالي اسم شخصية",
  emissionScores: {
    action: 55,
    character: 50,
    dialogue: 10,
    ... // بقية الأنواع 0 أو منخفضة
  },
  confidence: "medium",
  viterbiScore: 147.0            // (درجة المسار الإجمالية حتى هذا السطر)
}
يظهر أعلاه أن الخوارزمية الجشعة رأت درجة الانبعاث لـ "ياسين" أعلى قليلًا كـ action (55) مقابل character (50). ولكن سياق التسلسل غيّر النتيجة إلى character بسبب قوة الانتقال إلى حوار في السطر التالي. السبب المذكور يشرح أنه بما أن السطر التالي حوار، فمن المنطقي أن "ياسين" هو اسم المتحدث.
ضبط وتحسين (اختياري)
بعد دمج النظام، قد نحتاج لتجربة عدة إعدادات لأوزان الانبعاث مقابل الانتقال. الوزن الافتراضي الذي استخدمناه 0.6 للانبعاث و0.4 للانتقال أعطى نتائج جيدة للتجربة المبدئية. يمكن تعديل هذه الأوزان عبر ClassificationOptions. فيما يلي بعض الاقتراحات:
// أمثلة لضبط الأوزان:
screenplayClassifier.classify(lines, { useViterbi: true, emissionWeight: 0.7, transitionWeight: 0.3 });
// هذا الإعداد يعطي ثقة أكبر لدرجات الانبعاث (مفيد للنصوص المكتوبة بشكل جيد وواضح).

screenplayClassifier.classify(lines, { useViterbi: true, emissionWeight: 0.5, transitionWeight: 0.5 });
// توازن متساوٍ بين الانبعاث والانتقال (مفيد إذا كان هناك نسبة أخطاء ملحوظة في كل منهما).

screenplayClassifier.classify(lines, { useViterbi: true, emissionWeight: 0.4, transitionWeight: 0.6 });
// ثقة أكبر بالانتقالات (مفيد للنصوص العشوائية أو التي يكثر فيها الأخطاء الإملائية بحيث يكون السياق أهم من السطر المفرد).
يمكن استخدام أدوات التشخيص المذكورة (ViterbiDiagnostics) لتحليل أي أخطاء متبقية واقتراح تعديلات. على سبيل المثال، إذا وجدت أن النموذج ما زال يخطئ كثيرًا في انتقال معين، يمكنك زيادة قيمته في TransitionMatrix، أو تعديل حسابات EmissionCalculator لتحسين دقة الانبعاث.
________________________________________
باتباع هذه الخطة التفصيلية وتنفيذ الخطوات المذكورة في الملفات المحددة، ستحصل على نظام تصنيف متكامل باستخدام Viterbi/HMM يعمل جنبًا إلى جنب مع الطريقة الحالية، ويتيح تحسين دقة التصنيف في سيناريوهات تسلسل السطور المعقدة. تأكد من اختبار النموذج بعد الدمج على عدة مشاهد وسيناريوهات مختلفة للتأكد من صحة عمله وضبطه وفق الحاجة. بالتوفيق![1]
________________________________________
[1] شرح نموذج ماركوف المخفي (HMM) | شرح نموذج ماركوف المخفي (HMM) | Ultralytics
https://www.ultralytics.com/ar/glossary/hidden-markov-model-hmm
