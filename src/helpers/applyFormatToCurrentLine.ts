import React from "react";

/**
 * @function applyFormatToCurrentLine
 * @description تطبق التنسيق على السطر الحالي وتنشئ سطراً جديداً عند الحاجة
 * @param formatType - نوع التنسيق المراد تطبيقه
 * @param getFormatStylesFn - دالة للحصول على الـ styles
 * @param setCurrentFormat - دالة لتحديث التنسيق الحالي في الـ state
 * @param isEnterAction - هل تم استدعاء الدالة بسبب ضغط Enter؟
 */
export const applyFormatToCurrentLine = (
  formatType: string,
  getFormatStylesFn: (formatType: string) => React.CSSProperties,
  setCurrentFormat: (format: string) => void,
  isEnterAction: boolean = false
) => {
  const selection = window.getSelection();
  if (selection && selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    let element = range.startContainer.parentElement;

    if (element) {
      // إذا كان إجراء Enter، نحتاج لإنشاء سطر جديد بالتنسيق المطلوب
      if (isEnterAction) {
        const currentText = element.textContent || "";

        // حساب الإزاحة الصحيحة داخل السطر
        // في contentEditable، range.startContainer قد يكون TextNode
        // و range.startOffset هو الإزاحة داخل هذا TextNode
        let textNode = range.startContainer;
        let offset = range.startOffset;

        // إذا كانت العقدة نصية، نحسب الإزاحة الكلية داخل السطر
        if (textNode.nodeType === Node.TEXT_NODE) {
          let totalOffset = 0;
          let currentNode = element.firstChild;

          // اجتياز جميع العقد التابعة للعنصر
          while (currentNode && currentNode !== textNode) {
            totalOffset += currentNode.textContent?.length || 0;
            currentNode = currentNode.nextSibling;
          }

          // إضافة الإزاحة داخل العقدة النصية الحالية
          if (currentNode === textNode) {
            totalOffset += offset;
          }

          offset = totalOffset;
        }

        // النص قبل المؤشر يبقى في السطر الحالي
        const beforeText = currentText.slice(0, offset);
        // النص بعد المؤشر يذهب للسطر الجديد
        const afterText = currentText.slice(offset);

        // تحديث السطر الحالي بالنص قبل المؤشر
        element.textContent = beforeText;

        // إنشاء سطر جديد فارغ (بدون afterText لأننا نريد سطراً فارغاً للحوار)
        const newLine = document.createElement('div');
        newLine.className = formatType;
        newLine.textContent = ''; // سطر فارغ بالكامل
        Object.assign(newLine.style, getFormatStylesFn(formatType));

        // إدراج السطر الجديد بعد السطر الحالي
        if (element.parentElement) {
          element.parentElement.insertBefore(newLine, element.nextSibling);
        }

        // وضع المؤشر في بداية السطر الجديد
        const newRange = document.createRange();
        newRange.setStart(newLine, 0);
        newRange.collapse(true);
        selection.removeAllRanges();
        selection.addRange(newRange);

        setCurrentFormat(formatType);
      } else {
        // للإجراءات الأخرى (Tab)، فقط غيّر تنسيق السطر الحالي
        element.className = formatType;
        Object.assign(element.style, getFormatStylesFn(formatType));
        setCurrentFormat(formatType);
      }
    }
  }
};
