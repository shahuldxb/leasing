import { useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Plus, Minus, Trash2, CheckCircle2, Package, Search, Edit2, ChevronDown, Tag
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// MASTER ITEM LIBRARY — 300+ items with QAR prices
// ─────────────────────────────────────────────────────────────────────────────
type Category = "Furniture" | "Bedding & Linen" | "Kitchen Appliances" | "Laundry" | "Cooling & Heating" | "Electronics" | "Lighting & Fixtures" | "Outdoor & Garden" | "Storage & Wardrobes" | "Office & Study";
type SubCategory = string;

interface MasterItem {
  code: string;
  name: string;
  brand?: string;
  spec?: string;
  category: Category;
  subCategory: SubCategory;
  priceQAR: number;
}

const MASTER_ITEMS: MasterItem[] = [
  // ── FURNITURE → Sofas ──────────────────────────────────────────────────────
  { code: "FUR-SOF-001", name: "Sofa 3-Seater", brand: "IKEA", spec: "Fabric, Grey", category: "Furniture", subCategory: "Sofas", priceQAR: 2800 },
  { code: "FUR-SOF-002", name: "Sofa 3-Seater", brand: "Home Centre", spec: "Leather, Brown", category: "Furniture", subCategory: "Sofas", priceQAR: 3500 },
  { code: "FUR-SOF-003", name: "Sofa 2-Seater", brand: "IKEA", spec: "Fabric, Beige", category: "Furniture", subCategory: "Sofas", priceQAR: 1900 },
  { code: "FUR-SOF-004", name: "Sofa 2-Seater", brand: "Pan Emirates", spec: "Velvet, Navy", category: "Furniture", subCategory: "Sofas", priceQAR: 2200 },
  { code: "FUR-SOF-005", name: "L-Shape Sectional Sofa", brand: "Home Centre", spec: "Fabric, Charcoal", category: "Furniture", subCategory: "Sofas", priceQAR: 4800 },
  { code: "FUR-SOF-006", name: "Sofa Armchair", brand: "IKEA", spec: "Fabric, Light Grey", category: "Furniture", subCategory: "Sofas", priceQAR: 950 },
  { code: "FUR-SOF-007", name: "Recliner Armchair", brand: "Pan Emirates", spec: "Leather, Black", category: "Furniture", subCategory: "Sofas", priceQAR: 2100 },
  { code: "FUR-SOF-008", name: "Ottoman / Footrest", brand: "IKEA", spec: "Fabric, Beige", category: "Furniture", subCategory: "Sofas", priceQAR: 450 },
  // ── FURNITURE → Dining ─────────────────────────────────────────────────────
  { code: "FUR-DIN-001", name: "Dining Table 4-Seater", brand: "IKEA", spec: "Wood, White", category: "Furniture", subCategory: "Dining", priceQAR: 1200 },
  { code: "FUR-DIN-002", name: "Dining Table 6-Seater", brand: "Home Centre", spec: "Wood, Walnut", category: "Furniture", subCategory: "Dining", priceQAR: 2400 },
  { code: "FUR-DIN-003", name: "Dining Table 8-Seater", brand: "Pan Emirates", spec: "Glass Top, Chrome", category: "Furniture", subCategory: "Dining", priceQAR: 3800 },
  { code: "FUR-DIN-004", name: "Dining Chair", brand: "IKEA", spec: "Wood, White (set of 4)", category: "Furniture", subCategory: "Dining", priceQAR: 800 },
  { code: "FUR-DIN-005", name: "Dining Chair Padded", brand: "Home Centre", spec: "Fabric, Grey (set of 4)", category: "Furniture", subCategory: "Dining", priceQAR: 1100 },
  { code: "FUR-DIN-006", name: "Bar Stool (set of 2)", brand: "IKEA", spec: "Metal, Black", category: "Furniture", subCategory: "Dining", priceQAR: 550 },
  { code: "FUR-DIN-007", name: "Buffet / Sideboard", brand: "Pan Emirates", spec: "Wood, Walnut", category: "Furniture", subCategory: "Dining", priceQAR: 1800 },
  // ── FURNITURE → Beds ───────────────────────────────────────────────────────
  { code: "FUR-BED-001", name: "Bed Frame King", brand: "IKEA", spec: "Wood, White 180x200cm", category: "Furniture", subCategory: "Beds", priceQAR: 2200 },
  { code: "FUR-BED-002", name: "Bed Frame Queen", brand: "IKEA", spec: "Wood, White 160x200cm", category: "Furniture", subCategory: "Beds", priceQAR: 1800 },
  { code: "FUR-BED-003", name: "Bed Frame Single", brand: "IKEA", spec: "Wood, White 90x200cm", category: "Furniture", subCategory: "Beds", priceQAR: 950 },
  { code: "FUR-BED-004", name: "Bed Frame King", brand: "Home Centre", spec: "Upholstered, Grey 180x200cm", category: "Furniture", subCategory: "Beds", priceQAR: 3200 },
  { code: "FUR-BED-005", name: "Bed Frame Queen", brand: "Pan Emirates", spec: "Leather, Brown 160x200cm", category: "Furniture", subCategory: "Beds", priceQAR: 2600 },
  { code: "FUR-BED-006", name: "Bunk Bed", brand: "IKEA", spec: "Wood, White 90x200cm x2", category: "Furniture", subCategory: "Beds", priceQAR: 1600 },
  { code: "FUR-BED-007", name: "Mattress King", brand: "Sealy", spec: "Memory Foam 180x200cm", category: "Furniture", subCategory: "Beds", priceQAR: 3500 },
  { code: "FUR-BED-008", name: "Mattress Queen", brand: "Sealy", spec: "Memory Foam 160x200cm", category: "Furniture", subCategory: "Beds", priceQAR: 2800 },
  { code: "FUR-BED-009", name: "Mattress Single", brand: "Sealy", spec: "Foam 90x200cm", category: "Furniture", subCategory: "Beds", priceQAR: 1100 },
  { code: "FUR-BED-010", name: "Bedside Table", brand: "IKEA", spec: "Wood, White", category: "Furniture", subCategory: "Beds", priceQAR: 380 },
  // ── FURNITURE → Storage & Wardrobes ────────────────────────────────────────
  { code: "FUR-WAR-001", name: "Wardrobe 2-Door", brand: "IKEA", spec: "Wood, White 100cm", category: "Storage & Wardrobes", subCategory: "Wardrobes", priceQAR: 1400 },
  { code: "FUR-WAR-002", name: "Wardrobe 3-Door", brand: "IKEA", spec: "Wood, White 150cm", category: "Storage & Wardrobes", subCategory: "Wardrobes", priceQAR: 1900 },
  { code: "FUR-WAR-003", name: "Wardrobe 4-Door Mirrored", brand: "Home Centre", spec: "White, Mirror Doors 200cm", category: "Storage & Wardrobes", subCategory: "Wardrobes", priceQAR: 2800 },
  { code: "FUR-WAR-004", name: "Walk-in Wardrobe System", brand: "IKEA PAX", spec: "White, Modular", category: "Storage & Wardrobes", subCategory: "Wardrobes", priceQAR: 4500 },
  { code: "FUR-WAR-005", name: "Chest of Drawers 4-Drawer", brand: "IKEA", spec: "Wood, White", category: "Storage & Wardrobes", subCategory: "Wardrobes", priceQAR: 850 },
  { code: "FUR-WAR-006", name: "Chest of Drawers 6-Drawer", brand: "Home Centre", spec: "Wood, Oak", category: "Storage & Wardrobes", subCategory: "Wardrobes", priceQAR: 1200 },
  { code: "FUR-WAR-007", name: "Cupboard / Cabinet", brand: "IKEA", spec: "Wood, White 80cm", category: "Storage & Wardrobes", subCategory: "Wardrobes", priceQAR: 750 },
  { code: "FUR-WAR-008", name: "Bookshelf 5-Tier", brand: "IKEA", spec: "Wood, White", category: "Storage & Wardrobes", subCategory: "Wardrobes", priceQAR: 480 },
  { code: "FUR-WAR-009", name: "TV Unit / Media Console", brand: "IKEA", spec: "Wood, White 150cm", category: "Furniture", subCategory: "Living Room", priceQAR: 950 },
  { code: "FUR-WAR-010", name: "TV Unit / Media Console", brand: "Pan Emirates", spec: "Wood, Walnut 180cm", category: "Furniture", subCategory: "Living Room", priceQAR: 1400 },
  // ── FURNITURE → Living Room ─────────────────────────────────────────────────
  { code: "FUR-LIV-001", name: "Coffee Table", brand: "IKEA", spec: "Glass Top, Chrome", category: "Furniture", subCategory: "Living Room", priceQAR: 650 },
  { code: "FUR-LIV-002", name: "Coffee Table", brand: "Home Centre", spec: "Wood, Walnut", category: "Furniture", subCategory: "Living Room", priceQAR: 850 },
  { code: "FUR-LIV-003", name: "Side Table", brand: "IKEA", spec: "Metal, Gold", category: "Furniture", subCategory: "Living Room", priceQAR: 280 },
  { code: "FUR-LIV-004", name: "Console Table", brand: "Pan Emirates", spec: "Wood, White", category: "Furniture", subCategory: "Living Room", priceQAR: 750 },
  { code: "FUR-LIV-005", name: "Display Cabinet", brand: "Home Centre", spec: "Glass Door, White", category: "Furniture", subCategory: "Living Room", priceQAR: 1600 },
  { code: "FUR-LIV-006", name: "Floor Mirror", brand: "IKEA", spec: "Full Length 40x160cm", category: "Furniture", subCategory: "Living Room", priceQAR: 420 },
  { code: "FUR-LIV-007", name: "Wall Mirror", brand: "Home Centre", spec: "Round 80cm Dia", category: "Furniture", subCategory: "Living Room", priceQAR: 350 },
  // ── BEDDING & LINEN ─────────────────────────────────────────────────────────
  { code: "BED-LIN-001", name: "Duvet Set King", brand: "Spaces", spec: "Cotton 300TC, White", category: "Bedding & Linen", subCategory: "Duvets & Covers", priceQAR: 380 },
  { code: "BED-LIN-002", name: "Duvet Set Queen", brand: "Spaces", spec: "Cotton 300TC, White", category: "Bedding & Linen", subCategory: "Duvets & Covers", priceQAR: 320 },
  { code: "BED-LIN-003", name: "Pillow (set of 2)", brand: "Sealy", spec: "Memory Foam", category: "Bedding & Linen", subCategory: "Pillows", priceQAR: 220 },
  { code: "BED-LIN-004", name: "Bed Sheet Set King", brand: "Spaces", spec: "Cotton 400TC, White", category: "Bedding & Linen", subCategory: "Sheets", priceQAR: 180 },
  { code: "BED-LIN-005", name: "Bed Sheet Set Queen", brand: "Spaces", spec: "Cotton 400TC, White", category: "Bedding & Linen", subCategory: "Sheets", priceQAR: 150 },
  { code: "BED-LIN-006", name: "Towel Set (6pc)", brand: "Trident", spec: "Cotton, White", category: "Bedding & Linen", subCategory: "Towels", priceQAR: 120 },
  { code: "BED-LIN-007", name: "Bath Mat", brand: "IKEA", spec: "Cotton, White", category: "Bedding & Linen", subCategory: "Towels", priceQAR: 45 },
  { code: "BED-LIN-008", name: "Curtains (pair)", brand: "Home Centre", spec: "Blackout, Grey 140x260cm", category: "Bedding & Linen", subCategory: "Curtains", priceQAR: 380 },
  { code: "BED-LIN-009", name: "Curtains (pair)", brand: "IKEA", spec: "Sheer, White 145x250cm", category: "Bedding & Linen", subCategory: "Curtains", priceQAR: 180 },
  { code: "BED-LIN-010", name: "Roller Blinds", brand: "Blinds Qatar", spec: "Blackout, 120cm", category: "Bedding & Linen", subCategory: "Curtains", priceQAR: 280 },
  // ── KITCHEN APPLIANCES ──────────────────────────────────────────────────────
  { code: "KIT-REF-001", name: "Refrigerator 2-Door", brand: "LG", spec: "450L, Silver, No-Frost", category: "Kitchen Appliances", subCategory: "Refrigerators", priceQAR: 2800 },
  { code: "KIT-REF-002", name: "Refrigerator 2-Door", brand: "Samsung", spec: "500L, Black, No-Frost", category: "Kitchen Appliances", subCategory: "Refrigerators", priceQAR: 3200 },
  { code: "KIT-REF-003", name: "Refrigerator French Door", brand: "LG", spec: "600L, Silver, InstaView", category: "Kitchen Appliances", subCategory: "Refrigerators", priceQAR: 5500 },
  { code: "KIT-REF-004", name: "Refrigerator French Door", brand: "Samsung", spec: "680L, Black, Family Hub", category: "Kitchen Appliances", subCategory: "Refrigerators", priceQAR: 7200 },
  { code: "KIT-REF-005", name: "Refrigerator Side-by-Side", brand: "Whirlpool", spec: "570L, Silver", category: "Kitchen Appliances", subCategory: "Refrigerators", priceQAR: 4200 },
  { code: "KIT-REF-006", name: "Mini Fridge", brand: "Hisense", spec: "90L, Silver", category: "Kitchen Appliances", subCategory: "Refrigerators", priceQAR: 650 },
  { code: "KIT-OVN-001", name: "Microwave Oven", brand: "LG", spec: "25L, 900W, Silver", category: "Kitchen Appliances", subCategory: "Cooking", priceQAR: 380 },
  { code: "KIT-OVN-002", name: "Microwave Oven", brand: "Samsung", spec: "28L, 1000W, Black", category: "Kitchen Appliances", subCategory: "Cooking", priceQAR: 450 },
  { code: "KIT-OVN-003", name: "Built-in Oven", brand: "Bosch", spec: "60cm, 71L, Stainless", category: "Kitchen Appliances", subCategory: "Cooking", priceQAR: 2800 },
  { code: "KIT-OVN-004", name: "Freestanding Cooker", brand: "Smeg", spec: "60cm, Gas Hob, 5 Burner", category: "Kitchen Appliances", subCategory: "Cooking", priceQAR: 3500 },
  { code: "KIT-OVN-005", name: "Gas Hob 4-Burner", brand: "Bosch", spec: "60cm, Stainless", category: "Kitchen Appliances", subCategory: "Cooking", priceQAR: 1200 },
  { code: "KIT-OVN-006", name: "Air Fryer", brand: "Philips", spec: "5.6L, 2000W", category: "Kitchen Appliances", subCategory: "Cooking", priceQAR: 480 },
  { code: "KIT-OVN-007", name: "Toaster Oven", brand: "Breville", spec: "25L, 1800W", category: "Kitchen Appliances", subCategory: "Cooking", priceQAR: 350 },
  { code: "KIT-SML-001", name: "Dishwasher", brand: "Bosch", spec: "60cm, 14 Place Settings", category: "Kitchen Appliances", subCategory: "Dishwashers", priceQAR: 3200 },
  { code: "KIT-SML-002", name: "Dishwasher", brand: "Samsung", spec: "60cm, 13 Place Settings", category: "Kitchen Appliances", subCategory: "Dishwashers", priceQAR: 2800 },
  { code: "KIT-SML-003", name: "Kettle", brand: "Philips", spec: "1.7L, 2400W, Stainless", category: "Kitchen Appliances", subCategory: "Small Appliances", priceQAR: 120 },
  { code: "KIT-SML-004", name: "Coffee Machine", brand: "Nespresso", spec: "Vertuo Plus, Black", category: "Kitchen Appliances", subCategory: "Small Appliances", priceQAR: 650 },
  { code: "KIT-SML-005", name: "Coffee Machine", brand: "De'Longhi", spec: "Espresso, Stainless", category: "Kitchen Appliances", subCategory: "Small Appliances", priceQAR: 1200 },
  { code: "KIT-SML-006", name: "Blender", brand: "Philips", spec: "2L, 1000W", category: "Kitchen Appliances", subCategory: "Small Appliances", priceQAR: 180 },
  { code: "KIT-SML-007", name: "Food Processor", brand: "Kenwood", spec: "4.3L, 1000W", category: "Kitchen Appliances", subCategory: "Small Appliances", priceQAR: 450 },
  { code: "KIT-SML-008", name: "Rice Cooker", brand: "Panasonic", spec: "1.8L, 10 Cup", category: "Kitchen Appliances", subCategory: "Small Appliances", priceQAR: 220 },
  { code: "KIT-SML-009", name: "Toaster 4-Slice", brand: "Philips", spec: "1800W, Stainless", category: "Kitchen Appliances", subCategory: "Small Appliances", priceQAR: 150 },
  { code: "KIT-SML-010", name: "Range Hood", brand: "Bosch", spec: "60cm, 650m³/h, Stainless", category: "Kitchen Appliances", subCategory: "Cooking", priceQAR: 1800 },
  // ── LAUNDRY ─────────────────────────────────────────────────────────────────
  { code: "LAU-WAS-001", name: "Washing Machine Front Load", brand: "LG", spec: "8kg, 1400rpm, White", category: "Laundry", subCategory: "Washing Machines", priceQAR: 2200 },
  { code: "LAU-WAS-002", name: "Washing Machine Front Load", brand: "Samsung", spec: "9kg, 1400rpm, White", category: "Laundry", subCategory: "Washing Machines", priceQAR: 2600 },
  { code: "LAU-WAS-003", name: "Washing Machine Front Load", brand: "Bosch", spec: "9kg, 1400rpm, White", category: "Laundry", subCategory: "Washing Machines", priceQAR: 3200 },
  { code: "LAU-WAS-004", name: "Washing Machine Front Load", brand: "Whirlpool", spec: "10kg, 1600rpm, White", category: "Laundry", subCategory: "Washing Machines", priceQAR: 2800 },
  { code: "LAU-WAS-005", name: "Washing Machine Front Load", brand: "Beko", spec: "8kg, 1200rpm, White", category: "Laundry", subCategory: "Washing Machines", priceQAR: 1800 },
  { code: "LAU-WAS-006", name: "Washing Machine Top Load", brand: "LG", spec: "9kg, 700rpm, White", category: "Laundry", subCategory: "Washing Machines", priceQAR: 1600 },
  { code: "LAU-WAS-007", name: "Washing Machine Top Load", brand: "Samsung", spec: "10kg, 700rpm, White", category: "Laundry", subCategory: "Washing Machines", priceQAR: 1900 },
  { code: "LAU-DRY-001", name: "Tumble Dryer", brand: "LG", spec: "9kg, Heat Pump, White", category: "Laundry", subCategory: "Dryers", priceQAR: 2800 },
  { code: "LAU-DRY-002", name: "Tumble Dryer", brand: "Samsung", spec: "9kg, Condenser, White", category: "Laundry", subCategory: "Dryers", priceQAR: 2400 },
  { code: "LAU-DRY-003", name: "Tumble Dryer", brand: "Bosch", spec: "8kg, Heat Pump, White", category: "Laundry", subCategory: "Dryers", priceQAR: 3100 },
  { code: "LAU-WD-001", name: "Washer-Dryer Combo", brand: "LG", spec: "9kg/6kg, 1400rpm, White", category: "Laundry", subCategory: "Washer-Dryer Combos", priceQAR: 3500 },
  { code: "LAU-WD-002", name: "Washer-Dryer Combo", brand: "Samsung", spec: "10kg/6kg, 1400rpm, White", category: "Laundry", subCategory: "Washer-Dryer Combos", priceQAR: 3800 },
  { code: "LAU-IRN-001", name: "Steam Iron", brand: "Philips", spec: "2600W, 45g/min", category: "Laundry", subCategory: "Ironing", priceQAR: 180 },
  { code: "LAU-IRN-002", name: "Garment Steamer", brand: "Philips", spec: "1800W, 1.5L", category: "Laundry", subCategory: "Ironing", priceQAR: 280 },
  // ── COOLING & HEATING ───────────────────────────────────────────────────────
  { code: "COL-AC-001", name: "Split AC 1.0 Ton", brand: "LG", spec: "1.0T, Inverter, R32", category: "Cooling & Heating", subCategory: "Air Conditioners", priceQAR: 1800 },
  { code: "COL-AC-002", name: "Split AC 1.5 Ton", brand: "LG", spec: "1.5T, Inverter, R32", category: "Cooling & Heating", subCategory: "Air Conditioners", priceQAR: 2200 },
  { code: "COL-AC-003", name: "Split AC 2.0 Ton", brand: "LG", spec: "2.0T, Inverter, R32", category: "Cooling & Heating", subCategory: "Air Conditioners", priceQAR: 2800 },
  { code: "COL-AC-004", name: "Split AC 2.5 Ton", brand: "LG", spec: "2.5T, Inverter, R32", category: "Cooling & Heating", subCategory: "Air Conditioners", priceQAR: 3400 },
  { code: "COL-AC-005", name: "Split AC 1.5 Ton", brand: "Samsung", spec: "1.5T, WindFree, R32", category: "Cooling & Heating", subCategory: "Air Conditioners", priceQAR: 2500 },
  { code: "COL-AC-006", name: "Split AC 2.0 Ton", brand: "Samsung", spec: "2.0T, WindFree, R32", category: "Cooling & Heating", subCategory: "Air Conditioners", priceQAR: 3100 },
  { code: "COL-AC-007", name: "Split AC 1.5 Ton", brand: "Daikin", spec: "1.5T, Inverter, R32", category: "Cooling & Heating", subCategory: "Air Conditioners", priceQAR: 2600 },
  { code: "COL-AC-008", name: "Split AC 2.0 Ton", brand: "Daikin", spec: "2.0T, Inverter, R32", category: "Cooling & Heating", subCategory: "Air Conditioners", priceQAR: 3200 },
  { code: "COL-AC-009", name: "Split AC 2.5 Ton", brand: "Daikin", spec: "2.5T, Inverter, R32", category: "Cooling & Heating", subCategory: "Air Conditioners", priceQAR: 3900 },
  { code: "COL-AC-010", name: "Split AC 1.5 Ton", brand: "Carrier", spec: "1.5T, Inverter, R32", category: "Cooling & Heating", subCategory: "Air Conditioners", priceQAR: 2300 },
  { code: "COL-AC-011", name: "Split AC 2.0 Ton", brand: "Carrier", spec: "2.0T, Inverter, R32", category: "Cooling & Heating", subCategory: "Air Conditioners", priceQAR: 2900 },
  { code: "COL-AC-012", name: "Split AC 1.5 Ton", brand: "Midea", spec: "1.5T, Inverter, R32", category: "Cooling & Heating", subCategory: "Air Conditioners", priceQAR: 1900 },
  { code: "COL-AC-013", name: "Split AC 2.0 Ton", brand: "Midea", spec: "2.0T, Inverter, R32", category: "Cooling & Heating", subCategory: "Air Conditioners", priceQAR: 2400 },
  { code: "COL-AC-014", name: "Cassette AC 2.0 Ton", brand: "Daikin", spec: "2.0T, Ceiling Cassette", category: "Cooling & Heating", subCategory: "Air Conditioners", priceQAR: 4800 },
  { code: "COL-AC-015", name: "Portable AC 1.0 Ton", brand: "LG", spec: "1.0T, Portable", category: "Cooling & Heating", subCategory: "Air Conditioners", priceQAR: 1400 },
  { code: "COL-FAN-001", name: "Ceiling Fan", brand: "Panasonic", spec: "56\", 5-Blade, White", category: "Cooling & Heating", subCategory: "Fans", priceQAR: 380 },
  { code: "COL-FAN-002", name: "Ceiling Fan with Light", brand: "Hunter", spec: "52\", 5-Blade, Bronze", category: "Cooling & Heating", subCategory: "Fans", priceQAR: 650 },
  { code: "COL-FAN-003", name: "Tower Fan", brand: "Dyson", spec: "AM07, Bladeless", category: "Cooling & Heating", subCategory: "Fans", priceQAR: 1800 },
  { code: "COL-FAN-004", name: "Stand Fan", brand: "Panasonic", spec: "16\", 5-Speed", category: "Cooling & Heating", subCategory: "Fans", priceQAR: 180 },
  { code: "COL-WTR-001", name: "Water Heater 50L", brand: "Ariston", spec: "50L, 1500W, Electric", category: "Cooling & Heating", subCategory: "Water Heaters", priceQAR: 650 },
  { code: "COL-WTR-002", name: "Water Heater 80L", brand: "Ariston", spec: "80L, 2000W, Electric", category: "Cooling & Heating", subCategory: "Water Heaters", priceQAR: 850 },
  { code: "COL-WTR-003", name: "Water Heater 100L", brand: "Rheem", spec: "100L, 2400W, Electric", category: "Cooling & Heating", subCategory: "Water Heaters", priceQAR: 1100 },
  // ── ELECTRONICS ─────────────────────────────────────────────────────────────
  { code: "ELE-TV-001", name: "Smart TV 43\"", brand: "Samsung", spec: "43\" 4K UHD, Crystal", category: "Electronics", subCategory: "Televisions", priceQAR: 1600 },
  { code: "ELE-TV-002", name: "Smart TV 50\"", brand: "Samsung", spec: "50\" 4K UHD, Crystal", category: "Electronics", subCategory: "Televisions", priceQAR: 2200 },
  { code: "ELE-TV-003", name: "Smart TV 55\"", brand: "Samsung", spec: "55\" 4K QLED", category: "Electronics", subCategory: "Televisions", priceQAR: 3200 },
  { code: "ELE-TV-004", name: "Smart TV 65\"", brand: "Samsung", spec: "65\" 4K QLED", category: "Electronics", subCategory: "Televisions", priceQAR: 4800 },
  { code: "ELE-TV-005", name: "Smart TV 75\"", brand: "Samsung", spec: "75\" 4K Neo QLED", category: "Electronics", subCategory: "Televisions", priceQAR: 7500 },
  { code: "ELE-TV-006", name: "Smart TV 43\"", brand: "LG", spec: "43\" 4K UHD, WebOS", category: "Electronics", subCategory: "Televisions", priceQAR: 1500 },
  { code: "ELE-TV-007", name: "Smart TV 55\"", brand: "LG", spec: "55\" 4K OLED", category: "Electronics", subCategory: "Televisions", priceQAR: 4500 },
  { code: "ELE-TV-008", name: "Smart TV 65\"", brand: "LG", spec: "65\" 4K OLED", category: "Electronics", subCategory: "Televisions", priceQAR: 6800 },
  { code: "ELE-TV-009", name: "Smart TV 55\"", brand: "Sony", spec: "55\" 4K OLED Bravia", category: "Electronics", subCategory: "Televisions", priceQAR: 5200 },
  { code: "ELE-TV-010", name: "Smart TV 65\"", brand: "Sony", spec: "65\" 4K OLED Bravia", category: "Electronics", subCategory: "Televisions", priceQAR: 7800 },
  { code: "ELE-AUD-001", name: "Soundbar", brand: "Samsung", spec: "2.1ch, 200W, Bluetooth", category: "Electronics", subCategory: "Audio", priceQAR: 1200 },
  { code: "ELE-AUD-002", name: "Soundbar", brand: "LG", spec: "3.1ch, 440W, Dolby Atmos", category: "Electronics", subCategory: "Audio", priceQAR: 1800 },
  { code: "ELE-AUD-003", name: "Soundbar", brand: "Sony", spec: "5.1.2ch, 500W, Dolby Atmos", category: "Electronics", subCategory: "Audio", priceQAR: 2800 },
  { code: "ELE-AUD-004", name: "Bluetooth Speaker", brand: "JBL", spec: "Charge 5, 40W", category: "Electronics", subCategory: "Audio", priceQAR: 450 },
  { code: "ELE-AUD-005", name: "Home Theatre System", brand: "Sony", spec: "5.1ch, 1000W", category: "Electronics", subCategory: "Audio", priceQAR: 3500 },
  { code: "ELE-NET-001", name: "Wi-Fi Router", brand: "TP-Link", spec: "AX3000, Wi-Fi 6, Dual Band", category: "Electronics", subCategory: "Networking", priceQAR: 380 },
  { code: "ELE-NET-002", name: "Wi-Fi Router", brand: "Asus", spec: "AX5400, Wi-Fi 6, Tri-Band", category: "Electronics", subCategory: "Networking", priceQAR: 750 },
  { code: "ELE-NET-003", name: "Wi-Fi Mesh System (3-pack)", brand: "Google Nest", spec: "Wi-Fi 6E, Tri-Band", category: "Electronics", subCategory: "Networking", priceQAR: 1400 },
  { code: "ELE-STR-001", name: "Streaming Device", brand: "Apple TV 4K", spec: "3rd Gen, Wi-Fi 6", category: "Electronics", subCategory: "Streaming", priceQAR: 650 },
  { code: "ELE-STR-002", name: "Streaming Device", brand: "Amazon Fire TV", spec: "4K Max, Wi-Fi 6", category: "Electronics", subCategory: "Streaming", priceQAR: 280 },
  // ── LIGHTING & FIXTURES ─────────────────────────────────────────────────────
  { code: "LIG-FIX-001", name: "Floor Lamp", brand: "IKEA", spec: "E27, White, 160cm", category: "Lighting & Fixtures", subCategory: "Lamps", priceQAR: 180 },
  { code: "LIG-FIX-002", name: "Table Lamp", brand: "IKEA", spec: "E14, White, 40cm", category: "Lighting & Fixtures", subCategory: "Lamps", priceQAR: 95 },
  { code: "LIG-FIX-003", name: "Pendant Light", brand: "Home Centre", spec: "E27, Gold, 30cm", category: "Lighting & Fixtures", subCategory: "Ceiling Lights", priceQAR: 280 },
  { code: "LIG-FIX-004", name: "Chandelier", brand: "Pan Emirates", spec: "8-Light, Chrome", category: "Lighting & Fixtures", subCategory: "Ceiling Lights", priceQAR: 1200 },
  { code: "LIG-FIX-005", name: "LED Strip Light 5m", brand: "Philips Hue", spec: "RGB, Smart, 2000lm", category: "Lighting & Fixtures", subCategory: "LED & Smart", priceQAR: 380 },
  { code: "LIG-FIX-006", name: "Smart Bulb E27 (4-pack)", brand: "Philips Hue", spec: "9W, RGB, Wi-Fi", category: "Lighting & Fixtures", subCategory: "LED & Smart", priceQAR: 280 },
  // ── OUTDOOR & GARDEN ────────────────────────────────────────────────────────
  { code: "OUT-GAR-001", name: "Outdoor Sofa Set 4pc", brand: "Home Centre", spec: "Rattan, Grey Cushions", category: "Outdoor & Garden", subCategory: "Outdoor Furniture", priceQAR: 3200 },
  { code: "OUT-GAR-002", name: "Outdoor Dining Set 6-Seater", brand: "Pan Emirates", spec: "Aluminium, Teak Top", category: "Outdoor & Garden", subCategory: "Outdoor Furniture", priceQAR: 4500 },
  { code: "OUT-GAR-003", name: "Sun Lounger (pair)", brand: "Home Centre", spec: "Rattan, Beige Cushions", category: "Outdoor & Garden", subCategory: "Outdoor Furniture", priceQAR: 1800 },
  { code: "OUT-GAR-004", name: "BBQ Grill", brand: "Weber", spec: "Genesis E-325s, Gas", category: "Outdoor & Garden", subCategory: "BBQ & Outdoor Cooking", priceQAR: 3800 },
  { code: "OUT-GAR-005", name: "Outdoor Umbrella", brand: "Home Centre", spec: "3m Dia, Beige", category: "Outdoor & Garden", subCategory: "Outdoor Furniture", priceQAR: 650 },
  // ── OFFICE & STUDY ──────────────────────────────────────────────────────────
  { code: "OFF-STU-001", name: "Office Desk", brand: "IKEA", spec: "140x60cm, White", category: "Office & Study", subCategory: "Desks", priceQAR: 750 },
  { code: "OFF-STU-002", name: "Standing Desk", brand: "IKEA", spec: "160x80cm, Electric Height Adj.", category: "Office & Study", subCategory: "Desks", priceQAR: 2200 },
  { code: "OFF-STU-003", name: "Office Chair", brand: "IKEA", spec: "Ergonomic, Mesh, Black", category: "Office & Study", subCategory: "Chairs", priceQAR: 850 },
  { code: "OFF-STU-004", name: "Office Chair", brand: "Herman Miller", spec: "Aeron, Fully Adj.", category: "Office & Study", subCategory: "Chairs", priceQAR: 5500 },
  { code: "OFF-STU-005", name: "Printer", brand: "HP", spec: "LaserJet Pro, A4, Wi-Fi", category: "Office & Study", subCategory: "Office Equipment", priceQAR: 850 },
  { code: "OFF-STU-006", name: "Monitor 27\"", brand: "Dell", spec: "27\" 4K IPS, USB-C", category: "Office & Study", subCategory: "Office Equipment", priceQAR: 1800 },
  { code: "OFF-STU-007", name: "Filing Cabinet 3-Drawer", brand: "IKEA", spec: "Metal, Black", category: "Office & Study", subCategory: "Storage", priceQAR: 650 },
];

const CATEGORIES = Array.from(new Set(MASTER_ITEMS.map(i => i.category))) as Category[];

// ─────────────────────────────────────────────────────────────────────────────
// SET TYPES
// ─────────────────────────────────────────────────────────────────────────────
interface SetLine {
  item: MasterItem;
  qty: number;
  serialNumbers: string[];
  leaseDate: string;
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

let setCounter = 1;
function nextSetCode() { return `ASET-${String(setCounter++).padStart(3, "0")}`; }

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function AssetRegistry() {
  // ── Library filters ──────────────────────────────────────────────────────
  const [libCategory, setLibCategory] = useState<string>("all");
  const [libSubCat, setLibSubCat] = useState<string>("all");
  const [libSearch, setLibSearch] = useState("");

  // ── Saved sets ───────────────────────────────────────────────────────────
  const [savedSets, setSavedSets] = useState<AssetSet[]>([]);
  const [selectedSetId, setSelectedSetId] = useState<string>("none");

  // ── Builder state ────────────────────────────────────────────────────────
  type BuilderMode = "idle" | "new" | "edit";
  const [builderMode, setBuilderMode] = useState<BuilderMode>("idle");
  const [draftLines, setDraftLines] = useState<SetLine[]>([]);
  const [draftName, setDraftName] = useState("");
  const [draftDesc, setDraftDesc] = useState("");
  const [editingSetId, setEditingSetId] = useState<string | null>(null);

  // ── Derived ──────────────────────────────────────────────────────────────
  const subCategories = useMemo(() => {
    if (libCategory === "all") return [];
    return Array.from(new Set(MASTER_ITEMS.filter(i => i.category === libCategory).map(i => i.subCategory)));
  }, [libCategory]);

  const filteredItems = useMemo(() => {
    return MASTER_ITEMS.filter(item => {
      if (libCategory !== "all" && item.category !== libCategory) return false;
      if (libSubCat !== "all" && item.subCategory !== libSubCat) return false;
      if (libSearch) {
        const q = libSearch.toLowerCase();
        return item.name.toLowerCase().includes(q) || (item.brand ?? "").toLowerCase().includes(q) || (item.spec ?? "").toLowerCase().includes(q);
      }
      return true;
    });
  }, [libCategory, libSubCat, libSearch]);

  const selectedSet = savedSets.find(s => s.id === selectedSetId) ?? null;
  const totalItems = draftLines.reduce((s, l) => s + l.qty, 0);
  const totalValue = draftLines.reduce((s, l) => s + l.qty * l.item.priceQAR, 0);

  // ── Handlers ─────────────────────────────────────────────────────────────
  function addToDraft(item: MasterItem) {
    if (builderMode === "idle") {
      toast.info("Click 'New Set' to start building a set first.");
      return;
    }
    setDraftLines(prev => {
      const existing = prev.find(l => l.item.code === item.code);
      if (existing) {
        return prev.map(l =>
          l.item.code === item.code
            ? { ...l, qty: l.qty + 1, serialNumbers: [...l.serialNumbers, ""] }
            : l
        );
      }
      return [...prev, { item, qty: 1, serialNumbers: [""], leaseDate: "", warrantyExpiry: "" }];
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

  function updateSerial(code: string, idx: number, val: string) {
    setDraftLines(prev => prev.map(l => {
      if (l.item.code !== code) return l;
      const sns = [...l.serialNumbers];
      sns[idx] = val;
      return { ...l, serialNumbers: sns };
    }));
  }

  function updateDate(code: string, field: "leaseDate" | "warrantyExpiry", val: string) {
    setDraftLines(prev => prev.map(l =>
      l.item.code === code ? { ...l, [field]: val } : l
    ));
  }

  function startNew() {
    setBuilderMode("new");
    setDraftLines([]);
    setDraftName("");
    setDraftDesc("");
    setEditingSetId(null);
  }

  function startEdit(set: AssetSet) {
    setBuilderMode("edit");
    setDraftLines(set.lines.map(l => ({ ...l })));
    setDraftName(set.name);
    setDraftDesc(set.description);
    setEditingSetId(set.id);
  }

  function cancelDraft() {
    setBuilderMode("idle");
    setDraftLines([]);
    setDraftName("");
    setDraftDesc("");
    setEditingSetId(null);
  }

  function saveSet() {
    if (!draftName.trim()) { toast.error("Set name is required"); return; }
    if (draftLines.length === 0) { toast.error("Add at least one item"); return; }
    if (builderMode === "new") {
      const newSet: AssetSet = {
        id: crypto.randomUUID(),
        code: nextSetCode(),
        name: draftName.trim(),
        description: draftDesc.trim(),
        lines: draftLines,
        createdAt: new Date().toISOString(),
      };
      setSavedSets(prev => [...prev, newSet]);
      setSelectedSetId(newSet.id);
      toast.success(`Set "${newSet.name}" saved as ${newSet.code}`);
    } else if (builderMode === "edit" && editingSetId) {
      setSavedSets(prev => prev.map(s =>
        s.id === editingSetId
          ? { ...s, name: draftName.trim(), description: draftDesc.trim(), lines: draftLines }
          : s
      ));
      toast.success("Set updated");
    }
    cancelDraft();
  }

  function deleteSet(id: string) {
    setSavedSets(prev => prev.filter(s => s.id !== id));
    if (selectedSetId === id) setSelectedSetId("none");
    toast.success("Set deleted");
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <DashboardLayout>
      <div className="flex flex-col h-full gap-4 p-4 overflow-auto">

        {/* ── TOP: Saved Sets Panel ─────────────────────────────────────── */}
        <Card className="bg-[#13161f] border-white/10 shrink-0">
          <CardHeader className="pb-2 pt-4 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                <Package className="h-4 w-4 text-red-400" />
                Sub-Asset Groups
              </CardTitle>
              <Button size="sm" className="h-8 bg-red-600 hover:bg-red-700 text-white gap-1.5"
                onClick={startNew} disabled={builderMode !== "idle"}>
                <Plus className="h-3.5 w-3.5" /> New Set
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {savedSets.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2">No sets created yet. Click "New Set" to build your first asset set.</p>
            ) : (
              <div className="space-y-3">
                {/* Dropdown selector */}
                <div className="flex items-center gap-3">
                  <Select value={selectedSetId} onValueChange={setSelectedSetId}>
                    <SelectTrigger className="bg-[#1a1d2e] border-white/10 text-gray-200 h-9 w-72">
                      <SelectValue placeholder="Select a saved set…" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">— Select a set —</SelectItem>
                      {savedSets.map(s => (
                        <SelectItem key={s.id} value={s.id}>
                          <span className="font-mono text-xs text-amber-400 mr-2">{s.code}</span>
                          {s.name}
                          <span className="ml-2 text-muted-foreground text-xs">({s.lines.reduce((a, l) => a + l.qty, 0)} items)</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedSet && (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="h-8 border-white/10 text-gray-300 gap-1"
                        onClick={() => startEdit(selectedSet)} disabled={builderMode !== "idle"}>
                        <Edit2 className="h-3 w-3" /> Edit
                      </Button>
                      <Button size="sm" variant="outline" className="h-8 border-red-500/30 text-red-400 gap-1 hover:bg-red-500/10"
                        onClick={() => deleteSet(selectedSet.id)}>
                        <Trash2 className="h-3 w-3" /> Delete
                      </Button>
                    </div>
                  )}
                </div>
                {/* Selected set preview */}
                {selectedSet && (
                  <div className="bg-[#1a1d2e] rounded-lg p-3 border border-white/5">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge className="bg-amber-500/20 text-amber-400 font-mono text-xs">{selectedSet.code}</Badge>
                      <span className="text-sm font-semibold text-white">{selectedSet.name}</span>
                      {selectedSet.description && <span className="text-xs text-muted-foreground">{selectedSet.description}</span>}
                      <span className="ml-auto text-xs text-muted-foreground">{selectedSet.lines.reduce((a, l) => a + l.qty, 0)} units · QAR {selectedSet.lines.reduce((a, l) => a + l.qty * l.item.priceQAR, 0).toLocaleString()}</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                      {selectedSet.lines.map(l => (
                        <div key={l.item.code} className="flex flex-col gap-0.5 bg-[#13161f] rounded-lg px-3 py-2 border border-white/5">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-medium text-gray-200 truncate">{l.item.name}</span>
                            <Badge variant="outline" className="text-[10px] px-1 h-4 border-white/10 text-gray-400 shrink-0">×{l.qty}</Badge>
                          </div>
                          {l.item.brand && <span className="text-[10px] text-blue-400">{l.item.brand}</span>}
                          {l.item.spec && <span className="text-[10px] text-muted-foreground truncate">{l.item.spec}</span>}
                          <span className="text-[10px] font-semibold text-amber-400 mt-0.5">QAR {(l.qty * l.item.priceQAR).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── BOTTOM: Item Library + Set Builder ───────────────────────── */}
        <div className="flex gap-4 flex-1 min-h-0">

          {/* Left: Item Library */}
          <Card className="bg-[#13161f] border-white/10 flex flex-col flex-1 min-w-0">
            <CardHeader className="pb-2 pt-4 px-4 shrink-0">
              <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                <Tag className="h-4 w-4 text-blue-400" />
                Item Library
                <Badge variant="outline" className="ml-auto border-white/10 text-gray-400 text-xs">{filteredItems.length} items</Badge>
              </CardTitle>
              {/* Filters */}
              <div className="flex gap-2 mt-2 flex-wrap">
                <Select value={libCategory} onValueChange={v => { setLibCategory(v); setLibSubCat("all"); }}>
                  <SelectTrigger className="bg-[#1a1d2e] border-white/10 text-gray-200 h-8 w-48 text-xs">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
                {subCategories.length > 0 && (
                  <Select value={libSubCat} onValueChange={setLibSubCat}>
                    <SelectTrigger className="bg-[#1a1d2e] border-white/10 text-gray-200 h-8 w-44 text-xs">
                      <SelectValue placeholder="All Sub-Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sub-Categories</SelectItem>
                      {subCategories.map(sc => <SelectItem key={sc} value={sc}>{sc}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
                <div className="relative flex-1 min-w-[140px]">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input className="bg-[#1a1d2e] border-white/10 text-gray-200 h-8 pl-7 text-xs"
                    placeholder="Search items…" value={libSearch} onChange={e => setLibSearch(e.target.value)} />
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto px-4 pb-4">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-1.5">
                {filteredItems.map(item => (
                  <button key={item.code}
                    onClick={() => addToDraft(item)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[#1a1d2e] border border-white/5 hover:border-red-500/40 hover:bg-red-500/5 transition-colors text-left group">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-200 truncate">{item.name}</span>
                        {item.brand && <span className="text-[10px] text-blue-400 shrink-0">{item.brand}</span>}
                      </div>
                      {item.spec && <p className="text-[10px] text-muted-foreground truncate mt-0.5">{item.spec}</p>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-semibold text-amber-400">QAR {item.priceQAR.toLocaleString()}</span>
                      <Plus className="h-3.5 w-3.5 text-muted-foreground group-hover:text-red-400 transition-colors" />
                    </div>
                  </button>
                ))}
                {filteredItems.length === 0 && (
                  <p className="text-xs text-muted-foreground py-4 text-center">No items match the current filter.</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Right: Set Builder */}
          <Card className="bg-[#13161f] border-white/10 flex flex-col w-[420px] shrink-0">
            <CardHeader className="pb-2 pt-4 px-4 shrink-0">
              <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-400" />
                {builderMode === "idle" ? "Set Builder" : builderMode === "new" ? "New Set" : "Edit Set"}
              </CardTitle>
            </CardHeader>
            {builderMode === "idle" ? (
              <CardContent className="flex-1 flex flex-col items-center justify-center text-center gap-3 px-4 pb-4">
                <Package className="h-10 w-10 text-muted-foreground opacity-30" />
                <p className="text-xs text-muted-foreground">Click <strong>New Set</strong> above to start building,<br />or select a saved set and click <strong>Edit</strong>.</p>
              </CardContent>
            ) : (
              <>
                <CardContent className="flex-1 overflow-y-auto px-4 pb-2">
                  {/* Set name & description */}
                  <div className="space-y-2 mb-3">
                    <div>
                      <Label className="text-xs text-gray-400">Set Name *</Label>
                      <Input className="bg-[#1a1d2e] border-white/10 text-gray-200 h-8 text-xs mt-1"
                        placeholder="e.g. 3BR Villa Standard Package"
                        value={draftName} onChange={e => setDraftName(e.target.value)} />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-400">Description</Label>
                      <Input className="bg-[#1a1d2e] border-white/10 text-gray-200 h-8 text-xs mt-1"
                        placeholder="Optional notes"
                        value={draftDesc} onChange={e => setDraftDesc(e.target.value)} />
                    </div>
                  </div>
                  <Separator className="bg-white/5 mb-3" />
                  {draftLines.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">Click items from the library to add them here.</p>
                  ) : (
                    <div className="space-y-3">
                      {draftLines.map(line => (
                        <div key={line.item.code} className="bg-[#1a1d2e] rounded-lg p-2.5 border border-white/5">
                          {/* Item header */}
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-gray-200 truncate">{line.item.name}</p>
                              <p className="text-[10px] text-muted-foreground truncate">{line.item.brand} · {line.item.spec}</p>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <Button size="icon" variant="ghost" className="h-5 w-5 text-gray-400 hover:text-white"
                                onClick={() => changeQty(line.item.code, -1)}><Minus className="h-3 w-3" /></Button>
                              <span className="text-xs font-mono w-5 text-center text-white">{line.qty}</span>
                              <Button size="icon" variant="ghost" className="h-5 w-5 text-gray-400 hover:text-white"
                                onClick={() => changeQty(line.item.code, 1)}><Plus className="h-3 w-3" /></Button>
                              <Button size="icon" variant="ghost" className="h-5 w-5 text-red-400 hover:text-red-300 ml-1"
                                onClick={() => removeFromDraft(line.item.code)}><Trash2 className="h-3 w-3" /></Button>
                            </div>
                          </div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] text-amber-400">QAR {line.item.priceQAR.toLocaleString()} × {line.qty} = QAR {(line.item.priceQAR * line.qty).toLocaleString()}</span>
                          </div>
                          {/* Serial numbers */}
                          <div className="grid grid-cols-2 gap-1.5">
                            {Array.from({ length: line.qty }).map((_, idx) => (
                              <div key={idx} className="flex items-center gap-1.5">
                                <span className="text-[10px] text-muted-foreground w-8 shrink-0 font-mono">#{idx + 1}</span>
                                <Input className="h-6 text-[10px] font-mono bg-[#13161f] border-white/5"
                                  placeholder="Serial No." value={line.serialNumbers[idx] ?? ""}
                                  onChange={e => updateSerial(line.item.code, idx, e.target.value)} />
                              </div>
                            ))}
                          </div>
                          {/* Lease Date & Warranty Expiry */}
                          <div className="grid grid-cols-2 gap-1.5 mt-1.5">
                            <div>
                              <Label className="text-[10px] text-muted-foreground">Lease Date</Label>
                              <Input type="date" className="h-6 text-[10px] bg-[#13161f] border-white/5 mt-0.5"
                                value={line.leaseDate} onChange={e => updateDate(line.item.code, "leaseDate", e.target.value)} />
                            </div>
                            <div>
                              <Label className="text-[10px] text-muted-foreground">Warranty Exp.</Label>
                              <Input type="date" className="h-6 text-[10px] bg-[#13161f] border-white/5 mt-0.5"
                                value={line.warrantyExpiry} onChange={e => updateDate(line.item.code, "warrantyExpiry", e.target.value)} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
                <Separator className="bg-white/5" />
                <div className="px-4 py-3 shrink-0 bg-[#0f1117]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground">{draftLines.length} item types · <strong className="text-white">{totalItems}</strong> units</span>
                    <span className="text-xs font-semibold text-amber-400">QAR {totalValue.toLocaleString()}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1 h-8 border-white/10 text-gray-300" onClick={cancelDraft}>Cancel</Button>
                    <Button size="sm" className="flex-1 h-8 bg-red-600 hover:bg-red-700 text-white gap-1.5" onClick={saveSet}>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {builderMode === "new" ? "Save Set" : "Update Set"}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
