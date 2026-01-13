# Rabyana Screenplay Editor - AI Coding Instructions

## Project Overview

**Rabyana** is a Next.js 16-based Arabic screenplay editor with full RTL support, built around a `contentEditable` architecture. The core innovation is **line-by-line classification** of Arabic screenplay formats using hybrid pattern matching and contextual scoring.

## Key Architecture Patterns

### 1. ContentEditable-Based Editor
- Main editor: [ScreenplayEditorEnhanced.tsx](src/components/ScreenplayEditorEnhanced.tsx)
- Each line gets classified into screenplay format types (`action`, `character`, `dialogue`, `scene-header-3`, etc.)
- Formats are applied via CSS classes, not DOM manipulation
- **Critical**: Preserve `direction: "rtl"` and Arabic text handling in all text operations

### 2. Screenplay Classification System
[ScreenplayClassifier](src/classes/ScreenplayClassifier.ts) provides two classification approaches:

**Hybrid Classification** (default):
```typescript
ScreenplayClassifier.classifyBatch(text) // Uses regex + context
```

**Contextual Scoring** (advanced):
```typescript
ScreenplayClassifier.classifyBatch(text, true) // Returns confidence scores
ScreenplayClassifier.classifyWithContext(line, index, allLines) // Direct contextual
```

**Pattern**: Classification combines:
- Regex patterns for scene headers (`مشهد ١`, `scene 1`), transitions (`قطع إلى`)
- Context awareness (previous/next line types)
- Arabic-specific handling (Eastern digits `٠-٩`, tashkeel stripping, action verbs)

### 3. Format-to-Style Mapping
[getFormatStyles](src/helpers/getFormatStyles.ts) maps format types to CSS:
```typescript
character: { textAlign: "center", margin: "0 auto" }
dialogue: { width: "2.5in", textAlign: "center", margin: "0 auto" }
action: { textAlign: "right", width: "100%", margin: "0" }
```

**Rule**: When adding new format types, update BOTH `ScreenplayClassifier` patterns AND `getFormatStyles` mappings.

### 4. Handler Factory Pattern
Keyboard/event handlers in [src/handlers/](src/handlers/) are factory functions:
```typescript
// Usage
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
```

**Shortcuts**:
- `Tab/Shift+Tab` - Cycle through formats
- `Ctrl+1-6` - Quick format application
- `Ctrl+F/H` - Search/Replace
- `Ctrl+B/I/U` - Bold/Italic/Underline

### 5. System Classes (Pub/Sub Architecture)
Located in [src/classes/systems/](src/classes/systems/):

**StateManager** - Central state with subscriptions:
```typescript
stateManager.subscribe("key", callback);
stateManager.setState("key", value); // Triggers subscribers
```

**AutoSaveManager** - Interval-based auto-save with dirty tracking
**AdvancedSearchEngine** - Regex search with case/whole-word options

## Arabic-Specific Requirements

### RTL Text Handling
- **Always** use `direction: "rtl"` for text elements
- Use `textAlign: "right"` for action/description, `"center"` for character/dialogue
- Font: `"AzarMehrMonospaced-San"` (primary)

### Arabic Digit Support
```typescript
// Convert Eastern (٠١٢٣٤٥٦٧٨٩) to Western (0123456789)
ScreenplayClassifier.easternToWesternDigits(text);
```

### Tashkeel (Diacritics) Handling
```typescript
// Strip diacritics for normalization
ScreenplayClassifier.stripTashkeel(text);
```

### Action Verb Detection
- Extensive Arabic verb list (`يدخل`, `يخرج`, `تنظر`, etc.) in `ScreenplayClassifier.ACTION_VERB_SET`
- Supports attached particles: `وتقف`, `فيبتسم`, `ليجلس`

## AI Integration

### API Endpoint
[src/app/api/ai/chat/route.ts](src/app/api/ai/chat/route.ts) - Gemini API proxy

**Required**: `GEMINI_API_KEY` environment variable

**Usage**:
```typescript
fetch("/api/ai/chat", {
  method: "POST",
  body: JSON.stringify({
    model: "gemini-3-flash-preview",
    messages: [{ role: "user", content: "..." }]
  })
});
```

### Agent Configurations
[src/config/agents.ts](src/config/agents.ts):
- `default` - Temperature 0.7
- `creativeAgent` - Temperature 0.9, maxOutputTokens 40096
- `analysisAgent` - Temperature 0.5

## Development Workflow

### Commands
```bash
npm run dev         # Dev server on port 5000
npm run build       # Production build
npm run lint        # ESLint (max 0 warnings)
npm run type-check  # TypeScript validation
```

### Code Style
- TypeScript strict mode enabled
- ESLint enforces zero warnings (`--max-warnings=0`)
- Prettier for formatting
- Import paths: Use `@/` alias for `src/` (e.g., `@/components/...`)

## Common Pitfall Avoidance

### ReDoS Protection
Regex patterns in `ScreenplayClassifier` are designed to avoid catastrophic backtracking with Arabic text. When adding new patterns:
- Avoid nested quantifiers (`(a+)+`)
- Test with long Arabic strings
- Use atomic groups where possible

### Multi-line Scene Headers
Scene headers can span multiple lines:
```
مشهد ١ - ليل / خارجي
بيت محمد
```
Use `extractSceneHeaderParts()` to handle multi-line parsing.

### Format Cycling Logic
Enter behavior depends on current format:
- From `character` → `dialogue`
- From `dialogue` → `action`
- From `action` → `action` (stay)

Tab cycles through all formats bidirectionally.

## File Organization

```
src/
├── app/              # Next.js app router
│   └── api/ai/chat/  # AI endpoint
├── classes/          # Core logic classes
│   ├── ScreenplayClassifier.ts  # Classification engine
│   └── systems/      # StateManager, AutoSave, Search
├── components/       # React components
│   └── ScreenplayEditorEnhanced.tsx  # Main editor
├── config/           # Agent configs, prompts
├── handlers/         # Event handler factories
├── helpers/          # Pure utility functions
├── modules/          # Utility modules
└── types/types.ts    # TypeScript types
```

## Language & Communication
- **Primary Language**: Arabic (professional Egyptian dialect)
- **Code Comments**: Arabic or English (mixed)
- **Tone**: Formal and professional
- **Forbidden**: Emojis, informal slang

## When Making Changes

1. **Adding Format Types**: Update `ScreenplayClassifier` + `getFormatStyles` + type definitions
2. **Modifying Keyboard Shortcuts**: Update handler factories in [src/handlers/](src/handlers/)
3. **AI Features**: Ensure `GEMINI_API_KEY` is set, test with [route.ts](src/app/api/ai/chat/route.ts)
4. **RTL Changes**: Verify `direction: "rtl"` preserved, test with Arabic text
5. **Classification Logic**: Test both hybrid and contextual scoring modes

## Testing Arabic Screenplay Formats

Example valid formats:
```
مشهد ١ - ليل / داخلي        (scene-header-top-line)
بيت محمد                     (scene-header-3)
يدخل محمد إلى الغرفة        (action - starts with verb)
محمد                         (character)
مرحباً بك                    (dialogue)
(بحزن)                       (parenthetical)
قطع إلى                      (transition)
```
