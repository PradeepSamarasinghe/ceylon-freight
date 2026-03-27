
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('shipper', 'driver');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS: users can read their own roles
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS: users can insert their own role at signup
CREATE POLICY "Users can insert own role"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Link drivers to auth users
ALTER TABLE public.drivers ADD COLUMN user_id UUID REFERENCES auth.users(id) UNIQUE;

-- Allow authenticated drivers to insert their own driver record
DROP POLICY IF EXISTS "Drivers are viewable by everyone" ON public.drivers;
CREATE POLICY "Drivers are viewable by everyone"
  ON public.drivers FOR SELECT
  USING (true);

CREATE POLICY "Drivers can insert own record"
  ON public.drivers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Drivers can update own record"
  ON public.drivers FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow drivers to update bookings they're assigned to
CREATE POLICY "Drivers can update own bookings"
  ON public.bookings FOR UPDATE
  TO authenticated
  USING (
    driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid())
  );
