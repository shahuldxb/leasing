import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUp, TrendingDown, Play, History } from "lucide-react";
import { toast } from "sonner";
import { ScreenHeader } from "@/components/ScreenHeader";

const fmt = (n: any) => n != null ? `AED ${Number(n).toLocaleString("en-AE", { maximumFractionDigits: 0 })}` : "—";
const pct = (a: number, b: number) => b ? ((b - a) / Math.abs(a) * 100).toFixed(1) : "0";

export default function ScenarioModelling() {
  const [form, setForm] = useState({
    scenario_name: "",
    ibr_adjustment: 0,
    rent_increase_pct: 0,
    include_renewals: false,
    description: "",
  });
  const [result, setResult] = useState<any>(null);

  const { data: history = [], refetch: refetchHistory } = trpc.scenario.list.useQuery();

  const run = trpc.scenario.run.useMutation({
    onSuccess: (data) => {
      setResult(data);
      refetchHistory();
      toast.success(`Scenario "${data.scenario_name}" saved`);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const liabilityDelta = result ? Number(result.scenario_total_liability) - Number(result.current_total_liability) : 0;
  const paymentDelta = result ? Number(result.scenario_annual_payments) - Number(result.current_annual_payments) : 0;

  return (
    <DashboardLayout>
      <ScreenHeader
  screenId="VFLSCNMOD0001P001"
  title="Scenario Modelling"
  subtitle="What-if scenario analysis for lease portfolio"
/>
    </DashboardLayout>
  );
}
