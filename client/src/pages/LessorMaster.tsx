import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ScreenHeader } from "@/components/ScreenHeader";
import { GenAIFillButton } from "@/components/GenAIFillButton";
import {
  Building2, Plus, Search, Phone, Mail, CreditCard,
  FileText, ChevronRight, MapPin, ArrowLeft
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

type ActiveForm = "lessor" | "contact" | "bank" | "note" | null;

const EMPTY_FORM = { lessorName: "", lessorType: "Company", registrationNo: "", taxId: "", country: "AE", city: "", addressLine1: "", addressLine2: "", postalCode: "", website: "", creditRating: "", paymentTerms: 30, preferredCurrency: "AED", status: "Active", blacklistReason: "" };
const EMPTY_CONTACT = { contactType: "Primary", fullName: "", jobTitle: "", department: "", email: "", phonePrimary: "", phoneSecondary: "", whatsapp: "", isPrimary: false, notes: "" };
const EMPTY_BANK = { bankName: "", accountName: "", accountNumber: "", iban: "", swiftCode: "", currency: "AED", accountType: "Current", branchName: "", country: "AE", verifiedBy: "" };
const EMPTY_NOTE = { noteType: "General", subject: "", noteText: "", isPrivate: false };

export default function LessorMaster() {
  const [search, setSearch] = useState("");
  const [aiRows, setAiRows] = useState<Record<string, unknown>[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [selectedLessorId, setSelectedLessorId] = useState<number | null>(null);
  const [activeForm, setActiveForm] = useState<ActiveForm>(null);
  const [editingLessor, setEditingLessor] = useState<Record<string, unknown> | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [contactForm, setContactForm] = useState(EMPTY_CONTACT);
  const [bankForm, setBankForm] = useState(EMPTY_BANK);
  const [noteForm, setNoteForm] = useState(EMPTY_NOTE);

  const listQuery = trpc.lessor.getLessors.useQuery({
    searchTerm: search || undefined,
    status: statusFilter !== "all" ? (statusFilter as "Active" | "Inactive" | "Blacklisted") : undefined,
    lessorType: typeFilter !== "all" ? typeFilter : undefined,
    pageNumber: page,
    pageSize: 20,
  });
  const detailQuery = trpc.lessor.getLessorDetail.useQuery(
    { lessorId: selectedLessorId! },
    { enabled: !!selectedLessorId }
  );

  const utils = trpc.useUtils();
  const upsertMutation = trpc.lessor.upsertLessor.useMutation({
    onSuccess: () => {
      toast.success(editingLessor ? "Lessor updated" : "Lessor created");
      setActiveForm(null); setEditingLessor(null);
      utils.lessor.getLessors.invalidate();
      if (selectedLessorId) utils.lessor.getLessorDetail.invalidate({ lessorId: selectedLessorId });
    },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.lessor.deleteLessor.useMutation({
    onSuccess: () => { toast.success("Lessor deleted"); setSelectedLessorId(null); utils.lessor.getLessors.invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  const contactMutation = trpc.lessor.upsertContact.useMutation({
    onSuccess: () => { toast.success("Contact saved"); setActiveForm(null); if (selectedLessorId) utils.lessor.getLessorDetail.invalidate({ lessorId: selectedLessorId }); },
    onError: (e) => toast.error(e.message),
  });
  const deleteContactMutation = trpc.lessor.deleteContact.useMutation({
    onSuccess: () => { toast.success("Contact removed"); if (selectedLessorId) utils.lessor.getLessorDetail.invalidate({ lessorId: selectedLessorId }); },
  });
  const bankMutation = trpc.lessor.upsertBankAccount.useMutation({
    onSuccess: () => { toast.success("Bank account saved"); setActiveForm(null); if (selectedLessorId) utils.lessor.getLessorDetail.invalidate({ lessorId: selectedLessorId }); },
    onError: (e) => toast.error(e.message),
  });
  const deleteBankMutation = trpc.lessor.deleteBankAccount.useMutation({
    onSuccess: () => { toast.success("Bank account removed"); if (selectedLessorId) utils.lessor.getLessorDetail.invalidate({ lessorId: selectedLessorId }); },
  });
  const noteMutation = trpc.lessor.addNote.useMutation({
    onSuccess: () => { toast.success("Note added"); setActiveForm(null); if (selectedLessorId) utils.lessor.getLessorDetail.invalidate({ lessorId: selectedLessorId }); },
    onError: (e) => toast.error(e.message),
  });

  const handleAIFormFill = (data: Record<string, string>) => {
    setForm(f => ({
      ...f,
      lessorName: data.lessor_name ?? data.lessorName ?? f.lessorName,
      lessorType: data.lessor_type ?? data.lessorType ?? f.lessorType,
      registrationNo: data.registration_no ?? data.registrationNo ?? f.registrationNo,
      taxId: data.tax_id ?? data.taxId ?? f.taxId,
      country: data.country ?? f.country,
      city: data.city ?? f.city,
      addressLine1: data.address_line1 ?? data.addressLine1 ?? f.addressLine1,
      addressLine2: data.address_line2 ?? data.addressLine2 ?? f.addressLine2,
      postalCode: data.postal_code ?? data.postalCode ?? f.postalCode,
      website: data.website ?? f.website,
      creditRating: data.credit_rating ?? data.creditRating ?? f.creditRating,
      paymentTerms: data.payment_terms ? Number(data.payment_terms) : f.paymentTerms,
      preferredCurrency: data.preferred_currency ?? data.preferredCurrency ?? f.preferredCurrency,
      status: data.status ?? f.status,
    }));
    setEditingLessor(null);
    setActiveForm("lessor");
  };

  const detail = detailQuery.data as any;
  const lessors = aiRows.length > 0 ? aiRows as any[] : ((listQuery.data?.lessors ?? []) as any[]);
  const total = listQuery.data?.total ?? 0;

  // ─── FORM: Lessor ──────────────────────────────────────────────────────────
  if (activeForm === "lessor") {
    return (
      <div className="flex flex-col h-full w-full bg-[#0f1117] text-gray-100">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#13161f] shrink-0">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white" onClick={() => { setActiveForm(null); setEditingLessor(null); }}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h2 className="text-lg font-semibold text-white">{editingLessor ? "Edit Lessor" : "New Lessor"}</h2>
              <p className="text-xs text-gray-500">Fill in lessor details. Use Gen AI to auto-fill.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ScreenHeader screenId="VFLSLESSOR001" title="" formType="lessor" onAIFormFill={handleAIFormFill} />
            <Button variant="outline" className="border-white/10 text-gray-400" onClick={() => { setActiveForm(null); setEditingLessor(null); }}>Cancel</Button>
            <Button className="bg-red-600 hover:bg-red-700 text-white" disabled={upsertMutation.isPending}
              onClick={() => upsertMutation.mutate({
                ...(editingLessor ? { lessorId: Number(editingLessor.lessor_id) } : {}),
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
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-8 py-6">
          <div className="max-w-3xl mx-auto grid grid-cols-2 gap-5">
            <div className="col-span-2">
              <Label className="text-xs text-gray-400">Lessor Name *</Label>
              <Input className="bg-[#1a1d2e] border-white/10 text-gray-200 mt-1" value={form.lessorName} onChange={e => setForm(f => ({ ...f, lessorName: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs text-gray-400">Type</Label>
              <Select value={form.lessorType} onValueChange={v => setForm(f => ({ ...f, lessorType: v }))}>
                <SelectTrigger className="bg-[#1a1d2e] border-white/10 text-gray-200 mt-1"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#1a1d2e] border-white/10 text-gray-200">
                  {LESSOR_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-gray-400">Status</Label>
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                <SelectTrigger className="bg-[#1a1d2e] border-white/10 text-gray-200 mt-1"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#1a1d2e] border-white/10 text-gray-200">
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                  <SelectItem value="Blacklisted">Blacklisted</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-gray-400">Registration No</Label>
              <Input className="bg-[#1a1d2e] border-white/10 text-gray-200 mt-1" value={form.registrationNo} onChange={e => setForm(f => ({ ...f, registrationNo: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs text-gray-400">Tax ID</Label>
              <Input className="bg-[#1a1d2e] border-white/10 text-gray-200 mt-1" value={form.taxId} onChange={e => setForm(f => ({ ...f, taxId: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs text-gray-400">Country (2-letter)</Label>
              <Input className="bg-[#1a1d2e] border-white/10 text-gray-200 mt-1" maxLength={2} value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value.toUpperCase() }))} />
            </div>
            <div>
              <Label className="text-xs text-gray-400">City</Label>
              <Input className="bg-[#1a1d2e] border-white/10 text-gray-200 mt-1" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
            </div>
            <div className="col-span-2">
              <Label className="text-xs text-gray-400">Address Line 1</Label>
              <Input className="bg-[#1a1d2e] border-white/10 text-gray-200 mt-1" value={form.addressLine1} onChange={e => setForm(f => ({ ...f, addressLine1: e.target.value }))} />
            </div>
            <div className="col-span-2">
              <Label className="text-xs text-gray-400">Address Line 2</Label>
              <Input className="bg-[#1a1d2e] border-white/10 text-gray-200 mt-1" value={form.addressLine2} onChange={e => setForm(f => ({ ...f, addressLine2: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs text-gray-400">Postal Code</Label>
              <Input className="bg-[#1a1d2e] border-white/10 text-gray-200 mt-1" value={form.postalCode} onChange={e => setForm(f => ({ ...f, postalCode: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs text-gray-400">Website</Label>
              <Input className="bg-[#1a1d2e] border-white/10 text-gray-200 mt-1" value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs text-gray-400">Credit Rating</Label>
              <Input className="bg-[#1a1d2e] border-white/10 text-gray-200 mt-1" placeholder="e.g. AA, BBB+" value={form.creditRating} onChange={e => setForm(f => ({ ...f, creditRating: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs text-gray-400">Payment Terms (days)</Label>
              <Input type="number" className="bg-[#1a1d2e] border-white/10 text-gray-200 mt-1" value={form.paymentTerms} onChange={e => setForm(f => ({ ...f, paymentTerms: Number(e.target.value) }))} />
            </div>
            <div>
              <Label className="text-xs text-gray-400">Preferred Currency</Label>
              <Input className="bg-[#1a1d2e] border-white/10 text-gray-200 mt-1" maxLength={3} value={form.preferredCurrency} onChange={e => setForm(f => ({ ...f, preferredCurrency: e.target.value.toUpperCase() }))} />
            </div>
            {form.status === "Blacklisted" && (
              <div className="col-span-2">
                <Label className="text-xs text-gray-400">Blacklist Reason</Label>
                <Textarea className="bg-[#1a1d2e] border-white/10 text-gray-200 mt-1" rows={2} value={form.blacklistReason} onChange={e => setForm(f => ({ ...f, blacklistReason: e.target.value }))} />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ─── FORM: Contact ─────────────────────────────────────────────────────────
  if (activeForm === "contact") {
    return (
      <div className="flex flex-col h-full w-full bg-[#0f1117] text-gray-100">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#13161f] shrink-0">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white" onClick={() => setActiveForm(null)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h2 className="text-lg font-semibold text-white">Add Contact</h2>
              <p className="text-xs text-gray-500">Add a contact person for this lessor</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <GenAIFillButton formType="lessor_contact" onFill={(data) => setContactForm(f => ({
              ...f,
              fullName: data.fullName ? String(data.fullName) : f.fullName,
              jobTitle: data.jobTitle ? String(data.jobTitle) : f.jobTitle,
              department: data.department ? String(data.department) : f.department,
              email: data.email ? String(data.email) : f.email,
              phonePrimary: data.phonePrimary ? String(data.phonePrimary) : f.phonePrimary,
            }))} />
            <Button variant="outline" className="border-white/10 text-gray-400" onClick={() => setActiveForm(null)}>Cancel</Button>
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
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-8 py-6">
          <div className="max-w-2xl mx-auto grid grid-cols-2 gap-5">
            <div>
              <Label className="text-xs text-gray-400">Contact Type</Label>
              <Select value={contactForm.contactType} onValueChange={v => setContactForm(f => ({ ...f, contactType: v }))}>
                <SelectTrigger className="bg-[#1a1d2e] border-white/10 text-gray-200 mt-1"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#1a1d2e] border-white/10 text-gray-200">
                  {CONTACT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-gray-400">Full Name *</Label>
              <Input className="bg-[#1a1d2e] border-white/10 text-gray-200 mt-1" value={contactForm.fullName} onChange={e => setContactForm(f => ({ ...f, fullName: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs text-gray-400">Job Title</Label>
              <Input className="bg-[#1a1d2e] border-white/10 text-gray-200 mt-1" value={contactForm.jobTitle} onChange={e => setContactForm(f => ({ ...f, jobTitle: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs text-gray-400">Department</Label>
              <Input className="bg-[#1a1d2e] border-white/10 text-gray-200 mt-1" value={contactForm.department} onChange={e => setContactForm(f => ({ ...f, department: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs text-gray-400">Email</Label>
              <Input type="email" className="bg-[#1a1d2e] border-white/10 text-gray-200 mt-1" value={contactForm.email} onChange={e => setContactForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs text-gray-400">Phone Primary</Label>
              <Input className="bg-[#1a1d2e] border-white/10 text-gray-200 mt-1" value={contactForm.phonePrimary} onChange={e => setContactForm(f => ({ ...f, phonePrimary: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs text-gray-400">Phone Secondary</Label>
              <Input className="bg-[#1a1d2e] border-white/10 text-gray-200 mt-1" value={contactForm.phoneSecondary} onChange={e => setContactForm(f => ({ ...f, phoneSecondary: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs text-gray-400">WhatsApp</Label>
              <Input className="bg-[#1a1d2e] border-white/10 text-gray-200 mt-1" value={contactForm.whatsapp} onChange={e => setContactForm(f => ({ ...f, whatsapp: e.target.value }))} />
            </div>
            <div className="col-span-2">
              <Label className="text-xs text-gray-400">Notes</Label>
              <Textarea className="bg-[#1a1d2e] border-white/10 text-gray-200 mt-1" rows={3} value={contactForm.notes} onChange={e => setContactForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── FORM: Bank Account ────────────────────────────────────────────────────
  if (activeForm === "bank") {
    return (
      <div className="flex flex-col h-full w-full bg-[#0f1117] text-gray-100">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#13161f] shrink-0">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white" onClick={() => setActiveForm(null)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h2 className="text-lg font-semibold text-white">Add Bank Account</h2>
              <p className="text-xs text-gray-500">Add a bank account for payment processing</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <GenAIFillButton formType="lessor_bank" onFill={(data) => setBankForm(f => ({
              ...f,
              bankName: data.bankName ? String(data.bankName) : f.bankName,
              accountName: data.accountName ? String(data.accountName) : f.accountName,
              accountNumber: data.accountNumber ? String(data.accountNumber) : f.accountNumber,
              iban: data.iban ? String(data.iban) : f.iban,
              swiftCode: data.swiftCode ? String(data.swiftCode) : f.swiftCode,
            }))} />
            <Button variant="outline" className="border-white/10 text-gray-400" onClick={() => setActiveForm(null)}>Cancel</Button>
            <Button className="bg-red-600 hover:bg-red-700 text-white" disabled={bankMutation.isPending}
              onClick={() => bankMutation.mutate({
                lessorId: selectedLessorId!,
                bankName: bankForm.bankName,
                accountName: bankForm.accountName,
                accountNumber: bankForm.accountNumber,
                iban: bankForm.iban || undefined,
                swiftCode: bankForm.swiftCode || undefined,
                currency: bankForm.currency,
                accountType: bankForm.accountType as "Current" | "Savings" | "Fixed",
                branchName: bankForm.branchName || undefined,
                country: bankForm.country,
                verifiedBy: bankForm.verifiedBy || undefined,
              })}>
              {bankMutation.isPending ? "Saving..." : "Save Account"}
            </Button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-8 py-6">
          <div className="max-w-2xl mx-auto grid grid-cols-2 gap-5">
            <div>
              <Label className="text-xs text-gray-400">Bank Name *</Label>
              <Input className="bg-[#1a1d2e] border-white/10 text-gray-200 mt-1" value={bankForm.bankName} onChange={e => setBankForm(f => ({ ...f, bankName: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs text-gray-400">Account Name *</Label>
              <Input className="bg-[#1a1d2e] border-white/10 text-gray-200 mt-1" value={bankForm.accountName} onChange={e => setBankForm(f => ({ ...f, accountName: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs text-gray-400">Account Number *</Label>
              <Input className="bg-[#1a1d2e] border-white/10 text-gray-200 mt-1" value={bankForm.accountNumber} onChange={e => setBankForm(f => ({ ...f, accountNumber: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs text-gray-400">IBAN</Label>
              <Input className="bg-[#1a1d2e] border-white/10 text-gray-200 mt-1" value={bankForm.iban} onChange={e => setBankForm(f => ({ ...f, iban: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs text-gray-400">SWIFT Code</Label>
              <Input className="bg-[#1a1d2e] border-white/10 text-gray-200 mt-1" value={bankForm.swiftCode} onChange={e => setBankForm(f => ({ ...f, swiftCode: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs text-gray-400">Currency</Label>
              <Input className="bg-[#1a1d2e] border-white/10 text-gray-200 mt-1" maxLength={3} value={bankForm.currency} onChange={e => setBankForm(f => ({ ...f, currency: e.target.value.toUpperCase() }))} />
            </div>
            <div>
              <Label className="text-xs text-gray-400">Account Type</Label>
              <Select value={bankForm.accountType} onValueChange={v => setBankForm(f => ({ ...f, accountType: v }))}>
                <SelectTrigger className="bg-[#1a1d2e] border-white/10 text-gray-200 mt-1"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#1a1d2e] border-white/10 text-gray-200">
                  {ACCOUNT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-gray-400">Branch Name</Label>
              <Input className="bg-[#1a1d2e] border-white/10 text-gray-200 mt-1" value={bankForm.branchName} onChange={e => setBankForm(f => ({ ...f, branchName: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs text-gray-400">Country (2-letter)</Label>
              <Input className="bg-[#1a1d2e] border-white/10 text-gray-200 mt-1" maxLength={2} value={bankForm.country} onChange={e => setBankForm(f => ({ ...f, country: e.target.value.toUpperCase() }))} />
            </div>
            <div>
              <Label className="text-xs text-gray-400">Verified By</Label>
              <Input className="bg-[#1a1d2e] border-white/10 text-gray-200 mt-1" value={bankForm.verifiedBy} onChange={e => setBankForm(f => ({ ...f, verifiedBy: e.target.value }))} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── FORM: Note ────────────────────────────────────────────────────────────
  if (activeForm === "note") {
    return (
      <div className="flex flex-col h-full w-full bg-[#0f1117] text-gray-100">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#13161f] shrink-0">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white" onClick={() => setActiveForm(null)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h2 className="text-lg font-semibold text-white">Add Note</h2>
              <p className="text-xs text-gray-500">Add a note or comment about this lessor</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <GenAIFillButton formType="lessor_note" onFill={(data) => setNoteForm(f => ({
              ...f,
              subject: data.subject ? String(data.subject) : f.subject,
              noteText: data.noteText ? String(data.noteText) : f.noteText,
            }))} />
            <Button variant="outline" className="border-white/10 text-gray-400" onClick={() => setActiveForm(null)}>Cancel</Button>
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
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-8 py-6">
          <div className="max-w-2xl mx-auto space-y-5">
            <div className="grid grid-cols-2 gap-5">
              <div>
                <Label className="text-xs text-gray-400">Note Type</Label>
                <Select value={noteForm.noteType} onValueChange={v => setNoteForm(f => ({ ...f, noteType: v }))}>
                  <SelectTrigger className="bg-[#1a1d2e] border-white/10 text-gray-200 mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-[#1a1d2e] border-white/10 text-gray-200">
                    {NOTE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-gray-400">Subject *</Label>
                <Input className="bg-[#1a1d2e] border-white/10 text-gray-200 mt-1" value={noteForm.subject} onChange={e => setNoteForm(f => ({ ...f, subject: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label className="text-xs text-gray-400">Note *</Label>
              <Textarea className="bg-[#1a1d2e] border-white/10 text-gray-200 mt-1" rows={10} value={noteForm.noteText} onChange={e => setNoteForm(f => ({ ...f, noteText: e.target.value }))} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── MAIN: List + Detail ───────────────────────────────────────────────────
  return (
    <div className="flex h-full bg-[#0f1117] text-gray-100">
      {/* Left: Lessor List */}
      <div className="w-[340px] min-w-[260px] border-r border-white/10 flex flex-col bg-[#13161f] shrink-0">
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-red-400" />
              <h2 className="font-semibold text-white">Lessor Master</h2>
              <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">{total}</Badge>
            </div>
            <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white h-7 px-2 text-xs"
              onClick={() => { setEditingLessor(null); setForm(EMPTY_FORM); setActiveForm("lessor"); }}>
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
              <SelectTrigger className="h-7 text-xs bg-[#1a1d2e] border-white/10 text-gray-300 flex-1"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent className="bg-[#1a1d2e] border-white/10 text-gray-200">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
                <SelectItem value="Blacklisted">Blacklisted</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={v => { setTypeFilter(v); setPage(1); }}>
              <SelectTrigger className="h-7 text-xs bg-[#1a1d2e] border-white/10 text-gray-300 flex-1"><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent className="bg-[#1a1d2e] border-white/10 text-gray-200">
                <SelectItem value="all">All Types</SelectItem>
                {LESSOR_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {listQuery.isLoading ? (
            <div className="flex items-center justify-center h-32 text-gray-500 text-sm">Loading...</div>
          ) : lessors.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-gray-500 gap-2">
              <Building2 className="w-8 h-8 opacity-30" />
              <p className="text-sm">No lessors found</p>
            </div>
          ) : lessors.map((l: any) => (
            <div key={String(l.lessor_id)}
              className={`p-3 border-b border-white/5 cursor-pointer hover:bg-white/5 transition-colors ${selectedLessorId === Number(l.lessor_id) ? "bg-red-500/10 border-l-2 border-l-red-500" : ""}`}
              onClick={() => setSelectedLessorId(Number(l.lessor_id))}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{String(l.lessor_name)}</p>
                  <p className="text-xs text-gray-500 truncate">{String(l.lessor_type)} · {String(l.country)}</p>
                  {l.city && <p className="text-xs text-gray-600 truncate flex items-center gap-1 mt-0.5"><MapPin className="w-2.5 h-2.5" />{String(l.city)}</p>}
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <Badge className={`text-[10px] px-1.5 py-0 border ${STATUS_COLORS[String(l.status)] ?? ""}`}>{String(l.status)}</Badge>
                  {Number(l.asset_count) > 0 && <span className="text-[10px] text-gray-500">{Number(l.asset_count)} assets</span>}
                </div>
              </div>
              {Number(l.active_leases) > 0 && (
                <div className="mt-1.5"><span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded">{Number(l.active_leases)} active leases</span></div>
              )}
            </div>
          ))}
        </div>
        {total > 20 && (
          <div className="p-2 border-t border-white/10 flex items-center justify-between">
            <Button variant="outline" size="sm" className="h-6 text-xs border-white/10 text-gray-400" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
            <span className="text-xs text-gray-500">Page {page} of {Math.ceil(total / 20)}</span>
            <Button variant="outline" size="sm" className="h-6 text-xs border-white/10 text-gray-400" disabled={page >= Math.ceil(total / 20)} onClick={() => setPage(p => p + 1)}>Next</Button>
          </div>
        )}
      </div>

      {/* Right: Detail */}
      <div className="flex-1 overflow-y-auto">
        {!selectedLessorId ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-3">
            <Building2 className="w-16 h-16 opacity-20" />
            <p className="text-base font-medium">Select a lessor to view details</p>
            <p className="text-sm opacity-60">Or click New to create a new lessor</p>
          </div>
        ) : detailQuery.isLoading ? (
          <div className="flex items-center justify-center h-full text-gray-500">Loading...</div>
        ) : !detail ? (
          <div className="flex items-center justify-center h-full text-gray-500">Lessor not found</div>
        ) : (
          <div className="p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-white">{String(detail.lessor?.lessor_name ?? "")}</h2>
                <p className="text-sm text-gray-400 mt-1">{String(detail.lessor?.lessor_type ?? "")} · {String(detail.lessor?.country ?? "")}</p>
              </div>
              <div className="flex items-center gap-2">
                <ScreenHeader screenId="VFLSLESSOR001" title="" screenType="lessor_master" onAIData={(rows) => setAiRows(rows)} />
                <Button size="sm" variant="outline" className="border-white/10 text-gray-300 h-8 text-xs"
                  onClick={() => {
                    const l = detail.lessor;
                    setEditingLessor(l);
                    setForm({
                      lessorName: String(l.lessor_name ?? ""), lessorType: String(l.lessor_type ?? "Company"),
                      registrationNo: String(l.registration_no ?? ""), taxId: String(l.tax_id ?? ""),
                      country: String(l.country ?? "AE"), city: String(l.city ?? ""),
                      addressLine1: String(l.address_line1 ?? ""), addressLine2: String(l.address_line2 ?? ""),
                      postalCode: String(l.postal_code ?? ""), website: String(l.website ?? ""),
                      creditRating: String(l.credit_rating ?? ""), paymentTerms: Number(l.payment_terms ?? 30),
                      preferredCurrency: String(l.preferred_currency ?? "AED"), status: String(l.status ?? "Active"),
                      blacklistReason: String(l.blacklist_reason ?? ""),
                    });
                    setActiveForm("lessor");
                  }}>Edit</Button>
                <Button size="sm" variant="outline" className="border-red-500/30 text-red-400 h-8 text-xs hover:bg-red-500/10"
                  disabled={deleteMutation.isPending}
                  onClick={() => { if (confirm("Delete this lessor?")) deleteMutation.mutate({ lessorId: selectedLessorId }); }}>Delete</Button>
              </div>
            </div>

            <Tabs defaultValue="overview">
              <TabsList className="bg-[#1a1d2e] border border-white/10 mb-4">
                <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
                <TabsTrigger value="contacts" className="text-xs">Contacts</TabsTrigger>
                <TabsTrigger value="bank" className="text-xs">Bank Accounts</TabsTrigger>
                <TabsTrigger value="assets" className="text-xs">Assets</TabsTrigger>
                <TabsTrigger value="documents" className="text-xs">Documents</TabsTrigger>
                <TabsTrigger value="notes" className="text-xs">Notes</TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <div className="grid grid-cols-3 gap-4">
                  {[
                    ["Registration No", detail.lessor?.registration_no],
                    ["Tax ID", detail.lessor?.tax_id],
                    ["Country", detail.lessor?.country],
                    ["City", detail.lessor?.city],
                    ["Credit Rating", detail.lessor?.credit_rating],
                    ["Payment Terms", detail.lessor?.payment_terms ? `${detail.lessor.payment_terms} days` : null],
                    ["Currency", detail.lessor?.preferred_currency],
                    ["Website", detail.lessor?.website],
                  ].filter(([, v]) => v).map(([label, value]) => (
                    <div key={String(label)} className="bg-[#1a1d2e] rounded-lg p-3 border border-white/10">
                      <p className="text-xs text-gray-500 mb-1">{String(label)}</p>
                      <p className="text-sm text-white font-medium">{String(value)}</p>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="contacts">
                <div className="flex justify-end mb-3">
                  <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white text-xs h-7"
                    onClick={() => { setContactForm(EMPTY_CONTACT); setActiveForm("contact"); }}>
                    <Plus className="w-3 h-3 mr-1" /> Add Contact
                  </Button>
                </div>
                <div className="space-y-2">
                  {(detail.contacts ?? []).map((c: any) => (
                    <Card key={String(c.contact_id)} className="bg-[#1a1d2e] border-white/10">
                      <CardContent className="p-4 flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium text-white">{String(c.full_name)}</p>
                          <p className="text-xs text-gray-500">{String(c.job_title ?? "")} {c.department ? `· ${c.department}` : ""}</p>
                          {c.email && <p className="text-xs text-blue-400 mt-1 flex items-center gap-1"><Mail className="w-3 h-3" />{String(c.email)}</p>}
                          {c.phone_primary && <p className="text-xs text-gray-400 flex items-center gap-1"><Phone className="w-3 h-3" />{String(c.phone_primary)}</p>}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="text-[10px] bg-blue-500/20 text-blue-400 border-blue-500/30">{String(c.contact_type)}</Badge>
                          <Button size="sm" variant="ghost" className="h-6 text-xs text-red-400 hover:text-red-300"
                            onClick={() => deleteContactMutation.mutate({ contactId: Number(c.contact_id), lessorId: selectedLessorId! })}>Remove</Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {(detail.contacts ?? []).length === 0 && <p className="text-gray-500 text-sm text-center py-8">No contacts added yet</p>}
                </div>
              </TabsContent>

              <TabsContent value="bank">
                <div className="flex justify-end mb-3">
                  <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white text-xs h-7"
                    onClick={() => { setBankForm(EMPTY_BANK); setActiveForm("bank"); }}>
                    <Plus className="w-3 h-3 mr-1" /> Add Bank Account
                  </Button>
                </div>
                <div className="space-y-2">
                  {(detail.bankAccounts ?? []).map((b: any) => (
                    <Card key={String(b.account_id)} className="bg-[#1a1d2e] border-white/10">
                      <CardContent className="p-4 flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium text-white">{String(b.bank_name)}</p>
                          <p className="text-xs text-gray-500">{String(b.account_name)} · {String(b.account_number)}</p>
                          {b.iban && <p className="text-xs text-gray-400 mt-1 flex items-center gap-1"><CreditCard className="w-3 h-3" />IBAN: {String(b.iban)}</p>}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="text-[10px] bg-green-500/20 text-green-400 border-green-500/30">{String(b.currency)}</Badge>
                          <Button size="sm" variant="ghost" className="h-6 text-xs text-red-400 hover:text-red-300"
                            onClick={() => deleteBankMutation.mutate({ bankAccId: Number(b.account_id), lessorId: selectedLessorId! })}>Remove</Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {(detail.bankAccounts ?? []).length === 0 && <p className="text-gray-500 text-sm text-center py-8">No bank accounts added yet</p>}
                </div>
              </TabsContent>

              <TabsContent value="assets">
                <div className="space-y-2">
                  {(detail.assets ?? []).map((a: any) => (
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
                  {(detail.assets ?? []).length === 0 && <p className="text-gray-500 text-sm text-center py-8">No assets linked to this lessor</p>}
                </div>
              </TabsContent>

              <TabsContent value="documents">
                <div className="space-y-2">
                  {(detail.documents ?? []).map((d: any) => (
                    <div key={String(d.doc_id)} className="flex items-center justify-between p-3 bg-[#1a1d2e] rounded-lg border border-white/10">
                      <div className="flex items-center gap-3">
                        <FileText className="w-4 h-4 text-blue-400" />
                        <div>
                          <p className="text-sm text-white">{String(d.doc_name)}</p>
                          <p className="text-xs text-gray-500">{String(d.doc_type)} {d.doc_number ? `· ${d.doc_number}` : ""}</p>
                        </div>
                      </div>
                      {d.expiry_date && <p className="text-xs text-gray-500">Expires: {new Date(String(d.expiry_date)).toLocaleDateString()}</p>}
                    </div>
                  ))}
                  {(detail.documents ?? []).length === 0 && <p className="text-gray-500 text-sm text-center py-8">No documents uploaded</p>}
                </div>
              </TabsContent>

              <TabsContent value="notes">
                <div className="flex justify-end mb-3">
                  <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white text-xs h-7"
                    onClick={() => { setNoteForm(EMPTY_NOTE); setActiveForm("note"); }}>
                    <Plus className="w-3 h-3 mr-1" /> Add Note
                  </Button>
                </div>
                <div className="space-y-3">
                  {(detail.notes ?? []).map((n: any) => (
                    <Card key={String(n.note_id)} className="bg-[#1a1d2e] border-white/10">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="text-sm font-medium text-white">{String(n.subject)}</p>
                            <p className="text-xs text-gray-500">{String(n.note_type)} · {new Date(String(n.created_at)).toLocaleDateString()}</p>
                          </div>
                          {n.is_private && <Badge className="text-[10px] bg-orange-500/20 text-orange-400 border-orange-500/30">Private</Badge>}
                        </div>
                        <p className="text-xs text-gray-300 whitespace-pre-wrap">{String(n.note_text)}</p>
                      </CardContent>
                    </Card>
                  ))}
                  {(detail.notes ?? []).length === 0 && <p className="text-gray-500 text-sm text-center py-8">No notes added yet</p>}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
}
