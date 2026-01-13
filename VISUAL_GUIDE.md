# Visual Guide: Blank Line Separation Fix

## The Problem Illustrated

### Before Fix: Context Pollution ❌

```
┌─────────────────────────────────────────────────────────┐
│ Line 1: أحمد:                                           │
│ Type: character                                         │
│ PrevType: null                                          │
└─────────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────┐
│ Line 2: مرحباً يا صديقي                                │
│ Type: dialogue                                          │
│ PrevType: character ✓                                   │
└─────────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────┐
│ Line 3: <blank>                                         │
│ Type: action ← PROBLEM!                                 │
│ PrevType: dialogue                                      │
└─────────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────┐
│ Line 4: كيف حالك؟                                       │
│ Type: action ← WRONG! Should be dialogue!              │
│ PrevType: action ← Context broken!                     │
└─────────────────────────────────────────────────────────┘
```

**Issue**: Blank line classified as `action` breaks dialogue context chain.

---

## The Solution Illustrated

### After Fix: Context Preservation ✅

```
┌─────────────────────────────────────────────────────────┐
│ Line 1: أحمد:                                           │
│ Type: character                                         │
│ PrevNonBlank: null                                      │
└─────────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────┐
│ Line 2: مرحباً يا صديقي                                │
│ Type: dialogue                                          │
│ PrevNonBlank: character ✓                               │
└─────────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────┐
│ Line 3: <blank>                                         │
│ Internal: blank                                         │
│ Output: action (compatibility)                          │
│ ↓ SKIPPED in context building                          │
└─────────────────────────────────────────────────────────┘
                    │ (skipped)
                    ▼
┌─────────────────────────────────────────────────────────┐
│ Line 4: كيف حالك؟                                       │
│ Type: dialogue ← CORRECT!                               │
│ PrevNonBlank: dialogue ← Context preserved! ✓           │
└─────────────────────────────────────────────────────────┘
```

**Solution**: Blank lines are internally tracked but skipped in context.

---

## Implementation Flow

### Classification Process

```
Input: Raw text lines
   │
   ▼
┌────────────────────────────────────┐
│ classifyBatch()                    │
│                                    │
│ For each line:                     │
│   if (isBlank(line))              │
│     type = "blank" (internal)     │ ← NEW!
│   else                             │
│     type = classifyWithScoring()   │
└────────────────────────────────────┘
   │
   ▼
┌────────────────────────────────────┐
│ buildContext()                     │
│                                    │
│ Build previousLines:               │
│   Skip lines where type == "blank" │ ← NEW!
│                                    │
│ Build nextLines:                   │
│   Skip blank lines                 │ ← NEW!
└────────────────────────────────────┘
   │
   ▼
┌────────────────────────────────────┐
│ classifyWithScoring()              │
│                                    │
│ Get prevNonBlankType()            │ ← NEW!
│ Score using clean context          │
└────────────────────────────────────┘
   │
   ▼
┌────────────────────────────────────┐
│ Final Output                       │
│                                    │
│ Map: blank → action                │ ← NEW!
│ (for compatibility)                │
└────────────────────────────────────┘
   │
   ▼
Output: Classified lines with preserved context
```

---

## Context Window Comparison

### Before: Including Blank Lines

```
Context for Line 4:
┌─────────────────────────────────────┐
│ previousLines (window=3):           │
│   [0] Line 1: أحمد: (character)    │
│   [1] Line 2: مرحباً... (dialogue) │
│   [2] Line 3: <blank> (action)     │ ← Pollutes context!
└─────────────────────────────────────┘
                │
                ▼
prevType = action → Wrong classification!
```

### After: Skipping Blank Lines

```
Context for Line 4:
┌─────────────────────────────────────┐
│ previousLines (window=3):           │
│   [0] Line 1: أحمد: (character)    │
│   [1] Line 2: مرحباً... (dialogue) │
│   (Line 3 skipped - blank)          │ ← Clean context!
└─────────────────────────────────────┘
                │
                ▼
prevNonBlankType = dialogue → Correct classification!
```

---

## Dialogue Block Detection

### Before: Broken by Blank

```
Dialogue Block:
┌──────────────────┐
│ Character        │
├──────────────────┤
│ Dialogue 1       │
└──────────────────┘
        ↓
┌──────────────────┐
│ Action (blank)   │ ← Breaks the block!
└──────────────────┘
        ↓
┌──────────────────┐
│ Action ???       │ ← Lost dialogue context
└──────────────────┘
```

