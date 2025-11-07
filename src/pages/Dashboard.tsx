import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DateRange } from "react-day-picker";
import { subDays } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogOut, TrendingUp, Users, UserCheck, AlertCircle, Activity } from "lucide-react";
import { MetricTile } from "@/components/dashboard/MetricTile";
import { DashboardFilters } from "@/components/dashboard/DashboardFilters";
import { LeadsChart } from "@/components/dashboard/LeadsChart";
import { FunnelCharts } from "@/components/dashboard/FunnelCharts";
import { LeadsTable } from "@/components/dashboard/LeadsTable";
import { DuplicatesTable } from "@/components/dashboard/DuplicatesTable";
import {
  fetchLeadsDaily,
  fetchLeadsWeekly,
  fetchLeadsMonthly,
  fetchLeadsTable,
  fetchDuplicateLeads,
  fetchCounsellingConversions,
  fetchShortlisting,
  fetchApplications,
  fetchFollowups,
  fetchSources,
  DashboardFilters as FilterType,
} from "@/lib/supabaseQueries";
import { exportToCSV } from "@/lib/csvExport";
import { toast } from "sonner";

export default function Dashboard() {
  const { logout, session } = useAuth();
  const navigate = useNavigate();
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(true);

  // Filters state
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 90),
    to: new Date(),
  });
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [search, setSearch] = useState("");

  const filters: FilterType = useMemo(
    () => ({
      dateFrom: dateRange?.from || subDays(new Date(), 90),
      dateTo: dateRange?.to || new Date(),
      sources: selectedSources.length > 0 ? selectedSources : undefined,
      search: search || undefined,
    }),
    [dateRange, selectedSources, search]
  );

  // Fetch all sources for filter
  const { data: sources = [] } = useQuery({
    queryKey: ["sources"],
    queryFn: fetchSources,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Leads queries
  const {
    data: leadsDaily = [],
    isLoading: isLoadingDaily,
    refetch: refetchDaily,
  } = useQuery({
    queryKey: ["leadsDaily", filters],
    queryFn: () => fetchLeadsDaily(filters),
  });

  const {
    data: leadsWeekly = [],
    refetch: refetchWeekly,
  } = useQuery({
    queryKey: ["leadsWeekly", filters],
    queryFn: () => fetchLeadsWeekly(filters),
  });

  const {
    data: leadsMonthly = [],
    refetch: refetchMonthly,
  } = useQuery({
    queryKey: ["leadsMonthly", filters],
    queryFn: () => fetchLeadsMonthly(filters),
  });

  const {
    data: leadsTable = [],
    isLoading: isLoadingTable,
    refetch: refetchTable,
  } = useQuery({
    queryKey: ["leadsTable", filters],
    queryFn: () => fetchLeadsTable(filters),
  });

  const {
    data: duplicates = [],
    isLoading: isLoadingDuplicates,
    refetch: refetchDuplicates,
  } = useQuery({
    queryKey: ["duplicates"],
    queryFn: fetchDuplicateLeads,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Funnel queries
  const {
    data: conversions = [],
    isLoading: isLoadingConversions,
    refetch: refetchConversions,
  } = useQuery({
    queryKey: ["conversions", filters],
    queryFn: () => fetchCounsellingConversions(filters),
  });

  const {
    data: shortlisting = [],
    refetch: refetchShortlisting,
  } = useQuery({
    queryKey: ["shortlisting", filters],
    queryFn: () => fetchShortlisting(filters),
  });

  const {
    data: applications = [],
    refetch: refetchApplications,
  } = useQuery({
    queryKey: ["applications", filters],
    queryFn: () => fetchApplications(filters),
  });

  const {
    data: followups = [],
    refetch: refetchFollowups,
  } = useQuery({
    queryKey: ["followups", filters],
    queryFn: () => fetchFollowups(filters),
  });

  // Calculate metrics
  const metrics = useMemo(() => {
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    const weekAgo = subDays(today, 7).toISOString().split("T")[0];
    const monthAgo = subDays(today, 30).toISOString().split("T")[0];

    const todayLeads = (leadsDaily as any[])
      .filter((d: any) => d.day === todayStr)
      .reduce((sum: number, d: any) => sum + (d.leads || 0), 0);

    const weekLeads = (leadsDaily as any[])
      .filter((d: any) => d.day >= weekAgo)
      .reduce((sum: number, d: any) => sum + (d.leads || 0), 0);

    const monthLeads = (leadsDaily as any[])
      .filter((d: any) => d.day >= monthAgo)
      .reduce((sum: number, d: any) => sum + (d.leads || 0), 0);

    return {
      today: todayLeads,
      week: weekLeads,
      month: monthLeads,
      duplicates: Array.isArray(duplicates) ? duplicates.length : 0,
    };
  }, [leadsDaily, duplicates]);

  // Real-time subscriptions
  useEffect(() => {
    const channel = supabase
      .channel("dashboard-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "leads",
        },
        () => {
          refetchDaily();
          refetchWeekly();
          refetchMonthly();
          refetchTable();
          refetchDuplicates();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "stage_history",
        },
        () => {
          refetchConversions();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tasks",
        },
        () => {
          refetchShortlisting();
          refetchFollowups();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "university_applications",
        },
        () => {
          refetchApplications();
        }
      )
      .subscribe((status) => {
        setIsRealtimeConnected(status === "SUBSCRIBED");
        if (status === "SUBSCRIBED") {
          toast.success("Real-time updates active");
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="bg-card border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">CRM Analytics</h1>
              <p className="text-sm text-muted-foreground">{session?.email}</p>
            </div>
            <div className="flex items-center gap-4">
              <Badge
                variant={isRealtimeConnected ? "default" : "destructive"}
                className="gap-1"
              >
                <Activity className="h-3 w-3" />
                {isRealtimeConnected ? "Live" : "Disconnected"}
              </Badge>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Filters */}
        <DashboardFilters
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          sources={sources}
          selectedSources={selectedSources}
          onSourcesChange={setSelectedSources}
          search={search}
          onSearchChange={setSearch}
        />

        {/* Metric Tiles */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricTile
            title="Today's Leads"
            value={metrics.today}
            icon={TrendingUp}
            isLoading={isLoadingDaily}
          />
          <MetricTile
            title="This Week"
            value={metrics.week}
            icon={Users}
            isLoading={isLoadingDaily}
          />
          <MetricTile
            title="This Month"
            value={metrics.month}
            icon={UserCheck}
            isLoading={isLoadingDaily}
          />
          <MetricTile
            title="Duplicates"
            value={metrics.duplicates}
            icon={AlertCircle}
            isLoading={isLoadingDuplicates}
            color="destructive"
          />
        </div>

        {/* Leads Chart */}
        <LeadsChart
          dailyData={leadsDaily}
          weeklyData={leadsWeekly}
          monthlyData={leadsMonthly}
          isLoading={isLoadingDaily}
        />

        {/* Funnel Charts */}
        <FunnelCharts
          conversionsData={conversions}
          shortlistingData={shortlisting}
          applicationsData={applications}
          followupsData={followups}
          isLoading={isLoadingConversions}
        />

        {/* Leads Table */}
        <LeadsTable
          data={leadsTable}
          isLoading={isLoadingTable}
          onExport={() => exportToCSV(leadsTable, "leads")}
        />

        {/* Duplicates Table */}
        <DuplicatesTable
          data={duplicates}
          isLoading={isLoadingDuplicates}
          onExport={() => exportToCSV(duplicates, "duplicates")}
        />
      </main>
    </div>
  );
}
