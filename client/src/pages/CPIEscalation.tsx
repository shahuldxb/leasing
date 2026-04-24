import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, Calendar, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { ScreenHeader } from "@/components/ScreenHeader";

const fmt = (n: number | null | undefined) => n != null ? `AED ${Number(n).toLocaleString("en-AE", { maximumFractionDigits: 0 })}` : "—";

export default function CPIEscalation() {
  const [applyDialog, setApplyDialog] = useState<any>(null);
  const [newRent, setNewRent] = useState("");

  const { data: escalations = [], refetch } = trpc.accounting.escalation.escalations.useQuery({});
  const { data: cpiData = [] } = trpc.accounting.escalation.cpiIndex.useQuery({});
  const apply = trpc.accounting.escalation.applyEscalation.useMutation({
    onSuccess: () => { refetch(); setApplyDialog(null); toast.success("Escalation applied and contract updated"); },
  });

  const pending = (escalations as any[]).filter((e: any) => e.status === "PENDING");
  const applied = (escalations as any[]).filter((e: any) => e.status === "APPLIED");

  const statusBadge = (s: string) => {
    if (s === "APPLIED") return <Badge variant="default">Applied</Badge>;
    if (s === "PENDING") return <Badge variant="secondary" className="text-amber-600">Pending</Badge>;
    return <Badge variant="outline">{s}</Badge>;
  };

  return (
    <DashboardLayout>
      <ScreenHeader
  screenId="VFLCPIESC0001P001"
  title="CPI Escalation Engine"
  subtitle="Consumer price index-linked rent escalation"
/>
    </DashboardLayout>
  );
}
