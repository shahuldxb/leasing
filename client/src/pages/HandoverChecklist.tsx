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
import { ClipboardList, PlusCircle, Search, CheckCircle2, AlertCircle, Clock, FileText, ChevronRight } from "lucide-react";
import { toast } from "sonner";

const CHECKLIST_CONDITIONS = ["NEW","EXCELLENT","GOOD","FAIR","POOR","MISSING","DAMAGED"];

const conditionColor = (c: string) => ({
  NEW:       "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  EXCELLENT: "bg-green-500/20 text-green-400 border-green-500/30",
  GOOD:      "bg-blue-500/20 text-blue-400 border-blue-500/30",
  FAIR:      "bg-amber-500/20 text-amber-400 border-amber-500/30",
  POOR:      "bg-orange-500/20 text-orange-400 border-orange-500/30",
  MISSING:   "bg-red-500/20 text-red-400 border-red-500/30",
  DAMAGED:   "bg-red-600/20 text-red-300 border-red-600/30",
}[c] ?? "bg-muted text-muted-foreground");

const MOCK_CHECKLISTS = [
  { checklist_id: 1, contract_ref: "VF-2024-001", property_name: "Vodafone HQ — Floor 12", checklist_type: "HANDOVER", conducted_date: "2024-01-15", overall_condition: "EXCELLENT", signed_off: true, item_count: 12, total_deduction_estimate: 0, conducted_by_name: "Ahmed Al Rashidi" },
  { checklist_id: 2, contract_ref: "VF-2024-002", property_name: "Vodafone Abu Dhabi", checklist_type: "HANDOVER", conducted_date: "2024-03-01", overall_condition: "GOOD", signed_off: true, item_count: 8, total_deduction_estimate: 0, conducted_by_name: "Sara Mohammed" },
  { checklist_id: 3, contract_ref: "VF-2023-005", property_name: "Vodafone Sharjah", checklist_type: "RETURN", conducted_date: "2024-12-10", overall_condition: "FAIR", signed_off: false, item_count: 10, total_deduction_estimate: 2300, conducted_by_name: "Khalid Ibrahim" },
  { checklist_id: 4, contract_ref: "VF-2024-003", property_name: "Vodafone Ajman", checklist_type: "HANDOVER", conducted_date: "2024-05-10", overall_condition: "GOOD", signed_off: true, item_count: 6, total_deduction_estimate: 0, conducted_by_name: "Fatima Al Zaabi" },
];

const MOCK_ITEMS = [
  { item_id: 1, checklist_id: 3, asset_name: "Ergonomic Chair", asset_category: "FURNITURE", brand: "Steelcase", original_condition: "GOOD", condition_at_check: "POOR", damage_description: "Torn fabric on seat and backrest", repair_cost_estimate: 800, deduct_from_deposit: true },
  { item_id: 2, checklist_id: 3, asset_name: "Coffee Machine", asset_category: "APPLIANCE", brand: "Nespresso", original_condition: "NEW", condition_at_check: "MISSING", damage_description: "Not returned — missing", repair_cost_estimate: 850, deduct_from_deposit: true },
  { item_id: 3, checklist_id: 3, asset_name: "55\" Conference Display", asset_category: "ELECTRONICS", brand: "Samsung", original_condition: "NEW", condition_at_check: "DAMAGED", damage_description: "Cracked screen — physical impact", repair_cost_estimate: 1450, deduct_from_deposit: true },
  { item_id: 4, checklist_id: 3, asset_name: "Executive Desk", asset_category: "FURNITURE", brand: "Herman Miller", original_condition: "EXCELLENT", condition_at_check: "GOOD", damage_description: "Minor surface scratches — normal wear", repair_cost_estimate: 0, deduct_from_deposit: false },
  { item_id: 5, checklist_id: 3, asset_name: "Ceiling Light Panels", asset_category: "FIXTURE", brand: "Philips", original_condition: "GOOD", condition_at_check: "GOOD", damage_description: null, repair_cost_estimate: 0, deduct_from_deposit: false },
];

