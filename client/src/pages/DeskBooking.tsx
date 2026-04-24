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
import { MapPin, Users, CheckCircle, Clock, Plus, BarChart3, Building2 } from "lucide-react";
import { toast } from "sonner";
import { ScreenHeader } from "@/components/ScreenHeader";

const FLOORS = [
  { id: 1, building: "Vodafone HQ — Dubai", floor: "Floor 12", total_desks: 80, available: 23, booked: 57, rooms: 6 },
  { id: 2, building: "Vodafone HQ — Dubai", floor: "Floor 13", total_desks: 80, available: 31, booked: 49, rooms: 4 },
  { id: 3, building: "Vodafone Abu Dhabi", floor: "Floor 5", total_desks: 45, available: 12, booked: 33, rooms: 3 },
  { id: 4, building: "Vodafone Sharjah", floor: "Floor 2", total_desks: 30, available: 18, booked: 12, rooms: 2 },
];

const BOOKINGS = [
  { id: 1, desk: "D12-045", room: null, employee: "Ahmed Al Rashid", date: "2026-04-23", start: "09:00", end: "18:00", status: "CONFIRMED", floor: "Floor 12" },
  { id: 2, desk: null, room: "MR-12-A (Boardroom)", employee: "Sarah Johnson", date: "2026-04-23", start: "10:00", end: "12:00", status: "CONFIRMED", floor: "Floor 12" },
  { id: 3, desk: "D13-012", room: null, employee: "Mohammed Al Zaabi", date: "2026-04-23", start: "08:00", end: "17:00", status: "CONFIRMED", floor: "Floor 13" },
  { id: 4, desk: null, room: "MR-13-B (Training Room)", employee: "Fatima Al Hashimi", date: "2026-04-24", start: "14:00", end: "16:00", status: "PENDING", floor: "Floor 13" },
  { id: 5, desk: "D05-007", room: null, employee: "John Smith", date: "2026-04-24", start: "09:00", end: "18:00", status: "CONFIRMED", floor: "Floor 5" },
];

const STATUS_COLORS: Record<string, string> = {
  CONFIRMED: "bg-green-500/20 text-green-400 border-green-500/30",
  PENDING: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  CANCELLED: "bg-red-500/20 text-red-400 border-red-500/30",
};

