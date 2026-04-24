import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, FileText, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { ScreenHeader } from "@/components/ScreenHeader";

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-500", SUBMITTED: "bg-blue-500", UNDER_REVIEW: "bg-amber-500",
  APPROVED: "bg-emerald-500", REJECTED: "bg-red-500", CONTRACTED: "bg-violet-500",
};
const PRIORITY_COLORS: Record<string, string> = {
  LOW: "bg-gray-400", MEDIUM: "bg-blue-400", HIGH: "bg-amber-500", CRITICAL: "bg-red-500",
};

const WORKFLOW = ["DRAFT","SUBMITTED","UNDER_REVIEW","APPROVED","CONTRACTED"];

export default function LeaseOrigination() {
  const [open, setOpen] = useState(false);
  const [aiRecord, setAiRecord] = useState<Record<string, unknown> | null>(null);
  const [form, setForm] = useState({ lessor_name: "", asset_description: "", asset_type: "OFFICE", proposed_start: "", proposed_end: "", estimated_annual_rent: 0, currency: "AED", business_justification: "", priority: "MEDIUM" as const });

  const { data: items = [], refetch } = trpc.leaseOrigination.list.useQuery();
  const create = trpc.leaseOrigination.create.useMutation({ onSuccess: () => { refetch(); setOpen(false); toast.success("Lease request created"); }, onError: (e: any) => toast.error(e.message) });
  const advance = trpc.leaseOrigination.updateStatus.useMutation({ onSuccess: () => { refetch(); toast.success("Status updated"); }, onError: (e: any) => toast.error(e.message) });

  const fmt = (n: any) => n != null ? `${Number(n).toLocaleString()}` : "—";

  const nextStatus = (s: string) => {
    const i = WORKFLOW.indexOf(s);
    return i >= 0 && i < WORKFLOW.length - 1 ? WORKFLOW[i + 1] : null;
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <ScreenHeader
  screenId="VFLLEAORG0001P001"
  title="Lease Origination"
  subtitle="Legacy lease origination workflow"

          screenType="lease_origination"
          onAIData={(rows) => setAiRecord(rows[0] ?? null)}
        />

        <div className="grid grid-cols-5 gap-3">
          {WORKFLOW.map(s => {
            const count = (items as any[]).filter((i: any) => i.status === s).length;
            return (
              <Card key={s} className="text-center">
                <CardContent className="pt-4">
                  <Badge className={`${STATUS_COLORS[s]} text-white mb-2`}>{s.replace("_"," ")}</Badge>
                  <p className="text-3xl font-bold">{count}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">Lease Pipeline ({(items as any[]).length} requests)</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lessor</TableHead>
                  <TableHead>Asset</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead className="text-right">Est. Annual Rent</TableHead>
                  <TableHead>Proposed Period</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(items as any[]).map((item: any) => (
                  <TableRow key={item.origination_id}>
                    <TableCell className="font-medium">{item.lessor_name}</TableCell>
                    <TableCell className="text-sm max-w-[150px] truncate">{item.asset_description}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{item.asset_type}</Badge></TableCell>
                    <TableCell><Badge className={`${PRIORITY_COLORS[item.priority]} text-white text-xs`}>{item.priority}</Badge></TableCell>
                    <TableCell className="text-right font-mono text-sm">{item.currency} {fmt(item.estimated_annual_rent)}</TableCell>
                    <TableCell className="text-xs">{item.proposed_start?.slice(0,10)} → {item.proposed_end?.slice(0,10)}</TableCell>
                    <TableCell><Badge className={`${STATUS_COLORS[item.status] ?? "bg-gray-500"} text-white text-xs`}>{item.status?.replace("_"," ")}</Badge></TableCell>
                    <TableCell>
                      {nextStatus(item.status) && (
                        <Button size="sm" variant="outline" onClick={() => advance.mutate({ origination_id: item.origination_id, status: nextStatus(item.status)! })}>
                          <ArrowRight className="w-3 h-3 mr-1" />{nextStatus(item.status)?.replace("_"," ")}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {(items as any[]).length === 0 && <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No lease requests yet</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
