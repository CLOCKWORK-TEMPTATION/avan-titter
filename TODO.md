# TODO - إصلاح مشكلة السطر الفارغ بين الشخصية والحوار

## المشكلة المكتشفة

بعد الفحص الشامل للكود، تم تحديد **السبب الجذري** للمشكلة:

### الموقع: `src/components/ScreenplayEditorEnhanced.tsx:289-298`

دالة `getNextFormatOnEnter` **ناقصة** - لا تحتوي على قاعدة للانتقال من "character" إلى "dialogue":

```typescript
const getNextFormatOnEnter = (currentFormat: string) => {
  const transitions: { [key: string]: string } = {
    "scene-header-top-line": "scene-header-3",
    "scene-header-3": "action",
    "scene-header-1": "scene-header-3",
    "scene-header-2": "scene-header-3",
    // ❌ لا توجد قاعدة لـ "character" -> "dialogue"
  };

  return transitions[currentFormat] || "action";  // ← يرجع "action" دائماً!
};
```

## تتبع المسار الكامل

### 1. عند الضغط على Enter من سطر "character"
- `handleKeyDown.ts:22-25` يستدعي `getNextFormatOnEnter("character")`
- يرجع `"action"` بدلاً من `"dialogue"`
- يتم إنشاء سطر جديد بنوع "action" فارغ

### 2. القاعدة الصحيحة موجودة لكن في مكان خاطئ
في `src/classes/ScreenplayClassifier.ts:546`:
```typescript
if (prevType === "character" && nextType === "dialogue") return false;  // ✅ صحيحة
```

هذه القاعدة موجودة في `getEnterSpacingRule` لكنها تُستدعى فقط في:
- `applyEnterSpacingRules` (تُستخدم في اللصق والتصنيف الدفعي)
- **لا تُستخدم** عند الضغط على Enter مباشرة!

## الحل المطلوب

### ✅ التعديل الأساسي

تعديل `getNextFormatOnEnter` في `src/components/ScreenplayEditorEnhanced.tsx:289-298`:

```typescript
const getNextFormatOnEnter = (currentFormat: string) => {
  const transitions: { [key: string]: string } = {
    "scene-header-top-line": "scene-header-3",
    "scene-header-3": "action",
    "scene-header-1": "scene-header-3",
    "scene-header-2": "scene-header-3",
    "character": "dialogue",           // ✅ إضافة هذه القاعدة
    "dialogue": "action",              // ✅ إضافة للاكتمال
    "parenthetical": "dialogue",       // ✅ إضافة للاكتمال
    "action": "action",                // ✅ إضافة للاكتمال
    "transition": "scene-header-top-line",  // ✅ إضافة للاكتمال
  };

  return transitions[currentFormat] || "action";
};
```

## الملفات المتأثرة

1. **`src/components/ScreenplayEditorEnhanced.tsx`** (التعديل الوحيد المطلوب)
   - السطر 289-298: تعديل دالة `getNextFormatOnEnter`

## التحقق من الحل

بعد التطبيق، يجب اختبار:
1. ✅ الضغط على Enter من سطر "character" ينشئ سطر "dialogue" مباشرة (بدون فراغ)
2. ✅ الضغط على Enter من سطر "dialogue" ينشئ سطر "action" مع فراغ
3. ✅ الضغط على Enter من سطر "action" ينشئ سطر "action" مع فراغ
4. ✅ الضغط على Enter من سطر "scene-header-3" ينشئ سطر "action" مع فراغ

## ملاحظات إضافية

### التوافق مع القواعد الموجودة
الحل يتوافق تماماً مع `getEnterSpacingRule` في `ScreenplayClassifier.ts`:
- `character` → `dialogue`: false (بدون فراغ) ✅
- `dialogue` → `action`: true (مع فراغ) ✅
- `action` → `action`: true (مع فراغ) ✅

### عدم الحاجة لتعديلات أخرى
- ❌ لا حاجة لتعديل `handleKeyDown.ts` (يعمل بشكل صحيح)
- ❌ لا حاجة لتعديل `applyFormatToCurrentLine.ts` (يعمل بشكل صحيح)
- ❌ لا حاجة لتعديل `ScreenplayClassifier.ts` (القواعد موجودة وصحيحة)