### After: Continuous Through Blank

```
Dialogue Block:
┌──────────────────┐
│ Character        │
├──────────────────┤
│ Dialogue 1       │
├──────────────────┤
│ (blank skipped)  │ ← Transparent to context
├──────────────────┤
│ Dialogue 2       │ ← Maintains dialogue context!
└──────────────────┘
```

---

## Key Functions Illustrated

### getPrevNonBlankType()

```
previousTypes array:
[character, dialogue, blank, blank, ???]
                              ↑
                      Current index (4)

Scan backwards:
  Index 3: blank → skip
  Index 2: blank → skip
  Index 1: dialogue → RETURN! ✓

Result: "dialogue"
```

### buildContext() - Previous Lines

```
All lines:     [char, dlg, blank, blank, current]
                                          ↑
Index:          [0,    1,   2,     3,     4]
                                          
Building previousLines (window=3):
  i=3: blank → skip
  i=2: blank → skip
  i=1: dialogue → add (collected=1)
  i=0: character → add (collected=2)

previousLines: [character, dialogue]  ← Clean!
```

---

## State Transition Diagram

```
Input Line
    │
    ▼
Is Blank? ─────Yes────→ Type = "blank" (internal)
    │                       │
    No                      │
    │                       │
    ▼                       │
Classify                    │
with scoring                │
    │                       │
    ▼                       │
Type = classified type      │
    │                       │
    └───────┬───────────────┘
            │
            ▼
    Store in results
            │
            ▼
    Continue to next line
            │
    ▼
All lines done?
    │
    Yes
    ▼
Apply spacing rules
    │
    ▼
Map: blank → action ─→ Final output (compatible)
```

---

## Comparison Table

| Aspect | Before Fix | After Fix |
|--------|-----------|-----------|
| **Blank Classification** | `action` | `blank` (internal) |
| **Context Building** | Includes blanks | Skips blanks |
| **Previous Type** | Direct `prevType` | `prevNonBlankType` |
| **Dialogue Continuity** | Broken by blanks | Preserved across blanks |
| **Final Output** | `action` | `action` (converted from `blank`) |
| **Compatibility** | ✓ | ✓ |
| **Accuracy** | Lower | Higher ✓ |

---

## Real-World Example

### Script Input

```arabic
أحمد:
السلام عليكم

كيف الحال؟

محمد:
وعليكم السلام

الحمد لله
```

### Classification Results

#### Before (Broken Context)
```
أحمد:           → character
السلام عليكم     → dialogue    (prevType: character) ✓
<blank>          → action
كيف الحال؟       → action       (prevType: action) ✗
<blank>          → action
محمد:            → character    (prevType: action)
وعليكم السلام   → dialogue     (prevType: character) ✓
<blank>          → action
الحمد لله        → action       (prevType: action) ✗
```

#### After (Preserved Context)
```
أحمد:           → character
السلام عليكم     → dialogue    (prevNonBlank: character) ✓
<blank>          → action      (was blank internally)
كيف الحال؟       → dialogue    (prevNonBlank: dialogue) ✓
<blank>          → action      (was blank internally)
محمد:            → character   (prevNonBlank: dialogue)
وعليكم السلام   → dialogue    (prevNonBlank: character) ✓
<blank>          → action      (was blank internally)
الحمد لله        → dialogue    (prevNonBlank: dialogue) ✓
```

---

## Summary

### The Fix in One Sentence

**Blank lines are now internally tracked separately and skipped during context building, preserving dialogue continuity while maintaining backward compatibility.**

### Benefits Visualized

```
┌─────────────────────────────────────────────────────┐
│                   BENEFITS                          │
├─────────────────────────────────────────────────────┤
│ ✅ Context Preservation                             │
│    └─ Dialogue blocks stay connected                │
│                                                     │
│ ✅ Backward Compatibility                           │
│    └─ Output still uses "action" for blanks         │
│                                                     │
│ ✅ Separation of Concerns                           │
│    └─ "blank" is internal state, not format         │
│                                                     │
│ ✅ Improved Accuracy                                │
│    └─ Better multi-line dialogue detection          │
└─────────────────────────────────────────────────────┘
```
