
import { ScreenplayClassifier } from './src/classes/ScreenplayClassifier';

console.log("--- Testing Classification & Spacing ---");

const input = `
AHMED:
Hello world.
`;

console.log("Input:", input);

const results = ScreenplayClassifier.classifyBatch(input, true);

console.log("\nResults:");
results.forEach(line => {
  console.log(`[${line.type}] "${line.text}"`);
});
