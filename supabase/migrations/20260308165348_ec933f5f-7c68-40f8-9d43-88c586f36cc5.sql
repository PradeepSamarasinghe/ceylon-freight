
-- Profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  display_name TEXT,
  company_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.email));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add user_id to shipments for ownership
ALTER TABLE public.shipments ADD COLUMN user_id UUID REFERENCES auth.users(id);

-- Update shipments RLS to allow users to see their own shipments
DROP POLICY IF EXISTS "Shipments are viewable by everyone" ON public.shipments;
CREATE POLICY "Shipments are viewable by everyone"
  ON public.shipments FOR SELECT
  USING (true);

-- Update insert policy to set user_id
DROP POLICY IF EXISTS "Anyone can create shipments" ON public.shipments;
CREATE POLICY "Authenticated users can create shipments"
  ON public.shipments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Keep update policy for shipment status changes
DROP POLICY IF EXISTS "Anyone can update shipments" ON public.shipments;
CREATE POLICY "Users can update own shipments"
  ON public.shipments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Trigger for updated_at on profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
