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

  const parsed = ScreenplayClassifier.parseSceneHeaderFromLine(trimmedLine);
  if (parsed) {
    const container = document.createElement("div");
    container.className = "scene-header-top-line";
    Object.assign(container.style, getFormatStylesFn("scene-header-top-line"));

    const part1 = document.createElement("span");
    part1.className = "scene-header-1";
    part1.textContent = parsed.sceneNum;
    Object.assign(part1.style, getFormatStylesFn("scene-header-1"));
    container.appendChild(part1);

    if (parsed.timeLocation) {
      const part2 = document.createElement("span");
      part2.className = "scene-header-2";
      part2.textContent = parsed.timeLocation;
      Object.assign(part2.style, getFormatStylesFn("scene-header-2"));
      container.appendChild(part2);
    }

    let html = container.outerHTML;

    if (parsed.placeInline) {
      const placeDiv = document.createElement("div");
      placeDiv.className = "scene-header-3";
      placeDiv.textContent = parsed.placeInline;
      Object.assign(placeDiv.style, getFormatStylesFn("scene-header-3"));
      html += placeDiv.outerHTML;
    }

    ctx.inDialogue = false;
    return { html, processed: true };
  }

  const normalized = ScreenplayClassifier.normalizeLine(trimmedLine);
  const wordCount = normalized ? normalized.split(/\s+/).filter(Boolean).length : 0;
  const hasDash = /[-–—]/.test(normalized);
  const hasColon = normalized.includes(":") || normalized.includes("：");
  const hasSentencePunctuation = /[\.!؟\?]/.test(normalized);

  if (
    Patterns.sceneHeader3.test(trimmedLine) &&
    wordCount <= 6 &&
    !hasDash &&
    !hasColon &&
    !hasSentencePunctuation
  ) {
    const element = document.createElement("div");
    element.className = "scene-header-3";
    element.textContent = trimmedLine;
    Object.assign(element.style, getFormatStylesFn("scene-header-3"));
    ctx.inDialogue = false;
    return { html: element.outerHTML, processed: true };
  }

  return null;
};
