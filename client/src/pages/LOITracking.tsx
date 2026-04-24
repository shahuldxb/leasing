import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Clock, CheckCircle, XCircle, Plus, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { ScreenHeader } from "@/components/ScreenHeader";

const LOIS = [
  { id: 1, ref: "LOI-2026-001", property: "DIFC Gate Village — Unit 12", lessor: "DIFC Authority", area_sqm: 1850, rent_pa: 2775000, broker: "JLL UAE", submitted: "2026-04-01", expiry: "2026-04-30", status: "UNDER_NEGOTIATION", notes: "Counter-offer received — 5% above asking" },
  { id: 2, ref: "LOI-2026-002", property: "One Central — Tower A", lessor: "DWTC", area_sqm: 2400, rent_pa: 3600000, broker: "CBRE Middle East", submitted: "2026-03-20", expiry: "2026-04-25", status: "ACCEPTED", notes: "LOI accepted, progressing to formal lease" },
  { id: 3, ref: "LOI-2026-003", property: "Jumeirah Bay X3 — Floor 8", lessor: "Meraas", area_sqm: 1200, rent_pa: 1800000, broker: "Savills UAE", submitted: "2026-04-10", expiry: "2026-05-10", status: "SUBMITTED", notes: "Awaiting lessor response" },
  { id: 4, ref: "LOI-2025-018", property: "Dubai Hills Business Park", lessor: "Emaar Properties", area_sqm: 3100, rent_pa: 3875000, broker: "JLL UAE", submitted: "2025-11-01", expiry: "2025-11-30", status: "EXPIRED", notes: "LOI expired — lessor withdrew" },
  { id: 5, ref: "LOI-2025-012", property: "Abu Dhabi Global Market Square", lessor: "ADGM", area_sqm: 950, rent_pa: 1425000, broker: "Knight Frank", submitted: "2025-09-15", expiry: "2025-10-15", status: "CONVERTED", notes: "Converted to lease VF-2025-042" },
];

const STATUS_COLORS: Record<string, string> = {
  SUBMITTED: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  UNDER_NEGOTIATION: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  ACCEPTED: "bg-green-500/20 text-green-400 border-green-500/30",
  EXPIRED: "bg-red-500/20 text-red-400 border-red-500/30",
  CONVERTED: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  WITHDRAWN: "bg-muted/30 text-muted-foreground border-border",
};

const STATUS_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  SUBMITTED: Clock,
  UNDER_NEGOTIATION: Clock,
  ACCEPTED: CheckCircle,
  EXPIRED: XCircle,
  CONVERTED: CheckCircle,
};

