/**
 * @file SmartImportSystem.ts
 * @class SmartImportSystem
 * @description نظام الاستيراد الذكي - مسؤول عن الاتصال بنموذج Gemini للمراجعة النهائية للسيناريو
 */

export class SmartImportSystem {
  
  /**
   * يرسل السطور لنموذج Gemini للمراجعة النهائية
   * @param lines مصفوفة السطور اللي محتاجة مراجعة
   */
  async refineWithGemini(lines: {text: string, type: string}[]): Promise<{text: string, type: string}[]> {
    try {
      // إرسال طلب للباك إند
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gemini-3-flash-preview', 
          messages: [
            {
              role: 'user',
              content: `
                You are an expert Arabic Screenplay Formatter.
                Review this parsed screenplay content.
                
                RULES:
                1. 'scene-header-3' MUST be a sub-location (e.g., "أمام الباب", "داخل السيارة").
                2. Fix 'action' lines that are actually 'character' names.
                3. Do NOT change the text content.
                
                INPUT JSON:
                ${JSON.stringify(lines.slice(0, 200))} 

                Return ONLY JSON array.
              `
            }
          ]
        })
      });

      if (!response.ok) return [];

      const data = await response.json();
      const content = data.content || data.message || "";
      const jsonStr = content.replace(/```json|```/g, '').trim();
      return JSON.parse(jsonStr);

    } catch (error) {
      console.error("Smart Import AI Check Failed:", error);
      return []; 
    }
  }
}
