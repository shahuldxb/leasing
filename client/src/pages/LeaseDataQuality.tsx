import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, AlertTriangle, XCircle, BarChart3, Search, Plus, Shield } from "lucide-react";
import { toast } from "sonner";

const QUALITY_FIELDS = [
  "contract_ref", "lessor_name", "asset_description", "lease_start_date", "lease_end_date",
  "monthly_rent", "currency", "ibr_rate", "asset_category", "entity_code",
  "payment_frequency", "lease_type", "jurisdiction", "renewal_options", "break_clauses",
];

const SAMPLE_SCORES = [
  { contract_ref: "VF-2024-001", completeness: 95, missing: ["break_clauses"], duplicates: 0, errors: 0 },
  { contract_ref: "VF-2024-002", completeness: 80, missing: ["ibr_rate", "renewal_options", "jurisdiction"], duplicates: 0, errors: 1 },
  { contract_ref: "VF-2024-003", completeness: 100, missing: [], duplicates: 0, errors: 0 },
  { contract_ref: "VF-2023-015", completeness: 67, missing: ["ibr_rate", "break_clauses", "jurisdiction", "renewal_options", "payment_frequency"], duplicates: 1, errors: 2 },
  { contract_ref: "VF-2023-022", completeness: 87, missing: ["break_clauses", "jurisdiction"], duplicates: 0, errors: 0 },
];

const DUPLICATE_GROUPS = [
  {
    id: 1, confidence: 92, reason: "Same lessor + location + overlapping dates",
    leases: [
      { ref: "VF-2023-015", lessor: "Al Futtaim Properties", location: "Dubai Mall Office Tower, Floor 8", start: "2023-01-01", end: "2026-12-31" },
      { ref: "VF-2023-016", lessor: "Al Futtaim Properties", location: "Dubai Mall Office Tower, 8th Floor", start: "2023-02-01", end: "2026-12-31" },
    ],
  },
];

const VALIDATION_RULES = [
  { id: 1, name: "Lease End after Start", field: "lease_end_date", rule: "lease_end_date > lease_start_date", severity: "ERROR", is_active: true },
  { id: 2, name: "IBR within valid range", field: "ibr_rate", rule: "ibr_rate BETWEEN 0 AND 30", severity: "ERROR", is_active: true },
  { id: 3, name: "Monthly rent positive", field: "monthly_rent", rule: "monthly_rent > 0", severity: "ERROR", is_active: true },
  { id: 4, name: "Lease term max 50 years", field: "lease_end_date", rule: "DATEDIFF(year, lease_start_date, lease_end_date) <= 50", severity: "WARNING", is_active: true },
  { id: 5, name: "Short-term exemption check", field: "lease_end_date", rule: "DATEDIFF(month, lease_start_date, lease_end_date) > 12 OR lease_type = 'SHORT_TERM'", severity: "WARNING", is_active: true },
  { id: 6, name: "Low-value threshold", field: "monthly_rent", rule: "monthly_rent * 12 > 5000 OR asset_category = 'LOW_VALUE'", severity: "INFO", is_active: false },
];

const SEVERITY_COLORS: Record<string, string> = {
  ERROR: "bg-red-500/20 text-red-400 border-red-500/30",
  WARNING: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  INFO: "bg-blue-500/20 text-blue-400 border-blue-500/30",
};

