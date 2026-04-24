import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import {
  BookOpen, CheckCircle2, AlertTriangle, XCircle, Clock, RefreshCw,
  Plus, Search, Filter, ChevronDown, Eye, Ban, RotateCcw,
  CreditCard, Building2, Users, FileText, TrendingDown, Sun, Moon,
  ArrowRight, Printer, Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScreenHeader } from "@/components/ScreenHeader";

// ── Theme ─────────────────────────────────────────────────────
type Theme = "dark" | "light";

// ── Status Badge ──────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  Issued:    "bg-blue-500/20 text-blue-300 border-blue-500/30",
  Presented: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  Cleared:   "bg-green-500/20 text-green-300 border-green-500/30",
  Bounced:   "bg-red-500/20 text-red-300 border-red-500/30",
  Void:      "bg-gray-500/20 text-gray-400 border-gray-500/30",
  Stale:     "bg-orange-500/20 text-orange-300 border-orange-500/30",
  Replaced:  "bg-purple-500/20 text-purple-300 border-purple-500/30",
  Active:    "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  Exhausted: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  Cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
};

const STATUS_COLORS_LIGHT: Record<string, string> = {
  Issued:    "bg-blue-100 text-blue-700 border-blue-200",
  Presented: "bg-yellow-100 text-yellow-700 border-yellow-200",
  Cleared:   "bg-green-100 text-green-700 border-green-200",
  Bounced:   "bg-red-100 text-red-700 border-red-200",
  Void:      "bg-gray-100 text-gray-600 border-gray-200",
  Stale:     "bg-orange-100 text-orange-700 border-orange-200",
  Replaced:  "bg-purple-100 text-purple-700 border-purple-200",
  Active:    "bg-emerald-100 text-emerald-700 border-emerald-200",
  Exhausted: "bg-gray-100 text-gray-500 border-gray-200",
  Cancelled: "bg-red-100 text-red-600 border-red-200",
};

function StatusBadge({ status, theme }: { status: string; theme: Theme }) {
  const colors = theme === "dark" ? STATUS_COLORS : STATUS_COLORS_LIGHT;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${colors[status] ?? "bg-gray-100 text-gray-600"}`}>
      {status}
    </span>
  );
}

// ── Format helpers ────────────────────────────────────────────
const fmtAmt = (n: number, cur = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: cur, minimumFractionDigits: 2 }).format(n ?? 0);

// ── KPI Card ──────────────────────────────────────────────────
function KpiCard({ label, value, sub, icon: Icon, color, theme }: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; color: string; theme: Theme;
}) {
  const bg = theme === "dark"
    ? "bg-[#1e2433] border-[#2a3347] text-white"
    : "bg-white border-gray-200 text-gray-900";
  return (
    <div className={`rounded-xl border p-4 flex flex-col gap-2 ${bg}`}>
      <div className="flex items-center justify-between">
        <span className={`text-xs font-medium uppercase tracking-wide ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>{label}</span>
        <span className={`p-1.5 rounded-lg ${color}`}><Icon className="w-4 h-4" /></span>
      </div>
      <div className={`text-2xl font-bold tabular-nums ${theme === "dark" ? "text-white" : "text-gray-900"}`}>{value}</div>
      {sub && <div className={`text-xs ${theme === "dark" ? "text-gray-500" : "text-gray-400"}`}>{sub}</div>}
    </div>
  );
}

