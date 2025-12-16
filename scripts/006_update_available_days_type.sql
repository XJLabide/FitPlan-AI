-- Change available_days from INTEGER to TEXT[] to support multiple day selection
ALTER TABLE public.onboarding_data 
  DROP CONSTRAINT IF EXISTS onboarding_data_available_days_check;

ALTER TABLE public.onboarding_data
  ALTER COLUMN available_days TYPE TEXT[] USING ARRAY[available_days::text];

-- Add new constraint if needed, or leave it flexible
-- For now, ensuring it's not empty might be good, but let's keep it simple to fix the error first.
