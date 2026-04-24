import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ScreenHeader } from "@/components/ScreenHeader";
import { GenAIFillButton } from "@/components/GenAIFillButton";
import {
  Building2, Plus, Search, Edit, Trash2, Phone, Mail, CreditCard,
  FileText, StickyNote, ChevronRight, MapPin, Globe, Star, AlertTriangle,
  RefreshCw, Eye, X
} from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  Active: "bg-green-500/20 text-green-400 border-green-500/30",
  Inactive: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  Blacklisted: "bg-red-500/20 text-red-400 border-red-500/30",
};

const LESSOR_TYPES = ["Individual", "Company", "Government", "REIT", "Trust"];
const CONTACT_TYPES = ["Primary", "Finance", "Legal", "Operations", "Emergency"];
const NOTE_TYPES = ["General", "Legal", "Financial", "Dispute", "Negotiation"];
const ACCOUNT_TYPES = ["Current", "Savings", "Fixed"];

export default function LessorMaster() {
  const [search, setSearch] = useState("");
  const [aiRows, setAiRows] = useState<Record<string, unknown>[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [selectedLessorId, setSelectedLessorId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [showBankForm, setShowBankForm] = useState(false);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [editingLessor, setEditingLessor] = useState<Record<string, string | number | boolean | null> | null>(null);

  // ── Queries ─────────────────────────────────────────────────────────────────
  const listQuery = trpc.lessor.getLessors.useQuery({
    searchTerm:  search || undefined,
    status:      statusFilter !== "all" ? (statusFilter as "Active" | "Inactive" | "Blacklisted") : undefined,
    lessorType:  typeFilter !== "all" ? typeFilter : undefined,
    pageNumber:  page,
    pageSize:    20,
  });

  const detailQuery = trpc.lessor.getLessorDetail.useQuery(
    { lessorId: selectedLessorId! },
    { enabled: !!selectedLessorId }
  );

  // ── Mutations ────────────────────────────────────────────────────────────────
  const utils = trpc.useUtils();
  const upsertMutation = trpc.lessor.upsertLessor.useMutation({
    onSuccess: () => {
      toast.success(editingLessor ? "Lessor updated" : "Lessor created");
      setShowForm(false);
      setEditingLessor(null);
      utils.lessor.getLessors.invalidate();
      if (selectedLessorId) utils.lessor.getLessorDetail.invalidate({ lessorId: selectedLessorId });
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.lessor.deleteLessor.useMutation({
    onSuccess: () => {
      toast.success("Lessor deleted");
      setSelectedLessorId(null);
      utils.lessor.getLessors.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const contactMutation = trpc.lessor.upsertContact.useMutation({
    onSuccess: () => {
      toast.success("Contact saved");
      setShowContactForm(false);
      if (selectedLessorId) utils.lessor.getLessorDetail.invalidate({ lessorId: selectedLessorId });
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteContactMutation = trpc.lessor.deleteContact.useMutation({
    onSuccess: () => {
      toast.success("Contact removed");
      if (selectedLessorId) utils.lessor.getLessorDetail.invalidate({ lessorId: selectedLessorId });
    },
  });

  const bankMutation = trpc.lessor.upsertBankAccount.useMutation({
    onSuccess: () => {
      toast.success("Bank account saved");
      setShowBankForm(false);
      if (selectedLessorId) utils.lessor.getLessorDetail.invalidate({ lessorId: selectedLessorId });
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteBankMutation = trpc.lessor.deleteBankAccount.useMutation({
    onSuccess: () => {
      toast.success("Bank account removed");
      if (selectedLessorId) utils.lessor.getLessorDetail.invalidate({ lessorId: selectedLessorId });
    },
  });

  const noteMutation = trpc.lessor.addNote.useMutation({
    onSuccess: () => {
      toast.success("Note added");
      setShowNoteForm(false);
      if (selectedLessorId) utils.lessor.getLessorDetail.invalidate({ lessorId: selectedLessorId });
    },
    onError: (e) => toast.error(e.message),
  });

  // ── Form State ───────────────────────────────────────────────────────────────
  const [form, setForm] = useState({
    lessorName: "", lessorType: "Company", registrationNo: "", taxId: "",
    country: "AE", city: "", addressLine1: "", addressLine2: "", postalCode: "",
    website: "", creditRating: "", paymentTerms: 30, preferredCurrency: "AED",
    status: "Active", blacklistReason: "",
  });

  const [contactForm, setContactForm] = useState({
    contactType: "Primary", fullName: "", jobTitle: "", department: "",
    email: "", phonePrimary: "", phoneSecondary: "", whatsapp: "", isPrimary: false, notes: "",
  });

  const [bankForm, setBankForm] = useState({
    bankName: "", accountName: "", accountNumber: "", iban: "", swiftCode: "",
    routingNumber: "", currency: "AED", accountType: "Current",
    branchName: "", branchCode: "", country: "AE", isPrimary: false, verifiedBy: "",
  });

  const [noteForm, setNoteForm] = useState({
    noteType: "General", subject: "", noteText: "", isPrivate: false,
  });

  const openEdit = (lessor: Record<string, string | number | boolean | null>) => {
    setEditingLessor(lessor);
    setForm({
      lessorName:        String(lessor.lessor_name ?? ""),
      lessorType:        String(lessor.lessor_type ?? "Company"),
      registrationNo:    String(lessor.registration_no ?? ""),
      taxId:             String(lessor.tax_id ?? ""),
      country:           String(lessor.country ?? "AE"),
      city:              String(lessor.city ?? ""),
      addressLine1:      String(lessor.address_line1 ?? ""),
      addressLine2:      String(lessor.address_line2 ?? ""),
      postalCode:        String(lessor.postal_code ?? ""),
      website:           String(lessor.website ?? ""),
      creditRating:      String(lessor.credit_rating ?? ""),
      paymentTerms:      Number(lessor.payment_terms ?? 30),
      preferredCurrency: String(lessor.preferred_currency ?? "AED"),
      status:            String(lessor.status ?? "Active"),
      blacklistReason:   String(lessor.blacklist_reason ?? ""),
    });
    setShowForm(true);
  };

  const detail = detailQuery.data;
  const lessors = aiRows.length > 0 ? aiRows as any[] : ((listQuery.data?.lessors ?? []) as Record<string, string | number | boolean | null>[]);
  const total = listQuery.data?.total ?? 0;

  return (
    <div className="flex h-full gap-0 bg-[#0f1117] text-gray-100 min-h-screen">

      {/* ── Left Panel: Lessor List ─────────────────────────────────────────── */}
      <div className="w-[380px] min-w-[320px] border-r border-white/10 flex flex-col bg-[#13161f]">
        {/* Header */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-red-400" />
              <h2 className="font-semibold text-white">Lessor Master</h2>
              <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">{total}</Badge>
            </div>
            <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white h-7 px-2 text-xs"
              onClick={() => { setEditingLessor(null); setForm({ lessorName: "", lessorType: "Company", registrationNo: "", taxId: "", country: "AE", city: "", addressLine1: "", addressLine2: "", postalCode: "", website: "", creditRating: "", paymentTerms: 30, preferredCurrency: "AED", status: "Active", blacklistReason: "" }); setShowForm(true); }}>
              <Plus className="w-3 h-3 mr-1" /> New
            </Button>
          </div>
          <div className="relative mb-2">
            <Search className="absolute left-2 top-2 w-3.5 h-3.5 text-gray-500" />
            <Input className="pl-7 h-8 text-xs bg-[#1a1d2e] border-white/10 text-gray-200 placeholder:text-gray-500"
              placeholder="Search lessors..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger className="h-7 text-xs bg-[#1a1d2e] border-white/10 text-gray-300 flex-1">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1d2e] border-white/10 text-gray-200">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
                <SelectItem value="Blacklisted">Blacklisted</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={v => { setTypeFilter(v); setPage(1); }}>
              <SelectTrigger className="h-7 text-xs bg-[#1a1d2e] border-white/10 text-gray-300 flex-1">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1d2e] border-white/10 text-gray-200">
                <SelectItem value="all">All Types</SelectItem>
                {LESSOR_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {listQuery.isLoading ? (
            <div className="flex items-center justify-center h-32 text-gray-500 text-sm">Loading...</div>
          ) : lessors.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-gray-500 gap-2">
              <Building2 className="w-8 h-8 opacity-30" />
              <p className="text-sm">No lessors found</p>
            </div>
          ) : lessors.map((l) => (
            <div key={String(l.lessor_id)}
              className={`p-3 border-b border-white/5 cursor-pointer hover:bg-white/5 transition-colors ${selectedLessorId === Number(l.lessor_id) ? "bg-red-500/10 border-l-2 border-l-red-500" : ""}`}
              onClick={() => setSelectedLessorId(Number(l.lessor_id))}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{String(l.lessor_name)}</p>
                  <p className="text-xs text-gray-500 truncate">{String(l.lessor_type)} · {String(l.country)}</p>
                  {l.city ? <p className="text-xs text-gray-600 truncate flex items-center gap-1 mt-0.5"><MapPin className="w-2.5 h-2.5" />{String(l.city)}</p> : null}
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <Badge className={`text-[10px] px-1.5 py-0 border ${STATUS_COLORS[String(l.status)] ?? ""}`}>{String(l.status)}</Badge>
                  {Number(l.asset_count) > 0 && <span className="text-[10px] text-gray-500">{Number(l.asset_count)} assets</span>}
                </div>
              </div>
              {Number(l.active_leases) > 0 && (
                <div className="mt-1.5 flex items-center gap-1">
                  <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded">{Number(l.active_leases)} active leases</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Pagination */}
        {total > 20 && (
          <div className="p-2 border-t border-white/10 flex items-center justify-between">
            <Button variant="outline" size="sm" className="h-6 text-xs border-white/10 text-gray-400"
              disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
            <span className="text-xs text-gray-500">Page {page} of {Math.ceil(total / 20)}</span>
            <Button variant="outline" size="sm" className="h-6 text-xs border-white/10 text-gray-400"
              disabled={page >= Math.ceil(total / 20)} onClick={() => setPage(p => p + 1)}>Next</Button>
          </div>
        )}
      </div>

      {/* ── Right Panel: Lessor Detail ──────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        {!selectedLessorId ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-600 gap-3">
            <Building2 className="w-16 h-16 opacity-20" />
            <p className="text-lg">Select a lessor to view details</p>
          </div>
        ) : detailQuery.isLoading ? (
          <div className="flex items-center justify-center h-full text-gray-500">Loading details...</div>
        ) : !detail?.lessor ? (
          <div className="flex items-center justify-center h-full text-gray-500">Lessor not found</div>
        ) : (
          <div className="p-6">
            {/* Detail Header */}
            <ScreenHeader
  screenId="VFLLESMAS0001P001"
          screenType="lessor_master"
          onAIData={(rows) => setAiRows(rows)}
  title="Lessor Master"
  subtitle="Lessor profile and contact management"
/>

            {/* KPI Cards */}
            <div className="grid grid-cols-4 gap-3 mb-6">
              {[
                { label: "Active Leases", value: String((detail.lessor as Record<string, string | number | boolean | null>).active_leases ?? 0), color: "text-blue-400" },
                { label: "Total Assets", value: String((detail.lessor as Record<string, string | number | boolean | null>).total_assets ?? 0), color: "text-purple-400" },
                { label: "Payment Terms", value: `${(detail.lessor as Record<string, string | number | boolean | null>).payment_terms ?? 30} days`, color: "text-yellow-400" },
                { label: "Credit Rating", value: String((detail.lessor as Record<string, string | number | boolean | null>).credit_rating ?? "N/A"), color: "text-green-400" },
              ].map(k => (
                <Card key={k.label} className="bg-[#1a1d2e] border-white/10">
                  <CardContent className="p-3">
                    <p className="text-xs text-gray-500 mb-1">{k.label}</p>
                    <p className={`text-xl font-bold ${k.color}`}>{k.value}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Tabs */}
            <Tabs defaultValue="overview">
              <TabsList className="bg-[#1a1d2e] border border-white/10 mb-4">
                {["overview", "contacts", "bank", "assets", "documents", "notes"].map(t => (
                  <TabsTrigger key={t} value={t} className="text-xs capitalize data-[state=active]:bg-red-600 data-[state=active]:text-white text-gray-400">
                    {t === "bank" ? "Bank Accounts" : t}
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview">
                <div className="grid grid-cols-2 gap-4">
                  <Card className="bg-[#1a1d2e] border-white/10">
                    <CardHeader className="pb-2 pt-4 px-4"><CardTitle className="text-sm text-gray-300">Company Details</CardTitle></CardHeader>
                    <CardContent className="px-4 pb-4 space-y-2">
                      {[
                        ["Type", (detail.lessor as Record<string, string | number | boolean | null>).lessor_type],
                        ["Registration No", (detail.lessor as Record<string, string | number | boolean | null>).registration_no],
                        ["Tax ID", (detail.lessor as Record<string, string | number | boolean | null>).tax_id],
                        ["Website", (detail.lessor as Record<string, string | number | boolean | null>).website],
                        ["Preferred Currency", (detail.lessor as Record<string, string | number | boolean | null>).preferred_currency],
                      ].map(([label, val]) => val ? (
                        <div key={String(label)} className="flex justify-between text-xs">
                          <span className="text-gray-500">{String(label as string)}</span>
                          <span className="text-gray-200">{String(val)}</span>
                        </div>
                      ) : null)}
                    </CardContent>
                  </Card>
                  <Card className="bg-[#1a1d2e] border-white/10">
                    <CardHeader className="pb-2 pt-4 px-4"><CardTitle className="text-sm text-gray-300">Address</CardTitle></CardHeader>
                    <CardContent className="px-4 pb-4 space-y-2">
                      {[
                        ["Line 1", (detail.lessor as Record<string, string | number | boolean | null>).address_line1],
                        ["Line 2", (detail.lessor as Record<string, string | number | boolean | null>).address_line2],
                        ["City", (detail.lessor as Record<string, string | number | boolean | null>).city],
                        ["Postal Code", (detail.lessor as Record<string, string | number | boolean | null>).postal_code],
                        ["Country", (detail.lessor as Record<string, string | number | boolean | null>).country],
                      ].map(([label, val]) => val ? (
                        <div key={String(label)} className="flex justify-between text-xs">
                          <span className="text-gray-500">{String(label as string)}</span>
                          <span className="text-gray-200">{String(val)}</span>
                        </div>
                      ) : null)}
                    </CardContent>
                  </Card>
                </div>
                {(detail.lessor as Record<string, string | number | boolean | null>).status === "Blacklisted" && Boolean((detail.lessor as Record<string, string | number | boolean | null>).blacklist_reason) && (
                  <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-red-400">Blacklisted</p>
                      <p className="text-xs text-red-300">{String((detail.lessor as Record<string, string | number | boolean | null>).blacklist_reason)}</p>
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* Contacts Tab */}
              <TabsContent value="contacts">
                <div className="flex justify-end mb-3">
                  <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white text-xs h-7"
                    onClick={() => { setContactForm({ contactType: "Primary", fullName: "", jobTitle: "", department: "", email: "", phonePrimary: "", phoneSecondary: "", whatsapp: "", isPrimary: false, notes: "" }); setShowContactForm(true); }}>
                    <Plus className="w-3 h-3 mr-1" /> Add Contact
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {((detail.contacts ?? []) as Record<string, string | number | boolean | null>[]).map(c => (
                    <Card key={String(c.contact_id)} className="bg-[#1a1d2e] border-white/10">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="text-sm font-medium text-white">{String(c.full_name)}</p>
                            <p className="text-xs text-gray-500">{String(c.job_title ?? "")} {c.department ? `· ${c.department}` : ""}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            {c.is_primary ? <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" /> : null}
                            <Badge className="text-[10px] bg-blue-500/20 text-blue-400 border-blue-500/30">{String(c.contact_type)}</Badge>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-400 hover:text-red-300"
                              onClick={() => deleteContactMutation.mutate({ contactId: Number(c.contact_id), lessorId: selectedLessorId })}>
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-1">
                          {c.email ? <p className="text-xs text-gray-400 flex items-center gap-1"><Mail className="w-3 h-3" />{String(c.email)}</p> : null}
                          {c.phone_primary ? <p className="text-xs text-gray-400 flex items-center gap-1"><Phone className="w-3 h-3" />{String(c.phone_primary)}</p> : null}
                          {c.whatsapp ? <p className="text-xs text-gray-500">WhatsApp: {String(c.whatsapp)}</p> : null}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {(detail.contacts ?? []).length === 0 && (
                    <p className="text-gray-500 text-sm col-span-2 text-center py-8">No contacts added yet</p>
                  )}
                </div>
              </TabsContent>

              {/* Bank Accounts Tab */}
              <TabsContent value="bank">
                <div className="flex justify-end mb-3">
                  <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white text-xs h-7"
                    onClick={() => { setBankForm({ bankName: "", accountName: "", accountNumber: "", iban: "", swiftCode: "", routingNumber: "", currency: "AED", accountType: "Current", branchName: "", branchCode: "", country: "AE", isPrimary: false, verifiedBy: "" }); setShowBankForm(true); }}>
                    <Plus className="w-3 h-3 mr-1" /> Add Bank Account
                  </Button>
                </div>
                <div className="space-y-3">
                  {((detail.bankAccounts ?? []) as Record<string, string | number | boolean | null>[]).map(b => (
                    <Card key={String(b.bank_acc_id)} className="bg-[#1a1d2e] border-white/10">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <CreditCard className="w-4 h-4 text-blue-400" />
                              <p className="text-sm font-medium text-white">{String(b.bank_name)}</p>
                              {b.is_primary ? <Badge className="text-[10px] bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Primary</Badge> : null}
                            </div>
                            <p className="text-xs text-gray-400">{String(b.account_name)} · {String(b.account_type)}</p>
                            <div className="grid grid-cols-2 gap-x-4 mt-2">
                              <p className="text-xs text-gray-500">Account: <span className="text-gray-300">{String(b.account_number)}</span></p>
                              {b.iban ? <p className="text-xs text-gray-500">IBAN: <span className="text-gray-300">{String(b.iban)}</span></p> : null}
                              {b.swift_code ? <p className="text-xs text-gray-500">SWIFT: <span className="text-gray-300">{String(b.swift_code)}</span></p> : null}
                              <p className="text-xs text-gray-500">Currency: <span className="text-gray-300">{String(b.currency)}</span></p>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-400 hover:text-red-300"
                            onClick={() => deleteBankMutation.mutate({ bankAccId: Number(b.bank_acc_id), lessorId: selectedLessorId })}>
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {(detail.bankAccounts ?? []).length === 0 && (
                    <p className="text-gray-500 text-sm text-center py-8">No bank accounts added yet</p>
                  )}
                </div>
              </TabsContent>

              {/* Assets Tab */}
              <TabsContent value="assets">
                <div className="space-y-2">
                  {((detail.assets ?? []) as Record<string, string | number | boolean | null>[]).map(a => (
                    <div key={String(a.asset_id)} className="flex items-center justify-between p-3 bg-[#1a1d2e] rounded-lg border border-white/10">
                      <div>
                        <p className="text-sm font-medium text-white">{String(a.asset_name)}</p>
                        <p className="text-xs text-gray-500">{String(a.asset_type)} · {String(a.city ?? "")}, {String(a.country)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="text-[10px] bg-blue-500/20 text-blue-400 border-blue-500/30">{String(a.status)}</Badge>
                        <ChevronRight className="w-4 h-4 text-gray-600" />
                      </div>
                    </div>
                  ))}
                  {(detail.assets ?? []).length === 0 && (
                    <p className="text-gray-500 text-sm text-center py-8">No assets linked to this lessor</p>
                  )}
                </div>
              </TabsContent>

              {/* Documents Tab */}
              <TabsContent value="documents">
                <div className="space-y-2">
                  {((detail.documents ?? []) as Record<string, string | number | boolean | null>[]).map(d => (
                    <div key={String(d.doc_id)} className="flex items-center justify-between p-3 bg-[#1a1d2e] rounded-lg border border-white/10">
                      <div className="flex items-center gap-3">
                        <FileText className="w-4 h-4 text-blue-400" />
                        <div>
                          <p className="text-sm text-white">{String(d.doc_name)}</p>
                          <p className="text-xs text-gray-500">{String(d.doc_type)} {d.doc_number ? `· ${d.doc_number}` : ""}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        {d.expiry_date ? <p className="text-xs text-gray-500">Expires: {new Date(String(d.expiry_date)).toLocaleDateString()}</p> : null}
                      </div>
                    </div>
                  ))}
                  {(detail.documents ?? []).length === 0 && (
                    <p className="text-gray-500 text-sm text-center py-8">No documents uploaded</p>
                  )}
                </div>
              </TabsContent>

              {/* Notes Tab */}
              <TabsContent value="notes">
                <div className="flex justify-end mb-3">
                  <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white text-xs h-7"
                    onClick={() => { setNoteForm({ noteType: "General", subject: "", noteText: "", isPrivate: false }); setShowNoteForm(true); }}>
                    <Plus className="w-3 h-3 mr-1" /> Add Note
                  </Button>
                </div>
                <div className="space-y-3">
                  {((detail.notes ?? []) as Record<string, string | number | boolean | null>[]).map(n => (
                    <Card key={String(n.note_id)} className="bg-[#1a1d2e] border-white/10">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="text-sm font-medium text-white">{String(n.subject)}</p>
                            <p className="text-xs text-gray-500">{String(n.note_type)} · {String(n.created_by)} · {new Date(String(n.created_at)).toLocaleDateString()}</p>
                          </div>
                          {n.is_private ? <Badge className="text-[10px] bg-orange-500/20 text-orange-400 border-orange-500/30">Private</Badge> : null}
                        </div>
                        <p className="text-xs text-gray-300 whitespace-pre-wrap">{String(n.note_text)}</p>
                      </CardContent>
                    </Card>
                  ))}
                  {(detail.notes ?? []).length === 0 && (
                    <p className="text-gray-500 text-sm text-center py-8">No notes added yet</p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>

      {/* ── Lessor Form Dialog ──────────────────────────────────────────────── */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="bg-[#1a1d2e] border-white/10 text-gray-100 max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">{editingLessor ? "Edit Lessor" : "New Lessor"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2">
              <Label className="text-xs text-gray-400">Lessor Name *</Label>
              <Input className="bg-[#0f1117] border-white/10 text-gray-200 mt-1" value={form.lessorName} onChange={e => setForm(f => ({ ...f, lessorName: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs text-gray-400">Type</Label>
              <Select value={form.lessorType} onValueChange={v => setForm(f => ({ ...f, lessorType: v }))}>
                <SelectTrigger className="bg-[#0f1117] border-white/10 text-gray-200 mt-1"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#1a1d2e] border-white/10 text-gray-200">
                  {LESSOR_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-gray-400">Status</Label>
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                <SelectTrigger className="bg-[#0f1117] border-white/10 text-gray-200 mt-1"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#1a1d2e] border-white/10 text-gray-200">
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                  <SelectItem value="Blacklisted">Blacklisted</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-gray-400">Registration No</Label>
              <Input className="bg-[#0f1117] border-white/10 text-gray-200 mt-1" value={form.registrationNo} onChange={e => setForm(f => ({ ...f, registrationNo: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs text-gray-400">Tax ID</Label>
              <Input className="bg-[#0f1117] border-white/10 text-gray-200 mt-1" value={form.taxId} onChange={e => setForm(f => ({ ...f, taxId: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs text-gray-400">Country (2-letter)</Label>
              <Input className="bg-[#0f1117] border-white/10 text-gray-200 mt-1" maxLength={2} value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value.toUpperCase() }))} />
            </div>
            <div>
              <Label className="text-xs text-gray-400">City</Label>
              <Input className="bg-[#0f1117] border-white/10 text-gray-200 mt-1" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
            </div>
            <div className="col-span-2">
              <Label className="text-xs text-gray-400">Address Line 1</Label>
              <Input className="bg-[#0f1117] border-white/10 text-gray-200 mt-1" value={form.addressLine1} onChange={e => setForm(f => ({ ...f, addressLine1: e.target.value }))} />
            </div>
            <div className="col-span-2">
              <Label className="text-xs text-gray-400">Address Line 2</Label>
              <Input className="bg-[#0f1117] border-white/10 text-gray-200 mt-1" value={form.addressLine2} onChange={e => setForm(f => ({ ...f, addressLine2: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs text-gray-400">Postal Code</Label>
              <Input className="bg-[#0f1117] border-white/10 text-gray-200 mt-1" value={form.postalCode} onChange={e => setForm(f => ({ ...f, postalCode: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs text-gray-400">Website</Label>
              <Input className="bg-[#0f1117] border-white/10 text-gray-200 mt-1" value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs text-gray-400">Credit Rating</Label>
              <Input className="bg-[#0f1117] border-white/10 text-gray-200 mt-1" placeholder="e.g. AA, BBB+" value={form.creditRating} onChange={e => setForm(f => ({ ...f, creditRating: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs text-gray-400">Payment Terms (days)</Label>
              <Input type="number" className="bg-[#0f1117] border-white/10 text-gray-200 mt-1" value={form.paymentTerms} onChange={e => setForm(f => ({ ...f, paymentTerms: Number(e.target.value) }))} />
            </div>
            <div>
              <Label className="text-xs text-gray-400">Preferred Currency</Label>
              <Input className="bg-[#0f1117] border-white/10 text-gray-200 mt-1" maxLength={3} value={form.preferredCurrency} onChange={e => setForm(f => ({ ...f, preferredCurrency: e.target.value.toUpperCase() }))} />
            </div>
            {form.status === "Blacklisted" && (
              <div className="col-span-2">
                <Label className="text-xs text-gray-400">Blacklist Reason</Label>
                <Textarea className="bg-[#0f1117] border-white/10 text-gray-200 mt-1" rows={2} value={form.blacklistReason} onChange={e => setForm(f => ({ ...f, blacklistReason: e.target.value }))} />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" className="border-white/10 text-gray-400" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button className="bg-red-600 hover:bg-red-700 text-white"
              disabled={upsertMutation.isPending}
              onClick={() => upsertMutation.mutate({
                ...(editingLessor ? { lessorId: Number((editingLessor as Record<string, string | number | boolean | null>).lessor_id) } : {}),
                lessorName: form.lessorName,
                lessorType: form.lessorType as "Individual" | "Company" | "Government" | "REIT" | "Trust",
                registrationNo: form.registrationNo || undefined,
                taxId: form.taxId || undefined,
                country: form.country,
                city: form.city || undefined,
                addressLine1: form.addressLine1 || undefined,
                addressLine2: form.addressLine2 || undefined,
                postalCode: form.postalCode || undefined,
                website: form.website || undefined,
                creditRating: form.creditRating || undefined,
                paymentTerms: form.paymentTerms,
                preferredCurrency: form.preferredCurrency,
                status: form.status as "Active" | "Inactive" | "Blacklisted",
                blacklistReason: form.blacklistReason || undefined,
              })}>
              {upsertMutation.isPending ? "Saving..." : "Save Lessor"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Contact Form Dialog ─────────────────────────────────────────────── */}
      <Dialog open={showContactForm} onOpenChange={setShowContactForm}>
        <DialogContent className="bg-[#1a1d2e] border-white/10 text-gray-100 max-w-lg">
          <DialogHeader><DialogTitle className="text-white">Add Contact</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            <div>
              <Label className="text-xs text-gray-400">Contact Type</Label>
              <Select value={contactForm.contactType} onValueChange={v => setContactForm(f => ({ ...f, contactType: v }))}>
                <SelectTrigger className="bg-[#0f1117] border-white/10 text-gray-200 mt-1"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#1a1d2e] border-white/10 text-gray-200">
                  {CONTACT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-gray-400">Full Name *</Label>
              <Input className="bg-[#0f1117] border-white/10 text-gray-200 mt-1" value={contactForm.fullName} onChange={e => setContactForm(f => ({ ...f, fullName: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs text-gray-400">Job Title</Label>
              <Input className="bg-[#0f1117] border-white/10 text-gray-200 mt-1" value={contactForm.jobTitle} onChange={e => setContactForm(f => ({ ...f, jobTitle: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs text-gray-400">Department</Label>
              <Input className="bg-[#0f1117] border-white/10 text-gray-200 mt-1" value={contactForm.department} onChange={e => setContactForm(f => ({ ...f, department: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs text-gray-400">Email</Label>
              <Input type="email" className="bg-[#0f1117] border-white/10 text-gray-200 mt-1" value={contactForm.email} onChange={e => setContactForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs text-gray-400">Phone Primary</Label>
              <Input className="bg-[#0f1117] border-white/10 text-gray-200 mt-1" value={contactForm.phonePrimary} onChange={e => setContactForm(f => ({ ...f, phonePrimary: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs text-gray-400">Phone Secondary</Label>
              <Input className="bg-[#0f1117] border-white/10 text-gray-200 mt-1" value={contactForm.phoneSecondary} onChange={e => setContactForm(f => ({ ...f, phoneSecondary: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs text-gray-400">WhatsApp</Label>
              <Input className="bg-[#0f1117] border-white/10 text-gray-200 mt-1" value={contactForm.whatsapp} onChange={e => setContactForm(f => ({ ...f, whatsapp: e.target.value }))} />
            </div>
            <div className="col-span-2">
              <Label className="text-xs text-gray-400">Notes</Label>
              <Textarea className="bg-[#0f1117] border-white/10 text-gray-200 mt-1" rows={2} value={contactForm.notes} onChange={e => setContactForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="border-white/10 text-gray-400" onClick={() => setShowContactForm(false)}>Cancel</Button>
            <Button className="bg-red-600 hover:bg-red-700 text-white" disabled={contactMutation.isPending}
              onClick={() => contactMutation.mutate({
                lessorId: selectedLessorId!,
                contactType: contactForm.contactType as "Primary" | "Finance" | "Legal" | "Operations" | "Emergency",
                fullName: contactForm.fullName,
                jobTitle: contactForm.jobTitle || undefined,
                department: contactForm.department || undefined,
                email: contactForm.email || undefined,
                phonePrimary: contactForm.phonePrimary || undefined,
                phoneSecondary: contactForm.phoneSecondary || undefined,
                whatsapp: contactForm.whatsapp || undefined,
                isPrimary: contactForm.isPrimary,
                notes: contactForm.notes || undefined,
              })}>
              {contactMutation.isPending ? "Saving..." : "Save Contact"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Bank Account Form Dialog ────────────────────────────────────────── */}
      <Dialog open={showBankForm} onOpenChange={setShowBankForm}>
        <DialogContent className="bg-[#1a1d2e] border-white/10 text-gray-100 max-w-lg">
          <DialogHeader><DialogTitle className="text-white">Add Bank Account</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            <div>
              <Label className="text-xs text-gray-400">Bank Name *</Label>
              <Input className="bg-[#0f1117] border-white/10 text-gray-200 mt-1" value={bankForm.bankName} onChange={e => setBankForm(f => ({ ...f, bankName: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs text-gray-400">Account Name *</Label>
              <Input className="bg-[#0f1117] border-white/10 text-gray-200 mt-1" value={bankForm.accountName} onChange={e => setBankForm(f => ({ ...f, accountName: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs text-gray-400">Account Number *</Label>
              <Input className="bg-[#0f1117] border-white/10 text-gray-200 mt-1" value={bankForm.accountNumber} onChange={e => setBankForm(f => ({ ...f, accountNumber: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs text-gray-400">IBAN</Label>
              <Input className="bg-[#0f1117] border-white/10 text-gray-200 mt-1" value={bankForm.iban} onChange={e => setBankForm(f => ({ ...f, iban: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs text-gray-400">SWIFT Code</Label>
              <Input className="bg-[#0f1117] border-white/10 text-gray-200 mt-1" value={bankForm.swiftCode} onChange={e => setBankForm(f => ({ ...f, swiftCode: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs text-gray-400">Currency</Label>
              <Input className="bg-[#0f1117] border-white/10 text-gray-200 mt-1" maxLength={3} value={bankForm.currency} onChange={e => setBankForm(f => ({ ...f, currency: e.target.value.toUpperCase() }))} />
            </div>
            <div>
              <Label className="text-xs text-gray-400">Account Type</Label>
              <Select value={bankForm.accountType} onValueChange={v => setBankForm(f => ({ ...f, accountType: v }))}>
                <SelectTrigger className="bg-[#0f1117] border-white/10 text-gray-200 mt-1"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#1a1d2e] border-white/10 text-gray-200">
                  {ACCOUNT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-gray-400">Branch Name</Label>
              <Input className="bg-[#0f1117] border-white/10 text-gray-200 mt-1" value={bankForm.branchName} onChange={e => setBankForm(f => ({ ...f, branchName: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs text-gray-400">Country (2-letter)</Label>
              <Input className="bg-[#0f1117] border-white/10 text-gray-200 mt-1" maxLength={2} value={bankForm.country} onChange={e => setBankForm(f => ({ ...f, country: e.target.value.toUpperCase() }))} />
            </div>
            <div>
              <Label className="text-xs text-gray-400">Verified By</Label>
              <Input className="bg-[#0f1117] border-white/10 text-gray-200 mt-1" value={bankForm.verifiedBy} onChange={e => setBankForm(f => ({ ...f, verifiedBy: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="border-white/10 text-gray-400" onClick={() => setShowBankForm(false)}>Cancel</Button>
            <Button className="bg-red-600 hover:bg-red-700 text-white" disabled={bankMutation.isPending}
              onClick={() => bankMutation.mutate({
                lessorId: selectedLessorId!,
                bankName: bankForm.bankName,
                accountName: bankForm.accountName,
                accountNumber: bankForm.accountNumber,
                iban: bankForm.iban || undefined,
                swiftCode: bankForm.swiftCode || undefined,
                routingNumber: bankForm.routingNumber || undefined,
                currency: bankForm.currency,
                accountType: bankForm.accountType as "Current" | "Savings" | "Fixed",
                branchName: bankForm.branchName || undefined,
                branchCode: bankForm.branchCode || undefined,
                country: bankForm.country,
                isPrimary: bankForm.isPrimary,
                verifiedBy: bankForm.verifiedBy || undefined,
              })}>
              {bankMutation.isPending ? "Saving..." : "Save Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Note Form Dialog ────────────────────────────────────────────────── */}
      <Dialog open={showNoteForm} onOpenChange={setShowNoteForm}>
        <DialogContent className="bg-[#1a1d2e] border-white/10 text-gray-100 max-w-lg">
          <DialogHeader><DialogTitle className="text-white">Add Note</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-gray-400">Note Type</Label>
                <Select value={noteForm.noteType} onValueChange={v => setNoteForm(f => ({ ...f, noteType: v }))}>
                  <SelectTrigger className="bg-[#0f1117] border-white/10 text-gray-200 mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-[#1a1d2e] border-white/10 text-gray-200">
                    {NOTE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-gray-400">Subject *</Label>
                <Input className="bg-[#0f1117] border-white/10 text-gray-200 mt-1" value={noteForm.subject} onChange={e => setNoteForm(f => ({ ...f, subject: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label className="text-xs text-gray-400">Note *</Label>
              <Textarea className="bg-[#0f1117] border-white/10 text-gray-200 mt-1" rows={4} value={noteForm.noteText} onChange={e => setNoteForm(f => ({ ...f, noteText: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="border-white/10 text-gray-400" onClick={() => setShowNoteForm(false)}>Cancel</Button>
            <Button className="bg-red-600 hover:bg-red-700 text-white" disabled={noteMutation.isPending}
              onClick={() => noteMutation.mutate({
                lessorId: selectedLessorId!,
                noteType: noteForm.noteType as "General" | "Legal" | "Financial" | "Dispute" | "Negotiation",
                subject: noteForm.subject,
                noteText: noteForm.noteText,
                isPrivate: noteForm.isPrivate,
              })}>
              {noteMutation.isPending ? "Saving..." : "Save Note"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
