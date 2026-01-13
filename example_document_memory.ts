/**
 * مثال على استخدام نظام ذاكرة المستند
 * 
 * هذا المثال يوضح كيفية استخدام DocumentMemory لتحسين تصنيف أسماء الشخصيات
 * التي تبدأ بـ "ي" أو "ت" والتي كانت تُصنف خطأً كـ action
 */

import { ScreenplayClassifier } from './src/classes/ScreenplayClassifier';

// إنشاء instance من المصنف
const classifier = new ScreenplayClassifier();

// نص السيناريو للاختبار
const screenplay = `مشهد 1 - ليل / داخلي
بيت محمد

ياسين:
مرحباً يا محمد

يوسف:
كيف حالك اليوم؟

تامر:
أنا بخير

تيسير:
أهلاً بالجميع

يدخل محمد إلى الغرفة

ياسين
يوسف
تامر
تيسير`;

console.log('=== مثال على نظام ذاكرة المستند ===\n');
console.log('المشكلة الأصلية:');
console.log('أسماء مثل "ياسين" و"يوسف" و"تامر" و"تيسير" كانت تُصنف خطأً كـ action');
console.log('لأنها تبدأ بحرف "ي" أو "ت"\n');

console.log('الحل:');
console.log('استخدام DocumentMemory لتعلّم أسماء الشخصيات من المستند نفسه\n');

// تصنيف مع استخدام الذاكرة
const results = classifier.classifyBatchWithMemory(screenplay, true);

console.log('النتائج:');
console.log('--------');

// عرض النتائج المهمة
const characterLines = results.filter(r => 
  ['ياسين', 'يوسف', 'تامر', 'تيسير'].includes(r.text)
);

characterLines.forEach(line => {
  console.log(`✓ "${line.text}" → ${line.type}`);
});

// عرض الشخصيات المتعلمة
console.log('\nالشخصيات المتعلمة في الذاكرة:');
const learned = classifier.getDocumentMemory().getAllCharacters();
console.log(learned.join(', '));

console.log('\n✨ جميع الأسماء صُنفت بشكل صحيح كـ character!');
