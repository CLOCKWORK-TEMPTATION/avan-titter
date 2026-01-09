# System Architecture Documentation

## Overview
This document provides detailed documentation for all subsystems in the screenplay editor application. Each system is designed as an independent, reusable class that can be instantiated and used throughout the application.

---

## Core Systems (`/src/classes/systems/`)

### 1. AdvancedSearchEngine
**Purpose**: Advanced search and replace engine with regex support

**Location**: `src/classes/systems/AdvancedSearchEngine.ts`

**Key Features**:
- Line-by-line content searching
- Regex pattern matching
- Case-sensitive/insensitive search
- Whole word matching
- Replace all or single occurrence

**API Methods**:

```typescript
// Search in content
await searchEngine.searchInContent(content: string, query: string, options?: {
  caseSensitive?: boolean;
  wholeWords?: boolean;
  useRegex?: boolean;
})

// Returns:
{
  success: boolean;
  query: string;
  totalMatches: number;
  results: Array<{
    lineNumber: number;
    content: string;
    matches: Array<{ text: string; index: number; length: number }>;
  }>;
  searchTime: number;
}

// Replace in content
await searchEngine.replaceInContent(
  content: string,
  searchQuery: string,
  replaceText: string,
  options?: {
    caseSensitive?: boolean;
    wholeWords?: boolean;
    useRegex?: boolean;
    replaceAll?: boolean;
  }
)

// Returns:
{
  success: boolean;
  originalContent: string;
  newContent: string;
  replacements: number;
  patternSource: string;
  patternFlags: string;
}
```

**Usage Example**:
```typescript
const searchEngine = useRef(new AdvancedSearchEngine());

// Search
const result = await searchEngine.current.searchInContent(
  editorContent,
  "مشهد",
  { caseSensitive: false }
);

// Replace
const replaceResult = await searchEngine.current.replaceInContent(
  editorContent,
  "القديم",
  "الجديد",
  { replaceAll: true }
);
```

---

### 2. AutoSaveManager
**Purpose**: Automatic content saving with change tracking

**Location**: `src/classes/systems/AutoSaveManager.ts`

**Key Features**:
- Configurable auto-save interval (default: 30 seconds)
- Tracks unsaved changes
- Async save callback support
- Manual force save
- Start/stop auto-save functionality

**API Methods**:

```typescript
// Constructor
new AutoSaveManager(intervalMs?: number)

// Set save callback
setSaveCallback(callback: (content: string) => Promise<void>)

// Start auto-save
startAutoSave()

// Stop auto-save
stopAutoSave()

// Update content (triggers change detection)
updateContent(content: string)

// Force immediate save
await forceSave()

// Check for unsaved changes
getUnsavedChanges(): boolean
```

**Usage Example**:
```typescript
const autoSaveManager = useRef(new AutoSaveManager(30000));

useEffect(() => {
  autoSaveManager.current.setSaveCallback(async (content) => {
    await saveToLocalStorage(content);
    console.log("Auto-saved");
  });
  
  autoSaveManager.current.startAutoSave();
  
  return () => {
    autoSaveManager.current.stopAutoSave();
  };
}, []);

// Update content on changes
const handleContentChange = (newContent: string) => {
  autoSaveManager.current.updateContent(newContent);
};
```

---

### 3. StateManager
**Purpose**: Centralized state management with subscription system

**Location**: `src/classes/systems/StateManager.ts`

**Key Features**:
- Key-value state storage using Map
- Subscription-based reactivity
- Multiple subscribers per key
- State cleanup utilities

**API Methods**:

```typescript
// Subscribe to state changes
subscribe(key: string, callback: (value: any) => void): () => void

// Set state value (notifies subscribers)
setState(key: string, value: any)

// Get state value
getState(key: string): any

// Get all state as object
getAllState(): Record<string, any>

// Delete specific state key
deleteState(key: string)

// Clear all state
clearState()
```

