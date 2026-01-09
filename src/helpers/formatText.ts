/**
 * @function formatText
 * @description تطبق formatting باستخدام document.execCommand
 * @param command - الأمر المراد تنفيذه (bold, italic, underline, etc.)
 * @param value - القيمة الاختيارية للأمر
 */
export const formatText = (command: string, value: string = "") => {
  document.execCommand(command, false, value);
};
