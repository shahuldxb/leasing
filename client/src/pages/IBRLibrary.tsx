import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, TrendingUp, Info } from "lucide-react";
import { toast } from "sonner";
import { ScreenHeader } from "@/components/ScreenHeader";

const CURRENCIES = ["AED", "USD", "EUR", "GBP", "SAR", "QAR", "KWD", "BHD", "OMR"];

export default function IBRLibrary() {
  const [filterCurrency, setFilterCurrency] = useState<string>("all");
  const [aiRows, setAiRows] = useState<Record<string, unknown>[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({
    currency: "AED", lease_term_min: 0, lease_term_max: 60,
    rate_pct: 5.5, effective_from: "", effective_to: "",
    source: "", notes: "",
  });

  const { data: rates = [], refetch } = trpc.accounting.ibr.list.useQuery({ currency: filterCurrency === "all" ? undefined : filterCurrency || undefined });
  const upsert = trpc.accounting.ibr.upsert.useMutation({ onSuccess: () => { refetch(); setShowForm(false); toast.success("IBR rate saved"); } });
  const del = trpc.accounting.ibr.delete.useMutation({ onSuccess: () => { refetch(); toast.success("IBR rate deleted"); } });

  const openNew = () => {
    setEditing(null);
    setForm({ currency: "AED", lease_term_min: 0, lease_term_max: 60, rate_pct: 5.5, effective_from: new Date().toISOString().slice(0, 10), effective_to: "", source: "Central Bank UAE", notes: "" });
    setShowForm(true);
  };
  const openEdit = (r: any) => {
    setEditing(r);
    setForm({ currency: r.currency, lease_term_min: r.lease_term_min, lease_term_max: r.lease_term_max, rate_pct: r.rate_pct, effective_from: r.effective_from?.slice(0, 10) ?? "", effective_to: r.effective_to?.slice(0, 10) ?? "", source: r.source ?? "", notes: r.notes ?? "" });
    setShowForm(true);
  };
  const save = () => {
    upsert.mutate({ ...form, ibr_id: editing?.ibr_id, effective_to: form.effective_to || null });
  };

  // Group by currency
  const grouped = rates.reduce((acc: Record<string, any[]>, r: any) => {
    acc[r.currency] = acc[r.currency] || [];
    acc[r.currency].push(r);
    return acc;
  }, {});

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <ScreenHeader
  screenId="VFLIBR0001P001"
          screenType="ibr_library"
          onAIData={(rows) => setAiRows(rows)}
  title="IBR Library"
  subtitle="Incremental borrowing rate library by currency and term"
/>

        {/* Filter */}
        <div className="flex gap-3 items-center">
          <Label>Filter by Currency:</Label>
          <Select value={filterCurrency} onValueChange={setFilterCurrency}>
            <SelectTrigger className="w-36"><SelectValue placeholder="All" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Currencies</SelectItem>
              {CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Info card */}
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
          <CardContent className="pt-4 flex gap-3">
            <Info className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
            <p className="text-sm text-blue-700 dark:text-blue-300">
              The IBR is the rate a lessee would have to pay to borrow over a similar term, with a similar security, the funds necessary to obtain an asset of similar value to the right-of-use asset. IBRs are applied when the interest rate implicit in the lease cannot be readily determined (IFRS 16.26).
            </p>
          </CardContent>
        </Card>

        {/* Rates table per currency */}
        {Object.entries(grouped).map(([currency, cRates]) => (
          <Card key={currency}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                {currency} — Incremental Borrowing Rates
                <Badge variant="outline">{(cRates as any[]).length} bands</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Term Band (months)</TableHead>
                    <TableHead>Rate (%)</TableHead>
                    <TableHead>Effective From</TableHead>
                    <TableHead>Effective To</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(cRates as any[]).map((r: any) => (
                    <TableRow key={r.ibr_id}>
                      <TableCell className="font-mono">{r.lease_term_min}–{r.lease_term_max} months</TableCell>
                      <TableCell className="font-bold text-emerald-600">{Number(r.rate_pct).toFixed(2)}%</TableCell>
                      <TableCell>{r.effective_from?.slice(0, 10)}</TableCell>
                      <TableCell>{r.effective_to?.slice(0, 10) ?? <span className="text-muted-foreground">Open</span>}</TableCell>
                      <TableCell className="text-sm">{r.source}</TableCell>
                      <TableCell>
                        <Badge variant={r.is_active ? "default" : "secondary"}>{r.is_active ? "Active" : "Inactive"}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(r)}><Pencil className="w-3.5 h-3.5" /></Button>
                        <Button variant="ghost" size="sm" className="text-red-500" onClick={() => del.mutate({ ibr_id: r.ibr_id })}><Trash2 className="w-3.5 h-3.5" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))}

        {rates.length === 0 && (
          <Card><CardContent className="py-12 text-center text-muted-foreground">No IBR rates found. Add your first rate to get started.</CardContent></Card>
        )}

        {/* Form dialog */}
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit IBR Rate" : "Add IBR Rate"}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Currency</Label>
                <Select value={form.currency} onValueChange={v => setForm(f => ({ ...f, currency: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Rate (%)</Label>
                <Input type="number" step="0.01" value={form.rate_pct} onChange={e => setForm(f => ({ ...f, rate_pct: parseFloat(e.target.value) }))} />
              </div>
              <div className="space-y-1">
                <Label>Term Min (months)</Label>
                <Input type="number" value={form.lease_term_min} onChange={e => setForm(f => ({ ...f, lease_term_min: parseInt(e.target.value) }))} />
              </div>
              <div className="space-y-1">
                <Label>Term Max (months)</Label>
                <Input type="number" value={form.lease_term_max} onChange={e => setForm(f => ({ ...f, lease_term_max: parseInt(e.target.value) }))} />
              </div>
              <div className="space-y-1">
                <Label>Effective From</Label>
                <Input type="date" value={form.effective_from} onChange={e => setForm(f => ({ ...f, effective_from: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Effective To (optional)</Label>
                <Input type="date" value={form.effective_to} onChange={e => setForm(f => ({ ...f, effective_to: e.target.value }))} />
              </div>
              <div className="space-y-1 col-span-2">
                <Label>Source</Label>
                <Input value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))} placeholder="e.g. Central Bank UAE, Bloomberg" />
              </div>
              <div className="space-y-1 col-span-2">
                <Label>Notes</Label>
                <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional notes" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button onClick={save} disabled={upsert.isPending}>{upsert.isPending ? "Saving..." : "Save"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