**Usage Example**:
```typescript
const stateManager = useRef(new StateManager());

// Subscribe to changes
useEffect(() => {
  const unsubscribe = stateManager.current.subscribe(
    "currentScene",
    (sceneId) => {
      console.log("Scene changed:", sceneId);
    }
  );
  
  return unsubscribe; // Cleanup
}, []);

// Update state
stateManager.current.setState("currentScene", "scene-1");

// Get state
const currentScene = stateManager.current.getState("currentScene");
```

---

### 4. CollaborationSystem
**Purpose**: Multi-user collaboration and commenting system

**Location**: `src/classes/systems/CollaborationSystem.ts`

**Key Features**:
- Collaborator management
- Comment system with timestamps
- Change notification callbacks
- Real-time collaboration support

**API Methods**:

```typescript
// Add collaborator
addCollaborator(id: string, name: string, color: string)

// Remove collaborator
removeCollaborator(id: string)

// Add comment
addComment(content: string, author: string, position: any): Comment

// Get all comments
getComments(): Comment[]

// Get all collaborators
getCollaborators(): Collaborator[]

// Subscribe to changes
onChange(callback: (data: any) => void): () => void
```

**Data Types**:
```typescript
interface Collaborator {
  id: string;
  name: string;
  color: string;
}

interface Comment {
  id: string;
  content: string;
  author: string;
  timestamp: Date;
  position: any;
}
```

**Usage Example**:
```typescript
const collaborationSystem = useRef(new CollaborationSystem());

// Add collaborator
collaborationSystem.current.addCollaborator(
  "user-1",
  "أحمد",
  "#FF5733"
);

// Add comment
const comment = collaborationSystem.current.addComment(
  "هذا المشهد يحتاج تعديل",
  "أحمد",
  { line: 42, column: 10 }
);

// Listen to changes
collaborationSystem.current.onChange((data) => {
  if (data.type === "comment_added") {
    console.log("New comment:", data.comment);
  }
});
```

---

### 5. ProjectManager
**Purpose**: Project and template management

**Location**: `src/classes/systems/ProjectManager.ts`

**Key Features**:
- Create and manage multiple projects
- Template system for reusable content
- Project metadata tracking (creation date, last modified)
- CRUD operations for projects

**API Methods**:

```typescript
// Create new project
createProject(name: string): Project

// Get all projects
getProjects(): Project[]

// Get specific project
getProject(id: string): Project | undefined

// Update project
updateProject(id: string, updates: Partial<{ name: string }>): Project | undefined

// Delete project
deleteProject(id: string)

// Add template
addTemplate(name: string, content: string): Template

// Get all templates
getTemplates(): Template[]
```

**Data Types**:
```typescript
interface Project {
  id: string;
  name: string;
  createdAt: Date;
  lastModified: Date;
}

interface Template {
  id: string;
  name: string;
  content: string;
}
```

**Usage Example**:
```typescript
const projectManager = useRef(new ProjectManager());

// Create project
const project = projectManager.current.createProject("سيناريو جديد");

// Add template
const template = projectManager.current.addTemplate(
  "قالب مشهد افتتاحي",
  `<div class="scene-header-3">مشهد 1</div>
   <div class="action">وصف المشهد</div>`
);

// Update project
projectManager.current.updateProject(project.id, {
  name: "سيناريو محدث"
});
```

---

### 6. VisualPlanningSystem
**Purpose**: Visual planning with storyboards and beat sheets

**Location**: `src/classes/systems/VisualPlanningSystem.ts`

**Key Features**:
- Storyboard management per scene
- Beat sheet tracking for story structure
- Act-based organization
- Image URL support for storyboards

**API Methods**:

```typescript
// Add storyboard
addStoryboard(sceneId: string, description: string, imageUrl?: string): Storyboard

// Get all storyboards
getStoryboards(): Storyboard[]

// Add beat sheet entry
addBeatSheet(act: number, beat: string, description: string): BeatSheet

// Get all beat sheets
getBeatSheets(): BeatSheet[]
```

