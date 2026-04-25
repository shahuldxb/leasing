/**
 * VodaLease Enterprise — Sub-Asset Registry
 * Screen ID: VFLSUBASSET0001P001
 *
 * Two-panel UI:
 *   Left  → Master Item Library (80+ items, searchable/filterable by category)
 *   Right → Set Builder (create/edit named asset sets with qty + serial numbers)
 */
import { useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Plus, Minus, Search, Trash2, Package, Layers, ChevronRight,
  Edit2, X, CheckCircle2
} from "lucide-react";
import { toast } from "sonner";
import { ScreenHeader } from "@/components/ScreenHeader";

// ─────────────────────────────────────────────────────────────────────────────
// MASTER ITEM LIBRARY
// ─────────────────────────────────────────────────────────────────────────────
interface MasterItem {
  code: string;
  name: string;
  category: "Furniture" | "Appliance" | "Electronics" | "Fixture" | "Bedding";
  brand?: string;
  model?: string;
  spec?: string;
  unit: string;
}

const MASTER_ITEMS: MasterItem[] = [
  // ── Furniture ──────────────────────────────────────────────────────────────
  { code: "FRN-001", name: "Sofa (3-Seater)",           category: "Furniture", spec: "3-Seater",           unit: "Pcs" },
  { code: "FRN-002", name: "Sofa (2-Seater)",           category: "Furniture", spec: "2-Seater",           unit: "Pcs" },
  { code: "FRN-003", name: "Sofa (L-Shape)",            category: "Furniture", spec: "L-Shape",            unit: "Pcs" },
  { code: "FRN-004", name: "Armchair",                  category: "Furniture",                              unit: "Pcs" },
  { code: "FRN-005", name: "Coffee Table",              category: "Furniture",                              unit: "Pcs" },
  { code: "FRN-006", name: "Side Table",                category: "Furniture",                              unit: "Pcs" },
  { code: "FRN-007", name: "Dining Table (4-Seater)",   category: "Furniture", spec: "4-Seater",           unit: "Set" },
  { code: "FRN-008", name: "Dining Table (6-Seater)",   category: "Furniture", spec: "6-Seater",           unit: "Set" },
  { code: "FRN-009", name: "Dining Table (8-Seater)",   category: "Furniture", spec: "8-Seater",           unit: "Set" },
  { code: "FRN-010", name: "Dining Chair",              category: "Furniture",                              unit: "Pcs" },
  { code: "FRN-011", name: "Bed (King Size)",           category: "Furniture", spec: "King 180×200cm",     unit: "Pcs" },
  { code: "FRN-012", name: "Bed (Queen Size)",          category: "Furniture", spec: "Queen 160×200cm",    unit: "Pcs" },
  { code: "FRN-013", name: "Bed (Single)",              category: "Furniture", spec: "Single 90×200cm",    unit: "Pcs" },
  { code: "FRN-014", name: "Bunk Bed",                  category: "Furniture",                              unit: "Pcs" },
  { code: "FRN-015", name: "Bedside Table",             category: "Furniture",                              unit: "Pcs" },
  { code: "FRN-016", name: "Wardrobe (2-Door)",         category: "Furniture", spec: "2-Door",             unit: "Pcs" },
  { code: "FRN-017", name: "Wardrobe (3-Door)",         category: "Furniture", spec: "3-Door",             unit: "Pcs" },
  { code: "FRN-018", name: "Wardrobe (4-Door Sliding)", category: "Furniture", spec: "4-Door Sliding",     unit: "Pcs" },
  { code: "FRN-019", name: "Cupboard / Cabinet",        category: "Furniture",                              unit: "Pcs" },
  { code: "FRN-020", name: "Chest of Drawers",          category: "Furniture",                              unit: "Pcs" },
  { code: "FRN-021", name: "Bookshelf",                 category: "Furniture",                              unit: "Pcs" },
  { code: "FRN-022", name: "TV Unit / Entertainment Cabinet", category: "Furniture",                        unit: "Pcs" },
  { code: "FRN-023", name: "Study Desk",                category: "Furniture",                              unit: "Pcs" },
  { code: "FRN-024", name: "Study Chair",               category: "Furniture",                              unit: "Pcs" },
  { code: "FRN-025", name: "Dressing Table with Mirror",category: "Furniture",                              unit: "Pcs" },
  { code: "FRN-026", name: "Shoe Rack",                 category: "Furniture",                              unit: "Pcs" },
  { code: "FRN-027", name: "Hall Tree / Coat Stand",    category: "Furniture",                              unit: "Pcs" },
  { code: "FRN-028", name: "Ottoman / Pouf",            category: "Furniture",                              unit: "Pcs" },
  { code: "FRN-029", name: "Outdoor Patio Set",         category: "Furniture", spec: "4-Seater",           unit: "Set" },
  { code: "FRN-030", name: "Bar Stool",                 category: "Furniture",                              unit: "Pcs" },
  // ── Bedding ─────────────────────────────────────────────────────────────────
  { code: "BED-001", name: "Mattress (King)",           category: "Bedding",   spec: "King 180×200cm",     unit: "Pcs" },
  { code: "BED-002", name: "Mattress (Queen)",          category: "Bedding",   spec: "Queen 160×200cm",    unit: "Pcs" },
  { code: "BED-003", name: "Mattress (Single)",         category: "Bedding",   spec: "Single 90×200cm",    unit: "Pcs" },
  { code: "BED-004", name: "Pillow",                    category: "Bedding",                                unit: "Pcs" },
  { code: "BED-005", name: "Duvet / Comforter",         category: "Bedding",                                unit: "Pcs" },
  { code: "BED-006", name: "Bed Sheet Set",             category: "Bedding",                                unit: "Set" },
  // ── Air Conditioners ────────────────────────────────────────────────────────
  { code: "AC-001",  name: "Split AC — LG",             category: "Appliance", brand: "LG",       model: "S12ET",      spec: "1.0 Ton",    unit: "Unit" },
  { code: "AC-002",  name: "Split AC — LG",             category: "Appliance", brand: "LG",       model: "S18ET",      spec: "1.5 Ton",    unit: "Unit" },
  { code: "AC-003",  name: "Split AC — LG",             category: "Appliance", brand: "LG",       model: "S24ET",      spec: "2.0 Ton",    unit: "Unit" },
  { code: "AC-004",  name: "Split AC — Samsung",        category: "Appliance", brand: "Samsung",  model: "AR12TYHQB",  spec: "1.0 Ton",    unit: "Unit" },
  { code: "AC-005",  name: "Split AC — Samsung",        category: "Appliance", brand: "Samsung",  model: "AR18TYHQB",  spec: "1.5 Ton",    unit: "Unit" },
  { code: "AC-006",  name: "Split AC — Samsung",        category: "Appliance", brand: "Samsung",  model: "AR24TYHQB",  spec: "2.0 Ton",    unit: "Unit" },
  { code: "AC-007",  name: "Split AC — Daikin",         category: "Appliance", brand: "Daikin",   model: "FTKF35TV",   spec: "1.0 Ton",    unit: "Unit" },
  { code: "AC-008",  name: "Split AC — Daikin",         category: "Appliance", brand: "Daikin",   model: "FTKF50TV",   spec: "1.5 Ton",    unit: "Unit" },
  { code: "AC-009",  name: "Split AC — Daikin",         category: "Appliance", brand: "Daikin",   model: "FTKF60TV",   spec: "2.0 Ton",    unit: "Unit" },
  { code: "AC-010",  name: "Split AC — Carrier",        category: "Appliance", brand: "Carrier",  model: "42QHC012",   spec: "1.0 Ton",    unit: "Unit" },
  { code: "AC-011",  name: "Split AC — Carrier",        category: "Appliance", brand: "Carrier",  model: "42QHC018",   spec: "1.5 Ton",    unit: "Unit" },
  { code: "AC-012",  name: "Split AC — Carrier",        category: "Appliance", brand: "Carrier",  model: "42QHC024",   spec: "2.0 Ton",    unit: "Unit" },
  { code: "AC-013",  name: "Split AC — Midea",          category: "Appliance", brand: "Midea",    model: "MSM-12HRN1", spec: "1.0 Ton",    unit: "Unit" },
  { code: "AC-014",  name: "Split AC — Midea",          category: "Appliance", brand: "Midea",    model: "MSM-18HRN1", spec: "1.5 Ton",    unit: "Unit" },
  { code: "AC-015",  name: "Split AC — Midea",          category: "Appliance", brand: "Midea",    model: "MSM-24HRN1", spec: "2.0 Ton",    unit: "Unit" },
  { code: "AC-016",  name: "Cassette AC — Daikin",      category: "Appliance", brand: "Daikin",   model: "FCQ60FV",    spec: "2.0 Ton",    unit: "Unit" },
  { code: "AC-017",  name: "Cassette AC — Carrier",     category: "Appliance", brand: "Carrier",  model: "42GQC024",   spec: "2.0 Ton",    unit: "Unit" },
  // ── Washing Machines ────────────────────────────────────────────────────────
  { code: "WM-001",  name: "Washing Machine — LG Front Load",      category: "Appliance", brand: "LG",       model: "F4V5RYP0W",   spec: "9 kg",     unit: "Unit" },
  { code: "WM-002",  name: "Washing Machine — LG Front Load",      category: "Appliance", brand: "LG",       model: "F4V7RYP0W",   spec: "11 kg",    unit: "Unit" },
  { code: "WM-003",  name: "Washing Machine — Samsung Front Load", category: "Appliance", brand: "Samsung",  model: "WW90T534DAE", spec: "9 kg",     unit: "Unit" },
  { code: "WM-004",  name: "Washing Machine — Samsung Front Load", category: "Appliance", brand: "Samsung",  model: "WW11BB944DGE",spec: "11 kg",    unit: "Unit" },
  { code: "WM-005",  name: "Washing Machine — Bosch Front Load",   category: "Appliance", brand: "Bosch",    model: "WAX32EH0GC",  spec: "10 kg",    unit: "Unit" },
  { code: "WM-006",  name: "Washing Machine — Whirlpool Top Load", category: "Appliance", brand: "Whirlpool",model: "WTW5000DW",   spec: "8 kg",     unit: "Unit" },
  { code: "WM-007",  name: "Washing Machine — Midea Front Load",   category: "Appliance", brand: "Midea",    model: "MF200W90WB",  spec: "9 kg",     unit: "Unit" },
  { code: "WM-008",  name: "Dryer — LG",                           category: "Appliance", brand: "LG",       model: "DV90T5240AX", spec: "9 kg",     unit: "Unit" },
  { code: "WM-009",  name: "Dryer — Samsung",                      category: "Appliance", brand: "Samsung",  model: "DV90T5240AX", spec: "9 kg",     unit: "Unit" },
  { code: "WM-010",  name: "Washer-Dryer Combo — Bosch",           category: "Appliance", brand: "Bosch",    model: "WNA14400GC",  spec: "10/6 kg",  unit: "Unit" },
  // ── Refrigerators ───────────────────────────────────────────────────────────
  { code: "RF-001",  name: "Refrigerator — LG 2-Door",             category: "Appliance", brand: "LG",       model: "GN-B422SQCL", spec: "420 L",    unit: "Unit" },
  { code: "RF-002",  name: "Refrigerator — LG French Door",        category: "Appliance", brand: "LG",       model: "GR-X267CQES", spec: "617 L",    unit: "Unit" },
  { code: "RF-003",  name: "Refrigerator — Samsung 2-Door",        category: "Appliance", brand: "Samsung",  model: "RT42CG6644S9",spec: "420 L",    unit: "Unit" },
  { code: "RF-004",  name: "Refrigerator — Samsung Side-by-Side",  category: "Appliance", brand: "Samsung",  model: "RS68A8840S9",  spec: "634 L",   unit: "Unit" },
  { code: "RF-005",  name: "Refrigerator — Bosch 2-Door",          category: "Appliance", brand: "Bosch",    model: "KGN56XIER",   spec: "508 L",    unit: "Unit" },
  { code: "RF-006",  name: "Mini Fridge",                          category: "Appliance",                     spec: "90 L",         unit: "Unit" },
  // ── Kitchen Appliances ──────────────────────────────────────────────────────
  { code: "KIT-001", name: "Microwave — LG",                       category: "Appliance", brand: "LG",       model: "MS2042D",     spec: "20 L",     unit: "Unit" },
  { code: "KIT-002", name: "Microwave — Samsung",                  category: "Appliance", brand: "Samsung",  model: "ME83X",       spec: "23 L",     unit: "Unit" },
  { code: "KIT-003", name: "Dishwasher — Bosch",                   category: "Appliance", brand: "Bosch",    model: "SMS4HCB48E",  spec: "13 Place", unit: "Unit" },
  { code: "KIT-004", name: "Dishwasher — Samsung",                 category: "Appliance", brand: "Samsung",  model: "DW60M5050BB", spec: "13 Place", unit: "Unit" },
  { code: "KIT-005", name: "Electric Cooker / Hob",                category: "Appliance",                     spec: "4-Burner",     unit: "Unit" },
  { code: "KIT-006", name: "Gas Cooker",                           category: "Appliance",                     spec: "4-Burner",     unit: "Unit" },
  { code: "KIT-007", name: "Range Hood / Extractor Fan",           category: "Appliance",                                          unit: "Unit" },
  { code: "KIT-008", name: "Electric Kettle",                      category: "Appliance",                     spec: "1.7 L",        unit: "Unit" },
  { code: "KIT-009", name: "Coffee Machine",                       category: "Appliance",                                          unit: "Unit" },
  { code: "KIT-010", name: "Blender",                              category: "Appliance",                                          unit: "Unit" },
  // ── Electronics ─────────────────────────────────────────────────────────────
  { code: "ELC-001", name: "Smart TV — Samsung",                   category: "Electronics", brand: "Samsung", model: "UA43CU8000",  spec: "43\" 4K",  unit: "Unit" },
  { code: "ELC-002", name: "Smart TV — Samsung",                   category: "Electronics", brand: "Samsung", model: "UA55CU8000",  spec: "55\" 4K",  unit: "Unit" },
  { code: "ELC-003", name: "Smart TV — Samsung",                   category: "Electronics", brand: "Samsung", model: "UA65CU8000",  spec: "65\" 4K",  unit: "Unit" },
  { code: "ELC-004", name: "Smart TV — LG OLED",                   category: "Electronics", brand: "LG",      model: "OLED55C3",    spec: "55\" OLED",unit: "Unit" },
  { code: "ELC-005", name: "Smart TV — LG OLED",                   category: "Electronics", brand: "LG",      model: "OLED65C3",    spec: "65\" OLED",unit: "Unit" },
  { code: "ELC-006", name: "Smart TV — Sony",                      category: "Electronics", brand: "Sony",    model: "KD-55X80L",   spec: "55\" 4K",  unit: "Unit" },
  { code: "ELC-007", name: "Smart TV — TCL",                       category: "Electronics", brand: "TCL",     model: "55P735",      spec: "55\" 4K",  unit: "Unit" },
  { code: "ELC-008", name: "TV Wall Mount",                        category: "Electronics",                                         unit: "Pcs" },
  { code: "ELC-009", name: "Soundbar — Samsung",                   category: "Electronics", brand: "Samsung", model: "HW-B550",     spec: "2.1ch 410W",unit: "Unit" },
  { code: "ELC-010", name: "Soundbar — Sony",                      category: "Electronics", brand: "Sony",    model: "HT-S400",     spec: "2.1ch 330W",unit: "Unit" },
  { code: "ELC-011", name: "Internet Router — TP-Link",            category: "Electronics", brand: "TP-Link", model: "Archer AX73", spec: "Wi-Fi 6",  unit: "Unit" },
  { code: "ELC-012", name: "Internet Router — Huawei",             category: "Electronics", brand: "Huawei",  model: "AX3 Pro",     spec: "Wi-Fi 6",  unit: "Unit" },
  // ── Fixtures ─────────────────────────────────────────────────────────────────
  { code: "FIX-001", name: "Ceiling Fan",                          category: "Fixture",                        spec: "52 inch",      unit: "Unit" },
  { code: "FIX-002", name: "Water Heater — Electric 50L",          category: "Fixture",                        spec: "50 L",         unit: "Unit" },
  { code: "FIX-003", name: "Water Heater — Electric 80L",          category: "Fixture",                        spec: "80 L",         unit: "Unit" },
  { code: "FIX-004", name: "Water Heater — Gas Instant",           category: "Fixture",                        spec: "Instant",      unit: "Unit" },
  { code: "FIX-005", name: "Curtains (per window)",                category: "Fixture",                                              unit: "Set" },
  { code: "FIX-006", name: "Blinds / Roller Shades",               category: "Fixture",                                              unit: "Set" },
  { code: "FIX-007", name: "Bathroom Mirror",                      category: "Fixture",                                              unit: "Pcs" },
  { code: "FIX-008", name: "Shower Curtain",                       category: "Fixture",                                              unit: "Pcs" },
  { code: "FIX-009", name: "Towel Rail",                           category: "Fixture",                                              unit: "Pcs" },
  { code: "FIX-010", name: "Door Mat",                             category: "Fixture",                                              unit: "Pcs" },
];

