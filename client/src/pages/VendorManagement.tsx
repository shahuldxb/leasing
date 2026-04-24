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
import { Building2, Star, CheckCircle, Clock, Plus, Phone, Mail, FileText } from "lucide-react";
import { toast } from "sonner";
import { ScreenHeader } from "@/components/ScreenHeader";

const STATUS_COLORS: Record<string, string> = {
  APPROVED: "bg-green-500/20 text-green-400 border-green-500/30",
  PENDING: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  BLACKLISTED: "bg-red-500/20 text-red-400 border-red-500/30",
  INACTIVE: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

const SAMPLE_VENDORS = [
  { id: 1, name: "Al Futtaim FM Services", category: "Facilities Management", contact: "operations@alfuttaim.ae", phone: "+971 4 294 5000", trn: "100234567890003", status: "APPROVED", rating: 4.5, active_orders: 3, ytd_spend: 285000 },
  { id: 2, name: "Otis Elevator Company", category: "Lift Maintenance", contact: "service@otis.ae", phone: "+971 4 883 3000", trn: "100345678901234", status: "APPROVED", rating: 4.8, active_orders: 1, ytd_spend: 48000 },
  { id: 3, name: "ABB Electrical Services", category: "Electrical", contact: "fm@abb.ae", phone: "+971 2 412 5000", trn: "100456789012345", status: "APPROVED", rating: 4.2, active_orders: 2, ytd_spend: 127000 },
  { id: 4, name: "Emirates Plumbing LLC", category: "Plumbing", contact: "info@emiratesplumbing.ae", phone: "+971 4 338 7000", trn: "100567890123456", status: "APPROVED", rating: 3.9, active_orders: 0, ytd_spend: 32000 },
  { id: 5, name: "Tyco Fire & Security", category: "Fire Safety", contact: "service@tyco.ae", phone: "+971 4 299 2000", trn: "100678901234567", status: "APPROVED", rating: 4.7, active_orders: 1, ytd_spend: 95000 },
  { id: 6, name: "Emirates Interiors LLC", category: "Fit-Out", contact: "projects@emiratesinteriors.ae", phone: "+971 4 321 5000", trn: "100789012345678", status: "PENDING", rating: 0, active_orders: 0, ytd_spend: 0 },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <Star key={s} className={`w-3 h-3 ${s <= Math.round(rating) ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground"}`} />
      ))}
      <span className="text-xs text-muted-foreground ml-1">{rating > 0 ? rating.toFixed(1) : "—"}</span>
    </div>
  );
}

export default function VendorManagement() {
  const [tab, setTab] = useState("vendors");
  const [vendors, setVendors] = useState(SAMPLE_VENDORS);
  const [showDialog, setShowDialog] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ name: "", category: "", contact: "", phone: "", trn: "" });

  const filtered = vendors.filter(v =>
    !search || v.name.toLowerCase().includes(search.toLowerCase()) || v.category.toLowerCase().includes(search.toLowerCase())
  );

  const approved = vendors.filter(v => v.status === "APPROVED").length;
  const totalSpend = vendors.reduce((s, v) => s + v.ytd_spend, 0);
  const activeOrders = vendors.reduce((s, v) => s + v.active_orders, 0);

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <ScreenHeader
  screenId="VFLVNDMGR0001P001"
  title="Vendor Management"
  subtitle="Vendor and contractor management"
