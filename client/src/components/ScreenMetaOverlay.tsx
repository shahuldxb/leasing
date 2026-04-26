/**
 * ScreenMetaOverlay — Global Alt+1/2/3 keyboard shortcut overlay
 *
 * Alt+1 → Stored Procedures & DB Tables involved in this screen
 * Alt+2 → Accounting Standards applicable to this screen
 * Alt+3 → Computation Techniques used by this screen
 *
 * Usage: Mount <ScreenMetaOverlay screenId="VFLSENEWLS0001P001" /> inside any page.
 * The overlay listens globally and shows a floating panel when triggered.
 */
import { useEffect, useState, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Database, BookOpen, Calculator, X, Keyboard } from "lucide-react";

type Mode = 1 | 2 | 3 | null;

interface Props {
  screenId: string;
}

const MODE_CONFIG = {
  1: {
    icon: Database,
    title: "Stored Procedures & Tables",
    subtitle: "Database objects powering this screen",
    color: "text-blue-400",
    bgColor: "border-blue-500/40 bg-blue-950/80",
    key: "Alt+1",
  },
  2: {
    icon: BookOpen,
    title: "Accounting Standards",
    subtitle: "Applicable standards for this screen",
    color: "text-emerald-400",
    bgColor: "border-emerald-500/40 bg-emerald-950/80",
    key: "Alt+2",
  },
  3: {
    icon: Calculator,
    title: "Computation Techniques",
    subtitle: "Algorithms and methods used",
    color: "text-amber-400",
    bgColor: "border-amber-500/40 bg-amber-950/80",
    key: "Alt+3",
  },
} as const;

export function ScreenMetaOverlay({ screenId }: Props) {
  const [mode, setMode] = useState<Mode>(null);

  const { data: meta } = trpc.screenMeta.get.useQuery(
    { screenId },
    { enabled: !!screenId, staleTime: 60_000 }
  );

  const handleKey = useCallback((e: KeyboardEvent) => {
    if (!e.altKey) return;
    if (e.key === "1") { e.preventDefault(); setMode(m => m === 1 ? null : 1); }
    if (e.key === "2") { e.preventDefault(); setMode(m => m === 2 ? null : 2); }
    if (e.key === "3") { e.preventDefault(); setMode(m => m === 3 ? null : 3); }
    if (e.key === "Escape") setMode(null);
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  if (!mode) return null;

  const cfg = MODE_CONFIG[mode];
  const Icon = cfg.icon;

  const getContent = () => {
    if (!meta) return <p className="text-sm text-muted-foreground">No metadata registered for this screen.</p>;

    if (mode === 1) {
      const sps = (meta.stored_procedures as string | null)?.split(",").map(s => s.trim()).filter(Boolean) ?? [];
      const tables = (meta.db_tables as string | null)?.split(",").map(s => s.trim()).filter(Boolean) ?? [];
      return (
        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Stored Procedures</p>
            <div className="flex flex-wrap gap-2">
              {sps.length > 0 ? sps.map(sp => (
                <Badge key={sp} variant="outline" className="font-mono text-xs text-blue-300 border-blue-500/40 bg-blue-950/50">
                  {sp}
                </Badge>
              )) : <span className="text-sm text-muted-foreground">None registered</span>}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Database Tables</p>
            <div className="flex flex-wrap gap-2">
              {tables.length > 0 ? tables.map(t => (
                <Badge key={t} variant="outline" className="font-mono text-xs text-cyan-300 border-cyan-500/40 bg-cyan-950/50">
                  {t}
                </Badge>
              )) : <span className="text-sm text-muted-foreground">None registered</span>}
            </div>
          </div>
          <div className="pt-2 border-t border-white/10">
            <p className="text-xs text-muted-foreground">
              Screen ID: <span className="font-mono text-white/70">{meta.screen_id as string}</span>
              {" · "}Module: <span className="text-white/70">{meta.module as string}</span>
              {" · "}Sub-module: <span className="text-white/70">{meta.sub_module as string}</span>
            </p>
          </div>
        </div>
      );
    }

    if (mode === 2) {
      const standards = (meta.accounting_standards as string | null)?.split(",").map(s => s.trim()).filter(Boolean) ?? [];
      const STD_COLORS: Record<string, string> = {
        "IFRS 16": "text-emerald-300 border-emerald-500/40 bg-emerald-950/50",
        "ASC 842": "text-blue-300 border-blue-500/40 bg-blue-950/50",
        "IPSAS 43": "text-purple-300 border-purple-500/40 bg-purple-950/50",
        "IAS 1": "text-amber-300 border-amber-500/40 bg-amber-950/50",
        "IAS 7": "text-orange-300 border-orange-500/40 bg-orange-950/50",
        "IAS 16": "text-pink-300 border-pink-500/40 bg-pink-950/50",
      };
      return (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {standards.length > 0 ? standards.map(std => {
              const colorKey = Object.keys(STD_COLORS).find(k => std.startsWith(k));
              const cls = colorKey ? STD_COLORS[colorKey] : "text-white/70 border-white/20 bg-white/5";
              return (
                <Badge key={std} variant="outline" className={`text-sm font-semibold px-3 py-1 ${cls}`}>
                  {std}
                </Badge>
              );
            }) : <span className="text-sm text-muted-foreground">No standards registered</span>}
          </div>
          <div className="pt-2 border-t border-white/10 text-xs text-muted-foreground space-y-1">
            <p><span className="text-emerald-400 font-semibold">IFRS 16</span> — International Financial Reporting Standard for Leases (IASB)</p>
            <p><span className="text-blue-400 font-semibold">ASC 842</span> — US GAAP Lease Accounting Standard (FASB)</p>
            <p><span className="text-purple-400 font-semibold">IPSAS 43</span> — Public Sector Lease Standard (IPSASB, effective 2025)</p>
          </div>
        </div>
      );
    }

    if (mode === 3) {
      const techniques = (meta.computation_techniques as string | null)?.split(",").map(s => s.trim()).filter(Boolean) ?? [];
      return (
        <div className="space-y-3">
          <div className="space-y-2">
            {techniques.length > 0 ? techniques.map((t, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-amber-400 font-mono text-xs mt-0.5 shrink-0">{String(i + 1).padStart(2, "0")}</span>
                <p className="text-sm text-white/80">{t}</p>
              </div>
            )) : <span className="text-sm text-muted-foreground">No techniques registered</span>}
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] w-[480px] max-w-[calc(100vw-2rem)] animate-in slide-in-from-bottom-4 duration-200">
      <Card className={`border ${cfg.bgColor} backdrop-blur-md shadow-2xl`}>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className={`h-5 w-5 ${cfg.color}`} />
            <div>
              <CardTitle className={`text-sm ${cfg.color}`}>{cfg.title}</CardTitle>
              <p className="text-xs text-muted-foreground">{cfg.subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {([1, 2, 3] as const).map(n => (
                <button
                  key={n}
                  onClick={() => setMode(m => m === n ? null : n)}
                  className={`text-xs px-2 py-0.5 rounded font-mono border transition-colors ${
                    mode === n
                      ? "bg-white/20 border-white/40 text-white"
                      : "bg-white/5 border-white/10 text-white/40 hover:text-white/70"
                  }`}
                >
                  Alt+{n}
                </button>
              ))}
            </div>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setMode(null)}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {getContent()}
          <div className="mt-3 pt-2 border-t border-white/10 flex items-center gap-1 text-xs text-white/30">
            <Keyboard className="h-3 w-3" />
            <span>Alt+1 SPs/Tables · Alt+2 Standards · Alt+3 Techniques · Esc to close</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
