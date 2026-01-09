import React from "react";
import { applyRegexReplacementToTextNodes } from "../modules/domTextReplacement";

/**
 * @function createHandleCharacterRename
 * @description معالج إعادة تسمية الشخصيات
 */
export const createHandleCharacterRename = (
  oldCharacterName: string,
  newCharacterName: string,
  editorRef: React.RefObject<HTMLDivElement | null>,
  updateContent: () => void,
  setShowCharacterRename: (show: boolean) => void,
  setOldCharacterName: (name: string) => void,
  setNewCharacterName: (name: string) => void
) => {
  return () => {
    if (
      !oldCharacterName.trim() ||
      !newCharacterName.trim() ||
      !editorRef.current
    )
      return;

    const regex = new RegExp(`^\\s*${oldCharacterName}\\s*$`, "gmi");

    if (editorRef.current) {
      const replacementsApplied = applyRegexReplacementToTextNodes(
        editorRef.current,
        regex.source,
        regex.flags,
        newCharacterName.toUpperCase(),
        true,
      );

      if (replacementsApplied > 0) {
        updateContent();
        alert(
          `تم إعادة تسمية الشخصية "${oldCharacterName}" إلى "${newCharacterName}" (${replacementsApplied} حالة)`,
        );
        setShowCharacterRename(false);
        setOldCharacterName("");
        setNewCharacterName("");
      } else {
        alert(
          `لم يتم العثور على الشخصية "${oldCharacterName}" لإعادة تسميتها.`,
        );
        setShowCharacterRename(false);
      }
    }
  };
};
