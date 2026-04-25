import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import ScreenHeader from "@/components/ScreenHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Plus, Pencil, Trash2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { GenAIFillButton } from "@/components/GenAIFillButton";

export default function HedgeAccounting() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<any>({ hedgeType: "Fair Value", notionalAmount: "", currency: "QAR", hedgeRatio: "100", startDate: "", endDate: "", instrument: "" });
  const [aiRows, setAiRows] = useState<any[]>([]);
  const [showSample, setShowSample] = useState(false);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.altKey && e.key === "1") { e.preventDefault(); setShowForm(false); }
      if (e.altKey && e.key === "F2") { e.preventDefault(); setShowSample(s => !s); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
  const utils = trpc.useUtils();
  const actionMut = trpc.system.notifyOwner.useMutation({ onSuccess: () => { setShowForm(false); toast.success("Hedge designation submitted for review"); }, onError: (e: any) => toast.error(e.message) });

  const hedges = [
    { id: 1, type: "Fair Value", instrument: "Interest Rate Swap", notional: "5,000,000", currency: "QAR", ratio: "100%", status: "Effective" },
    { id: 2, type: "Cash Flow", instrument: "FX Forward", notional: "2,500,000", currency: "USD", ratio: "85%", status: "Effective" },
    { id: 3, type: "Net Investment", instrument: "Cross Currency Swap", notional: "10,000,000", currency: "EUR", ratio: "100%", status: "Ineffective" },
  ];

  if (showForm) {
    return (
      <DashboardLayout>
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-border">
            <Button variant="ghost" size="sm" onClick={() => setShowForm(false)} className="gap-2">
              <ArrowLeft className="w-4 h-4" />Back
            </Button>
            <div>
              <h2 className="font-semibold text-lg">New Hedge Designation</h2>
              <p className="text-sm text-muted-foreground">Designate a new hedging relationship under IFRS 9</p>
            </div>
            <div className="ml-auto"><GenAIFillButton
              formType="hedge"
              onFill={(data) => setForm((f: any) => ({
                          ...f,
                          instrument: data.instrumentType ?? f.instrument,
                          notionalAmount: data.notionalAmount ?? f.notionalAmount,
                          startDate: data.startDate ?? f.startDate,
                          endDate: data.maturityDate ?? f.endDate,
                          notes: data.notes ?? f.notes,
                        }))}
            /></div>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-2xl mx-auto space-y-4">
              <div><Label>Hedge Type</Label>
                <Select value={form.hedgeType} onValueChange={v => setForm((f: any) => ({ ...f, hedgeType: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{["Fair Value","Cash Flow","Net Investment"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Hedging Instrument</Label><Input className="mt-1" placeholder="e.g. Interest Rate Swap, FX Forward" value={form.instrument} onChange={e => setForm((f: any) => ({ ...f, instrument: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Notional Amount</Label><Input className="mt-1" type="number" value={form.notionalAmount} onChange={e => setForm((f: any) => ({ ...f, notionalAmount: e.target.value }))} /></div>
                <div><Label>Currency</Label>
                  <Select value={form.currency} onValueChange={v => setForm((f: any) => ({ ...f, currency: v }))}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>{["QAR","USD","EUR","GBP"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Start Date</Label><Input className="mt-1" type="date" value={form.startDate} onChange={e => setForm((f: any) => ({ ...f, startDate: e.target.value }))} /></div>
                <div><Label>End Date</Label><Input className="mt-1" type="date" value={form.endDate} onChange={e => setForm((f: any) => ({ ...f, endDate: e.target.value }))} /></div>
              </div>
              <div><Label>Hedge Ratio (%)</Label><Input className="mt-1" type="number" min="1" max="100" value={form.hedgeRatio} onChange={e => setForm((f: any) => ({ ...f, hedgeRatio: e.target.value }))} /></div>
              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button className="bg-[#e60000] hover:bg-[#cc0000] text-white" disabled={actionMut.isPending}
                  onClick={() => actionMut.mutate({ title: "New Hedge Designation", content: JSON.stringify(form) })}>
                  {actionMut.isPending ? "Submitting..." : "Submit Designation"}
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
          screenId="VFLHEDGE0001P001"
          title="Hedge Accounting"
          subtitle="FX hedge designation and effectiveness testing"
          screenType="hedge_accounting"
          onAIData={(rows) => setAiRows(rows)}
          actions={<Button onClick={() => setShowForm(true)} className="bg-[#e60000] hover:bg-[#cc0000] text-white gap-2 h-9 px-3 text-sm rounded-lg"><Plus className="w-4 h-4" />Add</Button>}
        />
        <div className="rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Type</TableHead><TableHead>Instrument</TableHead><TableHead>Notional</TableHead><TableHead>Currency</TableHead><TableHead>Ratio</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {hedges.map((h) => (
                <TableRow key={h.id}>
                  <TableCell>{h.type}</TableCell>
                  <TableCell>{h.instrument}</TableCell>
                  <TableCell>{h.notional}</TableCell>
                  <TableCell>{h.currency}</TableCell>
                  <TableCell>{h.ratio}</TableCell>
                  <TableCell><Badge className={h.status === "Effective" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}>{h.status}</Badge></TableCell>
                  <TableCell className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => { setForm({ hedgeType: h.type, instrument: h.instrument, notionalAmount: h.notional.replace(/,/g,''), currency: h.currency, hedgeRatio: h.ratio.replace('%',''), startDate: '', endDate: '' }); setShowForm(true); }}><Pencil className="w-4 h-4 text-blue-400" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => toast.success(`Hedge ${h.id} deleted`)}><Trash2 className="w-4 h-4 text-red-400" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    
      {showSample && (
        <div className="fixed bottom-4 right-4 z-50 bg-card border border-border rounded-lg p-4 shadow-xl max-w-sm">
          <p className="text-xs font-semibold text-primary mb-2">Qatar Sample Data</p>
          <div className="text-xs text-muted-foreground space-y-1">
            <p>Company: Vodafone Qatar Q.P.S.C.</p>
            <p>Location: West Bay, Doha, Qatar</p>
            <p>Currency: QAR | Country: QA</p>
            <p>Contact: +974 4412 0000</p>
            <p>Bank: Qatar National Bank (QNB)</p>
          </div>
          <button className="mt-2 text-xs text-primary hover:underline" onClick={() => setShowSample(false)}>Close</button>
        </div>
      )}
    </DashboardLayout>
  );
}
