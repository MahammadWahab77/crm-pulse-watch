import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Area,
  AreaChart,
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

interface LeadsChartProps {
  dailyData: any[];
  weeklyData: any[];
  monthlyData: any[];
  isLoading: boolean;
}

export function LeadsChart({
  dailyData,
  weeklyData,
  monthlyData,
  isLoading,
}: LeadsChartProps) {
  const processData = (data: any[], timeKey: string) => {
    const grouped = data.reduce((acc, item) => {
      const date = item[timeKey];
      if (!acc[date]) {
        acc[date] = { date, total: 0 };
      }
      acc[date].total += item.leads;
      acc[date][item.source || "Unknown"] = item.leads;
      return acc;
    }, {} as Record<string, any>);

    return Object.values(grouped).sort(
      (a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  };

  const chartData = useMemo(
    () => ({
      daily: processData(dailyData, "day"),
      weekly: processData(weeklyData, "week"),
      monthly: processData(monthlyData, "month"),
    }),
    [dailyData, weeklyData, monthlyData]
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Leads Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Leads Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="daily" className="space-y-4">
          <TabsList>
            <TabsTrigger value="daily">Daily</TabsTrigger>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
          </TabsList>

          {(["daily", "weekly", "monthly"] as const).map((period) => (
            <TabsContent key={period} value={period}>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData[period]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) =>
                      format(new Date(value), period === "monthly" ? "MMM yy" : "MMM dd")
                    }
                  />
                  <YAxis />
                  <Tooltip
                    labelFormatter={(value) => format(new Date(value), "PPP")}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
