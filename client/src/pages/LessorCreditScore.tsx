import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Star, TrendingUp, Award } from "lucide-react";
import { toast } from "sonner";

const RATING_COLORS: Record<string, string> = { AAA: "bg-emerald-600", AA: "bg-emerald-500", A: "bg-blue-500", BBB: "bg-amber-500", BB: "bg-orange-500", B: "bg-red-500", CCC: "bg-red-700", D: "bg-gray-600" };

export default function LessorCreditScore() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ lessor_id: 0, payment_history_score: 80, financial_stability_score: 80, dispute_history_score: 80, compliance_score: 80, notes: "" });

  const { data: scores = [], refetch } = trpc.lessorCredit.list.useQuery();
  const { data: lessors = [] } = trpc.lessor.getLessors.useQuery({});

  const save = trpc.lessorCredit.upsert.useMutation({ onSuccess: () => { refetch(); setOpen(false); toast.success("Credit score saved"); }, onError: (e: any) => toast.error(e.message) });

  const overall = (f: typeof form) => ((f.payment_history_score * 0.4) + (f.financial_stability_score * 0.3) + (f.dispute_history_score * 0.2) + (f.compliance_score * 0.1));
  const rating = (score: number) => score >= 90 ? "AAA" : score >= 80 ? "AA" : score >= 70 ? "A" : score >= 60 ? "BBB" : score >= 50 ? "BB" : score >= 40 ? "B" : "CCC";

  const avgScore = (scores as any[]).length ? (scores as any[]).reduce((s: number, x: any) => s + Number(x.overall_score ?? 0), 0) / (scores as any[]).length : 0;

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><Star className="w-6 h-6 text-amber-500" />Lessor Credit Scoring</h1>
            <p className="text-muted-foreground text-sm">AI-assisted credit risk assessment and rating for all lessors</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />Score Lessor</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Lessor Credit Assessment</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-4">
                <div><Label>Lessor</Label>
                  <Select onValueChange={v => setForm(p => ({ ...p, lessor_id: Number(v) }))}>
                    <SelectTrigger><SelectValue placeholder="Select lessor" /></SelectTrigger>
                    <SelectContent>{(lessors as any[]).map((l: any) => <SelectItem key={l.lessor_id} value={String(l.lessor_id)}>{l.lessor_name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                {[
                  { key: "payment_history_score", label: "Payment History (40% weight)", hint: "Timeliness, disputes, defaults" },
                  { key: "financial_stability_score", label: "Financial Stability (30% weight)", hint: "Credit rating, debt levels" },
                  { key: "dispute_history_score", label: "Dispute History (20% weight)", hint: "Legal disputes, complaints" },
                  { key: "compliance_score", label: "Compliance (10% weight)", hint: "Regulatory, contractual compliance" },
                ].map(f => (
                  <div key={f.key}>
                    <Label>{f.label}</Label>
                    <p className="text-xs text-muted-foreground mb-1">{f.hint}</p>
                    <div className="flex items-center gap-3">
                      <Input type="range" min={0} max={100} value={(form as any)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: Number(e.target.value) }))} className="flex-1" />
                      <span className="w-10 text-right font-mono font-bold">{(form as any)[f.key]}</span>
                    </div>
                  </div>
                ))}
                <div className="p-3 rounded-lg bg-muted">
                  <p className="text-sm font-medium">Computed Overall Score: <span className="text-lg font-bold">{overall(form).toFixed(1)}</span></p>
                  <p className="text-sm">Rating: <Badge className={`${RATING_COLORS[rating(overall(form))] ?? "bg-gray-500"} text-white ml-1`}>{rating(overall(form))}</Badge></p>
                </div>
                <div><Label>Notes</Label><Input value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} /></div>
              </div>
              <Button className="mt-4 w-full" onClick={() => save.mutate(form)} disabled={save.isPending}>Save Assessment</Button>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Lessors Scored", value: (scores as any[]).length, color: "text-blue-600" },
            { label: "Average Score", value: avgScore.toFixed(1), color: "text-foreground" },
            { label: "Investment Grade (≥BBB)", value: (scores as any[]).filter((s: any) => Number(s.overall_score) >= 60).length, color: "text-emerald-600" },
            { label: "High Risk (<BB)", value: (scores as any[]).filter((s: any) => Number(s.overall_score) < 50).length, color: "text-red-600" },
          ].map(k => <Card key={k.label}><CardContent className="pt-4"><p className="text-xs text-muted-foreground">{k.label}</p><p className={`text-2xl font-bold ${k.color}`}>{k.value}</p></CardContent></Card>)}
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Award className="w-4 h-4" />Lessor Credit Ratings</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lessor</TableHead>
                  <TableHead className="text-right">Payment</TableHead>
                  <TableHead className="text-right">Financial</TableHead>
                  <TableHead className="text-right">Dispute</TableHead>
                  <TableHead className="text-right">Compliance</TableHead>
                  <TableHead className="text-right">Overall</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Scored</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(scores as any[]).map((s: any) => (
                  <TableRow key={s.score_id}>
                    <TableCell className="font-medium">{s.lessor_name}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{Number(s.payment_history_score ?? 0).toFixed(0)}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{Number(s.financial_stability_score ?? 0).toFixed(0)}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{Number(s.dispute_history_score ?? 0).toFixed(0)}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{Number(s.compliance_score ?? 0).toFixed(0)}</TableCell>
                    <TableCell className="text-right font-bold font-mono">{Number(s.overall_score ?? 0).toFixed(1)}</TableCell>
                    <TableCell><Badge className={`${RATING_COLORS[s.credit_rating] ?? "bg-gray-500"} text-white text-xs`}>{s.credit_rating ?? "—"}</Badge></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{s.score_date?.slice(0,10)}</TableCell>
                  </TableRow>
                ))}
                {(scores as any[]).length === 0 && <TableRow><TableCell colSpan={8} className="text-center py-6 text-muted-foreground">No credit assessments yet</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
