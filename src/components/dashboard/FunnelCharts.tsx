import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { format } from "date-fns";

interface FunnelChartsProps {
  conversionsData: any[];
  shortlistingData: any[];
  applicationsData: any[];
  followupsData: any[];
  isLoading: boolean;
}

export function FunnelCharts({
  conversionsData,
  shortlistingData,
  applicationsData,
  followupsData,
  isLoading,
}: FunnelChartsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-[250px] w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const charts = [
    {
      title: "Calling → Counselling Conversions",
      data: conversionsData,
      dataKey: "conversions",
      color: "hsl(var(--chart-1))",
    },
    {
      title: "Shortlisting Activity",
      data: shortlistingData,
      dataKey: "shortlisted",
      color: "hsl(var(--chart-2))",
    },
    {
      title: "Applications Submitted",
      data: applicationsData,
      dataKey: "applications",
      color: "hsl(var(--chart-3))",
    },
    {
      title: "Follow-up Calls",
      data: followupsData,
      dataKey: "followups",
      color: "hsl(var(--chart-4))",
    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {charts.map((chart) => (
        <Card key={chart.title}>
          <CardHeader>
            <CardTitle className="text-lg">{chart.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chart.data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="day"
                  tickFormatter={(value) => format(new Date(value), "MMM dd")}
                />
                <YAxis />
                <Tooltip labelFormatter={(value) => format(new Date(value), "PPP")} />
                <Bar dataKey={chart.dataKey} fill={chart.color} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
