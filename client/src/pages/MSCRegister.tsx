import { useState } from "react";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import SlidePanel from "@/components/SlidePanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  FileSignature, PlusCircle, Search, Car, Home, Clock, CheckCircle2,
  AlertTriangle, Eye, Edit, Trash2, Link2
} from "lucide-react";
import { toast } from "sonner";

// ── Status helpers ────────────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  ACTIVE:     "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  DRAFT:      "bg-blue-500/20 text-blue-400 border-blue-500/30",
  EXPIRED:    "bg-red-500/20 text-red-400 border-red-500/30",
  TERMINATED: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

// ── Mock data (replaced by live tRPC once DB is seeded) ───────────────────────
const MOCK_CONTRACTS = [
  {
    msc_id: 1, msc_ref: "MSC-2024-001", contract_type: "FLEET",
    title_en: "Master Fleet Lease Agreement",
    title_ar: "اتفاقية الإيجار الرئيسية للأسطول",
    party_a_en: "Vodafone UAE LLC", party_a_ar: "شركة فودافون الإمارات ذ.م.م",
    party_b_en: "Emirates Fleet Solutions LLC", party_b_ar: "شركة حلول الأسطول الإماراتية ذ.م.م",
    effective_date: "2024-01-01", expiry_date: "2026-12-31",
    contract_value: 2400000, currency: "AED",
    status: "ACTIVE", asset_count: 48, days_to_expiry: 617,
    governing_law_en: "UAE Federal Law", governing_law_ar: "القانون الاتحادي الإماراتي",
    jurisdiction_en: "Dubai Courts", jurisdiction_ar: "محاكم دبي",
  },
  {
    msc_id: 2, msc_ref: "MSC-2024-002", contract_type: "RESIDENTIAL",
    title_en: "Master Residential Lease Agreement",
    title_ar: "اتفاقية الإيجار السكني الرئيسية",
    party_a_en: "Vodafone UAE LLC", party_a_ar: "شركة فودافون الإمارات ذ.م.م",
    party_b_en: "Emaar Properties PJSC", party_b_ar: "شركة إعمار العقارية ش.م.ع",
    effective_date: "2024-03-01", expiry_date: "2025-02-28",
    contract_value: 1800000, currency: "AED",
    status: "ACTIVE", asset_count: 12, days_to_expiry: 40,
    governing_law_en: "UAE Federal Law", governing_law_ar: "القانون الاتحادي الإماراتي",
    jurisdiction_en: "Abu Dhabi Courts", jurisdiction_ar: "محاكم أبوظبي",
  },
  {
    msc_id: 3, msc_ref: "MSC-2023-001", contract_type: "FLEET",
    title_en: "Fleet Maintenance Services Contract",
    title_ar: "عقد خدمات صيانة الأسطول",
    party_a_en: "Vodafone UAE LLC", party_a_ar: "شركة فودافون الإمارات ذ.م.م",
    party_b_en: "Al Futtaim Automotive", party_b_ar: "شركة الفطيم للسيارات",
    effective_date: "2023-06-01", expiry_date: "2024-05-31",
    contract_value: 960000, currency: "AED",
    status: "EXPIRED", asset_count: 30, days_to_expiry: -300,
    governing_law_en: "UAE Federal Law", governing_law_ar: "القانون الاتحادي الإماراتي",
    jurisdiction_en: "Sharjah Courts", jurisdiction_ar: "محاكم الشارقة",
  },
  {
    msc_id: 4, msc_ref: "MSC-2025-001", contract_type: "RESIDENTIAL",
    title_en: "Staff Accommodation Master Agreement",
    title_ar: "الاتفاقية الرئيسية لإسكان الموظفين",
    party_a_en: "Vodafone UAE LLC", party_a_ar: "شركة فودافون الإمارات ذ.م.م",
    party_b_en: "Nakheel Properties LLC", party_b_ar: "شركة نخيل العقارية ذ.م.م",
    effective_date: "2025-01-01", expiry_date: "2027-12-31",
    contract_value: 3200000, currency: "AED",
    status: "DRAFT", asset_count: 0, days_to_expiry: 980,
    governing_law_en: "UAE Federal Law", governing_law_ar: "القانون الاتحادي الإماراتي",
    jurisdiction_en: "Dubai Courts", jurisdiction_ar: "محاكم دبي",
  },
];

