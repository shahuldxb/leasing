import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { TrendingUp } from "lucide-react";

const COLORS = ["#e60000","#ff6666","#ff9999","#ffcccc","#990000"];

export default function MISPortfolio() {
  const { data: analytics } = trpc.mis.getPortfolioAnalytics.useQuery();
  const maturity: any[] = (analytics as any)?.maturity_profile ?? [];
  const byType: any[] = (analytics as any)?.by_asset_type ?? [];

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><TrendingUp className="w-6 h-6 text-[#e60000]" /> Portfolio Health</h1>
          <p className="text-sm text-muted-foreground mt-1">Screen ID: VFMISPORT0001P001 · Comprehensive portfolio analytics and health metrics</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="font-semibold mb-4">Lease Maturity Profile</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={maturity.length > 0 ? maturity : [
                { period: "0-1 yr", count: 0, liability: 0 },
                { period: "1-3 yr", count: 0, liability: 0 },
                { period: "3-5 yr", count: 0, liability: 0 },
                { period: "5+ yr", count: 0, liability: 0 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="period" tick={{ fill: "#888", fontSize: 12 }} />
                <YAxis tick={{ fill: "#888", fontSize: 12 }} />
                <Tooltip contentStyle={{ background: "#1a1a1a", border: "1px solid #333" }} />
                <Bar dataKey="count" fill="#e60000" radius={[4,4,0,0]} name="Leases" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="font-semibold mb-4">Portfolio by Asset Type</h3>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={byType.length > 0 ? byType : [{ name: "No Data", value: 1 }]}
                  cx="50%" cy="50%" innerRadius={60} outerRadius={100}
                  dataKey="value" nameKey="name">
                  {(byType.length > 0 ? byType : [{ name: "No Data", value: 1 }]).map((_: any, i: number) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip contentStyle={{ background: "#1a1a1a", border: "1px solid #333" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Total Portfolio Value", value: (analytics as any)?.total_liability ?? 0, prefix: "$" },
            { label: "Weighted Avg Remaining Term", value: (analytics as any)?.avg_remaining_term ?? 0, suffix: " yrs" },
            { label: "Leases Expiring < 1 Year", value: (analytics as any)?.expiring_soon ?? 0, suffix: "" },
            { label: "Average Discount Rate", value: ((analytics as any)?.avg_discount_rate ?? 0).toFixed(2), suffix: "%" },
          ].map(k => (
            <div key={k.label} className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs text-muted-foreground">{k.label}</p>
              <p className="text-xl font-bold text-[#e60000] mt-1">{k.prefix}{typeof k.value === "number" ? k.value.toLocaleString() : k.value}{k.suffix}</p>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
