import { ViterbiState } from '../types/types';
import { TransitionMatrix } from './TransitionMatrix';
import { ViterbiResult } from './ViterbiDecoder';

/**
 * أدوات تشخيص وتحليل نتائج Viterbi ونموذج HMM.
 */
export class ViterbiDiagnostics {

  /**
   * طباعة مصفوفة الانتقال بشكل جدولي مفهوم
   */
  static printTransitionMatrix(): void {
    console.log('\n=== Transition Matrix (Partial) ===\n');

    const states: ViterbiState[] = ['character', 'dialogue', 'action', 'parenthetical'];
    
    console.log('From/To'.padEnd(15) + states.map(s => s.padEnd(12)).join(''));
    console.log('-'.repeat(15 + states.length * 12));
    
    for (const from of states) {
      let row = from.padEnd(15);
      for (const to of states) {
        const score = TransitionMatrix.getTransitionScore(from, to);
        row += score.toString().padEnd(12);
      }
      console.log(row);
    }
  }

  /**
   * تحليل مسار Viterbi وإعطاء إحصائيات عامة
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
   * اقتراح تحسينات لمصفوفة الانتقال بناءً على نتائج مقارنة مع التصنيف الصحيح
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

    for (const [key, counts] of Array.from(transitionCounts.entries())) {
      const [from, to] = key.split('->') as [ViterbiState, ViterbiState];
      const currentScore = TransitionMatrix.getTransitionScore(from, to);
      const accuracy = counts.correct / (counts.correct + counts.incorrect);

      if (accuracy < 0.5 && counts.incorrect >= 3) {
        suggestions.push({
          from,
          to,
          currentScore,
          suggestedScore: Math.min(100, currentScore + 20),
          reason: `دقة منخفضة (${Math.round(accuracy * 100)}%) مع ${counts.incorrect} أخطاء`
        });
      }
    }

    return suggestions;
  }
}
