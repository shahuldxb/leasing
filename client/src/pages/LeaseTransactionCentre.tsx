/**
 * Lease Transaction Centre
 * Single screen for Modification (JE-4), Termination (JE-5), Renewal (JE-7)
 * with real-time remeasurement preview, JE preview, schedule preview, and GL posting.
 */
import { useState, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

// ── helpers ──────────────────────────────────────────────────────────────────
const fmt = (n: unknown) =>
  typeof n === 'number' ? n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—';
const fmtDate = (d: unknown) =>
  d ? new Date(d as string).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const today = () => new Date().toISOString().slice(0, 10);

type TxnType = 'Modification' | 'Termination' | 'Renewal';

const LIFECYCLE_COLORS: Record<string, string> = {
  Active:   'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  Modified: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  Draft:    'bg-slate-500/15 text-slate-400 border-slate-500/30',
  Closed:   'bg-red-500/15 text-red-400 border-red-500/30',
};

// ── JE Lines table ────────────────────────────────────────────────────────────
function JETable({ lines }: { lines: Array<Record<string, unknown>> }) {
  if (!lines?.length) return <p className="text-sm text-muted-foreground italic">No journal entries to preview.</p>;
  return (
    <div className="overflow-x-auto rounded border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">#</th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">Account</th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">Account Name</th>
            <th className="px-3 py-2 text-center text-xs font-semibold text-muted-foreground">Dr/Cr</th>
            <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground">Amount</th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">Description</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((l, i) => (
            <tr key={i} className="border-t border-border hover:bg-muted/30">
              <td className="px-3 py-2 text-muted-foreground">{String(l.line_no ?? i + 1)}</td>
              <td className="px-3 py-2 font-mono text-xs">{String(l.account_code ?? '—')}</td>
              <td className="px-3 py-2">{String(l.account_name ?? '—')}</td>
              <td className="px-3 py-2 text-center">
                <span className={`px-2 py-0.5 rounded text-xs font-bold ${l.dr_cr === 'Dr' ? 'bg-blue-500/15 text-blue-400' : 'bg-purple-500/15 text-purple-400'}`}>
                  {String(l.dr_cr ?? '—')}
                </span>
              </td>
              <td className="px-3 py-2 text-right font-mono">{fmt(l.amount)}</td>
              <td className="px-3 py-2 text-muted-foreground text-xs">{String(l.description ?? '—')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Schedule preview table ────────────────────────────────────────────────────
function SchedulePreview({ rows }: { rows: Array<Record<string, unknown>> }) {
  if (!rows?.length) return null;
  return (
    <div className="overflow-x-auto rounded border border-border mt-3">
      <p className="text-xs text-muted-foreground px-3 pt-2 pb-1">First {rows.length} periods of regenerated schedule</p>
      <table className="w-full text-xs">
        <thead className="bg-muted/50">
          <tr>
            {['Period','Date','Opening Liability','Interest','Payment','Principal','Closing Liability','ROU NBV','Depreciation'].map(h => (
              <th key={h} className="px-2 py-1.5 text-right first:text-left text-muted-foreground font-semibold">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-border hover:bg-muted/20">
              <td className="px-2 py-1.5 text-left">{String(r.period_no ?? i + 1)}</td>
              <td className="px-2 py-1.5 text-right">{fmtDate(r.period_date)}</td>
              <td className="px-2 py-1.5 text-right font-mono">{fmt(r.opening_liability)}</td>
              <td className="px-2 py-1.5 text-right font-mono">{fmt(r.interest_expense)}</td>
              <td className="px-2 py-1.5 text-right font-mono">{fmt(r.payment)}</td>
              <td className="px-2 py-1.5 text-right font-mono">{fmt(r.principal)}</td>
              <td className="px-2 py-1.5 text-right font-mono">{fmt(r.closing_liability)}</td>
              <td className="px-2 py-1.5 text-right font-mono">{fmt(r.rou_nbv)}</td>
              <td className="px-2 py-1.5 text-right font-mono">{fmt(r.depreciation)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Summary KPI row ───────────────────────────────────────────────────────────
function KPIRow({ items }: { items: { label: string; value: string; highlight?: boolean }[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
      {items.map((item, i) => (
        <div key={i} className={`rounded-lg border p-3 ${item.highlight ? 'border-amber-500/40 bg-amber-500/10' : 'border-border bg-muted/30'}`}>
          <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
          <p className={`text-sm font-semibold font-mono ${item.highlight ? 'text-amber-400' : 'text-foreground'}`}>{item.value}</p>
        </div>
      ))}
    </div>
  );
}

// ── Transaction History panel ─────────────────────────────────────────────────
function TransactionHistory({ contractId }: { contractId: number }) {
  const { data, isLoading } = trpc.lease.getLeaseTransactionHistory.useQuery({ contractId });
  if (isLoading) return <p className="text-sm text-muted-foreground">Loading history...</p>;
  const drafts   = data?.drafts   ?? [];
  const postings = data?.postings ?? [];
  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-semibold mb-2">Transaction Log</h4>
        {drafts.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">No transactions posted yet.</p>
        ) : (
          <div className="overflow-x-auto rounded border border-border">
            <table className="w-full text-xs">
              <thead className="bg-muted/50">
                <tr>
                  {['Type','Status','JE Ref','Posted By','Posted At','Notes'].map(h => (
                    <th key={h} className="px-3 py-2 text-left text-muted-foreground font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {drafts.map((d, i) => (
                  <tr key={i} className="border-t border-border hover:bg-muted/20">
                    <td className="px-3 py-2">{String(d.transaction_type ?? '—')}</td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${d.status === 'Posted' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'}`}>
                        {String(d.status ?? '—')}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-mono">{String(d.posted_je_ref ?? '—')}</td>
                    <td className="px-3 py-2">{String(d.approved_by ?? d.submitted_by ?? '—')}</td>
                    <td className="px-3 py-2">{fmtDate(d.approved_at ?? d.submitted_at)}</td>
                    <td className="px-3 py-2 text-muted-foreground">{String(d.notes ?? '—')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div>
        <h4 className="text-sm font-semibold mb-2">GL Postings</h4>
        {postings.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">No GL postings yet.</p>
        ) : (
          <div className="overflow-x-auto rounded border border-border">
            <table className="w-full text-xs">
              <thead className="bg-muted/50">
                <tr>
                  {['Date','JE Ref','Label','Ledger','Account','Dr/Cr','Amount','Posted By'].map(h => (
                    <th key={h} className="px-2 py-1.5 text-left text-muted-foreground font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {postings.map((p, i) => (
                  <tr key={i} className="border-t border-border hover:bg-muted/20">
                    <td className="px-2 py-1.5">{fmtDate(p.posting_date)}</td>
                    <td className="px-2 py-1.5 font-mono font-semibold">{String(p.je_ref ?? '—')}</td>
                    <td className="px-2 py-1.5 text-muted-foreground">{String(p.je_label ?? '—')}</td>
                    <td className="px-2 py-1.5 font-mono">{String(p.ledger_no ?? '—')}</td>
                    <td className="px-2 py-1.5">{String(p.ledger_name ?? '—')}</td>
                    <td className="px-2 py-1.5">
                      <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${p.dr_cr === 'Dr' ? 'bg-blue-500/15 text-blue-400' : 'bg-purple-500/15 text-purple-400'}`}>
                        {String(p.dr_cr ?? '—')}
                      </span>
                    </td>
                    <td className="px-2 py-1.5 text-right font-mono">{fmt(p.amount)}</td>
                    <td className="px-2 py-1.5 text-muted-foreground">{String(p.posted_by ?? '—')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function LeaseTransactionCentre() {
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [txnType, setTxnType] = useState<TxnType>('Modification');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [posted, setPosted] = useState<{ je_ref: string; je_label: string } | null>(null);

  // Modification inputs
  const [modPayment, setModPayment] = useState('');
  const [modDate, setModDate]       = useState(today());
  const [modIBR, setModIBR]         = useState('');
  const [modNotes, setModNotes]     = useState('');

  // Termination inputs
  const [trmDate, setTrmDate]   = useState(today());
  const [trmNotes, setTrmNotes] = useState('');

  // Renewal inputs
  const [renPayment, setRenPayment]   = useState('');
  const [renExpiry, setRenExpiry]     = useState('');
  const [renIBR, setRenIBR]           = useState('');
  const [renNotes, setRenNotes]       = useState('');

  // Lease list
  const { data: leases = [], isLoading: leasesLoading, refetch: refetchLeases } =
    trpc.lease.getLeasesForTransaction.useQuery({ search: search || undefined });

  const selected = useMemo(() => leases.find(l => l.contract_id === selectedId) ?? null, [leases, selectedId]);

  // Previews — only fetch when inputs are valid
  const modPreviewEnabled = txnType === 'Modification' && !!selectedId && !!modPayment && !!modDate;
  const trmPreviewEnabled = txnType === 'Termination' && !!selectedId && !!trmDate;
  const renPreviewEnabled = txnType === 'Renewal' && !!selectedId && !!renPayment && !!renExpiry;

  const { data: modPreview, isFetching: modFetching } = trpc.lease.previewModification.useQuery(
    { contractId: selectedId!, newMonthlyPayment: parseFloat(modPayment), effectiveDate: modDate, newIBR: modIBR ? parseFloat(modIBR) : undefined },
    { enabled: modPreviewEnabled }
  );
  const { data: trmPreview, isFetching: trmFetching } = trpc.lease.previewTermination.useQuery(
    { contractId: selectedId!, terminationDate: trmDate },
    { enabled: trmPreviewEnabled }
  );
  const { data: renPreview, isFetching: renFetching } = trpc.lease.previewRenewal.useQuery(
    { contractId: selectedId!, newExpiryDate: renExpiry, newMonthlyPayment: parseFloat(renPayment), newIBR: renIBR ? parseFloat(renIBR) : undefined },
    { enabled: renPreviewEnabled }
  );

  const utils = trpc.useUtils();
  const postMut = trpc.lease.postLeaseTransaction.useMutation({
    onSuccess: (data) => {
      setPosted({ je_ref: data?.je_ref ?? '', je_label: data?.je_label ?? '' });
      toast.success(`Transaction posted — ${data?.je_ref}`);
      refetchLeases();
      utils.lease.getLeaseTransactionHistory.invalidate({ contractId: selectedId! });
    },
    onError: (e) => toast.error(`Post failed: ${e.message}`),
  });

  const handlePost = () => {
    if (!selectedId) return;
    const base = { contractId: selectedId, transactionType: txnType, effectiveDate: '' };
    if (txnType === 'Modification')
      postMut.mutate({ ...base, effectiveDate: modDate, newMonthlyPayment: parseFloat(modPayment), newIBR: modIBR ? parseFloat(modIBR) : undefined, notes: modNotes });
    else if (txnType === 'Termination')
      postMut.mutate({ ...base, effectiveDate: trmDate, notes: trmNotes });
    else
      postMut.mutate({ ...base, effectiveDate: today(), newMonthlyPayment: parseFloat(renPayment), newExpiryDate: renExpiry, newIBR: renIBR ? parseFloat(renIBR) : undefined, notes: renNotes });
    setConfirmOpen(false);
  };

  const isPreviewReady = txnType === 'Modification' ? !!modPreview : txnType === 'Termination' ? !!trmPreview : !!renPreview;
  const isFetching = modFetching || trmFetching || renFetching;

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Lease Transaction Centre</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Post IFRS 16 lease transactions — Modification (JE-4), Termination (JE-5), Renewal (JE-7) — with real-time remeasurement preview.
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* ── Left: Lease Selector ─────────────────────────────────────── */}
          <div className="xl:col-span-1 space-y-3">
            <Card className="border-border bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Select Lease</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input
                  placeholder="Search by ref, description, lessor…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="h-8 text-sm"
                />
                {leasesLoading ? (
                  <p className="text-xs text-muted-foreground">Loading leases…</p>
                ) : leases.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">No active leases found.</p>
                ) : (
                  <div className="space-y-1.5 max-h-[480px] overflow-y-auto pr-1">
                    {leases.map(l => (
                      <button
                        key={l.contract_id}
                        onClick={() => { setSelectedId(l.contract_id); setPosted(null); }}
                        className={`w-full text-left rounded-lg border px-3 py-2.5 transition-colors ${
                          selectedId === l.contract_id
                            ? 'border-primary bg-primary/10'
                            : 'border-border bg-muted/20 hover:bg-muted/40'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-mono font-semibold text-primary">{l.contract_ref}</span>
                          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${LIFECYCLE_COLORS[l.lifecycle_status] ?? ''}`}>
                            {l.lifecycle_status}
                          </Badge>
                        </div>
                        <p className="text-xs text-foreground mt-0.5 truncate">{l.asset_description}</p>
                        <p className="text-[11px] text-muted-foreground">{l.lessor_name} · Exp {fmtDate(l.expiry_date)}</p>
                        <div className="flex gap-3 mt-1">
                          <span className="text-[10px] text-muted-foreground">Liability: <span className="font-mono text-foreground">{fmt(l.current_liability)}</span></span>
                          <span className="text-[10px] text-muted-foreground">ROU: <span className="font-mono text-foreground">{fmt(l.current_rou_nbv)}</span></span>
                        </div>
                        {l.pending_drafts > 0 && (
                          <span className="text-[10px] text-amber-400">⚠ {l.pending_drafts} pending draft(s)</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ── Right: Transaction Panel ──────────────────────────────────── */}
          <div className="xl:col-span-2 space-y-4">
            {!selected ? (
              <div className="flex items-center justify-center h-64 rounded-xl border border-dashed border-border text-muted-foreground text-sm">
                Select a lease from the list to begin a transaction
              </div>
            ) : (
              <>
                {/* Lease summary bar */}
                <Card className="border-border bg-card">
                  <CardContent className="pt-4 pb-3">
                    <div className="flex flex-wrap items-start gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Contract</p>
                        <p className="text-sm font-mono font-bold text-primary">{selected.contract_ref}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Asset</p>
                        <p className="text-sm font-semibold">{selected.asset_description}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Lessor</p>
                        <p className="text-sm">{selected.lessor_name}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Expiry</p>
                        <p className="text-sm">{fmtDate(selected.expiry_date)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Monthly Payment</p>
                        <p className="text-sm font-mono">{selected.currency} {fmt(selected.monthly_payment)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">IBR</p>
                        <p className="text-sm font-mono">{(selected.ibr * 100).toFixed(4)}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Lease Liability</p>
                        <p className="text-sm font-mono">{fmt(selected.current_liability)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">ROU NBV</p>
                        <p className="text-sm font-mono">{fmt(selected.current_rou_nbv)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Transaction type tabs */}
                <Tabs value={txnType} onValueChange={v => { setTxnType(v as TxnType); setPosted(null); }}>
                  <TabsList className="grid grid-cols-3 w-full">
                    <TabsTrigger value="Modification">Modification (JE-4)</TabsTrigger>
                    <TabsTrigger value="Termination">Termination (JE-5)</TabsTrigger>
                    <TabsTrigger value="Renewal">Renewal (JE-7)</TabsTrigger>
                  </TabsList>

                  {/* ── Modification ── */}
                  <TabsContent value="Modification" className="space-y-4 mt-4">
                    <Card className="border-border bg-card">
                      <CardHeader className="pb-3"><CardTitle className="text-sm">Modification Terms (IFRS 16 Para 45)</CardTitle></CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                          <div>
                            <Label className="text-xs">New Monthly Payment *</Label>
                            <Input type="number" step="0.01" value={modPayment} onChange={e => setModPayment(e.target.value)} className="h-8 text-sm mt-1" placeholder="e.g. 12500.00" />
                          </div>
                          <div>
                            <Label className="text-xs">Effective Date *</Label>
                            <Input type="date" value={modDate} onChange={e => setModDate(e.target.value)} className="h-8 text-sm mt-1" />
                          </div>
                          <div>
                            <Label className="text-xs">New IBR (optional)</Label>
                            <Input type="number" step="0.0001" value={modIBR} onChange={e => setModIBR(e.target.value)} className="h-8 text-sm mt-1" placeholder="e.g. 0.0450" />
                          </div>
                          <div className="col-span-2 sm:col-span-3">
                            <Label className="text-xs">Notes</Label>
                            <Input value={modNotes} onChange={e => setModNotes(e.target.value)} className="h-8 text-sm mt-1" placeholder="Reason for modification…" />
                          </div>
                        </div>

                        {modFetching && <p className="text-xs text-muted-foreground animate-pulse">Calculating remeasurement…</p>}

                        {modPreview?.summary && (
                          <>
                            <Separator className="my-3" />
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Remeasurement Preview</h4>
                            <KPIRow items={[
                              { label: 'Current Liability',   value: fmt(modPreview.summary.current_liability) },
                              { label: 'New PV (Remeasured)', value: fmt(modPreview.summary.new_pv), highlight: true },
                              { label: 'Liability Δ',         value: fmt(modPreview.summary.liability_delta), highlight: true },
                              { label: 'Current ROU NBV',     value: fmt(modPreview.summary.current_rou_nbv) },
                              { label: 'New ROU NBV',         value: fmt(modPreview.summary.new_rou_nbv), highlight: true },
                              { label: 'ROU Δ',               value: fmt(modPreview.summary.rou_delta) },
                              { label: 'Remeasurement G/L',   value: fmt(modPreview.summary.remeasurement_gain_loss) },
                              { label: 'Remaining Months',    value: String(modPreview.summary.remaining_months ?? '—') },
                            ]} />
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Journal Entry Preview (JE-4)</h4>
                            <JETable lines={modPreview.jeLines} />
                            {modPreview.schedule?.length > 0 && (
                              <>
                                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mt-4 mb-1">Regenerated Schedule Preview</h4>
                                <SchedulePreview rows={modPreview.schedule} />
                              </>
                            )}
                          </>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* ── Termination ── */}
                  <TabsContent value="Termination" className="space-y-4 mt-4">
                    <Card className="border-border bg-card">
                      <CardHeader className="pb-3"><CardTitle className="text-sm">Termination Terms (IFRS 16 Para 46)</CardTitle></CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <Label className="text-xs">Termination Date *</Label>
                            <Input type="date" value={trmDate} onChange={e => setTrmDate(e.target.value)} className="h-8 text-sm mt-1" />
                          </div>
                          <div>
                            <Label className="text-xs">Notes</Label>
                            <Input value={trmNotes} onChange={e => setTrmNotes(e.target.value)} className="h-8 text-sm mt-1" placeholder="Reason for termination…" />
                          </div>
                        </div>

                        {trmFetching && <p className="text-xs text-muted-foreground animate-pulse">Calculating derecognition…</p>}

                        {trmPreview?.summary && (
                          <>
                            <Separator className="my-3" />
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Derecognition Preview</h4>
                            <KPIRow items={[
                              { label: 'Lease Liability Derecognised', value: fmt(trmPreview.summary.lease_liability_derecognised) },
                              { label: 'ROU Asset Derecognised',       value: fmt(trmPreview.summary.rou_asset_derecognised) },
                              { label: 'Gain / Loss',                  value: fmt(trmPreview.summary.gain_loss_on_termination), highlight: true },
                              { label: 'Type',                         value: String(trmPreview.summary.gain_loss_type ?? '—') },
                              { label: 'Months Early',                 value: String(trmPreview.summary.months_early ?? '—') },
                              { label: 'Original Expiry',              value: fmtDate(trmPreview.summary.original_expiry_date) },
                            ]} />
                            <div className="mb-3 p-3 rounded-lg border border-red-500/30 bg-red-500/10">
                              <p className="text-xs text-red-400 font-semibold">⚠ Irreversible Action</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Posting this transaction will derecognise the ROU asset and lease liability, remove all future projected schedule rows, and set the lease status to Closed. This cannot be undone.
                              </p>
                            </div>
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Journal Entry Preview (JE-5)</h4>
                            <JETable lines={trmPreview.jeLines} />
                          </>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* ── Renewal ── */}
                  <TabsContent value="Renewal" className="space-y-4 mt-4">
                    <Card className="border-border bg-card">
                      <CardHeader className="pb-3"><CardTitle className="text-sm">Renewal Terms (IFRS 16 Para 45)</CardTitle></CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                          <div>
                            <Label className="text-xs">New Monthly Payment *</Label>
                            <Input type="number" step="0.01" value={renPayment} onChange={e => setRenPayment(e.target.value)} className="h-8 text-sm mt-1" placeholder="e.g. 13000.00" />
                          </div>
                          <div>
                            <Label className="text-xs">New Expiry Date *</Label>
                            <Input type="date" value={renExpiry} onChange={e => setRenExpiry(e.target.value)} className="h-8 text-sm mt-1" />
                          </div>
                          <div>
                            <Label className="text-xs">New IBR (optional)</Label>
                            <Input type="number" step="0.0001" value={renIBR} onChange={e => setRenIBR(e.target.value)} className="h-8 text-sm mt-1" placeholder="e.g. 0.0480" />
                          </div>
                          <div className="col-span-2 sm:col-span-3">
                            <Label className="text-xs">Notes</Label>
                            <Input value={renNotes} onChange={e => setRenNotes(e.target.value)} className="h-8 text-sm mt-1" placeholder="Renewal terms summary…" />
                          </div>
                        </div>

                        {renFetching && <p className="text-xs text-muted-foreground animate-pulse">Calculating renewal remeasurement…</p>}

                        {renPreview?.summary && (
                          <>
                            <Separator className="my-3" />
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Renewal Remeasurement Preview</h4>
                            <KPIRow items={[
                              { label: 'Current Liability',   value: fmt(renPreview.summary.current_liability) },
                              { label: 'New PV',              value: fmt(renPreview.summary.new_pv), highlight: true },
                              { label: 'Liability Δ',         value: fmt(renPreview.summary.liability_delta), highlight: true },
                              { label: 'Current ROU NBV',     value: fmt(renPreview.summary.current_rou_nbv) },
                              { label: 'New ROU NBV',         value: fmt(renPreview.summary.new_rou_nbv), highlight: true },
                              { label: 'New Term (months)',   value: String(renPreview.summary.new_term_months ?? '—') },
                              { label: 'Old Expiry',          value: fmtDate(renPreview.summary.old_expiry_date) },
                              { label: 'New Expiry',          value: fmtDate(renPreview.summary.new_expiry_date) },
                            ]} />
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Journal Entry Preview (JE-7)</h4>
                            <JETable lines={renPreview.jeLines} />
                          </>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>

                {/* Post button */}
                {isPreviewReady && !posted && (
                  <div className="flex justify-end">
                    <Button
                      onClick={() => setConfirmOpen(true)}
                      disabled={postMut.isPending}
                      className={`${txnType === 'Termination' ? 'bg-red-600 hover:bg-red-700' : txnType === 'Renewal' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-amber-600 hover:bg-amber-700'} text-white`}
                    >
                      {postMut.isPending ? 'Posting…' : `Post ${txnType} & Generate JE`}
                    </Button>
                  </div>
                )}

                {/* Success confirmation */}
                {posted && (
                  <Card className="border-emerald-500/40 bg-emerald-500/10">
                    <CardContent className="pt-4 pb-3">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">✅</span>
                        <div>
                          <p className="text-sm font-semibold text-emerald-400">Transaction Posted Successfully</p>
                          <p className="text-xs text-muted-foreground mt-1">JE Reference: <span className="font-mono font-bold">{posted.je_ref}</span></p>
                          <p className="text-xs text-muted-foreground">{posted.je_label}</p>
                          <p className="text-xs text-muted-foreground mt-1">The amortisation schedule has been regenerated and the GL ledger updated.</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Transaction history */}
                <Card className="border-border bg-card">
                  <CardHeader className="pb-3"><CardTitle className="text-sm">Transaction History & GL Ledger</CardTitle></CardHeader>
                  <CardContent>
                    <TransactionHistory contractId={selected.contract_id} />
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Confirm dialog */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm {txnType}</AlertDialogTitle>
            <AlertDialogDescription>
              {txnType === 'Termination'
                ? 'This will permanently derecognise the ROU asset and lease liability and cannot be undone. Are you sure?'
                : `This will post the ${txnType.toLowerCase()} JE and regenerate the amortisation schedule. Confirm?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handlePost} className={txnType === 'Termination' ? 'bg-red-600 hover:bg-red-700' : ''}>
              Post Transaction
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
