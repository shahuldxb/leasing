import { useState, useEffect, useCallback } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import ScreenHeader from "@/components/ScreenHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { GenAIFillButton } from "@/components/GenAIFillButton";

export default function RentReviews() {
  const [showSample, setShowSample] = useState(false);

  const handleAltKeys = useCallback((e: KeyboardEvent) => {
    if (e.altKey && e.key === "1") { e.preventDefault(); setShowSample(false); }
    if (e.altKey && e.key === "F2") { e.preventDefault(); setShowSample(true); }
  }, []);
  useEffect(() => {
    window.addEventListener("keydown", handleAltKeys);
    return () => window.removeEventListener("keydown", handleAltKeys);
  }, [handleAltKeys]);

  const [showForm, setShowForm] = useState(false);
  const [completing, setCompleting] = useState<any>(null);
  const [editRow, setEditRow] = useState<any>(null);
  const [form, setForm] = useState<any>({ newRent: "", reviewDate: "", notes: "" });
  const [aiRows, setAiRows] = useState<any[]>([]);

  function openEdit(r: any) {
    setEditRow(r);
    setCompleting(r);
    setForm({ newRent: String(r.new_rent ?? r.current_rent ?? ""), reviewDate: r.review_date ? new Date(r.review_date).toISOString().slice(0,10) : "", notes: r.notes ?? "" });
    setShowForm(true);
  }
  function handleDelete(r: any) {
    toast("Delete rent review for contract " + r.contract_id + "?", {
      action: { label: "Confirm Delete", onClick: () => toast.success("Rent review deleted") },
    });
  }

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
            <div className="ml-auto"><GenAIFillButton
              formType="rent_review"
              onFill={(data) => setForm((f: any) => ({
                          ...f,
                          newRent: data.proposedRent ?? f.newRent,
                          reviewDate: data.reviewDate ?? f.reviewDate,
                          notes: data.notes ?? f.notes,
                        }))}
            /></div>
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
          
        {showSample && (
          <div className="bg-card border border-primary/30 rounded-xl p-5 mb-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">Sample Record (Qatar)</h3>
              <button className="text-xs text-muted-foreground hover:text-foreground" onClick={() => setShowSample(false)}>✕ Close</button>
            </div>
            <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono bg-muted/30 rounded p-3">{'review_date: "2025-09-01", current_rent: 45000, agreed_new_rent: 49500, effective_date: "2025-10-01", notes: "10% increase per QRERA rental index 2025"'}</pre>
          </div>
        )}
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
                  <TableCell className="flex items-center gap-2">
                    {r.status === "Pending" && <Button size="sm" variant="outline" onClick={() => { setCompleting(r); setForm({ newRent: "", reviewDate: "", notes: "" }); setShowForm(true); }}>Complete</Button>}
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openEdit(r)}><Pencil className="w-3.5 h-3.5" /></Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => handleDelete(r)}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </TableCell>
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
