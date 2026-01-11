# ⚠️ يجب ربط هذا المجلد بالوكلاء في `brain-storm-ai`

## الوضع الحالي

هذا المجلد يحتوي على:
- ✅ `agentConfigs.ts` - مصفوفة configs الوكلاء (فاضية حاليًا)
- ⚠️ `agents.ts` - Model configs (temperature, tokens) - تم نسخه في brain-storm-ai
- ⚠️ `prompts.ts` - System prompts - تم نسخه في brain-storm-ai
- ⚠️ `environment.ts` - Environment variables - غير مستخدم
- ⚠️ `index.ts` - Re-exports - غير مستخدم

## المطلوب للتفعيل

### 1️⃣ تعبئة `agentConfigs.ts`

حاليًا الملف فاضي:
```typescript
export const AGENT_CONFIGS: ReadonlyArray<AIAgentConfig> = Object.freeze([]);
```

**المطلوب:** استيراد جميع agent configs من `brain-storm-ai`:

```typescript
// استيراد من brain-storm-ai
import { analysisAgentConfig } from '../../brain-storm-ai/agents/analysis/analysisAgent';
import { creativeAgentConfig } from '../../brain-storm-ai/agents/generation/creativeAgent';
// ... باقي الوكلاء (28+ agent)

export const AGENT_CONFIGS: ReadonlyArray<AIAgentConfig> = Object.freeze([
  analysisAgentConfig,
  creativeAgentConfig,
  // ... إلخ
]);
```

### 2️⃣ الوكلاء المتاحة في `brain-storm-ai`

#### 📊 Analysis (18 agents)
- `analysisAgent`
- `characterDeepAnalyzerAgent`
- `characterNetworkAgent`
- `characterVoiceAgent`
- `dialogueAdvancedAnalyzerAgent`
- `dialogueForensicsAgent`
- `conflictDynamicsAgent`
- `culturalHistoricalAnalyzerAgent`
- `literaryQualityAnalyzerAgent`
- `plotPredictorAgent`
- `producibilityAnalyzerAgent`
- `rhythmMappingAgent`
- `targetAudienceAnalyzerAgent`
- `thematicMiningAgent`
- `themesMessagesAnalyzerAgent`
- `visualCinematicAnalyzerAgent`
- `styleFingerprintAgent`
- `recommendationsGeneratorAgent`

#### 🎨 Generation (5 agents)
- `completionAgent`
- `creativeAgent`
- `sceneGeneratorAgent`
- `worldBuilderAgent`
- `recommendationsGeneratorAgent`

#### ⚖️ Evaluation (2 agents)
- `audienceResonanceAgent`
- `tensionOptimizerAgent`

#### 🔄 Transformation (3 agents)
- `adaptiveRewritingAgent`
- `platformAdapterAgent`
- `styleFingerprintAgent`

---

## 🔗 كيفية الربط

### الخطوة 1: تحديث `agentConfigs.ts`

```typescript
import type { AIAgentConfig } from "../types/types";

// استيراد جميع الـ configs
import { ANALYSIS_AGENT_CONFIG } from "../../brain-storm-ai/agents/analysis/analysisAgent";
import { CREATIVE_AGENT_CONFIG } from "../../brain-storm-ai/agents/generation/creativeAgent";
// ... إلخ

export const AGENT_CONFIGS: ReadonlyArray<AIAgentConfig> = Object.freeze([
  ANALYSIS_AGENT_CONFIG,
  CREATIVE_AGENT_CONFIG,
  // ... أضف باقي الوكلاء
]);
```

### الخطوة 2: التأكد من عمل `AdvancedAgentsPopup.tsx`

الـ popup جاهز ويستورد من `agentConfigs.ts`:
```typescript
import { AGENT_CONFIGS } from "../config/agentConfigs";
```

بمجرد تعبئة المصفوفة، سيظهر جميع الوكلاء في الـ UI.

---

## 📁 المسارات

```
editor/
├── config/
│   └── agentConfigs.ts          ⚠️ يحتاج تعبئة
│
└── components/
    └── AdvancedAgentsPopup.tsx  ✅ جاهز

brain-storm-ai/
└── agents/
    ├── analysis/                ✅ 18 وكيل
    ├── generation/              ✅ 5 وكلاء
    ├── evaluation/              ✅ 2 وكيل
    └── transformation/          ✅ 3 وكلاء
```

---

## ✅ بعد الربط

- سيتمكن المستخدم من اختيار أي وكيل من الـ 28+ وكيل
- سيعمل النظام بالكامل مع Gemini API
- ستكون جميع الإمكانيات المتقدمة متاحة

---

**آخر تحديث:** 2026-01-09  
**الحالة:** في انتظار الربط بـ `brain-storm-ai`
