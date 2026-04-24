/**
 * VodaLease Enterprise — Property Furniture Collections
 * Screen ID: VFLPROPFUR0001P001
 * Lists all property furniture collections (flat/villa packs).
 * Each property has its own named collection of items that can be edited independently.
 */
import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import SlidePanel from "@/components/SlidePanel";
import { GenAIFillButton } from "@/components/GenAIFillButton";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { toast } from "sonner";
import {
  Search, Plus, Sofa, Home, Building2, Pencil, Trash2,
  Package, DollarSign, Eye, ChevronRight
} from "lucide-react";

const PROPERTY_TYPE_COLORS: Record<string, string> = {
  VILLA:      "bg-purple-500/20 text-purple-400 border-purple-500/30",
  FLAT:       "bg-blue-500/20 text-blue-400 border-blue-500/30",
  APARTMENT:  "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  TOWNHOUSE:  "bg-amber-500/20 text-amber-400 border-amber-500/30",
  STUDIO:     "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
};

const PROPERTY_TYPE_ICONS: Record<string, React.ReactNode> = {
  VILLA:      <Home className="w-4 h-4" />,
  FLAT:       <Building2 className="w-4 h-4" />,
  APARTMENT:  <Building2 className="w-4 h-4" />,
  TOWNHOUSE:  <Home className="w-4 h-4" />,
  STUDIO:     <Building2 className="w-4 h-4" />,
};

const EMPTY_FORM = {
  property_id: "",
  property_name: "",
  collection_name: "",
  property_type: "FLAT" as const,
  notes: "",
};