export default function LeaseDataQuality() {
  const [tab, setTab] = useState("scores");
  const [rules, setRules] = useState(VALIDATION_RULES);
  const [showRuleDialog, setShowRuleDialog] = useState(false);
  const [ruleForm, setRuleForm] = useState({ name: "", field: "", rule: "", severity: "WARNING" });

  const avgScore = Math.round(SAMPLE_SCORES.reduce((s, x) => s + x.completeness, 0) / SAMPLE_SCORES.length);
  const totalDuplicates = SAMPLE_SCORES.reduce((s, x) => s + x.duplicates, 0);
  const totalErrors = SAMPLE_SCORES.reduce((s, x) => s + x.errors, 0);
  const perfect = SAMPLE_SCORES.filter(x => x.completeness === 100).length;

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Lease Data Quality</h1>
            <p className="text-sm text-muted-foreground mt-1">Abstraction completeness scoring, duplicate detection, and configurable validation rules engine</p>
          </div>
          <Button className="bg-[#e60000] hover:bg-[#cc0000] text-white" onClick={() => toast.info("Running full data quality scan...")}>
            <Search className="w-4 h-4 mr-2" /> Run Quality Scan
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Avg. Completeness", value: `${avgScore}%`, icon: BarChart3, color: avgScore >= 90 ? "text-green-400" : avgScore >= 75 ? "text-yellow-400" : "text-red-400" },
            { label: "100% Complete", value: perfect, icon: CheckCircle, color: "text-green-400" },
            { label: "Duplicate Groups", value: totalDuplicates, icon: AlertTriangle, color: "text-yellow-400" },
            { label: "Validation Errors", value: totalErrors, icon: XCircle, color: "text-red-400" },
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
            <TabsTrigger value="scores">Completeness Scores</TabsTrigger>
            <TabsTrigger value="duplicates">Duplicate Detection</TabsTrigger>
            <TabsTrigger value="rules">Validation Rules</TabsTrigger>
          </TabsList>

          <TabsContent value="scores" className="mt-4">
            <Card className="bg-card border-border">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="text-xs">Contract Ref</TableHead>
                      <TableHead className="text-xs">Completeness</TableHead>
                      <TableHead className="text-xs">Score Bar</TableHead>
                      <TableHead className="text-xs">Missing Fields</TableHead>
                      <TableHead className="text-xs">Duplicates</TableHead>
                      <TableHead className="text-xs">Errors</TableHead>
                      <TableHead className="text-xs">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {SAMPLE_SCORES.map((s) => (
                      <TableRow key={s.contract_ref}>
                        <TableCell className="font-mono text-sm">{s.contract_ref}</TableCell>
                        <TableCell>
                          <span className={`text-sm font-bold ${s.completeness === 100 ? "text-green-400" : s.completeness >= 80 ? "text-yellow-400" : "text-red-400"}`}>
                            {s.completeness}%
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="w-24 h-2 bg-muted/30 rounded overflow-hidden">
                            <div className={`h-full rounded ${s.completeness === 100 ? "bg-green-500" : s.completeness >= 80 ? "bg-yellow-500" : "bg-red-500"}`}
                              style={{ width: `${s.completeness}%` }} />
                          </div>
                        </TableCell>
                        <TableCell>
                          {s.missing.length === 0
                            ? <span className="text-xs text-green-400">None</span>
                            : <span className="text-xs text-muted-foreground">{s.missing.join(", ")}</span>}
                        </TableCell>
                        <TableCell>
                          {s.duplicates > 0
                            ? <Badge className="text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">{s.duplicates} found</Badge>
                            : <span className="text-xs text-green-400">None</span>}
                        </TableCell>
                        <TableCell>
                          {s.errors > 0
                            ? <Badge className="text-xs bg-red-500/20 text-red-400 border border-red-500/30">{s.errors} errors</Badge>
                            : <span className="text-xs text-green-400">None</span>}
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => toast.info(`Opening ${s.contract_ref} for editing...`)}>
                            Fix
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="duplicates" className="mt-4">
            {DUPLICATE_GROUPS.length === 0 ? (
              <Card className="bg-card border-border">
                <CardContent className="py-12 text-center">
                  <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                  <p className="text-sm font-medium">No duplicate leases detected</p>
                  <p className="text-xs text-muted-foreground mt-1">All leases have unique lessor + location + date combinations</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {DUPLICATE_GROUPS.map((group) => (
                  <Card key={group.id} className="bg-card border-border border-yellow-500/30">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-sm text-yellow-400">
                          <AlertTriangle className="w-4 h-4" /> Potential Duplicate Group #{group.id}
                        </CardTitle>
                        <Badge className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 text-xs">{group.confidence}% confidence</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{group.reason}</p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {group.leases.map((l) => (
                          <div key={l.ref} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/10">
                            <span className="font-mono text-sm font-semibold w-28">{l.ref}</span>
                            <span className="text-sm text-muted-foreground flex-1">{l.lessor} — {l.location}</span>
                            <span className="text-xs text-muted-foreground">{l.start} to {l.end}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2 mt-3">
                        <Button size="sm" variant="outline" className="text-xs" onClick={() => toast.info("Merge leases — requires manual review")}>Merge</Button>
                        <Button size="sm" variant="outline" className="text-xs" onClick={() => toast.success("Marked as not a duplicate")}>Not a Duplicate</Button>
                        <Button size="sm" variant="outline" className="text-xs text-red-400" onClick={() => toast.info("Archive duplicate — coming soon")}>Archive One</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="rules" className="mt-4 space-y-4">
            <div className="flex justify-end">
              <Button className="bg-[#e60000] hover:bg-[#cc0000] text-white" onClick={() => setShowRuleDialog(true)}>
                <Plus className="w-4 h-4 mr-2" /> Add Rule
              </Button>
            </div>
            <Card className="bg-card border-border">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="text-xs">Rule Name</TableHead>
                      <TableHead className="text-xs">Field</TableHead>
                      <TableHead className="text-xs">Condition</TableHead>
                      <TableHead className="text-xs">Severity</TableHead>
                      <TableHead className="text-xs">Active</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rules.map((rule) => (
                      <TableRow key={rule.id}>
                        <TableCell className="text-sm font-medium">{rule.name}</TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">{rule.field}</TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground max-w-[200px] truncate">{rule.rule}</TableCell>
                        <TableCell><Badge className={`text-xs border ${SEVERITY_COLORS[rule.severity]}`}>{rule.severity}</Badge></TableCell>
                        <TableCell>
                          <Switch checked={rule.is_active} onCheckedChange={v => {
                            setRules(prev => prev.map(r => r.id === rule.id ? { ...r, is_active: v } : r));
                            toast.success("Rule updated");
                          }} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={showRuleDialog} onOpenChange={setShowRuleDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Add Validation Rule</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-xs font-medium">Rule Name</Label>
                <Input className="mt-1" value={ruleForm.name} onChange={e => setRuleForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-medium">Field</Label>
                  <Select value={ruleForm.field} onValueChange={v => setRuleForm(f => ({ ...f, field: v }))}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select field..." /></SelectTrigger>
                    <SelectContent>
                      {QUALITY_FIELDS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-medium">Severity</Label>
                  <Select value={ruleForm.severity} onValueChange={v => setRuleForm(f => ({ ...f, severity: v }))}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ERROR">Error</SelectItem>
                      <SelectItem value="WARNING">Warning</SelectItem>
                      <SelectItem value="INFO">Info</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-xs font-medium">SQL Condition</Label>
                <Input className="mt-1 font-mono text-xs" placeholder="field > 0 AND field < 100" value={ruleForm.rule} onChange={e => setRuleForm(f => ({ ...f, rule: e.target.value }))} />
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setShowRuleDialog(false)} className="flex-1">Cancel</Button>
                <Button className="flex-1 bg-[#e60000] hover:bg-[#cc0000] text-white"
                  disabled={!ruleForm.name}
                  onClick={() => {
                    setRules(prev => [...prev, { id: prev.length + 1, ...ruleForm, is_active: true }]);
                    toast.success("Validation rule added");
                    setShowRuleDialog(false);
                  }}>
                  Add Rule
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
