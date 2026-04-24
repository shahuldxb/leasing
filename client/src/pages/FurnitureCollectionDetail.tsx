/**
 * VodaLease Enterprise — Property Furniture Collection Detail
 * Screen ID: VFLPROPFUR0002P001
 * Full CRUD for individual furniture/appliance items within a property collection.
 * Items are grouped by category with totals per category and grand total.
 */
import { useState, useMemo } from "react";
import { useRoute, useLocation } from "wouter";
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
import { toast } from "sonner";
import {
  ArrowLeft, Plus, Pencil, Trash2, Package, DollarSign,
  Sofa, ChevronDown, ChevronRight, Download
} from "lucide-react";

const CATEGORIES = [
  "Sofa & Seating", "Beds & Mattresses", "Dining & Kitchen",
  "Storage & Wardrobes", "Appliances", "Electronics", "Lighting",
  "Curtains & Blinds", "Bathroom Fixtures", "Outdoor & Balcony", "Other",
];

const CONDITIONS = ["New", "Excellent", "Good", "Fair", "Poor", "Damaged"];

const CONDITION_COLORS: Record<string, string> = {
  New:       "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  Excellent: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  Good:      "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  Fair:      "bg-amber-500/20 text-amber-400 border-amber-500/30",
  Poor:      "bg-orange-500/20 text-orange-400 border-orange-500/30",
  Damaged:   "bg-red-500/20 text-red-400 border-red-500/30",
};

const EMPTY_ITEM = {
  category: "Sofa & Seating",
  name: "",
  brand: "",
  model: "",
  serial_number: "",
  condition: "Good",
  quantity: 1,
  unit_value: 0,
  notes: "",
};

