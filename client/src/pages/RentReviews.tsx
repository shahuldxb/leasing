import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { RefreshCw, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { ScreenHeader } from "@/components/ScreenHeader";

const fmt = (n: any) => n != null ? `AED ${Number(n).toLocaleString("en-AE", { maximumFractionDigits: 0 })}` : "—";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  OVERDUE: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  COMPLETED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  IN_PROGRESS: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
};

export default function RentReviews() {
  const [completing, setCompleting] = useState<any>(null);
  const [completeForm, setCompleteForm] = useState({ agreed_new_rent: 0, effective_date: "", notes: "" });

  const { data: reviews = [], refetch } = trpc.rentReview.list.useQuery();

  const complete = trpc.rentReview.complete.useMutation({
    onSuccess: () => { refetch(); setCompleting(null); toast.success("Rent review completed"); },
    onError: (err: any) => toast.error(err.message),
  });

  const pending = (reviews as any[]).filter((r: any) => r.status === "PENDING" || r.status === "OVERDUE").length;
  const overdue = (reviews as any[]).filter((r: any) => r.status === "OVERDUE").length;

  return (
    <DashboardLayout>
      <ScreenHeader
  screenId="VFLRNTRV0001P001"
  title="Rent Reviews"
  subtitle="Scheduled rent review tracking and completion"
/>
    </DashboardLayout>
  );
}
