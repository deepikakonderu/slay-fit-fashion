-- Ensure user_id replaces id as PK for profiles (fix the schema mismatch)
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_pkey CASCADE;
-- Rename id to user_id if it exists
DO $$ 
BEGIN
  IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name='profiles' and column_name='id') THEN
    ALTER TABLE public.profiles RENAME COLUMN id TO user_id;
  END IF;
END $$;
-- Make sure it's a primary key
ALTER TABLE public.profiles ADD PRIMARY KEY (user_id);

-- Add missing columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gender_preference TEXT DEFAULT 'All';

-- Add missing columns to wardrobe_items
ALTER TABLE public.wardrobe_items ADD COLUMN IF NOT EXISTS brand TEXT;
ALTER TABLE public.wardrobe_items ADD COLUMN IF NOT EXISTS fabric TEXT;
ALTER TABLE public.wardrobe_items ADD COLUMN IF NOT EXISTS occasion TEXT;
ALTER TABLE public.wardrobe_items ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE public.wardrobe_items ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.wardrobe_items ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.wardrobe_items ADD COLUMN IF NOT EXISTS ai_description TEXT;
ALTER TABLE public.wardrobe_items ADD COLUMN IF NOT EXISTS file_path TEXT;
ALTER TABLE public.wardrobe_items ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT false;

-- Create saved_outfits table
CREATE TABLE IF NOT EXISTS public.saved_outfits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  items JSONB NOT NULL,
  occasion TEXT,
  style TEXT,
  ai_score INTEGER,
  gender TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create events table
CREATE TABLE IF NOT EXISTS public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  occasion TEXT NOT NULL,
  dress_code TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create chat_messages table for AI history
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Set up RLS for saved_outfits
ALTER TABLE public.saved_outfits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own saved_outfits"
  ON public.saved_outfits
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Set up RLS for events
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own events"
  ON public.events
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Set up RLS for chat_messages
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own chat_messages"
  ON public.chat_messages
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add updated_at trigger for events
CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
