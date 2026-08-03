import { getGeminiChatModel } from "@/lib/gemini";
import { WardrobeItem, Profile } from "@/types";

export interface WardrobeInsights {
  fashionScore: number;
  scoreDescription: string;
  missingEssentials: string[];
  colorPalette: {
    dominant: string[];
    missing: string[];
  };
  styleAnalysis: string;
  recommendations: string[];
}

export const generateWardrobeInsights = async (
  wardrobe: WardrobeItem[],
  profile: Profile | null
): Promise<WardrobeInsights> => {
  if (wardrobe.length < 3) {
     return {
         fashionScore: 20,
         scoreDescription: "Beginner level. You need to add more items to unlock full insights!",
         missingEssentials: ["White T-Shirt", "Classic Jeans", "Versatile Jacket"],
         colorPalette: { dominant: [], missing: ["Neutrals", "Accents"] },
         styleAnalysis: "Not enough items to analyze your style.",
         recommendations: ["Add at least 3-5 items to get started."]
     };
  }

  const model = getGeminiChatModel();
  if (!model) {
    throw new Error("AI Model is not configured.");
  }

  const simplifiedWardrobe = wardrobe.map(i => ({
    category: i.category,
    color: i.color,
    style: i.style
  }));

  const prompt = `
    You are an expert fashion analyst. Review this user's wardrobe and provide actionable insights.
    
    User Stated Preferences:
    Style: ${profile?.preferred_style || "Any"}
    Colors: ${profile?.favorite_colors || "Any"}
    
    Actual Wardrobe Items:
    ${JSON.stringify(simplifiedWardrobe)}
    
    Provide a JSON response matching exactly this schema, without backticks or markdown:
    {
      "fashionScore": number (0-100 based on versatility, cohesiveness, and covering essentials),
      "scoreDescription": "1 short sentence explaining the score",
      "missingEssentials": ["array of 3-4 specific clothing items they are missing that would maximize their wardrobe"],
      "colorPalette": {
        "dominant": ["array of 2-3 colors they wear most"],
        "missing": ["array of 1-2 colors that would complement their current wardrobe"]
      },
      "styleAnalysis": "2 sentences analyzing their actual style vs their stated preferences.",
      "recommendations": ["array of 2-3 specific fashion tips based on their wardrobe"]
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    const text = await result.response.text();
    const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    return JSON.parse(cleanedText) as WardrobeInsights;
  } catch (error) {
    console.error("Gemini Insights Error:", error);
    throw new Error("Failed to generate wardrobe insights.");
  }
};