export default function FurnitureCollections() {
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("ALL");
  const [showPanel, setShowPanel] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });

  const { data: collections = [], refetch } = trpc.furnitureCollections.list.useQuery(
    { search: search || undefined, property_type: filterType !== "ALL" ? filterType : undefined },
    { refetchOnWindowFocus: false }
  );

  const createMut = trpc.furnitureCollections.create.useMutation({
    onSuccess: () => { toast.success("Collection created"); refetch(); closePanel(); },
    onError: (e) => toast.error(e.message),
  });

  const updateMut = trpc.furnitureCollections.update.useMutation({
    onSuccess: () => { toast.success("Collection updated"); refetch(); closePanel(); },
    onError: (e) => toast.error(e.message),
  });

  const deleteMut = trpc.furnitureCollections.delete.useMutation({
    onSuccess: () => { toast.success("Collection deleted"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  function openCreate() {
    setEditId(null);
    setForm({ ...EMPTY_FORM });
    setShowPanel(true);
  }

  function openEdit(col: any) {
    setEditId(col.collection_id);
    setForm({
      property_id: col.property_id,
      property_name: col.property_name,
      collection_name: col.collection_name,
      property_type: col.property_type,
      notes: col.notes || "",
    });
    setShowPanel(true);
  }

  function closePanel() {
    setShowPanel(false);
    setEditId(null);
    setForm({ ...EMPTY_FORM });
  }

  function handleSubmit() {
    if (!form.property_id || !form.property_name || !form.collection_name) {
      toast.error("Property ID, Property Name, and Collection Name are required");
      return;
    }
    if (editId) {
      updateMut.mutate({ collection_id: editId, ...form });
    } else {
      createMut.mutate(form);
    }
  }

  function handleDelete(id: number, name: string) {
    if (confirm(`Delete collection "${name}" and all its items? This cannot be undone.`)) {
      deleteMut.mutate({ collection_id: id });
    }
  }

  const totalValue = (collections as any[]).reduce((s: number, c: any) => s + Number(c.total_value || 0), 0);
  const totalItems = (collections as any[]).reduce((s: number, c: any) => s + Number(c.total_items || 0), 0);

  return (
    <DashboardLayout>
      <div className="p-6 space-y-5">
        <ScreenHeader
          screenId="VFLPROPFUR0001P001"
          title="Property Furniture Collections"
          subtitle="Manage furniture and appliance inventories per flat or villa"
        />

        {/* KPI strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total Properties", value: (collections as any[]).length, icon: <Home className="w-4 h-4 text-[#e60000]" /> },
            { label: "Total Items", value: totalItems.toLocaleString(), icon: <Package className="w-4 h-4 text-blue-400" /> },
            { label: "Portfolio Value (AED)", value: `${(totalValue / 1000).toFixed(0)}K`, icon: <DollarSign className="w-4 h-4 text-emerald-400" /> },
            { label: "Avg Value / Property", value: (collections as any[]).length ? `AED ${Math.round(totalValue / (collections as any[]).length).toLocaleString()}` : "—", icon: <Sofa className="w-4 h-4 text-amber-400" /> },
          ].map(k => (
            <div key={k.label} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
              <div className="p-2 bg-muted rounded-lg">{k.icon}</div>
              <div>
                <p className="text-xs text-muted-foreground">{k.label}</p>
                <p className="text-lg font-bold">{k.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by property name, ID, or collection name…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Types</SelectItem>
              <SelectItem value="FLAT">Flat</SelectItem>
              <SelectItem value="VILLA">Villa</SelectItem>
              <SelectItem value="APARTMENT">Apartment</SelectItem>
              <SelectItem value="TOWNHOUSE">Townhouse</SelectItem>
              <SelectItem value="STUDIO">Studio</SelectItem>
            </SelectContent>
          </Select>
          <Button className="bg-[#e60000] hover:bg-[#cc0000] text-white" onClick={openCreate}>
            <Plus className="w-4 h-4 mr-2" /> New Collection
          </Button>
        </div>

        {/* Collections table */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="text-xs">Property ID</TableHead>
                <TableHead className="text-xs">Property Name</TableHead>
                <TableHead className="text-xs">Collection Name</TableHead>
                <TableHead className="text-xs">Type</TableHead>
                <TableHead className="text-xs text-right">Items</TableHead>
                <TableHead className="text-xs text-right">Total Qty</TableHead>
                <TableHead className="text-xs text-right">Total Value (AED)</TableHead>
                <TableHead className="text-xs">Last Updated</TableHead>
                <TableHead className="text-xs text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(collections as any[]).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                    <Sofa className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No furniture collections found. Create one to get started.</p>
                  </TableCell>
                </TableRow>
              ) : (
                (collections as any[]).map((col: any) => (
                  <TableRow key={col.collection_id} className="hover:bg-muted/30 cursor-pointer" onClick={() => navigate(`/assets/furniture/${col.collection_id}`)}>
                    <TableCell className="font-mono text-xs">{col.property_id}</TableCell>
                    <TableCell className="font-medium text-sm">{col.property_name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{col.collection_name}</TableCell>
                    <TableCell>
                      <Badge className={`text-xs ${PROPERTY_TYPE_COLORS[col.property_type] || "bg-muted text-muted-foreground"}`}>
                        <span className="mr-1">{PROPERTY_TYPE_ICONS[col.property_type]}</span>
                        {col.property_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-sm">{col.item_count}</TableCell>
                    <TableCell className="text-right text-sm">{col.total_items}</TableCell>
                    <TableCell className="text-right text-sm font-medium">
                      {Number(col.total_value || 0).toLocaleString(undefined, { minimumFractionDigits: 0 })}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {col.updated_at ? new Date(col.updated_at).toLocaleDateString() : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => navigate(`/assets/furniture/${col.collection_id}`)}>
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(col)}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-400 hover:text-red-300" onClick={() => handleDelete(col.collection_id, col.collection_name)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Create / Edit Slide Panel */}
      <SlidePanel
        open={showPanel}
        onClose={closePanel}
        title={editId ? "Edit Furniture Collection" : "New Furniture Collection"}
        subtitle="Link a furniture inventory to a specific property"
        width="lg"
        headerAction={
          <GenAIFillButton
            formType="furniture_collection"
            onFill={(data) => {
              if (data.property_id) setForm(f => ({ ...f, property_id: String(data.property_id) }));
              if (data.property_name) setForm(f => ({ ...f, property_name: String(data.property_name) }));
              if (data.collection_name) setForm(f => ({ ...f, collection_name: String(data.collection_name) }));
              if (data.property_type) setForm(f => ({ ...f, property_type: String(data.property_type) as any }));
              if (data.notes) setForm(f => ({ ...f, notes: String(data.notes) }));
            }}
          />
        }
        footer={
          <div className="flex gap-3">
            <Button variant="outline" onClick={closePanel} className="flex-1">Cancel</Button>
            <Button
              className="flex-1 bg-[#e60000] hover:bg-[#cc0000] text-white"
              onClick={handleSubmit}
              disabled={createMut.isPending || updateMut.isPending}
            >
              {createMut.isPending || updateMut.isPending ? "Saving…" : editId ? "Update Collection" : "Create Collection"}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Property ID *</label>
              <Input
                className="mt-1"
                placeholder="e.g. PROP-001"
                value={form.property_id}
                onChange={e => setForm(f => ({ ...f, property_id: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Property Type *</label>
              <Select value={form.property_type} onValueChange={v => setForm(f => ({ ...f, property_type: v as any }))}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["FLAT", "VILLA", "APARTMENT", "TOWNHOUSE", "STUDIO"].map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Property Name *</label>
            <Input
              className="mt-1"
              placeholder="e.g. Villa A-101, Palm Jumeirah"
              value={form.property_name}
              onChange={e => setForm(f => ({ ...f, property_name: e.target.value }))}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Collection Name *</label>
            <Input
              className="mt-1"
              placeholder="e.g. Palm Jumeirah Villa Pack"
              value={form.collection_name}
              onChange={e => setForm(f => ({ ...f, collection_name: e.target.value }))}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Notes</label>
            <textarea
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none min-h-[80px] focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Any notes about the property or its furnishings…"
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            />
          </div>

          <div className="rounded-lg bg-muted/50 border border-border p-3 text-xs text-muted-foreground">
            <p className="font-medium mb-1">After creating the collection:</p>
            <p>Click the collection row or the <Eye className="w-3 h-3 inline" /> icon to open the detail view where you can add, edit, and remove individual furniture and appliance items.</p>
          </div>
        </div>
      </SlidePanel>
    </DashboardLayout>
  );
}
