import React, { useState } from "react";
import { X, Copy, Printer, Download, Check } from "lucide-react";

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  content: string;
  title: string;
}

export default function ExportDialog({
  isOpen,
  onClose,
  content,
  title,
}: ExportDialogProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    // Create a temporary element to extract text from HTML
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = content;
    const text = tempDiv.innerText;

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>${title}</title>
            <style>
              body {
                font-family: 'Cairo', system-ui, sans-serif;
                direction: rtl;
                padding: 2rem;
              }
            </style>
          </head>
          <body>
            ${content}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleDownloadHTML = () => {
    const element = document.createElement("a");
    const file = new Blob(
      [
        `
        <html>
          <head>
            <title>${title}</title>
            <meta charset="utf-8" />
            <style>
              body {
                font-family: 'Cairo', system-ui, sans-serif;
                direction: rtl;
                padding: 2rem;
              }
            </style>
          </head>
          <body>
            ${content}
          </body>
        </html>
      `,
      ],
      { type: "text/html" }
    );
    element.href = URL.createObjectURL(file);
    element.download = `${title}.html`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-700 rounded-lg p-6 w-96 max-w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            تصدير {title}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleCopy}
            className="w-full flex items-center justify-between px-4 py-3 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 rounded-lg transition-colors"
          >
            <span className="flex items-center text-gray-800 dark:text-gray-200">
              <Copy size={18} className="ml-2" />
              نسخ النص
            </span>
            {copied && <Check size={18} className="text-green-500" />}
          </button>

          <button
            onClick={handlePrint}
            className="w-full flex items-center justify-start px-4 py-3 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 rounded-lg transition-colors text-gray-800 dark:text-gray-200"
          >
            <Printer size={18} className="ml-2" />
            طباعة
          </button>

          <button
            onClick={handleDownloadHTML}
            className="w-full flex items-center justify-start px-4 py-3 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 rounded-lg transition-colors text-gray-800 dark:text-gray-200"
          >
            <Download size={18} className="ml-2" />
            تحميل كملف HTML
          </button>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white rounded hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}
