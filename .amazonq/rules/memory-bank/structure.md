# Project Structure

## Directory Organization

```
d:\rabyana\editor/
├── .amazonq/              # Amazon Q configuration and rules
│   └── rules/
│       └── memory-bank/   # Project documentation
├── .next/                 # Next.js build output (generated)
├── public/                # Static assets
├── src/                   # Source code
│   ├── app/              # Next.js app directory
│   ├── classes/          # Core business logic classes
│   ├── components/       # React components
│   ├── config/           # Configuration files
│   ├── handlers/         # Event and action handlers
│   ├── helpers/          # Utility functions
│   ├── modules/          # Specialized modules
│   └── types/            # TypeScript type definitions
└── .gitignore
```

## Core Components

### `/src/app/` - Next.js Application Layer
- **layout.tsx**: Root layout component defining app structure
- **page.tsx**: Home page that renders the main ScreenplayEditorEnhanced component
- **globals.css**: Global styles

### `/src/components/` - UI Components
- **ScreenplayEditorEnhanced.tsx**: Main editor component with AI integration, search, and formatting
- **AdvancedAgentsPopup.tsx**: Modal interface for selecting and configuring AI agents
- **ExportDialog.tsx**: Dialog for exporting screenplay in various formats

### `/src/classes/` - Business Logic
- **ScreenplayClassifier.ts**: Classifies screenplay lines (scene headers, character names, dialogue, action, parentheticals)
- **AIWritingAssistant.ts**: Manages AI model interactions and text generation
- **systems/**: Advanced system implementations
  - Search engines, analysis systems, and specialized processing modules

### `/src/config/` - Configuration Management
- **environment.ts**: Environment variables and API configuration
- **agents.ts**: AI agent definitions and configurations
- **agentConfigs.ts**: Detailed agent configuration objects
- **prompts.ts**: System prompts and templates for AI agents
- **index.ts**: Central configuration export

### `/src/handlers/` - Event Handlers
- **handleKeyDown.ts**: Keyboard event processing for editor shortcuts
- **handleSearch.ts**: Search functionality implementation
- **handleReplace.ts**: Text replacement operations
- **handleCharacterRename.ts**: Global character name replacement
- **handleAIReview.ts**: AI-powered review and analysis

### `/src/helpers/` - Utility Functions
- **formatText.ts**: Text formatting utilities
- **applyFormatToCurrentLine.ts**: Real-time line formatting
- **getFormatStyles.ts**: Style computation for screenplay elements
- **handlePaste.ts**: Paste event processing with format preservation
- **postProcessFormatting.ts**: Post-processing for formatting consistency
- **SceneHeaderAgent.ts**: Scene header detection and processing

### `/src/modules/` - Specialized Modules
- **domTextReplacement.ts**: DOM manipulation for text replacement operations

### `/src/types/` - Type Definitions
- **types.ts**: Comprehensive TypeScript interfaces and enums
  - TaskType, TaskCategory enums
  - AIAgentConfig, Script, Scene, Character, DialogueLine interfaces
  - ProcessedFile and other data structures

## Architectural Patterns

### Component Architecture
- **Next.js App Router**: Modern React framework with server/client component separation
- **Client-Side Rendering**: Main editor uses "use client" directive for interactive features
- **Component Composition**: Modular components with clear separation of concerns

### Data Flow
1. **User Input** → ScreenplayEditorEnhanced component
2. **Classification** → ScreenplayClassifier analyzes line types
3. **Formatting** → Helpers apply appropriate styles
4. **AI Processing** → AIWritingAssistant handles agent requests
5. **State Management** → React hooks manage editor state
6. **DOM Updates** → Efficient rendering with React reconciliation

### AI Agent System
- **Multi-Agent Architecture**: 30+ specialized agents with distinct capabilities
- **Task-Based Routing**: TaskType enum routes requests to appropriate agents
- **Configuration-Driven**: Agent behavior defined in config files
- **Collaborative Processing**: Agents can depend on or enhance other agents

### Type Safety
- **Strict TypeScript**: Comprehensive type definitions for all data structures
- **Enum-Based Constants**: TaskType and TaskCategory prevent magic strings
- **Interface Contracts**: Clear contracts between components and modules

### Separation of Concerns
- **Classes**: Core business logic and algorithms
- **Components**: UI rendering and user interaction
- **Handlers**: Event processing and orchestration
- **Helpers**: Pure utility functions
- **Config**: Centralized configuration management
