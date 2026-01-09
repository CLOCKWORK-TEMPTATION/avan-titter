# Development Guidelines

## Code Quality Standards

### File Documentation
- Every file begins with JSDoc block comments explaining purpose and functionality
- Use `@file`, `@class`, `@description`, `@enum`, `@interface`, `@property` tags consistently
- Arabic descriptions are acceptable for domain-specific components (e.g., "مصنف السيناريو")
- Document complex logic with inline comments explaining the "why" not just the "what"

### Naming Conventions
- **Classes**: PascalCase (e.g., `ScreenplayClassifier`, `AdvancedSearchEngine`, `AIWritingAssistant`)
- **Interfaces**: PascalCase with descriptive names (e.g., `AIAgentConfig`, `DialogueLine`, `ProcessedFile`)
- **Enums**: PascalCase for enum names, SCREAMING_SNAKE_CASE for values (e.g., `TaskType.ANALYSIS`, `TaskCategory.CORE`)
- **Constants**: SCREAMING_SNAKE_CASE for static readonly (e.g., `AR_AB_LETTER`, `EASTERN_DIGITS`, `ACTION_VERB_LIST`)
- **Functions**: camelCase with descriptive verb-noun pairs (e.g., `applyFormatToCurrentLine`, `handleKeyDown`, `createHandleSearch`)
- **Variables**: camelCase (e.g., `htmlContent`, `isDarkMode`, `currentFormat`)
- **React Components**: PascalCase (e.g., `ScreenplayEditorEnhanced`, `AdvancedAgentsPopup`, `ExportDialog`)

### Code Formatting
- **Indentation**: 2 spaces (consistent across all TypeScript/TSX files)
- **Line Length**: Pragmatic approach - break long lines for readability, especially in JSX
- **String Quotes**: Double quotes for strings, JSX attributes
- **Semicolons**: Always use semicolons to terminate statements
- **Trailing Commas**: Use in multi-line objects and arrays
- **Arrow Functions**: Prefer arrow functions for callbacks and functional components

### TypeScript Standards
- **Strict Typing**: Use explicit types for function parameters and return values
- **Interface over Type**: Prefer `interface` for object shapes, `type` for unions/intersections
- **Const Enums**: Use `const enum` for compile-time constant enumerations (reduces bundle size)
- **Optional Properties**: Use `?` for optional interface properties
- **Type Inference**: Allow TypeScript to infer types for simple variable assignments
- **Generic Constraints**: Use generics with constraints when needed (e.g., `Record<string, Character>`)

### React Patterns
- **Functional Components**: Use function declarations with explicit return types when complex
- **Hooks**: Import hooks explicitly from React (`useState`, `useEffect`, `useRef`)
- **Refs**: Use `useRef` with explicit types (e.g., `useRef<HTMLDivElement>(null)`)
- **Event Handlers**: Type event parameters explicitly (e.g., `e: React.ClipboardEvent`, `e: React.KeyboardEvent`)
- **Client Components**: Mark interactive components with `"use client"` directive at top of file
- **Props**: Define props interfaces for reusable components

## Architectural Patterns

### Component Organization
```typescript
// 1. Imports - grouped by category
import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { Icon1, Icon2 } from "lucide-react"; // External UI libraries
import ComponentA from "./ComponentA"; // Local components
import { ClassA } from "../classes/ClassA"; // Business logic classes
import { helperFunction } from "../helpers/helperFunction"; // Utilities
import type { TypeA, TypeB } from "../types/types"; // Type imports

// 2. Component definition
export default function ComponentName() {
  // 3. State declarations
  const [state, setState] = useState(initialValue);
  
  // 4. Refs
  const ref = useRef<HTMLDivElement>(null);
  
  // 5. Helper functions
  const helperFunction = () => { /* ... */ };
  
  // 6. Effects
  useEffect(() => { /* ... */ }, [dependencies]);
  
  // 7. JSX return
  return (/* ... */);
}
```

### Class Structure
```typescript
/**
 * @class ClassName
 * @description Purpose of the class
 */
export class ClassName {
  // 1. Static constants
  static readonly CONSTANT_NAME = "value";
  
  // 2. Static methods
  static staticMethod(): ReturnType { /* ... */ }
  
  // 3. Instance properties
  propertyName: PropertyType;
  
  // 4. Constructor
  constructor() { /* ... */ }
  
  // 5. Instance methods
  methodName(): ReturnType { /* ... */ }
}
```

