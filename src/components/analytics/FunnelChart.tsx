import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { format } from "date-fns";

interface FunnelChartProps {
  data?: Array<{
    day: string;
    leads: number;
    called: number;
    counselling: number;
    applications: number;
  }>;
  isLoading: boolean;
}

export function FunnelChart({ data, isLoading }: FunnelChartProps) {
  if (isLoading) {
    return (
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Sales Funnel: Leads → Applications</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    );
  }

  // Calculate totals for conversion rates
  const totals = (data || []).reduce(
    (acc, day) => ({
      leads: acc.leads + day.leads,
      called: acc.called + day.called,
      counselling: acc.counselling + day.counselling,
      applications: acc.applications + day.applications,
    }),
    { leads: 0, called: 0, counselling: 0, applications: 0 }
  );

  const calledRate = totals.leads > 0 ? ((totals.called / totals.leads) * 100).toFixed(1) : "0";
  const counsellingRate = totals.called > 0 ? ((totals.counselling / totals.called) * 100).toFixed(1) : "0";
  const applicationRate = totals.counselling > 0 ? ((totals.applications / totals.counselling) * 100).toFixed(1) : "0";

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <div>
          <CardTitle>Sales Funnel: Leads → Applications</CardTitle>
          <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
            <span>Called: {calledRate}%</span>
            <span>→ Counselling: {counsellingRate}%</span>
            <span>→ Applications: {applicationRate}%</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={data || []}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="day"
              tickFormatter={(value) => format(new Date(value), "MMM dd")}
              className="text-xs"
            />
            <YAxis className="text-xs" />
            <Tooltip
              labelFormatter={(value) => format(new Date(value), "MMM dd, yyyy")}
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="leads"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              name="Leads"
            />
            <Line
              type="monotone"
              dataKey="called"
              stroke="hsl(var(--chart-2))"
              strokeWidth={2}
              name="Called"
            />
            <Line
              type="monotone"
              dataKey="counselling"
              stroke="hsl(var(--chart-3))"
              strokeWidth={2}
              name="Counselling"
            />
            <Line
              type="monotone"
              dataKey="applications"
              stroke="hsl(var(--chart-4))"
              strokeWidth={2}
              name="Applications"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
