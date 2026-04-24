import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { RefreshCw, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { ScreenHeader } from "@/components/ScreenHeader";
import { GenAIFillButton } from "@/components/GenAIFillButton";

const fmt = (n: any) => n != null ? `AED ${Number(n).toLocaleString("en-AE", { maximumFractionDigits: 0 })}` : "—";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  OVERDUE: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  COMPLETED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  IN_PROGRESS: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
};

export default function RentReviews() {
  const [completing, setCompleting] = useState<any>(null);
  const [aiRows, setAiRows] = useState<Record<string, unknown>[]>([]);
  const [completeForm, setCompleteForm] = useState({ agreed_new_rent: 0, effective_date: "", notes: "" });

  const { data: reviews = [], refetch } = trpc.rentReview.list.useQuery();

  const complete = trpc.rentReview.complete.useMutation({
    onSuccess: () => { refetch(); setCompleting(null); toast.success("Rent review completed"); },
    onError: (err: any) => toast.error(err.message),
  });

  const pending = (reviews as any[]).filter((r: any) => r.status === "PENDING" || r.status === "OVERDUE").length;
  const overdue = (reviews as any[]).filter((r: any) => r.status === "OVERDUE").length;

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <ScreenHeader
          screenId="VFLRNTRV0001P001"
          screenType="rent_reviews"
          onAIData={(rows) => setAiRows(rows)}
          title="Rent Reviews"
          subtitle="Scheduled rent review tracking and completion"
        />

        {/* KPI Row */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="bg-card border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <Clock className="w-8 h-8 text-yellow-400" />
              <div><p className="text-2xl font-bold">{pending}</p><p className="text-xs text-muted-foreground">Pending Reviews</p></div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-red-400" />
              <div><p className="text-2xl font-bold">{overdue}</p><p className="text-xs text-muted-foreground">Overdue</p></div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-green-400" />
              <div><p className="text-2xl font-bold">{(reviews as any[]).filter((r: any) => r.status === 'COMPLETED').length}</p><p className="text-xs text-muted-foreground">Completed</p></div>
            </CardContent>
          </Card>
        </div>

        {/* Reviews Table */}
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Rent Review Register</CardTitle>
            <Button size="sm" variant="outline" onClick={() => refetch()}><RefreshCw className="w-3 h-3 mr-1" /> Refresh</Button>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lease Ref</TableHead>
                  <TableHead>Review Date</TableHead>
                  <TableHead className="text-right">Current Rent</TableHead>
                  <TableHead className="text-right">Proposed Rent</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(reviews as any[]).map((rv: any) => (
                  <TableRow key={rv.id}>
                    <TableCell className="font-mono text-red-400">{rv.lease_ref || rv.leaseId}</TableCell>
                    <TableCell>{rv.review_date || rv.reviewDate}</TableCell>
                    <TableCell className="text-right">{fmt(rv.current_rent || rv.currentRent)}</TableCell>
                    <TableCell className="text-right">{fmt(rv.proposed_rent || rv.proposedRent)}</TableCell>
                    <TableCell><Badge className={STATUS_COLORS[rv.status] || ""}>{rv.status}</Badge></TableCell>
                    <TableCell>
                      {(rv.status === 'PENDING' || rv.status === 'OVERDUE') && (
                        <Button size="sm" variant="outline" onClick={() => { setCompleting(rv); setCompleteForm({ agreed_new_rent: rv.proposed_rent || rv.current_rent || 0, effective_date: "", notes: "" }); }}>
                          Complete
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {(reviews as any[]).length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No rent reviews scheduled.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Complete Review Dialog */}
        <Dialog open={!!completing} onOpenChange={() => setCompleting(null)}>
          <DialogContent className="max-w-md bg-card border-border">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                Complete Rent Review
                <GenAIFillButton
                  formType="rent_review"
                  onFill={(data) => {
                    if (data.agreed_new_rent !== undefined) setCompleteForm(f => ({ ...f, agreed_new_rent: Number(data.agreed_new_rent) }));
                    if (data.effective_date !== undefined) setCompleteForm(f => ({ ...f, effective_date: data.effective_date as string }));
                    if (data.notes !== undefined) setCompleteForm(f => ({ ...f, notes: data.notes as string }));
                  }}
                />
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1">
                <Label>Agreed New Rent (AED/year)</Label>
                <Input type="number" value={completeForm.agreed_new_rent} onChange={e => setCompleteForm(f => ({ ...f, agreed_new_rent: Number(e.target.value) }))} />
              </div>
              <div className="space-y-1">
                <Label>Effective Date</Label>
                <Input type="date" value={completeForm.effective_date} onChange={e => setCompleteForm(f => ({ ...f, effective_date: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Notes</Label>
                <Textarea value={completeForm.notes} onChange={e => setCompleteForm(f => ({ ...f, notes: e.target.value }))} rows={3} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCompleting(null)}>Cancel</Button>
              <Button onClick={() => complete.mutate({ review_id: completing.id, agreed_new_rent: completeForm.agreed_new_rent, effective_date: completeForm.effective_date, notes: completeForm.notes })} disabled={complete.isPending} className="bg-green-600 hover:bg-green-700">Confirm Agreement</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
