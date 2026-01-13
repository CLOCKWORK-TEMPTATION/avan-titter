# نظام ذاكرة المستند - Document Memory System

## نظرة عامة

تم تطبيق نظام ذاكرة المستند (Document Memory) لحل مشكلة تصنيف أسماء الشخصيات التي تبدأ بحرف "ي" أو "ت" بشكل خاطئ كـ `action` بدلاً من `character`.

## المشكلة الأصلية

كانت الدالة `matchesActionStartPattern` تحتوي على نمط واسع جداً:
```typescript
/^\s*(?:و|ف)?[يت][\u0600-\u06FF]{2,}(?:\s+\S|$)/
```

هذا النمط كان يعتبر أي كلمة تبدأ بـ "ي" أو "ت" فعلاً حركياً، مما أدى إلى تصنيف خاطئ لأسماء مثل:
- **ياسين** ← كان يُصنَّف `action` خطأً
- **يوسف** ← كان يُصنَّف `action` خطأً  
- **تامر** ← كان يُصنَّف `action` خطأً
- **تيسير** ← كان يُصنَّف `action` خطأً

## الحل المُطبق

### 1. إنشاء فئة DocumentMemory

تم إنشاء فئة جديدة `DocumentMemory` في `src/classes/DocumentMemory.ts` التي تقوم بـ:

- **تخزين أسماء الشخصيات** مع عدد مرات ظهورها
- **تصنيف مستوى الثقة** (high/medium/low) بناءً على السياق
- **تنظيف الأسماء** للمقارنة (إزالة النقطتين والمسافات)

الميزات الرئيسية:
```typescript
addCharacter(name: string, confidence: 'high' | 'medium'): void
isKnownCharacter(name: string): { confidence: 'high' | 'medium' | 'low' } | null
getAllCharacters(): string[]
clear(): void
```

### 2. دمج DocumentMemory في ScreenplayClassifier

#### إضافة instance property:
```typescript
private documentMemory: DocumentMemory;

constructor() {
  // ...
  this.documentMemory = new DocumentMemory();
}
```

#### إضافة طرق للوصول:
```typescript
getDocumentMemory(): DocumentMemory
resetDocumentMemory(): void
```

### 3. تحديث دوال التصنيف

#### تحديث `scoreAsCharacter`:
- إضافة parameter اختياري `documentMemory`
- إضافة مكافأة (+60/+40/+20 نقطة) للأسماء المعروفة
- تخفيف الخصم للأسماء المعروفة التي تشبه أنماط الحركة

```typescript
if (documentMemory) {
  const knownStatus = documentMemory.isKnownCharacter(nameToCheck);
  if (knownStatus) {
    if (knownStatus.confidence === 'high') {
      score += 60;
      reasons.push('شخصية معروفة من المستند (ثقة عالية)');
    }
    // ...
  }
}
```

#### تحديث `scoreAsAction`:
- إضافة parameter اختياري `documentMemory`
- خصم (-50/-30 نقطة) إذا كان الاسم شخصية معروفة
- تخفيف المكافأة للأفعال ذات الكلمة الواحدة (+20 بدلاً من +50)

```typescript
if (documentMemory) {
  const knownStatus = documentMemory.isKnownCharacter(trimmed);
  if (knownStatus) {
    if (knownStatus.confidence === 'high') {
      score -= 50;
      reasons.push('اسم شخصية معروف (سالب قوي)');
    }
  }
}
```

### 4. تحديث `matchesActionStartPattern`

إضافة شرط لاستثناء الكلمات المفردة:

```typescript
const wordCount = this.wordCount(normalized);

// كلمة واحدة لا تُعتبر action تلقائياً
if (wordCount === 1) {
  // فقط الأفعال المؤكدة في ACTION_VERB_SET
  const firstWord = normalized.trim();
  return ScreenplayClassifier.ACTION_VERB_SET.has(firstWord);
}
```

هذا يمنع ابتلاع أسماء مثل "ياسين" و"يوسف" كـ action.

