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
  selectedSize: string = "14pt"
): React.CSSProperties => {
  const baseStyles: React.CSSProperties = {
    fontFamily: `"Cairo", system-ui, -apple-system, sans-serif`,
    fontSize: selectedSize,
    direction: "rtl",
    lineHeight: "1.8",
    minHeight: "1.2em",
  };

  const formatStyles: { [key: string]: React.CSSProperties } = {
    basmala: { textAlign: "left", margin: "0" },
    "scene-header-top-line": {
      display: "flex",
      justifyContent: "space-between",
      width: "100%",
      margin: "1rem 0 0 0",
    },
    "scene-header-3": {
      textAlign: "center",
      fontWeight: "bold",
      margin: "0 0 1rem 0",
    },
    action: { textAlign: "right", margin: "12px 0" },
    character: {
      textAlign: "center",
      fontWeight: "bold",
      textTransform: "uppercase",
      width: "2.5in",
      margin: "12px auto 0 auto",
    },
    parenthetical: {
      textAlign: "center",
      fontStyle: "italic",
      width: "2.0in",
      margin: "6px auto",
    },
    dialogue: {
      textAlign: "center",
      width: "2.5in",
      lineHeight: "1.2",
      margin: "0 auto 12px auto",
    },
    transition: {
      textAlign: "center",
      fontWeight: "bold",
      textTransform: "uppercase",
      margin: "1rem 0",
    },
  };

  const finalStyles = { ...baseStyles, ...formatStyles[formatType] };

  if (formatType === "scene-header-1")
    return {
      ...baseStyles,
      fontWeight: "bold",
      textTransform: "uppercase",
      margin: "0",
    };
  if (formatType === "scene-header-2")
    return { ...baseStyles, fontStyle: "italic", margin: "0" };

  return finalStyles;
};
