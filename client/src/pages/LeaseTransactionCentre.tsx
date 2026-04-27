/**
 * VodaLease Enterprise — Lease Transaction Centre
 * Full-screen split layout: left = lease selector, right = full-width transaction forms
 * Tabs: Modification (JE-4) | Termination (JE-5) | Renewal (JE-7) | Transaction History & GL Ledger
 */
import { useState, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import DashboardLayout from '@/components/DashboardLayout';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Building2, DollarSign, FileText, RefreshCw, XCircle, History,
  ChevronRight, CheckCircle2, AlertTriangle, Info, Package,
} from 'lucide-react';

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

const CURRENCIES = ['QAR','USD','AED','EUR','GBP','ZAR','KES','NGN','ZMW','GHS'];
const ASSET_TYPES = ['Villa','Apartment','Vehicle','Heavy Vehicle','Tower Site','Data Centre','Retail Outlet','Office','Warehouse','Fleet Vehicle','Network Equipment','Generator Site','Other'];

// ── Sub-components ────────────────────────────────────────────────────────────
function JETable({ lines }: { lines: Array<Record<string, unknown>> }) {
  if (!lines?.length) return <p className="text-sm text-muted-foreground italic">No journal entries to preview.</p>;
  return (
    <div className="overflow-x-auto rounded border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            {['#','Account','Account Name','Dr/Cr','Amount','Description'].map(h => (
              <th key={h} className={`px-3 py-2 text-xs font-semibold text-muted-foreground ${h === 'Amount' ? 'text-right' : h === 'Dr/Cr' ? 'text-center' : 'text-left'}`}>{h}</th>
            ))}
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

