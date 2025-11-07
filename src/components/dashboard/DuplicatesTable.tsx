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
import { Badge } from "@/components/ui/badge";
import { Download } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

interface DuplicatesTableProps {
  data: any[];
  isLoading: boolean;
  onExport: () => void;
}

export function DuplicatesTable({ data, isLoading, onExport }: DuplicatesTableProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Duplicate Leads</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  // Group duplicates by email or phone
  const grouped = data.reduce((acc, item) => {
    const key =
      item.email_norm || item.phone_norm || `${item.id}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(item);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Duplicate Leads</CardTitle>
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
                <TableHead>Duplicate Type</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-muted-foreground"
                  >
                    No duplicates found
                  </TableCell>
                </TableRow>
              ) : (
                data.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell className="font-medium">{lead.name}</TableCell>
                    <TableCell>{lead.phone_norm}</TableCell>
                    <TableCell>{lead.email_norm || "—"}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{lead.source || "Unknown"}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {lead.email_dupe_count > 1 && (
                          <Badge variant="destructive" className="text-xs">
                            Email ({lead.email_dupe_count})
                          </Badge>
                        )}
                        {lead.phone_dupe_count > 1 && (
                          <Badge variant="destructive" className="text-xs">
                            Phone ({lead.phone_dupe_count})
                          </Badge>
                        )}
                      </div>
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
  );
}
