import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { CheckCircle2, XCircle, AlertCircle, Scale } from "lucide-react";
import { toast } from "sonner";

const CRITERIA = [
  { key: "transfers_ownership", label: "Transfer of Ownership", desc: "Does the lease transfer ownership of the underlying asset to the lessee by the end of the lease term? (IFRS 16 Appendix A)" },
  { key: "purchase_option_certain", label: "Purchase Option Reasonably Certain", desc: "Does the lessee have an option to purchase the underlying asset and is reasonably certain to exercise it? (IFRS 16.19a)" },
  { key: "major_part_of_life", label: "Major Part of Economic Life", desc: "Does the lease term cover the major part of the economic life of the underlying asset? (IFRS 16.B34)" },
  { key: "substantially_all_fv", label: "Substantially All Fair Value", desc: "Is the present value of lease payments substantially all of the fair value of the underlying asset? (IFRS 16.B34)" },
  { key: "specialised_asset", label: "Specialised Asset", desc: "Is the underlying asset of such a specialised nature that only the lessee can use it without major modifications? (IFRS 16.B34)" },
];

export default function LeaseClassification() {
  const [showForm, setShowForm] = useState(false);
  const [selectedContract, setSelectedContract] = useState<any>(null);
  const [standard, setStandard] = useState<"IFRS16" | "ASC842">("IFRS16");
  const [criteria, setCriteria] = useState<Record<string, boolean>>({
    transfers_ownership: false, purchase_option_certain: false, major_part_of_life: false,
    substantially_all_fv: false, specialised_asset: false,
  });
  const [notes, setNotes] = useState("");

  const { data: classifications = [], refetch } = trpc.accounting.classification.list.useQuery({});
  const { data: contractsData } = trpc.lease.getLeaseRegister.useQuery({ status: "Active" });
  const contracts = contractsData?.rows ?? [];
  const classify = trpc.accounting.classification.classify.useMutation({
    onSuccess: (data) => {
      refetch();
      setShowForm(false);
      toast.success(`Classified as ${data.leaseType} lease`);
    },
  });

  const isFinance = Object.values(criteria).some(Boolean);

  const openClassify = (contract: any) => {
    setSelectedContract(contract);
    const existing = (classifications as any[]).find((c: any) => c.contract_id === contract.contract_id);
    if (existing) {
      setCriteria({
        transfers_ownership: !!existing.transfers_ownership,
        purchase_option_certain: !!existing.purchase_option_certain,
        major_part_of_life: !!existing.major_part_of_life,
        substantially_all_fv: !!existing.substantially_all_fv,
        specialised_asset: !!existing.specialised_asset,
      });
      setNotes(existing.notes ?? "");
    } else {
      setCriteria({ transfers_ownership: false, purchase_option_certain: false, major_part_of_life: false, substantially_all_fv: false, specialised_asset: false });
      setNotes("");
    }
    setShowForm(true);
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Lease Classification</h1>
          <p className="text-muted-foreground text-sm">Apply IFRS 16 / ASC 842 classification criteria to each lease contract</p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4">
          {["Finance", "Operating", "Unclassified"].map(type => {
            const count = type === "Unclassified"
              ? (contracts as any[]).length - (classifications as any[]).length
              : (classifications as any[]).filter((c: any) => c.lease_type === type).length;
            return (
              <Card key={type}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{type} Leases</p>
                      <p className="text-3xl font-bold">{count}</p>
                    </div>
                    {type === "Finance" && <CheckCircle2 className="w-8 h-8 text-blue-500" />}
                    {type === "Operating" && <XCircle className="w-8 h-8 text-emerald-500" />}
                    {type === "Unclassified" && <AlertCircle className="w-8 h-8 text-amber-500" />}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Contracts table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Scale className="w-4 h-4" />Contract Classification Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contract Ref</TableHead>
                  <TableHead>Asset</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Term</TableHead>
                  <TableHead>Classification</TableHead>
                  <TableHead>Standard</TableHead>
                  <TableHead>Classified By</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(contracts as any[]).map((c: any) => {
                  const cl = (classifications as any[]).find((x: any) => x.contract_id === c.contract_id);
                  return (
                    <TableRow key={c.contract_id}>
                      <TableCell className="font-mono text-sm">{c.contract_ref}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{c.asset_description}</TableCell>
                      <TableCell><Badge variant="outline">{c.asset_type}</Badge></TableCell>
                      <TableCell>{c.term_months}m</TableCell>
                      <TableCell>
                        {cl ? (
                          <Badge variant={cl.lease_type === "Finance" ? "default" : "secondary"}>{cl.lease_type}</Badge>
                        ) : (
                          <Badge variant="outline" className="text-amber-600 border-amber-300">Pending</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">{cl?.standard ?? "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{cl?.classification_date?.slice(0, 10) ?? "—"}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" onClick={() => openClassify(c)}>
                          {cl ? "Re-classify" : "Classify"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Classification dialog */}
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Classify Lease — {selectedContract?.contract_ref}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Label>Accounting Standard:</Label>
                <Select value={standard} onValueChange={(v: any) => setStandard(v)}>
                  <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IFRS16">IFRS 16</SelectItem>
                    <SelectItem value="ASC842">ASC 842</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                {CRITERIA.map(c => (
                  <div key={c.key} className="flex items-start gap-3 p-3 rounded-lg border">
                    <Switch
                      checked={criteria[c.key]}
                      onCheckedChange={v => setCriteria(prev => ({ ...prev, [c.key]: v }))}
                    />
                    <div>
                      <p className="font-medium text-sm">{c.label}</p>
                      <p className="text-xs text-muted-foreground">{c.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Result preview */}
              <div className={`p-4 rounded-lg border-2 ${isFinance ? "border-blue-400 bg-blue-50 dark:bg-blue-950/20" : "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/20"}`}>
                <p className="font-bold text-lg">
                  {isFinance ? "🔵 Finance Lease" : "🟢 Operating Lease"}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {isFinance
                    ? "One or more criteria met — recognise ROU asset and lease liability. Depreciate ROU asset and accrue interest separately."
                    : "No criteria met — recognise ROU asset and lease liability. Single straight-line lease expense."}
                </p>
              </div>

              <div className="space-y-1">
                <Label>Notes</Label>
                <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Classification rationale..." rows={2} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button
                onClick={() => classify.mutate({ contract_id: selectedContract.contract_id, standard, notes, transfers_ownership: criteria.transfers_ownership, purchase_option_certain: criteria.purchase_option_certain, major_part_of_life: criteria.major_part_of_life, substantially_all_fv: criteria.substantially_all_fv, specialised_asset: criteria.specialised_asset })}
                disabled={classify.isPending}
              >
                {classify.isPending ? "Saving..." : "Save Classification"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
