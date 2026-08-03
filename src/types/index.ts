export interface WardrobeItem {
  id: string;
  user_id: string;
  category: string;
  image_url: string;
  color: string | null;
  style: string | null;
  pattern: string | null;
  season: string | null;
  brand: string | null;
  fabric: string | null;
  occasion: string | null;
  gender: string | null;
  name: string | null;
  description: string | null;
  ai_description: string | null;
  file_path: string | null;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

export interface SavedOutfit {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  items: {
    top?: WardrobeItem | null;
    bottom?: WardrobeItem | null;
    shoes?: WardrobeItem | null;
    accessories?: WardrobeItem[];
    one_piece?: WardrobeItem | null; // For dresses, jumpsuits, etc.
  };
  occasion: string | null;
  style: string | null;
  ai_score: number | null;
  gender: string | null;
  created_at: string;
}

export interface GeneratedOutfit {
  top?: WardrobeItem;
  bottom?: WardrobeItem;
  shoes?: WardrobeItem;
  accessories: WardrobeItem[];
  one_piece?: WardrobeItem; // For dresses/suits
  styleNotes: string;
  occasion: string;
  aiScore: number;
}

export interface Profile {
  user_id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  preferred_style: string | null;
  favorite_colors: string | null;
  gender_preference: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface Event {
  id: string;
  title: string;
  date: string;
  occasion: string;
  dress_code: string | null;
  description: string | null;
}

export interface AIAnalysisResult {
  category: string;
  color: string;
  style: string;
  pattern: string;
  season: string;
  brand?: string;
  fabric?: string;
  occasion?: string;
  gender?: string;
  name?: string;
  description?: string;
  confidenceScores: Record<string, number>;
}
