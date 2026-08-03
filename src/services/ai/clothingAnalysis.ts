import { getGeminiVisionModel } from "@/lib/gemini";
import { AIAnalysisResult } from "@/types";

export const analyzeClothingImage = async (
  base64Image: string,
  mimeType: string
): Promise<AIAnalysisResult> => {
  const model = getGeminiVisionModel();
  if (!model) {
    throw new Error("AI Model is not configured.");
  }

  const prompt = `
    You are an expert AI fashion stylist. Analyze this clothing item image and provide detailed attributes.
    Return ONLY a valid JSON object matching this exact schema, with no markdown formatting or backticks:
    {
      "category": "One of: T-Shirt, Shirt, Polo, Tank Top, Sweater, Hoodie, Jacket, Coat, Blazer, Jeans, Trousers, Shorts, Skirt, Dress, Jumpsuit, Activewear, Sneakers, Boots, Sandals, Heels, Flats, Loafers, Watch, Belt, Hat, Scarf, Gloves, Sunglasses, Bag, Jewelry, Other",
      "color": "Primary color",
      "style": "One of: Casual, Smart Casual, Business, Formal, Streetwear, Sporty, Athleisure, Bohemian, Vintage, Minimalist, Grunge, Preppy, Lounge, Party",
      "pattern": "One of: Solid, Striped, Plaid, Floral, Polka Dot, Checkered, Animal Print, Geometric, Graphic, Tie-Dye, Camouflage, Textured",
      "season": "One of: Spring, Summer, Fall, Winter, All Season",
      "brand": "Identifiable brand name (or null if none)",
      "fabric": "Guessed primary fabric (e.g., Cotton, Denim, Leather, Silk, Polyester, Wool)",
      "occasion": "One of: Everyday, Work, Date Night, Night Out, Workout, Lounge, Travel, Formal Event, Wedding, Vacation",
      "gender": "One of: Unisex, Male, Female, Kids",
      "name": "A catchy, short descriptive name for the item (e.g., 'Classic Denim Jacket' or 'Vibrant Floral Sundress')",
      "description": "A 1-2 sentence detailed description of the item's aesthetic and fit",
      "confidenceScores": {
        "category": number (0-1),
        "color": number (0-1),
        "style": number (0-1)
      }
    }
  `;

  try {
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Image,
          mimeType,
        },
      },
    ]);

    const response = await result.response;
    const text = response.text();
    
    // Clean up potential markdown formatting from the response
    const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const parsed = JSON.parse(cleanedText) as AIAnalysisResult;
    return parsed;
  } catch (error) {
    console.error("Gemini Vision API Error:", error);
    throw new Error("Failed to analyze image. Please try again.");
  }
};