export default function FurnitureCollectionDetail() {
  const [, navigate] = useLocation();
  const [match, params] = useRoute("/assets/furniture/:id");
  const collectionId = match ? parseInt(params!.id) : 0;

  const [showPanel, setShowPanel] = useState(false);
  const [aiRecord, setAiRecord] = useState<Record<string, unknown> | null>(null);
  const [editItemId, setEditItemId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...EMPTY_ITEM });
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(CATEGORIES));

  const { data, refetch, isLoading } = trpc.furnitureCollections.getWithItems.useQuery(
    { collection_id: collectionId },
    { enabled: collectionId > 0, refetchOnWindowFocus: false }
  );

  const addItemMut = trpc.furnitureCollections.addItem.useMutation({
    onSuccess: () => { toast.success("Item added"); refetch(); closePanel(); },
    onError: (e) => toast.error(e.message),
  });

  const updateItemMut = trpc.furnitureCollections.updateItem.useMutation({
    onSuccess: () => { toast.success("Item updated"); refetch(); closePanel(); },
    onError: (e) => toast.error(e.message),
  });

  const deleteItemMut = trpc.furnitureCollections.deleteItem.useMutation({
    onSuccess: () => { toast.success("Item removed"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const collection = data?.collection;
  const items: any[] = data?.items || [];

  // Group items by category
  const grouped = useMemo(() => {
    const map: Record<string, any[]> = {};
    for (const item of items) {
      if (!map[item.category]) map[item.category] = [];
      map[item.category].push(item);
    }
    return map;
  }, [items]);

  const totalValue = items.reduce((s, i) => s + Number(i.total_value || 0), 0);
  const totalQty = items.reduce((s, i) => s + Number(i.quantity || 0), 0);

  function openAdd() {
    setEditItemId(null);
    setForm({ ...EMPTY_ITEM });
    setShowPanel(true);
  }

  function openEdit(item: any) {
    setEditItemId(item.item_id);
    setForm({
      category: item.category,
      name: item.name,
      brand: item.brand || "",
      model: item.model || "",
      serial_number: item.serial_number || "",
      condition: item.condition || item.condition_status || "Good",
      quantity: item.quantity,
      unit_value: item.unit_value,
      notes: item.notes || "",
    });
    setShowPanel(true);
  }

  function closePanel() {
    setShowPanel(false);
    setEditItemId(null);
    setForm({ ...EMPTY_ITEM });
  }

  function handleSubmit() {
    if (!form.name || !form.category) {
      toast.error("Item name and category are required");
      return;
    }
    if (editItemId) {
      updateItemMut.mutate({ item_id: editItemId, collection_id: collectionId, ...form });
    } else {
      addItemMut.mutate({ collection_id: collectionId, ...form });
    }
  }

  function handleDelete(itemId: number, name: string) {
    if (confirm(`Remove "${name}" from this collection?`)) {
      deleteItemMut.mutate({ item_id: itemId });
    }
  }

  function toggleCategory(cat: string) {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat); else next.add(cat);
      return next;
    });
  }

  function exportCSV() {
    const rows = [
      ["Category", "Item Name", "Brand", "Model", "Serial Number", "Condition", "Qty", "Unit Value (AED)", "Total Value (AED)", "Notes"],
      ...items.map(i => [i.category, i.name, i.brand || "", i.model || "", i.serial_number || "", i.condition || i.condition_status || "", i.quantity, i.unit_value, i.total_value, i.notes || ""]),
    ];
    const csv = rows.map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `furniture-${collection?.property_id || collectionId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-6 flex items-center justify-center h-64 text-muted-foreground">
          <Package className="w-8 h-8 animate-pulse mr-3" /> Loading collection…
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-5">
        <ScreenHeader
          screenId="VFLPROPFUR0002P001"
          title={collection?.collection_name || "Furniture Collection"}
          subtitle={collection?.property_name || "Property furniture and appliance inventory"}
        
          screenType="furniture_collection_detail"
          onAIData={(rows) => setAiRecord(rows[0] ?? null)}
        />

        {/* Back + actions */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => navigate("/assets/furniture")}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Back to Collections
            </Button>
            {collection && (
              <div>
                <Badge className={`text-xs mr-2 ${
                  collection.property_type === "VILLA" ? "bg-purple-500/20 text-purple-400 border-purple-500/30" :
                  collection.property_type === "FLAT" ? "bg-blue-500/20 text-blue-400 border-blue-500/30" :
                  "bg-muted text-muted-foreground"
                }`}>
                  {collection.property_type}
                </Badge>
                <span className="text-sm text-muted-foreground font-mono">{collection.property_id}</span>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportCSV}>
              <Download className="w-4 h-4 mr-2" /> Export CSV
            </Button>
            <Button className="bg-[#e60000] hover:bg-[#cc0000] text-white" size="sm" onClick={openAdd}>
              <Plus className="w-4 h-4 mr-2" /> Add Item
            </Button>
          </div>
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Unique Items", value: items.length, icon: <Package className="w-4 h-4 text-[#e60000]" /> },
            { label: "Total Quantity", value: totalQty, icon: <Sofa className="w-4 h-4 text-blue-400" /> },
            { label: "Total Value (AED)", value: totalValue.toLocaleString(), icon: <DollarSign className="w-4 h-4 text-emerald-400" /> },
            { label: "Categories", value: Object.keys(grouped).length, icon: <Package className="w-4 h-4 text-amber-400" /> },
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

        {/* Items grouped by category */}
        {items.length === 0 ? (
          <div className="bg-card border border-border rounded-xl py-16 flex flex-col items-center text-muted-foreground">
            <Sofa className="w-12 h-12 mb-4 opacity-30" />
            <p className="text-sm mb-3">No items in this collection yet.</p>
            <Button className="bg-[#e60000] hover:bg-[#cc0000] text-white" onClick={openAdd}>
              <Plus className="w-4 h-4 mr-2" /> Add First Item
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {Object.entries(grouped).map(([cat, catItems]) => {
              const catTotal = catItems.reduce((s, i) => s + Number(i.total_value || 0), 0);
              const expanded = expandedCategories.has(cat);
              return (
                <div key={cat} className="bg-card border border-border rounded-xl overflow-hidden">
                  {/* Category header */}
                  <div
                    className="flex items-center justify-between px-4 py-3 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => toggleCategory(cat)}
                  >
                    <div className="flex items-center gap-3">
                      {expanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                      <span className="font-semibold text-sm">{cat}</span>
                      <Badge variant="outline" className="text-xs">{catItems.length} items</Badge>
                    </div>
                    <span className="text-sm font-medium text-muted-foreground">
                      AED {catTotal.toLocaleString()}
                    </span>
                  </div>

                  {/* Items table */}
                  {expanded && (
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/10">
                          <TableHead className="text-xs">Item Name</TableHead>
                          <TableHead className="text-xs">Brand / Model</TableHead>
                          <TableHead className="text-xs">Serial No.</TableHead>
                          <TableHead className="text-xs">Condition</TableHead>
                          <TableHead className="text-xs text-right">Qty</TableHead>
                          <TableHead className="text-xs text-right">Unit Value</TableHead>
                          <TableHead className="text-xs text-right">Total Value</TableHead>
                          <TableHead className="text-xs">Notes</TableHead>
                          <TableHead className="text-xs text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {catItems.map(item => (
                          <TableRow key={item.item_id} className="hover:bg-muted/20 text-sm">
                            <TableCell className="font-medium">{item.name}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {[item.brand, item.model].filter(Boolean).join(" / ") || "—"}
                            </TableCell>
                            <TableCell className="font-mono text-xs">{item.serial_number || "—"}</TableCell>
                            <TableCell>
                              <Badge className={`text-xs ${CONDITION_COLORS[item.condition || item.condition_status] || "bg-muted text-muted-foreground"}`}>
                                {item.condition || item.condition_status || "—"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">{item.quantity}</TableCell>
                            <TableCell className="text-right">{Number(item.unit_value).toLocaleString()}</TableCell>
                            <TableCell className="text-right font-medium">{Number(item.total_value).toLocaleString()}</TableCell>
                            <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate">{item.notes || "—"}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(item)}>
                                  <Pencil className="w-3.5 h-3.5" />
                                </Button>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-400 hover:text-red-300" onClick={() => handleDelete(item.item_id, item.name)}>
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              );
            })}

            {/* Grand total */}
            <div className="flex items-center justify-between px-4 py-3 bg-card border border-border rounded-xl">
              <span className="font-semibold text-sm">Grand Total</span>
              <div className="flex items-center gap-6 text-sm">
                <span className="text-muted-foreground">{totalQty} items total</span>
                <span className="font-bold text-lg">AED {totalValue.toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Item Slide Panel */}
      <SlidePanel
        open={showPanel}
        onClose={closePanel}
        title={editItemId ? "Edit Furniture Item" : "Add Furniture Item"}
        subtitle="Add or update an item in this property's collection"
        width="lg"
        headerAction={
          <GenAIFillButton
            formType="furniture_item"
            onFill={(data) => {
              if (data.name) setForm(f => ({ ...f, name: String(data.name) }));
              if (data.brand) setForm(f => ({ ...f, brand: String(data.brand) }));
              if (data.model) setForm(f => ({ ...f, model: String(data.model) }));
              if (data.category) setForm(f => ({ ...f, category: String(data.category) }));
              if (data.condition) setForm(f => ({ ...f, condition: String(data.condition) }));
              if (data.quantity) setForm(f => ({ ...f, quantity: Number(data.quantity) }));
              if (data.unit_value) setForm(f => ({ ...f, unit_value: Number(data.unit_value) }));
              if (data.serial_number) setForm(f => ({ ...f, serial_number: String(data.serial_number) }));
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
              disabled={addItemMut.isPending || updateItemMut.isPending}
            >
              {addItemMut.isPending || updateItemMut.isPending ? "Saving…" : editItemId ? "Update Item" : "Add Item"}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Category *</label>
              <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Condition *</label>
              <Select value={form.condition} onValueChange={v => setForm(f => ({ ...f, condition: v }))}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONDITIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Item Name *</label>
            <Input
              className="mt-1"
              placeholder="e.g. L-Shape Sofa, King Bed Frame, Samsung Refrigerator"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Brand</label>
              <Input
                className="mt-1"
                placeholder="e.g. IKEA, Samsung, LG"
                value={form.brand}
                onChange={e => setForm(f => ({ ...f, brand: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Model</label>
              <Input
                className="mt-1"
                placeholder="e.g. KIVIK, RF65A977FSR"
                value={form.model}
                onChange={e => setForm(f => ({ ...f, model: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Serial Number</label>
            <Input
              className="mt-1"
              placeholder="e.g. SN-2024-001"
              value={form.serial_number}
              onChange={e => setForm(f => ({ ...f, serial_number: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Quantity *</label>
              <Input
                className="mt-1"
                type="number"
                min={1}
                value={form.quantity}
                onChange={e => setForm(f => ({ ...f, quantity: parseInt(e.target.value) || 1 }))}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Unit Value (AED) *</label>
              <Input
                className="mt-1"
                type="number"
                min={0}
                step={100}
                value={form.unit_value}
                onChange={e => setForm(f => ({ ...f, unit_value: parseFloat(e.target.value) || 0 }))}
              />
            </div>
          </div>

          {/* Live total preview */}
          <div className="rounded-lg bg-muted/50 border border-border p-3 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Total Value Preview</span>
            <span className="font-bold text-base">AED {(form.quantity * form.unit_value).toLocaleString()}</span>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Notes</label>
            <textarea
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none min-h-[70px] focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Any notes about this item (colour, size, special features)…"
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            />
          </div>
        </div>
      </SlidePanel>
    </DashboardLayout>
  );
}
