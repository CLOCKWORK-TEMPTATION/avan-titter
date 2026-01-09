import React from "react";
import { ScreenplayClassifier } from "../classes/ScreenplayClassifier";
import { SceneHeaderAgent } from "./SceneHeaderAgent";
import { postProcessFormatting } from "./postProcessFormatting";

const cssObjectToString = (styles: React.CSSProperties): string => {
  return Object.entries(styles)
    .map(([key, value]) => {
      const cssKey = key.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
      return `${cssKey}: ${String(value)}`;
    })
    .join("; ");
};

/**
 * @function handlePaste
 * @description معالج اللصق - يقوم بتصنيف النص المُلصق سطرًا بسطر وتطبيق التنسيق المناسب
 * @param e - حدث اللصق
 * @param editorRef - مرجع للمحرر
 * @param getFormatStylesFn - دالة للحصول على الـ styles
 * @param updateContentFn - دالة لتحديث المحتوى
 */
export const handlePaste = (
  e: React.ClipboardEvent,
  editorRef: React.RefObject<HTMLDivElement | null>,
  getFormatStylesFn: (formatType: string) => React.CSSProperties,
  updateContentFn: () => void
) => {
  e.preventDefault();
  const clipboardData = e.clipboardData;
  const pastedText = clipboardData.getData("text/plain");

  if (editorRef.current) {
    const bulletCharacterPattern =/^\s*[•·∙⋅●○◦■□▪▫◆◇–—−‒―‣⁃*+]\s*([^:：]+?)\s*[:：]\s*(.*)\s*$/;


    const isBulletCharacterLine = (candidateLine: string): boolean => {
      const match = candidateLine.match(bulletCharacterPattern);
      if (!match) return false;

      const characterName = (match[1] || "").trim();
      if (!characterName) return false;

      return ScreenplayClassifier.isCharacterLine(`${characterName}:`);
    };

    const lines = pastedText.split("\n");
    let currentCharacter = "";
    let htmlResult = "";

    const ctx = { inDialogue: false };

    let context = {
      lastFormat: "action",
      isInDialogueBlock: false,
      pendingCharacterLine: false,
    };

    for (const line of lines) {
      if (ScreenplayClassifier.isBlank(line)) {
        currentCharacter = "";
        context.isInDialogueBlock = false;
        context.lastFormat = "action";
        const actionStyle = cssObjectToString(getFormatStylesFn("action"));
        htmlResult +=
          `<div class="action" style='${actionStyle}'></div>`;
        continue;
      }

      if (ScreenplayClassifier.isBasmala(line)) {
        context.lastFormat = "basmala";
        context.isInDialogueBlock = false;
        const basmalaStyle = cssObjectToString(getFormatStylesFn("basmala"));
        htmlResult += `<div class="basmala" style='${basmalaStyle}'>${line}</div>`;
        continue;
      }

      const sceneHeaderResult = SceneHeaderAgent(line, ctx, getFormatStylesFn);
      if (sceneHeaderResult && sceneHeaderResult.processed) {
        context.lastFormat = "scene-header";
        context.isInDialogueBlock = false;
        context.pendingCharacterLine = false;
        htmlResult += sceneHeaderResult.html;
        continue;
      }

      if (ScreenplayClassifier.isTransition(line)) {
        context.lastFormat = "transition";
        context.isInDialogueBlock = false;
        context.pendingCharacterLine = false;
        const transitionStyle = cssObjectToString(getFormatStylesFn("transition"));
        htmlResult += `<div class="transition" style='${transitionStyle}'>${line}</div>`;
        continue;
      }

      if (ScreenplayClassifier.isCharacterLine(line, context)) {
        currentCharacter = line.trim().replace(":", "");
        context.lastFormat = "character";
        context.isInDialogueBlock = true;
        context.pendingCharacterLine = false;
        const characterStyle = cssObjectToString(getFormatStylesFn("character"));
        htmlResult += `<div class="character" style='${characterStyle}'>${line}</div>`;
        continue;
      }

      if (ScreenplayClassifier.isParenShaped(line)) {
        context.lastFormat = "parenthetical";
        context.pendingCharacterLine = false;
        const parentheticalStyle = cssObjectToString(
          getFormatStylesFn("parenthetical")
        );
        htmlResult += `<div class="parenthetical" style='${parentheticalStyle}'>${line}</div>`;
        continue;
      }

      if (currentCharacter && !line.includes(":")) {
        if (ScreenplayClassifier.isLikelyAction(line)) {
          context.lastFormat = "action";
          context.isInDialogueBlock = false;
          context.pendingCharacterLine = false;
          const cleanedLine = isBulletCharacterLine(line)
            ? line
            : line.replace(/^\s*[-–—]\s*/, "");
          const actionStyle = cssObjectToString(getFormatStylesFn("action"));
          htmlResult += `<div class="action" style='${actionStyle}'>${cleanedLine}</div>`;
          continue;
        } else {
          context.lastFormat = "dialogue";
          context.pendingCharacterLine = false;
          const dialogueStyle = cssObjectToString(getFormatStylesFn("dialogue"));
          htmlResult += `<div class="dialogue" style='${dialogueStyle}'>${line}</div>`;
          continue;
        }
      }

      if (ScreenplayClassifier.isLikelyAction(line)) {
        context.lastFormat = "action";
        context.isInDialogueBlock = false;
        context.pendingCharacterLine = false;
        const cleanedLine = isBulletCharacterLine(line)
          ? line
          : line.replace(/^\s*[-–—]\s*/, "");
        const actionStyle = cssObjectToString(getFormatStylesFn("action"));
        htmlResult += `<div class="action" style='${actionStyle}'>${cleanedLine}</div>`;
        continue;
      }

      context.lastFormat = "action";
      context.isInDialogueBlock = false;
      context.pendingCharacterLine = false;
      const cleanedLine = isBulletCharacterLine(line)
        ? line
        : line.replace(/^\s*[-–—]\s*/, "");
      const actionStyle = cssObjectToString(getFormatStylesFn("action"));
      htmlResult += `<div class="action" style='${actionStyle}'>${cleanedLine}</div>`;
    }

    const correctedHtmlResult = postProcessFormatting(htmlResult, getFormatStylesFn);

    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();

      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = correctedHtmlResult;

      // Apply styles to all elements before inserting
      const divs = tempDiv.querySelectorAll("div");
      divs.forEach((div: HTMLDivElement) => {
        const className = div.className;
        if (className) {
          Object.assign(div.style, getFormatStylesFn(className));
        }
      });

      const fragment = document.createDocumentFragment();
      while (tempDiv.firstChild) {
        fragment.appendChild(tempDiv.firstChild);
      }

      range.insertNode(fragment);
      updateContentFn();
    }
  }
};
