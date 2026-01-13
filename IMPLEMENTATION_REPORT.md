# تقرير التنفيذ: فصل blank عن action داخلياً

## الملخص التنفيذي

تم تنفيذ جميع التغييرات المطلوبة لفصل السطور الفارغة (blank) عن سطور الحركة (action) داخلياً في نظام التصنيف، مع الحفاظ على التوافق الخلفي في الإخراج النهائي.

## المشكلة الأصلية

كانت السطور الفارغة تُصنَّف كـ `action`، مما يُلوِّث السياق (context) ويكسر تسلسل الحوار:

```
أحمد:              ← character
مرحباً يا صديقي    ← dialogue (prevType = character) ✓
                   ← action (blank مُسجَّل كـ action) ❌
كيف حالك؟          ← action (prevType = action) ❌❌  // يجب أن يكون dialogue!
```

## الحل المُطبَّق

### 1. استخدام نوع `blank` داخلياً (Internal Type)

تم تعديل `classifyBatch` لتصنيف السطور الفارغة كـ `blank` بدلاً من `action`:

```typescript
// في classifyBatch
if (!current) {
  results.push({ text: "", type: "blank" });  // كان: "action"
  previousTypes[i] = "blank";
  continue;
}
```

### 2. إضافة دوال مساعدة للسياق

#### `getPrevNonBlankType()`
```typescript
private static getPrevNonBlankType(
  previousTypes: (string | null)[],
  currentIndex: number
): string | null {
  for (let i = currentIndex - 1; i >= 0; i--) {
    const type = previousTypes[i];
    if (type && type !== 'blank') {
      return type;
    }
  }
  return null;
}
```

#### `getPrevNonBlankTypes()`
```typescript
private static getPrevNonBlankTypes(
  previousTypes: (string | null)[],
  currentIndex: number,
  count: number = 2
): (string | null)[] {
  // تُرجع عدة أنواع سابقة غير فارغة
}
```

#### `isInDialogueBlock()`
```typescript
private static isInDialogueBlock(
  previousTypes: (string | null)[],
  currentIndex: number
): boolean {
  // تفحص إذا كان السطر داخل بلوك حوار
}
```

### 3. تعديل `buildContext` لتخطي السطور الفارغة

```typescript
// بناء السطور السابقة - تخطي blank
for (let i = index - 1; i >= 0 && collected < WINDOW_SIZE; i--) {
  const line = allLines[i] || '';
  const type = previousTypes?.[i] || 'unknown';
  
  if (type === 'blank' || this.isBlank(line)) {
    continue;  // تخطي السطور الفارغة
  }
  
  previousLines.unshift({ line, type });
  collected++;
}
```

### 4. استخدام `prevNonBlankType` في التصنيف

```typescript
// في classifyWithScoring
const prevNonBlankType = previousTypes 
  ? this.getPrevNonBlankType(previousTypes, index) 
  : null;

if (prevNonBlankType === 'character' && looksLikeActionStart) {
  // منطق التصنيف يستخدم آخر نوع غير فارغ
}
```

### 5. تحديث `getEnterSpacingRule`

```typescript
static getEnterSpacingRule(prevType: string, nextType: string): boolean | null {
  if (prevType === 'blank' || nextType === 'blank') {
    return null;  // تجاهل blank في قواعد التباعد
  }
  // ... باقي القواعد
}
```

### 6. التحويل النهائي للتوافق

```typescript
// في نهاية classifyBatch
return spacedResults.map(r => ({
  ...r,
  type: r.type === 'blank' ? 'action' : r.type  // تحويل للتوافق
}));
```

## النتائج

### قبل التنفيذ ❌
```
أحمد: → character
مرحباً → dialogue (prevType: character) ✓
<blank> → action
كيف حالك؟ → action (prevType: action) ❌
```

### بعد التنفيذ ✅
```
أحمد: → character
مرحباً → dialogue (prevNonBlank: character) ✓
<blank> → blank (داخلياً) → action (في الإخراج)
كيف حالك؟ → dialogue (prevNonBlank: dialogue) ✓
```

## الفوائد

1. **حفظ سياق الحوار**: بلوكات الحوار تبقى متصلة رغم وجود سطور فارغة
2. **التوافق الخلفي**: الإخراج النهائي لا يزال يستخدم `action` للسطور الفارغة
3. **فصل المخاوف**: `blank` هو حالة داخلية، ليس نوع إخراج
4. **دقة أفضل**: تحسين تصنيف الحوار العربي متعدد الأسطر

## الملفات المُعدَّلة

- `src/classes/ScreenplayClassifier.ts`
  - تعديل `classifyBatch`
  - إضافة `getPrevNonBlankType`
  - إضافة `getPrevNonBlankTypes`
  - إضافة `isInDialogueBlock`
  - تعديل `buildContext`
  - تعديل `classifyWithScoring`
  - تعديل `getEnterSpacingRule`

## الاختبار

تم إنشاء ملف `demo_blank_fix.js` لتوضيح الفرق بين السلوك قبل وبعد التنفيذ.

```bash
node demo_blank_fix.js
```

## الخلاصة

تم تنفيذ جميع الخطوات المطلوبة بنجاح. النظام الآن يتعامل مع السطور الفارغة بشكل منفصل داخلياً، مما يحافظ على سياق الحوار ويحسن دقة التصنيف، مع الحفاظ على التوافق الكامل مع الأنظمة الموجودة.
