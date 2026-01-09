import React from "react";
import { AdvancedSearchEngine } from "../classes/systems/AdvancedSearchEngine";
import { applyRegexReplacementToTextNodes } from "../modules/domTextReplacement";

/**
 * @function createHandleReplace
 * @description معالج الاستبدال في المحتوى
 */
export const createHandleReplace = (
  searchTerm: string,
  replaceTerm: string,
  editorRef: React.RefObject<HTMLDivElement | null>,
  searchEngine: React.MutableRefObject<AdvancedSearchEngine>,
  updateContent: () => void,
  setShowReplaceDialog: (show: boolean) => void,
  setSearchTerm: (term: string) => void,
  setReplaceTerm: (term: string) => void
) => {
  return async () => {
    if (!searchTerm.trim() || !editorRef.current) return;

    const content = editorRef.current.innerText;
    const result = await searchEngine.current.replaceInContent(
      content,
      searchTerm,
      replaceTerm,
    );

    if (result.success && editorRef.current) {
      const replacementsApplied = applyRegexReplacementToTextNodes(
        editorRef.current,
        result.patternSource as string,
        result.patternFlags as string,
        result.replaceText as string,
        result.replaceAll !== false,
      );

      if (replacementsApplied > 0) {
        updateContent();
      }

      alert(
        `تم استبدال ${replacementsApplied} حالة من "${searchTerm}" بـ "${replaceTerm}"`,
      );
      setShowReplaceDialog(false);
      setSearchTerm("");
      setReplaceTerm("");
    } else {
      alert(`فشل الاستبدال: ${result.error}`);
    }
  };
};
