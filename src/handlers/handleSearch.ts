import React from "react";
import { AdvancedSearchEngine } from "../classes/systems/AdvancedSearchEngine";

/**
 * @function createHandleSearch
 * @description معالج البحث في المحتوى
 */
export const createHandleSearch = (
  searchTerm: string,
  editorRef: React.RefObject<HTMLDivElement | null>,
  searchEngine: React.MutableRefObject<AdvancedSearchEngine>,
  setShowSearchDialog: (show: boolean) => void
) => {
  return async () => {
    if (!searchTerm.trim() || !editorRef.current) return;

    const content = editorRef.current.innerText;
    const result = await searchEngine.current.searchInContent(
      content,
      searchTerm,
    );

    if (result.success) {
      alert(`تم العثور على ${result.totalMatches} نتيجة لـ "${searchTerm}"`);
      setShowSearchDialog(false);
    } else {
      alert(`فشل البحث: ${result.error}`);
    }
  };
};
