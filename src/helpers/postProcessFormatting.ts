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

    if (currentElement.className === "action" || currentElement.className === "character") {
      const textContent = currentElement.textContent || "";
      const bulletCharacterPattern = ScreenplayClassifier.BULLET_CHARACTER_RE;
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
  }

  const isBlankActionElement = (el: HTMLElement): boolean => {
    const text = (el.textContent || "").trim();
    if (text !== "") return false;
    // نعتبر الـ Dialogue الفارغ أيضاً بمثابة Action فارغ لغرض المسافات
    return el.className === "action" || el.className === "dialogue" || el.className === "Dialogue";
  };

  const createBlankActionElement = (): HTMLDivElement => {
    const blank = document.createElement("div");
    blank.className = "action";
    blank.textContent = "";
    Object.assign(blank.style, getFormatStylesFn("action"));
    return blank;
  };

  const spacingOutput = document.createElement("div");
  const children = Array.from(tempDiv.children) as HTMLElement[];
  let prevNonBlankType: string | null = null;
  let pendingBlanks: HTMLElement[] = [];

  const flushBlanks = () => {
    for (const b of pendingBlanks) {
      spacingOutput.appendChild(b);
    }
    pendingBlanks = [];
  };

  for (const child of children) {
    if (isBlankActionElement(child)) {
      pendingBlanks.push(child);
      continue;
    }

    if (!prevNonBlankType) {
      flushBlanks();
      spacingOutput.appendChild(child);
      prevNonBlankType = child.className;
      continue;
    }

    // ========================================================================
    // FIX: فرض عدم وجود مسافة بين الشخصية والحوار بغض النظر عن الـ Classifier
    // ========================================================================
    if (
      (prevNonBlankType === 'character' || prevNonBlankType === 'Character') &&
      (child.className === 'dialogue' || child.className === 'Dialogue')
    ) {
      // إفراغ أي مسافات معلقة دون إضافتها
      pendingBlanks = [];
    } else {
      // التنفيذ الطبيعي لباقي الحالات
      const spacingRule = ScreenplayClassifier.getEnterSpacingRule(
        prevNonBlankType,
        child.className
      );

      if (spacingRule === true) {
        if (pendingBlanks.length > 0) {
          spacingOutput.appendChild(pendingBlanks[0]);
        } else {
          spacingOutput.appendChild(createBlankActionElement());
        }
        pendingBlanks = [];
      } else if (spacingRule === false) {
        pendingBlanks = [];
      } else {
        flushBlanks();
      }
    }
    // ========================================================================

    spacingOutput.appendChild(child);
    prevNonBlankType = child.className;
  }

  flushBlanks();

  tempDiv.innerHTML = "";
  while (spacingOutput.firstChild) {
    tempDiv.appendChild(spacingOutput.firstChild);
  }

  return tempDiv.innerHTML;
};
