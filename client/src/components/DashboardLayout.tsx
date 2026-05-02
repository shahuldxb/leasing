import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { getLoginUrl } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  AlertTriangle, LayoutDashboard, LogOut, PanelLeft, FileText,
  BarChart3, Shield, Settings, Bell,
  FileCheck, TrendingUp, ChevronDown, ChevronRight,
  Sparkles, Calculator, Eye, EyeOff, Layers
} from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from './DashboardLayoutSkeleton';
import { Button } from "./ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { trpc } from "@/lib/trpc";
import { ScreenErrorBoundary } from "@/components/ScreenErrorBoundary";

type NavItem = {
  icon: React.ElementType;
  label: string;
  path?: string;
  children?: { label: string; path: string }[];
};

// ═══════════════════════════════════════════════════════════════════════════════
// CORE MENU — 5 logical sections following the accountant's workflow
// ═══════════════════════════════════════════════════════════════════════════════
const coreMenuItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  {
    icon: FileText, label: "Lease Portfolio",
    children: [
      { label: "Lease Register",       path: "/leases" },
      { label: "New Lease",            path: "/leases/new" },
      { label: "Lease Classification", path: "/accounting/classification" },
      { label: "Lessor Master",        path: "/lessor-master" },
      { label: "Lessee Master",        path: "/lessee-master" },
      { label: "Sub-Asset Registry",   path: "/sub-asset-registry" },
      { label: "Transaction Centre",   path: "/leases/transaction-centre" },
    ],
  },
  {
    icon: Calculator, label: "Accounting",
    children: [
      { label: "Amortisation Schedule",     path: "/leases/amortisation" },
      { label: "Journal Voucher Register",  path: "/accounting/journal-voucher" },
      { label: "Period-End Close",          path: "/accounting/period-close" },
      { label: "GL Postings",               path: "/accounting/transaction-engine" },
      { label: "ERP Export",                path: "/accounting/erp-export" },
      { label: "Chart of Accounts",         path: "/accounting/settings" },
    ],
  },
  {
    icon: Shield, label: "Compliance & Reporting",
    children: [
      { label: "IFRS 16 Disclosure",       path: "/accounting/disclosure" },
      { label: "Disclosure Notes",          path: "/accounting/disclosure-notes" },
      { label: "Roll-Forward Report",       path: "/accounting/roll-forward" },
      { label: "IAS 17 vs IFRS 16",         path: "/accounting/ias17-comparison" },
      { label: "Disclosure Pack",           path: "/accounting/disclosure-pack" },
      { label: "Standards Paper",           path: "/compliance/standards-paper" },
    ],
  },
  {
    icon: Settings, label: "Settings",
    children: [
      { label: "IBR Library",              path: "/accounting/ibr" },
      { label: "Accounting Settings",      path: "/accounting/settings" },
      { label: "Notification Settings",    path: "/admin/notifications" },
      { label: "Audit Log",                path: "/compliance/audit" },
      { label: "Error Log",                path: "/compliance/errors" },
      { label: "Administration",           path: "/admin" },
    ],
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// ADVANCED MENU — Hidden by default, shown via toggle
// ═══════════════════════════════════════════════════════════════════════════════
const advancedMenuItems: NavItem[] = [
  {
    icon: Sparkles, label: "Advanced Lease",
    children: [
      { label: "Remeasurement",         path: "/accounting/remeasurement" },
      { label: "CPI Escalation",        path: "/accounting/cpi" },
      { label: "Exemptions",            path: "/accounting/exemptions" },
      { label: "FX Revaluation",        path: "/accounting/fx-revaluation" },
      { label: "Modification Wizard",   path: "/leases/modification-wizard" },
      { label: "Variable Rent",         path: "/accounting/variable-rent" },
      { label: "Sub-Leases",            path: "/leases/sub-leases" },
      { label: "Rent Reviews",          path: "/leases/rent-reviews" },
      { label: "Security Deposits",     path: "/leases/security-deposits" },
      { label: "Critical Dates",        path: "/leases/critical-dates" },
    ],
  },
  {
    icon: Layers, label: "Multi-Standard & Bulk",
    children: [
      { label: "Multi-Standard (IFRS/ASC/IPSAS)", path: "/accounting/multi-standard" },
      { label: "ASC 842",               path: "/accounting/asc842" },
      { label: "Bulk Operations",       path: "/accounting/bulk" },
      { label: "Consolidation",         path: "/accounting/consolidation" },
      { label: "Hedge Accounting",      path: "/accounting/hedge" },
    ],
  },
  {
    icon: BarChart3, label: "Analytics & Planning",
    children: [
      { label: "Portfolio Health",      path: "/mis/portfolio" },
      { label: "Cash Flow Forecast",    path: "/mis/cashflow" },
      { label: "Budget vs Actual",      path: "/accounting/budget-vs-actual" },
      { label: "Maturity Analysis",     path: "/accounting/maturity" },
      { label: "Scenario Modelling",    path: "/scenarios" },
      { label: "Report Builder",        path: "/reports" },
      { label: "AI Query Panel",        path: "/mis/ai-query" },
    ],
  },
  {
    icon: FileCheck, label: "Contracts",
    children: [
      { label: "Contract Register",     path: "/contracts" },
      { label: "Metadata Templates",    path: "/contracts/metadata-templates" },
      { label: "Master Contracts",      path: "/contracts/msc" },
      { label: "Documents",             path: "/contracts/documents" },
      { label: "Milestones",            path: "/contracts/milestones" },
      { label: "Modifications",         path: "/contracts/modifications" },
    ],
  },
  {
    icon: Bell, label: "Alerts & Automation",
    children: [
      { label: "Alert Centre",          path: "/alerts" },
      { label: "Alert Rules",           path: "/admin/alerts-reports" },
      { label: "Scheduled Reports",     path: "/admin/scheduled-reports" },
    ],
  },
];

// Combined for route matching
const menuItems: NavItem[] = [...coreMenuItems, ...advancedMenuItems];

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 280;
const MIN_WIDTH = 200;
const MAX_WIDTH = 480;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) {
    return <DashboardLayoutSkeleton />
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full">
          <div className="flex flex-col items-center gap-6">
            <h1 className="text-2xl font-semibold tracking-tight text-center">
              Sign in to continue
            </h1>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Access to this dashboard requires authentication. Continue to launch the login flow.
            </p>
          </div>
          <Button
            onClick={() => {
              window.location.href = getLoginUrl();
            }}
            size="lg"
            className="w-full shadow-lg hover:shadow-xl transition-all"
          >
            Sign in
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": `${sidebarWidth}px`,
        } as CSSProperties
      }
    >
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

