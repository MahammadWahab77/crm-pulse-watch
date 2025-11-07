-- Drop dashboard schema views
DROP SCHEMA IF EXISTS dashboard CASCADE;

-- Create all views in public schema for REST API access

-- 1. Normalize email/phone and detect duplicates
CREATE OR REPLACE VIEW public.leads_normalized AS
SELECT
  l.id,
  l.name,
  LOWER(COALESCE(l.email, '')) AS email_norm,
  REGEXP_REPLACE(COALESCE(l.phone, ''), '[^0-9]', '', 'g') AS phone_norm,
  l.source,
  l.created_at
FROM public.leads l;

CREATE OR REPLACE VIEW public.duplicate_leads AS
SELECT *
FROM (
  SELECT
    id, name, email_norm, phone_norm, source, created_at,
    COUNT(*) OVER (PARTITION BY NULLIF(email_norm,'')) AS email_dupe_count,
    COUNT(*) OVER (PARTITION BY NULLIF(phone_norm,'')) AS phone_dupe_count
  FROM public.leads_normalized
) t
WHERE (email_norm <> '' AND email_dupe_count > 1)
   OR (phone_norm <> '' AND phone_dupe_count > 1);

-- 2. Lead counts by source & time bucket
CREATE OR REPLACE VIEW public.leads_daily AS
SELECT 
  DATE_TRUNC('day', created_at)::date AS day, 
  source, 
  COUNT(*) AS leads
FROM public.leads
GROUP BY 1, 2
ORDER BY 1 DESC;

CREATE OR REPLACE VIEW public.leads_weekly AS
SELECT 
  DATE_TRUNC('week', created_at)::date AS week, 
  source, 
  COUNT(*) AS leads
FROM public.leads
GROUP BY 1, 2
ORDER BY 1 DESC;

CREATE OR REPLACE VIEW public.leads_monthly AS
SELECT 
  DATE_TRUNC('month', created_at)::date AS month, 
  source, 
  COUNT(*) AS leads
FROM public.leads
GROUP BY 1, 2
ORDER BY 1 DESC;

-- 3. Instagram-attributed leads
CREATE OR REPLACE VIEW public.leads_instagram_daily AS
SELECT 
  DATE_TRUNC('day', created_at)::date AS day,
  COALESCE(source,'unknown') AS ig_source,
  COUNT(*) AS leads
FROM public.leads
WHERE source ILIKE 'instagram%'
GROUP BY 1, 2
ORDER BY 1 DESC;

-- 4. Calling → Counselling conversions/day
CREATE OR REPLACE VIEW public.counselling_conversions_daily AS
SELECT 
  DATE_TRUNC('day', sh.created_at)::date AS day,
  COUNT(*) AS conversions
FROM public.stage_history sh
WHERE sh.to_stage ILIKE 'counsel%'
GROUP BY 1
ORDER BY 1 DESC;

-- 5. Shortlisting activity counts/day
CREATE OR REPLACE VIEW public.shortlisting_daily AS
SELECT 
  DATE_TRUNC('day', t.created_at)::date AS day,
  COUNT(*) FILTER (WHERE COALESCE(t.shortlisting_initiated,'') <> '' OR COALESCE(t.shortlisting_status,'') <> '') AS shortlisted
FROM public.tasks t
GROUP BY 1
ORDER BY 1 DESC;

-- 6. Applications submitted/day
CREATE OR REPLACE VIEW public.apps_submitted_daily AS
WITH ua AS (
  SELECT lead_id, DATE_TRUNC('day', created_at)::date AS day
  FROM public.university_applications
  WHERE status ILIKE 'submitted%'
)
SELECT day, COUNT(*) AS applications
FROM ua
GROUP BY 1
ORDER BY 1 DESC;

-- 7. Follow-up calls/day
CREATE OR REPLACE VIEW public.followups_daily AS
SELECT 
  DATE_TRUNC('day', t.created_at)::date AS day,
  COUNT(*) AS followups
FROM public.tasks t
WHERE t.task_type ILIKE 'call'
  AND (
    COALESCE(t.call_status,'') ILIKE 'follow%'
    OR COALESCE(t.call_type,'') ILIKE 'follow%'
  )
GROUP BY 1
ORDER BY 1 DESC;

-- Grant SELECT permissions to anon role for all views
GRANT SELECT ON public.leads_normalized TO anon;
GRANT SELECT ON public.duplicate_leads TO anon;
GRANT SELECT ON public.leads_daily TO anon;
GRANT SELECT ON public.leads_weekly TO anon;
GRANT SELECT ON public.leads_monthly TO anon;
GRANT SELECT ON public.leads_instagram_daily TO anon;
GRANT SELECT ON public.counselling_conversions_daily TO anon;
GRANT SELECT ON public.shortlisting_daily TO anon;
GRANT SELECT ON public.apps_submitted_daily TO anon;
GRANT SELECT ON public.followups_daily TO anon;