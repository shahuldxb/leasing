import { useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import ScreenHeader from "@/components/ScreenHeader";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  CheckCircle, XCircle, RefreshCw, ChevronRight, Calculator,
  FileText, Download, Search, Filter, Calendar, TrendingUp,
  BookOpen, Layers, AlertTriangle, Info
} from "lucide-react";

const SCREEN_ID = "VFACCJVUIX0001P001";

const JV_TYPE_LABELS: Record<string, string> = {
  INCEPTION: "Day-1 Inception",
  MONTHLY_AMORT: "Monthly Amortisation",
  REMEASUREMENT: "Remeasurement",
  PERIOD_CLOSE: "Period-End Close",
  TERMINATION: "Termination",
  MANUAL: "Manual",
};

const JV_TYPE_COLORS: Record<string, string> = {
  INCEPTION: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  MONTHLY_AMORT: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  REMEASUREMENT: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  PERIOD_CLOSE: "bg-teal-500/15 text-teal-400 border-teal-500/30",
  TERMINATION: "bg-red-500/15 text-red-400 border-red-500/30",
  MANUAL: "bg-gray-500/15 text-gray-400 border-gray-500/30",
};

const STATUS_COLORS: Record<string, string> = {
  Draft: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  Submitted: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  Posted: "bg-green-500/15 text-green-400 border-green-500/30",
  Rejected: "bg-red-500/15 text-red-400 border-red-500/30",
};

function fmt(n: number | null | undefined, cur = "QAR") {
  if (n == null) return "—";
  return new Intl.NumberFormat("en-QA", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n) + " " + cur;
}

