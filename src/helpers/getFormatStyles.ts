import React from "react";

/**
 * @function getFormatStyles
 * @description يحصل على الـ CSS styles المناسبة لكل نوع من أنواع التنسيق في السيناريو
 * @param formatType - نوع التنسيق (action, character, dialogue, etc.)
 * @param selectedSize - حجم الخط المحدد
 * @returns React.CSSProperties - الـ styles المناسبة
 */
export const getFormatStyles = (
  formatType: string,
  selectedSize: string = "12pt",
  selectedFont: string = "AzarMehrMonospaced-San"
): React.CSSProperties => {
  const baseStyles: React.CSSProperties = {
    fontFamily: selectedFont,
    fontSize: selectedSize,
    direction: "rtl",
    lineHeight: "14pt",
    marginBottom: "2pt",
    minHeight: "14pt",
  };

  const formatStyles: { [key: string]: React.CSSProperties } = {
    basmala: { textAlign: "left", margin: "0 auto" },
    "scene-header-top-line": {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "baseline",
      width: "100%",
    },
    "scene-header-3": {
      textAlign: "center",
    },
    action: { textAlign: "right", width: "100%", margin: "0" },
    character: {
      textAlign: "center",
      margin: "0 auto",
    },
    parenthetical: {
      textAlign: "center",
      margin: "0 auto",
    },
    dialogue: {
      width: "2.5in",
      textAlign: "center",
      margin: "0 auto",
    },
    transition: {
      textAlign: "center",
      margin: "0 auto",
    },
    "scene-header-1": {
      flex: "0 0 auto",
    },
    "scene-header-2": {
      flex: "0 0 auto",
    },
  };

  const finalStyles = { ...formatStyles[formatType], ...baseStyles };
  return finalStyles;
};
