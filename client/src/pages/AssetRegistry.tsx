import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ScreenHeader } from "@/components/ScreenHeader";
import { GenAIFillButton } from "@/components/GenAIFillButton";
import {
  Package, Plus, Search, RefreshCw, Eye, Edit, MapPin,
  Building2, Calendar, DollarSign, Wrench, FileText,
  CheckCircle, AlertTriangle, Layers, Tag
} from "lucide-react";
import SlidePanel from "@/components/SlidePanel";

type AssetType = "Tower Site" | "Data Centre" | "Retail Outlet" | "Office" | "Warehouse" | "Vehicle" | "Network Equipment" | "Land" | "Other";
type ConditionRating = "Excellent" | "Good" | "Fair" | "Poor";
type MaintenanceResp = "Lessor" | "Vodafone" | "Shared";
type AssetStatus = "Available" | "Leased" | "Under Maintenance" | "Decommissioned";

const ASSET_TYPES: AssetType[] = ["Tower Site", "Data Centre", "Retail Outlet", "Office", "Warehouse", "Vehicle", "Network Equipment", "Land", "Other"];
const CONDITION_RATINGS: ConditionRating[] = ["Excellent", "Good", "Fair", "Poor"];
const MAINTENANCE_RESPS: MaintenanceResp[] = ["Lessor", "Vodafone", "Shared"];
const ASSET_STATUSES: AssetStatus[] = ["Available", "Leased", "Under Maintenance", "Decommissioned"];