// ── Issue Cheque Dialog ───────────────────────────────────────
function IssueChequeDialog({ open, onClose, theme }: { open: boolean; onClose: () => void; theme: Theme }) {
  const [form, setForm] = useState({
    bankAccountId: "", payeeName: "", amount: "", currency: "USD",
    issueDate: new Date().toISOString().split("T")[0],
    signatureType: "Single" as "Single" | "Dual",
    signatory1Id: "", signatory2Id: "", invoiceRef: "", remarks: "",
  });

  const { data: accounts = [] } = trpc.cheque.getBankAccounts.useQuery({ isActive: true });
  const { data: signatories = [] } = trpc.cheque.getSignatories.useQuery({ isActive: true });
  const { data: nextCheque } = trpc.cheque.getNextAvailableCheque.useQuery(
    { bankAccountId: Number(form.bankAccountId) },
    { enabled: !!form.bankAccountId }
  );

  const issueMutation = trpc.cheque.issueCheque.useMutation({
    onSuccess: () => { toast.success("Cheque issued successfully"); onClose(); },
    onError: (e) => toast.error(e.message),
  });

  const next = nextCheque as any;
  const dlgBg = theme === "dark" ? "bg-[#151b2d] text-white" : "bg-white text-gray-900";
  const inputCls = theme === "dark"
    ? "bg-[#1e2433] border-[#2a3347] text-white placeholder:text-gray-500"
    : "bg-white border-gray-300 text-gray-900";
  const labelCls = theme === "dark" ? "text-gray-300" : "text-gray-700";

  const handleSubmit = () => {
    if (!form.bankAccountId || !form.payeeName || !form.amount || !next?.book_id) {
      toast.error("Please fill all required fields and ensure a cheque book is available");
      return;
    }
    issueMutation.mutate({
      chequeBookId:  next.book_id,
      chequeNumber:  next.next_cheque_number,
      bankAccountId: Number(form.bankAccountId),
      payeeName:     form.payeeName,
      amount:        Number(form.amount),
      currency:      form.currency,
      issueDate:     form.issueDate,
      signatureType: form.signatureType,
      signatory1Id:  form.signatory1Id ? Number(form.signatory1Id) : undefined,
      signatory2Id:  form.signatory2Id ? Number(form.signatory2Id) : undefined,
      invoiceRef:    form.invoiceRef || undefined,
      remarks:       form.remarks || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className={`max-w-lg ${dlgBg}`}>
        <DialogHeader>
          <DialogTitle className={theme === "dark" ? "text-white" : ""}>Issue New Cheque</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-2">
          {/* Bank Account */}
          <div className="col-span-2">
            <Label className={labelCls}>Bank Account *</Label>
            <Select value={form.bankAccountId} onValueChange={v => setForm(f => ({ ...f, bankAccountId: v }))}>
              <SelectTrigger className={inputCls}><SelectValue placeholder="Select bank account" /></SelectTrigger>
              <SelectContent>
                {(accounts as any[]).map((a: any) => (
                  <SelectItem key={a.account_id} value={String(a.account_id)}>
                    {a.bank_name} — {a.account_number} ({a.currency})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Next Cheque Number (auto) */}
          {next && (
            <div className="col-span-2">
              <div className={`rounded-lg p-3 text-sm ${theme === "dark" ? "bg-[#0e1525] border border-[#2a3347]" : "bg-blue-50 border border-blue-200"}`}>
                <span className={theme === "dark" ? "text-gray-400" : "text-blue-600"}>Next Cheque: </span>
                <span className={`font-mono font-bold ${theme === "dark" ? "text-blue-300" : "text-blue-800"}`}>{next.next_cheque_number}</span>
                <span className={`ml-3 ${theme === "dark" ? "text-gray-500" : "text-gray-500"}`}>Book: {next.book_number} · {next.available_leaves} leaves remaining</span>
              </div>
            </div>
          )}

          {/* Payee */}
          <div className="col-span-2">
            <Label className={labelCls}>Payee Name (Lessor) *</Label>
            <Input className={inputCls} placeholder="Enter payee name" value={form.payeeName}
              onChange={e => setForm(f => ({ ...f, payeeName: e.target.value }))} />
          </div>

          {/* Amount + Currency */}
          <div>
            <Label className={labelCls}>Amount *</Label>
            <Input className={inputCls} type="number" placeholder="0.00" value={form.amount}
              onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
          </div>
          <div>
            <Label className={labelCls}>Currency</Label>
            <Select value={form.currency} onValueChange={v => setForm(f => ({ ...f, currency: v }))}>
              <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
              <SelectContent>
                {["USD","GHS","EUR","GBP","ZAR","KES","NGN"].map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Issue Date */}
          <div>
            <Label className={labelCls}>Issue Date *</Label>
            <Input className={inputCls} type="date" value={form.issueDate}
              onChange={e => setForm(f => ({ ...f, issueDate: e.target.value }))} />
          </div>

          {/* Invoice Ref */}
          <div>
            <Label className={labelCls}>Invoice Reference</Label>
            <Input className={inputCls} placeholder="INV-2024-001" value={form.invoiceRef}
              onChange={e => setForm(f => ({ ...f, invoiceRef: e.target.value }))} />
          </div>

          {/* Signature Type */}
          <div className="col-span-2">
            <Label className={labelCls}>Signature Type</Label>
            <Select value={form.signatureType} onValueChange={v => setForm(f => ({ ...f, signatureType: v as any }))}>
              <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Single">Single Signatory</SelectItem>
                <SelectItem value="Dual">Dual Signatory (requires two)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Signatory 1 */}
          <div>
            <Label className={labelCls}>Signatory 1 *</Label>
            <Select value={form.signatory1Id} onValueChange={v => setForm(f => ({ ...f, signatory1Id: v }))}>
              <SelectTrigger className={inputCls}><SelectValue placeholder="Select signatory" /></SelectTrigger>
              <SelectContent>
                {(signatories as any[]).map((s: any) => (
                  <SelectItem key={s.signatory_id} value={String(s.signatory_id)}>
                    {s.user_name} — {s.designation}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Signatory 2 (only if Dual) */}
          {form.signatureType === "Dual" && (
            <div>
              <Label className={labelCls}>Signatory 2 *</Label>
              <Select value={form.signatory2Id} onValueChange={v => setForm(f => ({ ...f, signatory2Id: v }))}>
                <SelectTrigger className={inputCls}><SelectValue placeholder="Select signatory" /></SelectTrigger>
                <SelectContent>
                  {(signatories as any[]).filter((s: any) => String(s.signatory_id) !== form.signatory1Id).map((s: any) => (
                    <SelectItem key={s.signatory_id} value={String(s.signatory_id)}>
                      {s.user_name} — {s.designation}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Remarks */}
          <div className="col-span-2">
            <Label className={labelCls}>Remarks</Label>
            <Input className={inputCls} placeholder="Optional remarks" value={form.remarks}
              onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={issueMutation.isPending}
            className="bg-[#e60000] hover:bg-[#cc0000] text-white">
            {issueMutation.isPending ? "Issuing..." : "Issue Cheque"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Register Cheque Book Dialog ───────────────────────────────
function RegisterBookDialog({ open, onClose, theme }: { open: boolean; onClose: () => void; theme: Theme }) {
  const [form, setForm] = useState({ bankAccountId: "", bookNumber: "", seriesFrom: "", seriesTo: "", receivedDate: new Date().toISOString().split("T")[0] });
  const { data: accounts = [] } = trpc.cheque.getBankAccounts.useQuery({ isActive: true });
  const createMutation = trpc.cheque.createChequeBook.useMutation({
    onSuccess: (r: any) => { toast.success(`Cheque book registered — ${r?.total_leaves} leaves`); onClose(); },
    onError: (e) => toast.error(e.message),
  });

  const dlgBg = theme === "dark" ? "bg-[#151b2d] text-white" : "bg-white text-gray-900";
  const inputCls = theme === "dark" ? "bg-[#1e2433] border-[#2a3347] text-white" : "bg-white border-gray-300";
  const labelCls = theme === "dark" ? "text-gray-300" : "text-gray-700";
  const leaves = form.seriesFrom && form.seriesTo
    ? Math.max(0, Number(form.seriesTo) - Number(form.seriesFrom) + 1) : 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className={`max-w-md ${dlgBg}`}>
        <DialogHeader><DialogTitle className={theme === "dark" ? "text-white" : ""}>Register Cheque Book</DialogTitle></DialogHeader>
        <div className="grid gap-4 py-2">
          <div>
            <Label className={labelCls}>Bank Account *</Label>
            <Select value={form.bankAccountId} onValueChange={v => setForm(f => ({ ...f, bankAccountId: v }))}>
              <SelectTrigger className={inputCls}><SelectValue placeholder="Select account" /></SelectTrigger>
              <SelectContent>
                {(accounts as any[]).map((a: any) => (
                  <SelectItem key={a.account_id} value={String(a.account_id)}>
                    {a.bank_name} — {a.account_number}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className={labelCls}>Book Number *</Label>
            <Input className={inputCls} placeholder="e.g. BK-2024-001" value={form.bookNumber}
              onChange={e => setForm(f => ({ ...f, bookNumber: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className={labelCls}>Series From *</Label>
              <Input className={inputCls} placeholder="000001" value={form.seriesFrom}
                onChange={e => setForm(f => ({ ...f, seriesFrom: e.target.value }))} />
            </div>
            <div>
              <Label className={labelCls}>Series To *</Label>
              <Input className={inputCls} placeholder="000050" value={form.seriesTo}
                onChange={e => setForm(f => ({ ...f, seriesTo: e.target.value }))} />
            </div>
          </div>
          {leaves > 0 && (
            <div className={`text-sm rounded-lg p-2 ${theme === "dark" ? "bg-[#0e1525] text-green-400" : "bg-green-50 text-green-700"}`}>
              Total leaves: <strong>{leaves}</strong>
            </div>
          )}
          <div>
            <Label className={labelCls}>Date Received *</Label>
            <Input className={inputCls} type="date" value={form.receivedDate}
              onChange={e => setForm(f => ({ ...f, receivedDate: e.target.value }))} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => createMutation.mutate({ bankAccountId: Number(form.bankAccountId), bookNumber: form.bookNumber, seriesFrom: form.seriesFrom, seriesTo: form.seriesTo, receivedDate: form.receivedDate })}
            disabled={createMutation.isPending} className="bg-[#e60000] hover:bg-[#cc0000] text-white">
            {createMutation.isPending ? "Registering..." : "Register Book"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Action Dialog (Bounce / Void / Present / Clear) ───────────
function ActionDialog({ open, onClose, cheque, action, theme }: {
  open: boolean; onClose: () => void; cheque: any; action: string; theme: Theme;
}) {
  const [reason, setReason] = useState("");
  const [bounceFee, setBounceFee] = useState("0");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  const bounceMutation  = trpc.cheque.bounceCheque.useMutation({ onSuccess: () => { toast.success("Cheque marked as bounced"); onClose(); }, onError: e => toast.error(e.message) });
  const voidMutation    = trpc.cheque.voidCheque.useMutation({ onSuccess: () => { toast.success("Cheque voided"); onClose(); }, onError: e => toast.error(e.message) });
  const presentMutation = trpc.cheque.presentCheque.useMutation({ onSuccess: () => { toast.success("Cheque marked as presented"); onClose(); }, onError: e => toast.error(e.message) });
  const clearMutation   = trpc.cheque.clearCheque.useMutation({ onSuccess: () => { toast.success("Cheque cleared"); onClose(); }, onError: e => toast.error(e.message) });

  const dlgBg = theme === "dark" ? "bg-[#151b2d] text-white" : "bg-white text-gray-900";
  const inputCls = theme === "dark" ? "bg-[#1e2433] border-[#2a3347] text-white" : "bg-white border-gray-300";
  const labelCls = theme === "dark" ? "text-gray-300" : "text-gray-700";

  const VOID_REASONS = ["Lost in transit","Payment cancelled","Damaged","Incorrect amount","Incorrect payee","Duplicate payment","Other"];
  const BOUNCE_REASONS = ["Insufficient funds","Account closed","Signature mismatch","Post-dated","Payment stopped","Refer to drawer","Technical error","Other"];

  const handleAction = () => {
    if (!cheque) return;
    if (action === "bounce") bounceMutation.mutate({ chequeId: cheque.cheque_id, bouncedDate: date, bounceReason: reason, bounceFee: Number(bounceFee) });
    if (action === "void")   voidMutation.mutate({ chequeId: cheque.cheque_id, voidReason: reason });
    if (action === "present") presentMutation.mutate({ chequeId: cheque.cheque_id, presentedDate: date });
    if (action === "clear")   clearMutation.mutate({ chequeId: cheque.cheque_id, clearedDate: date });
  };

  const titles: Record<string, string> = { bounce: "Record Bounce", void: "Void / Stop Payment", present: "Mark as Presented", clear: "Mark as Cleared" };
  const btnColors: Record<string, string> = { bounce: "bg-red-600 hover:bg-red-700", void: "bg-gray-600 hover:bg-gray-700", present: "bg-yellow-600 hover:bg-yellow-700", clear: "bg-green-600 hover:bg-green-700" };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className={`max-w-md ${dlgBg}`}>
        <DialogHeader><DialogTitle className={theme === "dark" ? "text-white" : ""}>{titles[action]}</DialogTitle></DialogHeader>
        {cheque && (
          <div className={`rounded-lg p-3 text-sm mb-2 ${theme === "dark" ? "bg-[#0e1525] border border-[#2a3347]" : "bg-gray-50 border border-gray-200"}`}>
            <div className="font-mono font-bold">{cheque.cheque_number}</div>
            <div className={theme === "dark" ? "text-gray-400" : "text-gray-600"}>{cheque.payee_name} · {fmtAmt(cheque.amount, cheque.currency)}</div>
          </div>
        )}
        <div className="grid gap-4 py-2">
          {(action === "bounce" || action === "present" || action === "clear") && (
            <div>
              <Label className={labelCls}>{action === "bounce" ? "Bounce Date" : action === "present" ? "Presented Date" : "Cleared Date"}</Label>
              <Input className={inputCls} type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
          )}
          {action === "bounce" && (
            <>
              <div>
                <Label className={labelCls}>Bounce Reason *</Label>
                <Select value={reason} onValueChange={setReason}>
                  <SelectTrigger className={inputCls}><SelectValue placeholder="Select reason" /></SelectTrigger>
                  <SelectContent>{BOUNCE_REASONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className={labelCls}>Bounce Fee</Label>
                <Input className={inputCls} type="number" placeholder="0.00" value={bounceFee} onChange={e => setBounceFee(e.target.value)} />
              </div>
            </>
          )}
          {action === "void" && (
            <div>
              <Label className={labelCls}>Void Reason *</Label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger className={inputCls}><SelectValue placeholder="Select reason" /></SelectTrigger>
                <SelectContent>{VOID_REASONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleAction} className={`text-white ${btnColors[action]}`}>
            Confirm {titles[action]}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Component ────────────────────────────────────────────
export default function ChequeInventory() {
  const [theme, setTheme] = useState<Theme>("dark");
  const [activeTab, setActiveTab] = useState("register");
  const [showIssueDialog, setShowIssueDialog] = useState(false);
  const [showBookDialog, setShowBookDialog] = useState(false);
  const [actionDialog, setActionDialog] = useState<{ open: boolean; cheque: any; action: string }>({ open: false, cheque: null, action: "" });

  // Filters
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterAccount, setFilterAccount] = useState<string>("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  // Data
  const { data: summaryData, refetch: refetchSummary } = trpc.cheque.getSummary.useQuery();
  const { data: accounts = [] } = trpc.cheque.getBankAccounts.useQuery({ isActive: true });
  const { data: cheques = [], refetch: refetchCheques } = trpc.cheque.getChequeRegister.useQuery({
    status: filterStatus || undefined,
    bankAccountId: filterAccount ? Number(filterAccount) : undefined,
    search: search || undefined,
    pageNumber: page,
    pageSize: 15,
  });
  const { data: books = [], refetch: refetchBooks } = trpc.cheque.getChequeBooks.useQuery({ pageNumber: 1, pageSize: 50 });
  const { data: staleCheques = [] } = trpc.cheque.getStaleCheques.useQuery({ staleDays: 90 });
  const { data: signatories = [] } = trpc.cheque.getSignatories.useQuery({ isActive: true });

  const summary = summaryData as any;
  const kpis = summary?.[0] ?? {};
  const bookSummary = summary?.[1] ?? [];

  const refetchAll = () => { refetchSummary(); refetchCheques(); refetchBooks(); };

  // Theme classes
  const bg      = theme === "dark" ? "bg-[#0e1525] text-white min-h-screen" : "bg-gray-50 text-gray-900 min-h-screen";
  const cardBg  = theme === "dark" ? "bg-[#1e2433] border-[#2a3347]" : "bg-white border-gray-200";
  const tableBg = theme === "dark" ? "bg-[#151b2d]" : "bg-white";
  const thCls   = theme === "dark" ? "text-gray-400 border-b border-[#2a3347]" : "text-gray-500 border-b border-gray-200";
  const tdCls   = theme === "dark" ? "border-b border-[#1e2433] text-gray-200" : "border-b border-gray-100 text-gray-700";
  const inputCls = theme === "dark" ? "bg-[#1e2433] border-[#2a3347] text-white placeholder:text-gray-500" : "bg-white border-gray-300 text-gray-900";
  const tabCls  = theme === "dark" ? "data-[state=active]:bg-[#1e2433] data-[state=active]:text-white text-gray-400" : "";

  return (
    <div className={bg}>
      <div className="max-w-screen-xl mx-auto px-6 py-6 space-y-6">

        {/* ── Header ─────────────────────────────────────────── */}
        <ScreenHeader
  screenId="VFLCHQINV0001P001"
  title="Cheque Inventory"
  subtitle="Cheque book management and tracking"
/>

        {/* ── KPI Ribbon ──────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <KpiCard label="Issued" value={kpis.total_issued ?? 0} icon={CreditCard} color="bg-blue-500/20 text-blue-400" theme={theme} />
          <KpiCard label="Presented" value={kpis.total_presented ?? 0} icon={ArrowRight} color="bg-yellow-500/20 text-yellow-400" theme={theme} />
          <KpiCard label="Cleared" value={kpis.total_cleared ?? 0} icon={CheckCircle2} color="bg-green-500/20 text-green-400" theme={theme} />
          <KpiCard label="Bounced" value={kpis.total_bounced ?? 0} icon={AlertTriangle} color="bg-red-500/20 text-red-400" theme={theme} />
          <KpiCard label="Voided" value={kpis.total_voided ?? 0} icon={XCircle} color="bg-gray-500/20 text-gray-400" theme={theme} />
          <KpiCard label="Stale (90d+)" value={kpis.total_stale ?? 0} icon={Clock} color="bg-orange-500/20 text-orange-400" theme={theme} />
          <KpiCard label="In Transit" value={fmtAmt(kpis.total_in_transit_amount ?? 0)} icon={TrendingDown} color="bg-purple-500/20 text-purple-400" theme={theme} sub="Issued + Presented" />
        </div>

        {/* ── Bank Account Summary ─────────────────────────────── */}
        {(bookSummary as any[]).length > 0 && (
          <div className={`rounded-xl border p-4 ${cardBg}`}>
            <h3 className={`text-sm font-semibold mb-3 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
              <Building2 className="w-4 h-4 inline mr-1.5" />Bank Account Inventory
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className={thCls}>
                    {["Bank","Account","Available Leaves","Issued","Voided","Active Books"].map(h => (
                      <th key={h} className="text-left py-2 px-3 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(bookSummary as any[]).map((b: any, i: number) => (
                    <tr key={i} className={tdCls}>
                      <td className="py-2 px-3 font-medium">{b.bank_name}</td>
                      <td className="py-2 px-3 font-mono text-xs">{b.account_number}</td>
                      <td className="py-2 px-3">
                        <span className={`font-bold ${(b.available_leaves ?? 0) < 10 ? "text-red-400" : "text-green-400"}`}>
                          {b.available_leaves ?? 0}
                        </span>
                      </td>
                      <td className="py-2 px-3">{b.issued_leaves ?? 0}</td>
                      <td className="py-2 px-3">{b.voided_leaves ?? 0}</td>
                      <td className="py-2 px-3">{b.active_books ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Tabs ─────────────────────────────────────────────── */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className={theme === "dark" ? "bg-[#1e2433] border border-[#2a3347]" : ""}>
            <TabsTrigger value="register" className={tabCls}>Cheque Register</TabsTrigger>
            <TabsTrigger value="books" className={tabCls}>Cheque Books</TabsTrigger>
            <TabsTrigger value="stale" className={tabCls}>
              Stale Alerts
              {(staleCheques as any[]).length > 0 && (
                <span className="ml-1.5 bg-orange-500 text-white text-xs rounded-full px-1.5 py-0.5">
                  {(staleCheques as any[]).length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="signatories" className={tabCls}>Signatories</TabsTrigger>
          </TabsList>

          {/* ── Cheque Register Tab ──────────────────────────── */}
          <TabsContent value="register" className="mt-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-4">
              <div className="relative flex-1 min-w-48">
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${theme === "dark" ? "text-gray-500" : "text-gray-400"}`} />
                <Input className={`pl-9 ${inputCls}`} placeholder="Search cheque no, payee, invoice..." value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1); }} />
              </div>
              <Select value={filterStatus} onValueChange={v => { setFilterStatus(v === "all" ? "" : v); setPage(1); }}>
                <SelectTrigger className={`w-40 ${inputCls}`}><SelectValue placeholder="All Statuses" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {["Issued","Presented","Cleared","Bounced","Void","Stale","Replaced"].map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterAccount} onValueChange={v => { setFilterAccount(v === "all" ? "" : v); setPage(1); }}>
                <SelectTrigger className={`w-52 ${inputCls}`}><SelectValue placeholder="All Accounts" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Accounts</SelectItem>
                  {(accounts as any[]).map((a: any) => (
                    <SelectItem key={a.account_id} value={String(a.account_id)}>
                      {a.bank_name} — {a.account_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Table */}
            <div className={`rounded-xl border overflow-hidden ${cardBg}`}>
              <div className="overflow-x-auto">
                <table className={`w-full text-sm ${tableBg}`}>
                  <thead>
                    <tr className={thCls}>
                      {["Cheque No","Payee","Amount","Bank Account","Issue Date","Presented","Status","Signatories","Actions"].map(h => (
                        <th key={h} className="text-left py-3 px-4 font-medium text-xs uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(cheques as any[]).length === 0 ? (
                      <tr><td colSpan={9} className={`py-12 text-center ${theme === "dark" ? "text-gray-500" : "text-gray-400"}`}>No cheques found</td></tr>
                    ) : (cheques as any[]).map((c: any) => (
                      <tr key={c.cheque_id} className={`${tdCls} hover:${theme === "dark" ? "bg-[#1e2433]" : "bg-gray-50"} transition-colors`}>
                        <td className="py-3 px-4 font-mono font-bold text-[#e60000]">{c.cheque_number}</td>
                        <td className="py-3 px-4">
                          <div className="font-medium">{c.payee_name}</div>
                          {c.invoice_ref && <div className={`text-xs ${theme === "dark" ? "text-gray-500" : "text-gray-400"}`}>{c.invoice_ref}</div>}
                        </td>
                        <td className="py-3 px-4 tabular-nums font-medium">{fmtAmt(c.amount, c.currency)}</td>
                        <td className="py-3 px-4">
                          <div className="text-xs">{c.bank_name}</div>
                          <div className={`text-xs font-mono ${theme === "dark" ? "text-gray-500" : "text-gray-400"}`}>{c.account_number}</div>
                        </td>
                        <td className="py-3 px-4 text-xs">{c.issue_date ? new Date(c.issue_date).toLocaleDateString() : "—"}</td>
                        <td className="py-3 px-4 text-xs">{c.presented_date ? new Date(c.presented_date).toLocaleDateString() : "—"}</td>
                        <td className="py-3 px-4"><StatusBadge status={c.status} theme={theme} /></td>
                        <td className="py-3 px-4 text-xs">
                          <div>{c.signatory_1_name ?? "—"}</div>
                          {c.signatory_2_name && <div className={theme === "dark" ? "text-gray-500" : "text-gray-400"}>{c.signatory_2_name}</div>}
                        </td>
                        <td className="py-3 px-4">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className={`h-7 px-2 ${theme === "dark" ? "text-gray-400 hover:text-white hover:bg-[#2a3347]" : ""}`}>
                                Actions <ChevronDown className="w-3 h-3 ml-1" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => toast.info(`Cheque ${c.cheque_number} details`)}>
                                <Eye className="w-4 h-4 mr-2" /> View Detail
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {c.status === "Issued" && (
                                <DropdownMenuItem onClick={() => setActionDialog({ open: true, cheque: c, action: "present" })}>
                                  <ArrowRight className="w-4 h-4 mr-2 text-yellow-500" /> Mark Presented
                                </DropdownMenuItem>
                              )}
                              {["Issued","Presented"].includes(c.status) && (
                                <DropdownMenuItem onClick={() => setActionDialog({ open: true, cheque: c, action: "clear" })}>
                                  <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" /> Mark Cleared
                                </DropdownMenuItem>
                              )}
                              {["Issued","Presented"].includes(c.status) && (
                                <DropdownMenuItem onClick={() => setActionDialog({ open: true, cheque: c, action: "bounce" })}>
                                  <AlertTriangle className="w-4 h-4 mr-2 text-red-500" /> Record Bounce
                                </DropdownMenuItem>
                              )}
                              {["Issued","Presented","Bounced"].includes(c.status) && (
                                <DropdownMenuItem onClick={() => setActionDialog({ open: true, cheque: c, action: "void" })}>
                                  <Ban className="w-4 h-4 mr-2 text-gray-500" /> Void / Stop Payment
                                </DropdownMenuItem>
                              )}
                              {c.status === "Bounced" && (
                                <DropdownMenuItem onClick={() => toast.info("Open Re-issue dialog")}>
                                  <RotateCcw className="w-4 h-4 mr-2 text-purple-500" /> Re-issue Cheque
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => toast.info("Print cheque")}>
                                <Printer className="w-4 h-4 mr-2" /> Print
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Pagination */}
              <div className={`flex items-center justify-between px-4 py-3 border-t ${theme === "dark" ? "border-[#2a3347] text-gray-400" : "border-gray-200 text-gray-500"}`}>
                <span className="text-xs">Page {page}</span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)} className={inputCls}>Prev</Button>
                  <Button variant="outline" size="sm" disabled={(cheques as any[]).length < 15} onClick={() => setPage(p => p + 1)} className={inputCls}>Next</Button>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ── Cheque Books Tab ─────────────────────────────── */}
          <TabsContent value="books" className="mt-4">
            <div className={`rounded-xl border overflow-hidden ${cardBg}`}>
              <div className="overflow-x-auto">
                <table className={`w-full text-sm ${tableBg}`}>
                  <thead>
                    <tr className={thCls}>
                      {["Book No","Bank","Account","Series","Total","Issued","Available","Status","Received"].map(h => (
                        <th key={h} className="text-left py-3 px-4 font-medium text-xs uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(books as any[]).length === 0 ? (
                      <tr><td colSpan={9} className={`py-12 text-center ${theme === "dark" ? "text-gray-500" : "text-gray-400"}`}>No cheque books registered</td></tr>
                    ) : (books as any[]).map((b: any) => (
                      <tr key={b.book_id} className={tdCls}>
                        <td className="py-3 px-4 font-mono font-bold">{b.book_number}</td>
                        <td className="py-3 px-4">{b.bank_name}</td>
                        <td className="py-3 px-4 font-mono text-xs">{b.account_number}</td>
                        <td className="py-3 px-4 font-mono text-xs">{b.series_from} – {b.series_to}</td>
                        <td className="py-3 px-4">{b.total_leaves}</td>
                        <td className="py-3 px-4">{b.issued_leaves}</td>
                        <td className="py-3 px-4">
                          <span className={`font-bold ${(b.available_leaves ?? 0) < 5 ? "text-red-400" : (b.available_leaves ?? 0) < 15 ? "text-yellow-400" : "text-green-400"}`}>
                            {b.available_leaves ?? 0}
                          </span>
                        </td>
                        <td className="py-3 px-4"><StatusBadge status={b.status} theme={theme} /></td>
                        <td className="py-3 px-4 text-xs">{b.received_date ? new Date(b.received_date).toLocaleDateString() : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          {/* ── Stale Cheques Tab ────────────────────────────── */}
          <TabsContent value="stale" className="mt-4">
            {(staleCheques as any[]).length === 0 ? (
              <div className={`rounded-xl border p-12 text-center ${cardBg}`}>
                <CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-green-400" />
                <p className={theme === "dark" ? "text-gray-400" : "text-gray-500"}>No stale cheques — all issued cheques have been presented within 90 days.</p>
              </div>
            ) : (
              <div className={`rounded-xl border overflow-hidden ${cardBg}`}>
                <div className={`px-4 py-3 border-b ${theme === "dark" ? "border-[#2a3347] bg-orange-500/10" : "border-orange-200 bg-orange-50"}`}>
                  <p className={`text-sm font-medium ${theme === "dark" ? "text-orange-300" : "text-orange-700"}`}>
                    <AlertTriangle className="w-4 h-4 inline mr-1.5" />
                    {(staleCheques as any[]).length} cheque(s) not presented within 90 days — action required
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className={`w-full text-sm ${tableBg}`}>
                    <thead>
                      <tr className={thCls}>
                        {["Cheque No","Payee","Amount","Bank","Issue Date","Days Outstanding","Action"].map(h => (
                          <th key={h} className="text-left py-3 px-4 font-medium text-xs uppercase">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(staleCheques as any[]).map((c: any) => (
                        <tr key={c.cheque_id} className={tdCls}>
                          <td className="py-3 px-4 font-mono font-bold text-orange-400">{c.cheque_number}</td>
                          <td className="py-3 px-4">{c.payee_name}</td>
                          <td className="py-3 px-4 tabular-nums">{fmtAmt(c.amount, c.currency)}</td>
                          <td className="py-3 px-4 text-xs">{c.bank_name}</td>
                          <td className="py-3 px-4 text-xs">{c.issue_date ? new Date(c.issue_date).toLocaleDateString() : "—"}</td>
                          <td className="py-3 px-4">
                            <span className="text-orange-400 font-bold">{c.days_outstanding} days</span>
                          </td>
                          <td className="py-3 px-4">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className={`h-7 ${inputCls}`}>
                                  Action <ChevronDown className="w-3 h-3 ml-1" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setActionDialog({ open: true, cheque: c, action: "present" })}>
                                  <ArrowRight className="w-4 h-4 mr-2 text-yellow-500" /> Mark Presented
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setActionDialog({ open: true, cheque: c, action: "void" })}>
                                  <Ban className="w-4 h-4 mr-2 text-gray-500" /> Void / Stop Payment
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </TabsContent>

          {/* ── Signatories Tab ──────────────────────────────── */}
          <TabsContent value="signatories" className="mt-4">
            <div className={`rounded-xl border overflow-hidden ${cardBg}`}>
              <div className={`flex items-center justify-between px-4 py-3 border-b ${theme === "dark" ? "border-[#2a3347]" : "border-gray-200"}`}>
                <h3 className={`text-sm font-semibold flex items-center gap-2 ${theme === "dark" ? "text-gray-200" : "text-gray-700"}`}>
                  <Users className="w-4 h-4" /> Authorised Signatories
                </h3>
                <Button size="sm" variant="outline" className={inputCls} onClick={() => toast.info("Add signatory — coming soon")}>
                  <Plus className="w-4 h-4 mr-1.5" /> Add Signatory
                </Button>
              </div>
              <div className="overflow-x-auto">
                <table className={`w-full text-sm ${tableBg}`}>
                  <thead>
                    <tr className={thCls}>
                      {["Name","Designation","Authority Limit","Status"].map(h => (
                        <th key={h} className="text-left py-3 px-4 font-medium text-xs uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(signatories as any[]).map((s: any) => (
                      <tr key={s.signatory_id} className={tdCls}>
                        <td className="py-3 px-4 font-medium">{s.user_name}</td>
                        <td className="py-3 px-4 text-xs">{s.designation}</td>
                        <td className="py-3 px-4 tabular-nums font-medium">{fmtAmt(s.authority_limit)}</td>
                        <td className="py-3 px-4">
                          <StatusBadge status={s.is_active ? "Active" : "Inactive"} theme={theme} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* ── Dialogs ───────────────────────────────────────────── */}
      <IssueChequeDialog open={showIssueDialog} onClose={() => { setShowIssueDialog(false); refetchAll(); }} theme={theme} />
      <RegisterBookDialog open={showBookDialog} onClose={() => { setShowBookDialog(false); refetchAll(); }} theme={theme} />
      <ActionDialog
        open={actionDialog.open}
        onClose={() => { setActionDialog({ open: false, cheque: null, action: "" }); refetchAll(); }}
        cheque={actionDialog.cheque}
        action={actionDialog.action}
        theme={theme}
      />
    </div>
  );
}
