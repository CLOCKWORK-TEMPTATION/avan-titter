# Summary: Blank Line Separation Implementation

## Problem Statement

In the original `classifyBatch` implementation, blank lines were classified as `action`, which polluted the classification context and broke dialogue continuity:

```
Character name:     ← character
First dialogue      ← dialogue (correct, prevType = character)
<blank line>        ← action (problematic!)
Second dialogue     ← action (WRONG! prevType = action)
                      Should be: dialogue
```

## Solution Overview

Introduce an internal `blank` type that is:
- Used during classification to track blank lines separately
- Skipped when building classification context  
- Converted back to `action` in final output for compatibility

## Key Changes

### 1. Internal Blank Type Tracking

**File**: `src/classes/ScreenplayClassifier.ts`

**In `classifyBatch()`**:
```typescript
// Before:
if (!current) {
  results.push({ text: "", type: "action" });
  previousTypes[i] = "action";
  continue;
}

// After:
if (!current) {
  results.push({ text: "", type: "blank" });  // Internal tracking
  previousTypes[i] = "blank";
  continue;
}
```

### 2. Helper Functions

**New function: `getPrevNonBlankType()`**
```typescript
private static getPrevNonBlankType(
  previousTypes: (string | null)[],
  currentIndex: number
): string | null {
  for (let i = currentIndex - 1; i >= 0; i--) {
    const type = previousTypes[i];
    if (type && type !== 'blank') {
      return type;  // Skip blanks, return first non-blank
    }
  }
  return null;
}
```

**New function: `getPrevNonBlankTypes()`**
- Returns multiple previous non-blank types
- Used for broader context analysis

**New function: `isInDialogueBlock()`**
- Checks if current line is within a dialogue block
- Skips blank lines in the check

### 3. Context Building Updates

**In `buildContext()`**:
```typescript
// Before: Included all lines in previousLines
for (let i = Math.max(0, index - WINDOW_SIZE); i < index; i++) {
  previousLines.push({
    line: allLines[i] || '',
    type: previousTypes?.[i] || 'unknown'
  });
}

// After: Skip blank lines
for (let i = index - 1; i >= 0 && collected < WINDOW_SIZE; i--) {
  const line = allLines[i] || '';
  const type = previousTypes?.[i] || 'unknown';
  
  if (type === 'blank' || this.isBlank(line)) {
    continue;  // Skip blank lines entirely
  }
  
  previousLines.unshift({ line, type });
  collected++;
}
```

### 4. Scoring Updates

**In `classifyWithScoring()`**:
```typescript
// Before:
const prevType = previousTypes && index > 0 
  ? previousTypes[index - 1] 
  : null;

// After:
const prevNonBlankType = previousTypes 
  ? this.getPrevNonBlankType(previousTypes, index) 
  : null;

// Use prevNonBlankType for context-based scoring
if (prevNonBlankType === 'character' && looksLikeActionStart) {
  // Adjust scores accordingly
}
```

### 5. Spacing Rules

**In `getEnterSpacingRule()`**:
```typescript
static getEnterSpacingRule(prevType: string, nextType: string): boolean | null {
  // Ignore blank in spacing rules
  if (prevType === 'blank' || nextType === 'blank') {
    return null;
  }
  // ... rest of rules
}
```

### 6. Final Output Conversion

**In `classifyBatch()` final return**:
```typescript
// Before:
return ScreenplayClassifier.applyEnterSpacingRules(results);

// After:
const spacedResults = ScreenplayClassifier.applyEnterSpacingRules(results);

// Convert blank back to action for compatibility
return spacedResults.map(r => ({
  ...r,
  type: r.type === 'blank' ? 'action' : r.type
}));
```

## Results

### Example: Multi-line Dialogue with Blanks

**Before Fix**:
```
أحمد:              type: character
مرحباً يا صديقي    type: dialogue (prevType: character) ✓
                   type: action (blank)
كيف حالك؟          type: action (prevType: action) ✗
```

**After Fix**:
```
أحمد:              type: character
مرحباً يا صديقي    type: dialogue (prevNonBlank: character) ✓
                   type: blank → action (in output)
كيف حالك؟          type: dialogue (prevNonBlank: dialogue) ✓
```

## Benefits

1. **Context Preservation**: Dialogue blocks remain connected across blank lines
2. **Backward Compatibility**: Final output still uses `action` for blank lines
3. **Separation of Concerns**: `blank` is an internal state, not a format type
4. **Improved Accuracy**: Better classification for multi-line Arabic dialogue

## Files Modified

- `src/classes/ScreenplayClassifier.ts`
  - Modified `classifyBatch()` 
  - Added `getPrevNonBlankType()`
  - Added `getPrevNonBlankTypes()`
  - Added `isInDialogueBlock()`
  - Modified `buildContext()`
  - Modified `classifyWithScoring()`
  - Modified `getEnterSpacingRule()`

## Testing

Run the demonstration:
```bash
node demo_blank_fix.js
```

This shows the before/after behavior clearly.

## Conclusion

All planned steps have been successfully implemented. The system now handles blank lines as a separate internal state, preserving dialogue context while maintaining full backward compatibility with existing systems.
