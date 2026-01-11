
import { ScreenplayClassifier } from './src/classes/ScreenplayClassifier';

console.log("--- Testing Spacing Rules ---");

// Test Case 1: Character -> Dialogue (Standard)
// Expected: No blank line
const lines1 = [
  { text: "AHMED:", type: "character" },
  { text: "Hello.", type: "dialogue" }
];
console.log("\n1. Character -> Dialogue (No Blank in input)");
const res1 = ScreenplayClassifier.applyEnterSpacingRules(lines1);
console.log(res1.map(l => `[${l.type}] ${l.text}`).join('\n'));

// Test Case 2: Character -> Blank -> Dialogue
// Expected: Blank line removed
const lines2 = [
  { text: "AHMED:", type: "character" },
  { text: "", type: "action" },
  { text: "Hello.", type: "dialogue" }
];
console.log("\n2. Character -> Blank -> Dialogue");
const res2 = ScreenplayClassifier.applyEnterSpacingRules(lines2);
console.log(res2.map(l => `[${l.type}] ${l.text}`).join('\n'));

// Test Case 3: Action -> Action
// Expected: Blank line added (since we set it to true)
const lines3 = [
  { text: "He runs.", type: "action" },
  { text: "He stops.", type: "action" }
];
console.log("\n3. Action -> Action");
const res3 = ScreenplayClassifier.applyEnterSpacingRules(lines3);
console.log(res3.map(l => `[${l.type}] ${l.text}`).join('\n'));

// Test Case 4: Basmala -> Scene Header
// Expected: Blank line added
const lines4 = [
  { text: "بسم الله الرحمن الرحيم", type: "basmala" },
  { text: "مشهد 1", type: "scene-header-1" }
];
console.log("\n4. Basmala -> Scene Header");
const res4 = ScreenplayClassifier.applyEnterSpacingRules(lines4);
console.log(res4.map(l => `[${l.type}] ${l.text}`).join('\n'));
