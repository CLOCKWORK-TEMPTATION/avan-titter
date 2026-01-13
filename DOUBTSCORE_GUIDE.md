# استخدام ميزة doubtScore - دليل المطور

## نظرة عامة

تم تحسين `ScreenplayClassifier` لتصدير معلومات `doubtScore` كميزة منتج كاملة. الآن يمكنك:

1. **تحديد السطور الغامضة تلقائياً** - السطور التي تحتاج مراجعة بشرية
2. **رؤية أعلى مرشحين** للتصنيف مع الأسباب
3. **الاستفادة من fallback ذكي** للحالات الغامضة
4. **الحصول على إحصائيات** حول جودة التصنيف

---

## الواجهات الجديدة (Types)

### CandidateType
```typescript
interface CandidateType {
  type: string;           // نوع التصنيف (character, dialogue, action, etc.)
  score: number;          // النقاط (0-100)
  confidence: 'high' | 'medium' | 'low';
  reasons: string[];      // الأسباب التي أدت لهذا التصنيف
}
```

### ClassificationResult (محدّث)
```typescript
interface ClassificationResult {
  type: string;
  confidence: 'low' | 'medium' | 'high';
  scores: { [type: string]: ClassificationScore };
  context: LineContext;
  
  // === حقول جديدة ===
  doubtScore?: number;                          // درجة الشك (0-100)
  needsReview?: boolean;                        // هل يحتاج للمراجعة؟
  top2Candidates?: [CandidateType, CandidateType] | null;  // أعلى مرشحين
  fallbackApplied?: {
    originalType: string;    // النوع الأصلي قبل الفولباك
    fallbackType: string;    // النوع بعد الفولباك
    reason: string;          // السبب
  };
}
```

### BatchClassificationResult
```typescript
interface BatchClassificationResult {
  text: string;
  type: string;
  confidence: 'high' | 'medium' | 'low';
  doubtScore: number;
  needsReview: boolean;
  top2Candidates?: [CandidateType, CandidateType] | null;
  fallbackApplied?: {
    originalType: string;
    fallbackType: string;
    reason: string;
  };
}
```

### ReviewableLineUI
```typescript
interface ReviewableLineUI {
  lineIndex: number;       // فهرس السطر في النص
  text: string;            // نص السطر
  currentType: string;     // النوع الحالي
  suggestedTypes: {        // الأنواع المقترحة
    type: string;
    score: number;
    reasons: string[];
  }[];
  fallbackApplied?: {
    originalType: string;
    fallbackType: string;
    reason: string;
  };
}
```

---

## الدوال الجديدة

### 1. classifyBatchDetailed()
تصنيف نص كامل مع معلومات doubtScore الكاملة.

```typescript
static classifyBatchDetailed(
  text: string,
  useContext: boolean = true
): BatchClassificationResult[]
```

**مثال:**
```typescript
const scriptText = `
مشهد 1 - ليل / داخلي
بيت محمد
ياسين
مرحباً
يدخل محمد إلى الغرفة
`;

const results = ScreenplayClassifier.classifyBatchDetailed(scriptText, true);

results.forEach((line, i) => {
  console.log(`السطر ${i}: "${line.text}"`);
  console.log(`  النوع: ${line.type}`);
  console.log(`  درجة الشك: ${line.doubtScore}`);
  console.log(`  يحتاج مراجعة: ${line.needsReview ? 'نعم' : 'لا'}`);
  
  if (line.fallbackApplied) {
    console.log(`  تم تطبيق fallback: ${line.fallbackApplied.originalType} → ${line.fallbackApplied.fallbackType}`);
    console.log(`  السبب: ${line.fallbackApplied.reason}`);
  }
});
```

