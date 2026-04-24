import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, ArrowLeft, Search } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const ASSET_TYPES = ["Tower Site","Data Centre","Retail Outlet","Office","Warehouse","Vehicle","Network Equipment","Land","Other"] as const;
const STATUSES = ["Available","Leased","Under Maintenance","Decommissioned"] as const;
const MAINT = ["Lessor","Vodafone","Shared"] as const;
const CONDITIONS = ["Excellent","Good","Fair","Poor"] as const;

const emptyForm = {
  assetName: "", assetType: "Office" as typeof ASSET_TYPES[number],
  assetSubtype: "", description: "", country: "AE", city: "", area: "",
  addressLine1: "", addressLine2: "", postalCode: "",
  floorAreaSqm: "", floors: "", yearBuilt: "",
  conditionRating: "Good" as typeof CONDITIONS[number],
  currentLessorId: "", status: "Available" as typeof STATUSES[number],
  maintenanceResponsibility: "Lessor" as typeof MAINT[number],
  estimatedMarketValue: "", lastValuationDate: "", makeGoodProvision: "0", tags: "",
};

export default function AssetRegistry() {
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState<any>({ ...emptyForm });
  const [aiRows, setAiRows] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  const { data: assetsData, isLoading, refetch } = trpc.asset.getAssets.useQuery({
    pageNumber: 1, pageSize: 100, searchTerm: search || undefined,
  });
  const assets = [...((assetsData as any)?.assets ?? []), ...aiRows];
  const { data: lessorsData } = trpc.lessor.getLessors.useQuery({});
  const lessors: any[] = (lessorsData as any)?.lessors ?? [];

  const upsertMutation = trpc.asset.upsertAsset.useMutation({
    onSuccess: () => { refetch(); setShowForm(false); setEditItem(null); toast.success(editItem ? "Asset updated" : "Asset created"); },
    onError: (e: any) => toast.error(e.message),
  });
  const deleteMutation = trpc.asset.deleteAsset.useMutation({
    onSuccess: () => { refetch(); toast.success("Asset deleted"); },
    onError: (e: any) => toast.error(e.message),
  });

  const openAdd = () => { setEditItem(null); setForm({ ...emptyForm }); setShowForm(true); };
  const openEdit = (a: any) => {
    setEditItem(a);
    setForm({
      assetName: a.asset_name ?? "", assetType: a.asset_type ?? "Office",
      assetSubtype: a.asset_subtype ?? "", description: a.description ?? "",
      country: a.country ?? "AE", city: a.city ?? "", area: a.area ?? "",
      addressLine1: a.address_line1 ?? "", addressLine2: a.address_line2 ?? "",
      postalCode: a.postal_code ?? "", floorAreaSqm: a.floor_area_sqm ?? "",
      floors: a.floors ?? "", yearBuilt: a.year_built ?? "",
      conditionRating: a.condition_rating ?? "Good",
      currentLessorId: a.current_lessor_id ?? "", status: a.status ?? "Available",
      maintenanceResponsibility: a.maintenance_responsibility ?? "Lessor",
      estimatedMarketValue: a.estimated_market_value ?? "",
      lastValuationDate: a.last_valuation_date?.split("T")[0] ?? "",
      makeGoodProvision: a.make_good_provision ?? "0", tags: a.tags ?? "",
    });
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!form.assetName) { toast.error("Asset Name is required"); return; }
    upsertMutation.mutate({
      assetId: editItem?.asset_id,
      assetName: form.assetName,
      assetType: form.assetType as typeof ASSET_TYPES[number],
      assetSubtype: form.assetSubtype || undefined,
      description: form.description || undefined,
      country: form.country || "AE",
      city: form.city || undefined, area: form.area || undefined,
      addressLine1: form.addressLine1 || undefined,
      addressLine2: form.addressLine2 || undefined,
      postalCode: form.postalCode || undefined,
      floorAreaSqm: form.floorAreaSqm ? Number(form.floorAreaSqm) : undefined,
      floors: form.floors ? Number(form.floors) : undefined,
      yearBuilt: form.yearBuilt ? Number(form.yearBuilt) : undefined,
      conditionRating: form.conditionRating as typeof CONDITIONS[number] || undefined,
      currentLessorId: form.currentLessorId ? Number(form.currentLessorId) : undefined,
      status: form.status as typeof STATUSES[number],
      maintenanceResponsibility: form.maintenanceResponsibility as typeof MAINT[number],
      estimatedMarketValue: form.estimatedMarketValue ? Number(form.estimatedMarketValue) : undefined,
      lastValuationDate: form.lastValuationDate || undefined,
      makeGoodProvision: Number(form.makeGoodProvision || 0),
      tags: form.tags || undefined,
    });
  };

  const f = (k: string) => (e: any) => setForm((p: any) => ({ ...p, [k]: e.target?.value ?? e }));

  if (showForm) {
    return (
      <DashboardLayout>
        <div className="flex flex-col h-full bg-[#0d0f1c] overflow-y-auto">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-white/10">
            <Button variant="ghost" size="sm" onClick={() => setShowForm(false)} className="text-gray-400 hover:text-white gap-2">
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
            <div>
              <h1 className="text-lg font-bold text-white">{editItem ? "Edit Asset" : "New Asset"}</h1>
              <p className="text-xs text-gray-400">Fill in asset details. Use Gen AI to auto-fill with realistic data.</p>
            </div>
            <div className="ml-auto">
              <ScreenHeader screenId="VFLSEASTREG0001P001" title="" formType="asset" onAIFormFill={(data) => setForm((p: any) => ({
                ...p,
                assetName: data.assetName ?? p.assetName,
                assetType: data.assetType ?? p.assetType,
                status: data.status ?? p.status,
                country: data.country ?? p.country,
                city: data.city ?? p.city,
                addressLine1: data.address ?? p.addressLine1,
                floorAreaSqm: data.floorArea ?? p.floorAreaSqm,
                description: data.notes ?? p.description,
              }))} />
            </div>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl">
            <div className="md:col-span-2">
              <Label className="text-gray-300 text-sm mb-1 block">Asset Name *</Label>
              <Input value={form.assetName} onChange={f("assetName")} placeholder="e.g. Dubai Tower Site 01" className="bg-[#1a1d2e] border-white/10 text-white" />
            </div>
            <div>
              <Label className="text-gray-300 text-sm mb-1 block">Asset Type</Label>
              <Select value={form.assetType} onValueChange={f("assetType")}>
                <SelectTrigger className="bg-[#1a1d2e] border-white/10 text-white"><SelectValue /></SelectTrigger>
                <SelectContent>{ASSET_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-gray-300 text-sm mb-1 block">Status</Label>
              <Select value={form.status} onValueChange={f("status")}>
                <SelectTrigger className="bg-[#1a1d2e] border-white/10 text-white"><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-gray-300 text-sm mb-1 block">Country (2-letter)</Label>
              <Input value={form.country} onChange={f("country")} maxLength={2} className="bg-[#1a1d2e] border-white/10 text-white" />
            </div>
            <div>
              <Label className="text-gray-300 text-sm mb-1 block">City</Label>
              <Input value={form.city} onChange={f("city")} className="bg-[#1a1d2e] border-white/10 text-white" />
            </div>
            <div>
              <Label className="text-gray-300 text-sm mb-1 block">Floor Area (sqm)</Label>
              <Input type="number" value={form.floorAreaSqm} onChange={f("floorAreaSqm")} className="bg-[#1a1d2e] border-white/10 text-white" />
            </div>
            <div>
              <Label className="text-gray-300 text-sm mb-1 block">Condition Rating</Label>
              <Select value={form.conditionRating} onValueChange={f("conditionRating")}>
                <SelectTrigger className="bg-[#1a1d2e] border-white/10 text-white"><SelectValue /></SelectTrigger>
                <SelectContent>{CONDITIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-gray-300 text-sm mb-1 block">Maintenance Responsibility</Label>
              <Select value={form.maintenanceResponsibility} onValueChange={f("maintenanceResponsibility")}>
                <SelectTrigger className="bg-[#1a1d2e] border-white/10 text-white"><SelectValue /></SelectTrigger>
                <SelectContent>{MAINT.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-gray-300 text-sm mb-1 block">Estimated Market Value (AED)</Label>
              <Input type="number" value={form.estimatedMarketValue} onChange={f("estimatedMarketValue")} className="bg-[#1a1d2e] border-white/10 text-white" />
            </div>
            <div>
              <Label className="text-gray-300 text-sm mb-1 block">Make Good Provision (AED)</Label>
              <Input type="number" value={form.makeGoodProvision} onChange={f("makeGoodProvision")} className="bg-[#1a1d2e] border-white/10 text-white" />
            </div>
            <div>
              <Label className="text-gray-300 text-sm mb-1 block">Last Valuation Date</Label>
              <Input type="date" value={form.lastValuationDate} onChange={f("lastValuationDate")} className="bg-[#1a1d2e] border-white/10 text-white" />
            </div>
            <div>
              <Label className="text-gray-300 text-sm mb-1 block">Lessor</Label>
              <Select value={String(form.currentLessorId)} onValueChange={f("currentLessorId")}>
                <SelectTrigger className="bg-[#1a1d2e] border-white/10 text-white"><SelectValue placeholder="Select lessor" /></SelectTrigger>
                <SelectContent>{(lessors as any[]).map((l: any) => <SelectItem key={l.lessor_id} value={String(l.lessor_id)}>{l.lessor_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2 flex gap-3 pt-2">
              <Button onClick={handleSubmit} disabled={upsertMutation.isPending} className="bg-[#e60000] hover:bg-[#cc0000] text-white">
                {upsertMutation.isPending ? "Saving..." : editItem ? "Update Asset" : "Create Asset"}
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)} className="border-white/10 text-gray-300">Cancel</Button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full bg-[#0d0f1c] p-6 space-y-4 overflow-y-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Asset Registry</h1>
            <p className="text-sm text-gray-400">Manage all leased assets and properties</p>
          </div>
          <div className="flex items-center gap-2">
            <ScreenHeader screenId="VFLSEASTREG0001P001" title="" screenType="asset_registry" onAIData={(rows) => setAiRows(rows)} />
            <Button onClick={openAdd} className="bg-[#e60000] hover:bg-[#cc0000] text-white gap-2 h-9 px-3 text-sm rounded-lg">
              <Plus className="w-4 h-4" />Add Asset
            </Button>
          </div>
        </div>
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search assets..." className="pl-9 bg-[#1a1d2e] border-white/10 text-white" />
        </div>
        <div className="rounded-xl border border-white/10 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 bg-[#1a1d2e]">
                <TableHead className="text-gray-400">Asset Name</TableHead>
                <TableHead className="text-gray-400">Type</TableHead>
                <TableHead className="text-gray-400">Location</TableHead>
                <TableHead className="text-gray-400">Status</TableHead>
                <TableHead className="text-gray-400">Market Value</TableHead>
                <TableHead className="text-gray-400">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-400">Loading...</TableCell></TableRow>}
              {!isLoading && assets.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-400">No assets found. Click Add Asset to create one.</TableCell></TableRow>}
              {assets.map((a: any, i: number) => (
                <TableRow key={a.asset_id ?? i} className="border-white/10 hover:bg-white/5">
                  <TableCell className="text-white font-medium">{a.asset_name}</TableCell>
                  <TableCell className="text-gray-300">{a.asset_type}</TableCell>
                  <TableCell className="text-gray-300">{[a.city, a.country].filter(Boolean).join(", ")}</TableCell>
                  <TableCell>
                    <Badge className={a.status === "Available" ? "bg-green-500/20 text-green-400" : a.status === "Leased" ? "bg-blue-500/20 text-blue-400" : "bg-gray-500/20 text-gray-400"}>
                      {a.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-300">{a.estimated_market_value ? `AED ${Number(a.estimated_market_value).toLocaleString()}` : "—"}</TableCell>
                  <TableCell className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => openEdit(a)} className="border-white/10 text-gray-300 h-7 text-xs">Edit</Button>
                    <Button size="sm" variant="outline" onClick={() => { if (confirm("Delete this asset?")) deleteMutation.mutate({ assetId: a.asset_id }); }} className="border-red-500/30 text-red-400 h-7 text-xs hover:bg-red-500/10">Delete</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </DashboardLayout>
  );
}
