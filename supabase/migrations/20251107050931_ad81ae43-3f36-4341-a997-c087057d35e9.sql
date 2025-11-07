-- Create dashboard schema for read-only analytics views
CREATE SCHEMA IF NOT EXISTS dashboard;

-- Drop existing views to avoid conflicts
DROP VIEW IF EXISTS dashboard.leads_normalized CASCADE;
DROP VIEW IF EXISTS dashboard.duplicate_leads CASCADE;
DROP VIEW IF EXISTS dashboard.leads_daily CASCADE;
DROP VIEW IF EXISTS dashboard.leads_weekly CASCADE;
DROP VIEW IF EXISTS dashboard.leads_monthly CASCADE;
DROP VIEW IF EXISTS dashboard.leads_instagram_daily CASCADE;
DROP VIEW IF EXISTS dashboard.counselling_conversions_daily CASCADE;
DROP VIEW IF EXISTS dashboard.shortlisting_daily CASCADE;
DROP VIEW IF EXISTS dashboard.apps_submitted_daily CASCADE;
DROP VIEW IF EXISTS dashboard.followups_daily CASCADE;

-- 5.1 Normalize email/phone and detect duplicates
CREATE VIEW dashboard.leads_normalized AS
SELECT
  l.id,
  l.name,
  LOWER(COALESCE(l.email, '')) AS email_norm,
  REGEXP_REPLACE(COALESCE(l.phone, ''), '[^0-9]', '', 'g') AS phone_norm,
  l.source,
  l.created_at
FROM public.leads l;

CREATE VIEW dashboard.duplicate_leads AS
SELECT *
FROM (
  SELECT
    id, name, email_norm, phone_norm, source, created_at,
    COUNT(*) OVER (PARTITION BY NULLIF(email_norm,'')) AS email_dupe_count,
    COUNT(*) OVER (PARTITION BY NULLIF(phone_norm,'')) AS phone_dupe_count
  FROM dashboard.leads_normalized
) t
WHERE (email_norm <> '' AND email_dupe_count > 1)
   OR (phone_norm <> '' AND phone_dupe_count > 1);

-- 5.2 Lead counts by source & time bucket
CREATE VIEW dashboard.leads_daily AS
SELECT 
  DATE_TRUNC('day', created_at)::date AS day, 
  source, 
  COUNT(*) AS leads
FROM public.leads
GROUP BY 1, 2
ORDER BY 1 DESC;

CREATE VIEW dashboard.leads_weekly AS
SELECT 
  DATE_TRUNC('week', created_at)::date AS week, 
  source, 
  COUNT(*) AS leads
FROM public.leads
GROUP BY 1, 2
ORDER BY 1 DESC;

CREATE VIEW dashboard.leads_monthly AS
SELECT 
  DATE_TRUNC('month', created_at)::date AS month, 
  source, 
  COUNT(*) AS leads
FROM public.leads
GROUP BY 1, 2
ORDER BY 1 DESC;

-- 5.3 Instagram-attributed leads
CREATE VIEW dashboard.leads_instagram_daily AS
SELECT 
  DATE_TRUNC('day', created_at)::date AS day,
  COALESCE(source,'unknown') AS ig_source,
  COUNT(*) AS leads
FROM public.leads
WHERE source ILIKE 'instagram%'
GROUP BY 1, 2
ORDER BY 1 DESC;

-- 5.4 Calling → Counselling conversions/day
CREATE VIEW dashboard.counselling_conversions_daily AS
SELECT 
  DATE_TRUNC('day', sh.created_at)::date AS day,
  COUNT(*) AS conversions
FROM public.stage_history sh
WHERE sh.to_stage ILIKE 'counsel%'
GROUP BY 1
ORDER BY 1 DESC;

-- 5.5 Shortlisting activity counts/day
CREATE VIEW dashboard.shortlisting_daily AS
SELECT 
  DATE_TRUNC('day', t.created_at)::date AS day,
  COUNT(*) FILTER (WHERE COALESCE(t.shortlisting_initiated,'') <> '' OR COALESCE(t.shortlisting_status,'') <> '') AS shortlisted
FROM public.tasks t
GROUP BY 1
ORDER BY 1 DESC;

-- 5.6 Applications submitted/day
CREATE VIEW dashboard.apps_submitted_daily AS
WITH ua AS (
  SELECT lead_id, DATE_TRUNC('day', created_at)::date AS day
  FROM public.university_applications
  WHERE status ILIKE 'submitted%'
)
SELECT day, COUNT(*) AS applications
FROM ua
GROUP BY 1
ORDER BY 1 DESC;

-- 5.7 Follow-up calls/day
CREATE VIEW dashboard.followups_daily AS
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

-- Grant SELECT permissions on dashboard schema to anon role
GRANT USAGE ON SCHEMA dashboard TO anon;
GRANT SELECT ON ALL TABLES IN SCHEMA dashboard TO anon;