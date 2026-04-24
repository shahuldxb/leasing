import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import ScreenHeader from "@/components/ScreenHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Trash2, Plus, Pencil } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { GenAIFillButton } from "@/components/GenAIFillButton";

export default function IBRLibrary() {
  const [showForm, setShowForm] = useState(false);
  const [filterCurrency, setFilterCurrency] = useState("all");
  const [form, setForm] = useState<any>({ currency: "AED", tenor: "", rate: "", effectiveDate: "", source: "", ibr_id: null });
  const INIT_FORM = { currency: "AED", tenor: "", rate: "", effectiveDate: "", source: "", ibr_id: null };
  const [aiRows, setAiRows] = useState<any[]>([]);

  const { data: rates = [], refetch } = trpc.accounting.ibr.list.useQuery({ currency: filterCurrency === "all" ? undefined : filterCurrency });
  const upsert = trpc.accounting.ibr.upsert.useMutation({ onSuccess: () => { refetch(); setShowForm(false); toast.success("IBR rate saved"); }, onError: (e: any) => toast.error(e.message) });
  const del = trpc.accounting.ibr.delete.useMutation({ onSuccess: () => { refetch(); toast.success("IBR rate deleted"); } });

  if (showForm) {
    return (
      <DashboardLayout>
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-border">
            <Button variant="ghost" size="sm" onClick={() => setShowForm(false)} className="gap-2">
              <ArrowLeft className="w-4 h-4" />Back
            </Button>
            <div>
              <h2 className="font-semibold text-lg">{form.ibr_id ? "Edit IBR Rate" : "Add IBR Rate"}</h2>
              <p className="text-sm text-muted-foreground">Add an Incremental Borrowing Rate for IFRS 16 calculations</p>
            </div>
            <div className="ml-auto"><GenAIFillButton
              formType="ibr_library"
              onFill={(data) => setForm((f: any) => ({
                          ...f,
                          currency: data.currency ?? f.currency,
                          tenor: data.tenor ?? f.tenor,
                          rate: data.rate ?? f.rate,
                          effectiveDate: data.effectiveDate ?? f.effectiveDate,
                          source: data.source ?? f.source,
                        }))}
            /></div>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-2xl mx-auto space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Currency</Label>
                  <Select value={form.currency} onValueChange={v => setForm((f: any) => ({ ...f, currency: v }))}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>{["AED","USD","EUR","GBP","SAR","QAR"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Tenor (months)</Label><Input className="mt-1" type="number" value={form.tenor} onChange={e => setForm((f: any) => ({ ...f, tenor: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Rate (%)</Label><Input className="mt-1" type="number" step="0.001" value={form.rate} onChange={e => setForm((f: any) => ({ ...f, rate: e.target.value }))} /></div>
                <div><Label>Effective Date</Label><Input className="mt-1" type="date" value={form.effectiveDate} onChange={e => setForm((f: any) => ({ ...f, effectiveDate: e.target.value }))} /></div>
              </div>
              <div><Label>Source</Label><Input className="mt-1" placeholder="e.g. Central Bank, Bloomberg" value={form.source} onChange={e => setForm((f: any) => ({ ...f, source: e.target.value }))} /></div>
              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Button variant="outline" onClick={() => { setShowForm(false); setForm(INIT_FORM); }}>Cancel</Button>
                <Button className="bg-[#e60000] hover:bg-[#cc0000] text-white" disabled={upsert.isPending}
                  onClick={() => upsert.mutate({ currency: form.currency, lease_term_min: Number(form.tenor || 1), lease_term_max: Number(form.tenor || 60), rate_pct: Number(form.rate), effective_from: form.effectiveDate, source: form.source })}>
                  {upsert.isPending ? "Saving..." : "Save Rate"}
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
          screenId="VFLIBR0001P001"
          title="IBR Library"
          subtitle="Incremental Borrowing Rates for IFRS 16 lease calculations"
          screenType="ibr_library"
          onAIData={(rows) => setAiRows(rows)}
          actions={<Button onClick={() => { setForm(INIT_FORM); setShowForm(true); }} className="bg-[#e60000] hover:bg-[#cc0000] text-white gap-2 h-9 px-3 text-sm rounded-lg"><Plus className="w-4 h-4" />Add</Button>}
        />
        <div className="flex gap-3">
          <Select value={filterCurrency} onValueChange={setFilterCurrency}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Currencies</SelectItem>
              {["AED","USD","EUR","GBP","SAR","QAR"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Currency</TableHead><TableHead>Tenor (mo)</TableHead><TableHead>Rate (%)</TableHead><TableHead>Effective Date</TableHead><TableHead>Source</TableHead><TableHead>Actions</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {(rates as any[]).map((r: any) => (
                <TableRow key={r.ibr_id}>
                  <TableCell>{r.currency}</TableCell>
                  <TableCell>{r.tenor}</TableCell>
                  <TableCell>{Number(r.rate).toFixed(3)}%</TableCell>
                  <TableCell>{r.effective_date ? new Date(r.effective_date).toLocaleDateString() : "—"}</TableCell>
                  <TableCell>{r.source ?? "—"}</TableCell>
                  <TableCell className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => { setForm({ currency: r.currency, tenor: r.tenor, rate: r.rate, effectiveDate: r.effective_date ? new Date(r.effective_date).toISOString().split('T')[0] : '', source: r.source ?? '', ibr_id: r.ibr_id }); setShowForm(true); }}><Pencil className="w-4 h-4 text-blue-400" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => del.mutate({ ibr_id: r.ibr_id })}><Trash2 className="w-4 h-4 text-red-400" /></Button>
                  </TableCell>
                </TableRow>
              ))}
              {(rates as any[]).length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No IBR rates configured</TableCell></TableRow>}
            </TableBody>
          </Table>
        </div>
      </div>
    </DashboardLayout>
  );
}
