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
import { Plus, Leaf, Zap, Droplets, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ScreenHeader } from "@/components/ScreenHeader";
import SlidePanel from "@/components/SlidePanel";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const RATINGS = ["Platinum","Gold","Silver","Bronze","None"];
const RATING_COLORS: Record<string, string> = { Platinum: "bg-violet-500", Gold: "bg-amber-500", Silver: "bg-gray-400", Bronze: "bg-orange-600", None: "bg-gray-600" };

export default function ESGCarbon() {
  const year = new Date().getFullYear();
  const [open, setOpen] = useState(false);
  const [aiRecord, setAiRecord] = useState<Record<string, unknown> | null>(null);
  const [form, setForm] = useState({ contract_id: 0, reporting_year: year, reporting_month: new Date().getMonth() + 1, scope1_tonnes: 0, scope2_tonnes: 0, scope3_tonnes: 0, energy_kwh: 0, water_m3: 0, waste_tonnes: 0, green_rating: "None", notes: "" });

  const { data: records = [], refetch } = trpc.esgCarbon.list.useQuery();
  const { data: contractsData } = trpc.lease.getLeaseRegister.useQuery({ status: "Active" });
  const contracts = (contractsData as any)?.rows ?? [];

  const save = trpc.esgCarbon.upsert.useMutation({ onSuccess: () => { refetch(); setOpen(false); toast.success("ESG record saved"); }, onError: (e: any) => toast.error(e.message) });

  const totalScope1 = (records as any[]).reduce((s: number, r: any) => s + Number(r.scope1_tonnes ?? 0), 0);
  const totalScope2 = (records as any[]).reduce((s: number, r: any) => s + Number(r.scope2_tonnes ?? 0), 0);
  const totalScope3 = (records as any[]).reduce((s: number, r: any) => s + Number(r.scope3_tonnes ?? 0), 0);
  const totalEnergy = (records as any[]).reduce((s: number, r: any) => s + Number(r.energy_kwh ?? 0), 0);

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <ScreenHeader
  screenId="VFLESGCRB0001P001"
  title="ESG Carbon Tracker"
  subtitle="Carbon footprint and sustainability metrics"

          screenType="esg_carbon"
          onAIData={(rows) => setAiRecord(rows[0] ?? null)}
        />

        <div className="grid grid-cols-4 gap-4">
          {[
            { label: `Scope 1 — ${year}`, value: `${totalScope1.toFixed(1)} tCO₂e`, icon: <Leaf className="w-4 h-4 text-emerald-500" />, color: "text-emerald-600" },
            { label: `Scope 2 — ${year}`, value: `${totalScope2.toFixed(1)} tCO₂e`, icon: <Zap className="w-4 h-4 text-amber-500" />, color: "text-amber-600" },
            { label: `Scope 3 — ${year}`, value: `${totalScope3.toFixed(1)} tCO₂e`, icon: <Leaf className="w-4 h-4 text-blue-500" />, color: "text-blue-600" },
            { label: `Energy — ${year}`, value: `${(totalEnergy/1000).toFixed(0)} MWh`, icon: <Zap className="w-4 h-4 text-violet-500" />, color: "text-violet-600" },
          ].map(k => (
            <Card key={k.label}>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-1">{k.icon}<p className="text-xs text-muted-foreground">{k.label}</p></div>
                <p className={`text-xl font-bold ${k.color}`}>{k.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">ESG Records — {year} ({(records as any[]).length} entries)</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contract</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead className="text-right">Scope 1</TableHead>
                  <TableHead className="text-right">Scope 2</TableHead>
                  <TableHead className="text-right">Scope 3</TableHead>
                  <TableHead className="text-right">Energy (kWh)</TableHead>
                  <TableHead className="text-right">Water (m³)</TableHead>
                  <TableHead className="text-right">Waste (t)</TableHead>
                  <TableHead>Rating</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(records as any[]).map((r: any) => (
                  <TableRow key={r.carbon_id}>
                    <TableCell className="font-mono text-xs">{r.contract_ref}</TableCell>
                    <TableCell className="text-sm">{MONTHS[(r.reporting_month ?? 1) - 1]} {r.reporting_year}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{Number(r.scope1_tonnes ?? 0).toFixed(2)}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{Number(r.scope2_tonnes ?? 0).toFixed(2)}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{Number(r.scope3_tonnes ?? 0).toFixed(2)}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{Number(r.energy_kwh ?? 0).toLocaleString()}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{Number(r.water_m3 ?? 0).toLocaleString()}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{Number(r.waste_tonnes ?? 0).toFixed(2)}</TableCell>
                    <TableCell>{r.green_rating && r.green_rating !== "None" ? <Badge className={`${RATING_COLORS[r.green_rating] ?? "bg-gray-500"} text-white text-xs`}>{r.green_rating}</Badge> : <span className="text-muted-foreground text-xs">—</span>}</TableCell>
                  </TableRow>
                ))}
                {(records as any[]).length === 0 && <TableRow><TableCell colSpan={9} className="text-center py-6 text-muted-foreground">No ESG records for {year}</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
