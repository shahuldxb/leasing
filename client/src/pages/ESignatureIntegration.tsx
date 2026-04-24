import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileSignature, CheckCircle, Clock, XCircle, Send, Plus, Eye, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { ScreenHeader } from "@/components/ScreenHeader";

const ENVELOPES = [
  { id: 1, ref: "ENV-2026-001", document: "Lease Agreement — VF-2024-001", signatories: ["CEO (Vodafone)", "Legal Director (Al Futtaim)"], sent: "2026-04-18", completed: "2026-04-20", status: "COMPLETED", provider: "DocuSign" },
  { id: 2, ref: "ENV-2026-002", document: "Lease Renewal — VF-2023-041", signatories: ["CFO (Vodafone)", "Property Manager (TECOM)"], sent: "2026-04-22", completed: null, status: "PENDING_SIGNATURE", provider: "DocuSign" },
  { id: 3, ref: "ENV-2026-003", document: "Lease Modification — VF-2024-003", signatories: ["Legal Director (Vodafone)", "CEO (Al Futtaim)"], sent: "2026-04-23", completed: null, status: "SENT", provider: "DocuSign" },
  { id: 4, ref: "ENV-2025-018", document: "Termination Agreement — VF-2022-008", signatories: ["CFO (Vodafone)", "Property Director (Nakheel)"], sent: "2025-11-01", completed: null, status: "DECLINED", provider: "DocuSign" },
  { id: 5, ref: "ENV-2025-012", document: "Sub-Lease Agreement — SL-2025-003", signatories: ["Legal Director (Vodafone)", "Sub-Tenant Director"], sent: "2025-09-10", completed: "2025-09-14", status: "COMPLETED", provider: "Adobe Sign" },
];

const STATUS_COLORS: Record<string, string> = {
  COMPLETED: "bg-green-500/20 text-green-400 border-green-500/30",
  PENDING_SIGNATURE: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  SENT: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  DECLINED: "bg-red-500/20 text-red-400 border-red-500/30",
  VOIDED: "bg-muted/30 text-muted-foreground border-border",
};

const STATUS_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  COMPLETED: CheckCircle,
  PENDING_SIGNATURE: Clock,
  SENT: Send,
  DECLINED: XCircle,
};

const AUDIT_TRAIL = [
  { timestamp: "2026-04-20 14:32", event: "Document signed by Legal Director (Al Futtaim)", envelope: "ENV-2026-001", ip: "185.x.x.x", location: "Dubai, UAE" },
  { timestamp: "2026-04-20 11:15", event: "Document signed by CEO (Vodafone)", envelope: "ENV-2026-001", ip: "91.x.x.x", location: "Dubai, UAE" },
  { timestamp: "2026-04-18 09:00", event: "Envelope sent to signatories", envelope: "ENV-2026-001", ip: "System", location: "—" },
  { timestamp: "2026-04-23 10:30", event: "Envelope sent to signatories", envelope: "ENV-2026-003", ip: "System", location: "—" },
  { timestamp: "2026-04-22 16:00", event: "Envelope sent to signatories", envelope: "ENV-2026-002", ip: "System", location: "—" },
];

