export interface EnvironmentConfig {
  geminiApiKey: string;
}

const getGeminiApiKey = (): string => {
  if (typeof window !== 'undefined') {
    return '';
  }
  const apiKey = process.env.GEMINI_API_KEY || '';
  return apiKey;
};

export const environment: EnvironmentConfig = {
  geminiApiKey: getGeminiApiKey(),
};