/>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Approved Vendors", value: approved, icon: CheckCircle, color: "text-green-400" },
            { label: "Pending Approval", value: vendors.filter(v => v.status === "PENDING").length, icon: Clock, color: "text-yellow-400" },
            { label: "Active Work Orders", value: activeOrders, icon: FileText, color: "text-blue-400" },
            { label: "YTD Spend (AED)", value: `${(totalSpend / 1000).toFixed(0)}K`, icon: Building2, color: "text-red-400" },
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
            <TabsTrigger value="vendors">Vendor Register</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="spend">Spend Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="vendors" className="mt-4">
            <Card className="bg-card border-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Approved Vendor Register</CardTitle>
                  <Input className="h-8 w-48 text-xs" placeholder="Search vendor, category..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="text-xs">Vendor Name</TableHead>
                      <TableHead className="text-xs">Category</TableHead>
                      <TableHead className="text-xs">Contact</TableHead>
                      <TableHead className="text-xs">TRN</TableHead>
                      <TableHead className="text-xs">Rating</TableHead>
                      <TableHead className="text-xs">Active Orders</TableHead>
                      <TableHead className="text-xs text-right">YTD Spend (AED)</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((v) => (
                      <TableRow key={v.id}>
                        <TableCell className="text-sm font-medium">{v.name}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{v.category}</TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs flex items-center gap-1"><Mail className="w-3 h-3" /> {v.contact}</span>
                            <span className="text-xs flex items-center gap-1 text-muted-foreground"><Phone className="w-3 h-3" /> {v.phone}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{v.trn}</TableCell>
                        <TableCell><StarRating rating={v.rating} /></TableCell>
                        <TableCell className="text-sm text-center">{v.active_orders}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{v.ytd_spend.toLocaleString()}</TableCell>
                        <TableCell><Badge className={`text-xs border ${STATUS_COLORS[v.status]}`}>{v.status}</Badge></TableCell>
                        <TableCell>
                          {v.status === "PENDING" && (
                            <Button size="sm" className="h-7 px-2 text-xs bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => { setVendors(prev => prev.map(x => x.id === v.id ? { ...x, status: "APPROVED" } : x)); toast.success("Vendor approved"); }}>
                              Approve
                            </Button>
                          )}
                          {v.status === "APPROVED" && (
                            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-muted-foreground"
                              onClick={() => toast.info("Vendor profile — coming soon")}>
                              View
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {vendors.filter(v => v.status === "APPROVED" && v.rating > 0).sort((a, b) => b.rating - a.rating).map(v => (
                <Card key={v.id} className="bg-card border-border">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-semibold">{v.name}</p>
                        <p className="text-xs text-muted-foreground">{v.category}</p>
                      </div>
                      <StarRating rating={v.rating} />
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                      <div className="p-2 rounded bg-muted/20">
                        <p className="text-sm font-bold text-blue-400">{v.active_orders}</p>
                        <p className="text-xs text-muted-foreground">Active Orders</p>
                      </div>
                      <div className="p-2 rounded bg-muted/20">
                        <p className="text-sm font-bold text-green-400">AED {(v.ytd_spend / 1000).toFixed(0)}K</p>
                        <p className="text-xs text-muted-foreground">YTD Spend</p>
                      </div>
                      <div className="p-2 rounded bg-muted/20">
                        <p className="text-sm font-bold text-yellow-400">{v.rating >= 4.5 ? "Excellent" : v.rating >= 4 ? "Good" : "Fair"}</p>
                        <p className="text-xs text-muted-foreground">Performance</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="spend" className="mt-4">
            <Card className="bg-card border-border">
              <CardHeader><CardTitle className="text-sm">YTD Spend by Vendor</CardTitle></CardHeader>
              <CardContent>
                {vendors.filter(v => v.ytd_spend > 0).sort((a, b) => b.ytd_spend - a.ytd_spend).map(v => {
                  const pct = Math.round((v.ytd_spend / totalSpend) * 100);
                  return (
                    <div key={v.id} className="flex items-center gap-3 mb-3">
                      <div className="w-40 shrink-0">
                        <p className="text-xs font-medium truncate">{v.name}</p>
                        <p className="text-xs text-muted-foreground">{v.category}</p>
                      </div>
                      <div className="flex-1 h-5 bg-muted/30 rounded overflow-hidden">
                        <div className="h-full bg-[#e60000]/70 rounded" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs font-mono w-20 text-right">AED {(v.ytd_spend / 1000).toFixed(0)}K</span>
                      <span className="text-xs text-muted-foreground w-8">{pct}%</span>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Add New Vendor</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-xs font-medium">Company Name *</Label>
                <Input className="mt-1" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-medium">Category</Label>
                  <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                      {["Facilities Management", "HVAC", "Electrical", "Plumbing", "Lift", "Fire Safety", "Fit-Out", "IT Infrastructure", "Security", "Cleaning"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-medium">TRN</Label>
                  <Input className="mt-1" placeholder="100XXXXXXXXXX" value={form.trn} onChange={e => setForm(f => ({ ...f, trn: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs font-medium">Contact Email</Label>
                  <Input type="email" className="mt-1" value={form.contact} onChange={e => setForm(f => ({ ...f, contact: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs font-medium">Phone</Label>
                  <Input className="mt-1" placeholder="+971 4 XXX XXXX" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setShowDialog(false)} className="flex-1">Cancel</Button>
                <Button className="flex-1 bg-[#e60000] hover:bg-[#cc0000] text-white"
                  disabled={!form.name}
                  onClick={() => {
                    setVendors(prev => [...prev, {
                      id: prev.length + 1, name: form.name, category: form.category || "Other",
                      contact: form.contact, phone: form.phone, trn: form.trn,
                      status: "PENDING", rating: 0, active_orders: 0, ytd_spend: 0,
                    }]);
                    toast.success("Vendor added — pending approval");
                    setShowDialog(false);
                  }}>
                  Add Vendor
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