**Data Types**:
```typescript
interface Storyboard {
  id: string;
  sceneId: string;
  description: string;
  imageUrl?: string;
}

interface BeatSheet {
  id: string;
  act: number;
  beat: string;
  description: string;
}
```

**Usage Example**:
```typescript
const visualPlanning = useRef(new VisualPlanningSystem());

// Add storyboard
visualPlanning.current.addStoryboard(
  "scene-1",
  "لقطة واسعة للمدينة",
  "/images/storyboard-1.jpg"
);

// Add beat sheet
visualPlanning.current.addBeatSheet(
  1,
  "Opening Image",
  "البطل يستيقظ في الصباح"
);
```

---

## Core Classes (`/src/classes/`)

### 7. AIWritingAssistant
**Purpose**: AI-powered writing assistance

**Location**: `src/classes/AIWritingAssistant.ts`

**Key Features**:
- Text generation based on prompts
- Tone analysis
- Improvement suggestions

**API Methods**:

```typescript
// Generate text
await generateText(prompt: string, context: string): Promise<string>

// Analyze tone
await analyzeTone(text: string): Promise<{
  tone: string;
  confidence: number;
  suggestions: string[];
}>

// Suggest improvements
await suggestImprovements(text: string): Promise<{
  suggestions: string[];
  score: number;
}>
```

**Usage Example**:
```typescript
const aiAssistant = useRef(new AIWritingAssistant());

// Generate dialogue
const dialogue = await aiAssistant.current.generateText(
  "اكتب حوار بين شخصيتين",
  "مشهد في مقهى"
);

// Analyze tone
const analysis = await aiAssistant.current.analyzeTone(
  "أنا غاضب جداً!"
);
```

---

### 8. ScreenplayClassifier
**Purpose**: Screenplay line classification and pattern matching

**Location**: `src/classes/ScreenplayClassifier.ts`

**Key Features**:
- Arabic text normalization
- Scene header detection
- Character line identification
- Action/dialogue classification
- Transition detection
- ReDoS-protected regex patterns

**Static Constants**:
```typescript
static readonly AR_AB_LETTER = "\u0600-\u06FF"
static readonly EASTERN_DIGITS = "٠٢٣٤٥٦٧٨٩"
static readonly WESTERN_DIGITS = "0123456789"
static readonly ACTION_VERB_LIST = "يدخل|يخرج|ينظر|..."
```

**Static Methods**:
```typescript
// Text normalization
static normalizeLine(input: string): string
static stripTashkeel(s: string): string
static easternToWesternDigits(s: string): string

// Classification
static isBlank(line: string): boolean
static isBasmala(line: string): boolean
static isSceneHeaderStart(line: string): boolean
static isTransition(line: string): boolean
static isCharacterLine(line: string, context?: object): boolean
static isLikelyAction(line: string): boolean
static isParenShaped(line: string): boolean

// Utilities
static wordCount(s: string): number
static hasSentencePunctuation(s: string): boolean
```

**Instance Properties**:
```typescript
Patterns: {
  sceneHeader1: RegExp;
  sceneHeader2: { time: RegExp; inOut: RegExp };
  sceneHeader3: RegExp;
}
```

**Usage Example**:
```typescript
// Static methods (no instantiation needed)
const normalized = ScreenplayClassifier.normalizeLine("مَشْهَد ١");
const isScene = ScreenplayClassifier.isSceneHeaderStart("مشهد 1");
const isChar = ScreenplayClassifier.isCharacterLine("أحمد:");

// Instance methods
const classifier = new ScreenplayClassifier();
if (classifier.Patterns.sceneHeader3.test(line)) {
  // Handle scene header
}
```

---

## Event Handlers (`/src/handlers/`)

### Handler Factory Pattern
All handlers use the factory pattern to inject dependencies, making them testable and reusable.

### 9. handleKeyDown
**Purpose**: Keyboard event processing