**الإخراج المتوقع:**
```
السطر 0: ""
  النوع: action
  درجة الشك: 0
  يحتاج مراجعة: لا

السطر 1: "مشهد 1 - ليل / داخلي"
  النوع: scene-header-top-line
  درجة الشك: 0
  يحتاج مراجعة: لا

السطر 2: "بيت محمد"
  النوع: scene-header-3
  درجة الشك: 0
  يحتاج مراجعة: لا

السطر 3: "ياسين"
  النوع: character
  درجة الشك: 75
  يحتاج مراجعة: نعم
  تم تطبيق fallback: action → character
  السبب: السطر التالي يبدو كحوار

السطر 4: "مرحباً"
  النوع: dialogue
  درجة الشك: 20
  يحتاج مراجعة: لا

السطر 5: "يدخل محمد إلى الغرفة"
  النوع: action
  درجة الشك: 0
  يحتاج مراجعة: لا
```

---

### 2. getReviewableLines()
استخراج السطور التي تحتاج مراجعة للعرض في واجهة المستخدم.

```typescript
static getReviewableLines(
  results: BatchClassificationResult[]
): ReviewableLineUI[]
```

**مثال:**
```typescript
const results = ScreenplayClassifier.classifyBatchDetailed(scriptText, true);
const reviewable = ScreenplayClassifier.getReviewableLines(results);

console.log(`عدد السطور التي تحتاج مراجعة: ${reviewable.length}`);

reviewable.forEach(line => {
  console.log(`\nالسطر ${line.lineIndex}: "${line.text}"`);
  console.log(`النوع الحالي: ${line.currentType}`);
  console.log('الخيارات المقترحة:');
  
  line.suggestedTypes.forEach((suggestion, i) => {
    console.log(`  ${i + 1}. ${suggestion.type} (${suggestion.score} نقطة)`);
    console.log(`     الأسباب: ${suggestion.reasons.join(', ')}`);
  });
});
```

**الإخراج المتوقع:**
```
عدد السطور التي تحتاج مراجعة: 1

السطر 3: "ياسين"
النوع الحالي: character
الخيارات المقترحة:
  1. action (55 نقطة)
     الأسباب: يبدأ بـ ي
  2. character (50 نقطة)
     الأسباب: قصير, السطر التالي حوار
```

---

### 3. getDoubtStatistics()
الحصول على إحصائيات عن جودة التصنيف والأزواج الأكثر غموضاً.

```typescript
static getDoubtStatistics(
  results: BatchClassificationResult[]
): {
  totalLines: number;
  needsReviewCount: number;
  needsReviewPercentage: number;
  topAmbiguousPairs: { pair: string; count: number }[];
}
```

**مثال:**
```typescript
const results = ScreenplayClassifier.classifyBatchDetailed(scriptText, true);
const stats = ScreenplayClassifier.getDoubtStatistics(results);

console.log('=== إحصائيات الشك ===');
console.log(`إجمالي السطور: ${stats.totalLines}`);
console.log(`السطور التي تحتاج مراجعة: ${stats.needsReviewCount}`);
console.log(`النسبة المئوية: ${stats.needsReviewPercentage}%`);

console.log('\nأكثر الأزواج غموضاً:');
stats.topAmbiguousPairs.forEach((pair, i) => {
  console.log(`${i + 1}. ${pair.pair}: ${pair.count} حالة`);
});
```

**الإخراج المتوقع:**
```
=== إحصائيات الشك ===
إجمالي السطور: 5
السطور التي تحتاج مراجعة: 1
النسبة المئوية: 20%

أكثر الأزواج غموضاً:
1. action vs character: 1 حالة
```

---

## قواعد Smart Fallback

عند وجود `needsReview: true`، يطبق النظام قواعد fallback ذكية:

### قاعدة 1: character vs action
- إذا السطر التالي يبدو كحوار → `character`
- وإلا → `action`

### قاعدة 2: dialogue vs action
- إذا السطر السابق `character` أو `parenthetical` → `dialogue`
- إذا السطر السابق `dialogue` → `dialogue` (استمرار)
- وإلا → `action`

### قاعدة 3: parenthetical vs action
- إذا السطر السابق `character` أو `dialogue` → `parenthetical`
- وإلا → `action`

### قاعدة 4: character vs dialogue
- إذا السطر السابق `character` → `dialogue`
- إذا ينتهي بنقطتين → `character`

