import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, Users, Monitor, Shield, Database } from "lucide-react";
import { toast } from "sonner";
import { ScreenHeader } from "@/components/ScreenHeader";

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState("users");
  const [thresholdForm, setThresholdForm] = useState({ module: "", minAmount: "", maxAmount: "", approverRole: "" });
  const [thresholdOpen, setThresholdOpen] = useState(false);

  const { data: screenRegistry } = trpc.compliance.getScreenRegistry.useQuery();
  const { data: thresholds, refetch: refetchThresholds } = trpc.workflow.getMCThresholds.useQuery();
  const { data: kpis } = trpc.mis.getDashboardKPIs.useQuery();

  const screens: any[] = Array.isArray(screenRegistry) ? screenRegistry : [];
  const thresholdList: any[] = Array.isArray(thresholds) ? thresholds : [];

  const MODULES = ["Lease","Payables","Contract","BankRecon","Cheque","Workflow"];
  const ROLES = ["Manager","Senior Manager","Director","CFO","CEO"];

  return (
    <DashboardLayout>
      <ScreenHeader
  screenId="VFLADMIN0001P001"
  title="User Management & RBAC"
  subtitle="User accounts, roles, and permission management"
/>
    </DashboardLayout>
  );
}
