import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Building2, Hammer } from "lucide-react";
import { toast } from "sonner";
import { ScreenHeader } from "@/components/ScreenHeader";

const fmt = (n: any) => n != null ? `AED ${Number(n).toLocaleString()}` : "—";
const pct = (used: any, total: any) => total ? `${((Number(used) / Number(total)) * 100).toFixed(0)}%` : "—";

export default function SpaceManagement() {
  const [spaceOpen, setSpaceOpen] = useState(false);
  const [aiRecord, setAiRecord] = useState<Record<string, unknown> | null>(null);
  const [projOpen, setProjOpen] = useState(false);
  const [spaceForm, setSpaceForm] = useState<{ contract_id: number; building_name: string; floor_number: string; total_area_sqm: number; occupied_area_sqm: number; capacity_desks: number; occupied_desks: number; space_type: "OFFICE" | "RETAIL" | "WAREHOUSE" | "DATA_CENTRE" | "PARKING" | "OTHER" }>({ contract_id: 0, building_name: "", floor_number: "", total_area_sqm: 0, occupied_area_sqm: 0, capacity_desks: 0, occupied_desks: 0, space_type: "OFFICE" });
  const [projForm, setProjForm] = useState<{ contract_id: number; project_name: string; project_type: "FIT_OUT" | "REFURBISHMENT" | "EXPANSION" | "MAINTENANCE" | "OTHER"; budget_amount: number; committed_amount: number; actual_spend: number; start_date: string; expected_completion: string; status: "PLANNED" | "IN_PROGRESS" | "COMPLETED" | "ON_HOLD" | "CANCELLED"; project_manager: string; notes: string }>({ contract_id: 0, project_name: "", project_type: "FIT_OUT", budget_amount: 0, committed_amount: 0, actual_spend: 0, start_date: "", expected_completion: "", status: "PLANNED", project_manager: "", notes: "" });

  const { data: spaces = [], refetch: refetchSpaces } = trpc.spaceManagement.list.useQuery();
  const { data: projects = [], refetch: refetchProjs } = trpc.capitalProjects.list.useQuery();
  const { data: contractsData } = trpc.lease.getLeaseRegister.useQuery({ status: "Active" });
  const contracts = (contractsData as any)?.rows ?? [];

  const saveSpace = trpc.spaceManagement.upsert.useMutation({ onSuccess: () => { refetchSpaces(); setSpaceOpen(false); toast.success("Space record saved"); }, onError: (e: any) => toast.error(e.message) });
  const saveProj = trpc.capitalProjects.upsert.useMutation({ onSuccess: () => { refetchProjs(); setProjOpen(false); toast.success("Project saved"); }, onError: (e: any) => toast.error(e.message) });

  const totalSqm = (spaces as any[]).reduce((s: number, x: any) => s + Number(x.total_area_sqm ?? 0), 0);
  const occupiedSqm = (spaces as any[]).reduce((s: number, x: any) => s + Number(x.occupied_area_sqm ?? 0), 0);
  const totalBudget = (projects as any[]).reduce((s: number, p: any) => s + Number(p.budget_amount ?? 0), 0);
  const totalSpend = (projects as any[]).reduce((s: number, p: any) => s + Number(p.actual_spend ?? 0), 0);

  const STATUS_COLORS: Record<string, string> = { PLANNED: "bg-gray-500", IN_PROGRESS: "bg-blue-500", ON_HOLD: "bg-amber-500", COMPLETED: "bg-emerald-500", CANCELLED: "bg-red-500" };

  return (
    <DashboardLayout>
      <ScreenHeader
  screenId="VFLSPCMGR0001P001"
  title="Space Management"
  subtitle="Floor plan and space utilisation management"

          screenType="space_management"
          onAIData={(rows) => setAiRecord(rows[0] ?? null)}
        />
    </DashboardLayout>
  );
}
