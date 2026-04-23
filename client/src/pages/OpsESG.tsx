import DashboardLayout from "@/components/DashboardLayout";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { Leaf } from "lucide-react";

const ESG_DATA = [
  { month: "Jan", carbon: 0, energy: 0, water: 0 },
  { month: "Feb", carbon: 0, energy: 0, water: 0 },
  { month: "Mar", carbon: 0, energy: 0, water: 0 },
  { month: "Apr", carbon: 0, energy: 0, water: 0 },
];

const ESG_METRICS = [
  { label: "Total Carbon Footprint", value: "0 tCO₂e", desc: "YTD across all leased assets", color: "text-green-400" },
  { label: "Energy Consumption", value: "0 MWh", desc: "YTD electricity usage", color: "text-blue-400" },
  { label: "Water Usage", value: "0 kL", desc: "YTD water consumption", color: "text-cyan-400" },
  { label: "ESG Score", value: "N/A", desc: "Composite sustainability score", color: "text-amber-400" },
];

export default function OpsESG() {
  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Leaf className="w-6 h-6 text-green-400" /> Sustainability & ESG Reporting</h1>
          <p className="text-sm text-muted-foreground mt-1">Screen ID: VFOPSESG0001P001 · Environmental, Social, and Governance metrics for leased assets</p>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {ESG_METRICS.map(m => (
            <div key={m.label} className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs text-muted-foreground">{m.label}</p>
              <p className={`text-xl font-bold mt-1 ${m.color}`}>{m.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{m.desc}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="font-semibold mb-4">Carbon Emissions by Month</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={ESG_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="month" tick={{ fill: "#888", fontSize: 11 }} />
                <YAxis tick={{ fill: "#888", fontSize: 11 }} />
                <Tooltip contentStyle={{ background: "#1a1a1a", border: "1px solid #333" }} />
                <Bar dataKey="carbon" fill="#22c55e" name="tCO₂e" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="font-semibold mb-4">Energy Consumption Trend</h3>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={ESG_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="month" tick={{ fill: "#888", fontSize: 11 }} />
                <YAxis tick={{ fill: "#888", fontSize: 11 }} />
                <Tooltip contentStyle={{ background: "#1a1a1a", border: "1px solid #333" }} />
                <Line type="monotone" dataKey="energy" stroke="#3b82f6" strokeWidth={2} dot={{ fill: "#3b82f6" }} name="MWh" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
          <p className="text-sm text-amber-400">ESG data collection requires integration with asset monitoring systems. Connect your energy management platform to populate this dashboard with live data.</p>
        </div>
      </div>
    </DashboardLayout>
  );
}
