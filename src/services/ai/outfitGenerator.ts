import { getGeminiChatModel } from "@/lib/gemini";
import { WardrobeItem, GeneratedOutfit } from "@/types";

interface GenerationPreferences {
  occasion?: string;
  style?: string;
  gender?: string;
  weather?: string;
  mood?: string;
}

export const generateOutfitWithAI = async (
  wardrobe: WardrobeItem[],
  preferences: GenerationPreferences
): Promise<GeneratedOutfit> => {
  const model = getGeminiChatModel();
  if (!model) {
    throw new Error("AI Model is not configured.");
  }

  // Pre-process wardrobe to reduce token usage and improve AI understanding
  const simplifiedWardrobe = wardrobe.map((item) => ({
    id: item.id,
    category: item.category,
    color: item.color,
    style: item.style,
    pattern: item.pattern,
    name: item.name,
    is_favorite: item.is_favorite,
  }));

  const prompt = `
    You are an elite personal fashion stylist. 
    Create the PERFECT outfit from the provided wardrobe based on the following preferences:
    Occasion: ${preferences.occasion || "Any"}
    Style Preference: ${preferences.style || "Any"}
    Target Gender: ${preferences.gender || "Any"}
    Weather Context: ${preferences.weather || "Unknown"}
    Current Mood: ${preferences.mood || "Unknown"}

    Available Wardrobe (JSON):
    ${JSON.stringify(simplifiedWardrobe)}

    Rules:
    1. The outfit must be cohesive and follow color theory (complementary, analogous, monochrome, etc.).
    2. Respect the occasion and weather.
    3. You must select either [top + bottom] OR [one_piece]. You may also optionally add shoes and accessories.
    4. Only use items that are in the provided wardrobe JSON.
    5. Return ONLY a valid JSON object matching this schema, with no markdown formatting or backticks:
    {
      "top_id": "string id or null",
      "bottom_id": "string id or null",
      "one_piece_id": "string id or null",
      "shoes_id": "string id or null",
      "accessories_ids": ["array of string ids"],
      "styleNotes": "A 2-3 sentence stylish explanation of why this outfit works and how to wear it.",
      "occasion": "The specific occasion this fits best",
      "aiScore": number (70-100, rating how good this combination is)
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    const text = await result.response.text();
    const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const parsed = JSON.parse(cleanedText);
    
    // Map IDs back to full wardrobe items
    const top = wardrobe.find(i => i.id === parsed.top_id);
    const bottom = wardrobe.find(i => i.id === parsed.bottom_id);
    const one_piece = wardrobe.find(i => i.id === parsed.one_piece_id);
    const shoes = wardrobe.find(i => i.id === parsed.shoes_id);
    const accessories = parsed.accessories_ids
      ? parsed.accessories_ids.map((id: string) => wardrobe.find(i => i.id === id)).filter(Boolean)
      : [];

    if (!one_piece && (!top || !bottom)) {
        throw new Error("AI generated an incomplete outfit (missing top/bottom or one-piece).");
    }

    return {
      top,
      bottom,
      one_piece,
      shoes,
      accessories,
      styleNotes: parsed.styleNotes || "A stylish combination curated just for you.",
      occasion: parsed.occasion || preferences.occasion || "Everyday",
      aiScore: parsed.aiScore || 85,
    };
  } catch (error) {
    console.error("Gemini Outfit Generation Error:", error);
    throw new Error("Failed to generate outfit. Please try again.");
  }
};
