import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface DuplicatesTableProps {
  data?: Array<{
    fingerprint: string;
    canonical_lead_id: number;
    dup_count: number;
    lead_ids: number[];
  }>;
  isLoading: boolean;
}

export function DuplicatesTable({ data, isLoading }: DuplicatesTableProps) {
  const exportToCSV = () => {
    if (!data) return;
    
    const headers = ["Fingerprint", "Canonical Lead ID", "Duplicate Count", "Lead IDs"];
    const rows = data.map((d) => [
      d.fingerprint,
      d.canonical_lead_id,
      d.dup_count,
      d.lead_ids.join("; "),
    ]);
    
    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "duplicate-leads.csv";
    a.click();
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Duplicate Leads Detection</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[200px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Duplicate Leads Detection</CardTitle>
          <Button variant="outline" size="sm" onClick={exportToCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fingerprint</TableHead>
                <TableHead>Canonical Lead ID</TableHead>
                <TableHead>Duplicate Count</TableHead>
                <TableHead>Lead IDs</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data || []).map((dup, index) => (
                <TableRow key={index}>
                  <TableCell className="font-mono text-xs">
                    {dup.fingerprint.substring(0, 20)}...
                  </TableCell>
                  <TableCell>{dup.canonical_lead_id}</TableCell>
                  <TableCell>
                    <span className="font-semibold text-destructive">
                      {dup.dup_count}
                    </span>
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {dup.lead_ids.join(", ")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
