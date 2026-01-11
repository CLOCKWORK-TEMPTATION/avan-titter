import React from "react";

/**
 * @function applyFormatToCurrentLine
 * @description تطبق التنسيق على السطر الحالي
 * @param formatType - نوع التنسيق المراد تطبيقه
 * @param getFormatStylesFn - دالة للحصول على الـ styles
 * @param setCurrentFormat - دالة لتحديث التنسيق الحالي في الـ state
 */
export const applyFormatToCurrentLine = (
  formatType: string,
  getFormatStylesFn: (formatType: string) => React.CSSProperties,
  setCurrentFormat: (format: string) => void
) => {
  const selection = window.getSelection();
  if (selection && selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    const element = range.startContainer.parentElement;

    if (element) {
      element.className = formatType;
      Object.assign(element.style, getFormatStylesFn(formatType));
      setCurrentFormat(formatType);
    }
  }
};