### Separation of Concerns
- **Components** (`/src/components/`): UI rendering and user interaction only
- **Classes** (`/src/classes/`): Business logic, algorithms, data processing
- **Handlers** (`/src/handlers/`): Event processing, orchestration between components and classes
- **Helpers** (`/src/helpers/`): Pure utility functions, formatting, transformations
- **Config** (`/src/config/`): Configuration objects, constants, agent definitions
- **Types** (`/src/types/`): TypeScript interfaces, enums, type definitions

### Handler Factory Pattern
Create handlers using factory functions that accept dependencies:
```typescript
export const createHandleKeyDown = (
  currentFormat: string,
  getNextFormatOnTab: Function,
  getNextFormatOnEnter: Function,
  applyFormatToCurrentLine: Function,
  formatText: Function,
  setShowSearchDialog: Function,
  setShowReplaceDialog: Function,
  updateContent: Function
) => {
  return (e: React.KeyboardEvent) => {
    // Handler implementation
  };
};
```

### System Classes Pattern
Encapsulate complex subsystems in dedicated classes:
```typescript
// Instantiate once with useRef to persist across renders
const stateManager = useRef(new StateManager());
const autoSaveManager = useRef(new AutoSaveManager());
const searchEngine = useRef(new AdvancedSearchEngine());
```

## Common Implementation Patterns

### Regular Expression Patterns
- **ReDoS Protection**: Use atomic groups and possessive quantifiers to prevent catastrophic backtracking
- **Unicode Support**: Include Arabic character ranges (`\u0600-\u06FF`) in patterns
- **Normalization**: Strip diacritics and normalize separators before pattern matching
```typescript
static readonly CHARACTER_RE = new RegExp(
  "^\\s*(?:صوت\\s+)?[" +
  ScreenplayClassifier.AR_AB_LETTER +
  "][" +
  ScreenplayClassifier.AR_AB_LETTER +
  "\\s]{0,30}:?\\s*$"
);
```

### Error Handling with Retry Logic
Implement exponential backoff for network requests:
```typescript
const fetchWithRetry = async (
  url: string,
  options: RequestInit,
  retries: number = 3,
  delay: number = 1000
): Promise<Response> => {
  try {
    const response = await fetch(url, options);
    if (response.ok) return response;
    if (response.status >= 400 && response.status < 500) {
      throw new Error(`Client error: ${response.status}`);
    }
    throw new Error(`Server error: ${response.status}`);
  } catch (error) {
    if (retries === 0) throw error;
    await new Promise((resolve) => setTimeout(resolve, delay));
    return fetchWithRetry(url, options, retries - 1, delay * 2);
  }
};
```

### State Management Pattern
- Use React hooks for local component state
- Use refs for mutable values that don't trigger re-renders (e.g., system class instances)
- Lift state up when multiple components need access
- Pass callbacks down for child components to update parent state

### Style Application Pattern
Convert React CSSProperties objects to inline style strings:
```typescript
const cssObjectToString = (styles: React.CSSProperties): string => {
  return Object.entries(styles)
    .map(([key, value]) => {
      const cssKey = key.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
      return `${cssKey}: ${value}`;
    })
    .join("; ");
};
```

### Conditional Rendering Pattern
Use ternary operators for simple conditions, logical AND for conditional rendering:
```typescript
// Simple toggle
{isDarkMode ? <Sun size={20} /> : <Moon size={20} />}

// Conditional render
{showSearchDialog && (
  <div className="dialog">
    {/* Dialog content */}
  </div>
)}
```

## Internal API Usage

### ScreenplayClassifier API
```typescript
// Static utility methods - no instantiation needed for these
ScreenplayClassifier.isBlank(line: string): boolean
ScreenplayClassifier.isBasmala(line: string): boolean
ScreenplayClassifier.isSceneHeaderStart(line: string): boolean
ScreenplayClassifier.isTransition(line: string): boolean
ScreenplayClassifier.isCharacterLine(line: string, context?: object): boolean
ScreenplayClassifier.isLikelyAction(line: string): boolean
ScreenplayClassifier.normalizeLine(input: string): string
ScreenplayClassifier.stripTashkeel(s: string): string
ScreenplayClassifier.easternToWesternDigits(s: string): string

// Instance methods - require instantiation
const classifier = new ScreenplayClassifier();
// Access patterns via classifier.Patterns
```

