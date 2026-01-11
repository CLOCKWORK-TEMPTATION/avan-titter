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
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "gemini-3-flash-preview",
          messages: [
            {
              role: "user",
              content: `You are an expert Arabic Screenplay Formatter.

Analyze the following screenplay text and return a concise formatting review.

FOCUS ONLY ON FORMATTING:
- Scene headers (scene-header-1/2/3 correctness)
- Character vs dialogue separation
- Parentheticals and transitions
- Any lines misclassified as action

Return plain text in Arabic.

TEXT:
${(content || "").slice(0, 12000)}
`,
            },
          ],
        }),
      });

      if (!response.ok) {
        const details = await response.text().catch(() => "");
        throw new Error(`API error: ${response.status}${details ? ` - ${details}` : ""}`);
      }

      const data = await response.json();
      const result =
        typeof data?.content === "string"
          ? data.content
          : JSON.stringify(data, null, 2);

      setReviewResult(result);
    } catch (error) {
      setReviewResult(
        `AI review failed: ${error instanceof Error ? error.message : String(error)}`
      );
    } finally {
      setIsReviewing(false);
    }
  };
};
