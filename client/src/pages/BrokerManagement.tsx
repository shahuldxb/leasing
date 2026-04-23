import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, DollarSign, TrendingUp, Star, Plus, Search, Phone, Mail, Building2 } from "lucide-react";
import { toast } from "sonner";

const BROKERS = [
  { id: 1, name: "JLL UAE", contact: "Michael Thompson", email: "m.thompson@jll.com", phone: "+971 4 426 6999", speciality: "Commercial Office", active_mandates: 4, closed_deals: 12, commission_ytd: 485000, rating: 4.8, status: "ACTIVE" },
  { id: 2, name: "CBRE Middle East", contact: "Sarah Al Rashid", email: "s.alrashid@cbre.com", phone: "+971 4 352 6000", speciality: "Retail & Mixed-Use", active_mandates: 2, closed_deals: 8, commission_ytd: 312000, rating: 4.6, status: "ACTIVE" },
  { id: 3, name: "Savills UAE", contact: "James Whitfield", email: "j.whitfield@savills.ae", phone: "+971 4 365 8888", speciality: "Industrial & Logistics", active_mandates: 1, closed_deals: 5, commission_ytd: 128000, rating: 4.2, status: "ACTIVE" },
  { id: 4, name: "Knight Frank Dubai", contact: "Aisha Al Zaabi", email: "a.alzaabi@knightfrank.com", phone: "+971 4 388 5555", speciality: "Data Centres", active_mandates: 0, closed_deals: 3, commission_ytd: 0, rating: 4.0, status: "INACTIVE" },
];

const MANDATES = [
  { id: 1, broker: "JLL UAE", type: "Exclusive", property: "New HQ — DIFC", requirement: "15,000-20,000 sqm Grade A office", budget: "AED 250/sqft/yr", expiry: "2026-07-31", status: "ACTIVE" },
  { id: 2, broker: "JLL UAE", type: "Non-Exclusive", property: "Sharjah Office Expansion", requirement: "3,000-5,000 sqm", budget: "AED 85/sqft/yr", expiry: "2026-06-30", status: "ACTIVE" },
  { id: 3, broker: "CBRE Middle East", type: "Exclusive", property: "Retail Flagship — Mall of Emirates", requirement: "800-1,200 sqm GF retail", budget: "AED 450/sqft/yr", expiry: "2026-08-15", status: "ACTIVE" },
  { id: 4, broker: "Savills UAE", type: "Non-Exclusive", property: "Logistics Hub — Jebel Ali", requirement: "10,000 sqm warehouse", budget: "AED 35/sqft/yr", expiry: "2026-09-30", status: "ACTIVE" },
];

const COMMISSIONS = [
  { ref: "VF-2024-001", broker: "JLL UAE", property: "Vodafone HQ Floor 12", deal_value: 18500000, commission_rate: 2.5, commission_amount: 462500, paid: true, date: "2024-02-15" },
  { ref: "VF-2024-003", broker: "JLL UAE", property: "Vodafone HQ Floor 13", deal_value: 17500000, commission_rate: 2.5, commission_amount: 437500, paid: false, date: "2024-04-01" },
  { ref: "VF-2023-041", broker: "CBRE Middle East", property: "Vodafone Abu Dhabi", deal_value: 12500000, commission_rate: 2.5, commission_amount: 312500, paid: true, date: "2023-09-01" },
];

