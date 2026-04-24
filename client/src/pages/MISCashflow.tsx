import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from "recharts";
import { DollarSign } from "lucide-react";
import { ScreenHeader } from "@/components/ScreenHeader";

export default function MISCashflow() {
  const { data: forecast } = trpc.mis.getCashFlowForecast.useQuery({ months: 12 });
  const rows: any[] = Array.isArray(forecast) ? forecast : (forecast as any)?.forecast ?? [];

  const chartData = rows.map((r: any) => ({
    month: r.period ?? r.month,
    principal: Number(r.principal_payment ?? 0),
    interest: Number(r.interest_expense ?? 0),
    total: Number(r.total_payment ?? 0),
  }));

  const totalForecast = chartData.reduce((s, r) => s + r.total, 0);

  return (
    <DashboardLayout>
      <ScreenHeader
  screenId="VFLMISCSH0001P001"
  title="Cash Flow Forecast"
  subtitle="Portfolio cash flow projection and analysis"
/>
    </DashboardLayout>
  );
}