export default function HandoverChecklist() {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("ALL");
  const [showCreate, setShowCreate] = useState(false);
  const [selectedChecklist, setSelectedChecklist] = useState<typeof MOCK_CHECKLISTS[0] | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  const [form, setForm] = useState({
    contract_id: "",
    checklist_type: "HANDOVER",
    conducted_date: new Date().toISOString().split("T")[0],
    overall_condition: "GOOD",
    notes: "",
  });

  const { data: leases = [] } = trpc.lease.getLeaseRegister.useQuery({ page: 1, pageSize: 200 });
  const leaseList: any[] = Array.isArray(leases) ? leases : (leases as any)?.leases ?? [];

  const filtered = MOCK_CHECKLISTS.filter(c => {
    const matchSearch = !search || c.contract_ref.toLowerCase().includes(search.toLowerCase()) || c.property_name.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === "ALL" || c.checklist_type === filterType;
    return matchSearch && matchType;
  });

  const handleCreate = () => {
    if (!form.contract_id || !form.conducted_date) {
      toast.error("Lease and date are required");
      return;
    }
    toast.success(`${form.checklist_type === "HANDOVER" ? "Handover" : "Return"} checklist created`);
    setShowCreate(false);
  };

  const handleSignOff = (c: typeof MOCK_CHECKLISTS[0]) => {
    toast.success(`Checklist ${c.contract_ref} signed off`);
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ClipboardList className="w-6 h-6 text-[#e60000]" /> Handover &amp; Return Checklists
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Screen ID: VFOPSHOV0001P001 · Digital inspection checklists for furnished property handover and return
            </p>
          </div>
          <Button className="bg-[#e60000] hover:bg-[#cc0000] text-white" onClick={() => setShowCreate(true)}>
            <PlusCircle className="w-4 h-4 mr-2" /> New Checklist
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <ClipboardList className="w-4 h-4 text-blue-400" />
              <p className="text-xs text-muted-foreground">Total Checklists</p>
            </div>
            <p className="text-2xl font-bold text-blue-400">{MOCK_CHECKLISTS.length}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <p className="text-xs text-muted-foreground">Signed Off</p>
            </div>
            <p className="text-2xl font-bold text-emerald-400">{MOCK_CHECKLISTS.filter(c => c.signed_off).length}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <p className="text-xs text-muted-foreground">Pending Sign-Off</p>
            </div>
            <p className="text-2xl font-bold text-amber-400">{MOCK_CHECKLISTS.filter(c => !c.signed_off).length}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <p className="text-xs text-muted-foreground">Deductions Raised</p>
            </div>
            <p className="text-2xl font-bold text-red-400">
              AED {MOCK_CHECKLISTS.reduce((s, c) => s + c.total_deduction_estimate, 0).toLocaleString()}
            </p>
          </div>
        </div>

        <Tabs defaultValue="checklists">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="checklists">All Checklists</TabsTrigger>
            <TabsTrigger value="return-items">Return Inspection Items</TabsTrigger>
          </TabsList>

          <TabsContent value="checklists" className="space-y-4 mt-4">
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input className="pl-9" placeholder="Search lease, property..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Types</SelectItem>
                  <SelectItem value="HANDOVER">Handover</SelectItem>
                  <SelectItem value="RETURN">Return</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="text-xs">Lease / Property</TableHead>
                    <TableHead className="text-xs">Type</TableHead>
                    <TableHead className="text-xs">Date</TableHead>
                    <TableHead className="text-xs">Conducted By</TableHead>
                    <TableHead className="text-xs">Overall Condition</TableHead>
                    <TableHead className="text-xs text-right">Items</TableHead>
                    <TableHead className="text-xs text-right">Est. Deductions (AED)</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(c => (
                    <TableRow key={c.checklist_id} className="text-sm hover:bg-muted/30">
                      <TableCell>
                        <div className="font-mono text-xs font-medium">{c.contract_ref}</div>
                        <div className="text-xs text-muted-foreground truncate max-w-[160px]">{c.property_name}</div>
                      </TableCell>
                      <TableCell>
                        <Badge className={c.checklist_type === "HANDOVER" ? "bg-blue-500/20 text-blue-400 border-blue-500/30" : "bg-purple-500/20 text-purple-400 border-purple-500/30"}>
                          {c.checklist_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">{c.conducted_date}</TableCell>
                      <TableCell className="text-xs">{c.conducted_by_name}</TableCell>
                      <TableCell>
                        <Badge className={conditionColor(c.overall_condition)}>{c.overall_condition}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">{c.item_count}</TableCell>
                      <TableCell className="text-right font-mono text-amber-400">
                        {c.total_deduction_estimate > 0 ? c.total_deduction_estimate.toLocaleString() : "—"}
                      </TableCell>
                      <TableCell>
                        {c.signed_off
                          ? <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Signed Off</Badge>
                          : <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Pending</Badge>
                        }
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" className="h-7 text-xs px-2"
                            onClick={() => { setSelectedChecklist(c); setShowDetail(true); }}>
                            <FileText className="w-3 h-3 mr-1" /> View
                          </Button>
                          {!c.signed_off && (
                            <Button size="sm" variant="outline" className="h-7 text-xs px-2 text-green-400 border-green-500/30"
                              onClick={() => handleSignOff(c)}>
                              Sign Off
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

          <TabsContent value="return-items" className="mt-4">
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="text-xs">Asset</TableHead>
                    <TableHead className="text-xs">Category</TableHead>
                    <TableHead className="text-xs">Original Condition</TableHead>
                    <TableHead className="text-xs">Condition at Return</TableHead>
                    <TableHead className="text-xs">Damage Description</TableHead>
                    <TableHead className="text-xs text-right">Repair Estimate (AED)</TableHead>
                    <TableHead className="text-xs">Deduct from Deposit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MOCK_ITEMS.map(item => (
                    <TableRow key={item.item_id} className="text-sm hover:bg-muted/30">
                      <TableCell>
                        <div className="font-medium">{item.asset_name}</div>
                        <div className="text-xs text-muted-foreground">{item.brand}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{item.asset_category}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={conditionColor(item.original_condition)}>{item.original_condition}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={conditionColor(item.condition_at_check)}>{item.condition_at_check}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[200px]">
                        {item.damage_description ?? "—"}
                      </TableCell>
                      <TableCell className="text-right font-mono text-amber-400">
                        {item.repair_cost_estimate > 0 ? item.repair_cost_estimate.toLocaleString() : "—"}
                      </TableCell>
                      <TableCell>
                        {item.deduct_from_deposit
                          ? <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Yes</Badge>
                          : <Badge className="bg-muted text-muted-foreground">No</Badge>
                        }
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="px-4 py-3 border-t border-border flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total deductions from deposit:</span>
                <span className="font-bold text-amber-400">
                  AED {MOCK_ITEMS.filter(i => i.deduct_from_deposit).reduce((s, i) => s + i.repair_cost_estimate, 0).toLocaleString()}
                </span>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Create Checklist Panel */}
      <SlidePanel
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="New Inspection Checklist"
        subtitle="Create a handover or return inspection checklist for a furnished property"
        width="xl"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button className="bg-[#e60000] hover:bg-[#cc0000] text-white" onClick={handleCreate}>Create Checklist</Button>
          </>
        }
      >
        <div className="space-y-5">
          <div>
            <Label className="text-sm font-medium">Lease / Property *</Label>
            <Select value={form.contract_id} onValueChange={v => setForm(f => ({ ...f, contract_id: v }))}>
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
              <Label className="text-sm font-medium">Checklist Type *</Label>
              <Select value={form.checklist_type} onValueChange={v => setForm(f => ({ ...f, checklist_type: v }))}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="HANDOVER">Handover (Tenant moves in)</SelectItem>
                  <SelectItem value="RETURN">Return (Tenant moves out)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium">Inspection Date *</Label>
              <Input type="date" className="mt-1.5" value={form.conducted_date} onChange={e => setForm(f => ({ ...f, conducted_date: e.target.value }))} />
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium">Overall Property Condition</Label>
            <Select value={form.overall_condition} onValueChange={v => setForm(f => ({ ...f, overall_condition: v }))}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                {["EXCELLENT","GOOD","FAIR","POOR","DAMAGED"].map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm font-medium">Notes</Label>
            <Input className="mt-1.5" placeholder="General observations about the property condition..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </div>

          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 text-sm">
            <p className="font-medium text-blue-400 mb-1">Next Steps</p>
            <p className="text-xs text-muted-foreground">
              After creating the checklist, you can add individual asset inspection items with condition ratings, damage descriptions, and repair cost estimates. Items flagged for deposit deduction will automatically feed into the Asset Deposit Register.
            </p>
          </div>
        </div>
      </SlidePanel>

      {/* Checklist Detail Panel */}
      <SlidePanel
        open={showDetail}
        onClose={() => setShowDetail(false)}
        title={`${selectedChecklist?.checklist_type} Checklist`}
        subtitle={selectedChecklist ? `${selectedChecklist.contract_ref} — ${selectedChecklist.property_name} · ${selectedChecklist.conducted_date}` : ""}
        width="2xl"
        footer={
          selectedChecklist && !selectedChecklist.signed_off ? (
            <>
              <Button variant="outline" onClick={() => setShowDetail(false)}>Close</Button>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => { handleSignOff(selectedChecklist!); setShowDetail(false); }}>
                <CheckCircle2 className="w-4 h-4 mr-2" /> Sign Off Checklist
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={() => setShowDetail(false)}>Close</Button>
          )
        }
      >
        {selectedChecklist && (
          <div className="space-y-5">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-card border border-border rounded-xl p-4">
                <p className="text-xs text-muted-foreground">Overall Condition</p>
                <Badge className={`${conditionColor(selectedChecklist.overall_condition)} mt-2`}>{selectedChecklist.overall_condition}</Badge>
              </div>
              <div className="bg-card border border-border rounded-xl p-4">
                <p className="text-xs text-muted-foreground">Items Inspected</p>
                <p className="text-2xl font-bold text-blue-400 mt-1">{selectedChecklist.item_count}</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-4">
                <p className="text-xs text-muted-foreground">Est. Deductions</p>
                <p className="text-2xl font-bold text-amber-400 mt-1">
                  AED {selectedChecklist.total_deduction_estimate.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Asset Inspection Items</h3>
              {MOCK_ITEMS.filter(i => i.checklist_id === selectedChecklist.checklist_id).map(item => (
                <div key={item.item_id} className="bg-muted/30 border border-border rounded-lg p-4 flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{item.asset_name}</span>
                      <Badge variant="outline" className="text-xs">{item.asset_category}</Badge>
                    </div>
                    {item.damage_description && (
                      <p className="text-xs text-muted-foreground mt-1">{item.damage_description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Before</p>
                      <Badge className={conditionColor(item.original_condition)}>{item.original_condition}</Badge>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">After</p>
                      <Badge className={conditionColor(item.condition_at_check)}>{item.condition_at_check}</Badge>
                    </div>
                    {item.repair_cost_estimate > 0 && (
                      <div className="text-center min-w-[80px]">
                        <p className="text-xs text-muted-foreground">Repair Est.</p>
                        <p className="text-sm font-bold text-amber-400">AED {item.repair_cost_estimate.toLocaleString()}</p>
                      </div>
                    )}
                    {item.deduct_from_deposit && (
                      <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">Deduct</Badge>
                    )}
                  </div>
                </div>
              ))}
              {MOCK_ITEMS.filter(i => i.checklist_id === selectedChecklist.checklist_id).length === 0 && (
                <div className="text-center text-muted-foreground py-8 text-sm">
                  No inspection items recorded yet
                </div>
              )}
            </div>
          </div>
        )}
      </SlidePanel>
    </DashboardLayout>
  );
}
