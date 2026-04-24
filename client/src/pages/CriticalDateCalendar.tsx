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
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Bell, AlertTriangle, CheckCircle, Plus, Clock } from "lucide-react";
import { toast } from "sonner";
import { ScreenHeader } from "@/components/ScreenHeader";
import { GenAIFillButton } from "@/components/GenAIFillButton";
import SlidePanel from "@/components/SlidePanel";

const URGENCY_COLORS: Record<string, string> = {
  OVERDUE: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  CRITICAL: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  WARNING: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  UPCOMING: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  FUTURE: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
};

const EVENT_TYPES = ["EXPIRY", "RENEWAL_OPTION", "BREAK_OPTION", "RENT_REVIEW", "RENT_ESCALATION", "INSURANCE_RENEWAL", "INSPECTION", "NOTICE_DEADLINE", "PAYMENT_DUE", "REMEASUREMENT"];

export default function CriticalDateCalendar() {
  const [showForm, setShowForm] = useState(false);
  const [aiRecord, setAiRecord] = useState<Record<string, unknown> | null>(null);
  const [filter, setFilter] = useState({ urgency: "", type: "", search: "" });
  const [form, setForm] = useState({ contract_id: 0, event_type: "EXPIRY", event_date: "", notice_days_required: 30, description: "", action_required: "" });

  const { data: events = [], refetch } = trpc.criticalDates.list.useQuery({ daysAhead: 365 });
  const { data: contractsData } = trpc.lease.getLeaseRegister.useQuery({ status: "Active" });
  const contracts = contractsData?.rows ?? [];

  const create = trpc.criticalDates.create.useMutation({
    onSuccess: () => { refetch(); setShowForm(false); toast.success("Critical date added"); },
  });
  const dismiss = trpc.criticalDates.dismiss.useMutation({
    onSuccess: () => { refetch(); toast.success("Date dismissed"); },
  });

  const filtered = (events as any[]).filter((e: any) => {
    if (filter.urgency && e.urgency !== filter.urgency) return false;
    if (filter.type && e.event_type !== filter.type) return false;
    if (filter.search && !`${e.contract_ref} ${e.asset_description} ${e.description}`.toLowerCase().includes(filter.search.toLowerCase())) return false;
    return true;
  });

  const overdue = (events as any[]).filter((e: any) => e.urgency === "OVERDUE").length;
  const critical = (events as any[]).filter((e: any) => e.urgency === "CRITICAL").length;
  const warning = (events as any[]).filter((e: any) => e.urgency === "WARNING").length;

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <ScreenHeader
  screenId="VFLCRTCAL0001P001"
  title="Critical Date Calendar"
  subtitle="Expiry, renewal, and review date calendar"

          screenType="critical_date_calendar"
          onAIData={(rows) => setAiRecord(rows[0] ?? null)}
        />

        {/* Urgency summary */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Overdue", count: overdue, icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50 dark:bg-red-950/20", urgency: "OVERDUE" },
            { label: "Critical (≤30d)", count: critical, icon: Bell, color: "text-orange-600", bg: "bg-orange-50 dark:bg-orange-950/20", urgency: "CRITICAL" },
            { label: "Warning (≤90d)", count: warning, icon: Clock, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/20", urgency: "WARNING" },
            { label: "Total Events", count: (events as any[]).length, icon: Calendar, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/20", urgency: "" },
          ].map(s => (
            <Card key={s.label} className={`cursor-pointer ${s.bg}`} onClick={() => setFilter(f => ({ ...f, urgency: f.urgency === s.urgency ? "" : s.urgency }))}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{s.label}</p>
                    <p className={`text-3xl font-bold ${s.color}`}>{s.count}</p>
                  </div>
                  <s.icon className={`w-8 h-8 ${s.color} opacity-60`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-4 flex gap-4 items-end">
            <div className="flex-1 space-y-1">
              <Label>Search</Label>
              <Input placeholder="Contract, asset, description..." value={filter.search} onChange={e => setFilter(f => ({ ...f, search: e.target.value }))} />
            </div>
            <div className="space-y-1 w-40">
              <Label>Urgency</Label>
              <Select value={filter.urgency || "all"} onValueChange={v => setFilter(f => ({ ...f, urgency: v === "all" ? "" : v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="OVERDUE">Overdue</SelectItem>
                  <SelectItem value="CRITICAL">Critical</SelectItem>
                  <SelectItem value="WARNING">Warning</SelectItem>
                  <SelectItem value="UPCOMING">Upcoming</SelectItem>
                  <SelectItem value="FUTURE">Future</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 w-48">
              <Label>Event Type</Label>
              <Select value={filter.type || "all"} onValueChange={v => setFilter(f => ({ ...f, type: v === "all" ? "" : v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {EVENT_TYPES.map(t => <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={() => setFilter({ urgency: "", type: "", search: "" })}>Clear</Button>
          </CardContent>
        </Card>

        {/* Events table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              Upcoming Events
              <Badge variant="outline">{filtered.length} events</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event Date</TableHead>
                  <TableHead>Days</TableHead>
                  <TableHead>Contract</TableHead>
                  <TableHead>Asset</TableHead>
                  <TableHead>Event Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Action Required</TableHead>
                  <TableHead>Urgency</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((e: any) => (
                  <TableRow key={e.date_id} className={e.urgency === "OVERDUE" ? "bg-red-50/50 dark:bg-red-950/10" : ""}>
                    <TableCell className="font-mono text-sm font-bold">{e.event_date?.slice(0, 10)}</TableCell>
                    <TableCell>
                      <span className={`text-sm font-bold ${e.days_until < 0 ? "text-red-600" : e.days_until <= 30 ? "text-orange-600" : e.days_until <= 90 ? "text-amber-600" : "text-muted-foreground"}`}>
                        {e.days_until < 0 ? `${Math.abs(e.days_until)}d ago` : `${e.days_until}d`}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{e.contract_ref}</TableCell>
                    <TableCell className="max-w-[120px] truncate text-sm">{e.asset_description}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{e.event_type?.replace(/_/g, " ")}</Badge></TableCell>
                    <TableCell className="max-w-[160px] truncate text-sm">{e.description}</TableCell>
                    <TableCell className="max-w-[160px] truncate text-sm text-muted-foreground">{e.action_required}</TableCell>
                    <TableCell>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${URGENCY_COLORS[e.urgency] ?? ""}`}>{e.urgency}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" onClick={() => dismiss.mutate({ date_id: e.date_id })}>
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">No critical dates found</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Add dialog */}
        <SlidePanel open={showForm} onClose={() => setShowForm(false)} title="" width="xl">
          
            
          <div className="flex justify-end mt-2"><GenAIFillButton formType="critical_date_alert" onFill={(data) => { if (data.event_type !== undefined) setForm(f => ({ ...f, event_type: data.event_type as any })); if (data.event_date !== undefined) setForm(f => ({ ...f, event_date: data.event_date as any })); if (data.description !== undefined) setForm(f => ({ ...f, description: data.description as any })); if (data.notify_days_before !== undefined) setForm(f => ({ ...f, notify_days_before: data.notify_days_before as any })); if (data.assigned_to !== undefined) setForm(f => ({ ...f, assigned_to: data.assigned_to as any })); }} /></div>
            <div className="space-y-4">
              <div className="space-y-1">
                <Label>Contract</Label>
                <Select value={form.contract_id.toString()} onValueChange={v => setForm(f => ({ ...f, contract_id: parseInt(v) }))}>
                  <SelectTrigger><SelectValue placeholder="Select contract..." /></SelectTrigger>
                  <SelectContent>
                    {(contracts as any[]).map((c: any) => <SelectItem key={c.contract_id} value={c.contract_id.toString()}>{c.contract_ref} — {c.asset_description}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Event Type</Label>
                  <Select value={form.event_type} onValueChange={v => setForm(f => ({ ...f, event_type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{EVENT_TYPES.map(t => <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Event Date</Label>
                  <Input type="date" value={form.event_date} onChange={e => setForm(f => ({ ...f, event_date: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Notice Days Required</Label>
                <Input type="number" value={form.notice_days_required} onChange={e => setForm(f => ({ ...f, notice_days_required: parseInt(e.target.value) }))} />
              </div>
              <div className="space-y-1">
                <Label>Description</Label>
                <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="e.g. Lease expiry — renewal decision required" />
              </div>
              <div className="space-y-1">
                <Label>Action Required</Label>
                <Textarea value={form.action_required} onChange={e => setForm(f => ({ ...f, action_required: e.target.value }))} rows={2} placeholder="What needs to be done before this date?" />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10 mt-4">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button onClick={() => create.mutate(form)} disabled={create.isPending || !form.contract_id || !form.event_date}>
                {create.isPending ? "Saving..." : "Add Date"}
              </Button>
            </div>
          
        </SlidePanel>
      </div>
    </DashboardLayout>
  );
}
