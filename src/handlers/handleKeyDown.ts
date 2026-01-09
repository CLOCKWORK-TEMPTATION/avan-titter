import React from "react";

/**
 * @function handleKeyDown
 * @description معالج أحداث لوحة المفاتيح - Tab, Enter, Ctrl shortcuts
 */
export const createHandleKeyDown = (
  currentFormat: string,
  getNextFormatOnTab: (format: string, shiftKey: boolean) => string,
  getNextFormatOnEnter: (format: string) => string,
  applyFormatToCurrentLine: (format: string) => void,
  formatText: (command: string, value?: string) => void,
  setShowSearchDialog: (show: boolean) => void,
  setShowReplaceDialog: (show: boolean) => void,
  updateContent: () => void
) => {
  return (e: React.KeyboardEvent) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const nextFormat = getNextFormatOnTab(currentFormat, e.shiftKey);
      applyFormatToCurrentLine(nextFormat);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const nextFormat = getNextFormatOnEnter(currentFormat);
      applyFormatToCurrentLine(nextFormat);
    } else if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case "b":
        case "B":
          e.preventDefault();
          formatText("bold");
          break;
        case "i":
        case "I":
          e.preventDefault();
          formatText("italic");
          break;
        case "u":
        case "U":
          e.preventDefault();
          formatText("underline");
          break;
        case "1":
          e.preventDefault();
          applyFormatToCurrentLine("scene-header-top-line");
          break;
        case "2":
          e.preventDefault();
          applyFormatToCurrentLine("character");
          break;
        case "3":
          e.preventDefault();
          applyFormatToCurrentLine("dialogue");
          break;
        case "4":
          e.preventDefault();
          applyFormatToCurrentLine("action");
          break;
        case "6":
          e.preventDefault();
          applyFormatToCurrentLine("transition");
          break;
        case "f":
        case "F":
          e.preventDefault();
          setShowSearchDialog(true);
          break;
        case "h":
        case "H":
          e.preventDefault();
          setShowReplaceDialog(true);
          break;
      }
    }

    setTimeout(updateContent, 10);
  };
};
