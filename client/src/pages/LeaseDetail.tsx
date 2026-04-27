/**
 * VodaLease Enterprise — Lease Detail View
 * Full read-only view of a single lease contract with tabs:
 * Overview | Lessee | Asset | Financial Terms | Amortisation | Transaction History | Documents
 */
import { useState } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import DashboardLayout from '@/components/DashboardLayout';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  Building2, DollarSign, FileText, User, Package, History,
  Edit, ArrowLeft, RefreshCw, Calendar, MapPin, Phone, Mail,
  IdCard, Briefcase, BarChart2, Info, CheckCircle2,
} from 'lucide-react';

// ── helpers ──────────────────────────────────────────────────────────────────
const fmt = (n: unknown) =>
  typeof n === 'number' ? n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : String(n ?? '—');
const fmtDate = (d: unknown) =>
  d ? new Date(d as string).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtPct = (v: unknown) =>
  v ? `${(Number(v) * 100).toFixed(4)}%` : '—';

const LIFECYCLE_COLORS: Record<string, string> = {
  Active:   'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  Modified: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  Draft:    'bg-slate-500/15 text-slate-400 border-slate-500/30',
  Closed:   'bg-red-500/15 text-red-400 border-red-500/30',
  Pending:  'bg-blue-500/15 text-blue-400 border-blue-500/30',
};

// ── Field display helpers ─────────────────────────────────────────────────────
function Field({ label, value, mono = false, highlight = false }: {
  label: string; value: string | undefined | null; mono?: boolean; highlight?: boolean;
}) {
  return (
    <div className="space-y-0.5">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className={`text-sm ${mono ? 'font-mono' : ''} ${highlight ? 'text-amber-400 font-semibold' : 'text-foreground'} ${!value || value === '—' ? 'text-muted-foreground italic' : ''}`}>
        {value || '—'}
      </p>
    </div>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      <Separator />
      {children}
    </div>
  );
}

function FieldGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-4">{children}</div>;
}

