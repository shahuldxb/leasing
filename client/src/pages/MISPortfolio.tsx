import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { TrendingUp } from "lucide-react";
import { ScreenHeader } from "@/components/ScreenHeader";

const COLORS = ["#e60000","#ff6666","#ff9999","#ffcccc","#990000"];

export default function MISPortfolio() {
  const [aiRecord, setAiRecord] = useState<Record<string, unknown> | null>(null);
  const { data: analytics } = trpc.mis.getPortfolioAnalytics.useQuery();
  const maturity: any[] = (analytics as any)?.maturity_profile ?? [];
  const byType: any[] = (analytics as any)?.by_asset_type ?? [];

  return (
    <DashboardLayout>
      <ScreenHeader
  screenId="VFLMISPRT0001P001"
  title="Portfolio Health"
  subtitle="Portfolio health metrics and concentration analysis"

          screenType="mis_portfolio"
          onAIData={(rows) => setAiRecord(rows[0] ?? null)}
        />
    </DashboardLayout>
  );
}
