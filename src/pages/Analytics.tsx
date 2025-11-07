import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { subDays } from "date-fns";
import {
  TrendingUp,
  Users,
  Phone,
  FileText,
  Copy,
  CheckCircle,
  Target,
  ArrowLeft,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { DashboardFilters } from "@/lib/supabaseQueries";
import {
  fetchDailyLeadsTrend,
  fetchLeadsBySource,
  fetchLeadsByInstagram,
  fetchDuplicateLeads,
  fetchCallingConversions,
  fetchShortlistingCompleted,
  fetchApplicationsSubmitted,
  fetchFollowupCalls,
  fetchFunnelData,
  fetchKPIMetrics,
} from "@/lib/supabaseQueries";
import { DashboardFilters as FiltersComponent } from "@/components/dashboard/DashboardFilters";
import { LeadsTrendChart } from "@/components/analytics/LeadsTrendChart";
import { SourceChart } from "@/components/analytics/SourceChart";
import { InstagramChart } from "@/components/analytics/InstagramChart";
import { DuplicatesTable as DuplicatesAnalyticsTable } from "@/components/analytics/DuplicatesTable";
import { ConversionsChart } from "@/components/analytics/ConversionsChart";
import { ShortlistingChart } from "@/components/analytics/ShortlistingChart";
import { ApplicationsChart } from "@/components/analytics/ApplicationsChart";
import { FollowupsChart } from "@/components/analytics/FollowupsChart";
import { FunnelChart } from "@/components/analytics/FunnelChart";
import { KPITiles } from "@/components/analytics/KPITiles";

export default function Analytics() {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [selectedCounselors, setSelectedCounselors] = useState<string[]>([]);
  const [search, setSearch] = useState("");

  const filters: DashboardFilters = useMemo(
    () => ({
      dateFrom: dateRange.from,
      dateTo: dateRange.to,
      sources: selectedSources.length > 0 ? selectedSources : undefined,
      counselors: selectedCounselors.length > 0 ? selectedCounselors : undefined,
      search: search || undefined,
    }),
    [dateRange, selectedSources, selectedCounselors, search]
  );

  const { data: sources = [] } = useQuery({
    queryKey: ["sources"],
    queryFn: async () => {
      const { fetchSources } = await import("@/lib/supabaseQueries");
      return fetchSources();
    },
  });

  const { data: counselors = [] } = useQuery({
    queryKey: ["counselors"],
    queryFn: async () => {
      const { fetchCounselors } = await import("@/lib/supabaseQueries");
      return fetchCounselors();
    },
  });

  const { data: dailyTrend, isLoading: loadingTrend } = useQuery({
    queryKey: ["dailyLeadsTrend", filters],
    queryFn: () => fetchDailyLeadsTrend(filters),
  });

  const { data: sourceData, isLoading: loadingSource } = useQuery({
    queryKey: ["leadsBySource", filters],
    queryFn: () => fetchLeadsBySource(filters),
  });

  const { data: instagramData, isLoading: loadingInstagram } = useQuery({
    queryKey: ["leadsByInstagram", filters],
    queryFn: () => fetchLeadsByInstagram(filters),
  });

  const { data: duplicates, isLoading: loadingDuplicates } = useQuery({
    queryKey: ["duplicateLeads"],
    queryFn: fetchDuplicateLeads,
    staleTime: 60000,
  });

  const { data: conversions, isLoading: loadingConversions } = useQuery({
    queryKey: ["callingConversions", filters],
    queryFn: () => fetchCallingConversions(filters),
  });

  const { data: shortlisting, isLoading: loadingShortlisting } = useQuery({
    queryKey: ["shortlistingCompleted", filters],
    queryFn: () => fetchShortlistingCompleted(filters),
  });

  const { data: applications, isLoading: loadingApplications } = useQuery({
    queryKey: ["applicationsSubmitted", filters],
    queryFn: () => fetchApplicationsSubmitted(filters),
  });

  const { data: followups, isLoading: loadingFollowups } = useQuery({
    queryKey: ["followupCalls", filters],
    queryFn: () => fetchFollowupCalls(filters),
  });

  const { data: funnelData, isLoading: loadingFunnel } = useQuery({
    queryKey: ["funnelData", filters],
    queryFn: () => fetchFunnelData(filters),
  });

  const { data: kpiMetrics, isLoading: loadingKPI } = useQuery({
    queryKey: ["kpiMetrics", filters],
    queryFn: () => fetchKPIMetrics(filters),
  });

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/dashboard")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
              <p className="text-muted-foreground">
                Comprehensive performance metrics and insights
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <FiltersComponent
          dateRange={dateRange}
          onDateRangeChange={(range) => {
            if (range?.from && range?.to) {
              setDateRange({ from: range.from, to: range.to });
            }
          }}
          sources={sources}
          selectedSources={selectedSources}
          onSourcesChange={setSelectedSources}
          counselors={counselors}
          selectedCounselors={selectedCounselors}
          onCounselorsChange={setSelectedCounselors}
          search={search}
          onSearchChange={setSearch}
        />

        {/* KPI Tiles */}
        <KPITiles data={kpiMetrics} isLoading={loadingKPI} />

        {/* Funnel Chart */}
        <FunnelChart data={funnelData} isLoading={loadingFunnel} />

        {/* Main Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <LeadsTrendChart data={dailyTrend} isLoading={loadingTrend} />
          <SourceChart data={sourceData} isLoading={loadingSource} />
          <InstagramChart data={instagramData} isLoading={loadingInstagram} />
          <ConversionsChart data={conversions} isLoading={loadingConversions} />
          <ShortlistingChart data={shortlisting} isLoading={loadingShortlisting} />
          <ApplicationsChart data={applications} isLoading={loadingApplications} />
          <FollowupsChart data={followups} isLoading={loadingFollowups} />
        </div>

        {/* Duplicates Table */}
        <DuplicatesAnalyticsTable data={duplicates} isLoading={loadingDuplicates} />
      </div>
    </div>
  );
}
