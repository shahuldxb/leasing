import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from "recharts";
import { DollarSign } from "lucide-react";

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
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><DollarSign className="w-6 h-6 text-[#e60000]" /> Cash Flow Forecast</h1>
          <p className="text-sm text-muted-foreground mt-1">Screen ID: VFMISCASH0001P001 · 12-month lease payment cash flow projection</p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-[#e60000]/10 border border-[#e60000]/20 rounded-xl p-4">
            <p className="text-xs text-muted-foreground">Total 12-Month Forecast</p>
            <p className="text-2xl font-bold text-[#e60000] mt-1">${totalForecast.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
            <p className="text-xs text-muted-foreground">Avg Monthly Payment</p>
            <p className="text-2xl font-bold text-blue-400 mt-1">${(totalForecast / 12).toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
          </div>
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
            <p className="text-xs text-muted-foreground">Periods Forecasted</p>
            <p className="text-2xl font-bold text-amber-400 mt-1">{rows.length}</p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold mb-4">Monthly Cash Flow Breakdown</h3>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={chartData.length > 0 ? chartData : Array.from({ length: 12 }, (_, i) => ({
              month: new Date(Date.now() + i * 30 * 86400000).toLocaleDateString("en", { month: "short", year: "2-digit" }),
              principal: 0, interest: 0, total: 0
            }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="month" tick={{ fill: "#888", fontSize: 11 }} />
              <YAxis tick={{ fill: "#888", fontSize: 11 }} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ background: "#1a1a1a", border: "1px solid #333" }}
                formatter={(v: number) => [`$${v.toLocaleString()}`, ""]} />
              <Legend />
              <Bar dataKey="principal" fill="#e60000" name="Principal" stackId="a" radius={[0,0,0,0]} />
              <Bar dataKey="interest" fill="#ff6666" name="Interest" stackId="a" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold mb-4">Cumulative Cash Flow</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData.length > 0 ? chartData.map((r, i) => ({
              ...r, cumulative: chartData.slice(0, i+1).reduce((s, x) => s + x.total, 0)
            })) : []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="month" tick={{ fill: "#888", fontSize: 11 }} />
              <YAxis tick={{ fill: "#888", fontSize: 11 }} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ background: "#1a1a1a", border: "1px solid #333" }}
                formatter={(v: number) => [`$${v.toLocaleString()}`, "Cumulative"]} />
              <Area type="monotone" dataKey="cumulative" stroke="#e60000" fill="#e60000" fillOpacity={0.1} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </DashboardLayout>
  );
}
