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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Bell, Clock, Mail } from "lucide-react";
import { toast } from "sonner";
import { ScreenHeader } from "@/components/ScreenHeader";

const ALERT_TYPES = ["EXPIRY","RENEWAL","RENT_REVIEW","BREAK_CLAUSE","INSURANCE_EXPIRY","PAYMENT_DUE","REMEASUREMENT","CUSTOM"];
const FREQ = ["DAILY","WEEKLY","MONTHLY","QUARTERLY"];
const STATUS_COLORS: Record<string, string> = { ACTIVE: "bg-emerald-500", PAUSED: "bg-amber-500", DRAFT: "bg-gray-500" };

export default function AlertsReports() {
  const [alertOpen, setAlertOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [alertForm, setAlertForm] = useState({ event_type: "EXPIRY", days_before: 30, recipient_roles: "", is_active: true, email_template: "" });
  const [reportForm, setReportForm] = useState({ report_name: "", report_type: "LEASE_REGISTER", cron_expression: "0 0 8 1 * *", recipients: "", output_format: "EXCEL" as "EXCEL" | "CSV" | "PDF" });

  const { data: alerts = [], refetch: refetchAlerts } = trpc.emailAlerts.list.useQuery();
  const { data: reports = [], refetch: refetchReports } = trpc.scheduledReports.list.useQuery();

  const saveAlert = trpc.emailAlerts.upsert.useMutation({ onSuccess: () => { refetchAlerts(); setAlertOpen(false); toast.success("Alert rule saved"); }, onError: (e: any) => toast.error(e.message) });
  const saveReport = trpc.scheduledReports.upsert.useMutation({ onSuccess: () => { refetchReports(); setReportOpen(false); toast.success("Scheduled report saved"); }, onError: (e: any) => toast.error(e.message) });
  const runReport = trpc.scheduledReports.runNow.useMutation({ onSuccess: () => toast.success("Report queued for delivery"), onError: (e: any) => toast.error(e.message) });

  return (
    <DashboardLayout>
      <ScreenHeader
  screenId="VFLALRPT0001P001"
  title="Alerts & Reports"
  subtitle="Scheduled reports and alert configuration"
/>
    </DashboardLayout>
  );
}
