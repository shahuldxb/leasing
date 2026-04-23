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

const fmt = (n: any) => n != null ? `AED ${Number(n).toLocaleString("en-AE", { maximumFractionDigits: 0 })}` : "—";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  OVERDUE: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  COMPLETED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  IN_PROGRESS: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
};

export default function RentReviews() {
  const [completing, setCompleting] = useState<any>(null);
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
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <RefreshCw className="w-6 h-6 text-blue-500" />
            Rent Reviews
          </h1>
          <p className="text-muted-foreground text-sm">Track and complete scheduled rent reviews across all active leases</p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Card className="bg-amber-50 dark:bg-amber-950/20">
            <CardContent className="pt-4 flex items-center justify-between">
              <div><p className="text-sm text-muted-foreground">Pending Reviews</p><p className="text-3xl font-bold text-amber-600">{pending}</p></div>
              <Clock className="w-8 h-8 text-amber-400" />
            </CardContent>
          </Card>
          <Card className="bg-red-50 dark:bg-red-950/20">
            <CardContent className="pt-4 flex items-center justify-between">
              <div><p className="text-sm text-muted-foreground">Overdue</p><p className="text-3xl font-bold text-red-600">{overdue}</p></div>
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </CardContent>
          </Card>
          <Card className="bg-emerald-50 dark:bg-emerald-950/20">
            <CardContent className="pt-4 flex items-center justify-between">
              <div><p className="text-sm text-muted-foreground">Completed</p><p className="text-3xl font-bold text-emerald-600">{(reviews as any[]).filter((r: any) => r.status === "COMPLETED").length}</p></div>
              <CheckCircle className="w-8 h-8 text-emerald-400" />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">Rent Review Schedule</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contract</TableHead>
                  <TableHead>Asset</TableHead>
                  <TableHead>Review Date</TableHead>
                  <TableHead>Days</TableHead>
                  <TableHead>Current Rent</TableHead>
                  <TableHead>New Rent</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(reviews as any[]).map((r: any) => (
                  <TableRow key={r.review_id}>
                    <TableCell className="font-mono text-xs">{r.contract_ref}</TableCell>
                    <TableCell className="text-sm max-w-[120px] truncate">{r.asset_description}</TableCell>
                    <TableCell className="text-sm font-bold">{r.review_date?.slice(0, 10)}</TableCell>
                    <TableCell>
                      <span className={`text-xs font-bold ${r.days_until < 0 ? "text-red-600" : r.days_until <= 30 ? "text-orange-600" : "text-muted-foreground"}`}>
                        {r.days_until < 0 ? `${Math.abs(r.days_until)}d ago` : `${r.days_until}d`}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{fmt(r.current_rent)}</TableCell>
                    <TableCell className="font-mono text-sm">{r.agreed_new_rent ? fmt(r.agreed_new_rent) : "—"}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{r.review_type?.replace(/_/g, " ")}</Badge></TableCell>
                    <TableCell>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[r.status] ?? ""}`}>{r.status}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      {(r.status === "PENDING" || r.status === "OVERDUE") && (
                        <Button size="sm" variant="outline" onClick={() => { setCompleting(r); setCompleteForm({ agreed_new_rent: r.current_rent, effective_date: r.review_date?.slice(0, 10) ?? "", notes: "" }); }}>
                          Complete
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {(reviews as any[]).length === 0 && (
                  <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">No rent reviews scheduled</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog open={!!completing} onOpenChange={() => setCompleting(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Complete Rent Review — {completing?.contract_ref}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-lg text-sm">
                <p><span className="font-medium">Asset:</span> {completing?.asset_description}</p>
                <p><span className="font-medium">Current Rent:</span> {fmt(completing?.current_rent)}</p>
                <p><span className="font-medium">Review Date:</span> {completing?.review_date?.slice(0, 10)}</p>
              </div>
              <div className="space-y-1">
                <Label>Agreed New Rent (AED/month)</Label>
                <Input type="number" value={completeForm.agreed_new_rent} onChange={e => setCompleteForm(f => ({ ...f, agreed_new_rent: parseFloat(e.target.value) }))} />
                {completeForm.agreed_new_rent && completing?.current_rent && (
                  <p className={`text-xs font-medium ${completeForm.agreed_new_rent > completing.current_rent ? "text-red-500" : "text-emerald-500"}`}>
                    {completeForm.agreed_new_rent > completing.current_rent ? "▲" : "▼"} {Math.abs(((completeForm.agreed_new_rent - completing.current_rent) / completing.current_rent) * 100).toFixed(1)}% change
                  </p>
                )}
              </div>
              <div className="space-y-1">
                <Label>Effective Date</Label>
                <Input type="date" value={completeForm.effective_date} onChange={e => setCompleteForm(f => ({ ...f, effective_date: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Notes</Label>
                <Textarea value={completeForm.notes} onChange={e => setCompleteForm(f => ({ ...f, notes: e.target.value }))} rows={2} placeholder="Negotiation notes..." />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCompleting(null)}>Cancel</Button>
              <Button onClick={() => complete.mutate({ review_id: completing.review_id, ...completeForm })} disabled={complete.isPending}>
                {complete.isPending ? "Saving..." : "Complete Review"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
