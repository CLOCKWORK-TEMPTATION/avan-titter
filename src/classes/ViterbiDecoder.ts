import { ViterbiState, ALL_STATES } from '../types/types';
import { DocumentMemory } from './DocumentMemory';
import { EmissionCalculator } from './EmissionCalculator';
import { TransitionMatrix } from './TransitionMatrix';

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

/**
 * خوارزمية Viterbi Decoder للبحث عن التسلسل الأمثل لأنواع السطور.
 */
export class ViterbiDecoder {

  /**
   * تنفيذ خوارزمية Viterbi على قائمة السطور المعطاة.
   */
  static decode(
    lines: string[],
    documentMemory?: DocumentMemory,
    emissionWeight: number = 0.6,
    transitionWeight: number = 0.4
  ): ViterbiResult[] {

    const n = lines.length;
    if (n === 0) return [];

    // === المرحلة 1: حساب جميع درجات الانبعاث ===
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
    const viterbi: Array<Map<ViterbiState, { score: number; prev: ViterbiState | null }>> = [];

    // السطر الأول
    const firstRow = new Map<ViterbiState, { score: number; prev: ViterbiState | null }>();
    for (const state of ALL_STATES) {
      const emissionScore = allEmissions[0][state] ?? 0;
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

        for (const prevState of ALL_STATES) {
          const prevEntry = prevRow.get(prevState);
          if (!prevEntry) continue;

          const transitionScore = TransitionMatrix.getTransitionScore(prevState, currentState);

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

    // === المرحلة 4: التتبع الخلفي (Backtracking) ===
    const bestPath: ViterbiState[] = new Array(n);

    let bestFinalScore = -Infinity;
    let bestFinalState: ViterbiState = 'action';
    const lastRow = viterbi[n - 1];
    for (const [state, entry] of Array.from(lastRow.entries())) {
      if (entry.score > bestFinalScore) {
        bestFinalScore = entry.score;
        bestFinalState = state;
      }
    }
    bestPath[n - 1] = bestFinalState;

    for (let i = n - 1; i > 0; i--) {
      const currentState = bestPath[i];
      const entry = viterbi[i].get(currentState);
      bestPath[i - 1] = entry?.prev ?? 'action';
    }

    // === المرحلة 5: بناء مصفوفة النتائج ===
    const results: ViterbiResult[] = [];
    for (let i = 0; i < n; i++) {
      const state = bestPath[i];
      const emissions = allEmissions[i];
      const entry = viterbi[i].get(state);

      const sortedEmissions = Object.entries(emissions).sort((a, b) => b[1] - a[1]);
      const topEmission = sortedEmissions[0];
      const secondEmission = sortedEmissions[1];
      const emissionGap = topEmission && secondEmission 
        ? topEmission[1] - secondEmission[1] 
        : 100;

      let confidence: 'high' | 'medium' | 'low';
      if (emissionGap > 30 || emissions[state] > 70) {
        confidence = 'high';
      } else if (emissionGap > 15 || emissions[state] > 50) {
        confidence = 'medium';
      } else {
        confidence = 'low';
      }

      const greedyChoice = topEmission ? topEmission[0] as ViterbiState : 'action';
      const viterbiOverride = greedyChoice !== state;

      results.push({
        lineIndex: i,
        text: lines[i],
        type: state,
        confidence,
        emissionScores: emissions,
        viterbiScore: entry?.score ?? 0,
        greedyChoice,
        viterbiOverride,
        overrideReason: viterbiOverride 
          ? this.explainOverride(greedyChoice, state, i, bestPath)
          : undefined
      });
    }

    return results;
  }

  /**
   * شرح سبب تغيير Viterbi للقرار المتوقع
   */
  private static explainOverride(
    greedyChoice: string,
    viterbiChoice: string,
    index: number,
    path: ViterbiState[]
  ): string {
    const prevState = index > 0 ? path[index - 1] : null;
    const nextState = index < path.length - 1 ? path[index + 1] : null;

    if (greedyChoice === 'action' && viterbiChoice === 'character') {
      if (nextState === 'dialogue') {
        return 'السطر التالي هو حوار → الأرجح أن السطر الحالي اسم شخصية.';
      }
      if (prevState?.startsWith('scene-header')) {
        return 'يأتي بعد رأس مشهد مباشرة → غالباً يكون اسم شخصية وليس وصف.';
      }
    }

    if (greedyChoice === 'action' && viterbiChoice === 'dialogue') {
      if (prevState === 'character' || prevState === 'parenthetical') {
        return 'يأتي بعد شخصية أو ملاحظة → الأرجح أنه حوار تكملةً لذلك.';
      }
      if (prevState === 'dialogue') {
        return 'استمرار للحوار من السطر السابق.';
      }
    }

    if (greedyChoice === 'character' && viterbiChoice === 'scene-header-3') {
      if (prevState === 'scene-header-2' || prevState === 'scene-header-1') {
        return 'يأتي بعد جزء من رأس المشهد → على الأرجح هذا السطر مكمّل للمكان.';
      }
    }

    return `تم تعديل النوع لتحقيق تسلسل أفضل: ${prevState} → ${viterbiChoice} → ${nextState}`;
  }
}
