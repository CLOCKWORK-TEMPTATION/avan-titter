
import { ScreenplayClassifier } from './classes/ScreenplayClassifier';

const text = `مشهد 3
كوافير الاسطى - كوافير درجة ثالثة به عدة زبائن بينما يجلس الاسطى خلف مكتبه وهو رجل دميم بشدة`;

console.log("Testing text:");
console.log(text);
console.log("---------------------------------------------------");

const results = ScreenplayClassifier.classifyBatch(text);

console.log("Results:");
results.forEach((line, i) => {
    console.log(`Line ${i}: [${line.type}] ${line.text}`);
});
