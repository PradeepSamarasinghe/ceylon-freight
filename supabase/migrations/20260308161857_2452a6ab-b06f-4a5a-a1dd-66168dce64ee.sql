
-- Create update_updated_at function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- DRIVERS table
CREATE TABLE public.drivers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  nic_number TEXT,
  license_number TEXT,
  truck_type TEXT NOT NULL,
  truck_registration TEXT,
  capacity_tons NUMERIC(6,2) NOT NULL DEFAULT 1,
  current_district TEXT,
  current_lat NUMERIC(10,7),
  current_lng NUMERIC(10,7),
  rating NUMERIC(2,1) DEFAULT 4.5,
  total_trips INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT false,
  is_available BOOLEAN DEFAULT true,
  is_online BOOLEAN DEFAULT false,
  earnings_total_lkr NUMERIC(12,2) DEFAULT 0,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Drivers are viewable by everyone" ON public.drivers FOR SELECT USING (true);

CREATE TRIGGER update_drivers_updated_at BEFORE UPDATE ON public.drivers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- SHIPMENTS table
CREATE TABLE public.shipments (
  id TEXT NOT NULL PRIMARY KEY,
  shipper_name TEXT NOT NULL,
  shipper_phone TEXT NOT NULL,
  shipper_company TEXT,
  pickup_district TEXT NOT NULL,
  pickup_address TEXT,
  pickup_landmark TEXT,
  delivery_district TEXT NOT NULL,
  delivery_address TEXT,
  delivery_landmark TEXT,
  cargo_type TEXT NOT NULL,
  cargo_description TEXT,
  weight_kg NUMERIC(10,2) NOT NULL,
  dimensions_l NUMERIC(6,2),
  dimensions_w NUMERIC(6,2),
  dimensions_h NUMERIC(6,2),
  cargo_value_lkr NUMERIC(12,2),
  truck_type TEXT NOT NULL,
  load_type TEXT NOT NULL DEFAULT 'FTL',
  ac_required BOOLEAN DEFAULT false,
  tail_lift_required BOOLEAN DEFAULT false,
  driver_helper BOOLEAN DEFAULT false,
  max_budget_lkr NUMERIC(12,2),
  offered_price_lkr NUMERIC(12,2),
  estimated_price_low NUMERIC(12,2),
  estimated_price_high NUMERIC(12,2),
  pickup_date TIMESTAMP WITH TIME ZONE,
  special_instructions TEXT,
  payment_method TEXT DEFAULT 'Cash on Delivery',
  status TEXT NOT NULL DEFAULT 'pending',
  driver_id UUID REFERENCES public.drivers(id),
  tracking_lat NUMERIC(10,7),
  tracking_lng NUMERIC(10,7),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  picked_up_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Shipments are viewable by everyone" ON public.shipments FOR SELECT USING (true);
CREATE POLICY "Anyone can create shipments" ON public.shipments FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update shipments" ON public.shipments FOR UPDATE USING (true);

CREATE TRIGGER update_shipments_updated_at BEFORE UPDATE ON public.shipments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- BOOKINGS table
CREATE TABLE public.bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shipment_id TEXT NOT NULL REFERENCES public.shipments(id),
  driver_id UUID NOT NULL REFERENCES public.drivers(id),
  agreed_price_lkr NUMERIC(12,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_method TEXT,
  payment_status TEXT DEFAULT 'pending',
  pod_photo_url TEXT,
  pod_signature TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Bookings are viewable by everyone" ON public.bookings FOR SELECT USING (true);
CREATE POLICY "Anyone can create bookings" ON public.bookings FOR INSERT WITH CHECK (true);

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ROUTE_RATES table
CREATE TABLE public.route_rates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  from_district TEXT NOT NULL,
  to_district TEXT NOT NULL,
  distance_km INTEGER NOT NULL,
  rate_mini_lkr INTEGER NOT NULL,
  rate_medium_lkr INTEGER NOT NULL,
  rate_large_lkr INTEGER NOT NULL,
  rate_semi_lkr INTEGER NOT NULL,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.route_rates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Route rates are viewable by everyone" ON public.route_rates FOR SELECT USING (true);

-- REVIEWS table
CREATE TABLE public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shipment_id TEXT NOT NULL REFERENCES public.shipments(id),
  reviewer_type TEXT NOT NULL CHECK (reviewer_type IN ('shipper', 'driver')),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reviews are viewable by everyone" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Anyone can create reviews" ON public.reviews FOR INSERT WITH CHECK (true);
