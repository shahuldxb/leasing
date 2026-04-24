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
import { Sofa, PlusCircle, Search, Package, Tv, Refrigerator, Bath, BedDouble, ChefHat, TreePine, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import { ScreenHeader } from "@/components/ScreenHeader";

const CATEGORIES = [
  { value: "FURNITURE",    label: "Furniture",    icon: Sofa },
  { value: "APPLIANCE",    label: "Appliances",   icon: Refrigerator },
  { value: "ELECTRONICS",  label: "Electronics",  icon: Tv },
  { value: "FIXTURE",      label: "Fixtures",     icon: Package },
  { value: "KITCHEN",      label: "Kitchen",      icon: ChefHat },
  { value: "BEDROOM",      label: "Bedroom",      icon: BedDouble },
  { value: "BATHROOM",     label: "Bathroom",     icon: Bath },
  { value: "OUTDOOR",      label: "Outdoor",      icon: TreePine },
  { value: "OTHER",        label: "Other",        icon: MoreHorizontal },
];

const CONDITIONS = ["NEW","EXCELLENT","GOOD","FAIR","POOR"];

const conditionColor = (c: string) => ({
  NEW:       "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  EXCELLENT: "bg-green-500/20 text-green-400 border-green-500/30",
  GOOD:      "bg-blue-500/20 text-blue-400 border-blue-500/30",
  FAIR:      "bg-amber-500/20 text-amber-400 border-amber-500/30",
  POOR:      "bg-red-500/20 text-red-400 border-red-500/30",
}[c] ?? "bg-muted text-muted-foreground");

const MOCK_ASSETS = [
  { asset_id: 1, contract_ref: "VF-2024-001", property_name: "Vodafone HQ — Floor 12", asset_category: "FURNITURE", asset_name: "Executive Desk", brand: "Herman Miller", model: "Ratio", serial_number: "HM-2024-001", condition_at_handover: "EXCELLENT", estimated_value: 4500, quantity: 12 },
  { asset_id: 2, contract_ref: "VF-2024-001", property_name: "Vodafone HQ — Floor 12", asset_category: "FURNITURE", asset_name: "Ergonomic Chair", brand: "Steelcase", model: "Leap V2", serial_number: null, condition_at_handover: "GOOD", estimated_value: 1200, quantity: 48 },
  { asset_id: 3, contract_ref: "VF-2024-001", property_name: "Vodafone HQ — Floor 12", asset_category: "APPLIANCE", asset_name: "Coffee Machine", brand: "Nespresso", model: "Zenius", serial_number: "NES-2024-003", condition_at_handover: "NEW", estimated_value: 850, quantity: 3 },
  { asset_id: 4, contract_ref: "VF-2024-001", property_name: "Vodafone HQ — Floor 12", asset_category: "ELECTRONICS", asset_name: "55\" Conference Display", brand: "Samsung", model: "QB55B", serial_number: "SAM-QB55-001", condition_at_handover: "NEW", estimated_value: 2200, quantity: 6 },
  { asset_id: 5, contract_ref: "VF-2024-002", property_name: "Vodafone Abu Dhabi", asset_category: "APPLIANCE", asset_name: "Refrigerator", brand: "LG", model: "GBB72PZEXN", serial_number: "LG-2024-005", condition_at_handover: "GOOD", estimated_value: 1800, quantity: 2 },
  { asset_id: 6, contract_ref: "VF-2024-002", property_name: "Vodafone Abu Dhabi", asset_category: "FIXTURE", asset_name: "Ceiling Light Panels", brand: "Philips", model: "CoreLine", serial_number: null, condition_at_handover: "GOOD", estimated_value: 320, quantity: 24 },
  { asset_id: 7, contract_ref: "VF-2024-003", property_name: "Vodafone Sharjah", asset_category: "KITCHEN", asset_name: "Microwave Oven", brand: "Panasonic", model: "NN-ST45K", serial_number: "PAN-2024-007", condition_at_handover: "FAIR", estimated_value: 450, quantity: 2 },
];

export default function FurnishedAssets() {
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("ALL");
  const [filterCondition, setFilterCondition] = useState("ALL");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    contract_id: "",
    asset_category: "FURNITURE",
    asset_name: "",
    brand: "",
    model: "",
    serial_number: "",
    condition_at_handover: "GOOD",
    estimated_value: "",
    quantity: "1",
    notes: "",
  });

  const { data: leases = [] } = trpc.lease.getLeaseRegister.useQuery({ page: 1, pageSize: 200 });
  const leaseList: any[] = Array.isArray(leases) ? leases : (leases as any)?.leases ?? [];

  // Use mock data since DB tables may not exist yet
  const assets = MOCK_ASSETS;

  const filtered = assets.filter(a => {
    const matchSearch = !search || a.asset_name.toLowerCase().includes(search.toLowerCase()) ||
      a.brand?.toLowerCase().includes(search.toLowerCase()) ||
      a.serial_number?.toLowerCase().includes(search.toLowerCase()) ||
      a.contract_ref.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCategory === "ALL" || a.asset_category === filterCategory;
    const matchCond = filterCondition === "ALL" || a.condition_at_handover === filterCondition;
    return matchSearch && matchCat && matchCond;
  });

  const totalValue = filtered.reduce((s, a) => s + (a.estimated_value ?? 0) * a.quantity, 0);
  const totalUnits = filtered.reduce((s, a) => s + a.quantity, 0);

  const categoryGroups = CATEGORIES.map(c => ({
    ...c,
    count: assets.filter(a => a.asset_category === c.value).length,
    totalValue: assets.filter(a => a.asset_category === c.value).reduce((s, a) => s + (a.estimated_value ?? 0) * a.quantity, 0),
  }));

  const handleSubmit = () => {
    if (!form.asset_name || !form.contract_id) {
      toast.error("Lease and Asset Name are required");
      return;
    }
    toast.success(`Asset "${form.asset_name}" added to inventory`);
    setShowAdd(false);
    setForm({ contract_id: "", asset_category: "FURNITURE", asset_name: "", brand: "", model: "", serial_number: "", condition_at_handover: "GOOD", estimated_value: "", quantity: "1", notes: "" });
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <ScreenHeader
  screenId="VFLFRNASS0001P001"
  title="Furnished Assets"
  subtitle="Asset inventory per lease property"
/>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground">Total Asset Types</p>
            <p className="text-2xl font-bold mt-1 text-blue-400">{assets.length}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground">Total Units</p>
            <p className="text-2xl font-bold mt-1 text-purple-400">{assets.reduce((s,a)=>s+a.quantity,0)}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground">Total Estimated Value</p>
            <p className="text-2xl font-bold mt-1 text-emerald-400">
              AED {assets.reduce((s,a)=>s+(a.estimated_value??0)*a.quantity,0).toLocaleString()}
            </p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground">Needs Attention</p>
            <p className="text-2xl font-bold mt-1 text-amber-400">
              {assets.filter(a=>["FAIR","POOR"].includes(a.condition_at_handover)).length}
            </p>
          </div>
        </div>

        <Tabs defaultValue="register">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="register">Asset Register</TabsTrigger>
            <TabsTrigger value="by-category">By Category</TabsTrigger>
          </TabsList>

          <TabsContent value="register" className="space-y-4 mt-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input className="pl-9" placeholder="Search asset, brand, serial..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Categories</SelectItem>
                  {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filterCondition} onValueChange={setFilterCondition}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Conditions</SelectItem>
                  {CONDITIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="text-xs text-muted-foreground">
              {filtered.length} items · {totalUnits} units · AED {totalValue.toLocaleString()} total value
            </div>

            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="text-xs">Asset Name</TableHead>
                    <TableHead className="text-xs">Category</TableHead>
                    <TableHead className="text-xs">Brand / Model</TableHead>
                    <TableHead className="text-xs">Serial #</TableHead>
                    <TableHead className="text-xs">Lease</TableHead>
                    <TableHead className="text-xs">Condition</TableHead>
                    <TableHead className="text-xs text-right">Qty</TableHead>
                    <TableHead className="text-xs text-right">Unit Value (AED)</TableHead>
                    <TableHead className="text-xs text-right">Total Value (AED)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(a => (
                    <TableRow key={a.asset_id} className="text-sm hover:bg-muted/30">
                      <TableCell className="font-medium">{a.asset_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{a.asset_category}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {a.brand}{a.model ? ` / ${a.model}` : ""}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{a.serial_number ?? "—"}</TableCell>
                      <TableCell className="text-xs">
                        <div className="font-mono">{a.contract_ref}</div>
                        <div className="text-muted-foreground truncate max-w-[140px]">{a.property_name}</div>
                      </TableCell>
                      <TableCell>
                        <Badge className={conditionColor(a.condition_at_handover)}>{a.condition_at_handover}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">{a.quantity}</TableCell>
                      <TableCell className="text-right font-mono">{a.estimated_value?.toLocaleString() ?? "—"}</TableCell>
                      <TableCell className="text-right font-mono font-medium">
                        {a.estimated_value ? ((a.estimated_value * a.quantity).toLocaleString()) : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-muted-foreground py-10">
                        No assets found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="by-category" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoryGroups.filter(c => c.count > 0).map(cat => {
                const Icon = cat.icon;
                return (
                  <div key={cat.value} className="bg-card border border-border rounded-xl p-5 hover:border-[#e60000]/40 transition-colors">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-[#e60000]/10 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-[#e60000]" />
                      </div>
                      <div>
                        <p className="font-semibold">{cat.label}</p>
                        <p className="text-xs text-muted-foreground">{cat.count} asset types</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Total Units</p>
                        <p className="text-lg font-bold text-blue-400">
                          {assets.filter(a=>a.asset_category===cat.value).reduce((s,a)=>s+a.quantity,0)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Est. Value</p>
                        <p className="text-lg font-bold text-emerald-400">
                          AED {cat.totalValue.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 space-y-1">
                      {assets.filter(a=>a.asset_category===cat.value).slice(0,3).map(a => (
                        <div key={a.asset_id} className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground truncate">{a.asset_name}</span>
                          <Badge className={`${conditionColor(a.condition_at_handover)} text-[10px]`}>{a.condition_at_handover}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Asset — Full-Screen Slide Panel */}
      <SlidePanel
        open={showAdd}
        onClose={() => setShowAdd(false)}
        title="Add Furnished Asset"
        subtitle="Register a new furniture, appliance or equipment item against a lease"
        width="xl"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button className="bg-[#e60000] hover:bg-[#cc0000] text-white" onClick={handleSubmit}>Save Asset</Button>
          </>
        }
      >
        <div className="space-y-5">
          {/* Lease */}
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

          {/* Category */}
          <div>
            <Label className="text-sm font-medium">Asset Category *</Label>
            <Select value={form.asset_category} onValueChange={v => setForm(f => ({ ...f, asset_category: v }))}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Asset Name */}
          <div>
            <Label className="text-sm font-medium">Asset Name *</Label>
            <Input className="mt-1.5" placeholder="e.g. Executive Desk, Refrigerator, 55&quot; Display..." value={form.asset_name} onChange={e => setForm(f => ({ ...f, asset_name: e.target.value }))} />
          </div>

          {/* Brand / Model */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Brand</Label>
              <Input className="mt-1.5" placeholder="e.g. Samsung, LG, IKEA..." value={form.brand} onChange={e => setForm(f => ({ ...f, brand: e.target.value }))} />
            </div>
            <div>
              <Label className="text-sm font-medium">Model</Label>
              <Input className="mt-1.5" placeholder="Model number..." value={form.model} onChange={e => setForm(f => ({ ...f, model: e.target.value }))} />
            </div>
          </div>

          {/* Serial Number */}
          <div>
            <Label className="text-sm font-medium">Serial Number</Label>
            <Input className="mt-1.5" placeholder="Manufacturer serial number (if applicable)..." value={form.serial_number} onChange={e => setForm(f => ({ ...f, serial_number: e.target.value }))} />
          </div>

          {/* Condition / Quantity */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Condition at Handover</Label>
              <Select value={form.condition_at_handover} onValueChange={v => setForm(f => ({ ...f, condition_at_handover: v }))}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CONDITIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium">Quantity</Label>
              <Input type="number" min="1" className="mt-1.5" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} />
            </div>
          </div>

          {/* Estimated Value */}
          <div>
            <Label className="text-sm font-medium">Estimated Replacement Value (AED)</Label>
            <Input type="number" className="mt-1.5" placeholder="Per unit value..." value={form.estimated_value} onChange={e => setForm(f => ({ ...f, estimated_value: e.target.value }))} />
            {form.estimated_value && form.quantity && (
              <p className="text-xs text-muted-foreground mt-1">
                Total: AED {(Number(form.estimated_value) * Number(form.quantity)).toLocaleString()}
              </p>
            )}
          </div>

          {/* Notes */}
          <div>
            <Label className="text-sm font-medium">Notes</Label>
            <Input className="mt-1.5" placeholder="Any additional notes about this asset..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </div>
        </div>
      </SlidePanel>
    </DashboardLayout>
  );
}