export default function LOITracking() {
  const [lois, setLois] = useState(LOIS);
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState({ property: "", lessor: "", area_sqm: "", rent_pa: "", broker: "", expiry: "", notes: "" });

  const active = lois.filter(l => ["SUBMITTED", "UNDER_NEGOTIATION", "ACCEPTED"].includes(l.status)).length;
  const converted = lois.filter(l => l.status === "CONVERTED").length;
  const conversionRate = Math.round((converted / lois.length) * 100);

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <ScreenHeader
  screenId="VFLLOI0001P001"
  title="LOI Tracking"
  subtitle="Letter of Intent tracking for pre-contract stage"
/>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Active LOIs", value: active, icon: FileText, color: "text-blue-400" },
            { label: "Converted to Lease", value: converted, icon: CheckCircle, color: "text-green-400" },
            { label: "Conversion Rate", value: `${conversionRate}%`, icon: ArrowRight, color: "text-purple-400" },
            { label: "Expiring This Week", value: lois.filter(l => l.status !== "EXPIRED" && l.status !== "CONVERTED" && new Date(l.expiry) <= new Date(Date.now() + 7 * 86400000)).length, icon: Clock, color: "text-orange-400" },
          ].map((kpi) => (
            <Card key={kpi.label} className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <kpi.icon className={`w-8 h-8 ${kpi.color}`} />
                  <div>
                    <p className="text-2xl font-bold">{kpi.value}</p>
                    <p className="text-xs text-muted-foreground">{kpi.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Pipeline visual */}
        <Card className="bg-card border-border">
          <CardHeader><CardTitle className="text-sm">LOI Pipeline</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {[
                { stage: "Submitted", count: lois.filter(l => l.status === "SUBMITTED").length, color: "bg-blue-500/20 border-blue-500/30 text-blue-400" },
                { stage: "Negotiating", count: lois.filter(l => l.status === "UNDER_NEGOTIATION").length, color: "bg-yellow-500/20 border-yellow-500/30 text-yellow-400" },
                { stage: "Accepted", count: lois.filter(l => l.status === "ACCEPTED").length, color: "bg-green-500/20 border-green-500/30 text-green-400" },
                { stage: "Converted", count: lois.filter(l => l.status === "CONVERTED").length, color: "bg-purple-500/20 border-purple-500/30 text-purple-400" },
                { stage: "Expired/Withdrawn", count: lois.filter(l => l.status === "EXPIRED" || l.status === "WITHDRAWN").length, color: "bg-red-500/20 border-red-500/30 text-red-400" },
              ].map((stage, i, arr) => (
                <div key={stage.stage} className="flex items-center gap-2 shrink-0">
                  <div className={`px-4 py-3 rounded-lg border text-center min-w-[100px] ${stage.color}`}>
                    <p className="text-2xl font-bold">{stage.count}</p>
                    <p className="text-xs">{stage.stage}</p>
                  </div>
                  {i < arr.length - 1 && <ArrowRight className="w-4 h-4 text-muted-foreground" />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-xs">LOI Ref</TableHead>
                  <TableHead className="text-xs">Property</TableHead>
                  <TableHead className="text-xs">Lessor</TableHead>
                  <TableHead className="text-xs text-right">Area (sqm)</TableHead>
                  <TableHead className="text-xs text-right">Annual Rent</TableHead>
                  <TableHead className="text-xs">Broker</TableHead>
                  <TableHead className="text-xs">Expiry</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lois.map((loi) => {
                  const StatusIcon = STATUS_ICONS[loi.status] || Clock;
                  return (
                    <TableRow key={loi.id}>
                      <TableCell className="font-mono text-xs">{loi.ref}</TableCell>
                      <TableCell className="text-sm">{loi.property}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{loi.lessor}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{loi.area_sqm.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{(loi.rent_pa / 1000000).toFixed(2)}M</TableCell>
                      <TableCell className="text-xs">{loi.broker}</TableCell>
                      <TableCell className="text-xs">{loi.expiry}</TableCell>
                      <TableCell><Badge className={`text-xs border ${STATUS_COLORS[loi.status]}`}>{loi.status.replace("_", " ")}</Badge></TableCell>
                      <TableCell>
                        {loi.status === "ACCEPTED" && (
                          <Button size="sm" className="h-7 px-2 text-xs bg-[#e60000] hover:bg-[#cc0000] text-white"
                            onClick={() => { toast.success(`LOI ${loi.ref} converted to lease`); setLois(prev => prev.map(l => l.id === loi.id ? { ...l, status: "CONVERTED" } : l)); }}>
                            Convert to Lease
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>New Letter of Intent</DialogTitle></DialogHeader>
            <div className="space-y-3">
              {[
                { key: "property", label: "Property / Address", placeholder: "e.g. DIFC Gate Village Unit 12" },
                { key: "lessor", label: "Lessor / Landlord", placeholder: "e.g. DIFC Authority" },
                { key: "area_sqm", label: "Area (sqm)", placeholder: "e.g. 1850" },
                { key: "rent_pa", label: "Annual Rent (AED)", placeholder: "e.g. 2775000" },
                { key: "broker", label: "Broker", placeholder: "e.g. JLL UAE" },
                { key: "expiry", label: "LOI Expiry Date", placeholder: "YYYY-MM-DD" },
              ].map(f => (
                <div key={f.key}>
                  <Label className="text-xs font-medium">{f.label}</Label>
                  <Input className="mt-1" placeholder={f.placeholder} value={(form as Record<string, string>)[f.key]} onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))} />
                </div>
              ))}
              <div>
                <Label className="text-xs font-medium">Notes</Label>
                <Textarea className="mt-1 resize-none" rows={2} value={form.notes} onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))} />
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setShowDialog(false)} className="flex-1">Cancel</Button>
                <Button className="flex-1 bg-[#e60000] hover:bg-[#cc0000] text-white"
                  disabled={!form.property}
                  onClick={() => {
                    setLois(prev => [...prev, {
                      id: prev.length + 1, ref: `LOI-2026-00${prev.length + 1}`,
                      property: form.property, lessor: form.lessor, area_sqm: Number(form.area_sqm) || 0,
                      rent_pa: Number(form.rent_pa) || 0, broker: form.broker,
                      submitted: new Date().toISOString().split("T")[0], expiry: form.expiry,
                      status: "SUBMITTED", notes: form.notes,
                    }]);
                    toast.success("LOI submitted");
                    setShowDialog(false);
                  }}>
                  Submit LOI
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
