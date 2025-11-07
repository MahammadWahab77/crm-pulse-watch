import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Users, Copy, Target, FileText } from "lucide-react";

interface KPITilesProps {
  data?: {
    newLeadsToday: number;
    newLeadsYesterday: number;
    changePercent: number;
    duplicatesToday: number;
    conversionRate: number;
    monthlyApplications: number;
  };
  isLoading: boolean;
}

export function KPITiles({ data, isLoading }: KPITilesProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!data) return null;

  const tiles = [
    {
      title: "New Leads Today",
      value: data.newLeadsToday,
      subtitle: `${data.changePercent >= 0 ? "+" : ""}${data.changePercent}% from yesterday`,
      icon: Users,
      trend: data.changePercent >= 0,
      color: "text-primary",
    },
    {
      title: "Duplicates Today",
      value: data.duplicatesToday,
      subtitle: "Duplicate leads detected",
      icon: Copy,
      color: "text-destructive",
    },
    {
      title: "Conversion Rate",
      value: `${data.conversionRate}%`,
      subtitle: "Called → Counselling",
      icon: Target,
      color: "text-success",
    },
    {
      title: "Monthly Applications",
      value: data.monthlyApplications,
      subtitle: "Applications this month",
      icon: FileText,
      color: "text-primary",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {tiles.map((tile, index) => (
        <Card key={index} className="transition-shadow hover:shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  {tile.title}
                </p>
                <p className="text-3xl font-bold">{tile.value}</p>
                <div className="flex items-center gap-1 text-sm">
                  {tile.trend !== undefined && (
                    tile.trend ? (
                      <TrendingUp className="h-4 w-4 text-success" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-destructive" />
                    )
                  )}
                  <span className="text-muted-foreground">{tile.subtitle}</span>
                </div>
              </div>
              <div className={`w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center`}>
                <tile.icon className={`w-6 h-6 ${tile.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
