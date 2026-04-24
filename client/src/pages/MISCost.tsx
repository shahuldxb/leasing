import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from "recharts";
import { BarChart2 } from "lucide-react";
import { ScreenHeader } from "@/components/ScreenHeader";

export default function MISCost() {
  const { data: analytics } = trpc.mis.getPortfolioAnalytics.useQuery();
  const byType: any[] = (analytics as any)?.by_asset_type ?? [];

  const costData = byType.map((t: any) => ({
    name: t.asset_type ?? t.name,
    budget: Number(t.budget ?? t.total_liability ?? 0) * 1.1,
    actual: Number(t.total_liability ?? t.value ?? 0),
  }));

  return (
    <DashboardLayout>
      <ScreenHeader
  screenId="VFLMISCST0001P001"
  title="Cost Performance"
  subtitle="Cost vs budget performance analytics"
/>
    </DashboardLayout>
  );
}
