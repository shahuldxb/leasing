import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Code2, Webhook, Key, Plus, Copy, RefreshCw, CheckCircle, XCircle, Trash2, Send } from "lucide-react";
import { toast } from "sonner";

const API_ENDPOINTS = [
  { method: "GET", path: "/api/v1/leases", description: "List all lease contracts with pagination", auth: "Bearer", params: "page, pageSize, status, entity" },
  { method: "GET", path: "/api/v1/leases/{id}", description: "Get single lease contract by ID", auth: "Bearer", params: "id (path)" },
  { method: "POST", path: "/api/v1/leases", description: "Create a new lease contract", auth: "Bearer", params: "JSON body" },
  { method: "PUT", path: "/api/v1/leases/{id}", description: "Update lease contract fields", auth: "Bearer", params: "id (path), JSON body" },
  { method: "GET", path: "/api/v1/invoices", description: "List payable invoices", auth: "Bearer", params: "page, pageSize, status, due_from, due_to" },
  { method: "GET", path: "/api/v1/journals", description: "List GL journal entries", auth: "Bearer", params: "period, entity, account" },
  { method: "GET", path: "/api/v1/amortisation/{lease_id}", description: "Get amortisation schedule for a lease", auth: "Bearer", params: "lease_id (path)" },
  { method: "GET", path: "/api/v1/critical-dates", description: "List upcoming critical dates", auth: "Bearer", params: "days_ahead, event_type" },
  { method: "POST", path: "/api/v1/terminations", description: "Initiate a lease termination request", auth: "Bearer", params: "JSON body" },
  { method: "GET", path: "/api/v1/reports/ifrs16-disclosure", description: "Generate IFRS 16 disclosure note", auth: "Bearer", params: "period, entity" },
];

const METHOD_COLORS: Record<string, string> = {
  GET: "bg-green-500/20 text-green-400 border-green-500/30",
  POST: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  PUT: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  DELETE: "bg-red-500/20 text-red-400 border-red-500/30",
  PATCH: "bg-purple-500/20 text-purple-400 border-purple-500/30",
};

const WEBHOOK_EVENTS = [
  "lease.created", "lease.modified", "lease.renewed", "lease.terminated",
  "invoice.created", "invoice.approved", "invoice.paid",
  "termination.initiated", "termination.approved", "termination.rejected",
  "critical_date.triggered", "journal.posted",
];

const SAMPLE_WEBHOOKS = [
  { id: 1, name: "ERP Integration — SAP", url: "https://erp.vodafone.ae/api/vodalease/webhook", events: ["lease.created", "invoice.paid", "journal.posted"], is_active: true, last_triggered: "2026-04-22 14:30", success_rate: "99.2%" },
  { id: 2, name: "Slack Alerts Channel", url: "https://hooks.slack.com/services/T00/B00/xxx", events: ["termination.initiated", "critical_date.triggered"], is_active: true, last_triggered: "2026-04-20 09:00", success_rate: "100%" },
  { id: 3, name: "Power BI Dataset Refresh", url: "https://api.powerbi.com/v1.0/myorg/datasets/xxx/refreshes", events: ["journal.posted", "invoice.approved"], is_active: false, last_triggered: "2026-04-15 18:00", success_rate: "87.5%" },
];