const CATEGORIES = ["All", "Furniture", "Bedding", "Appliance", "Electronics", "Fixture"] as const;

const CAT_COLORS: Record<string, string> = {
  Furniture:   "bg-blue-500/20 text-blue-400 border-blue-500/30",
  Bedding:     "bg-purple-500/20 text-purple-400 border-purple-500/30",
  Appliance:   "bg-amber-500/20 text-amber-400 border-amber-500/30",
  Electronics: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  Fixture:     "bg-green-500/20 text-green-400 border-green-500/30",
};

// ─────────────────────────────────────────────────────────────────────────────
// SET TYPES
// ─────────────────────────────────────────────────────────────────────────────
interface SetLine {
  item: MasterItem;
  qty: number;
  serialNumbers: string[];
  purchaseDate: string;
  warrantyExpiry: string;
}

interface AssetSet {
  id: string;
  code: string;
  name: string;
  description: string;
  lines: SetLine[];
  createdAt: string;
}

function generateSetCode(sets: AssetSet[]) {
  const n = sets.length + 1;
  return `ASET-${String(n).padStart(3, "0")}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function AssetRegistry() {
  const [libSearch, setLibSearch] = useState("");
  const [libCat, setLibCat] = useState<string>("All");
  const [sets, setSets] = useState<AssetSet[]>([]);
  const [selectedSetId, setSelectedSetId] = useState<string | null>(null);
  const [builderMode, setBuilderMode] = useState<"idle" | "new" | "edit">("idle");
  const [draftName, setDraftName] = useState("");
  const [draftDesc, setDraftDesc] = useState("");
  const [draftLines, setDraftLines] = useState<SetLine[]>([]);
  const [editingSetId, setEditingSetId] = useState<string | null>(null);

  const filteredItems = useMemo(() => {
    return MASTER_ITEMS.filter(item => {
      const matchCat = libCat === "All" || item.category === libCat;
      const q = libSearch.toLowerCase();
      const matchSearch = !q || item.name.toLowerCase().includes(q)
        || (item.brand ?? "").toLowerCase().includes(q)
        || (item.model ?? "").toLowerCase().includes(q)
        || (item.spec ?? "").toLowerCase().includes(q)
        || item.code.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [libSearch, libCat]);

  function addToDraft(item: MasterItem) {
    if (builderMode === "idle") {
      toast.info("Click \"New Set\" first to start building a set");
      return;
    }
    setDraftLines(prev => {
      const existing = prev.find(l => l.item.code === item.code);
      if (existing) {
        return prev.map(l => l.item.code === item.code
          ? { ...l, qty: l.qty + 1, serialNumbers: [...l.serialNumbers, ""] }
          : l
        );
      }
      return [...prev, { item, qty: 1, serialNumbers: [""], purchaseDate: "", warrantyExpiry: "" }];
    });
  }

  function removeFromDraft(code: string) {
    setDraftLines(prev => prev.filter(l => l.item.code !== code));
  }

  function changeQty(code: string, delta: number) {
    setDraftLines(prev => prev.map(l => {
      if (l.item.code !== code) return l;
      const newQty = Math.max(1, l.qty + delta);
      const sns = [...l.serialNumbers];
      while (sns.length < newQty) sns.push("");
      while (sns.length > newQty) sns.pop();
      return { ...l, qty: newQty, serialNumbers: sns };
    }));
  }

  function updateDate(code: string, field: "purchaseDate" | "warrantyExpiry", val: string) {
    setDraftLines(prev => prev.map(l =>
      l.item.code === code ? { ...l, [field]: val } : l
    ));
  }

  function updateSerial(code: string, idx: number, val: string) {
    setDraftLines(prev => prev.map(l => {
      if (l.item.code !== code) return l;
      const sns = [...l.serialNumbers];
      sns[idx] = val;
      return { ...l, serialNumbers: sns };
    }));
  }

  function saveSet() {
    if (!draftName.trim()) { toast.error("Set name is required"); return; }
    if (draftLines.length === 0) { toast.error("Add at least one item"); return; }
    if (builderMode === "new") {
      const newSet: AssetSet = {
        id: crypto.randomUUID(),
        code: generateSetCode(sets),
        name: draftName.trim(),
        description: draftDesc.trim(),
        lines: draftLines,
        createdAt: new Date().toISOString(),
      };
      setSets(prev => [...prev, newSet]);
      setSelectedSetId(newSet.id);
      toast.success(`Set "${newSet.code} — ${newSet.name}" saved`);
    } else if (builderMode === "edit" && editingSetId) {
      setSets(prev => prev.map(s => s.id === editingSetId
        ? { ...s, name: draftName.trim(), description: draftDesc.trim(), lines: draftLines }
        : s
      ));
      toast.success("Set updated");
    }
    setBuilderMode("idle");
    setDraftLines([]);
    setDraftName("");
    setDraftDesc("");
    setEditingSetId(null);
  }

  function startNew() {
    setBuilderMode("new");
    setDraftName("");
    setDraftDesc("");
    setDraftLines([]);
    setEditingSetId(null);
    setSelectedSetId(null);
  }

  function startEdit(set: AssetSet) {
    setBuilderMode("edit");
    setDraftName(set.name);
    setDraftDesc(set.description);
    setDraftLines(set.lines.map(l => ({ ...l, serialNumbers: [...l.serialNumbers] })));
    setEditingSetId(set.id);
    setSelectedSetId(set.id);
  }

  function cancelDraft() {
    setBuilderMode("idle");
    setDraftLines([]);
    setDraftName("");
    setDraftDesc("");
    setEditingSetId(null);
  }

  function deleteSet(id: string) {
    setSets(prev => prev.filter(s => s.id !== id));
    if (selectedSetId === id) setSelectedSetId(null);
    toast.success("Set deleted");
  }

  const selectedSet = sets.find(s => s.id === selectedSetId) ?? null;
  const activeLines = builderMode !== "idle" ? draftLines : (selectedSet?.lines ?? []);
  const totalItems = activeLines.reduce((s, l) => s + l.qty, 0);

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <ScreenHeader
          screenId="VFLSUBASSET0001P001"
          screenType="sub_asset_registry"
          onAIData={() => {}}
          title="Sub-Asset Registry"
          subtitle="Build named asset sets from the item library — attach sets to leases"
        />

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4" style={{ height: "calc(100vh - 200px)", minHeight: "600px" }}>

          {/* ── LEFT: Item Library ─────────────────────────────────────────── */}
          <Card className="flex flex-col overflow-hidden">
            <CardHeader className="pb-3 shrink-0">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Package className="h-4 w-4 text-primary" />
                  Item Library
                  <Badge variant="outline" className="text-xs ml-1">{filteredItems.length} items</Badge>
                </CardTitle>
                <Button size="sm" onClick={startNew} className="h-8 gap-1.5">
                  <Layers className="h-3.5 w-3.5" /> New Set
                </Button>
              </div>
              <div className="flex gap-2 mt-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input placeholder="Search items, brand, model, spec…" className="pl-8 h-9 text-sm"
                    value={libSearch} onChange={e => setLibSearch(e.target.value)} />
                </div>
                <Select value={libCat} onValueChange={setLibCat}>
                  <SelectTrigger className="w-36 h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-0">
              <div className="divide-y">
                {filteredItems.map(item => (
                  <div key={item.code}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-primary/5 cursor-pointer group transition-colors"
                    onClick={() => addToDraft(item)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{item.name}</span>
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 shrink-0 ${CAT_COLORS[item.category]}`}>
                          {item.category}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground flex-wrap">
                        <span className="font-mono">{item.code}</span>
                        {item.brand && <span>· {item.brand}</span>}
                        {item.model && <span className="font-mono">· {item.model}</span>}
                        {item.spec && <span className="text-amber-400/80 font-medium">· {item.spec}</span>}
                        <span>· {item.unit}</span>
                      </div>
                    </div>
                    <Button size="icon" variant="ghost"
                      className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-primary"
                      onClick={e => { e.stopPropagation(); addToDraft(item); }}>
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
                {filteredItems.length === 0 && (
                  <div className="py-12 text-center text-muted-foreground text-sm">No items match your search.</div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* ── RIGHT: Set Builder / Viewer ────────────────────────────────── */}
          <div className="flex flex-col gap-3 overflow-hidden">

            {/* Saved sets chips */}
            {sets.length > 0 && builderMode === "idle" && (
              <Card className="shrink-0">
                <CardHeader className="pb-2 pt-3">
                  <CardTitle className="text-xs text-muted-foreground uppercase tracking-wide">Saved Sets</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 pb-3">
                  <div className="flex flex-wrap gap-2">
                    {sets.map(s => (
                      <button key={s.id}
                        onClick={() => setSelectedSetId(s.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm transition-colors ${
                          selectedSetId === s.id
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border hover:border-primary/50 text-muted-foreground hover:text-foreground"
                        }`}>
                        <Layers className="h-3 w-3" />
                        <span className="font-mono text-xs">{s.code}</span>
                        <span>{s.name}</span>
                        <span className="text-[10px] text-muted-foreground">
                          ({s.lines.reduce((a, l) => a + l.qty, 0)} units)
                        </span>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Builder / Viewer card */}
            <Card className="flex flex-col flex-1 overflow-hidden">
              <CardHeader className="pb-3 shrink-0">
                {builderMode !== "idle" ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">
                        {builderMode === "new" ? "New Asset Set" : "Edit Set"}
                      </CardTitle>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={cancelDraft}>
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Input placeholder="Set Name *" className="h-9 text-sm"
                        value={draftName} onChange={e => setDraftName(e.target.value)} />
                      <Input placeholder="Description (optional)" className="h-9 text-sm"
                        value={draftDesc} onChange={e => setDraftDesc(e.target.value)} />
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 rounded px-3 py-2">
                      <ChevronRight className="h-3 w-3 text-primary shrink-0" />
                      Click any item in the library to add it to this set. Adjust quantities and enter serial numbers below.
                    </div>
                  </div>
                ) : selectedSet ? (
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs text-primary">{selectedSet.code}</span>
                        <CardTitle className="text-base">{selectedSet.name}</CardTitle>
                      </div>
                      {selectedSet.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{selectedSet.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {selectedSet.lines.length} item types · {selectedSet.lines.reduce((a, l) => a + l.qty, 0)} total units
                        · Created {new Date(selectedSet.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="outline" size="sm" className="h-8 gap-1" onClick={() => startEdit(selectedSet)}>
                        <Edit2 className="h-3 w-3" /> Edit
                      </Button>
                      <Button variant="outline" size="sm" className="h-8 text-red-400 hover:text-red-400"
                        onClick={() => deleteSet(selectedSet.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                    <Layers className="h-12 w-12 mb-3 opacity-20" />
                    <p className="text-sm font-medium">No set selected</p>
                    <p className="text-xs mt-1 text-center max-w-xs">
                      Click <strong>New Set</strong> to start building, or select a saved set above.
                      Each set can be attached to a lease.
                    </p>
                    <Button size="sm" className="mt-4 gap-1.5" onClick={startNew}>
                      <Plus className="h-3.5 w-3.5" /> New Set
                    </Button>
                  </div>
                )}
              </CardHeader>

              {(builderMode !== "idle" || selectedSet) && (
                <>
                  <Separator />
                  <CardContent className="flex-1 overflow-y-auto p-0">
                    {activeLines.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-32 text-muted-foreground text-sm">
                        <Plus className="h-6 w-6 mb-2 opacity-30" />
                        Click items from the library to add them here
                      </div>
                    ) : (
                      <div className="divide-y">
                        {activeLines.map(line => (
                          <div key={line.item.code} className="px-4 py-3">
                            {/* Item header row */}
                            <div className="flex items-center gap-2 mb-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-semibold text-sm">{line.item.name}</span>
                                  {line.item.brand && (
                                    <span className="text-xs text-muted-foreground">{line.item.brand}</span>
                                  )}
                                  {line.item.spec && (
                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-amber-400 border-amber-400/30">
                                      {line.item.spec}
                                    </Badge>
                                  )}
                                </div>
                                <span className="font-mono text-[11px] text-muted-foreground">{line.item.code}</span>
                              </div>
                              {builderMode !== "idle" ? (
                                <div className="flex items-center gap-1 shrink-0">
                                  <Button variant="outline" size="icon" className="h-6 w-6"
                                    onClick={() => changeQty(line.item.code, -1)}>
                                    <Minus className="h-3 w-3" />
                                  </Button>
                                  <span className="w-7 text-center text-sm font-bold">{line.qty}</span>
                                  <Button variant="outline" size="icon" className="h-6 w-6"
                                    onClick={() => changeQty(line.item.code, 1)}>
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                  <span className="text-xs text-muted-foreground ml-1">{line.item.unit}</span>
                                  <Button variant="ghost" size="icon" className="h-6 w-6 text-red-400 hover:text-red-400 ml-1"
                                    onClick={() => removeFromDraft(line.item.code)}>
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              ) : (
                                <Badge variant="outline" className="shrink-0 text-xs">
                                  {line.qty} {line.item.unit}
                                </Badge>
                              )}
                            </div>
                            {/* Serial numbers */}
                            <div className="grid grid-cols-2 gap-1.5">
                              {Array.from({ length: line.qty }).map((_, idx) => (
                                <div key={idx} className="flex items-center gap-1.5">
                                  <span className="text-[10px] text-muted-foreground w-10 shrink-0 font-mono">
                                    #{idx + 1}
                                  </span>
                                  {builderMode !== "idle" ? (
                                    <Input
                                      className="h-7 text-xs font-mono"
                                      placeholder="Serial No. (optional)"
                                      value={line.serialNumbers[idx] ?? ""}
                                      onChange={e => updateSerial(line.item.code, idx, e.target.value)}
                                    />
                                  ) : (
                                    <span className="text-xs font-mono text-muted-foreground">
                                      {line.serialNumbers[idx] || <span className="opacity-40">—</span>}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                            {/* Purchase Date & Warranty Expiry */}
                            <div className="grid grid-cols-2 gap-1.5 mt-1.5">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] text-muted-foreground w-20 shrink-0">Purchase Date</span>
                                {builderMode !== "idle" ? (
                                  <Input type="date" className="h-7 text-xs" value={line.purchaseDate}
                                    onChange={e => updateDate(line.item.code, "purchaseDate", e.target.value)} />
                                ) : (
                                  <span className="text-xs text-muted-foreground">{line.purchaseDate || <span className="opacity-40">—</span>}</span>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] text-muted-foreground w-20 shrink-0">Warranty Exp.</span>
                                {builderMode !== "idle" ? (
                                  <Input type="date" className="h-7 text-xs" value={line.warrantyExpiry}
                                    onChange={e => updateDate(line.item.code, "warrantyExpiry", e.target.value)} />
                                ) : (
                                  <span className="text-xs text-muted-foreground">{line.warrantyExpiry || <span className="opacity-40">—</span>}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>

                  {builderMode !== "idle" && (
                    <>
                      <Separator />
                      <div className="px-4 py-3 flex items-center justify-between shrink-0 bg-muted/20">
                        <span className="text-xs text-muted-foreground">
                          {draftLines.length} item types · <strong>{totalItems}</strong> total units
                        </span>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="h-8" onClick={cancelDraft}>Cancel</Button>
                          <Button size="sm" className="h-8 gap-1.5" onClick={saveSet}>
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            {builderMode === "new" ? "Save Set" : "Update Set"}
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
