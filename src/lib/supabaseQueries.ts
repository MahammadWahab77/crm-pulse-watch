import { supabase } from "@/integrations/supabase/client";
import { subDays } from "date-fns";

export interface DashboardFilters {
  dateFrom: Date;
  dateTo: Date;
  sources?: string[];
  counselors?: string[];
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

// Duplicate leads - now using the new implementation below

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
    .select("source, source_platform");

  if (error) throw error;
  const sources = [...new Set(data?.map((d) => d.source_platform || d.source || "Unknown") || [])];
  return sources.filter(Boolean) as string[];
}

// Get all counselors
export async function fetchCounselors() {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, name")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) throw error;
  return (data || []).map((c) => ({ id: c.id, name: c.name }));
}

// Analytics queries
export async function fetchDailyLeadsTrend(filters: DashboardFilters) {
  let query = supabase
    .from("leads")
    .select("created_at")
    .gte("created_at", filters.dateFrom.toISOString())
    .lte("created_at", filters.dateTo.toISOString())
    .order("created_at", { ascending: true });

  if (filters.sources?.length) {
    query = query.in("source_platform", filters.sources);
  }

  if (filters.counselors?.length) {
    query = query.in("counselor_uuid", filters.counselors);
  }

  const { data, error } = await query;
  if (error) throw error;

  // Group by day
  const grouped = (data || []).reduce((acc: any, lead: any) => {
    const day = lead.created_at.split("T")[0];
    acc[day] = (acc[day] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(grouped).map(([day, leads]) => ({ day, leads: leads as number }));
}

export async function fetchLeadsBySource(filters: DashboardFilters) {
  let query = supabase
    .from("leads")
    .select("source, source_platform")
    .gte("created_at", filters.dateFrom.toISOString())
    .lte("created_at", filters.dateTo.toISOString());

  if (filters.counselors?.length) {
    query = query.in("counselor_uuid", filters.counselors);
  }

  const { data, error } = await query;
  if (error) throw error;

  const grouped = (data || []).reduce((acc: any, lead: any) => {
    const source = lead.source_platform || lead.source || "Unknown";
    acc[source] = (acc[source] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(grouped)
    .map(([source, leads]) => ({ source, leads: leads as number }))
    .sort((a: any, b: any) => b.leads - a.leads);
}

export async function fetchLeadsByInstagram(filters: DashboardFilters) {
  let query = supabase
    .from("leads")
    .select("instagram_post_id")
    .not("instagram_post_id", "is", null)
    .neq("instagram_post_id", "")
    .gte("created_at", filters.dateFrom.toISOString())
    .lte("created_at", filters.dateTo.toISOString());

  if (filters.sources?.length) {
    query = query.in("source_platform", filters.sources);
  }

  if (filters.counselors?.length) {
    query = query.in("counselor_uuid", filters.counselors);
  }

  const { data, error } = await query;
  if (error) throw error;

  const grouped = (data || []).reduce((acc: any, lead: any) => {
    const postId = lead.instagram_post_id;
    acc[postId] = (acc[postId] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(grouped)
    .map(([instagram_post_id, leads]) => ({ instagram_post_id, leads: leads as number }))
    .sort((a: any, b: any) => b.leads - a.leads)
    .slice(0, 50);
}

export async function fetchDuplicateLeads() {
  const { data, error } = await supabase
    .from("leads")
    .select("id, created_at, phone, email");

  if (error) throw error;

  const fingerprints: any = {};
  (data || []).forEach((lead: any) => {
    const fp = (lead.phone?.toLowerCase() || lead.email?.toLowerCase() || "").trim();
    if (fp) {
      if (!fingerprints[fp]) {
        fingerprints[fp] = [];
      }
      fingerprints[fp].push({ id: lead.id, created_at: lead.created_at });
    }
  });

  return Object.entries(fingerprints)
    .filter(([_, leads]: any) => leads.length > 1)
    .map(([fingerprint, leads]: any) => ({
      fingerprint,
      canonical_lead_id: leads.sort((a: any, b: any) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )[0].id,
      dup_count: leads.length,
      lead_ids: leads.map((l: any) => l.id),
    }))
    .sort((a: any, b: any) => b.dup_count - a.dup_count);
}

export async function fetchCallingConversions(filters: DashboardFilters) {
  // First get lead_ids that match counselor filter if provided
  let leadIds: number[] | undefined;
  if (filters.counselors?.length || filters.sources?.length) {
    let leadQuery = supabase.from("leads").select("id");
    
    if (filters.counselors?.length) {
      leadQuery = leadQuery.in("counselor_uuid", filters.counselors);
    }
    
    if (filters.sources?.length) {
      leadQuery = leadQuery.in("source_platform", filters.sources);
    }
    
    const { data: leadsData } = await leadQuery;
    leadIds = leadsData?.map((l: any) => l.id);
  }

  let query = supabase
    .from("stage_history")
    .select("lead_id, created_at, from_stage, to_stage")
    .ilike("from_stage", "%Calling%")
    .ilike("to_stage", "%Counselling%")
    .gte("created_at", filters.dateFrom.toISOString())
    .lte("created_at", filters.dateTo.toISOString())
    .order("created_at", { ascending: true });

  if (leadIds) {
    query = query.in("lead_id", leadIds);
  }

  const { data, error } = await query;
  if (error) throw error;

  const grouped = (data || []).reduce((acc: any, record: any) => {
    const day = record.created_at.split("T")[0];
    if (!acc[day]) acc[day] = new Set();
    acc[day].add(record.lead_id);
    return acc;
  }, {});

  return Object.entries(grouped).map(([day, leadSet]: any) => ({
    day,
    converted_to_counselling: leadSet.size,
  }));
}

export async function fetchShortlistingCompleted(filters: DashboardFilters) {
  let leadIds: number[] | undefined;
  if (filters.counselors?.length || filters.sources?.length) {
    let leadQuery = supabase.from("leads").select("id");
    
    if (filters.counselors?.length) {
      leadQuery = leadQuery.in("counselor_uuid", filters.counselors);
    }
    
    if (filters.sources?.length) {
      leadQuery = leadQuery.in("source_platform", filters.sources);
    }
    
    const { data: leadsData } = await leadQuery;
    leadIds = leadsData?.map((l: any) => l.id);
  }

  let query = supabase
    .from("tasks")
    .select("created_at, lead_id")
    .ilike("shortlisting_status", "Completed")
    .gte("created_at", filters.dateFrom.toISOString())
    .lte("created_at", filters.dateTo.toISOString())
    .order("created_at", { ascending: true });

  if (leadIds) {
    query = query.in("lead_id", leadIds);
  }

  const { data, error } = await query;
  if (error) throw error;

  const grouped = (data || []).reduce((acc: any, task: any) => {
    const day = task.created_at.split("T")[0];
    acc[day] = (acc[day] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(grouped).map(([day, shortlisting_completed]) => ({
    day,
    shortlisting_completed: shortlisting_completed as number,
  }));
}

export async function fetchApplicationsSubmitted(filters: DashboardFilters) {
  let leadIds: number[] | undefined;
  if (filters.counselors?.length || filters.sources?.length) {
    let leadQuery = supabase.from("leads").select("id");
    
    if (filters.counselors?.length) {
      leadQuery = leadQuery.in("counselor_uuid", filters.counselors);
    }
    
    if (filters.sources?.length) {
      leadQuery = leadQuery.in("source_platform", filters.sources);
    }
    
    const { data: leadsData } = await leadQuery;
    leadIds = leadsData?.map((l: any) => l.id);
  }

  let query = supabase
    .from("university_applications")
    .select("created_at, lead_id, university_name, status")
    .not("status", "is", null)
    .gte("created_at", filters.dateFrom.toISOString())
    .lte("created_at", filters.dateTo.toISOString())
    .order("created_at", { ascending: false });

  if (leadIds) {
    query = query.in("lead_id", leadIds);
  }

  const { data, error } = await query;
  if (error) throw error;

  const grouped = (data || []).reduce((acc: any, app: any) => {
    const day = app.created_at.split("T")[0];
    acc[day] = (acc[day] || 0) + 1;
    return acc;
  }, {});

  const chartData = Object.entries(grouped).map(([day, applications_submitted]) => ({
    day,
    applications_submitted: applications_submitted as number,
  }));

  return { chartData, recentApps: (data || []).slice(0, 10) };
}

export async function fetchFollowupCalls(filters: DashboardFilters) {
  let leadIds: number[] | undefined;
  if (filters.counselors?.length || filters.sources?.length) {
    let leadQuery = supabase.from("leads").select("id");
    
    if (filters.counselors?.length) {
      leadQuery = leadQuery.in("counselor_uuid", filters.counselors);
    }
    
    if (filters.sources?.length) {
      leadQuery = leadQuery.in("source_platform", filters.sources);
    }
    
    const { data: leadsData } = await leadQuery;
    leadIds = leadsData?.map((l: any) => l.id);
  }

  let query = supabase
    .from("tasks")
    .select("created_at, lead_id")
    .or(`task_type.ilike.%follow%,call_type.ilike.%follow%`)
    .gte("created_at", filters.dateFrom.toISOString())
    .lte("created_at", filters.dateTo.toISOString())
    .order("created_at", { ascending: true });

  if (leadIds) {
    query = query.in("lead_id", leadIds);
  }

  const { data, error } = await query;
  if (error) throw error;

  const grouped = (data || []).reduce((acc: any, task: any) => {
    const day = task.created_at.split("T")[0];
    acc[day] = (acc[day] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(grouped).map(([day, follow_ups]) => ({
    day,
    follow_ups: follow_ups as number,
  }));
}

export async function fetchFunnelData(filters: DashboardFilters) {
  // Get filtered lead IDs if counselor or source filters are applied
  let leadIds: number[] | undefined;
  if (filters.counselors?.length || filters.sources?.length) {
    let leadQuery = supabase.from("leads").select("id");
    
    if (filters.counselors?.length) {
      leadQuery = leadQuery.in("counselor_uuid", filters.counselors);
    }
    
    if (filters.sources?.length) {
      leadQuery = leadQuery.in("source_platform", filters.sources);
    }
    
    const { data: leadsData } = await leadQuery;
    leadIds = leadsData?.map((l: any) => l.id);
  }

  // Build queries with filters
  let leadsQuery = supabase
    .from("leads")
    .select("created_at, id")
    .gte("created_at", filters.dateFrom.toISOString())
    .lte("created_at", filters.dateTo.toISOString());

  if (filters.counselors?.length) {
    leadsQuery = leadsQuery.in("counselor_uuid", filters.counselors);
  }

  if (filters.sources?.length) {
    leadsQuery = leadsQuery.in("source_platform", filters.sources);
  }

  let calledQuery = supabase
    .from("tasks")
    .select("lead_id, created_at")
    .or(`task_type.ilike.%call%,call_type.is.not.null`)
    .gte("created_at", filters.dateFrom.toISOString())
    .lte("created_at", filters.dateTo.toISOString());

  if (leadIds) {
    calledQuery = calledQuery.in("lead_id", leadIds);
  }

  let counsellingQuery = supabase
    .from("stage_history")
    .select("lead_id, created_at")
    .ilike("to_stage", "%Counselling%")
    .gte("created_at", filters.dateFrom.toISOString())
    .lte("created_at", filters.dateTo.toISOString());

  if (leadIds) {
    counsellingQuery = counsellingQuery.in("lead_id", leadIds);
  }

  let appsQuery = supabase
    .from("university_applications")
    .select("created_at, lead_id")
    .gte("created_at", filters.dateFrom.toISOString())
    .lte("created_at", filters.dateTo.toISOString());

  if (leadIds) {
    appsQuery = appsQuery.in("lead_id", leadIds);
  }

  const [leadsData, calledData, counsellingData, appsData] = await Promise.all([
    leadsQuery,
    calledQuery,
    counsellingQuery,
    appsQuery,
  ]);

  const groupByDay = (data: any[], countUnique = false) => {
    return (data || []).reduce((acc: any, item: any) => {
      const day = item.created_at.split("T")[0];
      if (countUnique) {
        if (!acc[day]) acc[day] = new Set();
        acc[day].add(item.lead_id);
      } else {
        acc[day] = (acc[day] || 0) + 1;
      }
      return acc;
    }, {});
  };

  const leadsGrouped = groupByDay(leadsData.data || []);
  const calledGrouped = groupByDay(calledData.data || [], true);
  const counsellingGrouped = groupByDay(counsellingData.data || [], true);
  const appsGrouped = groupByDay(appsData.data || []);

  const allDays = new Set([
    ...Object.keys(leadsGrouped),
    ...Object.keys(calledGrouped),
    ...Object.keys(counsellingGrouped),
    ...Object.keys(appsGrouped),
  ]);

  return Array.from(allDays)
    .sort()
    .map((day) => ({
      day,
      leads: leadsGrouped[day] || 0,
      called: calledGrouped[day]?.size || 0,
      counselling: counsellingGrouped[day]?.size || 0,
      applications: appsGrouped[day] || 0,
    }));
}

export async function fetchKPIMetrics(filters: DashboardFilters) {
  const today = new Date();
  const yesterday = subDays(today, 1);

  const [todayLeads, yesterdayLeads, duplicates, conversions, monthlyApps] = await Promise.all([
    supabase
      .from("leads")
      .select("id", { count: "exact" })
      .gte("created_at", today.toISOString().split("T")[0])
      .lte("created_at", today.toISOString()),
    supabase
      .from("leads")
      .select("id", { count: "exact" })
      .gte("created_at", yesterday.toISOString().split("T")[0])
      .lt("created_at", today.toISOString().split("T")[0]),
    fetchDuplicateLeads(),
    supabase
      .from("stage_history")
      .select("lead_id")
      .ilike("from_stage", "%Calling%")
      .ilike("to_stage", "%Counselling%")
      .gte("created_at", filters.dateFrom.toISOString())
      .lte("created_at", filters.dateTo.toISOString()),
    supabase
      .from("university_applications")
      .select("id", { count: "exact" })
      .gte("created_at", new Date(today.getFullYear(), today.getMonth(), 1).toISOString()),
  ]);

  const todayCount = todayLeads.count || 0;
  const yesterdayCount = yesterdayLeads.count || 0;
  const changePercent = yesterdayCount > 0 
    ? ((todayCount - yesterdayCount) / yesterdayCount) * 100 
    : 0;

  const totalCalled = await supabase
    .from("tasks")
    .select("lead_id")
    .or(`task_type.ilike.%call%,call_type.is.not.null`)
    .gte("created_at", filters.dateFrom.toISOString())
    .lte("created_at", filters.dateTo.toISOString());

  const conversionRate = totalCalled.data && totalCalled.data.length > 0
    ? ((conversions.data?.length || 0) / new Set(totalCalled.data.map((t: any) => t.lead_id)).size) * 100
    : 0;

  return {
    newLeadsToday: todayCount,
    newLeadsYesterday: yesterdayCount,
    changePercent: Math.round(changePercent),
    duplicatesToday: duplicates.filter((d: any) => 
      d.lead_ids.some((id: number) => {
        // This is simplified - in production you'd check actual created_at dates
        return true;
      })
    ).length,
    conversionRate: Math.round(conversionRate),
    monthlyApplications: monthlyApps.count || 0,
  };
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
