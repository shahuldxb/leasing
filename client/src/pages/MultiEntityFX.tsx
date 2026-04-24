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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Globe, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { ScreenHeader } from "@/components/ScreenHeader";
import SlidePanel from "@/components/SlidePanel";

const fmt = (n: any, ccy = "AED") => n != null ? `${ccy} ${Number(n).toLocaleString()}` : "—";

export default function MultiEntityFX() {
  const [entityOpen, setEntityOpen] = useState(false);
  const [aiRecord, setAiRecord] = useState<Record<string, unknown> | null>(null);
  const [fxOpen, setFxOpen] = useState(false);
  const [entityForm, setEntityForm] = useState({ entity_code: "", entity_name: "", country: "AE", currency: "AED", functional_currency: "AED", is_consolidation_entity: false, parent_entity_id: undefined as number | undefined });
  const [fxForm, setFxForm] = useState({ contract_id: 0, from_currency: "USD", to_currency: "AED", exchange_rate: 0, translation_date: "", rou_asset_fc: 0, lease_liability_fc: 0 });

  const { data: entities = [], refetch: refetchEntities } = trpc.multiEntity.listEntities.useQuery();
  const { data: translations = [], refetch: refetchFx } = trpc.fxAccounting.list.useQuery();
  const { data: contractsData } = trpc.lease.getLeaseRegister.useQuery({ status: "Active" });
  const contracts = (contractsData as any)?.rows ?? [];

  const saveEntity = trpc.multiEntity.upsertEntity.useMutation({ onSuccess: () => { refetchEntities(); setEntityOpen(false); toast.success("Entity saved"); }, onError: (e: any) => toast.error(e.message) });
  const saveFx = trpc.fxAccounting.translate.useMutation({ onSuccess: () => { refetchFx(); setFxOpen(false); toast.success("FX translation recorded"); }, onError: (e: any) => toast.error(e.message) });

  const CURRENCIES = ["AED","USD","EUR","GBP","SAR","KWD","BHD","QAR","OMR","EGP"];

  return (
    <DashboardLayout>
      <ScreenHeader
  screenId="VFLMULTFX0001P001"
  title="Multi-Entity & FX"
  subtitle="Multi-entity consolidation and FX accounting"

          screenType="multi_entity_fx"
          onAIData={(rows) => setAiRecord(rows[0] ?? null)}
        />
    </DashboardLayout>
  );
}
