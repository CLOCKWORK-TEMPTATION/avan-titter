import React from "react";
import { ScreenplayClassifier } from "../classes/ScreenplayClassifier";
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
 * @description معالج اللصق - يقوم بتصنيف النص المُلصق باستخدام classifyBatch مع التصنيف السياقي
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
    // استخدام classifyBatch مع التصنيف السياقي المفعّل (useContext: true)
    const classifiedElements = ScreenplayClassifier.classifyBatch(pastedText, true);

    // بناء HTML من النتيجة المصنفة
    let htmlResult = "";

    for (const element of classifiedElements) {
      const { text, type } = element;
      const styles = getFormatStylesFn(type);
      const styleString = cssObjectToString(styles);

      // التعامل مع رؤوس المشاهد المعقدة (scene-header-top-line)
      if (type === "scene-header-top-line") {
        // تقسيم النص إلى أجزاء (رقم المشهد والوقت/المكان)
        const parts = text.split(/\s+/).filter(Boolean);
        const sceneNum = parts[0] || "";
        const timeLocation = parts.slice(1).join(" ");

        const container = document.createElement("div");
        container.className = "scene-header-top-line";
        Object.assign(container.style, styles);

        const part1 = document.createElement("span");
        part1.className = "scene-header-1";
        part1.textContent = sceneNum;
        Object.assign(part1.style, getFormatStylesFn("scene-header-1"));
        container.appendChild(part1);

        if (timeLocation) {
          const part2 = document.createElement("span");
          part2.className = "scene-header-2";
          part2.textContent = timeLocation;
          Object.assign(part2.style, getFormatStylesFn("scene-header-2"));
          container.appendChild(part2);
        }

        htmlResult += container.outerHTML;
      } else {
        // لجميع الأنواع الأخرى، أنشئ div بسيط
        htmlResult += `<div class="${type}" style='${styleString}'>${text}</div>`;
      }
    }

    // تطبيق post-processing للتصحيح النهائي
    const correctedHtmlResult = postProcessFormatting(htmlResult, getFormatStylesFn);

    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();

      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = correctedHtmlResult;

      // تطبيق الـ styles على جميع العناصر قبل الإدراج
      const elements = tempDiv.querySelectorAll<HTMLElement>("div, span");
      elements.forEach((element) => {
        const className = element.className;
        if (className) {
          Object.assign(element.style, getFormatStylesFn(className));
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
