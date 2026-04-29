/**
 * VodaLease Enterprise — Lease Transaction Centre
 * Layout: full-width page, lease selector as top-bar dropdown,
 * all tabs use the entire remaining screen space.
 */
import React, { useState, useMemo, useRef, useEffect, Fragment } from 'react';
import { trpc } from '@/lib/trpc';
import DashboardLayout from '@/components/DashboardLayout';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { LeaseStatPill, LeaseStatDivider, LeaseStatStrip } from "@/components/LeaseStatPill";
import {
  Building2, DollarSign, FileText, RefreshCw, XCircle, History,
  ChevronRight, CheckCircle2, AlertTriangle, Info, Package,
  ChevronDown, Search, X, User, Layers, MapPin, Phone, Mail, CreditCard, Hash,
  GitBranch, Scissors, Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Zap,
} from 'lucide-react';

// ── helpers ──────────────────────────────────────────────────────────────────
const fmt = (n: unknown) =>
  typeof n === 'number' ? n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—';
const fmtDate = (d: unknown) =>
  d ? new Date(d as string).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const today = () => new Date().toISOString().slice(0, 10);

type TxnType = 'Details' | 'Modification' | 'Termination' | 'Renewal' | 'OptionsBreaks';

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
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mb-4">
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

// ── Sub-Asset Status Colour ────────────────────────────────────────────────
const SA_STATUS_CLS: Record<string, string> = {
  Active:     'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  Cancelled:  'bg-red-500/15 text-red-400 border-red-500/30',
  Returned:   'bg-blue-500/15 text-blue-400 border-blue-500/30',
  BackIn:     'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
  Replaced:   'bg-purple-500/15 text-purple-400 border-purple-500/30',
  WriteOff:   'bg-zinc-500/15 text-zinc-400 border-zinc-500/30',
  Condemned:  'bg-orange-500/15 text-orange-400 border-orange-500/30',
};

