import { useState, ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import {
  ClipboardList, AlertCircle, Clock, User, Monitor, CheckCircle2,
  XCircle, Info, ChevronRight,
} from "lucide-react";


// ── Types ─────────────────────────────────────────────────────────────────────

interface AuditEntry {
  id: number;
  action: string;
  entity: string;
  entityId?: string;
  user: string;
  timestamp: string;
  details?: string;
  status: "success" | "info" | "warning";
}

interface ErrorEntry {
  id: number;
  message: string;
  code?: string;
  user: string;
  timestamp: string;
  stack?: string;
  resolved: boolean;
}

interface ScreenHeaderProps {
  /** Unique screen identifier, e.g. "VFLSENEWLS0001P001" */
  screenId: string;
  /** Human-readable screen title */
  title: string;
  /** Optional subtitle / description */
  subtitle?: string;
  /** Optional icon to show next to the title */
  icon?: ReactNode;
  /** Optional extra actions to show in the header toolbar */
  actions?: ReactNode;
}

// ── Mock data generators (replaced by live tRPC once DB is seeded) ────────────

function mockAuditEntries(screenId: string): AuditEntry[] {
  return [
    { id: 1, action: "Viewed screen", entity: screenId, user: "Ahmed Al Rashidi", timestamp: new Date(Date.now() - 120_000).toISOString(), status: "info" },
    { id: 2, action: "Created record", entity: "Lease", entityId: "VF-2025-001", user: "Sara Mohammed", timestamp: new Date(Date.now() - 3_600_000).toISOString(), details: "New lease origination submitted for approval", status: "success" },
    { id: 3, action: "Updated record", entity: "Lease", entityId: "VF-2024-089", user: "Ahmed Al Rashidi", timestamp: new Date(Date.now() - 86_400_000).toISOString(), details: "Rent amount updated from AED 12,000 to AED 13,500", status: "success" },
    { id: 4, action: "Approved record", entity: "Invoice", entityId: "INV-2025-0042", user: "Director Finance", timestamp: new Date(Date.now() - 172_800_000).toISOString(), details: "Invoice approved and queued for payment", status: "success" },
    { id: 5, action: "Deleted record", entity: "Draft", entityId: "DRAFT-007", user: "Sara Mohammed", timestamp: new Date(Date.now() - 259_200_000).toISOString(), details: "Draft lease discarded", status: "warning" },
  ];
}

function mockErrorEntries(screenId: string): ErrorEntry[] {
  return [
    { id: 1, message: "Database connection timeout on lease query", code: "MSSQL_TIMEOUT", user: "System", timestamp: new Date(Date.now() - 7_200_000).toISOString(), resolved: true },
    { id: 2, message: "IFRS 16 computation failed: IBR rate missing", code: "IFRS16_MISSING_IBR", user: "Ahmed Al Rashidi", timestamp: new Date(Date.now() - 14_400_000).toISOString(), resolved: false },
    { id: 3, message: "PDF export failed: document too large", code: "EXPORT_SIZE_LIMIT", user: "Sara Mohammed", timestamp: new Date(Date.now() - 86_400_000).toISOString(), resolved: true },
  ];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

const STATUS_ICON: Record<string, ReactNode> = {
  success: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />,
  info:    <Info className="w-3.5 h-3.5 text-blue-400 shrink-0" />,
  warning: <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />,
};

// ── AuditLogDrawer ────────────────────────────────────────────────────────────

function AuditLogDrawer({ screenId }: { screenId: string }) {
  const entries = mockAuditEntries(screenId);
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 border-border text-muted-foreground hover:text-foreground text-xs h-7 px-2"
          title="View audit log for this screen"
        >
          <ClipboardList className="w-3.5 h-3.5" />
          Audit Log
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[420px] bg-[#111] border-l border-border p-0 flex flex-col">
        <SheetHeader className="px-5 py-4 border-b border-border bg-[#161616] shrink-0">
          <SheetTitle className="flex items-center gap-2 text-base">
            <ClipboardList className="w-4 h-4 text-[#e60000]" />
            Audit Log — {screenId}
          </SheetTitle>
          <p className="text-xs text-muted-foreground mt-0.5">All user actions on this screen, newest first</p>
        </SheetHeader>
        <ScrollArea className="flex-1">
          <div className="px-5 py-4 space-y-3">
            {entries.map((e, i) => (
              <div key={e.id}>
                <div className="flex items-start gap-2.5">
                  {STATUS_ICON[e.status]}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-foreground truncate">{e.action}</span>
                      <span className="text-xs text-muted-foreground shrink-0 flex items-center gap-1">
                        <Clock className="w-3 h-3" />{relativeTime(e.timestamp)}
                      </span>
                    </div>
                    {e.entityId && (
                      <span className="text-xs text-[#e60000] font-mono">{e.entity} · {e.entityId}</span>
                    )}
                    {e.details && (
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{e.details}</p>
                    )}
                    <div className="flex items-center gap-1 mt-1">
                      <User className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{e.user}</span>
                      <span className="text-xs text-muted-foreground">·</span>
                      <span className="text-xs text-muted-foreground">{new Date(e.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                {i < entries.length - 1 && <Separator className="mt-3 bg-border/50" />}
              </div>
            ))}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

// ── ErrorLogDrawer ────────────────────────────────────────────────────────────

function ErrorLogDrawer({ screenId }: { screenId: string }) {
  const entries = mockErrorEntries(screenId);
  const unresolvedCount = entries.filter(e => !e.resolved).length;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`gap-1.5 text-xs h-7 px-2 ${
            unresolvedCount > 0
              ? "border-red-500/40 text-red-400 hover:bg-red-500/10 hover:text-red-300"
              : "border-border text-muted-foreground hover:text-foreground"
          }`}
          title="View error log for this screen"
        >
          <AlertCircle className="w-3.5 h-3.5" />
          Errors
          {unresolvedCount > 0 && (
            <Badge className="ml-0.5 h-4 min-w-4 px-1 text-[10px] bg-red-500 text-white border-0">
              {unresolvedCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[440px] bg-[#111] border-l border-border p-0 flex flex-col">
        <SheetHeader className="px-5 py-4 border-b border-border bg-[#161616] shrink-0">
          <SheetTitle className="flex items-center gap-2 text-base">
            <AlertCircle className="w-4 h-4 text-red-400" />
            Error Log — {screenId}
          </SheetTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            {unresolvedCount} unresolved · {entries.length} total
          </p>
        </SheetHeader>
        <ScrollArea className="flex-1">
          <div className="px-5 py-4 space-y-3">
            {entries.map((e, i) => (
              <div key={e.id}>
                <div className="flex items-start gap-2.5">
                  {e.resolved
                    ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    : <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                  }
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <span className={`text-sm font-medium ${e.resolved ? "text-muted-foreground" : "text-foreground"}`}>
                        {e.message}
                      </span>
                      <span className="text-xs text-muted-foreground shrink-0 flex items-center gap-1">
                        <Clock className="w-3 h-3" />{relativeTime(e.timestamp)}
                      </span>
                    </div>
                    {e.code && (
                      <span className="text-xs font-mono text-amber-400">{e.code}</span>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <User className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{e.user}</span>
                      <Badge
                        className={`text-[10px] h-4 px-1.5 border-0 ${
                          e.resolved ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {e.resolved ? "Resolved" : "Open"}
                      </Badge>
                    </div>
                  </div>
                </div>
                {i < entries.length - 1 && <Separator className="mt-3 bg-border/50" />}
              </div>
            ))}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

// ── ScreenHeader (main export) ────────────────────────────────────────────────

/**
 * ScreenHeader — a standardised page header for every screen in VodaLease Enterprise.
 *
 * Features:
 * - Screen ID badge (e.g. VFLSENEWLS0001P001)
 * - Page title + optional icon and subtitle
 * - Audit Log drawer (who did what and when)
 * - Error Log drawer (API/form errors with unresolved count badge)
 * - Optional extra action buttons
 *
 * Usage:
 *   <ScreenHeader
 *     screenId="VFLSENEWLS0001P001"
 *     title="New Lease Origination"
 *     subtitle="IFRS 16 compliant lease creation"
 *     icon={<FileText className="w-6 h-6 text-[#e60000]" />}
 *     actions={<Button>Export</Button>}
 *   />
 */
export function ScreenHeader({
  screenId,
  title,
  subtitle,
  icon,
  actions,
}: ScreenHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      {/* Left: title block */}
      <div className="flex items-start gap-3 min-w-0">
        {icon && (
          <div className="mt-0.5 shrink-0">{icon}</div>
        )}
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold text-foreground leading-tight">{title}</h1>
            <Badge
              variant="outline"
              className="font-mono text-[10px] px-1.5 py-0 h-5 border-border text-muted-foreground bg-muted/30 shrink-0"
            >
              <Monitor className="w-2.5 h-2.5 mr-1" />
              {screenId}
            </Badge>
          </div>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>

      {/* Right: toolbar */}
      <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
        <AuditLogDrawer screenId={screenId} />
        <ErrorLogDrawer screenId={screenId} />
        {actions}
      </div>
    </div>
  );
}

export default ScreenHeader;