export default function DeskBooking() {
  const [tab, setTab] = useState("overview");
  const [showDialog, setShowDialog] = useState(false);
  const [bookings, setBookings] = useState<any[]>(BOOKINGS);
  const [form, setForm] = useState({ type: "desk", floor: "", resource: "", employee: "", date: "", start: "09:00", end: "18:00" });

  const totalDesks = FLOORS.reduce((s, f) => s + f.total_desks, 0);
  const totalBooked = FLOORS.reduce((s, f) => s + f.booked, 0);
  const totalAvailable = FLOORS.reduce((s, f) => s + f.available, 0);
  const occupancyRate = Math.round((totalBooked / totalDesks) * 100);

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <ScreenHeader
  screenId="VFLDSBBKG0001P001"
  title="Desk & Room Booking"
  subtitle="Hot-desk and meeting room booking management"
/>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Desks", value: totalDesks, icon: MapPin, color: "text-blue-400" },
            { label: "Booked Today", value: totalBooked, icon: Users, color: "text-red-400" },
            { label: "Available Now", value: totalAvailable, icon: CheckCircle, color: "text-green-400" },
            { label: "Occupancy Rate", value: `${occupancyRate}%`, icon: BarChart3, color: "text-yellow-400" },
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
            <TabsTrigger value="overview">Floor Overview</TabsTrigger>
            <TabsTrigger value="bookings">Today's Bookings</TabsTrigger>
            <TabsTrigger value="utilisation">Utilisation Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {FLOORS.map((floor) => {
                const occ = Math.round((floor.booked / floor.total_desks) * 100);
                return (
                  <Card key={floor.id} className="bg-card border-border">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <Building2 className="w-4 h-4 text-red-400" />
                        {floor.building} — {floor.floor}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div>
                          <p className="text-xl font-bold text-blue-400">{floor.total_desks}</p>
                          <p className="text-xs text-muted-foreground">Total Desks</p>
                        </div>
                        <div>
                          <p className="text-xl font-bold text-red-400">{floor.booked}</p>
                          <p className="text-xs text-muted-foreground">Booked</p>
                        </div>
                        <div>
                          <p className="text-xl font-bold text-green-400">{floor.available}</p>
                          <p className="text-xs text-muted-foreground">Available</p>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-muted-foreground">Occupancy</span>
                          <span className={occ >= 80 ? "text-red-400" : occ >= 60 ? "text-yellow-400" : "text-green-400"}>{occ}%</span>
                        </div>
                        <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all ${occ >= 80 ? "bg-red-500" : occ >= 60 ? "bg-yellow-500" : "bg-green-500"}`}
                            style={{ width: `${occ}%` }} />
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">{floor.rooms} meeting rooms available</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="bookings" className="mt-4">
            <Card className="bg-card border-border">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="text-xs">Resource</TableHead>
                      <TableHead className="text-xs">Employee</TableHead>
                      <TableHead className="text-xs">Floor</TableHead>
                      <TableHead className="text-xs">Date</TableHead>
                      <TableHead className="text-xs">Time</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings.map((b) => (
                      <TableRow key={b.id}>
                        <TableCell className="text-sm font-mono">{b.desk || b.room}</TableCell>
                        <TableCell className="text-sm">{b.employee}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{b.floor}</TableCell>
                        <TableCell className="text-sm">{b.date}</TableCell>
                        <TableCell className="text-sm">{b.start} – {b.end}</TableCell>
                        <TableCell><Badge className={`text-xs border ${STATUS_COLORS[b.status]}`}>{b.status}</Badge></TableCell>
                        <TableCell>
                          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-red-400"
                            onClick={() => { setBookings(prev => prev.filter(x => x.id !== b.id)); toast.success("Booking cancelled"); }}>
                            Cancel
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="utilisation" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-card border-border">
                <CardHeader><CardTitle className="text-sm">Weekly Occupancy Trend</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {["Mon", "Tue", "Wed", "Thu", "Sun"].map((day, i) => {
                      const pct = [72, 81, 85, 78, 45][i];
                      return (
                        <div key={day} className="flex items-center gap-3">
                          <span className="text-xs w-8 text-muted-foreground">{day}</span>
                          <div className="flex-1 h-5 bg-muted/30 rounded overflow-hidden">
                            <div className={`h-full rounded transition-all ${pct >= 80 ? "bg-red-500" : pct >= 60 ? "bg-yellow-500" : "bg-green-500"}`}
                              style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs w-8 text-right font-mono">{pct}%</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardHeader><CardTitle className="text-sm">Peak Hours Analysis</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {["08:00–10:00", "10:00–12:00", "12:00–14:00", "14:00–16:00", "16:00–18:00"].map((slot, i) => {
                      const pct = [55, 88, 62, 91, 74][i];
                      return (
                        <div key={slot} className="flex items-center gap-3">
                          <span className="text-xs w-24 text-muted-foreground">{slot}</span>
                          <div className="flex-1 h-5 bg-muted/30 rounded overflow-hidden">
                            <div className={`h-full rounded ${pct >= 80 ? "bg-red-500" : pct >= 60 ? "bg-yellow-500" : "bg-green-500"}`}
                              style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs w-8 text-right font-mono">{pct}%</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>New Desk / Room Booking</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-medium">Booking Type</Label>
                  <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="desk">Hot Desk</SelectItem>
                      <SelectItem value="room">Meeting Room</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-medium">Floor</Label>
                  <Select value={form.floor} onValueChange={v => setForm(f => ({ ...f, floor: v }))}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select floor..." /></SelectTrigger>
                    <SelectContent>
                      {FLOORS.map(fl => <SelectItem key={fl.id} value={fl.floor}>{fl.building} — {fl.floor}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-medium">Employee Name</Label>
                  <Input className="mt-1" placeholder="Full name" value={form.employee} onChange={e => setForm(f => ({ ...f, employee: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs font-medium">Date</Label>
                  <Input type="date" className="mt-1" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs font-medium">Start Time</Label>
                  <Input type="time" className="mt-1" value={form.start} onChange={e => setForm(f => ({ ...f, start: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs font-medium">End Time</Label>
                  <Input type="time" className="mt-1" value={form.end} onChange={e => setForm(f => ({ ...f, end: e.target.value }))} />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setShowDialog(false)} className="flex-1">Cancel</Button>
                <Button className="flex-1 bg-[#e60000] hover:bg-[#cc0000] text-white"
                  disabled={!form.employee || !form.date}
                  onClick={() => {
                    setBookings(prev => [...prev, {
                      id: prev.length + 1,
                      desk: form.type === "desk" ? `D-${Math.floor(Math.random() * 99).toString().padStart(3, "0")}` : null,
                      room: form.type === "room" ? "Meeting Room" : null,
                      employee: form.employee, date: form.date,
                      start: form.start, end: form.end,
                      status: "CONFIRMED", floor: form.floor || "Floor 12",
                    }]);
                    toast.success("Booking confirmed");
                    setShowDialog(false);
                  }}>
                  Confirm Booking
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
