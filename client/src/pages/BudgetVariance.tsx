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
import { Plus, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { toast } from "sonner";
import { ScreenHeader } from "@/components/ScreenHeader";

const fmt = (n: any) => n != null ? `AED ${Number(n).toLocaleString()}` : "—";
const pct = (n: any) => n != null ? `${Number(n).toFixed(1)}%` : "—";

export default function BudgetVariance() {
  const year = new Date().getFullYear();
  const [bvOpen, setBvOpen] = useState(false);
  const [ccOpen, setCcOpen] = useState(false);
  const [bvForm, setBvForm] = useState({ contract_id: 0, budget_year: year, budget_month: new Date().getMonth() + 1, budgeted_amount: 0, actual_amount: 0, cost_centre: "", notes: "" });
  const [ccForm, setCcForm] = useState({ contract_id: 0, cost_centre_code: "", cost_centre_name: "", allocation_pct: 100, effective_from: "", effective_to: "" });

  const { data: variances = [], refetch: refetchBv } = trpc.budgetVariance.list.useQuery({ year });
  const { data: allocations = [], refetch: refetchCc } = trpc.costCentre.list.useQuery();
  const { data: contractsData } = trpc.lease.getLeaseRegister.useQuery({ status: "Active" });
  const contracts = (contractsData as any)?.rows ?? [];

  const saveBv = trpc.budgetVariance.upsert.useMutation({ onSuccess: () => { refetchBv(); setBvOpen(false); toast.success("Budget variance saved"); }, onError: (e: any) => toast.error(e.message) });
  const saveCc = trpc.costCentre.upsert.useMutation({ onSuccess: () => { refetchCc(); setCcOpen(false); toast.success("Cost centre allocation saved"); }, onError: (e: any) => toast.error(e.message) });

  const totalBudget = (variances as any[]).reduce((s: number, v: any) => s + Number(v.budgeted_amount ?? 0), 0);
  const totalActual = (variances as any[]).reduce((s: number, v: any) => s + Number(v.actual_amount ?? 0), 0);
  const totalVariance = totalActual - totalBudget;

  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  return (
    <DashboardLayout>
      <ScreenHeader
  screenId="VFLBDGVAR0001P001"
  title="Budget Variance Analysis"
  subtitle="Actual vs budget variance reporting"
/>
    </DashboardLayout>
  );
}
