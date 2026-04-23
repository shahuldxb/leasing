import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RefreshCw, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { toast } from "sonner";

export default function LeaseRenewals() {
  const { data: leases = [], refetch } = trpc.lease.getLeaseRegister.useQuery({ page: 1, pageSize: 200, status: "Active" });

  const allLeases = (leases as any[]);
  const today = new Date();
  const in90 = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000);

  const expiring = allLeases.filter((l: any) => {
    const exp = new Date(l.expiry_date);
    return exp <= in90 && exp >= today;
  });
  const expired = allLeases.filter((l: any) => new Date(l.expiry_date) < today);

  const statusBadge = (l: any) => {
    const exp = new Date(l.expiry_date);
    const daysLeft = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (daysLeft < 0) return <Badge variant="destructive">Expired</Badge>;
    if (daysLeft <= 30) return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">{daysLeft}d left</Badge>;
    if (daysLeft <= 90) return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">{daysLeft}d left</Badge>;
    return <Badge variant="outline">{daysLeft}d left</Badge>;
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Lease Renewals</h1>
            <p className="text-sm text-muted-foreground mt-1">Screen ID: VFLSERENEW0001P001 · Upcoming and overdue renewals</p>
          </div>
          <Button variant="outline" onClick={() => refetch()}><RefreshCw className="w-4 h-4 mr-2" />Refresh</Button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2"><AlertTriangle className="w-5 h-5 text-red-400" /><span className="font-semibold text-red-400">Expired</span></div>
            <p className="text-3xl font-bold text-red-400">{expired.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Require immediate action</p>
          </div>
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2"><Clock className="w-5 h-5 text-amber-400" /><span className="font-semibold text-amber-400">Expiring in 90 Days</span></div>
            <p className="text-3xl font-bold text-amber-400">{expiring.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Renewal action needed</p>
          </div>
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2"><CheckCircle2 className="w-5 h-5 text-green-400" /><span className="font-semibold text-green-400">Active (Safe)</span></div>
            <p className="text-3xl font-bold text-green-400">{allLeases.length - expiring.length - expired.length}</p>
            <p className="text-xs text-muted-foreground mt-1">No action required</p>
          </div>
        </div>

        {/* Renewals Table */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="p-4 border-b border-border">
            <h2 className="font-semibold">Leases Requiring Renewal Action</h2>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-xs">Contract Ref</TableHead>
                <TableHead className="text-xs">Lessor</TableHead>
                <TableHead className="text-xs">Asset</TableHead>
                <TableHead className="text-xs">Expiry Date</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs">Monthly Rent</TableHead>
                <TableHead className="text-xs">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...expired, ...expiring].map((l: any) => (
                <TableRow key={l.contract_id} className="text-sm hover:bg-muted/30">
                  <TableCell className="font-mono text-xs">{l.contract_ref}</TableCell>
                  <TableCell>{l.lessor_name}</TableCell>
                  <TableCell>{l.asset_description}</TableCell>
                  <TableCell>{new Date(l.expiry_date).toLocaleDateString()}</TableCell>
                  <TableCell>{statusBadge(l)}</TableCell>
                  <TableCell className="font-mono">{l.currency} {Number(l.monthly_payment).toLocaleString()}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => toast.info("Renewal workflow initiated")}>Renew</Button>
                      <Button size="sm" variant="outline" onClick={() => toast.info("Termination workflow initiated")}>Terminate</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {expired.length === 0 && expiring.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No leases requiring renewal action</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </DashboardLayout>
  );
}
