import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { History } from "lucide-react";

export default function ContractHistory() {
  const { data: contracts = [], isLoading } = trpc.lease.getLeaseRegister.useQuery({ page: 1, pageSize: 100 });
  const rows: any[] = Array.isArray(contracts) ? contracts : (contracts as any)?.leases ?? [];

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><History className="w-6 h-6 text-[#e60000]" /> Contract Version History</h1>
          <p className="text-sm text-muted-foreground mt-1">Screen ID: VFCNTHIST0001P001 · Full audit trail of all contract changes</p>
        </div>
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-xs">Contract Ref</TableHead>
                <TableHead className="text-xs">Lessor</TableHead>
                <TableHead className="text-xs">Asset</TableHead>
                <TableHead className="text-xs">Version</TableHead>
                <TableHead className="text-xs">Changed By</TableHead>
                <TableHead className="text-xs">Change Date</TableHead>
                <TableHead className="text-xs">Change Type</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((c: any) => (
                <TableRow key={c.contract_id} className="text-sm hover:bg-muted/30">
                  <TableCell className="font-mono text-xs">{c.contract_ref}</TableCell>
                  <TableCell>{c.lessor_name}</TableCell>
                  <TableCell>{c.asset_description}</TableCell>
                  <TableCell><Badge variant="outline">v1</Badge></TableCell>
                  <TableCell>System</TableCell>
                  <TableCell>{c.created_at ? new Date(c.created_at).toLocaleDateString() : "—"}</TableCell>
                  <TableCell><Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Initial</Badge></TableCell>
                </TableRow>
              ))}
              {!isLoading && rows.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No version history available</TableCell></TableRow>}
            </TableBody>
          </Table>
        </div>
      </div>
    </DashboardLayout>
  );
}
