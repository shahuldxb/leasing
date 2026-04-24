import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import SlidePanel from "@/components/SlidePanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShieldCheck, PlusCircle, Search, Banknote, AlertTriangle, CheckCircle2, Clock, Scissors } from "lucide-react";
import { toast } from "sonner";
import { ScreenHeader } from "@/components/ScreenHeader";
import { GenAIFillButton } from "@/components/GenAIFillButton";

const STATUS_COLORS: Record<string, string> = {
  HELD:     "bg-blue-500/20 text-blue-400 border-blue-500/30",
  RELEASED: "bg-green-500/20 text-green-400 border-green-500/30",
  PARTIAL:  "bg-amber-500/20 text-amber-400 border-amber-500/30",
  FORFEITED:"bg-red-500/20 text-red-400 border-red-500/30",
};

const MOCK_DEPOSITS = [
  { deposit_id: 1, contract_ref: "VF-2024-001", property_name: "Vodafone HQ — Floor 12", deposit_amount: 45000, deposit_currency: "AED", deposit_date: "2024-01-15", deposit_type: "BANK_TRANSFER", bank_ref: "BT-2024-001", status: "HELD", released_amount: null, release_date: null, total_deductions: 0, net_refundable: 45000 },
  { deposit_id: 2, contract_ref: "VF-2024-002", property_name: "Vodafone Abu Dhabi", deposit_amount: 18000, deposit_currency: "AED", deposit_date: "2024-03-01", deposit_type: "CHEQUE", bank_ref: "CHQ-2024-002", status: "PARTIAL", released_amount: 12000, release_date: null, total_deductions: 3500, net_refundable: 14500 },
  { deposit_id: 3, contract_ref: "VF-2023-005", property_name: "Vodafone Sharjah", deposit_amount: 22000, deposit_currency: "AED", deposit_date: "2023-06-01", deposit_type: "CASH", bank_ref: null, status: "RELEASED", released_amount: 20500, release_date: "2024-12-15", total_deductions: 1500, net_refundable: 20500 },
  { deposit_id: 4, contract_ref: "VF-2024-003", property_name: "Vodafone Ajman", deposit_amount: 8500, deposit_currency: "AED", deposit_date: "2024-05-10", deposit_type: "BANK_TRANSFER", bank_ref: "BT-2024-004", status: "HELD", released_amount: null, release_date: null, total_deductions: 0, net_refundable: 8500 },
];

const MOCK_DEDUCTIONS = [
  { deduction_id: 1, deposit_id: 2, asset_name: "Ergonomic Chair", deduction_reason: "Torn fabric — beyond normal wear", deduction_amount: 1200, status: "APPROVED", approved_by: "Finance Manager" },
  { deduction_id: 2, deposit_id: 2, asset_name: "Coffee Machine", deduction_reason: "Missing — not returned", deduction_amount: 850, status: "APPROVED", approved_by: "Finance Manager" },
  { deduction_id: 3, deposit_id: 2, asset_name: "55\" Conference Display", deduction_reason: "Cracked screen", deduction_amount: 1450, status: "PENDING", approved_by: null },
];

