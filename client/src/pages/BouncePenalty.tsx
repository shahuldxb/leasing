import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, CheckCircle, Edit, Plus, RefreshCw, XCircle } from "lucide-react";
import { toast } from "sonner";
import { ScreenHeader } from "@/components/ScreenHeader";
import SlidePanel from "@/components/SlidePanel";

export default function BouncePenalty() {
  const [cfgOpen, setCfgOpen] = useState(false);
  const [aiRecord, setAiRecord] = useState<Record<string, unknown> | null>(null);
  const [bounceOpen, setBounceOpen] = useState(false);
  const [editCfg, setEditCfg] = useState<any>(null);
  const [cfgForm, setCfgForm] = useState({ penalty_code: "", penalty_name: "", pct_rate: "", flat_amount: "", dr_gl_account: "", cr_gl_account: "", is_active: true });
  const [bounceForm, setBounceForm] = useState({ cheque_id: "", bounce_date: new Date().toISOString().slice(0, 10), bounce_reason: "", penalty_amount: "" });

  const { data: configs = [], refetch: refetchCfg } = trpc.bouncePenalty.listConfig.useQuery();
  const { data: events = [], refetch: refetchEvents } = trpc.bouncePenalty.listEvents.useQuery();
  const { data: chequesData } = trpc.cheque.getChequeRegister.useQuery({ pageNumber: 1, pageSize: 200, status: "ISSUED" });
  const cheques = (chequesData as any)?.rows ?? (chequesData as any) ?? [];

  const saveCfgMut = trpc.bouncePenalty.saveConfig.useMutation({
    onSuccess: () => { toast.success("Penalty configuration saved"); setCfgOpen(false); refetchCfg(); },
    onError: (e) => toast.error(e.message),
  });
  const recordBounceMut = trpc.bouncePenalty.recordBounce.useMutation({
    onSuccess: () => { toast.success("Bounce event recorded"); setBounceOpen(false); refetchEvents(); },
    onError: (e) => toast.error(e.message),
  });

  const openEdit = (cfg: any) => {
    setEditCfg(cfg);
    setCfgForm({
      penalty_code: cfg.penalty_code ?? "",
      penalty_name: cfg.penalty_name ?? "",
      pct_rate: cfg.pct_rate != null ? String(cfg.pct_rate) : "",
      flat_amount: cfg.flat_amount != null ? String(cfg.flat_amount) : "",
      dr_gl_account: cfg.dr_gl_account ?? "",
      cr_gl_account: cfg.cr_gl_account ?? "",
      is_active: cfg.is_active ?? true,
    });
    setCfgOpen(true);
  };

  const openNew = () => {
    setEditCfg(null);
    setCfgForm({ penalty_code: "", penalty_name: "", pct_rate: "", flat_amount: "", dr_gl_account: "", cr_gl_account: "", is_active: true });
    setCfgOpen(true);
  };

  const bounced = (events as any[]).length;
  const totalPenalty = (events as any[]).reduce((s: number, e: any) => s + (Number(e.penalty_amount) || 0), 0);
  const replaced = (events as any[]).filter((e: any) => e.replacement_cheque_id).length;

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <ScreenHeader
  screenId="VFLBNCPEN0001P001"
  title="Bounce Penalty Register"
  subtitle="Penalty calculation and recovery for bounced cheques"

          screenType="bounce_penalty"
          onAIData={(rows) => setAiRecord(rows[0] ?? null)}
        />

        {/* KPIs */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total Bounced Cheques", value: bounced, icon: XCircle, color: "text-red-400" },
            { label: "Replaced", value: replaced, icon: RefreshCw, color: "text-blue-400" },
            { label: "Total Penalties (AED)", value: totalPenalty.toLocaleString(), icon: AlertCircle, color: "text-orange-400" },
          ].map((k) => (
            <Card key={k.label} className="bg-card border-border">
              <CardContent className="p-4 flex items-center gap-3">
                <k.icon className={`w-8 h-8 ${k.color}`} />
                <div>
                  <p className="text-2xl font-bold">{k.value}</p>
                  <p className="text-xs text-muted-foreground">{k.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="events">
          <TabsList>
            <TabsTrigger value="events">Bounce Events</TabsTrigger>
            <TabsTrigger value="config">Penalty Configuration</TabsTrigger>
          </TabsList>

          <TabsContent value="events">
            <Card className="bg-card border-border">
              <CardHeader><CardTitle className="flex items-center gap-2"><AlertCircle className="w-5 h-5 text-red-400" /> Bounce Register</CardTitle></CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="text-xs">Cheque No.</TableHead>
                      <TableHead className="text-xs">Lessor</TableHead>
                      <TableHead className="text-xs">Cheque Amount</TableHead>
                      <TableHead className="text-xs">Bounce Date</TableHead>
                      <TableHead className="text-xs">Reason</TableHead>
                      <TableHead className="text-xs">Penalty (AED)</TableHead>
                      <TableHead className="text-xs">Replacement</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(events as any[]).length === 0 && (
                      <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No bounce events recorded</TableCell></TableRow>
                    )}
                    {(events as any[]).map((e: any) => (
                      <TableRow key={e.event_id}>
                        <TableCell className="font-mono text-sm">{e.cheque_number}</TableCell>
                        <TableCell className="text-sm">{e.lessor_name ?? "—"}</TableCell>
                        <TableCell className="font-mono text-sm">{Number(e.cheque_amount).toLocaleString()}</TableCell>
                        <TableCell className="text-sm">{e.bounce_date ? new Date(e.bounce_date).toLocaleDateString() : "—"}</TableCell>
                        <TableCell className="text-sm max-w-[160px] truncate">{e.bounce_reason}</TableCell>
                        <TableCell className="font-mono text-sm text-red-400">{e.penalty_amount ? Number(e.penalty_amount).toLocaleString() : "—"}</TableCell>
                        <TableCell>
                          {e.replacement_cheque_id
                            ? <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs border"><CheckCircle className="w-3 h-3 mr-1" />Replaced</Badge>
                            : <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs border">Pending</Badge>}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="config">
            <Card className="bg-card border-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2"><Edit className="w-5 h-5 text-orange-400" /> Penalty Rules</CardTitle>
                  <Button size="sm" variant="outline" onClick={openNew}><Plus className="w-4 h-4 mr-1" /> Add Rule</Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="text-xs">Code</TableHead>
                      <TableHead className="text-xs">Name</TableHead>
                      <TableHead className="text-xs">Flat Amount (AED)</TableHead>
                      <TableHead className="text-xs">% Rate</TableHead>
                      <TableHead className="text-xs">DR Account</TableHead>
                      <TableHead className="text-xs">CR Account</TableHead>
                      <TableHead className="text-xs">Active</TableHead>
                      <TableHead className="text-xs">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(configs as any[]).length === 0 && (
                      <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No penalty rules configured</TableCell></TableRow>
                    )}
                    {(configs as any[]).map((c: any) => (
                      <TableRow key={c.config_id}>
                        <TableCell className="font-mono text-sm font-medium">{c.penalty_code}</TableCell>
                        <TableCell className="text-sm">{c.penalty_name}</TableCell>
                        <TableCell className="font-mono text-sm">{c.flat_amount != null ? Number(c.flat_amount).toLocaleString() : "—"}</TableCell>
                        <TableCell className="font-mono text-sm">{c.pct_rate != null ? `${c.pct_rate}%` : "—"}</TableCell>
                        <TableCell className="font-mono text-xs">{c.dr_gl_account ?? "—"}</TableCell>
                        <TableCell className="font-mono text-xs">{c.cr_gl_account ?? "—"}</TableCell>
                        <TableCell>
                          {c.is_active
                            ? <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs border">Active</Badge>
                            : <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30 text-xs border">Inactive</Badge>}
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => openEdit(c)}>
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Config Dialog */}
        <SlidePanel open={cfgOpen} onClose={() => setCfgOpen(false)} title="" width="xl">
          
            
              
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-medium">Penalty Code *</Label>
                  <Input className="mt-1" placeholder="BANK_CHG" value={cfgForm.penalty_code}
                    onChange={e => setCfgForm(f => ({ ...f, penalty_code: e.target.value }))} disabled={!!editCfg} />
                </div>
                <div>
                  <Label className="text-xs font-medium">Penalty Name *</Label>
                  <Input className="mt-1" placeholder="Bank Return Charge" value={cfgForm.penalty_name}
                    onChange={e => setCfgForm(f => ({ ...f, penalty_name: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-medium">Flat Amount (AED)</Label>
                  <Input type="number" className="mt-1" placeholder="500" value={cfgForm.flat_amount}
                    onChange={e => setCfgForm(f => ({ ...f, flat_amount: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs font-medium">% Rate</Label>
                  <Input type="number" className="mt-1" placeholder="2.5" value={cfgForm.pct_rate}
                    onChange={e => setCfgForm(f => ({ ...f, pct_rate: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-medium">DR GL Account</Label>
                  <Input className="mt-1" placeholder="6100-001" value={cfgForm.dr_gl_account}
                    onChange={e => setCfgForm(f => ({ ...f, dr_gl_account: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs font-medium">CR GL Account</Label>
                  <Input className="mt-1" placeholder="2100-001" value={cfgForm.cr_gl_account}
                    onChange={e => setCfgForm(f => ({ ...f, cr_gl_account: e.target.value }))} />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={cfgForm.is_active} onCheckedChange={v => setCfgForm(f => ({ ...f, is_active: v }))} />
                <Label className="text-sm">Active</Label>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setCfgOpen(false)} className="flex-1">Cancel</Button>
              <Button className="flex-1 bg-[#e60000] hover:bg-[#cc0000] text-white"
                disabled={!cfgForm.penalty_code || !cfgForm.penalty_name || saveCfgMut.isPending}
                onClick={() => saveCfgMut.mutate({
                  config_id: editCfg?.config_id,
                  penalty_code: cfgForm.penalty_code,
                  penalty_name: cfgForm.penalty_name,
                  pct_rate: cfgForm.pct_rate ? Number(cfgForm.pct_rate) : undefined,
                  flat_amount: cfgForm.flat_amount ? Number(cfgForm.flat_amount) : undefined,
                  dr_gl_account: cfgForm.dr_gl_account || undefined,
                  cr_gl_account: cfgForm.cr_gl_account || undefined,
                  is_active: cfgForm.is_active,
                })}>
                {saveCfgMut.isPending ? "Saving..." : "Save Rule"}
              </Button>
            </div>
          
        </SlidePanel>

        {/* Record Bounce Dialog */}
        <SlidePanel open={bounceOpen} onClose={() => setBounceOpen(false)} title="" width="xl">
          
            
              
            
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Cheque *</Label>
                <select className="w-full mt-1 rounded-md border border-border bg-background px-3 py-2 text-sm"
                  value={bounceForm.cheque_id} onChange={e => setBounceForm(f => ({ ...f, cheque_id: e.target.value }))}>
                  <option value="">Select cheque...</option>
                  {(cheques as any[]).map((c: any) => (
                    <option key={c.cheque_id} value={c.cheque_id}>
                      #{c.cheque_number} — AED {Number(c.amount).toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-sm font-medium">Bounce Date *</Label>
                <Input type="date" className="mt-1" value={bounceForm.bounce_date}
                  onChange={e => setBounceForm(f => ({ ...f, bounce_date: e.target.value }))} />
              </div>
              <div>
                <Label className="text-sm font-medium">Reason *</Label>
                <Input className="mt-1" placeholder="Insufficient funds, Account closed..." value={bounceForm.bounce_reason}
                  onChange={e => setBounceForm(f => ({ ...f, bounce_reason: e.target.value }))} />
              </div>
              <div>
                <Label className="text-sm font-medium">Penalty Amount (AED)</Label>
                <Input type="number" className="mt-1" placeholder="500" value={bounceForm.penalty_amount}
                  onChange={e => setBounceForm(f => ({ ...f, penalty_amount: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setBounceOpen(false)} className="flex-1">Cancel</Button>
              <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                disabled={!bounceForm.cheque_id || !bounceForm.bounce_reason || recordBounceMut.isPending}
                onClick={() => recordBounceMut.mutate({
                  cheque_id: Number(bounceForm.cheque_id),
                  bounce_date: bounceForm.bounce_date,
                  bounce_reason: bounceForm.bounce_reason,
                  penalty_amount: bounceForm.penalty_amount ? Number(bounceForm.penalty_amount) : undefined,
                })}>
                {recordBounceMut.isPending ? "Recording..." : "Record Bounce"}
              </Button>
            </div>
          
        </SlidePanel>
      </div>
    </DashboardLayout>
  );
}
