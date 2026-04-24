import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import ScreenHeader from "@/components/ScreenHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function RentReviews() {
  const [showForm, setShowForm] = useState(false);
  const [completing, setCompleting] = useState<any>(null);
  const [form, setForm] = useState<any>({ newRent: "", reviewDate: "", notes: "" });
  const [aiRows, setAiRows] = useState<any[]>([]);

  const { data: reviews = [], refetch } = trpc.rentReview.list.useQuery();
  const complete = trpc.rentReview.complete.useMutation({ onSuccess: () => { refetch(); setShowForm(false); setCompleting(null); toast.success("Rent review completed"); }, onError: (e: any) => toast.error(e.message) });

  if (showForm && completing) {
    return (
      <DashboardLayout>
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-border">
            <Button variant="ghost" size="sm" onClick={() => { setShowForm(false); setCompleting(null); }} className="gap-2">
              <ArrowLeft className="w-4 h-4" />Back
            </Button>
            <div>
              <h2 className="font-semibold text-lg">Complete Rent Review</h2>
              <p className="text-sm text-muted-foreground">Contract: {completing.contract_id} — Due: {completing.review_date ? new Date(completing.review_date).toLocaleDateString() : "—"}</p>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-2xl mx-auto space-y-4">
              <div><Label>New Monthly Rent *</Label><Input className="mt-1" type="number" value={form.newRent} onChange={e => setForm((f: any) => ({ ...f, newRent: e.target.value }))} /></div>
              <div><Label>Review Date</Label><Input className="mt-1" type="date" value={form.reviewDate} onChange={e => setForm((f: any) => ({ ...f, reviewDate: e.target.value }))} /></div>
              <div><Label>Notes</Label><Input className="mt-1" value={form.notes} onChange={e => setForm((f: any) => ({ ...f, notes: e.target.value }))} /></div>
              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Button variant="outline" onClick={() => { setShowForm(false); setCompleting(null); }}>Cancel</Button>
                <Button className="bg-[#e60000] hover:bg-[#cc0000] text-white" disabled={complete.isPending}
                  onClick={() => complete.mutate({ review_id: completing.review_id, agreed_new_rent: Number(form.newRent), effective_date: form.reviewDate, notes: form.notes })}>
                  {complete.isPending ? "Completing..." : "Complete Review"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <ScreenHeader
          screenId="VFLRNTRV0001P001"
          title="Rent Reviews"
          subtitle="Scheduled rent review events and completion tracking"
          screenType="rent_reviews"
          onAIData={(rows) => setAiRows(rows)}
        />
        <div className="rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Contract</TableHead><TableHead>Review Date</TableHead><TableHead>Current Rent</TableHead><TableHead>New Rent</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {(reviews as any[]).map((r: any) => (
                <TableRow key={r.review_id}>
                  <TableCell>{r.contract_id}</TableCell>
                  <TableCell>{r.review_date ? new Date(r.review_date).toLocaleDateString() : "—"}</TableCell>
                  <TableCell>{r.current_rent ? Number(r.current_rent).toLocaleString() : "—"}</TableCell>
                  <TableCell>{r.new_rent ? Number(r.new_rent).toLocaleString() : "—"}</TableCell>
                  <TableCell><Badge className={r.status === "Completed" ? "bg-green-500/20 text-green-400" : "bg-amber-500/20 text-amber-400"}>{r.status}</Badge></TableCell>
                  <TableCell>{r.status === "Pending" && <Button size="sm" variant="outline" onClick={() => { setCompleting(r); setForm({ newRent: "", reviewDate: "", notes: "" }); setShowForm(true); }}>Complete</Button>}</TableCell>
                </TableRow>
              ))}
              {(reviews as any[]).length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No rent reviews scheduled</TableCell></TableRow>}
            </TableBody>
          </Table>
        </div>
      </div>
    </DashboardLayout>
  );
}
