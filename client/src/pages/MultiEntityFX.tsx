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
import { Plus, Globe, RefreshCw } from "lucide-react";
import { toast } from "sonner";

const fmt = (n: any, ccy = "AED") => n != null ? `${ccy} ${Number(n).toLocaleString()}` : "—";

export default function MultiEntityFX() {
  const [entityOpen, setEntityOpen] = useState(false);
  const [fxOpen, setFxOpen] = useState(false);
  const [entityForm, setEntityForm] = useState({ entity_code: "", entity_name: "", country: "AE", currency: "AED", functional_currency: "AED", is_consolidation_entity: false, parent_entity_id: undefined as number | undefined });
  const [fxForm, setFxForm] = useState({ contract_id: 0, from_currency: "USD", to_currency: "AED", exchange_rate: 0, translation_date: "", rou_asset_fc: 0, lease_liability_fc: 0 });

  const { data: entities = [], refetch: refetchEntities } = trpc.multiEntity.listEntities.useQuery();
  const { data: translations = [], refetch: refetchFx } = trpc.fxAccounting.list.useQuery();
  const { data: contractsData } = trpc.lease.getLeaseRegister.useQuery({ status: "Active" });
  const contracts = (contractsData as any)?.rows ?? [];

  const saveEntity = trpc.multiEntity.upsertEntity.useMutation({ onSuccess: () => { refetchEntities(); setEntityOpen(false); toast.success("Entity saved"); }, onError: (e: any) => toast.error(e.message) });
  const saveFx = trpc.fxAccounting.translate.useMutation({ onSuccess: () => { refetchFx(); setFxOpen(false); toast.success("FX translation recorded"); }, onError: (e: any) => toast.error(e.message) });

  const CURRENCIES = ["AED","USD","EUR","GBP","SAR","KWD","BHD","QAR","OMR","EGP"];

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Globe className="w-6 h-6 text-blue-500" />Multi-Entity & FX Accounting</h1>
          <p className="text-muted-foreground text-sm">Group entity structure, functional currencies, and foreign exchange translations</p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Legal Entities", value: (entities as any[]).length, color: "text-blue-600" },
            { label: "Consolidation Entities", value: (entities as any[]).filter((e: any) => e.is_consolidation_entity).length, color: "text-violet-600" },
            { label: "FX Translations", value: (translations as any[]).length, color: "text-amber-600" },
          ].map(k => <Card key={k.label}><CardContent className="pt-4"><p className="text-xs text-muted-foreground">{k.label}</p><p className={`text-2xl font-bold ${k.color}`}>{k.value}</p></CardContent></Card>)}
        </div>

        <Tabs defaultValue="entities">
          <TabsList>
            <TabsTrigger value="entities">Entity Structure ({(entities as any[]).length})</TabsTrigger>
            <TabsTrigger value="fx">FX Translations ({(translations as any[]).length})</TabsTrigger>
          </TabsList>

          <TabsContent value="entities">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Group Entity Structure</CardTitle>
                <Dialog open={entityOpen} onOpenChange={setEntityOpen}>
                  <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" />Add Entity</Button></DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Add Legal Entity</DialogTitle></DialogHeader>
                    <div className="space-y-3 mt-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div><Label>Entity Code</Label><Input value={entityForm.entity_code} onChange={e => setEntityForm(p => ({ ...p, entity_code: e.target.value }))} placeholder="VF-AE" /></div>
                        <div><Label>Entity Name</Label><Input value={entityForm.entity_name} onChange={e => setEntityForm(p => ({ ...p, entity_name: e.target.value }))} /></div>
                        <div><Label>Country</Label><Input value={entityForm.country} onChange={e => setEntityForm(p => ({ ...p, country: e.target.value }))} maxLength={2} /></div>
                        <div><Label>Functional Currency</Label>
                          <Select value={entityForm.functional_currency} onValueChange={v => setEntityForm(p => ({ ...p, functional_currency: v, currency: v }))}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>{CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" id="consol" checked={entityForm.is_consolidation_entity} onChange={e => setEntityForm(p => ({ ...p, is_consolidation_entity: e.target.checked }))} />
                        <Label htmlFor="consol">Consolidation Entity</Label>
                      </div>
                    </div>
                    <Button className="mt-4 w-full" onClick={() => saveEntity.mutate(entityForm)} disabled={saveEntity.isPending}>Save Entity</Button>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow><TableHead>Code</TableHead><TableHead>Entity Name</TableHead><TableHead>Country</TableHead><TableHead>Currency</TableHead><TableHead>Type</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {(entities as any[]).map((e: any) => (
                      <TableRow key={e.entity_id}>
                        <TableCell className="font-mono font-bold text-sm">{e.entity_code}</TableCell>
                        <TableCell className="font-medium">{e.entity_name}</TableCell>
                        <TableCell><Badge variant="outline" className="text-xs">{e.country}</Badge></TableCell>
                        <TableCell><Badge className="bg-blue-500 text-white text-xs">{e.functional_currency}</Badge></TableCell>
                        <TableCell>{e.is_consolidation_entity ? <Badge className="bg-violet-500 text-white text-xs">Consolidation</Badge> : <Badge variant="outline" className="text-xs">Subsidiary</Badge>}</TableCell>
                      </TableRow>
                    ))}
                    {(entities as any[]).length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-6 text-muted-foreground">No entities configured</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="fx">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2"><RefreshCw className="w-4 h-4" />FX Translation Records</CardTitle>
                <Dialog open={fxOpen} onOpenChange={setFxOpen}>
                  <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" />Record Translation</Button></DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>FX Translation</DialogTitle></DialogHeader>
                    <div className="space-y-3 mt-4">
                      <div><Label>Contract</Label>
                        <Select onValueChange={v => setFxForm(p => ({ ...p, contract_id: Number(v) }))}>
                          <SelectTrigger><SelectValue placeholder="Select contract" /></SelectTrigger>
                          <SelectContent>{contracts.map((c: any) => <SelectItem key={c.contract_id} value={String(c.contract_id)}>{c.contract_ref}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div><Label>From Currency</Label>
                          <Select value={fxForm.from_currency} onValueChange={v => setFxForm(p => ({ ...p, from_currency: v }))}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>{CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        <div><Label>To Currency</Label>
                          <Select value={fxForm.to_currency} onValueChange={v => setFxForm(p => ({ ...p, to_currency: v }))}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>{CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        <div><Label>Exchange Rate</Label><Input type="number" step="0.000001" value={fxForm.exchange_rate} onChange={e => setFxForm(p => ({ ...p, exchange_rate: Number(e.target.value) }))} /></div>
                        <div><Label>Translation Date</Label><Input type="date" value={fxForm.translation_date} onChange={e => setFxForm(p => ({ ...p, translation_date: e.target.value }))} /></div>
                        <div><Label>ROU Asset (FC)</Label><Input type="number" value={fxForm.rou_asset_fc} onChange={e => setFxForm(p => ({ ...p, rou_asset_fc: Number(e.target.value) }))} /></div>
                        <div><Label>Lease Liability (FC)</Label><Input type="number" value={fxForm.lease_liability_fc} onChange={e => setFxForm(p => ({ ...p, lease_liability_fc: Number(e.target.value) }))} /></div>
                      </div>
                    </div>
                    <Button className="mt-4 w-full" onClick={() => saveFx.mutate(fxForm)} disabled={saveFx.isPending}>Record Translation</Button>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow><TableHead>Contract</TableHead><TableHead>FX Pair</TableHead><TableHead className="text-right">Rate</TableHead><TableHead>Date</TableHead><TableHead className="text-right">ROU (FC)</TableHead><TableHead className="text-right">Liability (FC)</TableHead><TableHead className="text-right">ROU (LC)</TableHead><TableHead className="text-right">Liability (LC)</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {(translations as any[]).map((t: any) => (
                      <TableRow key={t.translation_id}>
                        <TableCell className="font-mono text-xs">{t.contract_ref}</TableCell>
                        <TableCell><Badge variant="outline" className="text-xs font-mono">{t.from_currency}/{t.to_currency}</Badge></TableCell>
                        <TableCell className="text-right font-mono text-sm">{Number(t.exchange_rate).toFixed(4)}</TableCell>
                        <TableCell className="text-sm">{t.translation_date?.slice(0,10)}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{fmt(t.rou_asset_fc, t.from_currency)}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{fmt(t.lease_liability_fc, t.from_currency)}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{fmt(t.rou_asset_lc, t.to_currency)}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{fmt(t.lease_liability_lc, t.to_currency)}</TableCell>
                      </TableRow>
                    ))}
                    {(translations as any[]).length === 0 && <TableRow><TableCell colSpan={8} className="text-center py-6 text-muted-foreground">No FX translations recorded</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
