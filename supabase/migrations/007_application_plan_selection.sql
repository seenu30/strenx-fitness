-- Migration: Add plan selection columns to client_applications
-- This allows coaches to select training and nutrition plans during the application review process

-- Add training plan reference
ALTER TABLE public.client_applications
ADD COLUMN IF NOT EXISTS training_plan_id uuid REFERENCES public.training_plans(id) ON DELETE SET NULL;

-- Add nutrition plan reference
ALTER TABLE public.client_applications
ADD COLUMN IF NOT EXISTS nutrition_plan_id uuid REFERENCES public.nutrition_plans(id) ON DELETE SET NULL;

-- Add indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_client_applications_training_plan
ON public.client_applications(training_plan_id)
WHERE training_plan_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_client_applications_nutrition_plan
ON public.client_applications(nutrition_plan_id)
WHERE nutrition_plan_id IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.client_applications.training_plan_id IS 'Training plan selected by coach during application review';
COMMENT ON COLUMN public.client_applications.nutrition_plan_id IS 'Nutrition plan selected by coach during application review';
