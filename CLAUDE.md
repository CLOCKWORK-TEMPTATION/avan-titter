# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **Rabyana Screenplay Editor** (محرر السيناريو العربي المتقدم) - a Next.js-based screenplay editor designed specifically for Arabic scriptwriting with full RTL (Right-to-Left) support. The editor uses a contentEditable div for rich text editing with custom screenplay format classification.

### اللغة والنبرة
- **اللغة**: استخدم اللغة العربية المصرية العامية المهنية والمصقولة الخالية من الألفاظ النابية
- **النبرة**: رسمية ومهنية ومتزنة وجدية مع الموازنة بين المباشرة والمهنية
- **القواعد**: التزم بالقواعد النحوية الصحيحة والمفردات الدقيقة، وتجنب اللغة العامية غير الرسمية
- **التنسيق**: قدم إجابات نصية فقط، يُمنع منعاً باتاً استخدام الرموز التعبيرية

## Development Commands

```bash
# Development
npm run dev          # Start dev server on port 3000

# Build & Type Check
npm run build        # Production build
npm run type-check   # TypeScript type checking without emit

# Linting & Formatting
npm run lint         # ESLint with zero warnings threshold
npm run lint:fix     # Auto-fix ESLint issues
npm run format       # Format with Prettier
npm run format:check # Check formatting
```

## Architecture Overview

### Core Editor Pattern

The editor is built around a `contentEditable` div ([ScreenplayEditorEnhanced.tsx](src/components/ScreenplayEditorEnhanced.tsx)) where each screenplay element type (scene headers, action, character, dialogue, transitions) is represented as a separate block with a specific CSS class. The key architecture choice is:

1. **Line-by-line classification**: Each line of text is classified into screenplay formats using [ScreenplayClassifier](src/classes/ScreenplayClassifier.ts)
2. **Hybrid classification**: Uses both regex patterns and context-aware heuristics (previous/next line types) to classify Arabic screenplay text
3. **Format-based styling**: Each classified type gets specific CSS styles via [getFormatStyles](src/helpers/getFormatStyles.ts)

### Screenplay Format Types

| Type | Class Name | Description |
|------|------------|-------------|
| Basmala | `basmala` | "بسم الله الرحمن الرحيم" header |
| Scene Header Top | `scene-header-top-line` | Scene number + time/location |
| Scene Header Place | `scene-header-3` | Location description |
| Action | `action` | Scene description/action lines |
| Character | `character` | Character name speaking |
| Dialogue | `dialogue` | Character's spoken words |
| Parenthetical | `parenthetical` | (Directions within dialogue) |
| Transition | `transition` | Scene transitions ( CUT TO, etc.) |

### Key Classification Logic

The [ScreenplayClassifier](src/classes/ScreenplayClassifier.ts) provides multiple classification approaches:

#### 1. Hybrid Classification (`classifyHybrid()`)
The traditional approach that combines:
- **Content-based checks** (regex patterns) for scene headers, transitions, basmala
- **Context-aware checks** - looks at `prevType` and `nextLine` to disambiguate
- **Arabic-specific patterns** - handles RTL text, Arabic digits (٠١٢٣٤٥٦٧٨٩), tashkeel removal

#### 2. Contextual Scoring System (`classifyWithContext()`)
A new advanced classification system that uses:
- **LineContext**: A sliding window of previous/next lines (3 lines each direction)
- **Scoring System**: Each type (character, dialogue, action, parenthetical) receives a score (0-100)
- **Confidence Levels**: low (<40), medium (40-69), high (70+)
- **Multi-factor Analysis**: Considers line length, word count, punctuation, Arabic characters, action verbs, etc.

**Usage:**
```typescript
// Traditional classification (default)
const result = ScreenplayClassifier.classifyBatch(text);

// Contextual scoring classification
const result = ScreenplayClassifier.classifyBatch(text, true);

// Direct contextual classification
const result = ScreenplayClassifier.classifyWithContext(line, index, allLines);
// result.type, result.confidence, result.scores, result.reasons
```

