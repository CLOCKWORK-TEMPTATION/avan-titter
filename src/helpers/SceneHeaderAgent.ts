import React from "react";
import { ScreenplayClassifier } from "../classes/ScreenplayClassifier";

/**
 * @function SceneHeaderAgent
 * @description معالج رؤوس المشاهد - يحلل سطر النص ويحدد إذا كان رأس مشهد ويقوم بتنسيقه
 * @param line - السطر المراد معالجته
 * @param ctx - السياق (هل نحن في حوار أم لا)
 * @param getFormatStylesFn - دالة للحصول على الـ styles حسب النوع
 * @returns HTML للرأس المنسق أو null إذا لم يكن رأس مشهد
 */
export const SceneHeaderAgent = (
  line: string,
  ctx: { inDialogue: boolean },
  getFormatStylesFn: (formatType: string) => React.CSSProperties
) => {
  const classifier = new ScreenplayClassifier();
  const Patterns = classifier.Patterns;
  const trimmedLine = line.trim();

  const m2 = trimmedLine.match(/^(مشهد\s*\d+)\s*[-–—:،]?\s*(.*)$/i);

  if (m2) {
    const head = (m2[1] || "").trim();
    const rest = (m2[2] || "").trim();

    if (
      rest &&
      (Patterns.sceneHeader2.time.test(rest) ||
        Patterns.sceneHeader2.inOut.test(rest))
    ) {
      const container = document.createElement("div");
      container.className = "scene-header-top-line";
      Object.assign(
        container.style,
        getFormatStylesFn("scene-header-top-line")
      );

      const part1 = document.createElement("span");
      part1.className = "scene-header-1";
      part1.textContent = head;
      Object.assign(part1.style, getFormatStylesFn("scene-header-1"));

      const part2 = document.createElement("span");
      part2.className = "scene-header-2";
      part2.textContent = rest;
      Object.assign(part2.style, getFormatStylesFn("scene-header-2"));

      container.appendChild(part1);
      container.appendChild(part2);
      ctx.inDialogue = false;
      return { html: container.outerHTML, processed: true };
    } else if (rest) {
      if (rest.includes("–") || rest.includes("-")) {
        const container = document.createElement("div");
        container.className = "scene-header-top-line";
        Object.assign(
          container.style,
          getFormatStylesFn("scene-header-top-line")
        );

        const part1 = document.createElement("span");
        part1.className = "scene-header-1";
        part1.textContent = head;
        Object.assign(part1.style, getFormatStylesFn("scene-header-1"));

        const part2 = document.createElement("span");
        part2.className = "scene-header-2";
        part2.textContent = rest;
        Object.assign(part2.style, getFormatStylesFn("scene-header-2"));

        container.appendChild(part1);
        container.appendChild(part2);
        ctx.inDialogue = false;
        return { html: container.outerHTML, processed: true };
      } else {
        const container = document.createElement("div");
        container.className = "scene-header-top-line";
        Object.assign(
          container.style,
          getFormatStylesFn("scene-header-top-line")
        );

        const part1 = document.createElement("span");
        part1.className = "scene-header-1";
        part1.textContent = head;
        Object.assign(part1.style, getFormatStylesFn("scene-header-1"));

        const part2 = document.createElement("span");
        part2.className = "scene-header-2";
        part2.textContent = rest;
        Object.assign(part2.style, getFormatStylesFn("scene-header-2"));

        container.appendChild(part1);
        container.appendChild(part2);
        ctx.inDialogue = false;
        return { html: container.outerHTML, processed: true };
      }
    } else {
      const container = document.createElement("div");
      container.className = "scene-header-top-line";
      Object.assign(
        container.style,
        getFormatStylesFn("scene-header-top-line")
      );

      const part1 = document.createElement("span");
      part1.className = "scene-header-1";
      part1.textContent = head;
      Object.assign(part1.style, getFormatStylesFn("scene-header-1"));

      container.appendChild(part1);
      ctx.inDialogue = false;
      return { html: container.outerHTML, processed: true };
    }
  }

  if (Patterns.sceneHeader3.test(trimmedLine)) {
    const element = document.createElement("div");
    element.className = "scene-header-3";
    element.textContent = trimmedLine;
    Object.assign(element.style, getFormatStylesFn("scene-header-3"));
    ctx.inDialogue = false;
    return { html: element.outerHTML, processed: true };
  }

  return null;
};
