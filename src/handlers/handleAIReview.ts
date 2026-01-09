import React from "react";

/**
 * @function createHandleAIReview
 * @description معالج مراجعة AI للمحتوى
 */
export const createHandleAIReview = (
  editorRef: React.RefObject<HTMLDivElement | null>,
  setIsReviewing: (reviewing: boolean) => void,
  setReviewResult: (result: string) => void
) => {
  return async () => {
    if (!editorRef.current) return;

    setIsReviewing(true);
    const content = editorRef.current.innerText;

    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const mockReview = `AI Review Results:

Strengths:
- Good character development
- Strong dialogue
- Clear scene structure

Areas for improvement:
- Consider adding more action descriptions
- Some dialogue could be more natural
- Scene transitions could be smoother

Suggestions:
- Add more sensory details to action lines
- Vary sentence structure in dialogue
- Ensure each scene has a clear purpose`;

      setReviewResult(mockReview);
    } catch (error) {
      setReviewResult(`AI review failed: ${error}`);
    } finally {
      setIsReviewing(false);
    }
  };
};
