// src/config/prompts.ts

import { TaskType } from '../types/types';

export const PROMPT_PERSONA_BASE = `
أنت "CritiqueConstruct AI"، مساعد ذكاء اصطناعي متقدم ومتخصص في تحليل ونقد وتطوير النصوص الدرامية والسيناريوهات. هدفك الأساسي هو تقديم ملاحظات بناءة وعميقة لمساعدة الكتاب على تحسين أعمالهم. يجب أن تكون جميع تحليلاتك ومقترحاتك باللغة العربية الفصحى، مع الحفاظ على لهجة احترافية وموضوعية.
`.trim();

export const TASK_SPECIFIC_INSTRUCTIONS: { [key in TaskType]?: string } = {
  [TaskType.SUMMARIZE]: `
**الهدف:** استخراج وتلخيص النقاط الرئيسية في النص.
**المخرجات المتوقعة:** ملخص موجز وواضح للنص المقدم.
`.trim(),
  [TaskType.ANALYZE_CHARACTERS]: `
**الهدف:** تحليل الشخصيات الرئيسية والثانوية.
**المخرجات المتوقعة:** وصف لكل شخصية، دوافعها، تطورها، وعلاقاتها مع الشخصيات الأخرى.
`.trim(),
};

export const TASKS_EXPECTING_JSON_RESPONSE: TaskType[] = [
  TaskType.ANALYZE_CHARACTERS,
];

export const COMPLETION_ENHANCEMENT_OPTIONS = [
  { id: TaskType.ANALYZE_CHARACTERS, label: 'تحليل الشخصيات' },
];

export const TASK_CATEGORY_MAP: { [key in TaskType]: string } = {
    // Core foundational agents
    [TaskType.ANALYSIS]: 'core',
    [TaskType.CREATIVE]: 'core',
    [TaskType.INTEGRATED]: 'core',
    [TaskType.COMPLETION]: 'core',

    // Advanced analytical agents
    [TaskType.RHYTHM_MAPPING]: 'analysis',
    [TaskType.CHARACTER_NETWORK]: 'analysis',
    [TaskType.DIALOGUE_FORENSICS]: 'analysis',
    [TaskType.THEMATIC_MINING]: 'analysis',
    [TaskType.STYLE_FINGERPRINT]: 'analysis',
    [TaskType.CONFLICT_DYNAMICS]: 'analysis',

    // Creative generation agents
    [TaskType.ADAPTIVE_REWRITING]: 'creative',
    [TaskType.SCENE_GENERATOR]: 'creative',
    [TaskType.CHARACTER_VOICE]: 'creative',
    [TaskType.WORLD_BUILDER]: 'creative',

    // Predictive & optimization agents
    [TaskType.PLOT_PREDICTOR]: 'predictive',
    [TaskType.TENSION_OPTIMIZER]: 'predictive',
    [TaskType.AUDIENCE_RESONANCE]: 'predictive',
    [TaskType.PLATFORM_ADAPTER]: 'predictive',

    // Advanced specialized modules
    [TaskType.CHARACTER_DEEP_ANALYZER]: 'analysis',
    [TaskType.DIALOGUE_ADVANCED_ANALYZER]: 'analysis',
    [TaskType.VISUAL_CINEMATIC_ANALYZER]: 'analysis',
    [TaskType.THEMES_MESSAGES_ANALYZER]: 'analysis',
    [TaskType.CULTURAL_HISTORICAL_ANALYZER]: 'analysis',
    [TaskType.PRODUCIBILITY_ANALYZER]: 'analysis',
    [TaskType.TARGET_AUDIENCE_ANALYZER]: 'analysis',
    [TaskType.LITERARY_QUALITY_ANALYZER]: 'analysis',
    [TaskType.RECOMMENDATIONS_GENERATOR]: 'creative',

    // Additional task types for compatibility
    [TaskType.SUMMARIZE]: 'core',
    [TaskType.ANALYZE_CHARACTERS]: 'analysis',
    [TaskType.CREATIVE_WRITING]: 'creative',
    [TaskType.PLOT_PREDICTION]: 'predictive',
    [TaskType.THEMATIC_ANALYSIS]: 'analysis',
    [TaskType.STYLE_ANALYSIS]: 'analysis',
    [TaskType.SCENE_GENERATION]: 'creative',
    [TaskType.WORLDBUILDING]: 'creative',
    [TaskType.TENSION_ANALYSIS]: 'analysis',
    [TaskType.ADAPTATION]: 'transformation',
    [TaskType.VISUAL_ANALYSIS]: 'analysis',
    [TaskType.THEME_MESSAGE_ANALYSIS]: 'analysis',
    [TaskType.RECOMMENDATION]: 'creative',

    // Additional missing task types
    [TaskType.AUDIENCE_ANALYSIS]: 'analysis',
    [TaskType.TEXT_COMPLETION]: 'core',
    [TaskType.COMPREHENSIVE_ANALYSIS]: 'analysis',
    [TaskType.CHARACTER_ANALYSIS]: 'analysis'
};