// ── Lease Details Panel ─────────────────────────────────────────────────────
function LeaseDetailsPanel({ contractId }: { contractId: number }) {
  const utils = trpc.useUtils();
  const { data: lease, isLoading: leaseLoading } = trpc.lease.getLeaseById.useQuery({ contractId });
  const { data: lessee, isLoading: lesseeLoading } = trpc.lease.getLesseeDetails.useQuery({ contractId });
  const { data: subAssets = [], isLoading: subLoading } = trpc.lease.getSubAssetsByContractId.useQuery({ contractId });
  const [showAllGroups, setShowAllGroups] = React.useState(false);
  const [attachOpenForQuery, setAttachOpenForQuery] = React.useState(false);
  const lessorId = lease ? (lease as Record<string, any>).lessor_id as number | undefined : undefined;
  const { data: assetGroups = [], isLoading: groupsLoading } = trpc.asset.getSubAssetGroupsByLessor.useQuery(
    { lessorId: showAllGroups ? undefined : lessorId },
    { enabled: attachOpenForQuery }
  );
  // Expand row state (tags/serials detail)
  const [expandedRow, setExpandedRow] = React.useState<number | null>(null);
  // Transaction log modal state
  const [txnLogTarget, setTxnLogTarget] = React.useState<{ id: number; code: string } | null>(null);
  const { data: txnLog, isLoading: txnLogLoading } = trpc.asset.getSubAssetTxns.useQuery(
    { entityId: txnLogTarget?.id, entityType: 'LEASE_SUB_ASSET', pageSize: 50 },
    { enabled: !!txnLogTarget }
  );
  // Attach modal statee
  const [attachOpen, setAttachOpen] = React.useState(false);
  const [groupSearch, setGroupSearch] = React.useState('');
  const [selectedGroup, setSelectedGroup] = React.useState<{ assetId: number; assetCode: string; setName: string } | null>(null);
  const [attachNotes, setAttachNotes] = React.useState('');

  // Status change modal state
  const [statusOpen, setStatusOpen] = React.useState(false);
  const [statusTarget, setStatusTarget] = React.useState<{ id: number; code: string; current: string } | null>(null);
  const [newStatus, setNewStatus] = React.useState<'Active'|'Cancelled'|'Returned'|'BackIn'|'Replaced'|'WriteOff'|'Condemned'>('Active');
  const [statusReason, setStatusReason] = React.useState('');
  const [statusNotes, setStatusNotes] = React.useState('');

  const attachMut = trpc.asset.attachSubAssetToLease.useMutation({
    onSuccess: () => {
      toast.success('Sub-asset attached successfully');
      utils.lease.getSubAssetsByContractId.invalidate({ contractId });
      setAttachOpen(false);
      setSelectedGroup(null);
      setAttachNotes('');
    },
    onError: (e) => toast.error(e.message),
  });

  const statusMut = trpc.asset.updateSubAssetStatus.useMutation({
    onSuccess: () => {
      toast.success('Sub-asset status updated');
      utils.lease.getSubAssetsByContractId.invalidate({ contractId });
      setStatusOpen(false);
      setStatusTarget(null);
      setStatusReason('');
      setStatusNotes('');
    },
    onError: (e) => toast.error(e.message),
  });

   if (leaseLoading || lesseeLoading) {
    return <div className="flex items-center justify-center h-48 text-muted-foreground text-sm animate-pulse">Loading lease details…</div>;
  }
  if (!lease) return <div className="text-muted-foreground text-sm p-6">No lease data found.</div>;
  const d = lease as Record<string, any>;
  const leaseRef = d.contract_ref as string | undefined;
  let contact = { name: '', email: '', phone: '' };
  try { const c = JSON.parse(d.contact_json || '{}'); contact = { name: c.name || '', email: c.email || '', phone: c.phone || '' }; } catch { /* ignore */ }
  let loc = { address: '', city: '', country: 'QA' };
  try { const l = JSON.parse(d.location_json || '{}'); loc = { address: l.address || '', city: l.city || '', country: l.country || 'QA' }; } catch { /* ignore */ }

  const field = (label: string, value: unknown, icon?: React.ReactNode) => (
    <div className="space-y-0.5">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">{label}</p>
      <div className="flex items-center gap-1.5">
        {icon && <span className="text-muted-foreground">{icon}</span>}
        <p className="text-sm font-medium text-foreground">{value ? String(value) : '—'}</p>
      </div>
    </div>
  );

  const STATUS_COLORS: Record<string, string> = {
    Active: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    Modified: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    Terminated: 'bg-red-500/15 text-red-400 border-red-500/30',
    Draft: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    Renewed: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  };

  return (
    <div className="space-y-5">
      {/* ── LESSOR SECTION ── */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-2 mb-5">
          <Building2 className="w-4 h-4 text-primary" />
          <h3 className="text-base font-semibold">Lessor Details</h3>
        </div>
        <div className="grid grid-cols-4 gap-5">
          {field('Lessor Name', d.lessor_name, <Building2 className="w-3 h-3" />)}
          {field('Lessor Country', d.lessor_country)}
          {field('Tax / Reg No', d.tax_no)}
          {field('Contact Person', contact.name, <User className="w-3 h-3" />)}
          {field('Email', contact.email, <Mail className="w-3 h-3" />)}
          {field('Phone', contact.phone, <Phone className="w-3 h-3" />)}
          {field('Address', loc.address || loc.city, <MapPin className="w-3 h-3" />)}
          {field('Country', loc.country)}
        </div>
      </div>

      {/* ── LESSEE SECTION ── */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-2 mb-5">
          <User className="w-4 h-4 text-blue-400" />
          <h3 className="text-base font-semibold">Lessee Details</h3>
          {!lessee && !lesseeLoading && <span className="text-xs text-muted-foreground ml-2">(No lessee record attached)</span>}
        </div>
        {lessee ? (
          <div className="grid grid-cols-4 gap-5">
            {field('Lessee Type', lessee.lesseeType)}
            {field('Lessee Name', lessee.lesseeName, <User className="w-3 h-3" />)}
            {field('Staff Number', lessee.staffNumber, <Hash className="w-3 h-3" />)}
            {field('Employee ID', lessee.employeeId)}
            {field('Grade', lessee.grade)}
            {field('Position', lessee.position)}
            {field('Department', lessee.department)}
            {field('Place of Work', lessee.placeOfWork, <MapPin className="w-3 h-3" />)}
            {field('Contact Email', lessee.contactEmail, <Mail className="w-3 h-3" />)}
            {field('Contact Phone', lessee.contactPhone, <Phone className="w-3 h-3" />)}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No lessee details on record for this lease.</p>
        )}
      </div>

      {/* ── ASSET SECTION ── */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-2 mb-5">
          <Package className="w-4 h-4 text-amber-400" />
          <h3 className="text-base font-semibold">Asset Details</h3>
        </div>
        <div className="grid grid-cols-4 gap-5 mb-6">
          {field('Asset Type', d.asset_type)}
          {field('Asset Description', d.asset_description)}
          {field('Asset Tag / Code', d.asset_tag, <Hash className="w-3 h-3" />)}
          {field('Location / City', loc.city || loc.address, <MapPin className="w-3 h-3" />)}
          {field('Country', loc.country)}
          {field('Maintenance By', d.maintenance_responsibility)}
          {field('IFRS 16 Classification', d.ifrs16_classification)}
          {field('Status', d.lifecycle_status)}
        </div>

        {/* Sub-Assets Grid */}
        <Separator className="my-5" />
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <p className="text-sm font-semibold">Sub-Assets</p>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">{subAssets.length}</Badge>
            </div>
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5" onClick={() => { setAttachOpen(true); setAttachOpenForQuery(true); }}>
            <Layers className="w-3 h-3" /> Attach Sub-Asset
            </Button>
          </div>

          {subLoading ? (
            <p className="text-xs text-muted-foreground animate-pulse">Loading sub-assets…</p>
          ) : subAssets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 rounded-lg border border-dashed border-border gap-3">
              <Layers className="w-8 h-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No sub-assets attached to this lease yet.</p>
              <Button size="sm" onClick={() => { setAttachOpen(true); setAttachOpenForQuery(true); }} className="gap-1.5">
                <Hash className="w-3.5 h-3.5" /> Attach Sub-Asset
              </Button>
            </div>
          ) : (
            <div className="rounded-lg border border-border overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="w-6 px-2 py-2.5" />
                    <th className="text-left px-3 py-2.5 font-semibold text-muted-foreground">Asset Code</th>
                    <th className="text-left px-3 py-2.5 font-semibold text-muted-foreground">Set Name</th>
                    <th className="text-left px-3 py-2.5 font-semibold text-muted-foreground">Tags / Serials</th>
                    <th className="text-left px-3 py-2.5 font-semibold text-muted-foreground">Status</th>
                    <th className="text-left px-3 py-2.5 font-semibold text-muted-foreground">Status Date</th>
                    <th className="text-left px-3 py-2.5 font-semibold text-muted-foreground">Owner</th>
                    <th className="text-left px-3 py-2.5 font-semibold text-muted-foreground">Notes</th>
                    <th className="text-left px-3 py-2.5 font-semibold text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {subAssets.map((sa) => {
                    const isExpanded = expandedRow === sa.leaseSubAssetId;
                    let parsedTags: Array<{ code?: string; name?: string; category?: string; quantity?: number; serial?: string }> = [];
                    try { parsedTags = JSON.parse(sa.tagsWithSerials || '[]'); } catch { parsedTags = []; }
                    const hasTags = parsedTags.length > 0;
                    return (
                      <Fragment key={sa.leaseSubAssetId}>
                        <tr className="border-t border-border hover:bg-muted/20 transition-colors">
                          <td className="px-2 py-2.5">
                            <button
                              className="w-5 h-5 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
                              onClick={() => setExpandedRow(isExpanded ? null : sa.leaseSubAssetId)}
                              title={hasTags ? (isExpanded ? 'Collapse' : 'Expand tags/serials') : 'No items'}
                              disabled={!hasTags}
                            >
                              {hasTags ? (isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />) : <span className="text-[10px]">—</span>}
                            </button>
                          </td>
                          <td className="px-3 py-2.5 font-mono text-primary font-medium">{sa.assetCode}</td>
                          <td className="px-3 py-2.5 font-medium">{sa.setName}</td>
                          <td className="px-3 py-2.5 text-muted-foreground">
                            {hasTags ? (
                              <button className="underline underline-offset-2 text-primary/80 hover:text-primary" onClick={() => setExpandedRow(isExpanded ? null : sa.leaseSubAssetId)}>
                                {parsedTags.length} item{parsedTags.length !== 1 ? 's' : ''}
                              </button>
                            ) : <span className="text-muted-foreground/50">—</span>}
                          </td>
                          <td className="px-3 py-2.5">
                            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${SA_STATUS_CLS[sa.status] ?? 'bg-muted text-muted-foreground'}`}>{sa.status}</Badge>
                          </td>
                          <td className="px-3 py-2.5 text-muted-foreground">{sa.statusDate ? fmtDate(sa.statusDate) : '—'}</td>
                          <td className="px-3 py-2.5">{sa.owner || '—'}</td>
                          <td className="px-3 py-2.5 text-muted-foreground max-w-[140px] truncate" title={sa.notes || ''}>{sa.notes || '—'}</td>
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-1">
                              <Button size="sm" variant="outline" className="h-6 text-[10px] px-2" onClick={() => {
                                setStatusTarget({ id: sa.leaseSubAssetId, code: sa.assetCode, current: sa.status });
                                setNewStatus(sa.status as typeof newStatus);
                                setStatusReason('');
                                setStatusNotes('');
                                setStatusOpen(true);
                              }}>Status</Button>
                              <Button size="sm" variant="ghost" className="h-6 text-[10px] px-2 text-muted-foreground" onClick={() => setTxnLogTarget({ id: sa.leaseSubAssetId, code: sa.assetCode })}>
                                History
                              </Button>
                            </div>
                          </td>
                        </tr>
                        {isExpanded && hasTags && (
                          <tr className="border-t border-border bg-muted/10">
                            <td colSpan={9} className="px-6 py-3">
                              <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold mb-2">Tags / Serials Detail — {sa.assetCode}</p>
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="text-muted-foreground">
                                    <th className="text-left pr-4 pb-1 font-semibold">Code</th>
                                    <th className="text-left pr-4 pb-1 font-semibold">Name</th>
                                    <th className="text-left pr-4 pb-1 font-semibold">Category</th>
                                    <th className="text-left pr-4 pb-1 font-semibold">Qty</th>
                                    <th className="text-left pb-1 font-semibold">Serial / Tag</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {parsedTags.map((item, idx) => (
                                    <tr key={idx} className="border-t border-border/40">
                                      <td className="pr-4 py-1 font-mono text-primary">{item.code || '—'}</td>
                                      <td className="pr-4 py-1">{item.name || '—'}</td>
                                      <td className="pr-4 py-1 text-muted-foreground">{item.category || '—'}</td>
                                      <td className="pr-4 py-1">{item.quantity ?? '—'}</td>
                                      <td className="py-1 font-mono text-xs text-amber-400">{item.serial || '—'}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── ATTACH SUB-ASSET MODAL ── */}
      <Dialog open={attachOpen} onOpenChange={setAttachOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" /> Attach Sub-Asset to Lease
              </DialogTitle>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">Show:</span>
                <button
                  className={`px-2 py-0.5 rounded text-[11px] border transition-colors ${
                    !showAllGroups ? 'bg-primary/10 border-primary/30 text-primary' : 'border-border text-muted-foreground hover:bg-muted/30'
                  }`}
                  onClick={() => setShowAllGroups(false)}
                >
                  Lessor Only
                </button>
                <button
                  className={`px-2 py-0.5 rounded text-[11px] border transition-colors ${
                    showAllGroups ? 'bg-primary/10 border-primary/30 text-primary' : 'border-border text-muted-foreground hover:bg-muted/30'
                  }`}
                  onClick={() => setShowAllGroups(true)}
                >
                  All Assets
                </button>
              </div>
            </div>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs mb-1.5 block">Search Sub-Asset Groups</Label>
              <Input placeholder="Search by code or name…" value={groupSearch} onChange={e => setGroupSearch(e.target.value)} className="h-8 text-sm" />
            </div>
            <div className="rounded-lg border border-border overflow-hidden max-h-64 overflow-y-auto">
              {groupsLoading ? (
                <p className="text-xs text-muted-foreground p-4 animate-pulse">Loading asset groups…</p>
              ) : (
                <table className="w-full text-xs">
                  <thead className="bg-muted/40 sticky top-0">
                    <tr>
                      <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Select</th>
                      <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Code</th>
                      <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Set Name</th>
                      <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assetGroups
                      .filter(g => !groupSearch || g.assetCode.toLowerCase().includes(groupSearch.toLowerCase()) || g.setName.toLowerCase().includes(groupSearch.toLowerCase()))
                      .map(g => (
                        <tr key={g.assetId} className={`border-t border-border cursor-pointer transition-colors ${
                          selectedGroup?.assetId === g.assetId ? 'bg-primary/10' : 'hover:bg-muted/20'
                        }`} onClick={() => setSelectedGroup({ assetId: g.assetId, assetCode: g.assetCode, setName: g.setName })}>
                          <td className="px-3 py-2">
                            <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                              selectedGroup?.assetId === g.assetId ? 'border-primary bg-primary' : 'border-muted-foreground'
                            }`}>
                              {selectedGroup?.assetId === g.assetId && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </div>
                          </td>
                          <td className="px-3 py-2 font-mono text-primary">{g.assetCode}</td>
                          <td className="px-3 py-2 font-medium">{g.setName}</td>
                          <td className="px-3 py-2 text-muted-foreground truncate max-w-[200px]">{g.description || '—'}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}
            </div>
            {selectedGroup && (
              <div className="rounded-lg bg-primary/5 border border-primary/20 px-4 py-3 text-xs">
                <span className="text-muted-foreground">Selected: </span>
                <span className="font-mono text-primary font-semibold">{selectedGroup.assetCode}</span>
                <span className="text-muted-foreground ml-2">{selectedGroup.setName}</span>
              </div>
            )}
            <div>
              <Label className="text-xs mb-1.5 block">Notes (optional)</Label>
              <Input placeholder="Attach notes…" value={attachNotes} onChange={e => setAttachNotes(e.target.value)} className="h-8 text-sm" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAttachOpen(false)}>Cancel</Button>
            <Button
              disabled={!selectedGroup || !leaseRef || attachMut.isPending}
              onClick={() => {
                if (!selectedGroup || !leaseRef) return;
                attachMut.mutate({
                  leaseId: leaseRef,
                  leaseRef: leaseRef,
                  assetId: selectedGroup.assetId,
                  assetCode: selectedGroup.assetCode,
                  setName: selectedGroup.setName,
                });
              }}
            >
              {attachMut.isPending ? 'Attaching…' : 'Attach Sub-Asset'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── STATUS CHANGE MODAL ── */}
      <Dialog open={statusOpen} onOpenChange={setStatusOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-4 h-4 text-amber-400" />
              Change Status — <span className="font-mono text-primary">{statusTarget?.code}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs mb-1.5 block">New Status *</Label>
              <Select value={newStatus} onValueChange={v => setNewStatus(v as typeof newStatus)}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(['Active','Cancelled','Returned','BackIn','Replaced','WriteOff','Condemned'] as const).map(s => (
                    <SelectItem key={s} value={s}>
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 mr-2 ${SA_STATUS_CLS[s] ?? ''}`}>{s}</Badge>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">Reason</Label>
              <Input placeholder="Reason for status change…" value={statusReason} onChange={e => setStatusReason(e.target.value)} className="h-8 text-sm" />
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">Notes</Label>
              <Input placeholder="Additional notes…" value={statusNotes} onChange={e => setStatusNotes(e.target.value)} className="h-8 text-sm" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusOpen(false)}>Cancel</Button>
            <Button
              disabled={!statusTarget || statusMut.isPending}
              onClick={() => {
                if (!statusTarget) return;
                statusMut.mutate({
                  leaseSubAssetId: statusTarget.id,
                  newStatus,
                  statusDate: new Date().toISOString().slice(0, 10),
                  reason: statusReason || undefined,
                  notes: statusNotes || undefined,
                });
              }}
            >
              {statusMut.isPending ? 'Saving…' : 'Update Status'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── TRANSACTION LOG MODAL ── */}
      <Dialog open={!!txnLogTarget} onOpenChange={(v) => { if (!v) setTxnLogTarget(null); }}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-4 h-4 text-blue-400" />
              Sub-Asset History — <span className="font-mono text-primary">{txnLogTarget?.code}</span>
            </DialogTitle>
          </DialogHeader>
          {txnLogLoading ? (
            <p className="text-sm text-muted-foreground animate-pulse py-6 text-center">Loading history…</p>
          ) : !txnLog || txnLog.rows.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No transaction history found for this sub-asset.</p>
          ) : (
            <div className="rounded-lg border border-border overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="text-left px-3 py-2.5 font-semibold text-muted-foreground">Date</th>
                    <th className="text-left px-3 py-2.5 font-semibold text-muted-foreground">Action</th>
                    <th className="text-left px-3 py-2.5 font-semibold text-muted-foreground">Status / Change</th>
                    <th className="text-left px-3 py-2.5 font-semibold text-muted-foreground">Entity</th>
                    <th className="text-left px-3 py-2.5 font-semibold text-muted-foreground">By</th>
                    <th className="text-left px-3 py-2.5 font-semibold text-muted-foreground">Session Ref</th>
                  </tr>
                </thead>
                <tbody>
                  {txnLog.rows.map((row, idx: number) => (
                    <tr key={idx} className="border-t border-border hover:bg-muted/10">
                      <td className="px-3 py-2.5 text-muted-foreground">{row.changedAt ? fmtDate(row.changedAt) : '—'}</td>
                      <td className="px-3 py-2.5">
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">{row.action}</Badge>
                      </td>
                      <td className="px-3 py-2.5 text-muted-foreground max-w-[200px] truncate" title={row.afterJson || ''}>
                        {row.afterJson ? <span className="font-mono text-[10px]">{row.afterJson.slice(0, 60)}{row.afterJson.length > 60 ? '…' : ''}</span> : '—'}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="font-mono text-primary text-[10px]">{row.entityCode || '—'}</span>
                        {row.entityName && <span className="text-muted-foreground ml-1">{row.entityName}</span>}
                      </td>
                      <td className="px-3 py-2.5">{row.changedBy || '—'}</td>
                      <td className="px-3 py-2.5 text-muted-foreground font-mono text-[10px]">{row.sessionRef || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setTxnLogTarget(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* ── FINANCIAL TERMS SECTION ── */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-2 mb-5">
          <DollarSign className="w-4 h-4 text-emerald-400" />
          <h3 className="text-base font-semibold">Financial Terms</h3>
          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ml-2 ${STATUS_COLORS[d.lifecycle_status] ?? ''}`}>{d.lifecycle_status}</Badge>
        </div>
        <div className="grid grid-cols-4 gap-5">
          {field('Commencement Date', fmtDate(d.commencement_date))}
          {field('Expiry Date', fmtDate(d.expiry_date))}
          {field('Term (Months)', d.term_months)}
          {field('Currency', d.currency)}
          {field('Monthly Payment', d.monthly_payment ? `${d.currency} ${fmt(d.monthly_payment)}` : '—')}
          {field('IBR / Discount Rate', d.ibr ? `${(Number(d.ibr) * 100).toFixed(4)}%` : '—')}
          {field('Escalation Rate', d.escalation_rate ? `${(Number(d.escalation_rate) * 100).toFixed(2)}%` : '—')}
          {field('Security Deposit', d.deposit_amount ? `${d.currency} ${fmt(d.deposit_amount)}` : '—', <CreditCard className="w-3 h-3" />)}
          {field('Current Lease Liability', d.current_liability !== undefined ? `${d.currency} ${fmt(d.current_liability)}` : '—')}
          {field('ROU Asset NBV', d.current_rou_nbv !== undefined ? `${d.currency} ${fmt(d.current_rou_nbv)}` : '—')}
          {field('IFRS 16 Classification', d.ifrs16_classification)}
          {field('Renewal Option', d.renewal_option ? 'Yes' : 'No')}
          {field('Purchase Option', d.purchase_option ? 'Yes' : 'No')}
          {field('Make-Good Obligation', d.make_good_obligation ? 'Yes' : 'No')}
          {field('Initial Direct Costs', d.initial_direct_costs ? `${d.currency} ${fmt(d.initial_direct_costs)}` : '—')}
          {field('Is LTO', d.is_lto ? 'Yes' : 'No')}
          {d.is_lto && field('LTO Purchase Price', d.lto_purchase_price ? `${d.currency} ${fmt(d.lto_purchase_price)}` : '—')}
        </div>
      </div>
    </div>
  );
}

function TransactionHistoryPanel({ contractId }: { contractId: number }) {
  const { data, isLoading } = trpc.lease.getLeaseTransactionHistory.useQuery({ contractId });
  if (isLoading) return <p className="text-sm text-muted-foreground animate-pulse">Loading history…</p>;
  const drafts   = data?.drafts   ?? [];
  const postings = data?.postings ?? [];
  return (
    <div className="space-y-8">
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

// ── Lease Selector Dropdown (top-bar) ─────────────────────────────────────────
type LeaseRow = {
  contract_id: number; contract_ref: string; asset_description: string;
  asset_type: string; commencement_date: Date; expiry_date: Date;
  term_months: number; monthly_payment: number; currency: string;
  ibr: number; lifecycle_status: string; status: string;
  current_liability: number; current_rou_nbv: number;
  last_period_date: Date; remaining_months: number;
  lessor_name: string; pending_drafts: number;
};

function LeaseDropdown({
  leases,
  loading,
  search,
  setSearch,
  selectedId,
  onSelect,
}: {
  leases: LeaseRow[];
  loading: boolean;
  search: string;
  setSearch: (v: string) => void;
  selectedId: number | null;
  onSelect: (l: LeaseRow) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = useMemo(() => leases.find(l => l.contract_id === selectedId) ?? null, [leases, selectedId]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      {/* Trigger button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-3 h-10 px-4 rounded-lg border border-border bg-card hover:bg-muted/40 transition-colors min-w-[380px] max-w-[520px]"
      >
        {selected ? (
          <>
            <span className="font-mono font-bold text-[#e60000] text-sm">{selected.contract_ref}</span>
            <span className="text-sm text-foreground truncate flex-1 text-left">{selected.asset_description}</span>
            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 flex-shrink-0 ${LIFECYCLE_COLORS[selected.lifecycle_status] ?? ''}`}>
              {selected.lifecycle_status}
            </Badge>
          </>
        ) : (
          <>
            <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <span className="text-sm text-muted-foreground flex-1 text-left">Select a lease…</span>
          </>
        )}
        <ChevronDown className={`w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 w-[560px] rounded-xl border border-border bg-card shadow-2xl overflow-hidden">
          {/* Search */}
          <div className="p-3 border-b border-border flex items-center gap-2">
            <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <input
              autoFocus
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              placeholder="Search by ref, description, lessor…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button onClick={() => setSearch('')}><X className="w-3.5 h-3.5 text-muted-foreground" /></button>
            )}
          </div>
          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-border">
            {loading ? (
              <p className="text-xs text-muted-foreground p-4 animate-pulse">Loading leases…</p>
            ) : leases.length === 0 ? (
              <p className="text-xs text-muted-foreground italic p-4">No leases found.</p>
            ) : (
              leases.map(l => (
                <button
                  key={l.contract_id}
                  onClick={() => { onSelect(l); setOpen(false); }}
                  className={`w-full text-left px-4 py-3 hover:bg-muted/40 transition-colors ${selectedId === l.contract_id ? 'bg-[#e60000]/8' : ''}`}
                >
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span className={`text-sm font-mono font-bold ${selectedId === l.contract_id ? 'text-[#e60000]' : 'text-primary'}`}>{l.contract_ref}</span>
                    <div className="flex items-center gap-2">
                      {l.pending_drafts > 0 && (
                        <span className="text-[10px] text-amber-400 flex items-center gap-0.5"><AlertTriangle className="w-2.5 h-2.5" />{l.pending_drafts}</span>
                      )}
                      <Badge variant="outline" className={`text-[9px] px-1.5 py-0 ${LIFECYCLE_COLORS[l.lifecycle_status] ?? ''}`}>{l.lifecycle_status}</Badge>
                    </div>
                  </div>
                  <p className="text-xs text-foreground truncate">{l.asset_description}</p>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-[10px] text-muted-foreground">{l.lessor_name}</span>
                    <span className="text-[10px] text-muted-foreground">Exp {fmtDate(l.expiry_date)}</span>
                    <span className="text-[10px] font-mono text-muted-foreground">{l.currency} {fmt(l.monthly_payment)}/mo</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Options & Breaks Panel ───────────────────────────────────────────────────
const OPTION_TYPE_META: Record<string, { color: string; label: string; ifrs: string; action: string; targetTab: TxnType }> = {
  RENEWAL:     { color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30', label: 'Renewal',     ifrs: 'IFRS 16 §19 — extends lease term; increases liability & ROU if reasonably certain', action: 'Exercise → Renewal (JE-7)',     targetTab: 'Renewal' },
  PURCHASE:    { color: 'text-blue-400 bg-blue-500/10 border-blue-500/30',         label: 'Purchase',    ifrs: 'IFRS 16 §26 — if reasonably certain, include purchase price in lease payments; likely finance lease', action: 'Exercise → Modification (JE-4)', targetTab: 'Modification' },
  TERMINATION: { color: 'text-red-400 bg-red-500/10 border-red-500/30',            label: 'Termination', ifrs: 'IFRS 16 §19 — shortens lease term; reduces liability & ROU if reasonably certain', action: 'Exercise → Termination (JE-5)', targetTab: 'Termination' },
  EXTENSION:   { color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',      label: 'Extension',   ifrs: 'IFRS 16 §45 — treated as lease modification; remeasure liability at new IBR',           action: 'Exercise → Modification (JE-4)', targetTab: 'Modification' },
};
const BREAK_STATUS_CLS: Record<string, string> = {
  ACTIVE:    'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  EXERCISED: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  LAPSED:    'bg-zinc-500/15 text-zinc-400 border-zinc-500/30',
  WAIVED:    'bg-purple-500/15 text-purple-400 border-purple-500/30',
};

function OptionsBreaksPanel({
  contractId,
  onExerciseOption,
  onExerciseBreak,
}: {
  contractId: number;
  onExerciseOption: (tab: TxnType, prefill: Record<string, unknown>) => void;
  onExerciseBreak: (prefill: Record<string, unknown>) => void;
}) {
  const utils = trpc.useUtils();
  const [optOpen, setOptOpen] = React.useState(false);
  const [brkOpen, setBrkOpen] = React.useState(false);
  const [editOpt, setEditOpt] = React.useState<Record<string, unknown> | null>(null);
  const [editBrk, setEditBrk] = React.useState<Record<string, unknown> | null>(null);
  const INIT_OPT: { contract_id: number; option_type: 'RENEWAL' | 'PURCHASE' | 'TERMINATION' | 'EXTENSION'; exercise_deadline: string; notice_period_days: number; new_term_months: number; new_rent: number; purchase_price: number; reasonably_certain: boolean; notes: string } = { contract_id: contractId, option_type: 'RENEWAL', exercise_deadline: '', notice_period_days: 90, new_term_months: 0, new_rent: 0, purchase_price: 0, reasonably_certain: false, notes: '' };
  const INIT_BRK: { contract_id: number; break_date: string; notice_deadline: string; penalty_amount: number; conditions: string; status: 'ACTIVE' | 'EXERCISED' | 'LAPSED' | 'WAIVED' } = { contract_id: contractId, break_date: '', notice_deadline: '', penalty_amount: 0, conditions: '', status: 'ACTIVE' };
  const [optForm, setOptForm] = React.useState({ ...INIT_OPT });
  const [brkForm, setBrkForm] = React.useState({ ...INIT_BRK });

  const { data: options = [], refetch: refetchOpts } = trpc.leaseOptions.list.useQuery({ contractId });
  const { data: breaks = [], refetch: refetchBrks } = trpc.breakClause.list.useQuery();
  const contractBreaks = (breaks as Record<string, unknown>[]).filter((b) => (b as Record<string, unknown>).contract_id === contractId);

  const upsertOpt = trpc.leaseOptions.upsert.useMutation({
    onSuccess: () => { refetchOpts(); setOptOpen(false); toast.success('Option saved'); },
    onError: (e) => toast.error(e.message),
  });
  const exerciseOpt = trpc.leaseOptions.exercise.useMutation({
    onSuccess: () => { refetchOpts(); toast.success('Option marked as exercised'); },
    onError: (e) => toast.error(e.message),
  });
  const upsertBrk = trpc.breakClause.upsert.useMutation({
    onSuccess: () => { refetchBrks(); setBrkOpen(false); toast.success('Break clause saved'); },
    onError: (e) => toast.error(e.message),
  });
  const toggleRC = trpc.leaseOptions.upsert.useMutation({
    onSuccess: () => { refetchOpts(); toast.success('Reasonably certain updated'); },
    onError: (e) => toast.error(e.message),
  });

  function openEditOpt(o: Record<string, unknown>) {
    setEditOpt(o);
    setOptForm({
      contract_id: contractId,
      option_type: (o.option_type as 'RENEWAL' | 'PURCHASE' | 'TERMINATION' | 'EXTENSION') ?? 'RENEWAL',
      exercise_deadline: o.exercise_deadline ? String(o.exercise_deadline).slice(0, 10) : '',
      notice_period_days: Number(o.notice_period_days ?? 90),
      new_term_months: Number(o.new_term_months ?? 0),
      new_rent: Number(o.new_rent ?? 0),
      purchase_price: Number(o.purchase_price ?? 0),
      reasonably_certain: Boolean(o.reasonably_certain),
      notes: String(o.notes ?? ''),
    });
    setOptOpen(true);
  }
  function openEditBrk(b: Record<string, unknown>) {
    setEditBrk(b);
    setBrkForm({
      contract_id: contractId,
      break_date: b.break_date ? String(b.break_date).slice(0, 10) : '',
      notice_deadline: b.notice_deadline ? String(b.notice_deadline).slice(0, 10) : '',
      penalty_amount: Number(b.penalty_amount ?? 0),
      conditions: String(b.conditions ?? ''),
      status: (b.status as 'ACTIVE' | 'EXERCISED' | 'LAPSED' | 'WAIVED') ?? 'ACTIVE',
    });
    setBrkOpen(true);
  }

  const daysUntil = (d: string) => Math.floor((new Date(d).getTime() - Date.now()) / 86400000);
  const urgencyCls = (d: string) => { const days = daysUntil(d); return days < 0 ? 'text-red-500 font-bold' : days < 30 ? 'text-red-400 font-semibold' : days < 90 ? 'text-amber-400 font-semibold' : 'text-muted-foreground'; };

  return (
    <div className="space-y-6">
      {/* ── LEASE OPTIONS ── */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-emerald-400" />
            <h3 className="text-base font-semibold">Lease Options</h3>
            <span className="text-xs text-muted-foreground ml-1">(IFRS 16 §19 — Reasonably Certain Assessment)</span>
          </div>
          <Button size="sm" onClick={() => { setEditOpt(null); setOptForm({ ...INIT_OPT }); setOptOpen(true); }}>
            <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Option
          </Button>
        </div>

        {/* Accounting impact reference */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          {Object.entries(OPTION_TYPE_META).map(([type, meta]) => (
            <div key={type} className={`rounded-lg border p-3 ${meta.color}`}>
              <p className="text-xs font-bold mb-1">{meta.label}</p>
              <p className="text-[10px] leading-relaxed opacity-80">{meta.ifrs}</p>
              <p className="text-[10px] mt-1.5 font-semibold opacity-90">{meta.action}</p>
            </div>
          ))}
        </div>

        {(options as Record<string, unknown>[]).length === 0 ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground italic p-4 border border-dashed border-border rounded-lg">
            <Info className="w-4 h-4" /> No lease options recorded for this lease.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  {['Type','Exercise Deadline','Days Left','Notice (Days)','New Term (Mo)','New Rent','Purchase Price','Reasonably Certain','Status','Notes','Actions'].map(h => (
                    <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(options as Record<string, unknown>[]).map((o, i) => {
                  const meta = OPTION_TYPE_META[String(o.option_type)] ?? OPTION_TYPE_META.RENEWAL;
                  const dl = o.exercise_deadline ? String(o.exercise_deadline) : '';
                  const days = dl ? daysUntil(dl) : null;
                  const isExercised = String(o.status) === 'EXERCISED';
                  return (
                    <tr key={i} className="border-t border-border hover:bg-muted/20">
                      <td className="px-3 py-2.5">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold border ${meta.color}`}>{meta.label}</span>
                      </td>
                      <td className={`px-3 py-2.5 font-mono text-xs ${dl ? urgencyCls(dl) : 'text-muted-foreground'}`}>
                        {dl ? new Date(dl).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                      </td>
                      <td className={`px-3 py-2.5 text-xs ${days !== null ? urgencyCls(dl) : 'text-muted-foreground'}`}>
                        {days !== null ? (days < 0 ? `${Math.abs(days)}d overdue` : `${days}d`) : '—'}
                      </td>
                      <td className="px-3 py-2.5 text-muted-foreground text-xs">{String(o.notice_period_days ?? '—')}</td>
                      <td className="px-3 py-2.5 text-muted-foreground text-xs">{o.new_term_months ? String(o.new_term_months) : '—'}</td>
                      <td className="px-3 py-2.5 font-mono text-xs">{o.new_rent ? Number(o.new_rent).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '—'}</td>
                      <td className="px-3 py-2.5 font-mono text-xs">{o.purchase_price ? Number(o.purchase_price).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '—'}</td>
                      <td className="px-3 py-2.5">
                        <button
                          onClick={() => {
                            if (isExercised) return;
                            toggleRC.mutate({
                              option_id: Number(o.option_id),
                              contract_id: contractId,
                              option_type: o.option_type as 'RENEWAL' | 'PURCHASE' | 'TERMINATION' | 'EXTENSION',
                              exercise_deadline: dl,
                              notice_period_days: Number(o.notice_period_days ?? 90),
                              new_term_months: Number(o.new_term_months ?? 0),
                              new_rent: Number(o.new_rent ?? 0),
                              purchase_price: Number(o.purchase_price ?? 0),
                              reasonably_certain: !Boolean(o.reasonably_certain),
                              notes: String(o.notes ?? ''),
                            });
                          }}
                          disabled={isExercised}
                          className="flex items-center gap-1 disabled:opacity-40"
                          title={isExercised ? 'Already exercised' : 'Toggle reasonably certain'}
                        >
                          {Boolean(o.reasonably_certain)
                            ? <ToggleRight className="w-5 h-5 text-emerald-400" />
                            : <ToggleLeft className="w-5 h-5 text-muted-foreground" />}
                          <span className={`text-xs ${Boolean(o.reasonably_certain) ? 'text-emerald-400 font-semibold' : 'text-muted-foreground'}`}>
                            {Boolean(o.reasonably_certain) ? 'Yes' : 'No'}
                          </span>
                        </button>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                          isExercised ? 'bg-blue-500/15 text-blue-400 border-blue-500/30' : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                        }`}>{String(o.status ?? 'ACTIVE')}</span>
                      </td>
                      <td className="px-3 py-2.5 text-muted-foreground text-xs max-w-[140px] truncate" title={String(o.notes ?? '')}>{String(o.notes ?? '—')}</td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-1.5">
                          <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => openEditOpt(o)} disabled={isExercised}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          {!isExercised && (
                            <Button
                              size="sm"
                              className="h-7 px-2.5 text-xs bg-primary hover:bg-primary/90"
                              onClick={() => {
                                exerciseOpt.mutate({ option_id: Number(o.option_id), exercise_date: today() });
                                onExerciseOption(meta.targetTab, {
                                  payment: o.new_rent ? String(o.new_rent) : '',
                                  newTermMonths: o.new_term_months ? String(o.new_term_months) : '',
                                  purchasePrice: o.purchase_price ? String(o.purchase_price) : '',
                                  notes: `Exercised ${meta.label} option (Option ID: ${o.option_id})`,
                                });
                              }}
                            >
                              <Zap className="w-3 h-3 mr-1" /> Exercise
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── BREAK CLAUSES ── */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Scissors className="w-4 h-4 text-red-400" />
            <h3 className="text-base font-semibold">Break Clauses</h3>
            <span className="text-xs text-muted-foreground ml-1">(IFRS 16 §19 — Termination option; shortens lease term)</span>
          </div>
          <Button size="sm" variant="outline" onClick={() => { setEditBrk(null); setBrkForm({ ...INIT_BRK }); setBrkOpen(true); }}>
            <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Break Clause
          </Button>
        </div>

        {contractBreaks.length === 0 ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground italic p-4 border border-dashed border-border rounded-lg">
            <Info className="w-4 h-4" /> No break clauses recorded for this lease.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  {['Break Date','Notice Deadline','Days to Notice','Penalty Amount','Conditions','Status','Actions'].map(h => (
                    <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {contractBreaks.map((b, i) => {
                  const nd = b.notice_deadline ? String(b.notice_deadline) : '';
                  const days = nd ? daysUntil(nd) : null;
                  const isActive = String(b.status) === 'ACTIVE';
                  return (
                    <tr key={i} className="border-t border-border hover:bg-muted/20">
                      <td className="px-3 py-2.5 font-mono text-xs">{b.break_date ? new Date(String(b.break_date)).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</td>
                      <td className={`px-3 py-2.5 font-mono text-xs ${nd ? urgencyCls(nd) : 'text-muted-foreground'}`}>
                        {nd ? new Date(nd).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                      </td>
                      <td className={`px-3 py-2.5 text-xs ${days !== null ? urgencyCls(nd) : 'text-muted-foreground'}`}>
                        {days !== null ? (days < 0 ? `${Math.abs(days)}d overdue` : `${days}d`) : '—'}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-xs">{b.penalty_amount ? Number(b.penalty_amount).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '—'}</td>
                      <td className="px-3 py-2.5 text-muted-foreground text-xs max-w-[180px] truncate" title={String(b.conditions ?? '')}>{String(b.conditions ?? '—')}</td>
                      <td className="px-3 py-2.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${BREAK_STATUS_CLS[String(b.status)] ?? ''}`}>{String(b.status ?? '—')}</span>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-1.5">
                          <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => openEditBrk(b)} disabled={!isActive}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          {isActive && (
                            <Button
                              size="sm"
                              className="h-7 px-2.5 text-xs bg-red-600 hover:bg-red-700 text-white"
                              onClick={() => {
                                upsertBrk.mutate({ ...brkForm, break_id: Number(b.break_id), contract_id: contractId, break_date: String(b.break_date ?? '').slice(0, 10), notice_deadline: nd.slice(0, 10), penalty_amount: Number(b.penalty_amount ?? 0), conditions: String(b.conditions ?? ''), status: 'EXERCISED' });
                                onExerciseBreak({
                                  date: b.break_date ? String(b.break_date).slice(0, 10) : today(),
                                  notes: `Break clause exercised — penalty: ${b.penalty_amount ?? 0}. Conditions: ${b.conditions ?? ''}`,
                                });
                              }}
                            >
                              <Zap className="w-3 h-3 mr-1" /> Exercise Break
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── OPTION FORM DIALOG ── */}
      <Dialog open={optOpen} onOpenChange={setOptOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-emerald-400" />
              {editOpt ? 'Edit Lease Option' : 'New Lease Option'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium mb-1 block">Option Type *</label>
                <Select value={optForm.option_type} onValueChange={v => setOptForm(f => ({ ...f, option_type: v as typeof f.option_type }))}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['RENEWAL','PURCHASE','TERMINATION','EXTENSION'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">Exercise Deadline *</label>
                <Input type="date" value={optForm.exercise_deadline} onChange={e => setOptForm(f => ({ ...f, exercise_deadline: e.target.value }))} className="h-8 text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">Notice Period (Days)</label>
                <Input type="number" value={optForm.notice_period_days} onChange={e => setOptForm(f => ({ ...f, notice_period_days: Number(e.target.value) }))} className="h-8 text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">New Term (Months)</label>
                <Input type="number" value={optForm.new_term_months} onChange={e => setOptForm(f => ({ ...f, new_term_months: Number(e.target.value) }))} className="h-8 text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">New Rent</label>
                <Input type="number" value={optForm.new_rent} onChange={e => setOptForm(f => ({ ...f, new_rent: Number(e.target.value) }))} className="h-8 text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">Purchase Price</label>
                <Input type="number" value={optForm.purchase_price} onChange={e => setOptForm(f => ({ ...f, purchase_price: Number(e.target.value) }))} className="h-8 text-sm" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setOptForm(f => ({ ...f, reasonably_certain: !f.reasonably_certain }))} className="flex items-center gap-2">
                {optForm.reasonably_certain ? <ToggleRight className="w-6 h-6 text-emerald-400" /> : <ToggleLeft className="w-6 h-6 text-muted-foreground" />}
                <span className={`text-sm ${optForm.reasonably_certain ? 'text-emerald-400 font-semibold' : 'text-muted-foreground'}`}>Reasonably Certain</span>
              </button>
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Notes</label>
              <Input value={optForm.notes} onChange={e => setOptForm(f => ({ ...f, notes: e.target.value }))} placeholder="Notes…" className="h-8 text-sm" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOptOpen(false)}>Cancel</Button>
            <Button
              disabled={!optForm.exercise_deadline || upsertOpt.isPending}
              onClick={() => upsertOpt.mutate({ ...optForm, option_id: editOpt ? Number(editOpt.option_id) : undefined })}
            >
              {upsertOpt.isPending ? 'Saving…' : 'Save Option'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── BREAK CLAUSE FORM DIALOG ── */}
      <Dialog open={brkOpen} onOpenChange={setBrkOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Scissors className="w-4 h-4 text-red-400" />
              {editBrk ? 'Edit Break Clause' : 'New Break Clause'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium mb-1 block">Break Date *</label>
                <Input type="date" value={brkForm.break_date} onChange={e => setBrkForm(f => ({ ...f, break_date: e.target.value }))} className="h-8 text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">Notice Deadline *</label>
                <Input type="date" value={brkForm.notice_deadline} onChange={e => setBrkForm(f => ({ ...f, notice_deadline: e.target.value }))} className="h-8 text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">Penalty Amount</label>
                <Input type="number" value={brkForm.penalty_amount} onChange={e => setBrkForm(f => ({ ...f, penalty_amount: Number(e.target.value) }))} className="h-8 text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">Status</label>
                <Select value={brkForm.status} onValueChange={v => setBrkForm(f => ({ ...f, status: v as typeof f.status }))}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['ACTIVE','EXERCISED','LAPSED','WAIVED'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Conditions</label>
              <Input value={brkForm.conditions} onChange={e => setBrkForm(f => ({ ...f, conditions: e.target.value }))} placeholder="Conditions for exercising break…" className="h-8 text-sm" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBrkOpen(false)}>Cancel</Button>
            <Button
              disabled={!brkForm.break_date || !brkForm.notice_deadline || upsertBrk.isPending}
              onClick={() => upsertBrk.mutate({ ...brkForm, break_id: editBrk ? Number(editBrk.break_id) : undefined })}
            >
              {upsertBrk.isPending ? 'Saving…' : 'Save Break Clause'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function LeaseTransactionCentre() {
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [txnType, setTxnType] = useState<TxnType>('Details');
  const handleExerciseOption = (tab: TxnType, prefill: Record<string, unknown>) => {
    if (tab === 'Renewal') {
      if (prefill.payment) setRenPayment(String(prefill.payment));
      if (prefill.notes) setRenNotes(String(prefill.notes));
    } else if (tab === 'Modification') {
      if (prefill.payment) setModPayment(String(prefill.payment));
      if (prefill.notes) setModNotes(String(prefill.notes));
    }
    setTxnType(tab);
    toast.info(`Switched to ${tab} tab — fields pre-filled from option`);
  };
  const handleExerciseBreak = (prefill: Record<string, unknown>) => {
    if (prefill.date) setTrmDate(String(prefill.date));
    if (prefill.notes) setTrmNotes(String(prefill.notes));
    setTxnType('Termination');
    toast.info('Switched to Termination tab — fields pre-filled from break clause');
  };
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

  const { data: leases = [], isLoading: leasesLoading, refetch: refetchLeases } =
    trpc.lease.getLeasesForTransaction.useQuery({ search: search || undefined });
  const selected = useMemo(() => leases.find(l => l.contract_id === selectedId) ?? null, [leases, selectedId]);

  const handleSelectLease = (l: typeof leases[0]) => {
    setSelectedId(l.contract_id);
    setPosted(null);
    setRenPayment(l.monthly_payment ? String(l.monthly_payment) : '');
    setRenCurrency(l.currency || 'QAR');
    setRenAssetType(l.asset_type || '');
    setRenAssetDesc(l.asset_description || '');
  };

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
    const base = { contractId: selectedId, transactionType: txnType as 'Modification' | 'Termination' | 'Renewal', effectiveDate: '' };
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
      <div className="flex flex-col h-full overflow-hidden">

        {/* ══ TOP BAR ══════════════════════════════════════════════════════════ */}
        <div className="flex-shrink-0 px-6 py-3 border-b border-border bg-card flex items-center gap-4 flex-wrap">
          {/* Screen title */}
          <div className="flex items-center gap-3 mr-2">
            <ScreenHeader
              screenId="VFLTXNCTR0001P001"
              title="Lease Transaction Centre"
              subtitle="IFRS 16 — Modification (JE-4) · Termination (JE-5) · Renewal (JE-7)"
            />
          </div>

          {/* Lease selector dropdown */}
          <LeaseDropdown
            leases={leases}
            loading={leasesLoading}
            search={search}
            setSearch={setSearch}
            selectedId={selectedId}
            onSelect={handleSelectLease}
          />

          {/* Selected lease KPI strip */}
          {selected && (
            <LeaseStatStrip className="ml-2">
              <LeaseStatDivider />
              <LeaseStatPill
                label="Payment"
                badge={selected.currency}
                value={fmt(selected.monthly_payment)}
              />
              <LeaseStatPill
                label="Expiry"
                value={fmtDate(selected.expiry_date)}
                mono={false}
              />
              <LeaseStatPill
                label="IBR"
                value={selected.ibr ? `${(Number(selected.ibr) * 100).toFixed(4)}%` : '—'}
                color="amber"
              />
              <LeaseStatDivider />
              <LeaseStatPill
                label="Liability"
                value={fmt(selected.current_liability)}
                color="blue"
              />
              <LeaseStatPill
                label="ROU NBV"
                value={fmt(selected.current_rou_nbv)}
                color="emerald"
              />
            </LeaseStatStrip>
          )}
        </div>

        {/* ══ CONTENT AREA ═════════════════════════════════════════════════════ */}
        {!selected ? (
          /* Empty state */
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-muted-foreground">
            <div className="w-20 h-20 rounded-full bg-muted/20 flex items-center justify-center">
              <FileText className="w-10 h-10 text-muted-foreground/40" />
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold">No lease selected</p>
              <p className="text-sm mt-1 max-w-sm">Use the lease dropdown above to select a lease and post a Modification, Termination, or Renewal transaction.</p>
            </div>
          </div>
        ) : (
          /* Full-width tabs */
          <div className="flex-1 overflow-hidden flex flex-col">
            <Tabs
              value={txnType}
              onValueChange={v => { setTxnType(v as TxnType); setPosted(null); }}
              className="flex-1 flex flex-col overflow-hidden"
            >
              {/* Tab bar */}
              <div className="flex-shrink-0 px-6 pt-4 border-b border-border">
                <TabsList className="grid grid-cols-6 w-full">
                  <TabsTrigger value="Details" className="flex items-center gap-2 text-sm py-2.5">
                    <FileText className="w-4 h-4" /> Lease Details
                  </TabsTrigger>
                  <TabsTrigger value="Modification" className="flex items-center gap-2 text-sm py-2.5">
                    <RefreshCw className="w-4 h-4" /> Modification (JE-4)
                  </TabsTrigger>
                  <TabsTrigger value="Termination" className="flex items-center gap-2 text-sm py-2.5">
                    <XCircle className="w-4 h-4" /> Termination (JE-5)
                  </TabsTrigger>
                  <TabsTrigger value="Renewal" className="flex items-center gap-2 text-sm py-2.5">
                    <ChevronRight className="w-4 h-4" /> Renewal (JE-7)
                  </TabsTrigger>
                  <TabsTrigger value="OptionsBreaks" className="flex items-center gap-2 text-sm py-2.5">
                    <GitBranch className="w-4 h-4" /> Options & Breaks
                  </TabsTrigger>
                  <TabsTrigger value="History" className="flex items-center gap-2 text-sm py-2.5">
                    <History className="w-4 h-4" /> Txn History & GL
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* ── LEASE DETAILS TAB ── */}
              <TabsContent value="Details" className="flex-1 overflow-y-auto px-6 py-6">
                <LeaseDetailsPanel contractId={selected.contract_id} />
              </TabsContent>
              {/* ── MODIFICATION TAB ── */}
              <TabsContent value="Modification" className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                <div className="rounded-xl border border-border bg-card p-6">
                  <div className="flex items-center gap-2 mb-5">
                    <RefreshCw className="w-4 h-4 text-amber-400" />
                    <h3 className="text-base font-semibold">Modification Terms</h3>
                    <span className="text-xs text-muted-foreground ml-1">(IFRS 16 Para 45)</span>
                  </div>
                  <div className="grid grid-cols-4 gap-5">
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
                    <div>
                      <label className={labelCls}>Notes</label>
                      <Input className={inputCls} placeholder="Reason for modification…" value={modNotes} onChange={e => setModNotes(e.target.value)} />
                    </div>
                  </div>
                </div>

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
                    <Button onClick={() => setConfirmOpen(true)} disabled={!isPreviewReady || postMut.isPending} className="bg-amber-600 hover:bg-amber-700 text-white px-8 py-2.5 text-sm">
                      {postMut.isPending ? 'Posting…' : 'Post Modification & Generate JE-4'}
                    </Button>
                  </div>
                )}
              </TabsContent>

              {/* ── TERMINATION TAB ── */}
              <TabsContent value="Termination" className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
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
                  <div className="grid grid-cols-4 gap-5">
                    <div>
                      <label className={labelCls}>Termination Date *</label>
                      <Input type="date" className={inputCls} value={trmDate} onChange={e => setTrmDate(e.target.value)} />
                    </div>
                    <div className="col-span-3">
                      <label className={labelCls}>Notes / Reason</label>
                      <Input className={inputCls} placeholder="Reason for termination…" value={trmNotes} onChange={e => setTrmNotes(e.target.value)} />
                    </div>
                  </div>
                </div>

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
                    <Button onClick={() => setConfirmOpen(true)} disabled={!isPreviewReady || postMut.isPending} className="bg-red-600 hover:bg-red-700 text-white px-8 py-2.5 text-sm">
                      {postMut.isPending ? 'Posting…' : 'Post Termination & Generate JE-5'}
                    </Button>
                  </div>
                )}
              </TabsContent>

              {/* ── RENEWAL TAB ── */}
              <TabsContent value="Renewal" className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                {/* Asset Details */}
                <div className="rounded-xl border border-border bg-card p-6">
                  <div className="flex items-center gap-2 mb-5">
                    <Building2 className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-base font-semibold">Asset Details</h3>
                  </div>
                  <div className="grid grid-cols-4 gap-5">
                    <div>
                      <label className={labelCls}>Asset Type</label>
                      <Select value={renAssetType} onValueChange={setRenAssetType}>
                        <SelectTrigger className={inputCls}><SelectValue placeholder="Select type" /></SelectTrigger>
                        <SelectContent>{ASSET_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
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

                {/* Financial Terms */}
                <div className="rounded-xl border border-border bg-card p-6">
                  <div className="flex items-center gap-2 mb-5">
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-base font-semibold">Financial Terms</h3>
                    <span className="text-xs text-muted-foreground ml-1">(IFRS 16 Para 46 — Renewal)</span>
                  </div>
                  <div className="grid grid-cols-4 gap-5">
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
                        <SelectContent>{CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
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
                    <div className="flex items-center gap-6 pt-5">
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

                {/* LTO Terms */}
                <div className="rounded-xl border border-border bg-card p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Package className="w-4 h-4 text-blue-400" />
                    <h3 className="text-base font-semibold">Lease-to-Own (LTO) Terms</h3>
                    <div className="flex items-center gap-2 ml-auto">
                      <Checkbox id="ren-lto" checked={renIsLTO} onCheckedChange={v => setRenIsLTO(!!v)} />
                      <label htmlFor="ren-lto" className="text-xs cursor-pointer">Enable LTO for this renewal</label>
                    </div>
                  </div>
                  {renIsLTO ? (
                    <div className="grid grid-cols-4 gap-5">
                      <div><label className={labelCls}>Purchase Price</label><Input className={inputCls} placeholder="e.g. 500000.00" value={renLTOPrice} onChange={e => setRenLTOPrice(e.target.value)} /></div>
                      <div><label className={labelCls}>LTO Deposit</label><Input className={inputCls} placeholder="e.g. 50000.00" value={renLTODeposit} onChange={e => setRenLTODeposit(e.target.value)} /></div>
                      <div><label className={labelCls}>Total Instalments</label><Input className={inputCls} placeholder="e.g. 36" value={renLTOInstalments} onChange={e => setRenLTOInstalments(e.target.value)} /></div>
                      <div><label className={labelCls}>Finance Charge Rate</label><Input className={inputCls} placeholder="e.g. 0.0600" value={renLTORate} onChange={e => setRenLTORate(e.target.value)} /></div>
                      <div><label className={labelCls}>Balloon Amount</label><Input className={inputCls} placeholder="e.g. 10000.00" value={renLTOBalloon} onChange={e => setRenLTOBalloon(e.target.value)} /></div>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">LTO not applicable for this renewal. Enable above to configure.</p>
                  )}
                </div>

                {/* Notes */}
                <div className="rounded-xl border border-border bg-card p-6">
                  <label className={labelCls}>Renewal Notes / Justification</label>
                  <Input className={inputCls} placeholder="Reason for renewal, negotiation summary, approval reference…" value={renNotes} onChange={e => setRenNotes(e.target.value)} />
                </div>

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
                    <Button onClick={() => setConfirmOpen(true)} disabled={!isPreviewReady || postMut.isPending} className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-2.5 text-sm">
                      {postMut.isPending ? 'Posting…' : 'Post Renewal & Generate JE-7'}
                    </Button>
                  </div>
                )}
              </TabsContent>

              {/* ── OPTIONS & BREAKS TAB ── */}
              <TabsContent value="OptionsBreaks" className="flex-1 overflow-y-auto px-6 py-6">
                <OptionsBreaksPanel
                  contractId={selected.contract_id}
                  onExerciseOption={handleExerciseOption}
                  onExerciseBreak={handleExerciseBreak}
                />
              </TabsContent>

              {/* ── TRANSACTION HISTORY & GL LEDGER TAB ── */}
              <TabsContent value="History" className="flex-1 overflow-y-auto px-6 py-6">
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
        )}
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
            <AlertDialogAction
              onClick={handlePost}
              className={txnType === 'Termination' ? 'bg-red-600 hover:bg-red-700' : txnType === 'Renewal' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-amber-600 hover:bg-amber-700'}
            >
              Post Transaction
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
