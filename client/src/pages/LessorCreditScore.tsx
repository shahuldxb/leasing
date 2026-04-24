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
import { ScreenHeader } from "@/components/ScreenHeader";

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
        <ScreenHeader
  screenId="VFLLESCRD0001P001"
  title="Lessor Credit Score"
  subtitle="Lessor creditworthiness and risk rating"
/>

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
