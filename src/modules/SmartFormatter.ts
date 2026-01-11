/**
 * @file SmartFormatter.ts
 * @description محرك التنسيق الذكي المستقل - ينفذ المنطق الهجين (Hybrid Logic + AI) بمعزل تام عن عملية اللصق
 */

import { ScreenplayClassifier } from '../classes/ScreenplayClassifier';
import { getFormatStyles } from '../helpers/getFormatStyles';
import { SmartImportSystem } from '../classes/systems/SmartImportSystem';

export class SmartFormatter {
  
  /**
   * دالة مستقلة تماماً تقوم بقراءة المحرر وإعادة تنسيقه بذكاء
   * @param editorElement عنصر الـ DOM الخاص بالمحرر
   * @param onUpdate دالة callback لتحديث الـ State بعد الانتهاء
   */
  static async runFullFormat(
    editorElement: HTMLDivElement, 
    onUpdate: () => void
  ) {
    if (!editorElement) return;

    // 1. استخراج النص الحالي من المحرر
    const fullText = editorElement.innerText || "";
    
    // 2. تشغيل التصنيف الهجين (محتوى + سياق) محلياً
    let classifiedLines = ScreenplayClassifier.classifyBatch(fullText);

    // 3. (اختياري) تشغيل الـ AI للمراجعة
    const aiSystem = new SmartImportSystem();
    console.log("Starting AI formatting refinement...");
    
    const refinedLines = await aiSystem.refineWithGemini(classifiedLines);
    
    // لو الـ AI رجع نتيجة، نستخدمها. لو فشل، نستخدم النتيجة المحلية
    if (refinedLines && refinedLines.length > 0) {
      classifiedLines = refinedLines;
      console.log("Applied AI formatting.");
    }

    classifiedLines = ScreenplayClassifier.applyEnterSpacingRules(classifiedLines);

    // 4. إعادة بناء الـ HTML للمحرر
    let newHTML = '';
    classifiedLines.forEach(line => {
      if (line.type === 'scene-header-top-line') {
        const parsed = ScreenplayClassifier.parseSceneHeaderFromLine(line.text);
        if (parsed) {
          const container = document.createElement('div');
          container.className = 'scene-header-top-line';
          Object.assign(container.style, getFormatStyles('scene-header-top-line'));

          const part1 = document.createElement('span');
          part1.className = 'scene-header-1';
          part1.textContent = parsed.sceneNum;
          Object.assign(part1.style, getFormatStyles('scene-header-1'));
          container.appendChild(part1);

          if (parsed.timeLocation) {
            const part2 = document.createElement('span');
            part2.className = 'scene-header-2';
            part2.textContent = parsed.timeLocation;
            Object.assign(part2.style, getFormatStyles('scene-header-2'));
            container.appendChild(part2);
          }

          newHTML += container.outerHTML;
          return;
        }
      }

      const div = document.createElement('div');
      div.className = line.type;
      div.textContent = line.text;
      Object.assign(div.style, getFormatStyles(line.type));
      newHTML += div.outerHTML;
    });

    // 5. تطبيق التغييرات
    editorElement.innerHTML = newHTML;
    
    // تحديث المحرر
    onUpdate();
  }
}