export default function AssetDepositRegister() {
  const [search, setSearch] = useState("");
  const [aiRows, setAiRows] = useState<Record<string, unknown>[]>([]);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [showAdd, setShowAdd] = useState(false);
  const [showRelease, setShowRelease] = useState(false);
  const [showDeduction, setShowDeduction] = useState(false);
  const [selectedDeposit, setSelectedDeposit] = useState<typeof MOCK_DEPOSITS[0] | null>(null);

  const [addForm, setAddForm] = useState({
    contract_id: "", deposit_amount: "", deposit_currency: "AED",
    deposit_date: "", deposit_type: "BANK_TRANSFER", bank_ref: "", cheque_number: "", notes: "",
  });
  const [releaseForm, setReleaseForm] = useState({ released_amount: "", release_date: "", notes: "" });
  const [deductForm, setDeductForm] = useState({ asset_id: "", deduction_reason: "", deduction_amount: "", notes: "" });

  const { data: leases = [] } = trpc.lease.getLeaseRegister.useQuery({ page: 1, pageSize: 200 });

  const utils = trpc.useUtils();
  const createMut = trpc.assetDeposit.create.useMutation({
    onSuccess: () => { utils.assetDeposit.listAll.invalidate(); toast.success("Deposit created"); },
    onError: (e) => toast.error(e.message),
  });
  const releaseMut = trpc.assetDeposit.release.useMutation({
    onSuccess: () => { utils.assetDeposit.listAll.invalidate(); toast.success("Deposit released"); },
    onError: (e) => toast.error(e.message),
  });
  const leaseList: any[] = Array.isArray(leases) ? leases : (leases as any)?.leases ?? [];

  const filtered = MOCK_DEPOSITS.filter(d => {
    const matchSearch = !search || d.contract_ref.toLowerCase().includes(search.toLowerCase()) || d.property_name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "ALL" || d.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalHeld = MOCK_DEPOSITS.filter(d => d.status === "HELD" || d.status === "PARTIAL").reduce((s, d) => s + d.deposit_amount, 0);
  const totalDeductions = MOCK_DEPOSITS.reduce((s, d) => s + (d.total_deductions ?? 0), 0);
  const totalRefundable = MOCK_DEPOSITS.filter(d => d.status !== "RELEASED").reduce((s, d) => s + d.net_refundable, 0);

  const handleAddSubmit = () => {
    if (!addForm.contract_id || !addForm.deposit_amount || !addForm.deposit_date) {
      toast.error("Lease, Amount and Date are required");
      return;
    }
    toast.success("Asset deposit recorded successfully");
    setShowAdd(false);
  };

  const handleReleaseSubmit = () => {
    if (!releaseForm.released_amount || !releaseForm.release_date) {
      toast.error("Release amount and date are required");
      return;
    }
    toast.success(`Deposit released — AED ${Number(releaseForm.released_amount).toLocaleString()} refunded`);
    setShowRelease(false);
  };

  const handleDeductSubmit = () => {
    if (!deductForm.deduction_reason || !deductForm.deduction_amount) {
      toast.error("Reason and amount are required");
      return;
    }
    toast.success("Deduction submitted for approval");
    setShowDeduction(false);
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <ScreenHeader
  screenId="VFLASSDEP0001P001"
          screenType="asset_deposits"
          onAIData={(rows) => setAiRows(rows)}
  title="Asset Deposit Register"
  subtitle="Deposits held against furnished assets per lease"
/>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Banknote className="w-4 h-4 text-blue-400" />
              <p className="text-xs text-muted-foreground">Total Deposits Held</p>
            </div>
            <p className="text-2xl font-bold text-blue-400">AED {totalHeld.toLocaleString()}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Scissors className="w-4 h-4 text-amber-400" />
              <p className="text-xs text-muted-foreground">Total Deductions</p>
            </div>
            <p className="text-2xl font-bold text-amber-400">AED {totalDeductions.toLocaleString()}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <p className="text-xs text-muted-foreground">Net Refundable</p>
            </div>
            <p className="text-2xl font-bold text-emerald-400">AED {totalRefundable.toLocaleString()}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-purple-400" />
              <p className="text-xs text-muted-foreground">Pending Deductions</p>
            </div>
            <p className="text-2xl font-bold text-purple-400">
              {MOCK_DEDUCTIONS.filter(d => d.status === "PENDING").length}
            </p>
          </div>
        </div>

        <Tabs defaultValue="deposits">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="deposits">Deposit Register</TabsTrigger>
            <TabsTrigger value="deductions">Deductions</TabsTrigger>
          </TabsList>

          <TabsContent value="deposits" className="space-y-4 mt-4">
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input className="pl-9" placeholder="Search lease, property..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="HELD">Held</SelectItem>
                  <SelectItem value="PARTIAL">Partially Released</SelectItem>
                  <SelectItem value="RELEASED">Released</SelectItem>
                  <SelectItem value="FORFEITED">Forfeited</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="text-xs">Lease / Property</TableHead>
                    <TableHead className="text-xs">Deposit Date</TableHead>
                    <TableHead className="text-xs">Type</TableHead>
                    <TableHead className="text-xs">Bank Ref</TableHead>
                    <TableHead className="text-xs text-right">Deposit (AED)</TableHead>
                    <TableHead className="text-xs text-right">Deductions (AED)</TableHead>
                    <TableHead className="text-xs text-right">Net Refundable (AED)</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(d => (
                    <TableRow key={d.deposit_id} className="text-sm hover:bg-muted/30">
                      <TableCell>
                        <div className="font-mono text-xs font-medium">{d.contract_ref}</div>
                        <div className="text-xs text-muted-foreground truncate max-w-[160px]">{d.property_name}</div>
                      </TableCell>
                      <TableCell className="text-xs">{d.deposit_date}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{d.deposit_type.replace("_"," ")}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{d.bank_ref ?? "—"}</TableCell>
                      <TableCell className="text-right font-mono font-medium">{d.deposit_amount.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-mono text-amber-400">{(d.total_deductions ?? 0).toLocaleString()}</TableCell>
                      <TableCell className="text-right font-mono font-bold text-emerald-400">{d.net_refundable.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge className={STATUS_COLORS[d.status] ?? ""}>{d.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {d.status === "HELD" && (
                            <>
                              <Button size="sm" variant="outline" className="h-7 text-xs px-2"
                                onClick={() => { setSelectedDeposit(d); setReleaseForm({ released_amount: String(d.net_refundable), release_date: "", notes: "" }); setShowRelease(true); }}>
                                Release
                              </Button>
                              <Button size="sm" variant="outline" className="h-7 text-xs px-2 text-amber-400 border-amber-500/30"
                                onClick={() => { setSelectedDeposit(d); setShowDeduction(true); }}>
                                Deduct
                              </Button>
                            </>
                          )}
                          {d.status === "PARTIAL" && (
                            <Button size="sm" variant="outline" className="h-7 text-xs px-2"
                              onClick={() => { setSelectedDeposit(d); setReleaseForm({ released_amount: String(d.net_refundable), release_date: "", notes: "" }); setShowRelease(true); }}>
                              Final Release
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="deductions" className="mt-4">
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="text-xs">Deposit Ref</TableHead>
                    <TableHead className="text-xs">Asset</TableHead>
                    <TableHead className="text-xs">Reason</TableHead>
                    <TableHead className="text-xs text-right">Amount (AED)</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs">Approved By</TableHead>
                    <TableHead className="text-xs">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MOCK_DEDUCTIONS.map(d => (
                    <TableRow key={d.deduction_id} className="text-sm hover:bg-muted/30">
                      <TableCell className="font-mono text-xs">DEP-{String(d.deposit_id).padStart(4,"0")}</TableCell>
                      <TableCell>{d.asset_name}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[200px]">{d.deduction_reason}</TableCell>
                      <TableCell className="text-right font-mono font-medium text-amber-400">{d.deduction_amount.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge className={d.status === "APPROVED" ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-amber-500/20 text-amber-400 border-amber-500/30"}>
                          {d.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">{d.approved_by ?? "—"}</TableCell>
                      <TableCell>
                        {d.status === "PENDING" && (
                          <div className="flex gap-1">
                            <Button size="sm" variant="outline" className="h-7 text-xs px-2 text-green-400 border-green-500/30"
                              onClick={() => toast.success("Deduction approved")}>Approve</Button>
                            <Button size="sm" variant="outline" className="h-7 text-xs px-2 text-red-400 border-red-500/30"
                              onClick={() => toast.info("Deduction rejected")}>Reject</Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Record Deposit Panel */}
      <SlidePanel
        open={showAdd}
        onClose={() => setShowAdd(false)}
        title="Record Asset Deposit"
          headerAction={<GenAIFillButton formType="asset_deposit" onFill={(data) => { if (data.deposit_amount !== undefined) setAddForm(f => ({ ...f, deposit_amount: data.deposit_amount as any })); if (data.currency !== undefined) setAddForm(f => ({ ...f, currency: data.currency as any })); if (data.bank_name !== undefined) setAddForm(f => ({ ...f, bank_name: data.bank_name as any })); if (data.bank_ref !== undefined) setAddForm(f => ({ ...f, bank_ref: data.bank_ref as any })); if (data.deposit_date !== undefined) setAddForm(f => ({ ...f, deposit_date: data.deposit_date as any })); if (data.deposit_type !== undefined) setAddForm(f => ({ ...f, deposit_type: data.deposit_type as any })); }} />}
        subtitle="Register a new deposit held against furnished property assets"
        width="xl"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button className="bg-[#e60000] hover:bg-[#cc0000] text-white" onClick={handleAddSubmit}>Record Deposit</Button>
          </>
        }
      >
        <div className="space-y-5">
          <div>
            <Label className="text-sm font-medium">Lease / Property *</Label>
            <Select value={addForm.contract_id} onValueChange={v => setAddForm(f => ({ ...f, contract_id: v }))}>
              <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select lease..." /></SelectTrigger>
              <SelectContent>
                {leaseList.map((l: any) => (
                  <SelectItem key={l.contract_id} value={String(l.contract_id)}>
                    {l.contract_ref} — {l.asset_description}
                  </SelectItem>
                ))}
                {leaseList.length === 0 && (
                  <SelectItem value="demo-1">VF-2024-001 — Vodafone HQ Floor 12</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Deposit Amount *</Label>
              <Input type="number" className="mt-1.5" placeholder="0.00" value={addForm.deposit_amount} onChange={e => setAddForm(f => ({ ...f, deposit_amount: e.target.value }))} />
            </div>
            <div>
              <Label className="text-sm font-medium">Currency</Label>
              <Select value={addForm.deposit_currency} onValueChange={v => setAddForm(f => ({ ...f, deposit_currency: v }))}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="AED">AED</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Deposit Date *</Label>
              <Input type="date" className="mt-1.5" value={addForm.deposit_date} onChange={e => setAddForm(f => ({ ...f, deposit_date: e.target.value }))} />
            </div>
            <div>
              <Label className="text-sm font-medium">Payment Method *</Label>
              <Select value={addForm.deposit_type} onValueChange={v => setAddForm(f => ({ ...f, deposit_type: v }))}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="CHEQUE">Cheque</SelectItem>
                  <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                  <SelectItem value="CREDIT_CARD">Credit Card</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {addForm.deposit_type === "CHEQUE" && (
            <div>
              <Label className="text-sm font-medium">Cheque Number</Label>
              <Input className="mt-1.5" placeholder="Cheque number..." value={addForm.cheque_number} onChange={e => setAddForm(f => ({ ...f, cheque_number: e.target.value }))} />
            </div>
          )}

          <div>
            <Label className="text-sm font-medium">Bank Reference / Transaction ID</Label>
            <Input className="mt-1.5" placeholder="Bank reference or transaction ID..." value={addForm.bank_ref} onChange={e => setAddForm(f => ({ ...f, bank_ref: e.target.value }))} />
          </div>

          <div>
            <Label className="text-sm font-medium">Notes</Label>
            <Input className="mt-1.5" placeholder="Any additional notes..." value={addForm.notes} onChange={e => setAddForm(f => ({ ...f, notes: e.target.value }))} />
          </div>

          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 text-sm">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-amber-400">Asset Deposit vs Security Deposit</p>
                <p className="text-muted-foreground text-xs mt-1">
                  This deposit covers the replacement value of furnished assets only. The security deposit (covering rent arrears and property damage) is managed separately under Lease → Security Deposits.
                </p>
              </div>
            </div>
          </div>
        </div>
      </SlidePanel>

      {/* Release Deposit Panel */}
      <SlidePanel
        open={showRelease}
        onClose={() => setShowRelease(false)}
        title="Release Asset Deposit"
        subtitle={selectedDeposit ? `${selectedDeposit.contract_ref} — ${selectedDeposit.property_name}` : ""}
        width="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowRelease(false)}>Cancel</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleReleaseSubmit}>Confirm Release</Button>
          </>
        }
      >
        {selectedDeposit && (
          <div className="space-y-5">
            <div className="bg-card border border-border rounded-xl p-4 grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Original Deposit</p>
                <p className="font-bold text-blue-400">AED {selectedDeposit.deposit_amount.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Approved Deductions</p>
                <p className="font-bold text-amber-400">AED {(selectedDeposit.total_deductions ?? 0).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Net Refundable</p>
                <p className="font-bold text-emerald-400">AED {selectedDeposit.net_refundable.toLocaleString()}</p>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">Release Amount (AED) *</Label>
              <Input type="number" className="mt-1.5" value={releaseForm.released_amount} onChange={e => setReleaseForm(f => ({ ...f, released_amount: e.target.value }))} />
              <p className="text-xs text-muted-foreground mt-1">Maximum refundable: AED {selectedDeposit.net_refundable.toLocaleString()}</p>
            </div>

            <div>
              <Label className="text-sm font-medium">Release Date *</Label>
              <Input type="date" className="mt-1.5" value={releaseForm.release_date} onChange={e => setReleaseForm(f => ({ ...f, release_date: e.target.value }))} />
            </div>

            <div>
              <Label className="text-sm font-medium">Release Notes</Label>
              <Input className="mt-1.5" placeholder="Reason for release, bank transfer details..." value={releaseForm.notes} onChange={e => setReleaseForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
          </div>
        )}
      </SlidePanel>

      {/* Add Deduction Panel */}
      <SlidePanel
        open={showDeduction}
        onClose={() => setShowDeduction(false)}
        title="Raise Deduction"
        subtitle={selectedDeposit ? `Against deposit for ${selectedDeposit.contract_ref}` : ""}
        width="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowDeduction(false)}>Cancel</Button>
            <Button className="bg-amber-600 hover:bg-amber-700 text-white" onClick={handleDeductSubmit}>Submit for Approval</Button>
          </>
        }
      >
        <div className="space-y-5">
          <div>
            <Label className="text-sm font-medium">Damaged Asset (optional)</Label>
            <Select value={deductForm.asset_id} onValueChange={v => setDeductForm(f => ({ ...f, asset_id: v }))}>
              <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select asset (if applicable)..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Ergonomic Chair</SelectItem>
                <SelectItem value="2">Coffee Machine</SelectItem>
                <SelectItem value="3">55&quot; Conference Display</SelectItem>
                <SelectItem value="none">Not asset-specific</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm font-medium">Deduction Reason *</Label>
            <Input className="mt-1.5" placeholder="e.g. Damaged beyond normal wear, Missing item, Cleaning required..." value={deductForm.deduction_reason} onChange={e => setDeductForm(f => ({ ...f, deduction_reason: e.target.value }))} />
          </div>

          <div>
            <Label className="text-sm font-medium">Deduction Amount (AED) *</Label>
            <Input type="number" className="mt-1.5" placeholder="0.00" value={deductForm.deduction_amount} onChange={e => setDeductForm(f => ({ ...f, deduction_amount: e.target.value }))} />
          </div>

          <div>
            <Label className="text-sm font-medium">Supporting Notes</Label>
            <Input className="mt-1.5" placeholder="Attach repair quote reference, inspection report..." value={deductForm.notes} onChange={e => setDeductForm(f => ({ ...f, notes: e.target.value }))} />
          </div>

          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 text-xs text-blue-300">
            Deductions require Finance Manager approval before they are applied to the refundable amount.
          </div>
        </div>
      </SlidePanel>
    </DashboardLayout>
  );
}