function TransactionHistoryPanel({ contractId }: { contractId: number }) {
  const { data, isLoading } = trpc.lease.getLeaseTransactionHistory.useQuery({ contractId });
  if (isLoading) return <p className="text-sm text-muted-foreground animate-pulse">Loading history…</p>;
  const drafts   = data?.drafts   ?? [];
  const postings = data?.postings ?? [];
  return (
    <div className="space-y-6">
      {/* Transaction Log */}
      <div>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><History className="w-4 h-4 text-primary" />Transaction Log</h3>
        {drafts.length === 0 ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground italic p-4 border border-dashed border-border rounded-lg">
            <Info className="w-4 h-4" /> No transactions posted yet for this lease.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  {['Type','Status','JE Ref','Posted By','Posted At','Notes'].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {drafts.map((d, i) => (
                  <tr key={i} className="border-t border-border hover:bg-muted/20">
                    <td className="px-4 py-2.5 font-medium">{String(d.transaction_type ?? '—')}</td>
                    <td className="px-4 py-2.5">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${d.status === 'Posted' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'}`}>
                        {String(d.status ?? '—')}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs">{String(d.posted_je_ref ?? '—')}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{String(d.approved_by ?? d.submitted_by ?? '—')}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{fmtDate(d.approved_at ?? d.submitted_at)}</td>
                    <td className="px-4 py-2.5 text-muted-foreground text-xs">{String(d.notes ?? '—')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {/* GL Postings */}
      <div>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><DollarSign className="w-4 h-4 text-primary" />GL Postings</h3>
        {postings.length === 0 ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground italic p-4 border border-dashed border-border rounded-lg">
            <Info className="w-4 h-4" /> No GL postings yet.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  {['Date','JE Ref','Label','Ledger No.','Account','Dr/Cr','Amount','Posted By'].map(h => (
                    <th key={h} className={`px-3 py-2.5 text-xs font-semibold text-muted-foreground ${h === 'Amount' ? 'text-right' : 'text-left'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {postings.map((p, i) => (
                  <tr key={i} className="border-t border-border hover:bg-muted/20">
                    <td className="px-3 py-2.5 text-muted-foreground">{fmtDate(p.posting_date)}</td>
                    <td className="px-3 py-2.5 font-mono font-semibold text-xs text-primary">{String(p.je_ref ?? '—')}</td>
                    <td className="px-3 py-2.5 text-muted-foreground text-xs max-w-[160px] truncate">{String(p.je_label ?? '—')}</td>
                    <td className="px-3 py-2.5 font-mono text-xs">{String(p.ledger_no ?? '—')}</td>
                    <td className="px-3 py-2.5">{String(p.ledger_name ?? '—')}</td>
                    <td className="px-3 py-2.5">
                      <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${p.dr_cr === 'Dr' ? 'bg-blue-500/15 text-blue-400' : 'bg-purple-500/15 text-purple-400'}`}>
                        {String(p.dr_cr ?? '—')}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono">{fmt(p.amount)}</td>
                    <td className="px-3 py-2.5 text-muted-foreground text-xs">{String(p.posted_by ?? '—')}</td>
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

// ── Main Component ────────────────────────────────────────────────────────────
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

  // Renewal inputs — full New Lease fields
  const [renPayment, setRenPayment]         = useState('');
  const [renExpiry, setRenExpiry]           = useState('');
  const [renIBR, setRenIBR]                 = useState('');
  const [renNotes, setRenNotes]             = useState('');
  const [renCurrency, setRenCurrency]       = useState('QAR');
  const [renAssetType, setRenAssetType]     = useState('');
  const [renAssetDesc, setRenAssetDesc]     = useState('');
  const [renAssetTag, setRenAssetTag]       = useState('');
  const [renLocation, setRenLocation]       = useState('');
  const [renEscalation, setRenEscalation]   = useState('');
  const [renDeposit, setRenDeposit]         = useState('');
  const [renMaintenance, setRenMaintenance] = useState<'Lessor'|'Vodafone'|'Shared'>('Lessor');
  const [renIsLTO, setRenIsLTO]             = useState(false);
  const [renLTOPrice, setRenLTOPrice]       = useState('');
  const [renLTODeposit, setRenLTODeposit]   = useState('');
  const [renLTOInstalments, setRenLTOInstalments] = useState('');
  const [renLTORate, setRenLTORate]         = useState('');
  const [renLTOBalloon, setRenLTOBalloon]   = useState('');
  const [renCommDate, setRenCommDate]       = useState('');
  const [renClassification, setRenClassification] = useState<'Finance'|'Operating'|'ShortTerm'|'LowValue'>('Finance');
  const [renRenewalOption, setRenRenewalOption] = useState(false);
  const [renPurchaseOption, setRenPurchaseOption] = useState(false);

  // Lease list
  const { data: leases = [], isLoading: leasesLoading, refetch: refetchLeases } =
    trpc.lease.getLeasesForTransaction.useQuery({ search: search || undefined });
  const selected = useMemo(() => leases.find(l => l.contract_id === selectedId) ?? null, [leases, selectedId]);

  // Pre-populate renewal fields when a lease is selected
  const handleSelectLease = (l: typeof leases[0]) => {
    setSelectedId(l.contract_id);
    setPosted(null);
    // Pre-fill renewal from existing lease data
    setRenPayment(l.monthly_payment ? String(l.monthly_payment) : '');
    setRenCurrency(l.currency || 'QAR');
    setRenAssetType(l.asset_type || '');
    setRenAssetDesc(l.asset_description || '');
  };

  // Previews
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
      postMut.mutate({ ...base, effectiveDate: renCommDate || today(), newMonthlyPayment: parseFloat(renPayment), newExpiryDate: renExpiry, newIBR: renIBR ? parseFloat(renIBR) : undefined, notes: renNotes });
    setConfirmOpen(false);
  };

  const isPreviewReady = txnType === 'Modification' ? !!modPreview : txnType === 'Termination' ? !!trmPreview : !!renPreview;

  const inputCls = "bg-background border-border text-foreground placeholder:text-muted-foreground";
  const labelCls = "text-xs font-medium text-foreground mb-1 block";

  return (
    <DashboardLayout>
      {/* Full-height flex layout — sidebar is handled by DashboardLayout */}
      <div className="flex h-[calc(100vh-0px)] overflow-hidden">

        {/* ── LEFT PANEL: Lease Selector (fixed width) ─────────────────────── */}
        <div className="w-72 flex-shrink-0 border-r border-border flex flex-col bg-card">
          <div className="p-4 border-b border-border">
            <h2 className="text-sm font-semibold mb-3">Select Lease</h2>
            <Input
              placeholder="Search by ref, description, lessor…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="h-8 text-xs"
            />
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {leasesLoading ? (
              <p className="text-xs text-muted-foreground p-2 animate-pulse">Loading leases…</p>
            ) : leases.length === 0 ? (
              <p className="text-xs text-muted-foreground italic p-2">No active leases found.</p>
            ) : (
              leases.map(l => (
                <button
                  key={l.contract_id}
                  onClick={() => handleSelectLease(l)}
                  className={`w-full text-left rounded-lg border px-3 py-2.5 transition-all ${
                    selectedId === l.contract_id
                      ? 'border-[#e60000] bg-[#e60000]/10 shadow-sm'
                      : 'border-border bg-muted/20 hover:bg-muted/40 hover:border-border/80'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span className={`text-xs font-mono font-semibold ${selectedId === l.contract_id ? 'text-[#e60000]' : 'text-primary'}`}>{l.contract_ref}</span>
                    <Badge variant="outline" className={`text-[9px] px-1 py-0 ${LIFECYCLE_COLORS[l.lifecycle_status] ?? ''}`}>
                      {l.lifecycle_status}
                    </Badge>
                  </div>
                  <p className="text-xs text-foreground truncate leading-snug">{l.asset_description}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{l.lessor_name}</p>
                  <p className="text-[10px] text-muted-foreground">Exp {fmtDate(l.expiry_date)}</p>
                  <div className="flex gap-3 mt-1">
                    <span className="text-[10px] text-muted-foreground">Liability: <span className="font-mono text-foreground">{fmt(l.current_liability)}</span></span>
                    <span className="text-[10px] text-muted-foreground">ROU: <span className="font-mono text-foreground">{fmt(l.current_rou_nbv)}</span></span>
                  </div>
                  {l.pending_drafts > 0 && (
                    <span className="text-[10px] text-amber-400 flex items-center gap-1 mt-0.5"><AlertTriangle className="w-2.5 h-2.5" />{l.pending_drafts} pending</span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* ── RIGHT PANEL: Full-width transaction area ──────────────────────── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {!selected ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-muted-foreground">
              <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center">
                <FileText className="w-8 h-8 text-muted-foreground/50" />
              </div>
              <div className="text-center">
                <p className="text-base font-medium">Select a lease to begin</p>
                <p className="text-sm mt-1">Choose a lease from the left panel to post a Modification, Termination, or Renewal transaction.</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Contract Header Bar */}
              <div className="px-6 py-4 border-b border-border bg-card/50 flex-shrink-0">
                <ScreenHeader
                  screenId="VFLTXNCTR0001P001"
                  title="Lease Transaction Centre"
                  subtitle="Post IFRS 16 lease transactions — Modification (JE-4), Termination (JE-5), Renewal (JE-7)"
                />
                <div className="grid grid-cols-6 gap-4 mt-3 p-3 rounded-lg bg-muted/30 border border-border">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Contract</p>
                    <p className="text-sm font-mono font-bold text-[#e60000]">{selected.contract_ref}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Asset</p>
                    <p className="text-sm font-medium truncate">{selected.asset_description}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Lessor</p>
                    <p className="text-sm truncate">{selected.lessor_name}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Expiry</p>
                    <p className="text-sm">{fmtDate(selected.expiry_date)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Monthly Payment</p>
                    <p className="text-sm font-mono font-bold">{selected.currency} {fmt(selected.monthly_payment)}</p>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-4 mt-2">
                  <div className="p-2 rounded bg-muted/20 border border-border">
                    <p className="text-[10px] text-muted-foreground">IBR</p>
                    <p className="text-sm font-mono">{selected.ibr ? `${(Number(selected.ibr) * 100).toFixed(4)}%` : '—'}</p>
                  </div>
                  <div className="p-2 rounded bg-muted/20 border border-border">
                    <p className="text-[10px] text-muted-foreground">Lease Liability</p>
                    <p className="text-sm font-mono">{fmt(selected.current_liability)}</p>
                  </div>
                  <div className="p-2 rounded bg-muted/20 border border-border">
                    <p className="text-[10px] text-muted-foreground">ROU NBV</p>
                    <p className="text-sm font-mono">{fmt(selected.current_rou_nbv)}</p>
                  </div>
                  <div className="p-2 rounded bg-muted/20 border border-border">
                    <p className="text-[10px] text-muted-foreground">Status</p>
                    <Badge variant="outline" className={`text-xs ${LIFECYCLE_COLORS[selected.lifecycle_status] ?? ''}`}>{selected.lifecycle_status}</Badge>
                  </div>
                </div>
              </div>

              {/* Main Tabs */}
              <div className="flex-1 overflow-y-auto">
                <Tabs value={txnType} onValueChange={v => { setTxnType(v as TxnType); setPosted(null); }} className="h-full flex flex-col">
                  <div className="px-6 pt-4 flex-shrink-0">
                    <TabsList className="grid grid-cols-4 w-full max-w-2xl">
                      <TabsTrigger value="Modification" className="flex items-center gap-1.5">
                        <RefreshCw className="w-3.5 h-3.5" /> Modification (JE-4)
                      </TabsTrigger>
                      <TabsTrigger value="Termination" className="flex items-center gap-1.5">
                        <XCircle className="w-3.5 h-3.5" /> Termination (JE-5)
                      </TabsTrigger>
                      <TabsTrigger value="Renewal" className="flex items-center gap-1.5">
                        <ChevronRight className="w-3.5 h-3.5" /> Renewal (JE-7)
                      </TabsTrigger>
                      <TabsTrigger value="History" className="flex items-center gap-1.5">
                        <History className="w-3.5 h-3.5" /> Txn History & GL
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  {/* ── MODIFICATION TAB ── */}
                  <TabsContent value="Modification" className="flex-1 px-6 pb-6 mt-4 space-y-6">
                    <div className="rounded-xl border border-border bg-card p-6">
                      <div className="flex items-center gap-2 mb-5">
                        <RefreshCw className="w-4 h-4 text-amber-400" />
                        <h3 className="text-base font-semibold">Modification Terms</h3>
                        <span className="text-xs text-muted-foreground ml-1">(IFRS 16 Para 45)</span>
                      </div>
                      <div className="grid grid-cols-3 gap-5">
                        <div>
                          <label className={labelCls}>New Monthly Payment *</label>
                          <Input className={inputCls} placeholder="e.g. 12500.00" value={modPayment} onChange={e => setModPayment(e.target.value)} />
                        </div>
                        <div>
                          <label className={labelCls}>Effective Date *</label>
                          <Input type="date" className={inputCls} value={modDate} onChange={e => setModDate(e.target.value)} />
                        </div>
                        <div>
                          <label className={labelCls}>New IBR (optional)</label>
                          <Input className={inputCls} placeholder="e.g. 0.0450" value={modIBR} onChange={e => setModIBR(e.target.value)} />
                        </div>
                        <div className="col-span-3">
                          <label className={labelCls}>Notes</label>
                          <Input className={inputCls} placeholder="Reason for modification…" value={modNotes} onChange={e => setModNotes(e.target.value)} />
                        </div>
                      </div>
                    </div>

                    {/* Remeasurement Preview */}
                    {modFetching && <p className="text-sm text-muted-foreground animate-pulse px-1">Calculating remeasurement…</p>}
                    {modPreview?.summary && (
                      <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-6 space-y-4">
                        <h4 className="text-sm font-semibold text-amber-400">Remeasurement Preview (IFRS 16 Para 45)</h4>
                        <KPIRow items={[
                          { label: 'Current Liability',   value: fmt(modPreview.summary.current_liability) },
                          { label: 'New PV',              value: fmt(modPreview.summary.new_pv), highlight: true },
                          { label: 'Liability Δ',         value: fmt(modPreview.summary.liability_delta), highlight: true },
                          { label: 'Current ROU NBV',     value: fmt(modPreview.summary.current_rou_nbv) },
                          { label: 'New ROU NBV',         value: fmt(modPreview.summary.new_rou_nbv), highlight: true },
                          { label: 'ROU Δ',               value: fmt(modPreview.summary.rou_delta) },
                          { label: 'Remeasurement G/L',   value: fmt(modPreview.summary.remeasurement_gain_loss) },
                          { label: 'Remaining Months',    value: String(modPreview.summary.remaining_months ?? '—') },
                        ]} />
                        <div>
                          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Journal Entry Preview (JE-4)</h4>
                          <JETable lines={modPreview.jeLines} />
                        </div>
                        {modPreview.schedule?.length > 0 && (
                          <div>
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Regenerated Schedule Preview</h4>
                            <SchedulePreview rows={modPreview.schedule} />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Post Button */}
                    {posted && txnType === 'Modification' ? (
                      <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-semibold text-emerald-400">Modification Posted Successfully</p>
                          <p className="text-xs text-muted-foreground mt-1">JE Reference: <span className="font-mono font-bold">{posted.je_ref}</span></p>
                          <p className="text-xs text-muted-foreground">{posted.je_label}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-end">
                        <Button
                          onClick={() => setConfirmOpen(true)}
                          disabled={!isPreviewReady || postMut.isPending}
                          className="bg-amber-600 hover:bg-amber-700 text-white px-6"
                        >
                          {postMut.isPending ? 'Posting…' : 'Post Modification & Generate JE-4'}
                        </Button>
                      </div>
                    )}
                  </TabsContent>

                  {/* ── TERMINATION TAB ── */}
                  <TabsContent value="Termination" className="flex-1 px-6 pb-6 mt-4 space-y-6">
                    <div className="rounded-xl border border-red-500/30 bg-card p-6">
                      <div className="flex items-center gap-2 mb-5">
                        <XCircle className="w-4 h-4 text-red-400" />
                        <h3 className="text-base font-semibold">Termination Terms</h3>
                        <span className="text-xs text-muted-foreground ml-1">(IFRS 16 Para 46)</span>
                      </div>
                      <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 mb-5">
                        <p className="text-xs text-red-400 font-semibold flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5" /> Irreversible Action</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Posting this transaction will derecognise the ROU asset and lease liability, remove all future projected schedule rows, and set the lease status to Closed. This cannot be undone.
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-5">
                        <div>
                          <label className={labelCls}>Termination Date *</label>
                          <Input type="date" className={inputCls} value={trmDate} onChange={e => setTrmDate(e.target.value)} />
                        </div>
                        <div>
                          <label className={labelCls}>Notes / Reason</label>
                          <Input className={inputCls} placeholder="Reason for termination…" value={trmNotes} onChange={e => setTrmNotes(e.target.value)} />
                        </div>
                      </div>
                    </div>

                    {/* Derecognition Preview */}
                    {trmFetching && <p className="text-sm text-muted-foreground animate-pulse px-1">Calculating derecognition…</p>}
                    {trmPreview?.summary && (
                      <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-6 space-y-4">
                        <h4 className="text-sm font-semibold text-red-400">Derecognition Preview (IFRS 16 Para 46)</h4>
                        <KPIRow items={[
                          { label: 'Lease Liability Derecognised', value: fmt(trmPreview.summary.lease_liability_derecognised) },
                          { label: 'ROU Asset Derecognised',       value: fmt(trmPreview.summary.rou_asset_derecognised) },
                          { label: 'Gain / Loss',                  value: fmt(trmPreview.summary.gain_loss_on_termination), highlight: true },
                          { label: 'Type',                         value: String(trmPreview.summary.gain_loss_type ?? '—') },
                          { label: 'Months Early',                 value: String(trmPreview.summary.months_early ?? '—') },
                          { label: 'Original Expiry',              value: fmtDate(trmPreview.summary.original_expiry_date) },
                        ]} />
                        <div>
                          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Journal Entry Preview (JE-5)</h4>
                          <JETable lines={trmPreview.jeLines} />
                        </div>
                      </div>
                    )}

                    {/* Post Button */}
                    {posted && txnType === 'Termination' ? (
                      <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-semibold text-emerald-400">Termination Posted Successfully</p>
                          <p className="text-xs text-muted-foreground mt-1">JE Reference: <span className="font-mono font-bold">{posted.je_ref}</span></p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-end">
                        <Button
                          onClick={() => setConfirmOpen(true)}
                          disabled={!isPreviewReady || postMut.isPending}
                          className="bg-red-600 hover:bg-red-700 text-white px-6"
                        >
                          {postMut.isPending ? 'Posting…' : 'Post Termination & Generate JE-5'}
                        </Button>
                      </div>
                    )}
                  </TabsContent>

                  {/* ── RENEWAL TAB ── */}
                  <TabsContent value="Renewal" className="flex-1 px-6 pb-6 mt-4 space-y-6">
                    {/* Section 1: Lessor & Asset Details */}
                    <div className="rounded-xl border border-border bg-card p-6">
                      <div className="flex items-center gap-2 mb-5">
                        <Building2 className="w-4 h-4 text-emerald-400" />
                        <h3 className="text-base font-semibold">Asset Details</h3>
                      </div>
                      <div className="grid grid-cols-3 gap-5">
                        <div>
                          <label className={labelCls}>Asset Type</label>
                          <Select value={renAssetType} onValueChange={setRenAssetType}>
                            <SelectTrigger className={inputCls}><SelectValue placeholder="Select type" /></SelectTrigger>
                            <SelectContent>
                              {ASSET_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-2">
                          <label className={labelCls}>Asset Description *</label>
                          <Input className={inputCls} placeholder="e.g. Rooftop BTS Tower — Emaar Square Tower 1" value={renAssetDesc} onChange={e => setRenAssetDesc(e.target.value)} />
                        </div>
                        <div>
                          <label className={labelCls}>Asset Tag / Code</label>
                          <Input className={inputCls} placeholder="e.g. VF-BTS-0042" value={renAssetTag} onChange={e => setRenAssetTag(e.target.value)} />
                        </div>
                        <div>
                          <label className={labelCls}>Location / Site</label>
                          <Input className={inputCls} placeholder="City, Region" value={renLocation} onChange={e => setRenLocation(e.target.value)} />
                        </div>
                        <div>
                          <label className={labelCls}>Maintenance By</label>
                          <Select value={renMaintenance} onValueChange={v => setRenMaintenance(v as typeof renMaintenance)}>
                            <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Lessor">Lessor</SelectItem>
                              <SelectItem value="Vodafone">Vodafone</SelectItem>
                              <SelectItem value="Shared">Shared</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    {/* Section 2: Financial Terms */}
                    <div className="rounded-xl border border-border bg-card p-6">
                      <div className="flex items-center gap-2 mb-5">
                        <DollarSign className="w-4 h-4 text-emerald-400" />
                        <h3 className="text-base font-semibold">Financial Terms</h3>
                        <span className="text-xs text-muted-foreground ml-1">(IFRS 16 Para 46 — Renewal)</span>
                      </div>
                      <div className="grid grid-cols-3 gap-5">
                        <div>
                          <label className={labelCls}>New Commencement Date *</label>
                          <Input type="date" className={inputCls} value={renCommDate} onChange={e => setRenCommDate(e.target.value)} />
                        </div>
                        <div>
                          <label className={labelCls}>New Expiry Date *</label>
                          <Input type="date" className={inputCls} value={renExpiry} onChange={e => setRenExpiry(e.target.value)} />
                        </div>
                        <div>
                          <label className={labelCls}>Currency</label>
                          <Select value={renCurrency} onValueChange={setRenCurrency}>
                            <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className={labelCls}>New Monthly Payment *</label>
                          <Input className={inputCls} placeholder="e.g. 15000.00" value={renPayment} onChange={e => setRenPayment(e.target.value)} />
                        </div>
                        <div>
                          <label className={labelCls}>New IBR (Discount Rate)</label>
                          <Input className={inputCls} placeholder="e.g. 0.0500" value={renIBR} onChange={e => setRenIBR(e.target.value)} />
                        </div>
                        <div>
                          <label className={labelCls}>Escalation Rate (%)</label>
                          <Input className={inputCls} placeholder="e.g. 3.00" value={renEscalation} onChange={e => setRenEscalation(e.target.value)} />
                        </div>
                        <div>
                          <label className={labelCls}>Security Deposit</label>
                          <Input className={inputCls} placeholder="e.g. 30000.00" value={renDeposit} onChange={e => setRenDeposit(e.target.value)} />
                        </div>
                        <div>
                          <label className={labelCls}>IFRS 16 Classification</label>
                          <Select value={renClassification} onValueChange={v => setRenClassification(v as typeof renClassification)}>
                            <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Finance">Finance Lease</SelectItem>
                              <SelectItem value="Operating">Operating Lease</SelectItem>
                              <SelectItem value="ShortTerm">Short-Term (Para 5a)</SelectItem>
                              <SelectItem value="LowValue">Low-Value (Para 5b)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center gap-4 pt-5">
                          <div className="flex items-center gap-2">
                            <Checkbox id="ren-renewal" checked={renRenewalOption} onCheckedChange={v => setRenRenewalOption(!!v)} />
                            <label htmlFor="ren-renewal" className="text-xs cursor-pointer">Renewal Option</label>
                          </div>
                          <div className="flex items-center gap-2">
                            <Checkbox id="ren-purchase" checked={renPurchaseOption} onCheckedChange={v => setRenPurchaseOption(!!v)} />
                            <label htmlFor="ren-purchase" className="text-xs cursor-pointer">Purchase Option</label>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Section 3: LTO Terms (optional) */}
                    <div className="rounded-xl border border-border bg-card p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <Package className="w-4 h-4 text-blue-400" />
                        <h3 className="text-base font-semibold">Lease-to-Own (LTO) Terms</h3>
                        <div className="flex items-center gap-2 ml-auto">
                          <Checkbox id="ren-lto" checked={renIsLTO} onCheckedChange={v => setRenIsLTO(!!v)} />
                          <label htmlFor="ren-lto" className="text-xs cursor-pointer">Enable LTO for this renewal</label>
                        </div>
                      </div>
                      {renIsLTO && (
                        <div className="grid grid-cols-3 gap-5">
                          <div>
                            <label className={labelCls}>Purchase Price</label>
                            <Input className={inputCls} placeholder="e.g. 500000.00" value={renLTOPrice} onChange={e => setRenLTOPrice(e.target.value)} />
                          </div>
                          <div>
                            <label className={labelCls}>LTO Deposit</label>
                            <Input className={inputCls} placeholder="e.g. 50000.00" value={renLTODeposit} onChange={e => setRenLTODeposit(e.target.value)} />
                          </div>
                          <div>
                            <label className={labelCls}>Total Instalments</label>
                            <Input className={inputCls} placeholder="e.g. 36" value={renLTOInstalments} onChange={e => setRenLTOInstalments(e.target.value)} />
                          </div>
                          <div>
                            <label className={labelCls}>Finance Charge Rate</label>
                            <Input className={inputCls} placeholder="e.g. 0.0600" value={renLTORate} onChange={e => setRenLTORate(e.target.value)} />
                          </div>
                          <div>
                            <label className={labelCls}>Balloon Amount</label>
                            <Input className={inputCls} placeholder="e.g. 10000.00" value={renLTOBalloon} onChange={e => setRenLTOBalloon(e.target.value)} />
                          </div>
                        </div>
                      )}
                      {!renIsLTO && <p className="text-xs text-muted-foreground italic">LTO not applicable for this renewal. Enable above to configure.</p>}
                    </div>

                    {/* Section 4: Notes */}
                    <div className="rounded-xl border border-border bg-card p-6">
                      <label className={labelCls}>Renewal Notes / Justification</label>
                      <Input className={inputCls} placeholder="Reason for renewal, negotiation summary, approval reference…" value={renNotes} onChange={e => setRenNotes(e.target.value)} />
                    </div>

                    {/* Renewal Remeasurement Preview */}
                    {renFetching && <p className="text-sm text-muted-foreground animate-pulse px-1">Calculating renewal remeasurement…</p>}
                    {renPreview?.summary && (
                      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-6 space-y-4">
                        <h4 className="text-sm font-semibold text-emerald-400">Renewal Remeasurement Preview (JE-7)</h4>
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
                        <div>
                          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Journal Entry Preview (JE-7)</h4>
                          <JETable lines={renPreview.jeLines} />
                        </div>
                      </div>
                    )}

                    {/* Post Button */}
                    {posted && txnType === 'Renewal' ? (
                      <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-semibold text-emerald-400">Renewal Posted Successfully</p>
                          <p className="text-xs text-muted-foreground mt-1">JE Reference: <span className="font-mono font-bold">{posted.je_ref}</span></p>
                          <p className="text-xs text-muted-foreground">{posted.je_label}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-3">
                        <Button variant="outline" onClick={() => {
                          setRenPayment(''); setRenExpiry(''); setRenIBR(''); setRenNotes('');
                          setRenCommDate(''); setRenEscalation(''); setRenDeposit('');
                        }}>
                          Reset Fields
                        </Button>
                        <Button
                          onClick={() => setConfirmOpen(true)}
                          disabled={!isPreviewReady || postMut.isPending}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-6"
                        >
                          {postMut.isPending ? 'Posting…' : 'Post Renewal & Generate JE-7'}
                        </Button>
                      </div>
                    )}
                  </TabsContent>

                  {/* ── TRANSACTION HISTORY & GL LEDGER TAB ── */}
                  <TabsContent value="History" className="flex-1 px-6 pb-6 mt-4">
                    <div className="rounded-xl border border-border bg-card p-6">
                      <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-2">
                          <History className="w-4 h-4 text-primary" />
                          <h3 className="text-base font-semibold">Transaction History & GL Ledger</h3>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => utils.lease.getLeaseTransactionHistory.invalidate({ contractId: selectedId! })}>
                          <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Refresh
                        </Button>
                      </div>
                      <TransactionHistoryPanel contractId={selected.contract_id} />
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirm Dialog */}
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
            <AlertDialogAction onClick={handlePost} className={txnType === 'Termination' ? 'bg-red-600 hover:bg-red-700' : txnType === 'Renewal' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-amber-600 hover:bg-amber-700'}>
              Post Transaction
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
