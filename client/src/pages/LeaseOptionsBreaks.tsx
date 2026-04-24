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
import { Plus, Scissors, RefreshCw, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { ScreenHeader } from "@/components/ScreenHeader";

const fmt = (n: any) => n != null ? `AED ${Number(n).toLocaleString()}` : "—";
const daysUntil = (d: string) => Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);

export default function LeaseOptionsBreaks() {
  const [optionOpen, setOptionOpen] = useState(false);
  const [breakOpen, setBreakOpen] = useState(false);
  const [optForm, setOptForm] = useState({ contract_id: 0, option_type: "RENEWAL" as const, exercise_deadline: "", notice_period_days: 90, new_term_months: 0, new_rent: 0, purchase_price: 0, reasonably_certain: false, notes: "" });
  const [brkForm, setBrkForm] = useState({ contract_id: 0, break_date: "", notice_deadline: "", penalty_amount: 0, conditions: "", status: "ACTIVE" as const });

  const { data: options = [], refetch: refetchOpts } = trpc.leaseOptions.list.useQuery({});
  const { data: breaks = [], refetch: refetchBrks } = trpc.breakClause.list.useQuery();
  const { data: contractsData } = trpc.lease.getLeaseRegister.useQuery({ status: "Active" });
  const contracts = (contractsData as any)?.rows ?? [];

  const createOpt = trpc.leaseOptions.upsert.useMutation({ onSuccess: () => { refetchOpts(); setOptionOpen(false); toast.success("Option saved"); }, onError: (e: any) => toast.error(e.message) });
  const exerciseOpt = trpc.leaseOptions.exercise.useMutation({ onSuccess: () => { refetchOpts(); toast.success("Option exercised"); }, onError: (e: any) => toast.error(e.message) });
  const createBrk = trpc.breakClause.upsert.useMutation({ onSuccess: () => { refetchBrks(); setBreakOpen(false); toast.success("Break clause saved"); }, onError: (e: any) => toast.error(e.message) });

  const urgency = (d: string) => { const days = daysUntil(d); return days < 30 ? "text-red-600 font-bold" : days < 90 ? "text-amber-600 font-semibold" : "text-muted-foreground"; };

  return (
    <DashboardLayout>
      <ScreenHeader
  screenId="VFLLEAOPT0001P001"
  title="Lease Options & Breaks"
  subtitle="Extension options and break clause management"
/>
    </DashboardLayout>
  );
}
