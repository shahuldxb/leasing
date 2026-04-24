import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { ScreenHeader } from "@/components/ScreenHeader";
import { GenAIFillButton } from "@/components/GenAIFillButton";

export default function CPIEscalation() {
  const [applyDialog, setApplyDialog] = useState<any>(null);
  const [aiRows, setAiRows] = useState<Record<string, unknown>[]>([]);
  const [newRent, setNewRent] = useState("");

  // Fetch escalations from backend
  const { data: escalationsData, refetch, isLoading } = trpc.accounting.escalation.escalations.useQuery({});
  const pending: any[] = escalationsData ?? [];

  const utils = trpc.useUtils();
  const applyMut = trpc.accounting.escalation.applyEscalation.useMutation({
    onSuccess: () => {
      utils.accounting.escalation.escalations.invalidate();
      toast.success("CPI escalation applied successfully");
      setApplyDialog(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const displayRows = aiRows.length > 0 ? aiRows : pending;

  const statusBadge = (s: string) => {
    if (s === "APPLIED") return <Badge variant="default">Applied</Badge>;
    if (s === "PENDING") return <Badge variant="secondary" className="text-amber-600">Pending</Badge>;
    return <Badge variant="outline">{s}</Badge>;
  };

  return (
    <DashboardLayout>
      {applyDialog ? (
        <div className="flex flex-col h-full w-full bg-background">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card shrink-0">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => setApplyDialog(null)}><ArrowLeft className="w-5 h-5" /></Button>
              <div><h2 className="text-lg font-semibold">Apply CPI Escalation</h2><p className="text-xs text-muted-foreground">Contract: {applyDialog.contract_ref}</p></div>
            </div>
            <div className="flex gap-2">
              <GenAIFillButton formType="cpi_escalation" onFill={(data) => {
                if (data.newRent) setNewRent(String(data.newRent));
              }} />
              <Button variant="outline" onClick={() => setApplyDialog(null)}>Cancel</Button>
              <Button
                disabled={applyMut.isPending || !newRent}
                onClick={() => applyMut.mutate({ escalation_id: applyDialog.escalation_id, new_rent: Number(newRent) })}
              >
                {applyMut.isPending ? "Applying..." : "Apply Escalation"}
              </Button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-8 py-6">
            <div className="max-w-xl mx-auto space-y-5">
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg text-sm">
                <div><span className="text-muted-foreground">Current Rent:</span><span className="ml-2 font-mono font-semibold">AED {Number(applyDialog.current_rent ?? 0).toLocaleString()}</span></div>
                <div><span className="text-muted-foreground">CPI Rate:</span><span className="ml-2 font-mono font-semibold">{applyDialog.cpi_rate ?? "—"}%</span></div>
                <div><span className="text-muted-foreground">Proposed Rent:</span><span className="ml-2 font-mono font-semibold text-emerald-600">AED {Number(applyDialog.proposed_rent ?? 0).toLocaleString()}</span></div>
                <div><span className="text-muted-foreground">Effective Date:</span><span className="ml-2">{applyDialog.effective_date?.slice(0,10)}</span></div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Confirmed New Rent (AED) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  className="mt-1"
                  value={newRent}
                  onChange={e => setNewRent(e.target.value)}
                  placeholder={String(applyDialog.proposed_rent ?? "")}
                />
                <p className="text-xs text-muted-foreground mt-1">Enter the confirmed new monthly rent to apply. Defaults to proposed rent.</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-6 space-y-6">
          <ScreenHeader
            screenId="VFLCPIESC0001P001"
            title="CPI Escalation"
            subtitle="Consumer Price Index rent escalations pending review and application"
            screenType="cpi_escalation"
            onAIData={(rows) => setAiRows(rows)}
          />
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Pending Escalations", value: displayRows.filter((r: any) => r.status === "PENDING").length, color: "text-amber-600" },
              { label: "Applied This Year", value: displayRows.filter((r: any) => r.status === "APPLIED").length, color: "text-emerald-600" },
              { label: "Total Contracts", value: displayRows.length, color: "text-blue-600" },
            ].map(k => (
              <Card key={k.label}>
                <CardContent className="pt-4">
                  <p className="text-xs text-muted-foreground">{k.label}</p>
                  <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contract</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead className="text-right">Current Rent</TableHead>
                    <TableHead className="text-right">CPI Rate</TableHead>
                    <TableHead className="text-right">Proposed Rent</TableHead>
                    <TableHead>Effective Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading && aiRows.length === 0 ? (
                    <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Loading escalations…</TableCell></TableRow>
                  ) : displayRows.map((r: any, i: number) => (
                    <TableRow key={r.escalation_id ?? i}>
                      <TableCell className="font-mono text-xs">{r.contract_ref}</TableCell>
                      <TableCell className="text-sm">{r.asset_description ?? r.property_name ?? "—"}</TableCell>
                      <TableCell className="text-right font-mono text-sm">AED {Number(r.current_rent ?? 0).toLocaleString()}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{r.cpi_rate ?? "—"}%</TableCell>
                      <TableCell className="text-right font-mono text-sm font-semibold text-emerald-600">AED {Number(r.proposed_rent ?? 0).toLocaleString()}</TableCell>
                      <TableCell className="text-sm">{r.effective_date?.slice(0,10) ?? r.review_date?.slice(0,10)}</TableCell>
                      <TableCell>{statusBadge(r.status)}</TableCell>
                      <TableCell>
                        {r.status === "PENDING" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => { setNewRent(String(r.proposed_rent ?? "")); setApplyDialog(r); }}
                          >
                            <TrendingUp className="w-3 h-3 mr-1" />Apply
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {!isLoading && displayRows.length === 0 && (
                    <TableRow><TableCell colSpan={8} className="text-center py-6 text-muted-foreground">No CPI escalations pending</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}
    </DashboardLayout>
  );
}
