-- Add missing columns to leads table
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS source_platform TEXT,
ADD COLUMN IF NOT EXISTS instagram_post_id TEXT;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_leads_source_platform ON public.leads(source_platform);
CREATE INDEX IF NOT EXISTS idx_leads_instagram_post_id ON public.leads(instagram_post_id);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at);
CREATE INDEX IF NOT EXISTS idx_leads_phone ON public.leads(phone);
CREATE INDEX IF NOT EXISTS idx_leads_email ON public.leads(email);

-- Populate source_platform from source where null
UPDATE public.leads 
SET source_platform = source 
WHERE source_platform IS NULL AND source IS NOT NULL;

-- Add comment
COMMENT ON COLUMN public.leads.source_platform IS 'Platform where the lead came from (e.g., Instagram, Facebook, Website)';
COMMENT ON COLUMN public.leads.instagram_post_id IS 'Instagram post/reel ID that generated this lead';