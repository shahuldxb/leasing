/**
 * VodaLease Enterprise — APIWebhook Config
 * Screen ID: VFLAPIWEBHO0001P001
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, Search, MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ScreenHeader } from "@/components/ScreenHeader";
import SlidePanel from "@/components/SlidePanel";

const INIT_FORM = {
  webhook_name: "",
  endpoint_url: "",
  event_types: "",
  secret_key: "",
  is_active: false
};

export default function APIWebhookConfig() {
  const [search, setSearch] = useState("");
  const [aiRows, setAiRows] = useState<Record<string, unknown>[]>([]);
  const [panelOpen, setPanelOpen] = useState(false);
  const [editRow, setEditRow] = useState<any>(null);
  const [form, setForm] = useState<any>({ ...INIT_FORM });

  const utils = trpc.useUtils();
  const { data: rows = [], isLoading } = trpc.apiWebhook.list.useQuery({} as any);

  const createMut = trpc.apiWebhook.upsert.useMutation({
    onSuccess: () => { utils.apiWebhook.list.invalidate(); toast.success("Record created"); setPanelOpen(false); },
    onError: (e) => toast.error(e.message),
  });
  const updateMut = trpc.apiWebhook.upsert.useMutation({
    onSuccess: () => { utils.apiWebhook.list.invalidate(); toast.success("Updated"); setPanelOpen(false); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMut = trpc.apiWebhook.delete.useMutation({
    onSuccess: () => { utils.apiWebhook.list.invalidate(); toast.success("Deleted"); },
    onError: (e) => toast.error(e.message),
  });


  const displayRows = aiRows.length > 0 ? aiRows : (rows as any[]);
  const filtered = displayRows.filter((r: any) =>
    !search || Object.values(r).some(v => String(v).toLowerCase().includes(search.toLowerCase()))
  );

  function openAdd() {
    setEditRow(null);
    setForm({ ...INIT_FORM });
    setPanelOpen(true);
  }
  function openEdit(row: any) {
    setEditRow(row);
    setForm({
      webhook_name: row.webhook_name ?? "",
      endpoint_url: row.endpoint_url ?? "",
      event_types: row.event_types ?? "",
      secret_key: row.secret_key ?? "",
      is_active: row.is_active ?? ""
      });
    setPanelOpen(true);
  }
  function handleSubmit() {
    const payload = {
      webhook_name: form.webhook_name as any,
      endpoint_url: form.endpoint_url as any,
      event_types: form.event_types as any,
      secret_key: form.secret_key as any,
      is_active: !!form.is_active
      };
    if (editRow) {
            updateMut.mutate({ webhook_id: editRow.webhook_id, ...payload } as any);
    } else {
      createMut.mutate(payload as any);
    }
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <ScreenHeader
          screenId="VFLAPIWEBHO0001P001"
          title="APIWebhook Config"
          subtitle="Manage apiwebhook config records"
          screenType="apiWebhook"
          onAIData={(r) => setAiRows(r)}
          actions={<Button size="sm" onClick={openAdd}><Plus className="w-4 h-4 mr-1" />Add New</Button>}
        />

        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                <TableHead className="text-xs">Webhook Name</TableHead>
                <TableHead className="text-xs">Endpoint Url</TableHead>
                <TableHead className="text-xs">Event Types</TableHead>
                <TableHead className="text-xs">Is Active</TableHead>
                <TableHead className="text-xs">Failure Count</TableHead>
                    <TableHead className="text-xs">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading && aiRows.length === 0 ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 6 }).map((__, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}
                      </TableRow>
                    ))
                  ) : filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-10">No records found. <button className="text-primary underline" onClick={openAdd}>Add the first one.</button></TableCell></TableRow>
                  ) : (
                    filtered.map((row: any, i: number) => (
                      <TableRow key={row.webhook_id ?? i} className="hover:bg-muted/20">
                    <TableCell>{row.webhook_name ?? "—"}</TableCell>
                    <TableCell>{row.endpoint_url ?? "—"}</TableCell>
                    <TableCell>{row.event_types ?? "—"}</TableCell>
                    <TableCell>{row.is_active ?? "—"}</TableCell>
                    <TableCell>{row.failure_count ?? "—"}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEdit(row)}><Edit className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive" onClick={() => deleteMut.mutate({ webhook_id: row.webhook_id })}><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <SlidePanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        title={editRow ? "Edit Record" : "Add New Record"}
        subtitle="Fill in the details below"
        width="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setPanelOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={createMut.isPending}>
              {createMut.isPending ? "Saving…" : editRow ? "Update" : "Create"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <Label>Webhook Name</Label>
            <Input type="text" value={form.webhook_name ?? ""} onChange={e => setForm((f: any) => ({...f, webhook_name: e.target.value}))} />
          </div>
          <div>
            <Label>Endpoint Url</Label>
            <Input type="text" value={form.endpoint_url ?? ""} onChange={e => setForm((f: any) => ({...f, endpoint_url: e.target.value}))} />
          </div>
          <div>
            <Label>Event Types</Label>
            <Input type="text" value={form.event_types ?? ""} onChange={e => setForm((f: any) => ({...f, event_types: e.target.value}))} />
          </div>
          <div>
            <Label>Secret Key</Label>
            <Input type="text" value={form.secret_key ?? ""} onChange={e => setForm((f: any) => ({...f, secret_key: e.target.value}))} />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="is_active" checked={!!form.is_active} onChange={e => setForm((f: any) => ({...f, is_active: e.target.checked}))} className="w-4 h-4" />
            <Label htmlFor="is_active">Is Active</Label>
          </div>
        </div>
      </SlidePanel>
    </DashboardLayout>
  );
}
