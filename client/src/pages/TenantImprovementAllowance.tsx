import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, CheckCircle, Clock, AlertTriangle, Plus, Download } from "lucide-react";
import { toast } from "sonner";
import { ScreenHeader } from "@/components/ScreenHeader";
import { GenAIFillButton } from "@/components/GenAIFillButton";

const TI_RECORDS = [
  { id: 1, lease_ref: "VF-2024-001", property: "Vodafone HQ Floor 12", lessor: "Al Futtaim", ti_agreed: 1200000, ti_received: 1200000, ti_spent: 1180000, remaining: 20000, status: "FULLY_RECEIVED", deadline: "2024-06-30", notes: "Fit-out complete. Minor snagging items outstanding." },
  { id: 2, lease_ref: "VF-2024-003", property: "Vodafone HQ Floor 13", lessor: "Al Futtaim", ti_agreed: 1100000, ti_received: 550000, ti_spent: 480000, remaining: 70000, status: "PARTIAL", deadline: "2024-09-30", notes: "Second tranche due on practical completion certificate." },
  { id: 3, lease_ref: "VF-2023-041", property: "Vodafone Abu Dhabi", lessor: "TECOM", ti_agreed: 800000, ti_received: 800000, ti_spent: 795000, remaining: 5000, status: "FULLY_RECEIVED", deadline: "2023-12-31", notes: "All works complete." },
  { id: 4, lease_ref: "LOI-2026-002", property: "One Central Tower A (Proposed)", lessor: "DWTC", ti_agreed: 1500000, ti_received: 0, ti_spent: 0, remaining: 1500000, status: "PENDING", deadline: "2026-12-31", notes: "Awaiting lease execution." },
];

const EXPENDITURE = [
  { category: "Partition & Joinery", amount: 485000, lease: "VF-2024-001", date: "2024-03-15", supplier: "Al Habtoor Interiors" },
  { category: "MEP Works", amount: 320000, lease: "VF-2024-001", date: "2024-04-01", supplier: "Drake & Scull" },
  { category: "Flooring", amount: 185000, lease: "VF-2024-001", date: "2024-04-20", supplier: "Interface UAE" },
  { category: "AV & IT Infrastructure", amount: 190000, lease: "VF-2024-001", date: "2024-05-10", supplier: "Dimension Data" },
  { category: "Furniture", amount: 0, lease: "VF-2024-001", date: "—", supplier: "Procured separately" },
];

const STATUS_COLORS: Record<string, string> = {
  FULLY_RECEIVED: "bg-green-500/20 text-green-400 border-green-500/30",
  PARTIAL: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  PENDING: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  OVERDUE: "bg-red-500/20 text-red-400 border-red-500/30",
};