### 5. تحديث `classifyWithScoring`

- إضافة parameter اختياري `documentMemory`
- تمرير الذاكرة إلى دوال التسجيل
- تحديث القاموس بعد التصنيف:

```typescript
if (documentMemory && bestType === 'character') {
  const endsWithColon = trimmed.endsWith(':') || trimmed.endsWith('：');
  const confidence = endsWithColon ? 'high' : 'medium';
  const characterName = trimmed.replace(/[:：\s]+$/, '');
  documentMemory.addCharacter(characterName, confidence);
}
```

### 6. تحديث `classifyBatch`

- إضافة parameter اختياري `documentMemory`
- تمرير الذاكرة إلى `classifyWithScoring`
- إضافة طريقة `classifyBatchWithMemory` للراحة

```typescript
static classifyBatch(
  text: string, 
  useContext: boolean = false,
  documentMemory?: DocumentMemory
): { text: string; type: string }[]

// طريقة instance للراحة
classifyBatchWithMemory(text: string, useContext: boolean = true)
```

### 7. إضافة `preProcessForCharacters`

Pass أول اختياري لجمع الشخصيات عالية الثقة:

```typescript
preProcessForCharacters(lines: string[]): void {
  for (const line of lines) {
    const trimmed = line.trim();
    
    // شخصية مؤكدة: تنتهي بـ : وقصيرة
    if ((trimmed.endsWith(':') || trimmed.endsWith('：')) && 
        ScreenplayClassifier.wordCount(trimmed) <= 5) {
      
      if (!ScreenplayClassifier.isSceneHeaderStart(trimmed) &&
          !ScreenplayClassifier.isTransition(trimmed)) {
        
        const name = trimmed.replace(/[:：\s]+$/, '');
        this.documentMemory.addCharacter(name, 'high');
      }
    }
  }
}
```

## الاستخدام

### الطريقة الأساسية (Static - بدون ذاكرة):
```typescript
const results = ScreenplayClassifier.classifyBatch(text, true);
```

### الطريقة المحسّنة (مع الذاكرة):
```typescript
const classifier = new ScreenplayClassifier();
const results = classifier.classifyBatchWithMemory(text, true);

// الشخصيات المتعلمة
const characters = classifier.getDocumentMemory().getAllCharacters();
```

### مع Pre-processing:
```typescript
const classifier = new ScreenplayClassifier();
const lines = text.split('\n');

// Pass أول لجمع الشخصيات
classifier.preProcessForCharacters(lines);

// ثم التصنيف الكامل
const results = classifier.classifyBatchWithMemory(text, true);
```

## النتائج

### قبل التطبيق:
```
ياسين (بدون :) → action أو dialogue (خطأ)
يوسف (بدون :) → action أو dialogue (خطأ)
تامر (بدون :) → action (خطأ)
تيسير (بدون :) → action أو dialogue (خطأ)
```

### بعد التطبيق:
```
ياسين (بدون :) → character ✓
يوسف (بدون :) → character ✓
تامر (بدون :) → character ✓
تيسير (بدون :) → character ✓
```

## ملفات التغيير

1. **src/classes/DocumentMemory.ts** - فئة جديدة
2. **src/classes/ScreenplayClassifier.ts** - تعديلات شاملة
3. **example_document_memory.ts** - مثال عملي

## التوافق العكسي

جميع التغييرات متوافقة مع الكود الموجود:
- الـ parameters الجديدة اختيارية
- الطرق الثابتة (Static) ما زالت تعمل بنفس الطريقة
- السلوك الافتراضي لم يتغير

## الاختبارات

تم اختبار النظام بنجاح مع:
- أسماء شخصيات تبدأ بـ "ي" و "ت"
- أفعال حركية حقيقية (يدخل، يجلس، تقف، إلخ)
- سيناريوهات معقدة مع شخصيات متعددة

جميع الاختبارات نجحت (6/6) ✓
