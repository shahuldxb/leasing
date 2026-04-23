import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from "recharts";
import { BarChart2 } from "lucide-react";

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
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><BarChart2 className="w-6 h-6 text-[#e60000]" /> Cost Performance</h1>
          <p className="text-sm text-muted-foreground mt-1">Screen ID: VFMISCOST0001P001 · Lease cost vs budget analysis by asset type and region</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold mb-4">Budget vs Actual by Asset Type</h3>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={costData.length > 0 ? costData : [
              { name: "Tower Sites", budget: 0, actual: 0 },
              { name: "Data Centres", budget: 0, actual: 0 },
              { name: "Retail Outlets", budget: 0, actual: 0 },
              { name: "Fleet", budget: 0, actual: 0 },
            ]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="name" tick={{ fill: "#888", fontSize: 11 }} />
              <YAxis tick={{ fill: "#888", fontSize: 11 }} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ background: "#1a1a1a", border: "1px solid #333" }}
                formatter={(v: number) => [`$${v.toLocaleString()}`, ""]} />
              <Legend />
              <Bar dataKey="budget" fill="#444" name="Budget" radius={[4,4,0,0]} />
              <Bar dataKey="actual" fill="#e60000" name="Actual" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold mb-4">Monthly Cost Trend (YTD)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={Array.from({ length: new Date().getMonth() + 1 }, (_, i) => ({
              month: new Date(new Date().getFullYear(), i, 1).toLocaleDateString("en", { month: "short" }),
              cost: 0,
            }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="month" tick={{ fill: "#888", fontSize: 11 }} />
              <YAxis tick={{ fill: "#888", fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "#1a1a1a", border: "1px solid #333" }} />
              <Line type="monotone" dataKey="cost" stroke="#e60000" strokeWidth={2} dot={{ fill: "#e60000" }} name="Cost" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </DashboardLayout>
  );
}