export default function APIWebhookConfig() {
  const [tab, setTab] = useState("api-docs");
  const [webhooks, setWebhooks] = useState(SAMPLE_WEBHOOKS);
  const [showWebhookDialog, setShowWebhookDialog] = useState(false);
  const [showKeyDialog, setShowKeyDialog] = useState(false);
  const [newWebhook, setNewWebhook] = useState({ name: "", url: "", events: [] as string[], secret: "" });
  const [apiKeys] = useState([
    { id: 1, name: "ERP Integration Key", prefix: "vl_live_sk_Xk7m...", created: "2026-01-15", last_used: "2026-04-22", status: "ACTIVE" },
    { id: 2, name: "Power BI Connector", prefix: "vl_live_sk_Rn2p...", created: "2026-02-01", last_used: "2026-04-15", status: "ACTIVE" },
    { id: 3, name: "Test Key", prefix: "vl_test_sk_Yz9q...", created: "2026-03-10", last_used: "2026-04-10", status: "ACTIVE" },
  ]);

  function toggleWebhook(id: number) {
    setWebhooks(prev => prev.map(w => w.id === id ? { ...w, is_active: !w.is_active } : w));
    toast.success("Webhook updated");
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">API & Webhook Configuration</h1>
            <p className="text-sm text-muted-foreground mt-1">REST API documentation, API key management, and outbound webhook event subscriptions</p>
          </div>
          <Badge className="text-sm px-3 py-1 bg-green-500/20 text-green-400 border border-green-500/30">API v1.0 Active</Badge>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "API Endpoints", value: API_ENDPOINTS.length, icon: Code2, color: "text-blue-400" },
            { label: "Active API Keys", value: apiKeys.filter(k => k.status === "ACTIVE").length, icon: Key, color: "text-green-400" },
            { label: "Active Webhooks", value: webhooks.filter(w => w.is_active).length, icon: Webhook, color: "text-purple-400" },
            { label: "Webhook Events (30d)", value: "1,247", icon: Send, color: "text-yellow-400" },
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

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="bg-muted/30">
            <TabsTrigger value="api-docs">API Reference</TabsTrigger>
            <TabsTrigger value="api-keys">API Keys</TabsTrigger>
            <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
            <TabsTrigger value="openapi">OpenAPI Spec</TabsTrigger>
          </TabsList>

          <TabsContent value="api-docs" className="mt-4">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-sm">REST API Endpoints — VodaLease Enterprise v1.0</CardTitle>
                <p className="text-xs text-muted-foreground">Base URL: <code className="bg-muted/30 px-1 rounded">https://vodalease-zs3ckgzv.manus.space/api/v1</code> — All requests require <code className="bg-muted/30 px-1 rounded">Authorization: Bearer &lt;api_key&gt;</code></p>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="text-xs w-20">Method</TableHead>
                      <TableHead className="text-xs">Endpoint</TableHead>
                      <TableHead className="text-xs">Description</TableHead>
                      <TableHead className="text-xs">Parameters</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {API_ENDPOINTS.map((ep, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <Badge className={`text-xs border font-mono ${METHOD_COLORS[ep.method]}`}>{ep.method}</Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{ep.path}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{ep.description}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{ep.params}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="api-keys" className="mt-4 space-y-4">
            <div className="flex justify-end">
              <Button className="bg-[#e60000] hover:bg-[#cc0000] text-white" onClick={() => setShowKeyDialog(true)}>
                <Plus className="w-4 h-4 mr-2" /> Generate API Key
              </Button>
            </div>
            <Card className="bg-card border-border">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="text-xs">Name</TableHead>
                      <TableHead className="text-xs">Key Prefix</TableHead>
                      <TableHead className="text-xs">Created</TableHead>
                      <TableHead className="text-xs">Last Used</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {apiKeys.map((key) => (
                      <TableRow key={key.id}>
                        <TableCell className="text-sm font-medium">{key.name}</TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">{key.prefix}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{key.created}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{key.last_used}</TableCell>
                        <TableCell><Badge className="text-xs bg-green-500/20 text-green-400 border border-green-500/30">{key.status}</Badge></TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => toast.info("Key rotation — coming soon")}>
                              <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => toast.success("Key revoked")}>
                              <Trash2 className="w-3.5 h-3.5 text-red-400" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="webhooks" className="mt-4 space-y-4">
            <div className="flex justify-end">
              <Button className="bg-[#e60000] hover:bg-[#cc0000] text-white" onClick={() => setShowWebhookDialog(true)}>
                <Plus className="w-4 h-4 mr-2" /> Add Webhook
              </Button>
            </div>
            <Card className="bg-card border-border">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="text-xs">Name</TableHead>
                      <TableHead className="text-xs">Endpoint URL</TableHead>
                      <TableHead className="text-xs">Events</TableHead>
                      <TableHead className="text-xs">Last Triggered</TableHead>
                      <TableHead className="text-xs">Success Rate</TableHead>
                      <TableHead className="text-xs">Active</TableHead>
                      <TableHead className="text-xs">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {webhooks.map((wh) => (
                      <TableRow key={wh.id}>
                        <TableCell className="text-sm font-medium">{wh.name}</TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground max-w-[180px] truncate">{wh.url}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {wh.events.slice(0, 2).map(e => (
                              <Badge key={e} className="text-xs bg-muted/30 text-muted-foreground border border-border">{e}</Badge>
                            ))}
                            {wh.events.length > 2 && <Badge className="text-xs bg-muted/30 text-muted-foreground border border-border">+{wh.events.length - 2}</Badge>}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{wh.last_triggered}</TableCell>
                        <TableCell>
                          <span className={`text-sm font-mono ${parseFloat(wh.success_rate) >= 95 ? "text-green-400" : "text-yellow-400"}`}>{wh.success_rate}</span>
                        </TableCell>
                        <TableCell><Switch checked={wh.is_active} onCheckedChange={() => toggleWebhook(wh.id)} /></TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="Send test event" onClick={() => toast.success(`Test event sent to ${wh.name}`)}>
                              <Send className="w-3.5 h-3.5 text-blue-400" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setWebhooks(prev => prev.filter(w => w.id !== wh.id))}>
                              <Trash2 className="w-3.5 h-3.5 text-red-400" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="openapi" className="mt-4">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-sm">OpenAPI 3.0 Specification</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted/20 rounded-lg p-4 text-xs font-mono overflow-auto max-h-96 border border-border">{`openapi: "3.0.3"
info:
  title: VodaLease Enterprise API
  version: "1.0.0"
  description: |
    REST API for VodaLease Enterprise — IFRS 16 Lease Accounting Platform.
    Provides programmatic access to leases, invoices, journals, and reports.
  contact:
    name: VodaLease Support
    email: support@vodafone.ae

servers:
  - url: https://vodalease-zs3ckgzv.manus.space/api/v1
    description: Production

security:
  - bearerAuth: []

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

paths:
  /leases:
    get:
      summary: List lease contracts
      parameters:
        - name: page
          in: query
          schema: { type: integer, default: 1 }
        - name: pageSize
          in: query
          schema: { type: integer, default: 50 }
        - name: status
          in: query
          schema: { type: string, enum: [ACTIVE, EXPIRED, TERMINATED] }
      responses:
        "200":
          description: Paginated list of leases
  /leases/{id}:
    get:
      summary: Get lease by ID
      parameters:
        - name: id
          in: path
          required: true
          schema: { type: integer }
      responses:
        "200":
          description: Lease contract object`}</pre>
                <Button variant="outline" className="mt-3" onClick={() => toast.info("OpenAPI YAML download — coming soon")}>
                  <Code2 className="w-4 h-4 mr-2" /> Download openapi.yaml
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Add Webhook Dialog */}
        <Dialog open={showWebhookDialog} onOpenChange={setShowWebhookDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Add Webhook Endpoint</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-xs font-medium">Webhook Name</Label>
                <Input className="mt-1" placeholder="ERP Integration, Slack Alerts..." value={newWebhook.name} onChange={e => setNewWebhook(w => ({ ...w, name: e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs font-medium">Endpoint URL *</Label>
                <Input className="mt-1" placeholder="https://your-system.com/webhook" value={newWebhook.url} onChange={e => setNewWebhook(w => ({ ...w, url: e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs font-medium">Signing Secret (optional)</Label>
                <Input type="password" className="mt-1" placeholder="Used to verify webhook payloads" value={newWebhook.secret} onChange={e => setNewWebhook(w => ({ ...w, secret: e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs font-medium mb-2 block">Events to Subscribe</Label>
                <div className="grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto">
                  {WEBHOOK_EVENTS.map(ev => (
                    <label key={ev} className="flex items-center gap-2 text-xs cursor-pointer">
                      <input type="checkbox" className="rounded"
                        checked={newWebhook.events.includes(ev)}
                        onChange={e => setNewWebhook(w => ({
                          ...w,
                          events: e.target.checked ? [...w.events, ev] : w.events.filter(x => x !== ev),
                        }))} />
                      <span className="font-mono">{ev}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setShowWebhookDialog(false)} className="flex-1">Cancel</Button>
                <Button className="flex-1 bg-[#e60000] hover:bg-[#cc0000] text-white"
                  disabled={!newWebhook.url}
                  onClick={() => {
                    setWebhooks(prev => [...prev, {
                      id: prev.length + 1, name: newWebhook.name || "Unnamed Webhook",
                      url: newWebhook.url, events: newWebhook.events,
                      is_active: true, last_triggered: "—", success_rate: "—",
                    }]);
                    toast.success("Webhook endpoint added");
                    setShowWebhookDialog(false);
                    setNewWebhook({ name: "", url: "", events: [], secret: "" });
                  }}>
                  Add Webhook
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Generate API Key Dialog */}
        <Dialog open={showKeyDialog} onOpenChange={setShowKeyDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Generate API Key</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-xs font-medium">Key Name / Description</Label>
                <Input className="mt-1" placeholder="ERP Integration, Power BI, Custom App..." />
              </div>
              <div>
                <Label className="text-xs font-medium">Permissions</Label>
                <Select>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select permission level..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="read">Read Only</SelectItem>
                    <SelectItem value="read_write">Read + Write</SelectItem>
                    <SelectItem value="full">Full Access</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400">
                The API key will only be shown once. Copy and store it securely.
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setShowKeyDialog(false)} className="flex-1">Cancel</Button>
                <Button className="flex-1 bg-[#e60000] hover:bg-[#cc0000] text-white"
                  onClick={() => {
                    const key = `vl_live_sk_${Math.random().toString(36).slice(2, 14)}`;
                    navigator.clipboard.writeText(key);
                    toast.success(`API key generated and copied: ${key.slice(0, 20)}...`);
                    setShowKeyDialog(false);
                  }}>
                  Generate & Copy Key
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