type DashboardLayoutContentProps = {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
};

function DashboardLayoutContent({
  children,
  setSidebarWidth,
}: DashboardLayoutContentProps) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const activeMenuItem = menuItems.find(item => item.path === location);
  const isMobile = useIsMobile();

  // ── Renewal Due Badge ────────────────────────────────────────────────────
  const { data: renewalDueData } = trpc.lease.getRenewalDueCount.useQuery(undefined, {
    refetchInterval: 5 * 60 * 1000, // refresh every 5 minutes
    staleTime: 2 * 60 * 1000,
  });
  const renewalDueCount = renewalDueData?.count ?? 0;

  const checkAndNotify = trpc.lease.checkAndNotifyRenewalDue.useMutation();
  const hasCheckedRef = useRef(false);
  useEffect(() => {
    if (!hasCheckedRef.current && user) {
      hasCheckedRef.current = true;
      checkAndNotify.mutate();
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isCollapsed) {
      setIsResizing(false);
    }
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar
          collapsible="icon"
          className="border-r-0"
          disableTransition={isResizing}
        >
          <SidebarHeader className="h-16 justify-center">
            <div className="flex items-center gap-3 px-2 transition-all w-full">
              <button
                onClick={toggleSidebar}
                className="h-8 w-8 flex items-center justify-center hover:bg-accent rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
                aria-label="Toggle navigation"
              >
                <PanelLeft className="h-4 w-4 text-muted-foreground" />
              </button>
              {!isCollapsed ? (
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-semibold tracking-tight truncate">
                    Navigation
                  </span>
                </div>
              ) : null}
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0 overflow-y-auto scrollbar-thin">
            <SidebarMenu className="px-2 py-1">
              {coreMenuItems.map(item => {
                if (item.children) {
                  const isGroupActive = item.children.some(c => location.startsWith(c.path));
                  return (
                    <Collapsible key={item.label} defaultOpen={isGroupActive}>
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton
                            isActive={isGroupActive}
                            tooltip={item.label}
                            className="h-10 transition-all font-normal w-full justify-between"
                          >
                            <div className="flex items-center gap-2">
                              <item.icon className={`h-4 w-4 ${isGroupActive ? "text-primary" : ""}`} />
                              <span>{item.label}</span>
                            </div>
                            <ChevronDown className="h-3 w-3 text-muted-foreground group-data-[state=open]:rotate-180 transition-transform" />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="ml-6 mt-0.5 mb-1 border-l border-sidebar-border pl-2 flex flex-col gap-0.5">
                            {item.children.map(child => (
                              <button
                                key={child.label}
                                onClick={() => setLocation(child.path)}
                                className={`text-left text-sm px-2 py-1.5 rounded-md transition-colors w-full flex items-center justify-between ${
                                  location === child.path
                                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                                }`}
                              >
                                <span>{child.label}</span>
                                {child.path === "/leases/renewal-engine" && renewalDueCount > 0 && (
                                  <span className="ml-1.5 inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold leading-none">
                                    {renewalDueCount > 99 ? "99+" : renewalDueCount}
                                  </span>
                                )}
                              </button>
                            ))}
                          </div>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  );
                }
                const isActive = location === item.path;
                return (
                  <SidebarMenuItem key={item.path ?? item.label}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => item.path && setLocation(item.path)}
                      tooltip={item.label}
                      className="h-10 transition-all font-normal"
                    >
                      <item.icon className={`h-4 w-4 ${isActive ? "text-primary" : ""}`} />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>

            {/* Advanced toggle separator */}
            <div className="px-3 py-2">
              <SidebarSeparator className="my-1" />
              <button
                onClick={() => setShowAdvanced(prev => !prev)}
                className="flex items-center gap-2 w-full px-2 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground rounded-md hover:bg-accent/50 transition-colors"
              >
                {showAdvanced ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                <span>{showAdvanced ? "Hide Advanced" : "Show Advanced"}</span>
              </button>
            </div>

            {showAdvanced && (
              <SidebarMenu className="px-2 py-1">
                {advancedMenuItems.map(item => {
                  if (item.children) {
                    const isGroupActive = item.children.some(c => location.startsWith(c.path));
                    return (
                      <Collapsible key={item.label} defaultOpen={isGroupActive}>
                        <SidebarMenuItem>
                          <CollapsibleTrigger asChild>
                            <SidebarMenuButton
                              isActive={isGroupActive}
                              tooltip={item.label}
                              className="h-10 transition-all font-normal w-full justify-between"
                            >
                              <div className="flex items-center gap-2">
                                <item.icon className={`h-4 w-4 ${isGroupActive ? "text-primary" : "text-muted-foreground"}`} />
                                <span className="text-muted-foreground">{item.label}</span>
                              </div>
                              <ChevronDown className="h-3 w-3 text-muted-foreground group-data-[state=open]:rotate-180 transition-transform" />
                            </SidebarMenuButton>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="ml-6 mt-0.5 mb-1 border-l border-sidebar-border pl-2 flex flex-col gap-0.5">
                              {item.children.map(child => (
                                <button
                                  key={child.label}
                                  onClick={() => setLocation(child.path)}
                                  className={`text-left text-sm px-2 py-1.5 rounded-md transition-colors w-full ${
                                    location === child.path
                                      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                                  }`}
                                >
                                  <span>{child.label}</span>
                                </button>
                              ))}
                            </div>
                          </CollapsibleContent>
                        </SidebarMenuItem>
                      </Collapsible>
                    );
                  }
                  return null;
                })}
              </SidebarMenu>
            )}
          </SidebarContent>

          <SidebarFooter className="p-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-lg px-1 py-1 hover:bg-accent/50 transition-colors w-full text-left group-data-[collapsible=icon]:justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <Avatar className="h-9 w-9 border shrink-0">
                    <AvatarFallback className="text-xs font-medium">
                      {user?.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                    <p className="text-sm font-medium truncate leading-none">
                      {user?.name || "-"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-1.5">
                      {user?.email || "-"}
                    </p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>
        <div
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/20 transition-colors ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={() => {
            if (isCollapsed) return;
            setIsResizing(true);
          }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset>
        {isMobile && (
          <div className="flex border-b h-14 items-center justify-between bg-background/95 px-2 backdrop-blur supports-[backdrop-filter]:backdrop-blur sticky top-0 z-40">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="h-9 w-9 rounded-lg bg-background" />
              <div className="flex items-center gap-3">
                <div className="flex flex-col gap-1">
                  <span className="tracking-tight text-foreground">
                    {activeMenuItem?.label ?? "Menu"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
        <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <ScreenErrorBoundary username={(user as any)?.name ?? (user as any)?.email}>
            {children}
          </ScreenErrorBoundary>
        </main>
      </SidebarInset>
    </>
  );
}