**Location**: `src/handlers/handleKeyDown.ts`

**Supported Shortcuts**:
- `Tab` / `Shift+Tab`: Navigate between formats
- `Enter`: Apply next format based on current context
- `Ctrl+B`: Bold
- `Ctrl+I`: Italic
- `Ctrl+U`: Underline
- `Ctrl+1`: Scene header
- `Ctrl+2`: Character
- `Ctrl+3`: Dialogue
- `Ctrl+4`: Action
- `Ctrl+6`: Transition
- `Ctrl+F`: Search
- `Ctrl+H`: Replace

**Factory Signature**:
```typescript
createHandleKeyDown(
  currentFormat: string,
  getNextFormatOnTab: (format: string, shiftKey: boolean) => string,
  getNextFormatOnEnter: (format: string) => string,
  applyFormatToCurrentLine: (format: string) => void,
  formatText: (command: string, value?: string) => void,
  setShowSearchDialog: (show: boolean) => void,
  setShowReplaceDialog: (show: boolean) => void,
  updateContent: () => void
): (e: React.KeyboardEvent) => void
```

---

### 10. handleSearch
**Purpose**: Content search functionality

**Location**: `src/handlers/handleSearch.ts`

**Factory Signature**:
```typescript
createHandleSearch(
  searchTerm: string,
  editorRef: React.RefObject<HTMLDivElement | null>,
  searchEngine: React.MutableRefObject<AdvancedSearchEngine>,
  setShowSearchDialog: (show: boolean) => void
): () => Promise<void>
```

---

### 11. handleReplace
**Purpose**: Content replacement functionality

**Location**: `src/handlers/handleReplace.ts`

**Factory Signature**:
```typescript
createHandleReplace(
  searchTerm: string,
  replaceTerm: string,
  editorRef: React.RefObject<HTMLDivElement | null>,
  searchEngine: React.MutableRefObject<AdvancedSearchEngine>,
  updateContent: () => void,
  setShowReplaceDialog: (show: boolean) => void,
  setSearchTerm: (term: string) => void,
  setReplaceTerm: (term: string) => void
): () => Promise<void>
```

---

### 12. handleCharacterRename
**Purpose**: Global character name replacement

**Location**: `src/handlers/handleCharacterRename.ts`

**Features**:
- Regex-based character name matching
- DOM text node replacement
- Case-insensitive matching
- Replacement count tracking

**Factory Signature**:
```typescript
createHandleCharacterRename(
  oldCharacterName: string,
  newCharacterName: string,
  editorRef: React.RefObject<HTMLDivElement | null>,
  updateContent: () => void,
  setShowCharacterRename: (show: boolean) => void,
  setOldCharacterName: (name: string) => void,
  setNewCharacterName: (name: string) => void
): () => void
```

---

### 13. handleAIReview
**Purpose**: AI-powered content review

**Location**: `src/handlers/handleAIReview.ts`

**Factory Signature**:
```typescript
createHandleAIReview(
  editorRef: React.RefObject<HTMLDivElement | null>,
  setIsReviewing: (reviewing: boolean) => void,
  setReviewResult: (result: string) => void
): () => Promise<void>
```

---

## Helper Functions (`/src/helpers/`)

### 14. getFormatStyles
**Purpose**: CSS style computation for screenplay elements

**Location**: `src/helpers/getFormatStyles.ts`

**Supported Formats**:
- `basmala`: Bismillah text
- `scene-header-top-line`: Scene header with metadata
- `scene-header-1`, `scene-header-2`, `scene-header-3`: Scene headers
- `action`: Action descriptions
- `character`: Character names
- `dialogue`: Character dialogue
- `parenthetical`: Parenthetical directions
- `transition`: Scene transitions

**Signature**:
```typescript
getFormatStyles(
  formatType: string,
  selectedSize?: string
): React.CSSProperties
```

---

### 15. applyFormatToCurrentLine
**Purpose**: Apply formatting to current cursor line