// ── Amortisation mini-table ───────────────────────────────────────────────────
function AmortisationTab({ contractId }: { contractId: number }) {
  const { data, isLoading } = trpc.lease.getAmortisationSchedule.useQuery({ contractId });
  if (isLoading) return <p className="text-sm text-muted-foreground animate-pulse p-4">Loading schedule…</p>;
  const schedule = (data?.schedule ?? []) as Array<Record<string, unknown>>;
  if (!schedule.length) return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground italic p-4 border border-dashed border-border rounded-lg">
      <Info className="w-4 h-4" /> No amortisation schedule generated yet.
    </div>
  );
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-xs">
        <thead className="bg-muted/50">
          <tr>
            {['Period','Date','Opening Liability','Interest','Payment','Principal','Closing Liability','ROU NBV','Depreciation'].map(h => (
              <th key={h} className="px-3 py-2 text-right first:text-left text-muted-foreground font-semibold">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {schedule.map((r, i) => (
            <tr key={i} className="border-t border-border hover:bg-muted/20">
              <td className="px-3 py-2 text-left">{String(r.period_no ?? i + 1)}</td>
              <td className="px-3 py-2 text-right">{fmtDate(r.period_date)}</td>
              <td className="px-3 py-2 text-right font-mono">{fmt(r.opening_liability)}</td>
              <td className="px-3 py-2 text-right font-mono">{fmt(r.interest_expense)}</td>
              <td className="px-3 py-2 text-right font-mono">{fmt(r.payment)}</td>
              <td className="px-3 py-2 text-right font-mono">{fmt(r.principal)}</td>
              <td className="px-3 py-2 text-right font-mono">{fmt(r.closing_liability)}</td>
              <td className="px-3 py-2 text-right font-mono">{fmt(r.rou_nbv)}</td>
              <td className="px-3 py-2 text-right font-mono">{fmt(r.depreciation)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Transaction History tab ───────────────────────────────────────────────────
function TxnHistoryTab({ contractId }: { contractId: number }) {
  const { data, isLoading } = trpc.lease.getLeaseTransactionHistory.useQuery({ contractId });
  if (isLoading) return <p className="text-sm text-muted-foreground animate-pulse p-4">Loading history…</p>;
  const drafts   = data?.drafts   ?? [];
  const postings = data?.postings ?? [];
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><History className="w-4 h-4 text-primary" />Transaction Log</h3>
        {drafts.length === 0 ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground italic p-4 border border-dashed border-border rounded-lg">
            <Info className="w-4 h-4" /> No transactions posted yet.
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
                {drafts.map((d: any, i: number) => (
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
                {postings.map((p: any, i: number) => (
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
export default function LeaseDetail() {
  const [, setLocation] = useLocation();

  const contractId = (() => {
    const params = new URLSearchParams(window.location.search);
    const v = params.get('id') || params.get('view');
    return v ? parseInt(v, 10) : null;
  })();

  const { data: lease, isLoading } = trpc.lease.getLeaseById.useQuery(
    { contractId: contractId! },
    { enabled: !!contractId }
  );
  const { data: lesseeData } = trpc.lease.getLesseeDetails.useQuery(
    { contractId: contractId! },
    { enabled: !!contractId }
  );

  if (!contractId) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-64 gap-4 text-muted-foreground">
          <Info className="w-10 h-10" />
          <p>No contract ID provided. Please navigate from the Lease Register.</p>
          <Button variant="outline" onClick={() => setLocation('/leases')}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Lease Register
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-6 space-y-4">
          <div className="h-8 w-64 bg-muted/40 rounded animate-pulse" />
          <div className="h-24 bg-muted/30 rounded-xl animate-pulse" />
          <div className="h-64 bg-muted/20 rounded-xl animate-pulse" />
        </div>
      </DashboardLayout>
    );
  }

  if (!lease) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-64 gap-4 text-muted-foreground">
          <Info className="w-10 h-10" />
          <p>Lease contract not found.</p>
          <Button variant="outline" onClick={() => setLocation('/leases')}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Lease Register
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const d = lease as Record<string, any>;
  const ld = lesseeData as Record<string, any> | null;

  // Parse JSON fields
  let contactPerson = '', contactEmail = '', contactPhone = '';
  try { const c = JSON.parse(d.contact_json || '{}'); contactPerson = c.name || ''; contactEmail = c.email || ''; contactPhone = c.phone || ''; } catch { /* ignore */ }
  let locCity = '', locCountry = '', locAddress = '';
  try { const loc = JSON.parse(d.location_json || '{}'); locCity = loc.city || ''; locCountry = loc.country || ''; locAddress = loc.address || ''; } catch { /* ignore */ }

  const lifecycleStatus = String(d.lifecycle_status ?? 'Draft');

  return (
    <DashboardLayout>
      <div className="flex flex-col h-[calc(100vh-0px)] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border bg-card/50 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => setLocation('/leases')} className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="w-4 h-4 mr-1" /> Back
              </Button>
              <Separator orientation="vertical" className="h-5" />
              <ScreenHeader
                screenId="VFLSECLSDET0001P001"
                title={`Lease Detail — ${d.contract_ref ?? ''}`}
                subtitle="Full read-only view of lease contract"
              />
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={`text-xs ${LIFECYCLE_COLORS[lifecycleStatus] ?? ''}`}>
                {lifecycleStatus}
              </Badge>
              <Button
                size="sm"
                onClick={() => setLocation(`/leases/new?edit=${contractId}`)}
                className="bg-[#e60000] hover:bg-[#cc0000] text-white"
              >
                <Edit className="w-3.5 h-3.5 mr-1.5" /> Modify Lease
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setLocation(`/leases/transaction-centre`)}
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Transaction Centre
              </Button>
            </div>
          </div>

          {/* Contract Summary Bar */}
          <div className="grid grid-cols-6 gap-4 mt-3 p-3 rounded-lg bg-muted/30 border border-border">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Contract Ref</p>
              <p className="text-sm font-mono font-bold text-[#e60000]">{d.contract_ref ?? '—'}</p>
            </div>
            <div className="col-span-2">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Asset</p>
              <p className="text-sm font-medium truncate">{d.asset_description ?? '—'}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Lessor</p>
              <p className="text-sm truncate">{d.lessor_name ?? '—'}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Expiry</p>
              <p className="text-sm">{fmtDate(d.expiry_date)}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Monthly Payment</p>
              <p className="text-sm font-mono font-bold">{d.currency} {fmt(d.monthly_payment)}</p>
            </div>
          </div>

          {/* KPI strip */}
          <div className="grid grid-cols-5 gap-3 mt-2">
            {[
              { label: 'Lease Liability', value: `${d.currency ?? ''} ${fmt(d.current_liability)}`, highlight: true },
              { label: 'ROU Asset NBV',   value: `${d.currency ?? ''} ${fmt(d.current_rou_nbv)}`, highlight: true },
              { label: 'IBR',             value: fmtPct(d.ibr) },
              { label: 'Term (months)',   value: String(d.term_months ?? '—') },
              { label: 'Commencement',    value: fmtDate(d.commencement_date) },
            ].map((k, i) => (
              <div key={i} className={`p-2.5 rounded-lg border ${k.highlight ? 'border-amber-500/30 bg-amber-500/5' : 'border-border bg-muted/20'}`}>
                <p className="text-[10px] text-muted-foreground">{k.label}</p>
                <p className={`text-sm font-mono font-semibold ${k.highlight ? 'text-amber-400' : 'text-foreground'}`}>{k.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex-1 overflow-y-auto">
          <Tabs defaultValue="overview" className="h-full">
            <div className="px-6 pt-4 border-b border-border">
              <TabsList className="grid grid-cols-7 w-full max-w-4xl">
                <TabsTrigger value="overview"     className="flex items-center gap-1 text-xs"><FileText className="w-3 h-3" /> Overview</TabsTrigger>
                <TabsTrigger value="lessee"       className="flex items-center gap-1 text-xs"><User className="w-3 h-3" /> Lessee</TabsTrigger>
                <TabsTrigger value="asset"        className="flex items-center gap-1 text-xs"><Building2 className="w-3 h-3" /> Asset</TabsTrigger>
                <TabsTrigger value="financial"    className="flex items-center gap-1 text-xs"><DollarSign className="w-3 h-3" /> Financial</TabsTrigger>
                <TabsTrigger value="lto"          className="flex items-center gap-1 text-xs"><Package className="w-3 h-3" /> LTO</TabsTrigger>
                <TabsTrigger value="amortisation" className="flex items-center gap-1 text-xs"><BarChart2 className="w-3 h-3" /> Amortisation</TabsTrigger>
                <TabsTrigger value="history"      className="flex items-center gap-1 text-xs"><History className="w-3 h-3" /> Txn History</TabsTrigger>
              </TabsList>
            </div>

            {/* ── OVERVIEW ── */}
            <TabsContent value="overview" className="px-6 py-5 space-y-5">
              <Section title="Lessor Information" icon={Building2}>
                <FieldGrid>
                  <Field label="Lessor Name" value={d.lessor_name} />
                  <Field label="Contact Person" value={contactPerson} />
                  <Field label="Email" value={contactEmail} />
                  <Field label="Phone" value={contactPhone} />
                  <Field label="Country" value={d.lessor_country} />
                  <Field label="Tax / VAT ID" value={d.tax_no} />
                  <Field label="Contract Ref" value={d.contract_ref} mono />
                  <Field label="Created Date" value={fmtDate(d.created_at)} />
                </FieldGrid>
              </Section>
              <Section title="Contract Status" icon={CheckCircle2}>
                <FieldGrid>
                  <Field label="Lifecycle Status" value={lifecycleStatus} />
                  <Field label="Approval Status" value={String(d.approval_status ?? '—')} />
                  <Field label="Submitted By" value={String(d.submitted_by ?? '—')} />
                  <Field label="Approved By" value={String(d.approved_by ?? '—')} />
                  <Field label="Approved At" value={fmtDate(d.approved_at)} />
                  <Field label="IFRS 16 Classification" value={String(d.classification ?? '—')} />
                </FieldGrid>
              </Section>
            </TabsContent>

            {/* ── LESSEE ── */}
            <TabsContent value="lessee" className="px-6 py-5 space-y-5">
              {!ld ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground italic p-6 border border-dashed border-border rounded-xl">
                  <User className="w-5 h-5" />
                  <div>
                    <p className="font-medium">No lessee details recorded</p>
                    <p className="text-xs mt-0.5">Lessee details were not entered when this lease was created. Use Modify Lease to add them.</p>
                  </div>
                </div>
              ) : (
                <Section title="Lessee Details" icon={User}>
                  <FieldGrid>
                    <Field label="Lessee Type" value={ld.lesseeType} />
                    <Field label="Full Name" value={ld.lesseeName} />
                    <Field label="Staff Number" value={ld.staffNumber} />
                    <Field label="Employee ID" value={ld.employeeId} />
                    <Field label="Grade / Band" value={ld.grade} />
                    <Field label="Position / Title" value={ld.position} />
                    <Field label="Department" value={ld.department} />
                    <Field label="Place of Work" value={ld.placeOfWork} />
                    <Field label="Contact Email" value={ld.contactEmail} />
                    <Field label="Contact Phone" value={ld.contactPhone} />
                  </FieldGrid>
                </Section>
              )}
            </TabsContent>

            {/* ── ASSET ── */}
            <TabsContent value="asset" className="px-6 py-5 space-y-5">
              <Section title="Asset Details" icon={Building2}>
                <FieldGrid>
                  <Field label="Asset Type" value={d.asset_type} />
                  <Field label="Description" value={d.asset_description} />
                  <Field label="Asset Tag / Code" value={d.asset_tag} mono />
                  <Field label="Location / City" value={locCity || locAddress} />
                  <Field label="Country" value={locCountry} />
                  <Field label="Maintenance By" value={d.maintenance_responsibility} />
                  <Field label="IFRS 16 Classification" value={d.classification} />
                </FieldGrid>
              </Section>
            </TabsContent>

            {/* ── FINANCIAL TERMS ── */}
            <TabsContent value="financial" className="px-6 py-5 space-y-5">
              <Section title="Financial Terms" icon={DollarSign}>
                <FieldGrid>
                  <Field label="Commencement Date" value={fmtDate(d.commencement_date)} />
                  <Field label="Expiry Date" value={fmtDate(d.expiry_date)} />
                  <Field label="Term (months)" value={String(d.term_months ?? '—')} mono />
                  <Field label="Currency" value={d.currency} />
                  <Field label="Monthly Payment" value={`${d.currency} ${fmt(d.monthly_payment)}`} mono highlight />
                  <Field label="Payment Frequency" value="Monthly" />
                  <Field label="Escalation Rate" value={d.escalation_rate ? `${(Number(d.escalation_rate) * 100).toFixed(2)}%` : '—'} />
                  <Field label="IBR / Discount Rate" value={fmtPct(d.ibr)} />
                  <Field label="Security Deposit" value={d.deposit_amount ? `${d.currency} ${fmt(d.deposit_amount)}` : '—'} mono />
                  <Field label="Current Lease Liability" value={`${d.currency} ${fmt(d.current_liability)}`} mono highlight />
                  <Field label="Current ROU NBV" value={`${d.currency} ${fmt(d.current_rou_nbv)}`} mono highlight />
                  <Field label="Renewal Option" value={d.renewal_option ? 'Yes' : 'No'} />
                  <Field label="Purchase Option" value={d.purchase_option ? 'Yes' : 'No'} />
                </FieldGrid>
              </Section>
            </TabsContent>

            {/* ── LTO ── */}
            <TabsContent value="lto" className="px-6 py-5 space-y-5">
              {!d.is_lto ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground italic p-6 border border-dashed border-border rounded-xl">
                  <Package className="w-5 h-5" />
                  <div>
                    <p className="font-medium">No LTO terms configured</p>
                    <p className="text-xs mt-0.5">This lease does not have Lease-to-Own terms. LTO can be added via Modify Lease.</p>
                  </div>
                </div>
              ) : (
                <Section title="Lease-to-Own (LTO) Terms" icon={Package}>
                  <FieldGrid>
                    <Field label="Purchase Price" value={d.lto_purchase_price ? `${d.currency} ${fmt(d.lto_purchase_price)}` : '—'} mono highlight />
                    <Field label="LTO Deposit" value={d.lto_deposit ? `${d.currency} ${fmt(d.lto_deposit)}` : '—'} mono />
                    <Field label="Total Instalments" value={String(d.lto_total_instalments ?? '—')} mono />
                    <Field label="Finance Charge Rate" value={fmtPct(d.lto_finance_charge_rate)} />
                    <Field label="Balloon Amount" value={d.lto_balloon_amount ? `${d.currency} ${fmt(d.lto_balloon_amount)}` : '—'} mono />
                  </FieldGrid>
                </Section>
              )}
            </TabsContent>

            {/* ── AMORTISATION ── */}
            <TabsContent value="amortisation" className="px-6 py-5 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold flex items-center gap-2"><BarChart2 className="w-4 h-4 text-primary" />Amortisation Schedule</h3>
                <Button size="sm" variant="outline" onClick={() => setLocation('/leases/amortisation')}>
                  <BarChart2 className="w-3.5 h-3.5 mr-1.5" /> Full Amortisation View
                </Button>
              </div>
              <AmortisationTab contractId={contractId} />
            </TabsContent>

            {/* ── TRANSACTION HISTORY ── */}
            <TabsContent value="history" className="px-6 py-5 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold flex items-center gap-2"><History className="w-4 h-4 text-primary" />Transaction History & GL Ledger</h3>
                <Button size="sm" variant="outline" onClick={() => setLocation('/leases/transaction-centre')}>
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Post New Transaction
                </Button>
              </div>
              <TxnHistoryTab contractId={contractId} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </DashboardLayout>
  );
}
