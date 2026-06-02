-- Only link guest orders after the account email is confirmed (prevents email squatting).

CREATE OR REPLACE FUNCTION public.claim_orders_by_email()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  claimed_count INTEGER;
  user_email TEXT;
  email_confirmed_at TIMESTAMPTZ;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN 0;
  END IF;

  SELECT u.email, u.email_confirmed_at
  INTO user_email, email_confirmed_at
  FROM auth.users AS u
  WHERE u.id = auth.uid();

  IF user_email IS NULL OR email_confirmed_at IS NULL THEN
    RETURN 0;
  END IF;

  UPDATE orders
  SET user_id = auth.uid(), updated_at = now()
  WHERE lower(email) = lower(user_email)
    AND user_id IS NULL;

  GET DIAGNOSTICS claimed_count = ROW_COUNT;
  RETURN claimed_count;
END;
$$;
