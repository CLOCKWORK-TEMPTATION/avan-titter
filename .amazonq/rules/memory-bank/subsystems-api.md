# Subsystems API Documentation

## Overview
This document provides complete API reference for all subsystems in the screenplay editor. Each subsystem is designed as an independent, reusable class with clear interfaces.

---

## Table of Contents
1. [AdvancedSearchEngine](#advancedsearchengine)
2. [AutoSaveManager](#autosavemanager)
3. [StateManager](#statemanager)
4. [CollaborationSystem](#collaborationsystem)
5. [ProjectManager](#projectmanager)
6. [VisualPlanningSystem](#visualplanningsystem)
7. [AIWritingAssistant](#aiwritingassistant)
8. [ScreenplayClassifier](#screenplayclassifier)

---

## AdvancedSearchEngine

**Location**: `src/classes/systems/AdvancedSearchEngine.ts`

**Purpose**: Advanced search and replace engine with regex support, case sensitivity, and whole word matching.

### Methods

#### searchInContent
```typescript
async searchInContent(
  content: string,
  query: string,
  options?: {
    caseSensitive?: boolean;
    wholeWords?: boolean;
    useRegex?: boolean;
  }
): Promise<SearchResult>
```

**Parameters**:
- `content`: Text content to search in
- `query`: Search term or regex pattern
- `options.caseSensitive`: Enable case-sensitive search (default: false)
- `options.wholeWords`: Match whole words only (default: false)
- `options.useRegex`: Treat query as regex pattern (default: false)

**Returns**:
```typescript
{
  success: boolean;
  query: string;
  totalMatches: number;
  results: Array<{
    lineNumber: number;
    content: string;
    matches: Array<{
      text: string;
      index: number;
      length: number;
    }>;
  }>;
  searchTime: number;
  error?: string;
}
```

**Example**:
```typescript
const searchEngine = new AdvancedSearchEngine();
const result = await searchEngine.searchInContent(
  editorContent,
  "مشهد",
  { caseSensitive: false }
);
console.log(`Found ${result.totalMatches} matches`);
```

#### replaceInContent
```typescript
async replaceInContent(
  content: string,
  searchQuery: string,
  replaceText: string,
  options?: {
    caseSensitive?: boolean;
    wholeWords?: boolean;
    useRegex?: boolean;
    replaceAll?: boolean;
  }
): Promise<ReplaceResult>
```

**Parameters**:
- `content`: Text content to perform replacement on
- `searchQuery`: Search term or regex pattern
- `replaceText`: Replacement text
- `options.caseSensitive`: Enable case-sensitive search (default: false)
- `options.wholeWords`: Match whole words only (default: false)
- `options.useRegex`: Treat query as regex pattern (default: false)
- `options.replaceAll`: Replace all occurrences (default: true)

**Returns**:
```typescript
{
  success: boolean;
  originalContent: string;
  newContent: string;
  replacements: number;
  searchQuery: string;
  replaceText: string;
  patternSource: string;
  patternFlags: string;
  replaceAll: boolean;
  error?: string;
}
```

**Example**:
```typescript
const result = await searchEngine.replaceInContent(
  content,
  "القديم",
  "الجديد",
  { replaceAll: true }
);
console.log(`Replaced ${result.replacements} occurrences`);
```

---

## AutoSaveManager

**Location**: `src/classes/systems/AutoSaveManager.ts`

**Purpose**: Automatic content saving with change tracking and configurable intervals.

### Constructor
```typescript
constructor(intervalMs: number = 30000)
```

**Parameters**:
- `intervalMs`: Auto-save interval in milliseconds (default: 30000 = 30 seconds)

### Methods

#### start
```typescript
start(saveCallback: (content: string) => Promise<void>): void
```

**Parameters**:
- `saveCallback`: Async function to execute on auto-save

**Example**:
```typescript
const autoSaveManager = new AutoSaveManager(30000);
autoSaveManager.start(async (content) => {
  await saveToLocalStorage(content);
  console.log("Auto-saved");
});
```

#### stop
```typescript
stop(): void
```

Stops the auto-save interval.

#### updateContent
```typescript
updateContent(content: string): void
```

**Parameters**:
- `content`: Current content to track

Updates internal content and marks changes as unsaved if different from last saved version.

#### performAutoSave
```typescript
async performAutoSave(): Promise<void>
```

Manually triggers auto-save if there are unsaved changes.

#### forceSave
```typescript
async forceSave(): Promise<void>
```

Forces immediate save regardless of unsaved changes status.

#### getUnsavedChanges
```typescript
getUnsavedChanges(): boolean
```

**Returns**: `true` if there are unsaved changes, `false` otherwise.

#### setSaveCallback
```typescript
setSaveCallback(callback: (content: string) => Promise<void>): void
```

**Parameters**:
- `callback`: New save callback function

#### startAutoSave
```typescript
startAutoSave(): void
```

Starts the auto-save interval (clears existing interval if any).

#### stopAutoSave
```typescript
stopAutoSave(): void
```

Stops the auto-save interval.

**Complete Example**:
```typescript
const autoSaveManager = new AutoSaveManager(30000);

// Set up save callback
autoSaveManager.setSaveCallback(async (content) => {
  await saveToDatabase(content);
});

// Start auto-save
autoSaveManager.startAutoSave();

// Update content on changes
const handleContentChange = (newContent: string) => {
  autoSaveManager.updateContent(newContent);
};

// Force save on demand
await autoSaveManager.forceSave();

// Cleanup
autoSaveManager.stopAutoSave();
```

---

## StateManager

**Location**: `src/classes/systems/StateManager.ts`

**Purpose**: Centralized state management with subscription-based reactivity.

### Methods

#### subscribe
```typescript
subscribe(key: string, callback: (value: any) => void): () => void
```

**Parameters**:
- `key`: State key to subscribe to
- `callback`: Function to call when state changes

**Returns**: Unsubscribe function

**Example**:
```typescript
const stateManager = new StateManager();
const unsubscribe = stateManager.subscribe("currentScene", (sceneId) => {
  console.log("Scene changed:", sceneId);
});

// Later: cleanup
unsubscribe();
```

#### setState
```typescript
setState(key: string, value: any): void
```

**Parameters**:
- `key`: State key
- `value`: New value (notifies all subscribers)

#### getState
```typescript
getState(key: string): any
```

**Parameters**:
- `key`: State key

**Returns**: Current value for the key

#### getAllState
```typescript
getAllState(): Record<string, any>
```

**Returns**: Object containing all state key-value pairs

#### clearState
```typescript
clearState(): void
```

Clears all state data.

#### deleteState
```typescript
deleteState(key: string): void
```

**Parameters**:
- `key`: State key to delete (notifies subscribers with `undefined`)

**Complete Example**:
```typescript
const stateManager = new StateManager();

// Subscribe to multiple keys
const unsubScene = stateManager.subscribe("currentScene", (id) => {
  console.log("Scene:", id);
});

const unsubFormat = stateManager.subscribe("currentFormat", (format) => {
  console.log("Format:", format);
});

// Update state
stateManager.setState("currentScene", "scene-1");
stateManager.setState("currentFormat", "dialogue");

// Get state
const scene = stateManager.getState("currentScene");

// Get all state
const allState = stateManager.getAllState();

// Delete specific state
stateManager.deleteState("currentFormat");

// Clear all
stateManager.clearState();

// Cleanup
unsubScene();
unsubFormat();
```

---

## CollaborationSystem

**Location**: `src/classes/systems/CollaborationSystem.ts`

**Purpose**: Multi-user collaboration with collaborator management and commenting system.

### Types
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

### Methods

#### addCollaborator
```typescript
addCollaborator(id: string, name: string, color: string): void
```

**Parameters**:
- `id`: Unique collaborator ID
- `name`: Collaborator name
- `color`: Display color (hex format)

#### removeCollaborator
```typescript
removeCollaborator(id: string): void
```

**Parameters**:
- `id`: Collaborator ID to remove

#### addComment
```typescript
addComment(content: string, author: string, position: any): Comment
```

**Parameters**:
- `content`: Comment text
- `author`: Author name
- `position`: Position data (line, column, etc.)

**Returns**: Created comment object

#### getComments
```typescript
getComments(): Comment[]
```

**Returns**: Array of all comments (copy)

#### getCollaborators
```typescript
getCollaborators(): Collaborator[]
```

**Returns**: Array of all collaborators (copy)

#### onChange
```typescript
onChange(callback: (data: any) => void): () => void
```

**Parameters**:
- `callback`: Function to call on any change

**Returns**: Unsubscribe function

**Change Event Types**:
- `collaborator_added`: `{ type, id, name, color }`
- `collaborator_removed`: `{ type, id }`
- `comment_added`: `{ type, comment }`

**Complete Example**:
```typescript
const collaborationSystem = new CollaborationSystem();

// Listen to changes
const unsubscribe = collaborationSystem.onChange((data) => {
  if (data.type === "comment_added") {
    console.log("New comment:", data.comment);
  } else if (data.type === "collaborator_added") {
    console.log("New collaborator:", data.name);
  }
});

// Add collaborators
collaborationSystem.addCollaborator("user-1", "أحمد", "#FF5733");
collaborationSystem.addCollaborator("user-2", "فاطمة", "#33C3FF");

// Add comment
const comment = collaborationSystem.addComment(
  "هذا المشهد يحتاج تعديل",
  "أحمد",
  { line: 42, column: 10 }
);

// Get all comments
const comments = collaborationSystem.getComments();

// Get all collaborators
const collaborators = collaborationSystem.getCollaborators();

// Remove collaborator
collaborationSystem.removeCollaborator("user-2");

// Cleanup
unsubscribe();
```

---

## ProjectManager

**Location**: `src/classes/systems/ProjectManager.ts`

**Purpose**: Project and template management for screenplay organization.

### Types
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

### Methods

#### createProject
```typescript
createProject(name: string): Project
```

**Parameters**:
- `name`: Project name

**Returns**: Created project object

#### getProjects
```typescript
getProjects(): Project[]
```

**Returns**: Array of all projects (copy)

#### getProject
```typescript
getProject(id: string): Project | undefined
```

**Parameters**:
- `id`: Project ID

**Returns**: Project object or `undefined`

#### updateProject
```typescript
updateProject(id: string, updates: Partial<{ name: string }>): Project | undefined
```

**Parameters**:
- `id`: Project ID
- `updates`: Partial project updates

**Returns**: Updated project or `undefined`

#### deleteProject
```typescript
deleteProject(id: string): void
```

**Parameters**:
- `id`: Project ID to delete

#### addTemplate
```typescript
addTemplate(name: string, content: string): Template
```

**Parameters**:
- `name`: Template name
- `content`: Template HTML content

**Returns**: Created template object

#### getTemplates
```typescript
getTemplates(): Template[]
```

**Returns**: Array of all templates (copy)

**Complete Example**:
```typescript
const projectManager = new ProjectManager();

// Create project
const project = projectManager.createProject("سيناريو جديد");
console.log("Project ID:", project.id);

// Get all projects
const projects = projectManager.getProjects();

// Get specific project
const myProject = projectManager.getProject(project.id);

// Update project
projectManager.updateProject(project.id, {
  name: "سيناريو محدث"
});

// Add template
const template = projectManager.addTemplate(
  "قالب مشهد افتتاحي",
  `<div class="scene-header-3">مشهد 1</div>
   <div class="action">وصف المشهد</div>`
);

// Get all templates
const templates = projectManager.getTemplates();

// Delete project
projectManager.deleteProject(project.id);
```

---

## VisualPlanningSystem

**Location**: `src/classes/systems/VisualPlanningSystem.ts`

**Purpose**: Visual planning with storyboards and beat sheets for screenplay structure.

### Types
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

### Methods

#### addStoryboard
```typescript
addStoryboard(sceneId: string, description: string, imageUrl?: string): Storyboard
```

**Parameters**:
- `sceneId`: Associated scene ID
- `description`: Storyboard description
- `imageUrl`: Optional image URL

**Returns**: Created storyboard object

#### getStoryboards
```typescript
getStoryboards(): Storyboard[]
```

**Returns**: Array of all storyboards (copy)

#### addBeatSheet
```typescript
addBeatSheet(act: number, beat: string, description: string): BeatSheet
```

**Parameters**:
- `act`: Act number (1, 2, 3, etc.)
- `beat`: Beat name (e.g., "Opening Image", "Catalyst")
- `description`: Beat description

**Returns**: Created beat sheet object

#### getBeatSheets
```typescript
getBeatSheets(): BeatSheet[]
```

**Returns**: Array of all beat sheets (copy)

**Complete Example**:
```typescript
const visualPlanning = new VisualPlanningSystem();

// Add storyboards
visualPlanning.addStoryboard(
  "scene-1",
  "لقطة واسعة للمدينة",
  "/images/storyboard-1.jpg"
);

visualPlanning.addStoryboard(
  "scene-2",
  "لقطة قريبة للبطل"
);

// Get all storyboards
const storyboards = visualPlanning.getStoryboards();

// Add beat sheets
visualPlanning.addBeatSheet(
  1,
  "Opening Image",
  "البطل يستيقظ في الصباح"
);

visualPlanning.addBeatSheet(
  1,
  "Catalyst",
  "البطل يتلقى مكالمة غامضة"
);

visualPlanning.addBeatSheet(
  2,
  "Midpoint",
  "البطل يكتشف الحقيقة"
);

// Get all beat sheets
const beatSheets = visualPlanning.getBeatSheets();
```

---

## AIWritingAssistant

**Location**: `src/classes/AIWritingAssistant.ts`

**Purpose**: AI-powered writing assistance for text generation, tone analysis, and improvement suggestions.

### Methods

#### generateText
```typescript
async generateText(prompt: string, context: string): Promise<string>
```

**Parameters**:
- `prompt`: Generation prompt
- `context`: Additional context

**Returns**: Generated text

**Example**:
```typescript
const aiAssistant = new AIWritingAssistant();
const dialogue = await aiAssistant.generateText(
  "اكتب حوار بين شخصيتين",
  "مشهد في مقهى"
);
```

#### analyzeTone
```typescript
async analyzeTone(text: string): Promise<{
  tone: string;
  confidence: number;
  suggestions: string[];
}>
```

**Parameters**:
- `text`: Text to analyze

**Returns**: Tone analysis result

**Example**:
```typescript
const analysis = await aiAssistant.analyzeTone("أنا غاضب جداً!");
console.log("Tone:", analysis.tone);
console.log("Confidence:", analysis.confidence);
```

#### suggestImprovements
```typescript
async suggestImprovements(text: string): Promise<{
  suggestions: string[];
  score: number;
}>
```

**Parameters**:
- `text`: Text to analyze

**Returns**: Improvement suggestions and quality score

**Example**:
```typescript
const result = await aiAssistant.suggestImprovements(
  "الحوار يحتاج تحسين"
);
console.log("Score:", result.score);
console.log("Suggestions:", result.suggestions);
```

---

## ScreenplayClassifier

**Location**: `src/classes/ScreenplayClassifier.ts`

**Purpose**: Screenplay line classification with Arabic text support and pattern matching.

### Static Constants
```typescript
static readonly AR_AB_LETTER = "\u0600-\u06FF"
static readonly EASTERN_DIGITS = "٠٢٣٤٥٦٧٨٩"
static readonly WESTERN_DIGITS = "0123456789"
static readonly ACTION_VERB_LIST = "يدخل|يخرج|ينظر|..."
static readonly ACTION_VERB_SET: Set<string>
```

### Static Methods

#### Text Normalization

##### normalizeLine
```typescript
static normalizeLine(input: string): string
```

Strips diacritics, normalizes separators, and removes control characters.

##### stripTashkeel
```typescript
static stripTashkeel(s: string): string
```

Removes Arabic diacritical marks.

##### easternToWesternDigits
```typescript
static easternToWesternDigits(s: string): string
```

Converts Eastern Arabic numerals to Western numerals.

#### Classification Methods

##### isBlank
```typescript
static isBlank(line: string): boolean
```

Checks if line is empty or whitespace only.

##### isBasmala
```typescript
static isBasmala(line: string): boolean
```

Detects "بسم الله الرحمن الرحيم".

##### isSceneHeaderStart
```typescript
static isSceneHeaderStart(line: string): boolean
```

Detects scene header patterns (e.g., "مشهد 1").

##### isTransition
```typescript
static isTransition(line: string): boolean
```

Detects transition lines (e.g., "قطع إلى").

##### isCharacterLine
```typescript
static isCharacterLine(line: string, context?: {
  lastFormat: string;
  isInDialogueBlock: boolean;
}): boolean
```

Detects character name lines with optional context.

##### isParenShaped
```typescript
static isParenShaped(line: string): boolean
```

Detects parenthetical lines (text in parentheses).

##### isLikelyAction
```typescript
static isLikelyAction(line: string): boolean
```

Detects action description lines.

##### isActionVerbStart
```typescript
static isActionVerbStart(line: string): boolean
```

Checks if line starts with action verb.

#### Utility Methods

##### wordCount
```typescript
static wordCount(s: string): number
```

Counts words in string.

##### hasSentencePunctuation
```typescript
static hasSentencePunctuation(s: string): boolean
```

Checks for sentence-ending punctuation.

### Instance Properties

```typescript
Patterns: {
  sceneHeader1: RegExp;
  sceneHeader2: {
    time: RegExp;
    inOut: RegExp;
  };
  sceneHeader3: RegExp;
}
```

**Complete Example**:
```typescript
// Static methods (no instantiation needed)
const normalized = ScreenplayClassifier.normalizeLine("مَشْهَد ١");
const isScene = ScreenplayClassifier.isSceneHeaderStart("مشهد 1");
const isChar = ScreenplayClassifier.isCharacterLine("أحمد:");
const isAction = ScreenplayClassifier.isLikelyAction("يدخل أحمد الغرفة");

// Instance methods
const classifier = new ScreenplayClassifier();
if (classifier.Patterns.sceneHeader3.test(line)) {
  console.log("Scene header type 3 detected");
}

// With context
const context = {
  lastFormat: "character",
  isInDialogueBlock: true
};
const isCharacter = ScreenplayClassifier.isCharacterLine(line, context);
```

---

## Integration Patterns

### React Component Integration
```typescript
import { useRef, useEffect } from "react";
import { AdvancedSearchEngine } from "../classes/systems/AdvancedSearchEngine";
import { AutoSaveManager } from "../classes/systems/AutoSaveManager";
import { StateManager } from "../classes/systems/StateManager";

export default function MyComponent() {
  // Instantiate systems with useRef
  const searchEngine = useRef(new AdvancedSearchEngine());
  const autoSaveManager = useRef(new AutoSaveManager(30000));
  const stateManager = useRef(new StateManager());

  useEffect(() => {
    // Setup auto-save
    autoSaveManager.current.setSaveCallback(async (content) => {
      await saveToStorage(content);
    });
    autoSaveManager.current.startAutoSave();

    // Subscribe to state changes
    const unsubscribe = stateManager.current.subscribe(
      "currentScene",
      (sceneId) => {
        console.log("Scene changed:", sceneId);
      }
    );

    // Cleanup
    return () => {
      autoSaveManager.current.stopAutoSave();
      unsubscribe();
    };
  }, []);

  const handleSearch = async (query: string) => {
    const result = await searchEngine.current.searchInContent(
      content,
      query
    );
    console.log(`Found ${result.totalMatches} matches`);
  };

  return <div>{/* Component JSX */}</div>;
}
```

### Multi-System Coordination
```typescript
// Coordinate multiple systems
const projectManager = useRef(new ProjectManager());
const visualPlanning = useRef(new VisualPlanningSystem());
const collaborationSystem = useRef(new CollaborationSystem());

// Create project with visual planning
const project = projectManager.current.createProject("فيلم جديد");

// Add beat sheets for structure
visualPlanning.current.addBeatSheet(1, "Opening", "البداية");
visualPlanning.current.addBeatSheet(2, "Midpoint", "نقطة المنتصف");

// Add collaborators
collaborationSystem.current.addCollaborator("user-1", "أحمد", "#FF5733");

// Listen to collaboration events
collaborationSystem.current.onChange((data) => {
  if (data.type === "comment_added") {
    // Handle new comment
  }
});
```

---

## Best Practices

### 1. System Lifecycle
- Instantiate systems once using `useRef` in React components
- Clean up subscriptions and intervals in `useEffect` cleanup functions
- Use async/await for all async system methods

### 2. Error Handling
```typescript
try {
  const result = await searchEngine.current.searchInContent(content, query);
  if (result.success) {
    // Handle success
  } else {
    console.error("Search failed:", result.error);
  }
} catch (error) {
  console.error("Unexpected error:", error);
}
```

### 3. Type Safety
```typescript
// Use explicit types for system instances
const stateManager = useRef<StateManager>(new StateManager());
const autoSaveManager = useRef<AutoSaveManager>(new AutoSaveManager());
```

### 4. Performance
- Systems are lightweight and stateless where possible
- Use refs to avoid re-renders
- Batch state updates when coordinating multiple systems

### 5. Testing
```typescript
// Systems are easily testable
describe("AdvancedSearchEngine", () => {
  it("should find matches", async () => {
    const engine = new AdvancedSearchEngine();
    const result = await engine.searchInContent("test content", "test");
    expect(result.success).toBe(true);
    expect(result.totalMatches).toBeGreaterThan(0);
  });
});
```

---

## Quick Reference

| System | Primary Use Case | Key Methods |
|--------|-----------------|-------------|
| AdvancedSearchEngine | Search & replace | `searchInContent`, `replaceInContent` |
| AutoSaveManager | Auto-save | `start`, `updateContent`, `forceSave` |
| StateManager | State management | `subscribe`, `setState`, `getState` |
| CollaborationSystem | Multi-user | `addCollaborator`, `addComment` |
| ProjectManager | Project organization | `createProject`, `addTemplate` |
| VisualPlanningSystem | Visual planning | `addStoryboard`, `addBeatSheet` |
| AIWritingAssistant | AI assistance | `generateText`, `analyzeTone` |
| ScreenplayClassifier | Line classification | `isCharacterLine`, `isLikelyAction` |
