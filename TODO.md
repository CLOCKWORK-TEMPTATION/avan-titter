# TODO: إصلاح مشاكل التصنيف والفراغات

## 🔴 أولوية قصوى - المشاكل الحرجة

### 1. إصلاح كشف الأسطر الفارغة (Zero-Width Characters)
**المشكلة**: الأسطر تبدو فارغة لكن تحتوي على `\u200B` و محارف غير مرئية

**الملفات المطلوب تعديلها**:
- [ ] `src/classes/ScreenplayClassifier.ts`
  - [ ] تحديث `normalizeLine()` لإزالة جميع المحارف غير المرئية
  - [ ] إضافة: `\u200B \u200C \u200D \u2060 \uFEFF \u00A0`

- [ ] `src/helpers/postProcessFormatting.ts`
  - [ ] تحديث `isBlankActionElement()` لاستخدام التنظيف الجديد
  - [ ] استخدام `normalizeLine()` بدلاً من `trim()` فقط

**الكود المطلوب**:
```typescript
// في ScreenplayClassifier.ts
static normalizeLine(input: string): string {
  return input
    .replace(/[\u200B\u200C\u200D\u2060\uFEFF\u00A0\u200E\u200F\u061C]/g, "") // محارف غير مرئية
    .replace(/[\u064B-\u065F\u0670]/g, "") // تشكيل
    .replace(/[-–—]/g, "-")
    .replace(/[،,]/g, ",")
    .replace(/\s+/g, " ")
    .replace(/[\ufeff\t]+/g, "")
    .trim();
}

static isBlank(line: string): boolean {
  return this.normalizeLine(line) === "";
}
```

---

### 2. منع حقن HTML في handlePaste
**المشكلة**: بناء HTML عبر string concatenation يسبب XSS و كسر النص

**الملف**: `src/helpers/handlePaste.ts`

- [ ] استبدال `innerHTML` بـ `textContent`
- [ ] استخدام `document.createElement()` بدلاً من string templates

**الكود المطلوب**:
```typescript
// بدلاً من:
htmlResult += `<div class="${line.type}">${line.text}</div>`;

// استخدم:
const div = document.createElement('div');
div.className = line.type;
div.textContent = line.text; // آمن من XSS
Object.assign(div.style, getFormatStylesFn(line.type));
fragment.appendChild(div);
```

---

### 3. ✅ إصلاح Enter - السطر الفارغ بين الشخصية والحوار (مكتمل)
**المشكلة**: عند الضغط على Enter من سطر character، كان يتم إنشاء سطر action فارغ

**الحل المطبق**:
- ✅ تعديل دالة `getNextFormatOnEnter` في `src/components/ScreenplayEditorEnhanced.tsx`
- ✅ إضافة قواعد الانتقال الكاملة:
  * `character` → `dialogue` (بدون فراغ)
  * `dialogue` → `action`
  * `parenthetical` → `dialogue`
  * `action` → `action`
  * `transition` → `scene-header-top-line`

**التفاصيل**: راجع ملف `todo2.md` للتفاصيل الكاملة

---

## 🟡 أولوية متوسطة - تحسينات التصنيف

### 4. تحسين كشف scene-header-3
**المشكلة**: يصنف أسطر عادية كـ scene-header-3

**الملف**: `src/classes/ScreenplayClassifier.ts`

- [ ] إضافة فحص Regex للكلمات المفتاحية
- [ ] تحسين شرط `wordCount <= 6`

**الكود المطلوب**:
```typescript
// في classifyHybrid
if (prevType && ['scene-header-1', 'scene-header-2'].includes(prevType)) {
  const wordCount = current.split(/\s+/).length;
  const hasLocationKeywords = /^(داخل|خارج|أمام|خلف|فوق|تحت|بجانب|في)\s+/i.test(current);

  if (wordCount <= 6 && !current.includes(':') && hasLocationKeywords) {
    return 'scene-header-3';
  }
}
```

---

### 5. دمج SmartImportSystem في handlePaste
**المشكلة**: Gemini غير مفعّل في اللصق

**الملف**: `src/helpers/handlePaste.ts`

- [ ] استيراد `SmartImportSystem`
- [ ] إضافة مرحلة AI refinement بعد اللصق

**الكود المطلوب**:
```typescript
import { SmartImportSystem } from '../classes/systems/SmartImportSystem';

const smartSystem = new SmartImportSystem();

// بعد اللصق الفوري:
smartSystem.refineWithGemini(classifiedLines).then((refined) => {
  if (refined.length > 0) {
    // تطبيق التحسينات
    console.log('AI improved formatting');
  }
});
```

---

## 🟢 أولوية منخفضة - تحسينات إضافية

### 6. إضافة unit tests للتصنيف
- [ ] إنشاء `tests/ScreenplayClassifier.test.ts`
- [ ] اختبار حالات الفراغات
- [ ] اختبار scene-header-3

### 7. تحسين performance
- [ ] استخدام `requestIdleCallback` للـ AI refinement
- [ ] تقليل re-renders في `updateContent`

---

## 📋 خطة التنفيذ

### المرحلة 1 (اليوم) - الإصلاحات الحرجة
1. ✅ إصلاح `normalizeLine()`
2. ✅ تحديث `isBlank()`
3. ✅ إصلاح `handlePaste` XSS
4. ✅ إصلاح Enter في handleKeyDown - **مكتمل** ✅

### المرحلة 2 (غداً) - التحسينات
5. تحسين scene-header-3 detection
6. دمج SmartImportSystem

### المرحلة 3 (الأسبوع القادم) - الجودة
7. إضافة tests
8. تحسين performance

---

## 🧪 اختبارات مطلوبة بعد كل تعديل

1. **اختبار الفراغات**:
   - لصق نص يحتوي شخصية + حوار
   - التأكد من عدم وجود سطر فارغ بينهما
   - ✅ **اختبار Enter**: الضغط على Enter من character → dialogue مباشرة

2. **اختبار XSS**:
   - لصق نص يحتوي `<script>alert('test')</script>`
   - التأكد من ظهوره كنص عادي

3. **اختبار Enter** (مكتمل ✅):
   - الكتابة اليدوية والضغط على Enter
   - التأكد من إنشاء سطر جديد بالتنسيق الصحيح
   - character → dialogue (بدون فراغ)
   - dialogue → action (مع فراغ)

4. **اختبار scene-header-3**:
   - لصق: `مشهد 1` ثم `غرفة المكتب`
   - التأكد من تصنيف الثاني كـ scene-header-3

---

## 📝 ملاحظات

- إزالة `console.log` بعد انتهاء التشخيص
- تحديث documentation بعد كل تغيير
- عمل git commit بعد كل مرحلة
- ✅ **مكتمل**: إصلاح السطر الفارغ بين character و dialogue (راجع todo2.md)