**Location**: `src/helpers/applyFormatToCurrentLine.ts`

**Signature**:
```typescript
applyFormatToCurrentLine(
  formatType: string,
  getFormatStylesFn: (formatType: string) => React.CSSProperties,
  setCurrentFormat: (format: string) => void
): void
```

---

### 16. formatText
**Purpose**: Apply text formatting commands

**Location**: `src/helpers/formatText.ts`

**Signature**:
```typescript
formatText(command: string, value?: string): void
```

**Supported Commands**: bold, italic, underline, strikeThrough, etc.

---

### 17. handlePaste
**Purpose**: Intelligent paste handling with automatic classification

**Location**: `src/helpers/handlePaste.ts`

**Features**:
- Line-by-line classification
- Bullet character detection
- Context-aware formatting
- Post-processing correction
- Style preservation

**Signature**:
```typescript
handlePaste(
  e: React.ClipboardEvent,
  editorRef: React.RefObject<HTMLDivElement | null>,
  getFormatStylesFn: (formatType: string) => React.CSSProperties,
  updateContentFn: () => void
): void
```

---

### 18. postProcessFormatting
**Purpose**: Post-paste formatting correction

**Location**: `src/helpers/postProcessFormatting.ts`

**Features**:
- Bullet character to character/dialogue conversion
- Misclassified dialogue to action correction
- Action verb pattern detection

**Signature**:
```typescript
postProcessFormatting(
  htmlResult: string,
  getFormatStylesFn: (formatType: string) => React.CSSProperties
): string
```

---

### 19. SceneHeaderAgent
**Purpose**: Scene header detection and formatting

**Location**: `src/helpers/SceneHeaderAgent.ts`

**Features**:
- Multi-part scene header parsing
- Time/location detection
- Complex Arabic scene header support
- HTML generation with proper styling

**Signature**:
```typescript
SceneHeaderAgent(
  line: string,
  ctx: { inDialogue: boolean },
  getFormatStylesFn: (formatType: string) => React.CSSProperties
): { html: string; processed: boolean } | null
```

---

## Integration Patterns

### System Instantiation Pattern
```typescript
// In component
const stateManager = useRef(new StateManager());
const autoSaveManager = useRef(new AutoSaveManager());
const searchEngine = useRef(new AdvancedSearchEngine());
const collaborationSystem = useRef(new CollaborationSystem());
const projectManager = useRef(new ProjectManager());
const visualPlanning = useRef(new VisualPlanningSystem());
const aiAssistant = useRef(new AIWritingAssistant());
const screenplayClassifier = useRef(new ScreenplayClassifier());
```

### Handler Creation Pattern
```typescript
// Create handlers with dependencies
const handleKeyDown = createHandleKeyDown(
  currentFormat,
  getNextFormatOnTab,
  getNextFormatOnEnter,
  applyFormatToCurrentLine,
  formatText,
  setShowSearchDialog,
  setShowReplaceDialog,
  updateContent
);

const handleSearch = createHandleSearch(
  searchTerm,
  editorRef,
  searchEngine,
  setShowSearchDialog
);
```

### Helper Usage Pattern
```typescript
// Use helpers directly
const styles = getFormatStyles("character", "14pt");
applyFormatToCurrentLine("dialogue", getFormatStyles, setCurrentFormat);
formatText("bold");
```

---

## Best Practices

### 1. System Lifecycle Management
- Instantiate systems once using `useRef`
- Clean up subscriptions and intervals in `useEffect` cleanup
- Use async/await for system methods that return promises

### 2. Error Handling
- All search/replace operations return success/error objects
- Use try-catch blocks for async operations
- Provide user feedback via alerts or UI notifications

### 3. Performance Optimization
- Systems are lightweight and stateless where possible
- Use refs to avoid re-renders
- Batch state updates when possible

### 4. Type Safety
- All systems have explicit TypeScript types
- Use interfaces for complex data structures
- Leverage type inference where appropriate
