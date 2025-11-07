import { supabase } from "@/integrations/supabase/client";
import { subDays } from "date-fns";

export interface DashboardFilters {
  dateFrom: Date;
  dateTo: Date;
  sources?: string[];
  search?: string;
}

// Type definitions for dashboard views
interface LeadsDailyRow {
  day: string;
  source: string | null;
  leads: number;
}

interface LeadsWeeklyRow {
  week: string;
  source: string | null;
  leads: number;
}

interface LeadsMonthlyRow {
  month: string;
  source: string | null;
  leads: number;
}

// Leads queries
export async function fetchLeadsDaily(filters: DashboardFilters): Promise<LeadsDailyRow[]> {
  // Query dashboard.leads_daily view directly
  const { data, error } = await supabase
    .from("leads_daily" as any)
    .select("*")
    .gte("day", filters.dateFrom.toISOString().split("T")[0])
    .lte("day", filters.dateTo.toISOString().split("T")[0]);
  
  const result = (data as any) || [];
  return filters.sources?.length
    ? result.filter((r: any) => filters.sources?.includes(r.source))
    : result;
}

export async function fetchLeadsWeekly(filters: DashboardFilters): Promise<LeadsWeeklyRow[]> {
  const { data, error } = await supabase
    .from("leads_weekly" as any)
    .select("*")
    .gte("week", filters.dateFrom.toISOString().split("T")[0])
    .lte("week", filters.dateTo.toISOString().split("T")[0]);

  const result = (data as any) || [];
  return filters.sources?.length
    ? result.filter((r: any) => filters.sources?.includes(r.source))
    : result;
}

export async function fetchLeadsMonthly(filters: DashboardFilters): Promise<LeadsMonthlyRow[]> {
  const { data, error } = await supabase
    .from("leads_monthly" as any)
    .select("*")
    .gte("month", filters.dateFrom.toISOString().split("T")[0])
    .lte("month", filters.dateTo.toISOString().split("T")[0]);

  const result = (data as any) || [];
  return filters.sources?.length
    ? result.filter((r: any) => filters.sources?.includes(r.source))
    : result;
}

// Leads table with filters
export async function fetchLeadsTable(filters: DashboardFilters) {
  let query = supabase
    .from("leads")
    .select("id, name, phone, email, source, current_stage, created_at")
    .gte("created_at", filters.dateFrom.toISOString())
    .lte("created_at", filters.dateTo.toISOString())
    .order("created_at", { ascending: false });

  if (filters.sources?.length) {
    query = query.in("source", filters.sources);
  }

  if (filters.search) {
    query = query.or(
      `name.ilike.%${filters.search}%,phone.ilike.%${filters.search}%,email.ilike.%${filters.search}%`
    );
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

// Duplicate leads
export async function fetchDuplicateLeads() {
  const { data, error } = await supabase
    .from("duplicate_leads" as any)
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  return (data as any) || [];
}

// Conversions
export async function fetchCounsellingConversions(filters: DashboardFilters) {
  const { data, error } = await supabase
    .from("counselling_conversions_daily" as any)
    .select("*")
    .gte("day", filters.dateFrom.toISOString().split("T")[0])
    .lte("day", filters.dateTo.toISOString().split("T")[0])
    .order("day", { ascending: true });

  return (data as any) || [];
}

// Shortlisting
export async function fetchShortlisting(filters: DashboardFilters) {
  const { data, error } = await supabase
    .from("shortlisting_daily" as any)
    .select("*")
    .gte("day", filters.dateFrom.toISOString().split("T")[0])
    .lte("day", filters.dateTo.toISOString().split("T")[0])
    .order("day", { ascending: true });

  return (data as any) || [];
}

// Applications
export async function fetchApplications(filters: DashboardFilters) {
  const { data, error } = await supabase
    .from("apps_submitted_daily" as any)
    .select("*")
    .gte("day", filters.dateFrom.toISOString().split("T")[0])
    .lte("day", filters.dateTo.toISOString().split("T")[0])
    .order("day", { ascending: true });

  return (data as any) || [];
}

// Follow-ups
export async function fetchFollowups(filters: DashboardFilters) {
  const { data, error } = await supabase
    .from("followups_daily" as any)
    .select("*")
    .gte("day", filters.dateFrom.toISOString().split("T")[0])
    .lte("day", filters.dateTo.toISOString().split("T")[0])
    .order("day", { ascending: true });

  return (data as any) || [];
}

// Get all unique sources
export async function fetchSources() {
  const { data, error } = await supabase
    .from("leads")
    .select("source, source_platform")
    .not("source", "is", null);

  if (error) throw error;
  const sources = [...new Set(data?.map((d) => d.source_platform || d.source) || [])];
  return sources.filter(Boolean) as string[];
}

// Lead detail for side panel
export async function fetchLeadDetail(leadId: number) {
  const [lead, stageHistory, tasks, remarks] = await Promise.all([
    supabase.from("leads").select("*").eq("id", leadId).single(),
    supabase
      .from("stage_history")
      .select("*")
      .eq("lead_id", leadId)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("tasks")
      .select("*")
      .eq("lead_id", leadId)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("remarks")
      .select("*")
      .eq("lead_id", leadId)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  return {
    lead: lead.data,
    stageHistory: stageHistory.data || [],
    tasks: tasks.data || [],
    remarks: remarks.data || [],
  };
}