**Key Types** (in [src/types/types.ts](src/types/types.ts)):
- `LineContext` - Context window with previous/next lines and statistics
- `ClassificationScore` - Score (0-100), confidence, and reasons
- `ClassificationResult` - Complete classification result with all scores

### Handler Pattern

Keyboard and user interactions are handled via factory functions in [src/handlers/](src/handlers/):

- `handleKeyDown` - Tab/Enter for format cycling, Ctrl+1-6 for quick formats, Ctrl+F/H for search/replace
- `handleSearch` / `handleReplace` - Uses AdvancedSearchEngine
- `handleCharacterRename` - Find/replace character names globally
- `handleAIReview` - AI-powered script review

### System Classes

Located in [src/classes/systems/](src/classes/systems/):

- **StateManager** - Pub/sub state management with Map-based storage
- **AutoSaveManager** - Interval-based auto-save with unsaved changes tracking
- **AdvancedSearchEngine** - Regex-based search with case-sensitivity, whole-word options
- **CollaborationSystem**, **ProjectManager**, **VisualPlanningSystem** - Feature placeholders

### AI Integration

- **API Route**: [src/app/api/ai/chat/route.ts](src/app/api/ai/chat/route.ts) - Gemini API proxy
- **Agent Config**: [src/config/agents.ts](src/config/agents.ts) - Model configs (creative, analysis agents)
- Requires `GEMINI_API_KEY` environment variable

### Helper Functions

Located in [src/helpers/](src/helpers/):

- `getFormatStyles` - Maps format types to CSS (alignment, width, margins)
- `formatText` - Applies rich text formatting (bold, italic, underline)
- `applyFormatToCurrentLine` - Changes format of current line
- `handlePaste` - Smart paste with context preservation
- `postProcessFormatting` - Post-formatting text correction

### Module Pattern

- [src/modules/SmartFormatter.ts](src/modules/SmartFormatter.ts) - Smart text formatting
- [src/modules/domTextReplacement.ts](src/modules/domTextReplacement.ts) - DOM-level text replacement

## File Structure

```
src/
├── app/
│   ├── api/ai/chat/route.ts    # Gemini API proxy
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Main page
├── classes/
│   ├── ScreenplayClassifier.ts  # Core classification logic
│   ├── AIWritingAssistant.ts    # AI helper class
│   └── systems/                 # System classes (State, AutoSave, Search, etc.)
├── components/
│   ├── ScreenplayEditorEnhanced.tsx  # Main editor component
│   ├── AdvancedAgentsPopup.tsx       # AI agents popup
│   └── ExportDialog.tsx              # Export functionality
├── config/
│   ├── agents.ts                # AI agent configurations
│   ├── environment.ts           # Environment variables
│   └── prompts.ts               # AI prompts
├── handlers/                    # Event handler factories
├── helpers/                     # Pure helper functions
├── modules/                     # Utility modules
└── types/types.ts               # TypeScript types
```

## Arabic-Specific Considerations

1. **RTL Direction**: All text elements use `direction: "rtl"`
2. **Arabic Digits**: Supports both Western (0-9) and Eastern Arabic (٠-٩) digits with conversion
3. **Tashkeel**: Diacritics are stripped for normalization (`stripTashkeel()`)
4. **Font**: Uses "AzarMehrMonospaced-San" as primary font
5. **Action Verbs**: Extensive Arabic action verb list for pattern matching

## When Modifying

1. **Format classification**: Changes to screenplay formats should update both `ScreenplayClassifier` patterns AND `getFormatStyles` CSS mappings
2. **Keyboard shortcuts**: Update `handleKeyDown` factory and consider RTL implications
3. **AI features**: Require valid `GEMINI_API_KEY` in environment
4. **Screenplay format types**: Must be added to the classification logic AND CSS styles

## Common Issues

- **ReDoS protection**: The regex patterns in `ScreenplayClassifier` are designed to avoid catastrophic backoff with Arabic text
- **RTL layout**: When styling, ensure `direction: rtl` is preserved and alignment uses `textAlign: "right"` for action/descriptive text
- **Scene header parsing**: Multi-line scene headers consume multiple lines - see `extractSceneHeaderParts()`
