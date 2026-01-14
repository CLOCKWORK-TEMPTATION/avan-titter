import { ViterbiState } from '../types/types';

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
    if (!fromTransitions) return 30;
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