function CalcExplanation({ explanation }: { explanation: string | null }) {
  const [open, setOpen] = useState(false);
  if (!explanation) return null;
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-amber-500/15 text-amber-400 border border-amber-500/30 hover:bg-amber-500/25 transition-colors"
        title="View calculation explanation"
      >
        <Calculator className="w-3 h-3" />
        Calc
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg bg-gray-900 border-gray-700">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-400">
              <Calculator className="w-4 h-4" />
              Calculation Explanation
            </DialogTitle>
          </DialogHeader>
          <div className="bg-gray-800 rounded-lg p-4 font-mono text-sm text-gray-200 whitespace-pre-wrap leading-relaxed border border-gray-700">
            {explanation}
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function JournalVoucher() {
  const { user } = useAuth();

  // ── Filters ──────────────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [page, setPage] = useState(1);

  // ── Selected JV ──────────────────────────────────────────────────────────
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // ── Dialogs ──────────────────────────────────────────────────────────────
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; jv_id: number | null; reason: string }>({ open: false, jv_id: null, reason: "" });
  const [genMonthlyDialog, setGenMonthlyDialog] = useState(false);
  const [batchSelected, setBatchSelected] = useState<Set<number>>(new Set());

  // ── System Settings ───────────────────────────────────────────────────────
  const { data: settings } = trpc.journalVoucher.getSettings.useQuery();
  const accountingPeriodDate = settings?.accounting_period_date ?? new Date().toISOString().slice(0, 10);
  const [genYear, setGenYear] = useState(() => new Date().getFullYear());
  const [genMonth, setGenMonth] = useState(() => new Date().getMonth() + 1);

  // ── List Query ────────────────────────────────────────────────────────────
  const listInput = useMemo(() => ({
    status: statusFilter === "all" ? undefined : statusFilter,
    jv_type: typeFilter === "all" ? undefined : typeFilter,
    search: search || undefined,
    page,
    page_size: 30,
  }), [statusFilter, typeFilter, search, page]);

  const { data: listData, isLoading, refetch } = trpc.journalVoucher.list.useQuery(listInput);
  const rows = listData?.rows ?? [];
  const total = listData?.total ?? 0;

  // ── Detail Query ──────────────────────────────────────────────────────────
  const { data: detail } = trpc.journalVoucher.getById.useQuery(
    { jv_id: selectedId! },
    { enabled: !!selectedId }
  );

  const utils = trpc.useUtils();
  const invalidate = () => utils.journalVoucher.list.invalidate();

  // ── Mutations ─────────────────────────────────────────────────────────────
  const postMut = trpc.journalVoucher.post.useMutation({
    onSuccess: (r) => { toast.success(`JV ${r?.jv_number} posted successfully`); invalidate(); utils.journalVoucher.getById.invalidate(); },
    onError: (e) => toast.error(`Post failed: ${e.message}`),
  });

  const rejectMut = trpc.journalVoucher.reject.useMutation({
    onSuccess: (r) => { toast.success(`JV ${r?.jv_number} rejected`); setRejectDialog({ open: false, jv_id: null, reason: "" }); invalidate(); utils.journalVoucher.getById.invalidate(); },
    onError: (e) => toast.error(`Reject failed: ${e.message}`),
  });

  const genMonthlyMut = trpc.journalVoucher.generateMonthly.useMutation({
    onSuccess: (r) => {
      toast.success(`Generated ${r?.generated_count ?? 0} monthly JVs for ${genYear}-${String(genMonth).padStart(2, "0")}`);
      setGenMonthlyDialog(false);
      invalidate();
    },
    onError: (e) => toast.error(`Generation failed: ${e.message}`),
  });

  const batchPostMut = trpc.journalVoucher.batchPost.useMutation({
    onSuccess: (r) => {
      toast.success(`Batch post: ${r?.posted_count} posted, ${r?.failed_count} failed`);
      setBatchSelected(new Set());
      invalidate();
    },
    onError: (e) => toast.error(`Batch post failed: ${e.message}`),
  });

  // ── Export CSV ────────────────────────────────────────────────────────────
  function exportCSV() {
    const headers = ["JV Number", "Type", "Period", "Posting Date", "Description", "Contract Ref", "Currency", "Total Debit", "Total Credit", "Status", "Created By", "Posted By"];
    const csvRows = rows.map((r: any) => [
      r.jv_number, JV_TYPE_LABELS[r.jv_type] ?? r.jv_type,
      `${r.period_year}-${String(r.period_month).padStart(2, "0")}`,
      r.posting_date?.slice(0, 10) ?? "",
      `"${(r.description ?? "").replace(/"/g, '""')}"`,
      r.contract_ref ?? "",
      r.currency ?? "QAR",
      r.total_debit ?? 0,
      r.total_credit ?? 0,
      r.status,
      r.created_by ?? "",
      r.posted_by ?? "",
    ].join(","));
    const blob = new Blob([headers.join(",") + "\n" + csvRows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "journal_vouchers.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  const selectedJv = detail?.jv ?? null;
  const selectedLines = detail?.lines ?? [];

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full bg-gray-950 text-gray-100">
        <ScreenHeader
          screenId={SCREEN_ID}
          title="Journal Voucher Register"
          subtitle="IFRS 16 Accounting Entries — Generate, Review & Post"
          screenType="journal_voucher"
          onAIData={() => {}}
        />

        {/* ── Toolbar ── */}
        <div className="flex flex-wrap items-center gap-3 px-6 py-3 border-b border-gray-800 bg-gray-900">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              placeholder="Search JV number, description..."
              className="pl-9 bg-gray-800 border-gray-700 text-gray-100 h-8 text-sm"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
          </div>

          <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(1); }}>
            <SelectTrigger className="w-36 h-8 bg-gray-800 border-gray-700 text-sm">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Draft">Draft</SelectItem>
              <SelectItem value="Submitted">Submitted</SelectItem>
              <SelectItem value="Posted">Posted</SelectItem>
              <SelectItem value="Rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={v => { setTypeFilter(v); setPage(1); }}>
            <SelectTrigger className="w-44 h-8 bg-gray-800 border-gray-700 text-sm">
              <SelectValue placeholder="JV Type" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="INCEPTION">Day-1 Inception</SelectItem>
              <SelectItem value="MONTHLY_AMORT">Monthly Amortisation</SelectItem>
              <SelectItem value="REMEASUREMENT">Remeasurement</SelectItem>
              <SelectItem value="PERIOD_CLOSE">Period-End Close</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-1 ml-auto">
            {batchSelected.size > 0 && (
              <Button
                size="sm"
                className="h-8 bg-green-600 hover:bg-green-700 text-white text-xs"
                onClick={() => batchPostMut.mutate({ jv_ids: Array.from(batchSelected) })}
                disabled={batchPostMut.isPending}
              >
                <CheckCircle className="w-3 h-3 mr-1" />
                Batch Post ({batchSelected.size})
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs border-gray-700 bg-gray-800 hover:bg-gray-700"
              onClick={() => setGenMonthlyDialog(true)}
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Generate Monthly
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs border-gray-700 bg-gray-800 hover:bg-gray-700"
              onClick={exportCSV}
            >
              <Download className="w-3 h-3 mr-1" />
              Export CSV
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs border-gray-700 bg-gray-800 hover:bg-gray-700"
              onClick={() => refetch()}
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Refresh
            </Button>
          </div>
        </div>

        {/* ── Accounting Period Info ── */}
        <div className="flex items-center gap-2 px-6 py-2 bg-blue-900/20 border-b border-blue-800/30 text-xs text-blue-300">
          <Calendar className="w-3.5 h-3.5" />
          <span>Current Accounting Period Date: <strong>{accountingPeriodDate}</strong></span>
          <span className="text-gray-500">— Used for monthly JV generation. Change in System Settings.</span>
        </div>

        {/* ── Main Content: List + Detail ── */}
        <div className="flex flex-1 overflow-hidden">
          {/* ── JV List ── */}
          <div className="flex flex-col w-[55%] border-r border-gray-800 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800 bg-gray-900/50">
              <span className="text-xs text-gray-500">{total} journal vouchers</span>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="ghost" className="h-6 text-xs px-2" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>‹ Prev</Button>
                <span className="text-xs text-gray-500">Page {page}</span>
                <Button size="sm" variant="ghost" className="h-6 text-xs px-2" onClick={() => setPage(p => p + 1)} disabled={rows.length < 30}>Next ›</Button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center h-32 text-gray-500 text-sm">Loading journal vouchers...</div>
              ) : rows.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-gray-500 gap-3">
                  <BookOpen className="w-10 h-10 opacity-30" />
                  <p className="text-sm">No journal vouchers found.</p>
                  <p className="text-xs text-gray-600">Click "Generate Monthly" to create IFRS 16 entries.</p>
                </div>
              ) : (
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-gray-900 border-b border-gray-800">
                    <tr>
                      <th className="w-8 px-3 py-2 text-left">
                        <input type="checkbox" className="accent-blue-500"
                          checked={batchSelected.size === rows.filter((r: any) => r.status !== "Posted").length && rows.length > 0}
                          onChange={e => {
                            if (e.target.checked) setBatchSelected(new Set(rows.filter((r: any) => r.status !== "Posted").map((r: any) => r.jv_id)));
                            else setBatchSelected(new Set());
                          }}
                        />
                      </th>
                      <th className="px-3 py-2 text-left text-gray-400 font-medium">JV Number</th>
                      <th className="px-3 py-2 text-left text-gray-400 font-medium">Type</th>
                      <th className="px-3 py-2 text-left text-gray-400 font-medium">Period</th>
                      <th className="px-3 py-2 text-right text-gray-400 font-medium">Debit</th>
                      <th className="px-3 py-2 text-left text-gray-400 font-medium">Status</th>
                      <th className="px-3 py-2 text-left text-gray-400 font-medium">Contract</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r: any) => (
                      <tr
                        key={r.jv_id}
                        className={`border-b border-gray-800/50 cursor-pointer transition-colors ${selectedId === r.jv_id ? "bg-blue-900/30" : "hover:bg-gray-800/50"}`}
                        onClick={() => setSelectedId(r.jv_id)}
                      >
                        <td className="px-3 py-2" onClick={e => e.stopPropagation()}>
                          {r.status !== "Posted" && (
                            <input type="checkbox" className="accent-blue-500"
                              checked={batchSelected.has(r.jv_id)}
                              onChange={e => {
                                const s = new Set(batchSelected);
                                if (e.target.checked) s.add(r.jv_id); else s.delete(r.jv_id);
                                setBatchSelected(s);
                              }}
                            />
                          )}
                        </td>
                        <td className="px-3 py-2 font-mono text-blue-300">{r.jv_number}</td>
                        <td className="px-3 py-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] border ${JV_TYPE_COLORS[r.jv_type] ?? "bg-gray-700 text-gray-300"}`}>
                            {JV_TYPE_LABELS[r.jv_type] ?? r.jv_type}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-gray-400">{r.period_year}-{String(r.period_month).padStart(2, "0")}</td>
                        <td className="px-3 py-2 text-right font-mono text-green-400">{fmt(r.total_debit, r.currency)}</td>
                        <td className="px-3 py-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] border ${STATUS_COLORS[r.status] ?? "bg-gray-700 text-gray-300"}`}>
                            {r.status}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-gray-400 max-w-[100px] truncate">{r.contract_ref ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* ── JV Detail Panel ── */}
          <div className="flex-1 flex flex-col overflow-hidden bg-gray-950">
            {!selectedId ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-600 gap-3">
                <ChevronRight className="w-10 h-10 opacity-20" />
                <p className="text-sm">Select a journal voucher to view details</p>
              </div>
            ) : !selectedJv ? (
              <div className="flex items-center justify-center h-full text-gray-500 text-sm">Loading...</div>
            ) : (
              <div className="flex flex-col h-full overflow-y-auto">
                {/* Header */}
                <div className="px-5 py-4 border-b border-gray-800 bg-gray-900">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-lg text-blue-300 font-semibold">{selectedJv.jv_number}</span>
                        <span className={`px-2 py-0.5 rounded text-xs border ${STATUS_COLORS[selectedJv.status] ?? ""}`}>{selectedJv.status}</span>
                        <span className={`px-2 py-0.5 rounded text-xs border ${JV_TYPE_COLORS[selectedJv.jv_type] ?? ""}`}>{JV_TYPE_LABELS[selectedJv.jv_type] ?? selectedJv.jv_type}</span>
                      </div>
                      <p className="text-sm text-gray-300">{selectedJv.description}</p>
                    </div>
                    <div className="flex gap-2">
                      {(selectedJv.status === "Draft" || selectedJv.status === "Submitted") && (
                        <>
                          <Button
                            size="sm"
                            className="h-8 bg-green-600 hover:bg-green-700 text-white text-xs"
                            onClick={() => postMut.mutate({ jv_id: selectedJv.jv_id })}
                            disabled={postMut.isPending}
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Post JV
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 border-red-700 text-red-400 hover:bg-red-900/30 text-xs"
                            onClick={() => setRejectDialog({ open: true, jv_id: selectedJv.jv_id, reason: "" })}
                          >
                            <XCircle className="w-3 h-3 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Meta grid */}
                  <div className="grid grid-cols-3 gap-3 mt-3 text-xs">
                    {[
                      ["Posting Date", selectedJv.posting_date?.slice(0, 10) ?? "—"],
                      ["Period", `${selectedJv.period_year}-${String(selectedJv.period_month).padStart(2, "0")}`],
                      ["Currency", selectedJv.currency ?? "QAR"],
                      ["Contract", selectedJv.contract_ref ?? "—"],
                      ["Source", selectedJv.source_type ?? "—"],
                      ["Source Ref", selectedJv.source_ref ?? "—"],
                      ["Created By", selectedJv.created_by ?? "—"],
                      ["Created At", selectedJv.created_at ? new Date(selectedJv.created_at).toLocaleString() : "—"],
                      ["Posted By", selectedJv.posted_by ?? "—"],
                    ].map(([label, val]) => (
                      <div key={label} className="bg-gray-800/50 rounded px-3 py-2">
                        <div className="text-gray-500 text-[10px] uppercase tracking-wide">{label}</div>
                        <div className="text-gray-200 mt-0.5 truncate">{val}</div>
                      </div>
                    ))}
                  </div>

                  {selectedJv.rejection_reason && (
                    <div className="mt-3 flex items-start gap-2 bg-red-900/20 border border-red-800/40 rounded px-3 py-2 text-xs text-red-300">
                      <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                      <span><strong>Rejection reason:</strong> {selectedJv.rejection_reason}</span>
                    </div>
                  )}
                </div>

                {/* Totals */}
                <div className="flex items-center gap-6 px-5 py-3 border-b border-gray-800 bg-gray-900/50">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-400" />
                    <span className="text-xs text-gray-500">Total Debit:</span>
                    <span className="font-mono text-green-400 font-semibold">{fmt(selectedJv.total_debit, selectedJv.currency)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-red-400 rotate-180" />
                    <span className="text-xs text-gray-500">Total Credit:</span>
                    <span className="font-mono text-red-400 font-semibold">{fmt(selectedJv.total_credit, selectedJv.currency)}</span>
                  </div>
                  {Math.abs((selectedJv.total_debit ?? 0) - (selectedJv.total_credit ?? 0)) < 0.01 ? (
                    <span className="text-xs text-green-400 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Balanced</span>
                  ) : (
                    <span className="text-xs text-red-400 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Unbalanced</span>
                  )}
                </div>

                {/* JV Lines */}
                <div className="flex-1 overflow-y-auto px-5 py-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Layers className="w-4 h-4 text-gray-500" />
                    <h3 className="text-sm font-semibold text-gray-300">Journal Lines ({selectedLines.length})</h3>
                    <span className="text-xs text-gray-600">— Debit/Credit pairs grouped by entry</span>
                  </div>

                  <table className="w-full text-xs">
                    <thead className="bg-gray-900 border-b border-gray-800">
                      <tr>
                        <th className="px-3 py-2 text-left text-gray-500 font-medium w-16">Calc</th>
                        <th className="px-3 py-2 text-left text-gray-500 font-medium w-8">#</th>
                        <th className="px-3 py-2 text-left text-gray-500 font-medium">Account Code</th>
                        <th className="px-3 py-2 text-left text-gray-500 font-medium">Account Name</th>
                        <th className="px-3 py-2 text-left text-gray-500 font-medium w-12">Dr/Cr</th>
                        <th className="px-3 py-2 text-right text-gray-500 font-medium">Amount</th>
                        <th className="px-3 py-2 text-left text-gray-500 font-medium">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedLines.map((line: any, idx: number) => {
                        const isDr = line.dr_cr === "Dr";
                        // Add separator between pairs (every 2 lines)
                        const showSep = idx > 0 && idx % 2 === 0;
                        return (
                          <>
                            {showSep && (
                              <tr key={`sep-${idx}`}>
                                <td colSpan={7} className="px-3 py-0.5">
                                  <div className="border-t border-gray-800/50 border-dashed" />
                                </td>
                              </tr>
                            )}
                            <tr key={line.line_id} className={`border-b border-gray-800/30 ${isDr ? "bg-green-950/10" : "bg-red-950/10"}`}>
                              <td className="px-3 py-2">
                                <CalcExplanation explanation={line.calc_explanation} />
                              </td>
                              <td className="px-3 py-2 text-gray-600 font-mono">{line.line_seq}</td>
                              <td className="px-3 py-2 font-mono text-blue-300">{line.account_code}</td>
                              <td className="px-3 py-2 text-gray-200">{line.account_name}</td>
                              <td className="px-3 py-2">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${isDr ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                                  {line.dr_cr}
                                </span>
                              </td>
                              <td className={`px-3 py-2 text-right font-mono font-semibold ${isDr ? "text-green-400" : "text-red-400"}`}>
                                {fmt(line.amount, line.currency)}
                              </td>
                              <td className="px-3 py-2 text-gray-400 max-w-[200px] truncate">{line.description}</td>
                            </tr>
                          </>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Generate Monthly Dialog ── */}
        <Dialog open={genMonthlyDialog} onOpenChange={setGenMonthlyDialog}>
          <DialogContent className="max-w-md bg-gray-900 border-gray-700">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-purple-400">
                <RefreshCw className="w-4 h-4" />
                Generate Monthly IFRS 16 JVs
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="bg-blue-900/20 border border-blue-800/40 rounded px-3 py-2 text-xs text-blue-300 flex items-start gap-2">
                <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                <span>Generates monthly amortisation JVs (interest expense + ROU depreciation) for all active leases in the selected period. Uses amortisation schedule data.</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Year</label>
                  <Input
                    type="number"
                    value={genYear}
                    onChange={e => setGenYear(parseInt(e.target.value))}
                    className="bg-gray-800 border-gray-700 text-gray-100 h-9"
                    min={2020} max={2035}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Month</label>
                  <Select value={String(genMonth)} onValueChange={v => setGenMonth(parseInt(v))}>
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-gray-100 h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map((m, i) => (
                        <SelectItem key={i+1} value={String(i+1)}>{m} ({i+1})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="text-xs text-gray-500">
                System accounting period: <strong className="text-gray-300">{accountingPeriodDate}</strong>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setGenMonthlyDialog(false)} className="border-gray-700">Cancel</Button>
              <Button
                size="sm"
                className="bg-purple-600 hover:bg-purple-700 text-white"
                onClick={() => genMonthlyMut.mutate({ period_year: genYear, period_month: genMonth })}
                disabled={genMonthlyMut.isPending}
              >
                {genMonthlyMut.isPending ? "Generating..." : "Generate JVs"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── Reject Dialog ── */}
        <Dialog open={rejectDialog.open} onOpenChange={open => setRejectDialog(d => ({ ...d, open }))}>
          <DialogContent className="max-w-md bg-gray-900 border-gray-700">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-400">
                <XCircle className="w-4 h-4" />
                Reject Journal Voucher
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <label className="text-xs text-gray-400">Rejection Reason <span className="text-red-400">*</span></label>
              <Textarea
                placeholder="Enter reason for rejection..."
                className="bg-gray-800 border-gray-700 text-gray-100 resize-none"
                rows={3}
                value={rejectDialog.reason}
                onChange={e => setRejectDialog(d => ({ ...d, reason: e.target.value }))}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setRejectDialog({ open: false, jv_id: null, reason: "" })} className="border-gray-700">Cancel</Button>
              <Button
                size="sm"
                className="bg-red-600 hover:bg-red-700 text-white"
                disabled={!rejectDialog.reason.trim() || rejectMut.isPending}
                onClick={() => rejectMut.mutate({ jv_id: rejectDialog.jv_id!, rejection_reason: rejectDialog.reason })}
              >
                {rejectMut.isPending ? "Rejecting..." : "Reject JV"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