### AdvancedSearchEngine API
```typescript
const searchEngine = new AdvancedSearchEngine();

// Search with options
await searchEngine.searchInContent(content, query, {
  caseSensitive: false,
  wholeWords: false,
  useRegex: false
});

// Replace with options
await searchEngine.replaceInContent(content, searchQuery, replaceText, {
  caseSensitive: false,
  wholeWords: false,
  useRegex: false,
  replaceAll: true
});
```

### Helper Functions API
```typescript
// Format helpers
getFormatStyles(formatType: string, selectedSize: string): React.CSSProperties
formatText(command: string): void
applyFormatToCurrentLine(
  formatType: string,
  getFormatStyles: Function,
  setCurrentFormat: Function
): void

// Processing helpers
postProcessFormatting(htmlResult: string, getFormatStyles: Function): string
handlePaste(
  e: React.ClipboardEvent,
  editorRef: RefObject<HTMLDivElement>,
  getFormatStyles: Function,
  updateContent: Function
): void
```

## Code Idioms

### Nullish Coalescing and Optional Chaining
```typescript
// Prefer nullish coalescing for default values
const apiKey = process.env.GEMINI_API_KEY || '';
const firstToken = line.trim().split(/\s+/)[0] ?? "";

// Use optional chaining for safe property access
const text = editorRef.current?.innerText || "";
```

### Array Methods for Functional Programming
```typescript
// Map, filter, reduce patterns
const results = items
  .filter(item => item.isValid)
  .map(item => transform(item))
  .reduce((acc, item) => acc + item.value, 0);

// Array.from for iterables
const matches = Array.from(line.matchAll(searchPattern));
```

### Object Destructuring
```typescript
// Destructure props and state
const { name, description, category } = agentConfig;
const [state, setState] = useState(initialValue);

// Destructure with defaults
const { caseSensitive = false, wholeWords = false } = options;
```

### Template Literals
```typescript
// Multi-line strings and interpolation
const className = `min-h-screen ${isDarkMode ? "dark bg-gray-900" : "bg-white"}`;
const message = `خطأ في البحث: ${error}`;
```

### Spread Operator
```typescript
// Object spreading for style merging
Object.assign(div.style, getFormatStyles(className));

// Array spreading
const allAgents = [...coreAgents, ...advancedAgents];
```

## Popular Annotations

### JSDoc Tags
- `@file` - File-level documentation
- `@class` - Class documentation
- `@description` - Detailed description
- `@enum` - Enum documentation
- `@interface` - Interface documentation
- `@property` - Property documentation with type
- `@param` - Parameter documentation
- `@returns` - Return value documentation

### TypeScript Utility Types
- `Record<K, V>` - Object with keys of type K and values of type V
- `Partial<T>` - Make all properties optional
- `Required<T>` - Make all properties required
- `Pick<T, K>` - Select specific properties
- `Omit<T, K>` - Exclude specific properties
- `RefObject<T>` - React ref type

### React Types
- `React.CSSProperties` - Inline style object type
- `React.KeyboardEvent` - Keyboard event type
- `React.ClipboardEvent` - Clipboard event type
- `React.MouseEvent` - Mouse event type
- `React.ChangeEvent<T>` - Change event for form elements

## Best Practices

### Performance
- Use `useRef` for values that don't need to trigger re-renders
- Memoize expensive calculations with `useMemo` (when needed)
- Use `useCallback` for event handlers passed to child components (when needed)
- Avoid inline object/array creation in render when possible

### Accessibility
- Use semantic HTML elements
- Include `title` attributes for icon buttons
- Ensure keyboard navigation works (Tab, Enter, Escape)
- Support RTL (right-to-left) layout with `dir="rtl"`

### Security
- Escape user input in regex patterns: `query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")`
- Validate environment variables with fallbacks
- Use try-catch blocks for regex operations to prevent crashes

### Maintainability
- Keep functions small and focused (single responsibility)
- Extract complex logic into separate helper functions
- Use descriptive variable names that explain intent
- Comment complex algorithms and business logic
- Group related functionality into classes or modules
