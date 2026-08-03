import { getGeminiChatModel } from "@/lib/gemini";
import { WardrobeItem, Profile } from "@/types";

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export const getFashionAdvice = async (
  messages: ChatMessage[],
  wardrobe: WardrobeItem[],
  profile: Profile | null
): Promise<string> => {
  const model = getGeminiChatModel();
  if (!model) {
    throw new Error("AI Model is not configured.");
  }

  // Pre-process wardrobe for context (reduce size)
  const wardrobeContext = wardrobe.map(i => `${i.color} ${i.name || i.category}`).join(", ");
  const topCategories = Object.entries(
    wardrobe.reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).sort((a, b) => b[1] - a[1]).slice(0, 5).map(c => c[0]).join(", ");

  const systemContext = `
    You are 'Slay', an elite AI personal fashion stylist. You are chatting with a user to help them look their best.
    Your tone should be chic, encouraging, confident, and highly knowledgeable about fashion trends, color theory, and body types.
    
    User Profile:
    - Name: ${profile?.full_name || 'Friend'}
    - Preferred Style: ${profile?.preferred_style || 'Not specified'}
    - Favorite Colors: ${profile?.favorite_colors || 'Not specified'}
    
    User's Wardrobe Snapshot:
    - Total Items: ${wardrobe.length}
    - Most common items: ${topCategories}
    - Quick list: ${wardrobeContext.substring(0, 500)}...
    
    Guidelines:
    - Keep responses concise (under 150 words unless giving a detailed packing list).
    - Be enthusiastic but professional.
    - Reference their actual wardrobe items when making suggestions.
    - If they ask what they should buy, identify gaps in their wardrobe (e.g., if they have no blazers but want a business look).
    - Format output using standard markdown.
  `;

  // Format history for Gemini API (it uses 'model' instead of 'assistant')
  const formattedHistory = messages.map(msg => ({
    role: msg.role === 'assistant' ? 'model' : msg.role,
    parts: [{ text: msg.content }]
  }));

  try {
    const chat = model.startChat({
      history: [
        { role: 'user', parts: [{ text: "System prompt (read silently): " + systemContext }] },
        { role: 'model', parts: [{ text: "Understood. I am Slay, the elite AI fashion stylist. How can I help the user today?" }] },
        ...formattedHistory.slice(0, -1) // Exclude the latest message
      ],
    });

    const latestMessage = messages[messages.length - 1].content;
    const result = await chat.sendMessage(latestMessage);
    const response = await result.response;
    return response.text();
    
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    throw new Error("Failed to get advice. Please try again.");
  }
};
