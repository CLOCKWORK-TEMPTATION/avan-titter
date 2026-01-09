import React from "react";
import { ScreenplayClassifier } from "../classes/ScreenplayClassifier";

/**
 * @function postProcessFormatting
 * @description معالجة ما بعد اللصق - تصحيح التصنيفات الخاطئة وتحويل الرموز إلى character/dialogue
 * @param htmlResult - HTML المُنتج من handlePaste
 * @param getFormatStylesFn - دالة للحصول على الـ styles
 * @returns HTML المُعالج والمُصحح
 */
export const postProcessFormatting = (
  htmlResult: string,
  getFormatStylesFn: (formatType: string) => React.CSSProperties
): string => {
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = htmlResult;
  const elements = Array.from(tempDiv.children);

  for (let i = 0; i < elements.length; i++) {
    const currentElement = elements[i] as HTMLElement;
    const nextElement = elements[i + 1] as HTMLElement | undefined;

    if (currentElement.className === "action") {
      const textContent = currentElement.textContent || "";
const bulletCharacterPattern =/^\s*[•·∙⋅●○◦■□▪▫◆◇–—−‒―‣⁃*+]\s*([^:：]+?)\s*[:：]\s*(.*)\s*$/;
      const match = textContent.match(bulletCharacterPattern);

      if (match) {
        const characterName = (match[1] || "").trim();
        const dialogueText = (match[2] || "").trim();

        if (!characterName) {
          continue;
        }

        currentElement.className = "character";
        currentElement.textContent = characterName + ":";
        Object.assign(currentElement.style, getFormatStylesFn("character"));

        const dialogueElement = document.createElement("div");
        dialogueElement.className = "dialogue";
        dialogueElement.textContent = dialogueText;
        Object.assign(dialogueElement.style, getFormatStylesFn("dialogue"));

        if (nextElement) {
          tempDiv.insertBefore(dialogueElement, nextElement);
        } else {
          tempDiv.appendChild(dialogueElement);
        }
      }
    }

    if (currentElement.className === "dialogue") {
      const textContent = currentElement.textContent || "";
      const actionPatterns = [
        /^\s*[-–—]?\s*(?:[ي|ت][\u0600-\u06FF]+|نرى|ننظر|نسمع|نلاحظ|يبدو|يظهر|يبدأ|ينتهي|يستمر|يتوقف|يتحرك|يحدث|يكون|يوجد|توجد|يظهر|تظهر)/,
        /^\s*[-–—]\s*.+/,
        /^\s*(?:نرى|ننظر|نسمع|نلاحظ|نشهد|نشاهد|نلمس|نشعر|نصدق|نفهم|نصدق|نشك|نتمنى|نأمل|نخشى|نخاف|نحب|نكره|نحسد|نغبط|ن admire|نحترم)/,
        /\s+(?:يقول|تقول|قال|قالت|يقوم|تقوم|يبدأ|تبدأ|ينتهي|تنتهي|يذهب|تذهب|يكتب|تكتب|ينظر|تنظر|يبتسم|تبتسم|يقف|تقف|يجلس|تجلس|يدخل|تدخل|يخرج|تخرج|يركض|تركض|يمشي|تمشي|يجري|تجرى|يصرخ|اصرخ|يبكي|تبكي|يضحك|تضحك|يغني|تغني|يرقص|ترقص|يأكل|تأكل|يشرب|تشرب|ينام|تنام|يستيقظ|تستيقظ|يقرأ|تقرأ|يسمع|تسمع|يشم|تشم|يلمس|تلمس|يأخذ|تأخذ|يعطي|تعطي|يفتح|تفتح|يغلق|تغلق|يعود|تعود|يأتي|تأتي|يموت|تموت|يحيا|تحيا|يقاتل|تقاتل|ينصر|تنتصر|يخسر|تخسر|يرسم|ترسم|يصمم|تخطط|يقرر|تقرر|يفكر|تفكر|يتذكر|تذكر|يحاول|تحاول|يستطيع|تستطيع|يريد|تريد|يحتاج|تحتاج|يبحث|تبحث|يجد|تجد|يفقد|تفقد|يحمي|تحمي|يراقب|تراقب|يخفي|تخفي|يكشف|تكشف|يكتشف|تكتشف|يعرف|تعرف|يتعلم|تعلن|يعلم|تعلن)\s+/
      ];

      let isActionDescription = false;
      for (const pattern of actionPatterns) {
        if (pattern.test(textContent)) {
          isActionDescription = true;
          break;
        }
      }

      if (
        !isActionDescription &&
        textContent.length > 20 &&
        ScreenplayClassifier.wordCount(textContent) > 5
      ) {
        isActionDescription = true;
      }

      if (isActionDescription) {
        currentElement.className = "action";
        const cleanedText = textContent.replace(/^\s*[-–—]\s*/, "");
        currentElement.textContent = cleanedText;
        Object.assign(currentElement.style, getFormatStylesFn("action"));
      }
    }
  }

  return tempDiv.innerHTML;
};