export default function ESignatureIntegration() {
  const [tab, setTab] = useState("envelopes");
  const [aiRows, setAiRows] = useState<Record<string, unknown>[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState({ document: "", provider: "DocuSign", signatories: "" });

  const completed = ENVELOPES.filter(e => e.status === "COMPLETED").length;
  const pending = ENVELOPES.filter(e => ["SENT", "PENDING_SIGNATURE"].includes(e.status)).length;

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <ScreenHeader
  screenId="VFLESIGN0001P001"
          screenType="esignature"
          onAIData={(rows) => setAiRows(rows)}
  title="E-Signature Integration"
  subtitle="DocuSign and e-signature workflow for lease documents"
/>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Completed Signatures", value: completed, icon: CheckCircle, color: "text-green-400" },
            { label: "Awaiting Signature", value: pending, icon: Clock, color: "text-yellow-400" },
            { label: "Declined / Voided", value: ENVELOPES.filter(e => e.status === "DECLINED").length, icon: XCircle, color: "text-red-400" },
            { label: "Total Envelopes", value: ENVELOPES.length, icon: FileSignature, color: "text-blue-400" },
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

        {pending > 0 && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
            <Clock className="w-5 h-5 text-yellow-400 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-yellow-400">{pending} Envelopes Awaiting Signature</p>
              <p className="text-xs text-muted-foreground">Reminder emails will be sent automatically after 48 hours of inactivity.</p>
            </div>
            <Button size="sm" variant="outline" className="text-xs border-yellow-500/30 text-yellow-400" onClick={() => toast.info("Reminder emails sent to all pending signatories")}>
              Send Reminders
            </Button>
          </div>
        )}

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="bg-muted/30">
            <TabsTrigger value="envelopes">Signature Envelopes</TabsTrigger>
            <TabsTrigger value="audit">Audit Trail</TabsTrigger>
            <TabsTrigger value="settings">Provider Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="envelopes" className="mt-4">
            <Card className="bg-card border-border">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="text-xs">Envelope Ref</TableHead>
                      <TableHead className="text-xs">Document</TableHead>
                      <TableHead className="text-xs">Signatories</TableHead>
                      <TableHead className="text-xs">Provider</TableHead>
                      <TableHead className="text-xs">Sent</TableHead>
                      <TableHead className="text-xs">Completed</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ENVELOPES.map((env) => {
                      const StatusIcon = STATUS_ICONS[env.status] || Clock;
                      return (
                        <TableRow key={env.id}>
                          <TableCell className="font-mono text-xs">{env.ref}</TableCell>
                          <TableCell className="text-sm max-w-[200px]">{env.document}</TableCell>
                          <TableCell>
                            <div className="space-y-0.5">
                              {env.signatories.map((s, i) => <p key={i} className="text-xs text-muted-foreground">{s}</p>)}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs">{env.provider}</TableCell>
                          <TableCell className="text-xs">{env.sent}</TableCell>
                          <TableCell className="text-xs">{env.completed || "—"}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <StatusIcon className={`w-3.5 h-3.5 ${STATUS_COLORS[env.status].includes("green") ? "text-green-400" : STATUS_COLORS[env.status].includes("yellow") ? "text-yellow-400" : STATUS_COLORS[env.status].includes("red") ? "text-red-400" : "text-blue-400"}`} />
                              <Badge className={`text-xs border ${STATUS_COLORS[env.status]}`}>{env.status.replace("_", " ")}</Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => toast.info(`Viewing ${env.ref}...`)}>
                                <Eye className="w-3 h-3" />
                              </Button>
                              {["SENT", "PENDING_SIGNATURE"].includes(env.status) && (
                                <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => toast.info(`Reminder sent for ${env.ref}`)}>
                                  <RefreshCw className="w-3 h-3" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audit" className="mt-4">
            <Card className="bg-card border-border">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="text-xs">Timestamp</TableHead>
                      <TableHead className="text-xs">Event</TableHead>
                      <TableHead className="text-xs">Envelope</TableHead>
                      <TableHead className="text-xs">IP Address</TableHead>
                      <TableHead className="text-xs">Location</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {AUDIT_TRAIL.map((entry, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-mono text-xs">{entry.timestamp}</TableCell>
                        <TableCell className="text-sm">{entry.event}</TableCell>
                        <TableCell className="font-mono text-xs">{entry.envelope}</TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">{entry.ip}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{entry.location}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { provider: "DocuSign", status: "CONNECTED", account: "vodafone-uae@docusign.net", plan: "Business Pro", features: ["eSignature", "Bulk Send", "Advanced Auth", "Audit Trail"] },
                { provider: "Adobe Sign", status: "CONNECTED", account: "contracts@vodafone.ae", plan: "Business", features: ["eSignature", "Web Forms", "Audit Trail"] },
              ].map((p) => (
                <Card key={p.provider} className="bg-card border-border">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">{p.provider}</CardTitle>
                      <Badge className="text-xs bg-green-500/20 text-green-400 border border-green-500/30">{p.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-muted-foreground">Account</span><span className="font-mono text-xs">{p.account}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Plan</span><span>{p.plan}</span></div>
                      <div>
                        <p className="text-muted-foreground mb-1">Features</p>
                        <div className="flex flex-wrap gap-1">
                          {p.features.map(f => <Badge key={f} className="text-xs bg-muted/30 text-muted-foreground border border-border">{f}</Badge>)}
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" className="mt-3 w-full text-xs" onClick={() => toast.info(`${p.provider} settings — opening configuration...`)}>
                      Configure
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Send Document for Signature</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label className="text-xs font-medium">Document</Label>
                <Input className="mt-1" placeholder="e.g. Lease Agreement — VF-2024-001" value={form.document} onChange={e => setForm(f => ({ ...f, document: e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs font-medium">E-Signature Provider</Label>
                <Select value={form.provider} onValueChange={v => setForm(f => ({ ...f, provider: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DocuSign">DocuSign</SelectItem>
                    <SelectItem value="Adobe Sign">Adobe Sign</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-medium">Signatories (comma-separated emails)</Label>
                <Input className="mt-1" placeholder="ceo@vodafone.ae, director@lessor.ae" value={form.signatories} onChange={e => setForm(f => ({ ...f, signatories: e.target.value }))} />
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setShowDialog(false)} className="flex-1">Cancel</Button>
                <Button className="flex-1 bg-[#e60000] hover:bg-[#cc0000] text-white"
                  disabled={!form.document || !form.signatories}
                  onClick={() => { toast.success("Document sent for signature via " + form.provider); setShowDialog(false); }}>
                  <Send className="w-4 h-4 mr-2" /> Send
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
