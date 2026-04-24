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
import { CheckCircle2, XCircle, AlertCircle, Scale } from "lucide-react";
import { toast } from "sonner";
import { ScreenHeader } from "@/components/ScreenHeader";
import SlidePanel from "@/components/SlidePanel";

const CRITERIA = [
  { key: "transfers_ownership", label: "Transfer of Ownership", desc: "Does the lease transfer ownership of the underlying asset to the lessee by the end of the lease term? (IFRS 16 Appendix A)" },
  { key: "purchase_option_certain", label: "Purchase Option Reasonably Certain", desc: "Does the lessee have an option to purchase the underlying asset and is reasonably certain to exercise it? (IFRS 16.19a)" },
  { key: "major_part_of_life", label: "Major Part of Economic Life", desc: "Does the lease term cover the major part of the economic life of the underlying asset? (IFRS 16.B34)" },
  { key: "substantially_all_fv", label: "Substantially All Fair Value", desc: "Is the present value of lease payments substantially all of the fair value of the underlying asset? (IFRS 16.B34)" },
  { key: "specialised_asset", label: "Specialised Asset", desc: "Is the underlying asset of such a specialised nature that only the lessee can use it without major modifications? (IFRS 16.B34)" },
];

export default function LeaseClassification() {
  const [showForm, setShowForm] = useState(false);
  const [aiRecord, setAiRecord] = useState<Record<string, unknown> | null>(null);
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
      <ScreenHeader
  screenId="VFLLEACLS0001P001"
  title="Lease Classification"
  subtitle="Finance vs operating lease classification engine"

          screenType="lease_classification"
          onAIData={(rows) => setAiRecord(rows[0] ?? null)}
        />
    </DashboardLayout>
  );
}
