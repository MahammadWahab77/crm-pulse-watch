import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Download } from "lucide-react";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { fetchLeadDetail } from "@/lib/supabaseQueries";
import { Skeleton } from "@/components/ui/skeleton";

interface LeadsTableProps {
  data: any[];
  isLoading: boolean;
  onExport: () => void;
}

export function LeadsTable({ data, isLoading, onExport }: LeadsTableProps) {
  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null);

  const { data: leadDetail, isLoading: isLoadingDetail } = useQuery({
    queryKey: ["leadDetail", selectedLeadId],
    queryFn: () => fetchLeadDetail(selectedLeadId!),
    enabled: !!selectedLeadId,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Leads</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Leads</CardTitle>
          <Button variant="outline" size="sm" onClick={onExport}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No leads found
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((lead) => (
                    <TableRow
                      key={lead.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedLeadId(lead.id)}
                    >
                      <TableCell className="font-medium">{lead.name}</TableCell>
                      <TableCell>{lead.phone}</TableCell>
                      <TableCell>{lead.email || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{lead.source || "Unknown"}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge>{lead.current_stage}</Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(lead.created_at), "MMM dd, yyyy")}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Sheet open={!!selectedLeadId} onOpenChange={() => setSelectedLeadId(null)}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          {isLoadingDetail ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : leadDetail ? (
            <>
              <SheetHeader>
                <SheetTitle>{leadDetail.lead?.name}</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">Contact Info</h3>
                  <div className="space-y-1 text-sm">
                    <p>Phone: {leadDetail.lead?.phone}</p>
                    <p>Email: {leadDetail.lead?.email || "—"}</p>
                    <p>Source: {leadDetail.lead?.source || "Unknown"}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Stage History</h3>
                  <div className="space-y-2">
                    {leadDetail.stageHistory.map((stage: any) => (
                      <div key={stage.id} className="text-sm border-l-2 border-primary pl-3">
                        <p className="font-medium">{stage.to_stage}</p>
                        <p className="text-muted-foreground">
                          {format(new Date(stage.created_at), "PPP")}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Recent Tasks</h3>
                  <div className="space-y-2">
                    {leadDetail.tasks.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No tasks yet</p>
                    ) : (
                      leadDetail.tasks.map((task: any) => (
                        <div key={task.id} className="text-sm border rounded p-2">
                          <p className="font-medium">{task.task_type}</p>
                          <p className="text-muted-foreground">
                            {format(new Date(task.created_at), "PPP")}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Remarks</h3>
                  <div className="space-y-2">
                    {leadDetail.remarks.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No remarks yet</p>
                    ) : (
                      leadDetail.remarks.map((remark: any) => (
                        <div key={remark.id} className="text-sm border rounded p-2">
                          <p>{remark.content}</p>
                          <p className="text-muted-foreground text-xs mt-1">
                            {format(new Date(remark.created_at), "PPP")}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </>
  );
}