export default function BrokerManagement() {
  const [tab, setTab] = useState("brokers");
  const [search, setSearch] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);

  const filtered = BROKERS.filter(b =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.contact.toLowerCase().includes(search.toLowerCase())
  );

  const totalCommission = COMMISSIONS.reduce((s, c) => s + c.commission_amount, 0);
  const unpaidCommission = COMMISSIONS.filter(c => !c.paid).reduce((s, c) => s + c.commission_amount, 0);

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Broker & Agent Management</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage broker relationships, mandates, commission tracking, and deal performance</p>
          </div>
          <Button className="bg-[#e60000] hover:bg-[#cc0000] text-white" onClick={() => setShowAddDialog(true)}>
            <Plus className="w-4 h-4 mr-2" /> Add Broker
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Active Brokers", value: BROKERS.filter(b => b.status === "ACTIVE").length, icon: Users, color: "text-blue-400" },
            { label: "Active Mandates", value: MANDATES.length, icon: Building2, color: "text-green-400" },
            { label: "Total Commission YTD", value: `AED ${(totalCommission / 1000).toFixed(0)}K`, icon: DollarSign, color: "text-yellow-400" },
            { label: "Unpaid Commission", value: `AED ${(unpaidCommission / 1000).toFixed(0)}K`, icon: TrendingUp, color: "text-red-400" },
          ].map((kpi) => (
            <Card key={kpi.label} className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <kpi.icon className={`w-8 h-8 ${kpi.color}`} />
                  <div>
                    <p className="text-xl font-bold">{kpi.value}</p>
                    <p className="text-xs text-muted-foreground">{kpi.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="bg-muted/30">
            <TabsTrigger value="brokers">Broker Directory</TabsTrigger>
            <TabsTrigger value="mandates">Active Mandates</TabsTrigger>
            <TabsTrigger value="commissions">Commission Tracker</TabsTrigger>
          </TabsList>

          <TabsContent value="brokers" className="mt-4">
            <div className="flex gap-3 mb-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input className="pl-9" placeholder="Search brokers..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filtered.map((broker) => (
                <Card key={broker.id} className={`bg-card border-border ${broker.status === "INACTIVE" ? "opacity-60" : ""}`}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-sm font-bold">{broker.name}</p>
                        <p className="text-xs text-muted-foreground">{broker.speciality}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                          <span className="text-xs font-semibold">{broker.rating}</span>
                        </div>
                        <Badge className={`text-xs border ${broker.status === "ACTIVE" ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-muted/30 text-muted-foreground border-border"}`}>{broker.status}</Badge>
                      </div>
                    </div>
                    <div className="space-y-1 mb-3">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Users className="w-3 h-3" /> {broker.contact}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Mail className="w-3 h-3" /> {broker.email}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Phone className="w-3 h-3" /> {broker.phone}
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center pt-3 border-t border-border">
                      <div>
                        <p className="text-sm font-bold">{broker.active_mandates}</p>
                        <p className="text-xs text-muted-foreground">Mandates</p>
                      </div>
                      <div>
                        <p className="text-sm font-bold">{broker.closed_deals}</p>
                        <p className="text-xs text-muted-foreground">Closed Deals</p>
                      </div>
                      <div>
                        <p className="text-sm font-bold">AED {(broker.commission_ytd / 1000).toFixed(0)}K</p>
                        <p className="text-xs text-muted-foreground">Commission YTD</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="mandates" className="mt-4">
            <Card className="bg-card border-border">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="text-xs">Broker</TableHead>
                      <TableHead className="text-xs">Type</TableHead>
                      <TableHead className="text-xs">Property / Requirement</TableHead>
                      <TableHead className="text-xs">Budget</TableHead>
                      <TableHead className="text-xs">Expiry</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {MANDATES.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell className="text-sm font-medium">{m.broker}</TableCell>
                        <TableCell><Badge className={`text-xs border ${m.type === "Exclusive" ? "bg-purple-500/20 text-purple-400 border-purple-500/30" : "bg-blue-500/20 text-blue-400 border-blue-500/30"}`}>{m.type}</Badge></TableCell>
                        <TableCell>
                          <p className="text-sm">{m.property}</p>
                          <p className="text-xs text-muted-foreground">{m.requirement}</p>
                        </TableCell>
                        <TableCell className="text-sm">{m.budget}</TableCell>
                        <TableCell className="text-sm">{m.expiry}</TableCell>
                        <TableCell><Badge className="text-xs bg-green-500/20 text-green-400 border border-green-500/30">{m.status}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="commissions" className="mt-4">
            <Card className="bg-card border-border">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="text-xs">Lease Ref</TableHead>
                      <TableHead className="text-xs">Broker</TableHead>
                      <TableHead className="text-xs">Property</TableHead>
                      <TableHead className="text-xs text-right">Deal Value</TableHead>
                      <TableHead className="text-xs text-right">Rate</TableHead>
                      <TableHead className="text-xs text-right">Commission</TableHead>
                      <TableHead className="text-xs">Date</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {COMMISSIONS.map((c, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-mono text-xs">{c.ref}</TableCell>
                        <TableCell className="text-sm">{c.broker}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{c.property}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{(c.deal_value / 1000000).toFixed(2)}M</TableCell>
                        <TableCell className="text-right font-mono text-sm">{c.commission_rate}%</TableCell>
                        <TableCell className="text-right font-mono text-sm font-semibold">{(c.commission_amount / 1000).toFixed(0)}K</TableCell>
                        <TableCell className="text-xs">{c.date}</TableCell>
                        <TableCell>
                          {c.paid
                            ? <Badge className="text-xs bg-green-500/20 text-green-400 border border-green-500/30">Paid</Badge>
                            : <Badge className="text-xs bg-orange-500/20 text-orange-400 border border-orange-500/30">Unpaid</Badge>}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Add New Broker</DialogTitle></DialogHeader>
            <div className="space-y-3">
              {[
                { label: "Company Name", placeholder: "e.g. JLL UAE" },
                { label: "Primary Contact", placeholder: "Full name" },
                { label: "Email", placeholder: "contact@broker.com" },
                { label: "Phone", placeholder: "+971 4 xxx xxxx" },
                { label: "Speciality", placeholder: "e.g. Commercial Office" },
              ].map(f => (
                <div key={f.label}>
                  <Label className="text-xs font-medium">{f.label}</Label>
                  <Input className="mt-1" placeholder={f.placeholder} />
                </div>
              ))}
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setShowAddDialog(false)} className="flex-1">Cancel</Button>
                <Button className="flex-1 bg-[#e60000] hover:bg-[#cc0000] text-white" onClick={() => { toast.success("Broker added"); setShowAddDialog(false); }}>
                  Add Broker
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
