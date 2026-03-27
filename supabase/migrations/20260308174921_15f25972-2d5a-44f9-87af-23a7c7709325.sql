
-- Create notifications table
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  shipment_id text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- System inserts via trigger (security definer), so allow insert for service role
CREATE POLICY "System can insert notifications"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Trigger function to create notifications on shipment status change
CREATE OR REPLACE FUNCTION public.notify_shipment_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_shipper_id uuid;
  v_driver_user_id uuid;
  v_status_label text;
  v_shipment_display text;
BEGIN
  -- Only fire on status change
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  v_shipper_id := NEW.user_id;
  v_status_label := initcap(replace(NEW.status, '_', ' '));
  v_shipment_display := NEW.pickup_district || ' → ' || NEW.delivery_district;

  -- Notify shipper
  IF v_shipper_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, shipment_id, title, message)
    VALUES (
      v_shipper_id,
      NEW.id,
      'Shipment ' || v_status_label,
      'Your shipment ' || v_shipment_display || ' is now ' || v_status_label || '.'
    );
  END IF;

  -- Notify driver
  IF NEW.driver_id IS NOT NULL THEN
    SELECT user_id INTO v_driver_user_id FROM public.drivers WHERE id = NEW.driver_id;
    IF v_driver_user_id IS NOT NULL AND v_driver_user_id IS DISTINCT FROM v_shipper_id THEN
      INSERT INTO public.notifications (user_id, shipment_id, title, message)
      VALUES (
        v_driver_user_id,
        NEW.id,
        'Shipment ' || v_status_label,
        'Shipment ' || v_shipment_display || ' is now ' || v_status_label || '.'
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_shipment_status_notify
  AFTER UPDATE ON public.shipments
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_shipment_status_change();