const CONDITION_COLORS: Record<string, string> = {
  Excellent: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  Good: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  Fair: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  Poor: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  "Under Maintenance": "bg-purple-500/20 text-purple-400 border-purple-500/30",
  Decommissioned: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

interface AssetFormData {
  assetName: string;
  assetType: AssetType | "";
  description: string;
  addressLine1: string;
  city: string;
  country: string;
  latitude: string;
  longitude: string;
  conditionRating: ConditionRating | "";
  maintenanceResponsibility: MaintenanceResp;
  status: AssetStatus;
  lastValuationDate: string;
  estimatedMarketValue: string;
  floorAreaSqm: string;
  makeGoodProvision: string;
  tags: string;
}

const EMPTY_FORM: AssetFormData = {
  assetName: "", assetType: "", description: "",
  addressLine1: "", city: "", country: "AE",
  latitude: "", longitude: "",
  conditionRating: "Good", maintenanceResponsibility: "Lessor",
  status: "Available", lastValuationDate: "", estimatedMarketValue: "",
  floorAreaSqm: "", makeGoodProvision: "", tags: ""
};

export default function AssetRegistry() {
  const [search, setSearch] = useState("");
  const [aiRows, setAiRows] = useState<Record<string, unknown>[]>([]);
  const [assetType, setAssetType] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [selectedAsset, setSelectedAsset] = useState<Record<string, string | number | boolean | null> | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState<AssetFormData>(EMPTY_FORM);
  const [activeTab, setActiveTab] = useState("overview");

  const { data: assetsData, isLoading, refetch } = trpc.asset.getAssets.useQuery({
    searchTerm: search || undefined,
    assetType: assetType !== "all" ? assetType : undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
    pageNumber: page,
    pageSize: 20,
  });

  const { data: assetDetail, isLoading: detailLoading } = trpc.asset.getAssetDetail.useQuery(
    { assetId: selectedAsset?.asset_id as number },
    { enabled: !!selectedAsset?.asset_id }
  );

  const upsertMutation = trpc.asset.upsertAsset.useMutation({
    onSuccess: () => {
      toast.success(editMode ? "Asset updated successfully" : "Asset registered successfully");
      setShowForm(false);
      setForm(EMPTY_FORM);
      setEditMode(false);
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const assets = aiRows.length > 0 ? aiRows as any[] : (((assetsData as Record<string, unknown>)?.assets as Record<string, unknown>[]) || []);
  const total = ((assetsData as Record<string, unknown>)?.total as number) || 0;
  const totalPages = Math.ceil(total / 20);

  const handleEdit = (asset: Record<string, unknown>) => {
    setForm({
      assetName: String(asset.asset_name || ""),
      assetType: (asset.asset_type as AssetType) || "",
      description: String(asset.description || ""),
      addressLine1: String(asset.address_line1 || ""),
      city: String(asset.city || ""),
      country: String(asset.country || "AE"),
      latitude: String(asset.latitude || ""),
      longitude: String(asset.longitude || ""),
      conditionRating: (asset.condition_rating as ConditionRating) || "Good",
      maintenanceResponsibility: (asset.maintenance_responsibility as MaintenanceResp) || "Lessor",
      status: (asset.status as AssetStatus) || "Available",
      lastValuationDate: asset.last_valuation_date ? String(asset.last_valuation_date).split("T")[0] : "",
      estimatedMarketValue: String(asset.estimated_market_value || ""),
      floorAreaSqm: String(asset.floor_area_sqm || ""),
      makeGoodProvision: String(asset.make_good_provision || ""),
      tags: String(asset.tags || ""),
    });
    setEditMode(true);
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!form.assetName || !form.assetType) {
      toast.error("Asset Name and Type are required");
      return;
    }
    upsertMutation.mutate({
      assetId: editMode ? (selectedAsset?.asset_id as number) : undefined,
      assetName: form.assetName,
      assetType: form.assetType as "Tower Site" | "Data Centre" | "Retail Outlet" | "Warehouse" | "Network Equipment" | "Land" | "Other" | "Office" | "Vehicle",
      description: form.description || undefined,
      addressLine1: form.addressLine1 || undefined,
      city: form.city || undefined,
      country: form.country || "AE",
      latitude: form.latitude ? parseFloat(form.latitude) : undefined,
      longitude: form.longitude ? parseFloat(form.longitude) : undefined,
      conditionRating: form.conditionRating as ConditionRating || undefined,
      maintenanceResponsibility: form.maintenanceResponsibility,
      status: form.status,
      lastValuationDate: form.lastValuationDate || undefined,
      estimatedMarketValue: form.estimatedMarketValue ? parseFloat(form.estimatedMarketValue) : undefined,
      floorAreaSqm: form.floorAreaSqm ? parseFloat(form.floorAreaSqm) : undefined,
      makeGoodProvision: form.makeGoodProvision ? parseFloat(form.makeGoodProvision) : 0,
      tags: form.tags || undefined,
    });
  };

  const detail = assetDetail as Record<string, unknown> | null;
  const leaseHistory = ((detail?.leaseHistory as Record<string, unknown>[]) || []);
  const maintenanceHistory = ((detail?.maintenanceHistory as Record<string, unknown>[]) || []);

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <ScreenHeader
  screenId="VFLASSREG0001P001"
          screenType="asset_registry"
          onAIData={(rows) => setAiRows(rows)}
  title="Asset Registry"
  subtitle="Master register of all leased assets"
/>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Assets", value: total, icon: Package, color: "text-blue-400" },
            { label: "Leased", value: assets.filter(a => a.status === "Leased").length, icon: FileText, color: "text-emerald-400" },
            { label: "Under Maintenance", value: assets.filter(a => a.status === "Under Maintenance").length, icon: Wrench, color: "text-yellow-400" },
            { label: "Available", value: assets.filter(a => a.status === "Available").length, icon: CheckCircle, color: "text-purple-400" },
          ].map((kpi) => (
            <Card key={kpi.label} className="bg-card border-border">
              <CardContent className="p-4 flex items-center gap-3">
                <kpi.icon className={`h-8 w-8 ${kpi.color}`} />
                <div>
                  <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
                  <p className="text-xs text-muted-foreground">{kpi.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Asset Table */}
          <div className="xl:col-span-2 space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-2">
              <div className="relative flex-1 min-w-48">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, city, or tags..."
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1); }}
                  className="pl-9 bg-background border-border"
                />
              </div>
              <Select value={assetType} onValueChange={v => { setAssetType(v); setPage(1); }}>
                <SelectTrigger className="w-44 bg-background border-border">
                  <SelectValue placeholder="Asset Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {ASSET_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(1); }}>
                <SelectTrigger className="w-44 bg-background border-border">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {ASSET_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Table */}
            <Card className="bg-card border-border">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left p-3 text-muted-foreground font-medium">Asset</th>
                      <th className="text-left p-3 text-muted-foreground font-medium">Type</th>
                      <th className="text-left p-3 text-muted-foreground font-medium">Location</th>
                      <th className="text-left p-3 text-muted-foreground font-medium">Condition</th>
                      <th className="text-left p-3 text-muted-foreground font-medium">Maintenance</th>
                      <th className="text-left p-3 text-muted-foreground font-medium">Status</th>
                      <th className="text-left p-3 text-muted-foreground font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">Loading assets...</td></tr>
                    ) : assets.length === 0 ? (
                      <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No assets found. Register your first asset.</td></tr>
                    ) : assets.map((asset) => (
                      <tr
                        key={String(asset.asset_id)}
                        className={`border-b border-border hover:bg-muted/20 cursor-pointer transition-colors ${selectedAsset?.asset_id === asset.asset_id ? "bg-primary/10" : ""}`}
                        onClick={() => setSelectedAsset(asset as Record<string, string | number | boolean | null>)}
                      >
                        <td className="p-3">
                          <div className="font-medium text-foreground">{String(asset.asset_name || "—")}</div>
                          <div className="text-xs text-muted-foreground font-mono">{String(asset.asset_code || "—")}</div>
                        </td>
                        <td className="p-3">
                          <Badge variant="outline" className="text-xs border-border">
                            {String(asset.asset_type || "—")}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1 text-muted-foreground text-xs">
                            <MapPin className="h-3 w-3 flex-shrink-0" />
                            <span>{String(asset.city || "—")}, {String(asset.country || "")}</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge className={`text-xs border ${CONDITION_COLORS[String(asset.condition_rating)] || "bg-gray-500/20 text-gray-400"}`}>
                            {String(asset.condition_rating || "—")}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1 text-xs">
                            {String(asset.maintenance_responsibility) === "Vodafone" ? (
                              <AlertTriangle className="h-3 w-3 text-yellow-400" />
                            ) : (
                              <CheckCircle className="h-3 w-3 text-emerald-400" />
                            )}
                            <span className="text-muted-foreground">{String(asset.maintenance_responsibility || "—")}</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge variant="outline" className={`text-xs ${String(asset.status) === "Leased" ? "border-emerald-500/50 text-emerald-400" : String(asset.status) === "Available" ? "border-blue-500/50 text-blue-400" : "border-border text-muted-foreground"}`}>
                            {String(asset.status || "—")}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={e => { e.stopPropagation(); setSelectedAsset(asset as Record<string, string | number | boolean | null>); }}>
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={e => { e.stopPropagation(); setSelectedAsset(asset as Record<string, string | number | boolean | null>); handleEdit(asset); }}>
                              <Edit className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-between p-3 border-t border-border">
                  <span className="text-sm text-muted-foreground">Page {page} of {totalPages} ({total} assets)</span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
                    <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Detail Panel */}
          <div className="xl:col-span-1">
            {selectedAsset ? (
              <Card className="bg-card border-border sticky top-6">
                <CardHeader className="pb-3 border-b border-border">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base text-foreground">{String(selectedAsset.asset_name || "—")}</CardTitle>
                      <p className="text-xs text-muted-foreground font-mono mt-1">{String(selectedAsset.asset_code || "—")}</p>
                    </div>
                    <Badge className={`text-xs border ${CONDITION_COLORS[String(selectedAsset.condition_rating)] || "bg-gray-500/20 text-gray-400"}`}>
                      {String(selectedAsset.condition_rating || "—")}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="w-full rounded-none border-b border-border bg-muted/30 h-9">
                      <TabsTrigger value="overview" className="text-xs flex-1">Overview</TabsTrigger>
                      <TabsTrigger value="leases" className="text-xs flex-1">Leases</TabsTrigger>
                      <TabsTrigger value="maintenance" className="text-xs flex-1">Maintenance</TabsTrigger>
                      <TabsTrigger value="technical" className="text-xs flex-1">Technical</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="p-4 space-y-4">
                      <div>
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> Location
                        </h4>
                        <div className="space-y-1 text-sm">
                          <div className="text-foreground">{String(selectedAsset.address_line1 || "—")}</div>
                          <div className="text-muted-foreground">{String(selectedAsset.city || "")}{selectedAsset.city ? ", " : ""}{String(selectedAsset.country || "")}</div>
                          {(selectedAsset.latitude && selectedAsset.longitude) ? (
                            <div className="text-xs text-muted-foreground font-mono">
                              GPS: {String(selectedAsset.latitude)}, {String(selectedAsset.longitude)}
                            </div>
                          ) : null}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                          <Tag className="h-3 w-3" /> Asset Details
                        </h4>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {([
                            ["Type", String(selectedAsset.asset_type || "—")],
                            ["Status", String(selectedAsset.status || "—")],
                            ["Maintenance", String(selectedAsset.maintenance_responsibility || "—")],
                            ["Floor Area", selectedAsset.floor_area_sqm ? `${String(selectedAsset.floor_area_sqm)} sqm` : "—"],
                            ["Market Value", selectedAsset.estimated_market_value ? `AED ${Number(selectedAsset.estimated_market_value).toLocaleString()}` : "—"],
                            ["Make-Good", selectedAsset.make_good_provision ? `AED ${Number(selectedAsset.make_good_provision).toLocaleString()}` : "—"],
                          ] as [string, string][]).map(([label, value]) => (
                            <div key={label}>
                              <span className="text-muted-foreground">{label}</span>
                              <div className="text-foreground font-medium">{value}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                      {selectedAsset.description ? (
                        <div>
                          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Description</h4>
                          <p className="text-xs text-muted-foreground">{String(selectedAsset.description)}</p>
                        </div>
                      ) : null}
                      <Button size="sm" variant="outline" className="w-full" onClick={() => handleEdit(selectedAsset)}>
                        <Edit className="h-3 w-3 mr-1" /> Edit Asset
                      </Button>
                    </TabsContent>

                    <TabsContent value="leases" className="p-4">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1">
                        <FileText className="h-3 w-3" /> Lease History
                      </h4>
                      {detailLoading ? (
                        <p className="text-xs text-muted-foreground">Loading...</p>
                      ) : leaseHistory.length === 0 ? (
                        <div className="text-center py-6 text-muted-foreground">
                          <FileText className="h-8 w-8 mx-auto mb-2 opacity-30" />
                          <p className="text-xs">No leases found for this asset</p>
                        </div>
                      ) : leaseHistory.map((lease, i) => (
                        <div key={i} className="border border-border rounded-lg p-3 mb-2 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-foreground font-mono">{String(lease.lease_ref || "—")}</span>
                            <Badge variant="outline" className={`text-xs ${String(lease.status) === "Active" ? "border-emerald-500/50 text-emerald-400" : "border-border text-muted-foreground"}`}>
                              {String(lease.status || "—")}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Building2 className="h-3 w-3" />
                            <span>{String(lease.lessor_name || "—")}</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>
                              {lease.commencement_date ? new Date(String(lease.commencement_date)).toLocaleDateString() : "—"}
                              {" → "}
                              {lease.expiry_date ? new Date(String(lease.expiry_date)).toLocaleDateString() : "—"}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <DollarSign className="h-3 w-3" />
                            <span>AED {Number(lease.monthly_payment || 0).toLocaleString()} / month</span>
                          </div>
                        </div>
                      ))}
                    </TabsContent>

                    <TabsContent value="maintenance" className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                          <Wrench className="h-3 w-3" /> Maintenance History
                        </h4>
                        <Badge variant="outline" className={`text-xs ${String(selectedAsset.maintenance_responsibility) === "Vodafone" ? "border-yellow-500/50 text-yellow-400" : "border-emerald-500/50 text-emerald-400"}`}>
                          {String(selectedAsset.maintenance_responsibility)} Responsible
                        </Badge>
                      </div>
                      {detailLoading ? (
                        <p className="text-xs text-muted-foreground">Loading...</p>
                      ) : maintenanceHistory.length === 0 ? (
                        <div className="text-center py-6 text-muted-foreground">
                          <Wrench className="h-8 w-8 mx-auto mb-2 opacity-30" />
                          <p className="text-xs">No maintenance records found</p>
                        </div>
                      ) : maintenanceHistory.map((ticket, i) => (
                        <div key={i} className="border border-border rounded-lg p-3 mb-2 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-foreground">{String(ticket.ticket_ref || "—")}</span>
                            <Badge variant="outline" className={`text-xs ${String(ticket.status) === "Closed" ? "border-emerald-500/50 text-emerald-400" : "border-yellow-500/50 text-yellow-400"}`}>
                              {String(ticket.status || "—")}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{String(ticket.description || "—")}</p>
                          <div className="text-xs text-muted-foreground">
                            {ticket.reported_date ? new Date(String(ticket.reported_date)).toLocaleDateString() : "—"}
                            {ticket.actual_cost ? <span className="ml-2">Cost: AED {Number(ticket.actual_cost).toLocaleString()}</span> : null}
                          </div>
                        </div>
                      ))}
                    </TabsContent>

                    <TabsContent value="technical" className="p-4 space-y-3">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                        <Layers className="h-3 w-3" /> Technical Specifications
                      </h4>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        {([
                          ["Floor Area", selectedAsset.floor_area_sqm ? `${String(selectedAsset.floor_area_sqm)} sqm` : "—"],
                          ["Floors", selectedAsset.floors ? String(selectedAsset.floors) : "—"],
                          ["Year Built", selectedAsset.year_built ? String(selectedAsset.year_built) : "—"],
                          ["Make-Good Provision", selectedAsset.make_good_provision ? `AED ${Number(selectedAsset.make_good_provision).toLocaleString()}` : "—"],
                        ] as [string, string][]).map(([label, value]) => (
                          <div key={label} className="bg-muted/30 rounded p-2">
                            <span className="text-muted-foreground block">{label}</span>
                            <span className="text-foreground font-medium">{value}</span>
                          </div>
                        ))}
                      </div>
                      {selectedAsset.tags ? (
                        <div>
                          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Tags</h4>
                          <div className="flex flex-wrap gap-1">
                            {String(selectedAsset.tags).split(",").map(tag => (
                              <Badge key={tag} variant="outline" className="text-xs border-border">{tag.trim()}</Badge>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-card border-border">
                <CardContent className="p-12 text-center">
                  <Package className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-30" />
                  <p className="text-muted-foreground text-sm">Select an asset to view its full details</p>
                  <p className="text-muted-foreground text-xs mt-1">Click any row in the table to view details, lease history, and maintenance records</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Asset Form Dialog */}
      <SlidePanel open={showForm} onClose={() => setShowForm(false)} title="" width="xl">
        
          
            
          
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground text-xs">Asset Name *</Label>
                <Input value={form.assetName} onChange={e => setForm(f => ({ ...f, assetName: e.target.value }))} placeholder="e.g. Dubai Marina Tower Site" className="bg-background border-border mt-1" />
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Asset Type *</Label>
                <Select value={form.assetType} onValueChange={v => setForm(f => ({ ...f, assetType: v as AssetType }))}>
                  <SelectTrigger className="bg-background border-border mt-1"><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>{ASSET_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground text-xs">Condition Rating</Label>
                <Select value={form.conditionRating} onValueChange={v => setForm(f => ({ ...f, conditionRating: v as ConditionRating }))}>
                  <SelectTrigger className="bg-background border-border mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{CONDITION_RATINGS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Status</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v as AssetStatus }))}>
                  <SelectTrigger className="bg-background border-border mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{ASSET_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">Maintenance Responsibility</Label>
              <Select value={form.maintenanceResponsibility} onValueChange={v => setForm(f => ({ ...f, maintenanceResponsibility: v as MaintenanceResp }))}>
                <SelectTrigger className="bg-background border-border mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{MAINTENANCE_RESPS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">Address</Label>
              <Input value={form.addressLine1} onChange={e => setForm(f => ({ ...f, addressLine1: e.target.value }))} placeholder="Street address" className="bg-background border-border mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground text-xs">City</Label>
                <Input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="City" className="bg-background border-border mt-1" />
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Country (ISO 2)</Label>
                <Input value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))} maxLength={2} className="bg-background border-border mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground text-xs">GPS Latitude</Label>
                <Input value={form.latitude} onChange={e => setForm(f => ({ ...f, latitude: e.target.value }))} placeholder="e.g. 25.2048" className="bg-background border-border mt-1" />
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">GPS Longitude</Label>
                <Input value={form.longitude} onChange={e => setForm(f => ({ ...f, longitude: e.target.value }))} placeholder="e.g. 55.2708" className="bg-background border-border mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-muted-foreground text-xs">Floor Area (sqm)</Label>
                <Input type="number" value={form.floorAreaSqm} onChange={e => setForm(f => ({ ...f, floorAreaSqm: e.target.value }))} placeholder="0" className="bg-background border-border mt-1" />
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Market Value (AED)</Label>
                <Input type="number" value={form.estimatedMarketValue} onChange={e => setForm(f => ({ ...f, estimatedMarketValue: e.target.value }))} placeholder="0.00" className="bg-background border-border mt-1" />
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Make-Good Provision (AED)</Label>
                <Input type="number" value={form.makeGoodProvision} onChange={e => setForm(f => ({ ...f, makeGoodProvision: e.target.value }))} placeholder="0.00" className="bg-background border-border mt-1" />
              </div>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">Last Valuation Date</Label>
              <Input type="date" value={form.lastValuationDate} onChange={e => setForm(f => ({ ...f, lastValuationDate: e.target.value }))} className="bg-background border-border mt-1" />
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">Tags (comma-separated)</Label>
              <Input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="e.g. critical, urban, 5G" className="bg-background border-border mt-1" />
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">Description / Notes</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Additional details about this asset..." className="bg-background border-border mt-1" rows={3} />
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10 mt-4">
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={upsertMutation.isPending}>
              {upsertMutation.isPending ? "Saving..." : editMode ? "Update Asset" : "Register Asset"}
            </Button>
          </div>
        
      </SlidePanel>
    </DashboardLayout>
  );
}