const EMPTY_FORM = {
  contract_type: "FLEET",
  title_en: "", title_ar: "",
  party_a_en: "Vodafone UAE LLC", party_a_ar: "شركة فودافون الإمارات ذ.م.م",
  party_b_en: "", party_b_ar: "",
  effective_date: "", expiry_date: "",
  contract_value: "", currency: "AED",
  payment_terms_en: "", payment_terms_ar: "",
  scope_en: "", scope_ar: "",
  governing_law_en: "UAE Federal Law", governing_law_ar: "القانون الاتحادي الإماراتي",
  jurisdiction_en: "Dubai Courts", jurisdiction_ar: "محاكم دبي",
  termination_en: "", termination_ar: "",
  warranties_en: "", warranties_ar: "",
  signed_by_en: "", signed_by_ar: "",
  witness_en: "", witness_ar: "",
};

export default function MSCRegister() {
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [activeTab, setActiveTab] = useState<"parties"|"scope"|"legal"|"signatures">("parties");

  const filtered = MOCK_CONTRACTS.filter(c => {
    const matchSearch = !search || c.msc_ref.toLowerCase().includes(search.toLowerCase()) ||
      c.title_en.toLowerCase().includes(search.toLowerCase()) ||
      c.party_b_en.toLowerCase().includes(search.toLowerCase());
    const matchType   = filterType   === "ALL" || c.contract_type === filterType;
    const matchStatus = filterStatus === "ALL" || c.status === filterStatus;
    return matchSearch && matchType && matchStatus;
  });

  const totalValue = MOCK_CONTRACTS.filter(c => c.status === "ACTIVE").reduce((s, c) => s + c.contract_value, 0);
  const expiringSoon = MOCK_CONTRACTS.filter(c => c.days_to_expiry >= 0 && c.days_to_expiry <= 60).length;

  const handleCreate = () => {
    if (!form.title_en || !form.party_b_en || !form.effective_date || !form.expiry_date) {
      toast.error("Title (EN), Counterparty, Effective Date and Expiry Date are required");
      return;
    }
    toast.success("Master Services Contract created successfully");
    setShowCreate(false);
    setForm({ ...EMPTY_FORM });
  };

  const setF = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }));

  const TABS = [
    { id: "parties",    label: "Parties" },
    { id: "scope",      label: "Scope & Payment" },
    { id: "legal",      label: "Legal & Jurisdiction" },
    { id: "signatures", label: "Signatures" },
  ] as const;

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FileSignature className="w-6 h-6 text-[#e60000]" /> Master Services Contracts
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Screen ID: VFMSC0001P001 · Bilingual EN/AR contracts governing vehicle fleets and residential home leases
            </p>
          </div>
          <Button className="bg-[#e60000] hover:bg-[#cc0000] text-white" onClick={() => setShowCreate(true)}>
            <PlusCircle className="w-4 h-4 mr-2" /> New Contract
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <p className="text-xs text-muted-foreground">Active Contracts</p>
            </div>
            <p className="text-2xl font-bold text-emerald-400">
              {MOCK_CONTRACTS.filter(c => c.status === "ACTIVE").length}
            </p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Link2 className="w-4 h-4 text-blue-400" />
              <p className="text-xs text-muted-foreground">Total Linked Assets</p>
            </div>
            <p className="text-2xl font-bold text-blue-400">
              {MOCK_CONTRACTS.reduce((s, c) => s + c.asset_count, 0)}
            </p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <p className="text-xs text-muted-foreground">Expiring in 60 Days</p>
            </div>
            <p className="text-2xl font-bold text-amber-400">{expiringSoon}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileSignature className="w-4 h-4 text-purple-400" />
              <p className="text-xs text-muted-foreground">Active Contract Value</p>
            </div>
            <p className="text-xl font-bold text-purple-400">
              AED {(totalValue / 1_000_000).toFixed(1)}M
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search ref, title, counterparty..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Types</SelectItem>
              <SelectItem value="FLEET">Fleet</SelectItem>
              <SelectItem value="RESIDENTIAL">Residential</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="EXPIRED">Expired</SelectItem>
              <SelectItem value="TERMINATED">Terminated</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-xs">Contract Ref</TableHead>
                <TableHead className="text-xs">Type</TableHead>
                <TableHead className="text-xs">Title (EN / AR)</TableHead>
                <TableHead className="text-xs">Counterparty</TableHead>
                <TableHead className="text-xs">Effective</TableHead>
                <TableHead className="text-xs">Expiry</TableHead>
                <TableHead className="text-xs text-right">Value (AED)</TableHead>
                <TableHead className="text-xs text-right">Assets</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(c => (
                <TableRow key={c.msc_id} className="text-sm hover:bg-muted/30">
                  <TableCell className="font-mono text-xs font-medium">{c.msc_ref}</TableCell>
                  <TableCell>
                    <Badge className={c.contract_type === "FLEET"
                      ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                      : "bg-purple-500/20 text-purple-400 border-purple-500/30"
                    }>
                      {c.contract_type === "FLEET"
                        ? <><Car className="w-3 h-3 mr-1 inline" />Fleet</>
                        : <><Home className="w-3 h-3 mr-1 inline" />Residential</>
                      }
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-sm">{c.title_en}</div>
                    <div className="text-xs text-muted-foreground" dir="rtl">{c.title_ar}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs">{c.party_b_en}</div>
                    <div className="text-xs text-muted-foreground" dir="rtl">{c.party_b_ar}</div>
                  </TableCell>
                  <TableCell className="text-xs">{c.effective_date}</TableCell>
                  <TableCell>
                    <div className="text-xs">{c.expiry_date}</div>
                    {c.days_to_expiry >= 0 && c.days_to_expiry <= 60 && (
                      <div className="text-xs text-amber-400 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />{c.days_to_expiry}d left
                      </div>
                    )}
                    {c.days_to_expiry < 0 && (
                      <div className="text-xs text-red-400 mt-0.5">Expired</div>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-mono font-medium">
                    {c.contract_value.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right font-mono">{c.asset_count}</TableCell>
                  <TableCell>
                    <Badge className={STATUS_COLORS[c.status] ?? ""}>{c.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" className="h-7 text-xs px-2"
                        onClick={() => navigate(`/contracts/msc/${c.msc_id}`)}>
                        <Eye className="w-3 h-3 mr-1" /> View
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 text-xs px-2"
                        onClick={() => navigate(`/contracts/msc/${c.msc_id}/print`)}>
                        <FileSignature className="w-3 h-3 mr-1" /> Print
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} className="text-center text-muted-foreground py-12">
                    No contracts found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* ── Create Contract Slide Panel ─────────────────────────────────────── */}
      <SlidePanel
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="New Master Services Contract"
        subtitle="Bilingual EN/AR contract governing a vehicle fleet or residential home portfolio"
        width="2xl"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button className="bg-[#e60000] hover:bg-[#cc0000] text-white" onClick={handleCreate}>
              Create Contract
            </Button>
          </>
        }
      >
        {/* Tab navigation */}
        <div className="flex gap-1 mb-6 border-b border-border pb-3">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === t.id
                  ? "bg-[#e60000] text-white"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Tab: Parties ── */}
        {activeTab === "parties" && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Contract Type *</Label>
                <Select value={form.contract_type} onValueChange={v => setF("contract_type", v)}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FLEET">Fleet (Vehicles)</SelectItem>
                    <SelectItem value="RESIDENTIAL">Residential (Homes)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium">Currency</Label>
                <Select value={form.currency} onValueChange={v => setF("currency", v)}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["AED","USD","EUR","GBP","SAR","QAR","KWD","BHD","OMR"].map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Bilingual title */}
            <div className="bg-muted/30 rounded-xl p-4 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Contract Title</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">English *</Label>
                  <Input className="mt-1" placeholder="e.g. Master Fleet Lease Agreement" value={form.title_en} onChange={e => setF("title_en", e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Arabic (عربي)</Label>
                  <Input className="mt-1 text-right" dir="rtl" placeholder="اتفاقية الإيجار الرئيسية للأسطول" value={form.title_ar} onChange={e => setF("title_ar", e.target.value)} />
                </div>
              </div>
            </div>

            {/* Party A */}
            <div className="bg-muted/30 rounded-xl p-4 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Party A (Lessee / Employer)</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">English *</Label>
                  <Input className="mt-1" value={form.party_a_en} onChange={e => setF("party_a_en", e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Arabic (عربي)</Label>
                  <Input className="mt-1 text-right" dir="rtl" value={form.party_a_ar} onChange={e => setF("party_a_ar", e.target.value)} />
                </div>
              </div>
            </div>

            {/* Party B */}
            <div className="bg-muted/30 rounded-xl p-4 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Party B (Lessor / Service Provider)</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">English *</Label>
                  <Input className="mt-1" placeholder="e.g. Emirates Fleet Solutions LLC" value={form.party_b_en} onChange={e => setF("party_b_en", e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Arabic (عربي)</Label>
                  <Input className="mt-1 text-right" dir="rtl" placeholder="شركة حلول الأسطول الإماراتية ذ.م.م" value={form.party_b_ar} onChange={e => setF("party_b_ar", e.target.value)} />
                </div>
              </div>
            </div>

            {/* Dates & Value */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-sm font-medium">Effective Date *</Label>
                <Input type="date" className="mt-1.5" value={form.effective_date} onChange={e => setF("effective_date", e.target.value)} />
              </div>
              <div>
                <Label className="text-sm font-medium">Expiry Date *</Label>
                <Input type="date" className="mt-1.5" value={form.expiry_date} onChange={e => setF("expiry_date", e.target.value)} />
              </div>
              <div>
                <Label className="text-sm font-medium">Contract Value ({form.currency})</Label>
                <Input type="number" className="mt-1.5" placeholder="0.00" value={form.contract_value} onChange={e => setF("contract_value", e.target.value)} />
              </div>
            </div>
          </div>
        )}

        {/* ── Tab: Scope & Payment ── */}
        {activeTab === "scope" && (
          <div className="space-y-5">
            <div className="bg-muted/30 rounded-xl p-4 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Scope of Services</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">English</Label>
                  <Textarea className="mt-1 min-h-[120px]" placeholder="Describe the scope of services covered by this contract..." value={form.scope_en} onChange={e => setF("scope_en", e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Arabic (عربي)</Label>
                  <Textarea className="mt-1 min-h-[120px] text-right" dir="rtl" placeholder="وصف نطاق الخدمات المشمولة بهذا العقد..." value={form.scope_ar} onChange={e => setF("scope_ar", e.target.value)} />
                </div>
              </div>
            </div>

            <div className="bg-muted/30 rounded-xl p-4 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Payment Terms</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">English</Label>
                  <Textarea className="mt-1 min-h-[100px]" placeholder="e.g. Monthly in advance, due on the 1st of each month..." value={form.payment_terms_en} onChange={e => setF("payment_terms_en", e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Arabic (عربي)</Label>
                  <Textarea className="mt-1 min-h-[100px] text-right" dir="rtl" placeholder="مثال: شهري مقدماً، يستحق في الأول من كل شهر..." value={form.payment_terms_ar} onChange={e => setF("payment_terms_ar", e.target.value)} />
                </div>
              </div>
            </div>

            <div className="bg-muted/30 rounded-xl p-4 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Warranties</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">English</Label>
                  <Textarea className="mt-1 min-h-[100px]" placeholder="Warranty terms and conditions..." value={form.warranties_en} onChange={e => setF("warranties_en", e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Arabic (عربي)</Label>
                  <Textarea className="mt-1 min-h-[100px] text-right" dir="rtl" placeholder="شروط وأحكام الضمان..." value={form.warranties_ar} onChange={e => setF("warranties_ar", e.target.value)} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Tab: Legal & Jurisdiction ── */}
        {activeTab === "legal" && (
          <div className="space-y-5">
            <div className="bg-muted/30 rounded-xl p-4 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Governing Law</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">English</Label>
                  <Input className="mt-1" placeholder="e.g. UAE Federal Law" value={form.governing_law_en} onChange={e => setF("governing_law_en", e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Arabic (عربي)</Label>
                  <Input className="mt-1 text-right" dir="rtl" placeholder="القانون الاتحادي الإماراتي" value={form.governing_law_ar} onChange={e => setF("governing_law_ar", e.target.value)} />
                </div>
              </div>
            </div>

            <div className="bg-muted/30 rounded-xl p-4 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Jurisdiction</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">English</Label>
                  <Input className="mt-1" placeholder="e.g. Dubai Courts" value={form.jurisdiction_en} onChange={e => setF("jurisdiction_en", e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Arabic (عربي)</Label>
                  <Input className="mt-1 text-right" dir="rtl" placeholder="محاكم دبي" value={form.jurisdiction_ar} onChange={e => setF("jurisdiction_ar", e.target.value)} />
                </div>
              </div>
            </div>

            <div className="bg-muted/30 rounded-xl p-4 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Termination Clause</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">English</Label>
                  <Textarea className="mt-1 min-h-[120px]" placeholder="Either party may terminate this agreement with 30 days written notice..." value={form.termination_en} onChange={e => setF("termination_en", e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Arabic (عربي)</Label>
                  <Textarea className="mt-1 min-h-[120px] text-right" dir="rtl" placeholder="يجوز لأي من الطرفين إنهاء هذه الاتفاقية بإشعار كتابي مدته 30 يوماً..." value={form.termination_ar} onChange={e => setF("termination_ar", e.target.value)} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Tab: Signatures ── */}
        {activeTab === "signatures" && (
          <div className="space-y-5">
            <div className="bg-muted/30 rounded-xl p-4 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Signed By (Party A)</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">English</Label>
                  <Input className="mt-1" placeholder="Full name and title..." value={form.signed_by_en} onChange={e => setF("signed_by_en", e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Arabic (عربي)</Label>
                  <Input className="mt-1 text-right" dir="rtl" placeholder="الاسم الكامل والمسمى الوظيفي..." value={form.signed_by_ar} onChange={e => setF("signed_by_ar", e.target.value)} />
                </div>
              </div>
            </div>

            <div className="bg-muted/30 rounded-xl p-4 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Witness</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">English</Label>
                  <Input className="mt-1" placeholder="Witness name..." value={form.witness_en} onChange={e => setF("witness_en", e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Arabic (عربي)</Label>
                  <Input className="mt-1 text-right" dir="rtl" placeholder="اسم الشاهد..." value={form.witness_ar} onChange={e => setF("witness_ar", e.target.value)} />
                </div>
              </div>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 text-sm">
              <p className="font-medium text-blue-400 mb-1">Bilingual Contract Document</p>
              <p className="text-xs text-muted-foreground">
                After saving, click <strong>Print</strong> from the contract detail view to generate the full portrait A4 bilingual contract with English on the left and Arabic on the right, ready for wet signature or e-signature.
              </p>
            </div>
          </div>
        )}
      </SlidePanel>
    </DashboardLayout>
  );
}
