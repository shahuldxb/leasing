/**
 * VodaLease Enterprise — Vendor Management
 * Screen ID: VFLVENDORMA0001P001
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
  name: "",
  category: "",
  contact_email: "",
  contact_phone: "",
  trn: "",
  status: "",
  notes: ""
};

export default function VendorManagement() {
  const [search, setSearch] = useState("");
  const [aiRows, setAiRows] = useState<Record<string, unknown>[]>([]);
  const [panelOpen, setPanelOpen] = useState(false);
  const [editRow, setEditRow] = useState<any>(null);
  const [form, setForm] = useState<any>({ ...INIT_FORM });

  const utils = trpc.useUtils();
  const { data: rows = [], isLoading } = trpc.vendor.list.useQuery({} as any);

  const createMut = trpc.vendor.create.useMutation({
    onSuccess: () => { utils.vendor.list.invalidate(); toast.success("Record created"); setPanelOpen(false); },
    onError: (e) => toast.error(e.message),
  });
  const updateMut = trpc.vendor.update.useMutation({
    onSuccess: () => { utils.vendor.list.invalidate(); toast.success("Updated"); setPanelOpen(false); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMut = trpc.vendor.delete.useMutation({
    onSuccess: () => { utils.vendor.list.invalidate(); toast.success("Deleted"); },
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
      name: row.name ?? "",
      category: row.category ?? "",
      contact_email: row.contact_email ?? "",
      contact_phone: row.contact_phone ?? "",
      trn: row.trn ?? "",
      status: row.status ?? "",
      notes: row.notes ?? ""
      });
    setPanelOpen(true);
  }
  function handleSubmit() {
    const payload = {
      name: form.name as any,
      category: form.category as any,
      contact_email: form.contact_email as any,
      contact_phone: form.contact_phone as any,
      trn: form.trn as any,
      status: form.status as any,
      notes: form.notes as any
      };
    if (editRow) {
            updateMut.mutate({ vendor_id: editRow.vendor_id, ...payload } as any);
    } else {
      createMut.mutate(payload as any);
    }
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <ScreenHeader
          screenId="VFLVENDORMA0001P001"
          title="Vendor Management"
          subtitle="Manage vendor management records"
          screenType="vendor"
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
                <TableHead className="text-xs">Vendor Code</TableHead>
                <TableHead className="text-xs">Name</TableHead>
                <TableHead className="text-xs">Category</TableHead>
                <TableHead className="text-xs">Contact Email</TableHead>
                <TableHead className="text-xs">Status</TableHead>
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
                      <TableRow key={row.vendor_id ?? i} className="hover:bg-muted/20">
                    <TableCell>{row.vendor_code ?? "—"}</TableCell>
                    <TableCell>{row.name ?? "—"}</TableCell>
                    <TableCell>{row.category ?? "—"}</TableCell>
                    <TableCell>{row.contact_email ?? "—"}</TableCell>
                    <TableCell>{row.status ?? "—"}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEdit(row)}><Edit className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive" onClick={() => deleteMut.mutate({ vendor_id: row.vendor_id })}><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
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
            <Label>Name</Label>
            <Input type="text" value={form.name ?? ""} onChange={e => setForm((f: any) => ({...f, name: e.target.value}))} />
          </div>
          <div>
            <Label>Category</Label>
            <Input type="text" value={form.category ?? ""} onChange={e => setForm((f: any) => ({...f, category: e.target.value}))} />
          </div>
          <div>
            <Label>Contact Email</Label>
            <Input type="email" value={form.contact_email ?? ""} onChange={e => setForm((f: any) => ({...f, contact_email: e.target.value}))} />
          </div>
          <div>
            <Label>Contact Phone</Label>
            <Input type="text" value={form.contact_phone ?? ""} onChange={e => setForm((f: any) => ({...f, contact_phone: e.target.value}))} />
          </div>
          <div>
            <Label>Trn</Label>
            <Input type="text" value={form.trn ?? ""} onChange={e => setForm((f: any) => ({...f, trn: e.target.value}))} />
          </div>
          <div>
            <Label>Status</Label>
            <Select value={String(form.status ?? "")} onValueChange={v => setForm((f: any) => ({...f, status: v}))} >
              <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
              <SelectContent>
                  <SelectItem value="APPROVED">APPROVED</SelectItem>
                  <SelectItem value="PENDING">PENDING</SelectItem>
                  <SelectItem value="BLACKLISTED">BLACKLISTED</SelectItem>
                  <SelectItem value="INACTIVE">INACTIVE</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea value={form.notes ?? ""} onChange={e => setForm((f: any) => ({...f, notes: e.target.value}))} rows={3} />
          </div>
        </div>
      </SlidePanel>
    </DashboardLayout>
  );
}
