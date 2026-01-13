/**
 * مثال توضيحي لميزة doubtScore
 * 
 * هذا السكريبت يوضح كيفية استخدام الميزات الجديدة
 */

import { ScreenplayClassifier } from './src/classes/ScreenplayClassifier';

// نص سيناريو تجريبي
const testScript = `
مشهد 1 - ليل / داخلي
بيت محمد

يدخل محمد إلى الغرفة ويجلس على الأريكة

ياسين
مرحباً يا محمد

محمد
(مبتسماً)
أهلاً بك

تدخل سارة
`;

console.log('='.repeat(60));
console.log('اختبار ميزة doubtScore');
console.log('='.repeat(60));
console.log();

// 1. التصنيف المفصل
console.log('1️⃣  التصنيف المفصل مع معلومات الشك:');
console.log('-'.repeat(60));

const results = ScreenplayClassifier.classifyBatchDetailed(testScript, true);

results.forEach((line, i) => {
  if (line.text.trim() === '') return; // تجاهل السطور الفارغة
  
  console.log(`\nالسطر ${i}: "${line.text}"`);
  console.log(`  📌 النوع: ${line.type}`);
  console.log(`  🎯 الثقة: ${line.confidence}`);
  console.log(`  ❓ درجة الشك: ${line.doubtScore}/100`);
  console.log(`  ⚠️  يحتاج مراجعة: ${line.needsReview ? '✓ نعم' : '✗ لا'}`);
  
  if (line.top2Candidates) {
    console.log(`  🏆 أعلى مرشحين:`);
    line.top2Candidates.forEach((candidate, idx) => {
      console.log(`     ${idx + 1}. ${candidate.type} (${candidate.score} نقطة, ${candidate.confidence})`);
      console.log(`        الأسباب: ${candidate.reasons.join(', ')}`);
    });
  }
  
  if (line.fallbackApplied) {
    console.log(`  🔄 Fallback: ${line.fallbackApplied.originalType} → ${line.fallbackApplied.fallbackType}`);
    console.log(`     السبب: ${line.fallbackApplied.reason}`);
  }
});

console.log();
console.log('='.repeat(60));

// 2. السطور التي تحتاج مراجعة
console.log();
console.log('2️⃣  السطور التي تحتاج مراجعة:');
console.log('-'.repeat(60));

const reviewableLines = ScreenplayClassifier.getReviewableLines(results);

if (reviewableLines.length === 0) {
  console.log('✅ لا توجد سطور تحتاج مراجعة!');
} else {
  console.log(`⚠️  عدد السطور التي تحتاج مراجعة: ${reviewableLines.length}\n`);
  
  reviewableLines.forEach((line, idx) => {
    console.log(`${idx + 1}. السطر ${line.lineIndex}: "${line.text}"`);
    console.log(`   النوع الحالي: ${line.currentType}`);
    console.log('   الخيارات المقترحة:');
    
    line.suggestedTypes.forEach((suggestion, i) => {
      console.log(`      ${String.fromCharCode(97 + i)}. ${suggestion.type} (${suggestion.score} نقطة)`);
      console.log(`         الأسباب: ${suggestion.reasons.join(', ')}`);
    });
    
    if (line.fallbackApplied) {
      console.log(`   ℹ️  تم تطبيق fallback: ${line.fallbackApplied.originalType} → ${line.fallbackApplied.fallbackType}`);
    }
    console.log();
  });
}

console.log('='.repeat(60));

// 3. الإحصائيات
console.log();
console.log('3️⃣  إحصائيات الشك:');
console.log('-'.repeat(60));

const stats = ScreenplayClassifier.getDoubtStatistics(results);

console.log(`📊 إجمالي السطور: ${stats.totalLines}`);
console.log(`⚠️  السطور التي تحتاج مراجعة: ${stats.needsReviewCount}`);
console.log(`📈 النسبة المئوية: ${stats.needsReviewPercentage}%`);

if (stats.topAmbiguousPairs.length > 0) {
  console.log('\n🔍 أكثر الأزواج غموضاً:');
  stats.topAmbiguousPairs.forEach((pair, i) => {
    console.log(`   ${i + 1}. ${pair.pair}: ${pair.count} حالة`);
  });
} else {
  console.log('\n✅ لا توجد أزواج غامضة');
}

console.log();
console.log('='.repeat(60));
console.log('✨ انتهى الاختبار');
console.log('='.repeat(60));

// 4. مثال على تطبيق واجهة مستخدم
console.log();
console.log('4️⃣  مثال على واجهة المستخدم:');
console.log('-'.repeat(60));
console.log();
console.log('يمكنك استخدام هذه البيانات لعمل:');
console.log();
console.log('  • قائمة تفاعلية بالسطور التي تحتاج مراجعة');
console.log('  • أزرار لاختيار النوع الصحيح من الخيارات المقترحة');
console.log('  • شرح مفصل لأسباب التصنيف');
console.log('  • مؤشر مرئي لدرجة الثقة (progress bar)');
console.log('  • إحصائيات في dashboard');
console.log();
console.log('مثال على كود React:');
console.log(`
function ReviewPanel({ results }) {
  const reviewable = ScreenplayClassifier.getReviewableLines(results);
  const stats = ScreenplayClassifier.getDoubtStatistics(results);
  
  return (
    <div>
      <div className="stats">
        <h3>إحصائيات الجودة</h3>
        <p>السطور التي تحتاج مراجعة: {stats.needsReviewCount} ({stats.needsReviewPercentage}%)</p>
      </div>
      
      <div className="review-list">
        <h3>السطور التي تحتاج مراجعة</h3>
        {reviewable.map(line => (
          <div key={line.lineIndex} className="review-item">
            <p className="line-text">"{line.text}"</p>
            <p>النوع الحالي: {line.currentType}</p>
            
            <div className="suggestions">
              {line.suggestedTypes.map(s => (
                <button onClick={() => handleCorrection(line.lineIndex, s.type)}>
                  {s.type} ({s.score} نقطة)
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
`);

console.log('='.repeat(60));
