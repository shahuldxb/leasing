import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Zap, PlusCircle } from "lucide-react";
import { toast } from "sonner";

export default function BankRules() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ ruleName: "", matchField: "description", matchOperator: "contains", matchValue: "", glAccount: "", priority: "1" });

  const { data: rulesData, refetch } = trpc.bankRecon.getRules.useQuery();
  const upsertMutation = trpc.bankRecon.upsertRule.useMutation({
    onSuccess: () => { toast.success("Rule saved"); setOpen(false); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const rows: any[] = Array.isArray(rulesData) ? rulesData : (rulesData as any)?.rules ?? [];

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><Zap className="w-6 h-6 text-[#e60000]" /> Auto-Matching Rules</h1>
            <p className="text-sm text-muted-foreground mt-1">Screen ID: VFBNKRULE0001P001 · Configure rules for automatic transaction matching</p>
          </div>
          <Button className="bg-[#e60000] hover:bg-[#cc0000] text-white" onClick={() => setOpen(true)}>
            <PlusCircle className="w-4 h-4 mr-2" /> Add Rule
          </Button>
        </div>

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-xs">Rule Name</TableHead>
                <TableHead className="text-xs">Match Field</TableHead>
                <TableHead className="text-xs">Operator</TableHead>
                <TableHead className="text-xs">Match Value</TableHead>
                <TableHead className="text-xs">GL Account</TableHead>
                <TableHead className="text-xs">Priority</TableHead>
                <TableHead className="text-xs">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r: any) => (
                <TableRow key={r.rule_id} className="text-sm hover:bg-muted/30">
                  <TableCell className="font-medium">{r.rule_name}</TableCell>
                  <TableCell>{r.match_field}</TableCell>
                  <TableCell>{r.match_operator}</TableCell>
                  <TableCell className="font-mono text-xs">{r.match_value}</TableCell>
                  <TableCell className="font-mono text-xs">{r.gl_account ?? "—"}</TableCell>
                  <TableCell>{r.priority}</TableCell>
                  <TableCell><Badge className={r.is_active ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-muted text-muted-foreground"}>{r.is_active ? "Active" : "Inactive"}</Badge></TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No matching rules configured</TableCell></TableRow>}
            </TableBody>
          </Table>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Add Matching Rule</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label className="text-sm font-medium">Rule Name *</Label><Input className="mt-1" value={form.ruleName} onChange={e => setForm(f => ({ ...f, ruleName: e.target.value }))} /></div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-sm font-medium">Match Field</Label>
                  <Select value={form.matchField} onValueChange={v => setForm(f => ({ ...f, matchField: v }))}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>{["description","reference","amount","counterparty"].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium">Operator</Label>
                  <Select value={form.matchOperator} onValueChange={v => setForm(f => ({ ...f, matchOperator: v }))}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>{["contains","equals","starts_with","ends_with","regex"].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label className="text-sm font-medium">Value *</Label><Input className="mt-1" value={form.matchValue} onChange={e => setForm(f => ({ ...f, matchValue: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-sm font-medium">GL Account</Label><Input className="mt-1" placeholder="e.g. 2110" value={form.glAccount} onChange={e => setForm(f => ({ ...f, glAccount: e.target.value }))} /></div>
                <div><Label className="text-sm font-medium">Priority</Label><Input type="number" className="mt-1" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))} /></div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button className="bg-[#e60000] hover:bg-[#cc0000] text-white"
                onClick={() => upsertMutation.mutate({ ruleName: form.ruleName, ruleType: 'RefMatch', priority: Number(form.priority), refPattern: form.matchValue, description: `${form.matchField} ${form.matchOperator} ${form.matchValue}` })}
                disabled={upsertMutation.isPending}>Save Rule</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