---

## حساب doubtScore

درجة الشك (0-100) تُحسب بناءً على:

1. **الفرق بين النقاط** (0-50 نقطة):
   - فرق < 15: +50
   - فرق < 25: +30
   - فرق < 35: +15

2. **النقاط المنخفضة** (0-30 نقطة):
   - أعلى نقاط < 40: +30
   - أعلى نقاط < 55: +15

3. **التعادل** (0-20 نقطة):
   - أكثر من نوع بنقاط متقاربة (فرق < 5): +20

4. **الثقة المنخفضة** (0-20 نقطة):
   - ثقة منخفضة: +20
   - ثقة متوسطة: +10

**عتبة المراجعة:** `needsReview = true` عندما `doubtScore >= 60`

---

## مثال تطبيقي: واجهة مراجعة السطور الغامضة

```typescript
import { ScreenplayClassifier } from './classes/ScreenplayClassifier';

function ReviewUI() {
  const [script, setScript] = useState('');
  const [reviewableLines, setReviewableLines] = useState<ReviewableLineUI[]>([]);
  
  const analyzeScript = () => {
    const results = ScreenplayClassifier.classifyBatchDetailed(script, true);
    const reviewable = ScreenplayClassifier.getReviewableLines(results);
    setReviewableLines(reviewable);
  };
  
  const handleCorrection = (lineIndex: number, correctedType: string) => {
    // تطبيق التصحيح
    console.log(`تصحيح السطر ${lineIndex} إلى ${correctedType}`);
  };
  
  return (
    <div>
      <button onClick={analyzeScript}>تحليل</button>
      
      {reviewableLines.length > 0 && (
        <div className="review-panel">
          <h3>السطور التي تحتاج مراجعة ({reviewableLines.length})</h3>
          
          {reviewableLines.map(line => (
            <div key={line.lineIndex} className="review-item">
              <p className="line-text">"{line.text}"</p>
              <p className="current-type">النوع الحالي: {line.currentType}</p>
              
              <div className="suggestions">
                <h4>الخيارات المقترحة:</h4>
                {line.suggestedTypes.map((suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => handleCorrection(line.lineIndex, suggestion.type)}
                  >
                    {suggestion.type} ({suggestion.score} نقطة)
                    <br />
                    <small>{suggestion.reasons.join(', ')}</small>
                  </button>
                ))}
              </div>
              
              {line.fallbackApplied && (
                <div className="fallback-info">
                  ℹ️ تم تطبيق fallback: {line.fallbackApplied.originalType} → {line.fallbackApplied.fallbackType}
                  <br />
                  السبب: {line.fallbackApplied.reason}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## الفوائد

### 1. تحسين تجربة المستخدم
- **شفافية**: المستخدم يعرف متى النظام غير متأكد
- **مشاركة**: المستخدم يصحح الأخطاء ويحسّن الدقة
- **ثقة**: عرض الأسباب يزيد من ثقة المستخدم

### 2. تحسين جودة البيانات
- **تحديد نقاط الضعف**: معرفة الأزواج الأكثر غموضاً
- **تدريب مستهدف**: التركيز على تحسين الحالات الصعبة
- **مقاييس واضحة**: نسبة السطور التي تحتاج مراجعة

### 3. Fallback ذكي
- **تقليل الأخطاء**: استخدام السياق لتحسين القرارات المترددة
- **شفافية**: المستخدم يعرف متى تم تطبيق fallback ولماذا

---

## ملاحظات للتطوير المستقبلي

1. **DocumentMemory**: إضافة دعم لقاموس الأسماء والأماكن المخصص
2. **User Feedback Loop**: حفظ تصحيحات المستخدم لتحسين النموذج
3. **Confidence Thresholds**: السماح بتخصيص عتبة `needsReview`
4. **Analytics Dashboard**: لوحة تحكم لعرض الإحصائيات بشكل مرئي

---

تم إنشاء هذا الدليل بتاريخ: 2026-01-13
