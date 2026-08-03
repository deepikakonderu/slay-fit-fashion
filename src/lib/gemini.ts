import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

/**
 * Check if the Gemini API key is configured.
 * AI features gracefully degrade when this is false.
 */
export const isGeminiConfigured = (): boolean => {
  return !!API_KEY && API_KEY !== 'your_gemini_api_key' && API_KEY !== 'your_gemini_api_key_here';
};

// Initialize the Google Generative AI client (only if key exists)
const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

// Default safety settings
const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

export const getGeminiVisionModel = () => {
  if (!genAI) {
    throw new Error(
      "Gemini API key is not configured. Add VITE_GEMINI_API_KEY to your .env file to enable AI features."
    );
  }
  return genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    safetySettings,
  });
};

export const getGeminiChatModel = () => {
  if (!genAI) {
    throw new Error(
      "Gemini API key is not configured. Add VITE_GEMINI_API_KEY to your .env file to enable AI features."
    );
  }
  return genAI.getGenerativeModel({
    model: "gemini-1.5-pro",
    safetySettings,
  });
};

/**
 * Helper to convert a file to the format required by Gemini Vision API
 */
export async function fileToGenerativePart(file: File): Promise<{
  inlineData: {
    data: string;
    mimeType: string;
  };
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Data = (reader.result as string).split(",")[1];
      resolve({
        inlineData: {
          data: base64Data,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
