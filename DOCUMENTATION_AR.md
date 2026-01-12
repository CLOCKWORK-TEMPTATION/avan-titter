# توثيق محرر السيناريو العربي المتقدم (Rabyana Screenplay Editor)

## جدول المحتويات

1. [نظرة عامة على المشروع](#نظرة-عامة-على-المشروع)
2. [بنية المشروع](#بنية-المشروع)
3. [المكونات (Components)](#المكونات-components)
4. [المعالجات (Handlers)](#المعالجات-handlers)
5. [المساعدات (Helpers)](#المساعدات-helpers)
6. [الفئات (Classes)](#الفئات-classes)
7. [الوحدات (Modules)](#الوحدات-modules)
8. [أنواع البيانات (Types)](#أنواع-البيانات-types)

---

## نظرة عامة على المشروع

**Rabyana Screenplay Editor** هو محرر سيناريو متطور مخصص للكتابة السينمائية باللغة العربية مع دعم كامل لاتجاه الكتابة من اليمين إلى اليسار (RTL).

### التقنيات المستخدمة
- **Next.js 16** - إطار العمل الرئيسي
- **React 19** - مكتبة واجهة المستخدم
- **TypeScript** - للكتابة الآمنة
- **Tailwind CSS** - للتنسيق

---

## بنية المشروع

```
src/
├── app/                  # صفحات Next.js و API Routes
├── classes/              # الفئات الأساسية (ScreenplayClassifier, AIWritingAssistant)
│   └── systems/         # الأنظمة الفرعية (State, AutoSave, Search, etc.)
├── components/           # مكونات React (Editor, Header, Dialogs)
├── config/              # ملفات الإعدادات (Agents, Environment, Prompts)
├── handlers/            # معالجات الأحداث (KeyDown, Search, Replace, etc.)
├── helpers/             # الدوال المساعدة
├── modules/             # الوحدات المنفصلة
└── types/               # تعريفات TypeScript
```

---

## المكونات (Components)

### 1. ScreenplayEditorEnhanced.tsx
**المحرر الرئيسي للسيناريو**

#### الوظائف الرئيسية:
- `getNextFormatOnTab(formatType, shiftKey)` - تحديد التنسيق التالي عند ضغط Tab
- `getNextFormatOnEnter(formatType)` - تحديد التنسيق التالي عند ضغط Enter
- `applyFormatToCurrentLine(formatType, isEnterAction)` - تطبيق التنسيق على السطر الحالي
- `calculateStats()` - حساب إحصائيات المستند (كلمات، شخصيات، صفحات)
- `handlePaste(e)` - معالجة لصق النص مع التصنيف التلقائي

#### قواعد الانتقال (Transitions):
| التنسيق الحالي | التنسيق التالي (Enter) |
|----------------|----------------------|
| scene-header-top-line | scene-header-3 |
| scene-header-3 | action |
| **character** | **dialogue** ⭐ |
| **parenthetical** | **dialogue** ⭐ |
| أي شيء آخر | action |

---

### 2. MainHeader.tsx
**شريط الأدوات العلوي**

#### الوظائف:
- عرض الأزرار (تنسيق، حفظ، تصدير، AI)
- التحكم في حجم الخط ونوعه
- فتح نوافذ الحوار (البحث، الاستبدال، الذكاء الاصطناعي)

---

### 3. ExportDialog.tsx
**نافذة تصدير السيناريو**

#### الوظائف:
- `handleExport(format)` - تصدير السيناريو بصيغ مختلفة (PDF, TXT, FDX)

---

### 4. AdvancedAgentsPopup.tsx
**نافذة الوكلاء الذكية**

#### الوظائف:
- عرض قائمة الوكلاء المتاحة
- تنفيذ المهام المعقدة (تحليل الشخصيات، توليد المشاهد، إلخ)

---

## المعالجات (Handlers)

### 1. handleKeyDown.ts
**معالج ضغطات لوحة المفاتيح**

#### الدوال:
```typescript
createHandleKeyDown(
  currentFormat: string,
  getNextFormatOnTab: (format, shiftKey) => string,
  getNextFormatOnEnter: (format) => string,
  applyFormatToCurrentLine: (format, isEnterAction?) => void,
  formatText: (command, value?) => void,
  setShowSearchDialog: (show) => void,
  setShowReplaceDialog: (show) => void,
  updateContent: () => void
): (e: React.KeyboardEvent) => void
```

#### الاختصارات المدعومة:
- **Tab** - التنقل بين التنسيقات
- **Shift+Tab** - الرجوع للخلف في التنسيقات
- **Enter** - إنشاء سطر جديد بالتنسيق المناسب
- **Ctrl+B** - نص عريض (Bold)
- **Ctrl+I** - نص مائل (Italic)
- **Ctrl+U** - نص تحته خط (Underline)
- **Ctrl+1 إلى 6** - تنسيقات سريعة
- **Ctrl+F** - بحث
- **Ctrl+H** - استبدال

---

### 2. handleSearch.ts
**معالج البحث**

#### الدوال:
```typescript
createHandleSearch(
  searchTerm: string,
  editorRef: React.RefObject<HTMLDivElement>,
  searchEngine: React.MutableRefObject<AdvancedSearchEngine>,
  setShowSearchDialog: (show) => void
): () => Promise<void>
```

#### الميزات:
- بحث في المحتوى الحالي
- عرض عدد النتائج
- دعم التعبيرات النمطية (Regex)

---

### 3. handleReplace.ts
**معالج الاستبدال**

#### الدوال:
```typescript
createHandleReplace(
  searchTerm: string,
  replaceTerm: string,
  editorRef: React.RefObject<HTMLDivElement>,
  searchEngine: React.MutableRefObject<AdvancedSearchEngine>,
  updateContent: () => void,
  setShowReplaceDialog: (show) => void,
  setSearchTerm: (term) => void,
  setReplaceTerm: (term) => void
): () => Promise<void>
```

#### الميزات:
- استبدال نص بنص آخر
- استبدال الكل أو الأول فقط
- تطبيق التغييرات مباشرة على DOM

---

### 4. handleCharacterRename.ts
**معالج إعادة تسمية الشخصيات**

#### الدوال:
```typescript
createHandleCharacterRename(
  oldName: string,
  newName: string,
  editorRef: React.RefObject<HTMLDivElement>,
  updateContent: () => void
): () => void
```

---

### 5. handleAIReview.ts
**معالج المراجعة بالذكاء الاصطناعي**

#### الدوال:
```typescript
createHandleAIReview(
  editorRef: React.RefObject<HTMLDivElement>,
  selectedAgent: string,
  updateContent: () => void
): () => Promise<void>
```

---

## المساعدات (Helpers)

### 1. getFormatStyles.ts
**الحصول على أنماط التنسيق**

```typescript
getFormatStyles(
  formatType: string,
  selectedSize?: string,
  selectedFont?: string
): React.CSSProperties
```

#### أنواع التنسيق المدعومة:
| النوع | الوصف | المحاذاة | العرض |
|-------|-------|----------|-------|
| basmala | البسملة | يسار | تلقائي |
| scene-header-top-line | رأس المشهد (السطر العلوي) | بين | 100% |
| scene-header-3 | رأس المشهد (المكان) | وسط | تلقائي |
| action | الحركة/الوصف | يمين | 100% |
| character | اسم الشخصية | وسط | تلقائي |
| dialogue | الحوار | وسط | 2.5in |
| parenthetical | الملاحظة بين الأقواس | وسط | تلقائي |
| transition | الانتقال | وسط | تلقائي |

---

### 2. formatText.ts
**تنسيق النص**

```typescript
formatText(command: string, value?: string): void
```

#### الأوامر المدعومة:
- `bold` - نص عريض
- `italic` - نص مائل
- `underline` - نص تحته خط
- `strikeThrough` - نص مشطوب
- `subscript` - نص سفلي
- `superscript` - نص علوي

---

### 3. applyFormatToCurrentLine.ts
**تطبيق التنسيق على السطر الحالي**

```typescript
applyFormatToCurrentLine(
  formatType: string,
  getFormatStylesFn: (format) => React.CSSProperties,
  setCurrentFormat: (format) => void,
  isEnterAction?: boolean
): void
```

#### السلوك:
- **عند الضغط على Enter** (`isEnterAction=true`):
  1. تقسيم السطر الحالي عند المؤشر
  2. إنشاء سطر جديد بالتنسيق المحدد
  3. وضع المؤشر في بداية السطر الجديد

- **لإجراءات أخرى** (`isEnterAction=false`):
  - فقط تغيير تنسيق السطر الحالي

---

### 4. handlePaste.ts
**معالج اللصق**

```typescript
handlePaste(
  e: React.ClipboardEvent,
  editorRef: React.RefObject<HTMLDivElement>,
  getFormatStylesFn: (format) => React.CSSProperties,
  updateContentFn: () => void
): void
```

#### الميزات:
- تصنيف النص الملصق تلقائياً
- استخدام `classifyBatch` مع التصنيف السياقي
- معالجة رؤوس المشاهد المعقدة
- تطبيق `postProcessFormatting` للتصحيح النهائي

---

### 5. postProcessFormatting.ts
**المعالجة النهائية بعد اللصق**

```typescript
postProcessFormatting(
  htmlResult: string,
  getFormatStylesFn: (format) => React.CSSProperties
): string
```

#### الميزات:
- تحويل Bullet Characters إلى شخصية + حوار
- تطبيق قواعد المسافات (Enter Spacing Rules)
- إزالة الأسطر الفارغة غير المرغوبة

---

## الفئات (Classes)

### 1. ScreenplayClassifier.ts
**المصنف الرئيسي للسيناريو**

#### الدوال الثابتة الرئيسية:

```typescript
// التصنيف بالدفعات
classifyBatch(text: string, useContext?: boolean): { text: string; type: string }[]

// التصنيف الهجين (المحتوى + السياق)
classifyHybrid(
  current: string,
  prevType: string | null,
  nextLine: string | null,
  allLines?: string[],
  index?: number,
  useScoring?: boolean
): string

// التصنيف بالنقاط السياقي
classifyWithContext(
  line: string,
  index: number,
  allLines: string[],
  previousTypes?: (string | null)[]
): ClassificationResult

// استخراج رأس المشهد
parseSceneHeaderFromLine(rawLine: string): {
  sceneNum: string;
  timeLocation: string | null;
  placeInline: string | null;
} | null

extractSceneHeaderParts(
  lines: string[],
  startIndex: number
): {
  sceneNum: string;
  timeLocation: string;
  place: string;
  consumedLines: number;
} | null

// قواعد المسافات
getEnterSpacingRule(prevType: string, nextType: string): boolean | null

applyEnterSpacingRules(
  lines: { text: string; type: string }[]
): { text: string; type: string }[]
```

#### دوال الفحص:

```typescript
isBlank(line: string): boolean
isBasmala(line: string): boolean
isSceneHeaderStart(line: string): boolean
isTransition(line: string): boolean
isParenShaped(line: string): boolean
isCharacterLine(line: string, context?): boolean
isLikelyAction(line: string): boolean
isActionVerbStart(line: string): boolean
```

#### دوال التطبيع:

```typescript
normalizeLine(input: string): string
stripTashkeel(s: string): string
easternToWesternDigits(s: string): string
normalizeSeparators(s: string): string
```

---

### 2. StateManager.ts
**مدير الحالة المركزية**

```typescript
class StateManager {
  // الاشتراك في التغييرات
  subscribe(key: string, callback: (value) => void): () => void

  // تعيين/قراءة الحالة
  setState(key: string, value: any): void
  getState(key: string): any
  getAllState(): object
  deleteState(key: string): void
  clearState(): void
}
```

---

### 3. AutoSaveManager.ts
**مدير الحفظ التلقائي**

```typescript
class AutoSaveManager {
  // التحكم في الحفظ التلقائي
  start(saveCallback: (content) => Promise<void>): void
  stop(): void
  startAutoSave(): void
  stopAutoSave(): void

  // تنفيذ الحفظ
  performAutoSave(): Promise<void>
  forceSave(): Promise<void>

  // تحديث المحتوى
  updateContent(content: string): void

  // حالة التغييرات
  getUnsavedChanges(): boolean
  setSaveCallback(callback: (content) => Promise<void>): void
}
```

---

### 4. AdvancedSearchEngine.ts
**محرك البحث والاستبدال المتقدم**

```typescript
class AdvancedSearchEngine {
  // البحث في المحتوى
  searchInContent(
    content: string,
    query: string,
    options?: {
      caseSensitive?: boolean;
      wholeWords?: boolean;
      useRegex?: boolean;
    }
  ): Promise<{
    success: boolean;
    query: string;
    totalMatches: number;
    results: Array<{
      lineNumber: number;
      content: string;
      matches: Array<{ text: string; index: number; length: number }>;
    }>;
    searchTime: number;
  }>

  // الاستبدال في المحتوى
  replaceInContent(
    content: string,
    searchQuery: string,
    replaceText: string,
    options?: {
      caseSensitive?: boolean;
      wholeWords?: boolean;
      useRegex?: boolean;
      replaceAll?: boolean;
    }
  ): Promise<{
    success: boolean;
    originalContent: string;
    newContent: string;
    replacements: number;
    patternSource: string;
    patternFlags: string;
    replaceAll: boolean;
  }>
}
```

---

## الوحدات (Modules)

### 1. SmartFormatter.ts
**محرك التنسيق الذكي**

```typescript
class SmartFormatter {
  static runFullFormat(
    editorElement: HTMLDivElement,
    onUpdate: () => void
  ): Promise<void>
}
```

#### خطوات التنسيق:
1. استخراج النص من المحرر
2. تصنيف السطور باستخدام `classifyBatch`
3. (اختياري) المراجعة بالذكاء الاصطناعي
4. تطبيق قواعد المسافات
5. إعادة بناء HTML

---

### 2. domTextReplacement.ts
**استبدال النص في DOM**

```typescript
applyRegexReplacementToTextNodes(
  root: HTMLElement,
  patternSource: string,
  patternFlags: string,
  replacement: string,
  replaceAll: boolean
): number
```

#### الميزات:
- عبور شجرة DOM بشكل متكرر
- استبدال النص في عقد النص فقط
- دعم استبدال الكل أو الأول فقط

---

## أنواع البيانات (Types)

### TaskType (enum)
**أنواع مهام الوكلاء**

```typescript
enum TaskType {
  // الوكلاء الأساسية
  ANALYSIS = 'analysis',
  CREATIVE = 'creative',
  INTEGRATED = 'integrated',
  COMPLETION = 'completion',

  // الوكلاء التحليلية المتقدمة
  RHYTHM_MAPPING = 'rhythm-mapping',
  CHARACTER_NETWORK = 'character-network',
  DIALOGUE_FORENSICS = 'dialogue-forensics',
  THEMATIC_MINING = 'thematic-mining',

  // وكلاء التوليد الإبداعي
  SCENE_GENERATOR = 'scene-generator',
  CHARACTER_VOICE = 'character-voice',
  WORLD_BUILDER = 'world-builder',

  // المزيد...
}
```

---

### LineContext (interface)
**سياق السطر**

```typescript
interface LineContext {
  previousLines: Array<{ line: string; type: string }>;
  nextLines: Array<{ line: string }>;
  stats: {
    currentLineLength: number;
    currentWordCount: number;
    nextLineLength?: number;
    nextWordCount?: number;
    hasPunctuation: boolean;
    nextHasPunctuation?: boolean;
  };
}
```

---

### ClassificationResult (interface)
**نتيجة التصنيف**

```typescript
interface ClassificationResult {
  type: string;
  confidence: 'low' | 'medium' | 'high';
  scores: { [type: string]: ClassificationScore };
  context: LineContext;
  doubtScore?: number;
  reasoning?: string[];
}
```

---

### Scene (interface)
**مشهد السيناريو**

```typescript
interface Scene {
  id: string;
  heading: string;
  index: number;
  startLineNumber: number;
  endLineNumber?: number;
  lines: string[];
  dialogues: DialogueLine[];
  actionLines: SceneActionLine[];
}
```

---

### Script (interface)
**مستند السيناريو**

```typescript
interface Script {
  rawText: string;
  totalLines: number;
  scenes: Scene[];
  characters: Record<string, Character>;
  dialogueLines: DialogueLine[];
}
```

---

## قواعد التصنيف

### أنواع المحتوى

| النوع | الوصف | مثال |
|-------|-------|------|
| basmala | البسملة | بسم الله الرحمن الرحيم |
| scene-header-top-line | رأس المشهد (السطر العلوي) | مشهد 1 - ليل - داخلي |
| scene-header-3 | رأس المشهد (المكان) | منزل أحمد |
| action | الحركة/الوصف | يدخل أحمد الغرفة بصمت... |
| character | اسم الشخصية | أحمد: |
| dialogue | الحوار | كيف حالك؟ |
| parenthetical | ملاحظة (بين الأقواس) | (بصوت خافت) |
| transition | الانتقال | قطع إلى: |

---

### قواعد المسافات (Enter Spacing Rules)

| من | إلى | مسافة؟ |
|-----|-----|--------|
| basmala | scene-header | ✅ نعم |
| scene-header-3 | action | ✅ نعم |
| action | action | ✅ نعم |
| action | character | ✅ نعم |
| **character** | **dialogue** | **❌ لا** ⭐ |
| dialogue | character | ✅ نعم |
| dialogue | action | ✅ نعم |
| dialogue | transition | ✅ نعم |
| action | transition | ✅ نعم |
| transition | scene-header | ✅ نعم |

---

## الأنماط النمطية (Regex Patterns)

### البسملة
```typescript
/^\s*بسم\s+الله\s+الرحمن\s+الرحيم\s*$/i
```

### رأس المشهد
```typescript
/^\s*(?:مشهد|م\.|scene)\s*([0-9٠-٩]+)\s*(?:[-–—:،]\s*)?(.*)$/i
```

### الوقت/المكان
```typescript
/(?:داخلي|خارجي|د\.|خ\.)/
/(?:ليل|نهار|ل\.|ن\.|صباح|مساء|فجر|ظهر|عصر|مغرب|عشاء)/
```

### الشخصية
```typescript
/^\s*(?:صوت\s+)?[\u0600-\u06FF][\u0600-\u06FF\s]{0,30}:?\s*$/
```

### الانتقال
```typescript
/^\s*(?:قطع|قطع\s+إلى|إلى|مزج|ذوبان|خارج\s+المشهد)\s*$/i
```

---

## ملاحظات مهمة

### 1. دعم RTL
جميع العناصر تستخدم `direction: "rtl"` و `textAlign: "right"` للحركة والوصف.

### 2. الأرقام العربية
يدعم التطبيق كلاً من:
- الأرقام الغربية: 0-9
- الأرقام الشرقية: ٠-٩

### 3. التشكيل
يتم إزالة التشكيل عند التصنيف (`stripTashkeel`).

### 4. الأفعال الحركية
يحتوي التطبيق على قائمة شاملة من الأفعال الحركية العربية (أكثر من 200 فعل).

---

## التطوير المستقبلي

### مميزات مخطط لها:
- [ ] وضع التعاون المتعدد
- [ ] نظام إدارة المشروعات
- [ ] التخطيط البصري للمشاهد
- [ ] التصدير بصيغ إضافية (Final Draft, Fountain)
- [ ] تحليل السيناريو بالذكاء الاصطناعي

---

## الدعم والمساهمة

للإبلاغ عن مشاكل أو اقتراح ميزات جديدة، يرجى فتح Issue في المستودع.

---

**© 2025 Rabyana Team - جميع الحقوق محفوظة**
