# قائمة تحقق تنفيذ نظام Viterbi/HMM

## حالة التنفيذ: ✅ تم إكمال المراحل الأساسية (الخطوات 1-4 و 7)

---

## الخطوة 1: تعريف حالات Viterbi في ملف الأنواع (types.ts)
- [x] إضافة نوع `ViterbiState`
- [x] إضافة مصفوفة `ALL_STATES`
- [x] إضافة واجهة `ViterbiCell`
- [x] التحقق من البناء ✅

---

## الخطوة 2: إنشاء مصفوفة الانتقال TransitionMatrix.ts
- [x] إنشاء ملف `src/classes/TransitionMatrix.ts`
- [x] تعريف مصفوفة الانتقالات `TRANSITIONS`
- [x] إضافة دالة `getTransitionScore`
- [x] إضافة دالة `getMostLikelyNextStates`
- [x] التحقق من البناء ✅

---

## الخطوة 3: إنشاء وحدة حساب احتمالات الانبعاث EmissionCalculator.ts
- [x] إنشاء ملف `src/classes/EmissionCalculator.ts`
- [x] إضافة دالة `calculateEmissions`
- [x] إضافة دالة `setHighConfidence`
- [x] إضافة دالة `calculateCharacterEmission`
- [x] إضافة دالة `calculateDialogueEmission`
- [x] إضافة دالة `calculateActionEmission`
- [x] إضافة دالة `calculateParentheticalEmission`
- [x] إضافة دالة `calculateSceneHeader2Emission`
- [x] إضافة دالة `calculateSceneHeader3Emission`
- [x] إضافة واجهة `EmissionContext`
- [x] التحقق من البناء ✅

---

## الخطوة 4: إنشاء وحدة فك الشفرة ViterbiDecoder.ts
- [x] إنشاء ملف `src/classes/ViterbiDecoder.ts`
- [x] إضافة دالة `decode`
- [x] إضافة دالة `explainOverride`
- [x] إضافة واجهة `ViterbiResult`
- [x] التحقق من البناء ✅

---

## الخطوة 5: دمج طريقة Viterbi في مصنف السيناريو
- [ ] إضافة دالة `classifyWithViterbi` في `ScreenplayClassifier.ts`
- [ ] إضافة دالة `compareGreedyVsViterbi` في `ScreenplayClassifier.ts`
- [ ] التحقق من البناء

---

## الخطوة 6: إضافة أدوات تشخيصية (اختياري)
- [ ] إنشاء ملف `src/classes/ViterbiDiagnostics.ts`
- [ ] إضافة دالة `printTransitionMatrix`
- [ ] إضافة دالة `analyzePath`
- [ ] إضافة دالة `suggestTransitionImprovements`
- [ ] التحقق من البناء

---

## الخطوة 7: تحديث الواجهات والأنواع
- [x] تحديث `BatchClassificationResult` في `types.ts`
- [x] إضافة واجهة `ClassificationOptions` في `types.ts`
- [x] التحقق من البناء ✅

---

## الخطوة 8: توحيد واجهة التصنيف الرئيسية
- [ ] إضافة/تعديل دالة `classify` في `ScreenplayClassifier.ts`
- [ ] التحقق من البناء النهائي
- [ ] اختبار النظام

---

## الاختبارات النهائية
- [ ] اختبار التصنيف الجشع (Greedy)
- [ ] اختبار التصنيف باستخدام Viterbi
- [ ] مقارنة النتائج
- [ ] اختبار على نصوص متنوعة
- [ ] التحقق من الأداء

---

## الملاحظات
- تاريخ البدء: 2026-01-14
- آخر تحديث: 2026-01-14
- الحالة: قيد التنفيذ