export default function TenantImprovementAllowance() {
  const [tab, setTab] = useState("overview");
  const [aiRows, setAiRows] = useState<Record<string, unknown>[]>([]);
  const [tiForm, setTiForm] = useState({ lease_ref: "", property_name: "", allowance_amount: "", scope_of_work: "", contractor: "", completion_date: "" });
  const [showDialog, setShowDialog] = useState(false);

  const totalAgreed = TI_RECORDS.reduce((s, r) => s + r.ti_agreed, 0);
  const totalReceived = TI_RECORDS.reduce((s, r) => s + r.ti_received, 0);
  const totalSpent = TI_RECORDS.reduce((s, r) => s + r.ti_spent, 0);
  const totalOutstanding = TI_RECORDS.reduce((s, r) => s + (r.ti_agreed - r.ti_received), 0);

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <ScreenHeader
  screenId="VFLTIALL0001P001"
          screenType="ti_allowance"
          onAIData={(rows) => setAiRows(rows)}
  title="Tenant Improvement Allowance"
  subtitle="TI allowance tracking and amortisation"
/>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total TI Agreed", value: `AED ${(totalAgreed / 1000000).toFixed(2)}M`, icon: DollarSign, color: "text-blue-400" },
            { label: "Total Received", value: `AED ${(totalReceived / 1000000).toFixed(2)}M`, icon: CheckCircle, color: "text-green-400" },
            { label: "Total Spent", value: `AED ${(totalSpent / 1000000).toFixed(2)}M`, icon: DollarSign, color: "text-yellow-400" },
            { label: "Outstanding (Unclaimed)", value: `AED ${(totalOutstanding / 1000000).toFixed(2)}M`, icon: AlertTriangle, color: "text-orange-400" },
          ].map((kpi) => (
            <Card key={kpi.label} className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <kpi.icon className={`w-8 h-8 ${kpi.color}`} />
                  <div>
                    <p className="text-lg font-bold">{kpi.value}</p>
                    <p className="text-xs text-muted-foreground">{kpi.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="bg-muted/30">
            <TabsTrigger value="overview">TI Overview</TabsTrigger>
            <TabsTrigger value="expenditure">Expenditure Breakdown</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4">
            <Card className="bg-card border-border">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="text-xs">Lease Ref</TableHead>
                      <TableHead className="text-xs">Property</TableHead>
                      <TableHead className="text-xs">Lessor</TableHead>
                      <TableHead className="text-xs text-right">TI Agreed</TableHead>
                      <TableHead className="text-xs text-right">Received</TableHead>
                      <TableHead className="text-xs text-right">Spent</TableHead>
                      <TableHead className="text-xs text-right">Balance</TableHead>
                      <TableHead className="text-xs">Deadline</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {TI_RECORDS.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-mono text-xs">{r.lease_ref}</TableCell>
                        <TableCell className="text-sm">{r.property}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{r.lessor}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{(r.ti_agreed / 1000).toFixed(0)}K</TableCell>
                        <TableCell className="text-right font-mono text-sm text-green-400">{(r.ti_received / 1000).toFixed(0)}K</TableCell>
                        <TableCell className="text-right font-mono text-sm">{(r.ti_spent / 1000).toFixed(0)}K</TableCell>
                        <TableCell className="text-right font-mono text-sm text-yellow-400">{(r.remaining / 1000).toFixed(0)}K</TableCell>
                        <TableCell className="text-xs">{r.deadline}</TableCell>
                        <TableCell><Badge className={`text-xs border ${STATUS_COLORS[r.status]}`}>{r.status.replace("_", " ")}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            <div className="mt-4 space-y-3">
              {TI_RECORDS.map((r) => (
                <Card key={r.id} className="bg-card border-border">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-xs font-semibold">{r.lease_ref}</span>
                      <span className="text-xs text-muted-foreground">{r.property}</span>
                    </div>
                    <div className="h-3 bg-muted/30 rounded-full overflow-hidden">
                      <div className="h-full flex">
                        <div className="bg-green-500/70 h-full" style={{ width: `${(r.ti_spent / r.ti_agreed) * 100}%` }} />
                        <div className="bg-yellow-500/40 h-full" style={{ width: `${((r.ti_received - r.ti_spent) / r.ti_agreed) * 100}%` }} />
                      </div>
                    </div>
                    <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                      <span className="text-green-400">Spent: {Math.round((r.ti_spent / r.ti_agreed) * 100)}%</span>
                      <span className="text-yellow-400">Unspent received: {Math.round(((r.ti_received - r.ti_spent) / r.ti_agreed) * 100)}%</span>
                      <span>Unclaimed: {Math.round(((r.ti_agreed - r.ti_received) / r.ti_agreed) * 100)}%</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="expenditure" className="mt-4">
            <Card className="bg-card border-border">
              <CardHeader><CardTitle className="text-sm">Expenditure Breakdown — VF-2024-001</CardTitle></CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="text-xs">Category</TableHead>
                      <TableHead className="text-xs">Supplier</TableHead>
                      <TableHead className="text-xs">Date</TableHead>
                      <TableHead className="text-xs text-right">Amount (AED)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {EXPENDITURE.map((e, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-sm">{e.category}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{e.supplier}</TableCell>
                        <TableCell className="text-xs">{e.date}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{e.amount > 0 ? e.amount.toLocaleString() : "—"}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-muted/30 font-semibold">
                      <TableCell colSpan={3} className="text-sm">TOTAL</TableCell>
                      <TableCell className="text-right font-mono text-sm">{EXPENDITURE.reduce((s, e) => s + e.amount, 0).toLocaleString()}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Add TI Allowance Record</DialogTitle>
          <div className="flex justify-end mt-2"><GenAIFillButton formType="ti_allowance" onFill={(data) => { if (data.lease_ref !== undefined) setTiForm(f => ({ ...f, lease_ref: data.lease_ref as any })); if (data.property_name !== undefined) setTiForm(f => ({ ...f, property_name: data.property_name as any })); if (data.allowance_amount !== undefined) setTiForm(f => ({ ...f, allowance_amount: data.allowance_amount as any })); if (data.scope_of_work !== undefined) setTiForm(f => ({ ...f, scope_of_work: data.scope_of_work as any })); if (data.contractor !== undefined) setTiForm(f => ({ ...f, contractor: data.contractor as any })); if (data.completion_date !== undefined) setTiForm(f => ({ ...f, completion_date: data.completion_date as any })); }} /></div></DialogHeader>
            <div className="space-y-3">
              {[
                { label: "Lease Reference", placeholder: "e.g. VF-2024-001" },
                { label: "Property", placeholder: "Property name" },
                { label: "Lessor", placeholder: "Lessor name" },
                { label: "TI Agreed (AED)", placeholder: "e.g. 1200000" },
                { label: "Claim Deadline", placeholder: "YYYY-MM-DD" },
              ].map(f => (
                <div key={f.label}>
                  <Label className="text-xs font-medium">{f.label}</Label>
                  <Input className="mt-1" placeholder={f.placeholder} />
                </div>
              ))}
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setShowDialog(false)} className="flex-1">Cancel</Button>
                <Button className="flex-1 bg-[#e60000] hover:bg-[#cc0000] text-white" onClick={() => { toast.success("TI record added"); setShowDialog(false); }}>
                  Save
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
