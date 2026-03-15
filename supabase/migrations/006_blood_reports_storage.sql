-- Migration: Blood Reports Storage and Values
-- Description: Creates storage bucket for blood report PDFs and adds column for coach-entered values

-- Create blood-reports storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('blood-reports', 'blood-reports', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policy for public read access (anyone can view uploaded blood reports)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname = 'Public read access for blood reports'
  ) THEN
    CREATE POLICY "Public read access for blood reports" ON storage.objects
      FOR SELECT USING (bucket_id = 'blood-reports');
  END IF;
END $$;

-- RLS policy for authenticated uploads (any authenticated user can upload)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname = 'Allow uploads to blood reports'
  ) THEN
    CREATE POLICY "Allow uploads to blood reports" ON storage.objects
      FOR INSERT WITH CHECK (bucket_id = 'blood-reports');
  END IF;
END $$;

-- RLS policy for public uploads (allow unauthenticated uploads for application form)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname = 'Allow public uploads to blood reports'
  ) THEN
    CREATE POLICY "Allow public uploads to blood reports" ON storage.objects
      FOR INSERT WITH CHECK (bucket_id = 'blood-reports' AND auth.role() = 'anon');
  END IF;
END $$;

-- Add blood_report_values column to client_applications table
-- This stores the coach-entered blood values after reviewing PDFs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'client_applications'
    AND column_name = 'blood_report_values'
  ) THEN
    ALTER TABLE public.client_applications
    ADD COLUMN blood_report_values jsonb DEFAULT NULL;

    COMMENT ON COLUMN public.client_applications.blood_report_values IS
      'Blood test values entered by coach after reviewing uploaded PDFs. Contains fields like hemoglobin, tsh, etc.';
  END IF;
END $$;
