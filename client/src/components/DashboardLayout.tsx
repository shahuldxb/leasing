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
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { getLoginUrl } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  AlertTriangle, LayoutDashboard, LogOut, PanelLeft, FileText, CreditCard, GitBranch,
  BarChart3, Building2, Shield, Settings, Bell, Landmark, Wrench,
  FileCheck, TrendingUp, ChevronDown, ChevronRight, BookOpen, Package, MapPin,
  Sparkles, Calculator, Calendar, ArrowRightLeft, RefreshCw, LineChart
} from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from './DashboardLayoutSkeleton';
import { Button } from "./ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

type NavItem = {
  icon: React.ElementType;
  label: string;
  path?: string;
  children?: { label: string; path: string }[];
};

const menuItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  {
    icon: FileText, label: "Lease Management",
    children: [
      { label: "Lease Register",    path: "/leases" },
      { label: "New Lease",         path: "/leases/new" },
      { label: "Amortisation",      path: "/leases/amortisation" },
      { label: "Lease Renewals",    path: "/leases/renewals" },
      { label: "Modifications",     path: "/leases/modifications" },
      { label: "Terminations",      path: "/leases/terminations" },
    ],
  },
  {
    icon: FileCheck, label: "Contracts",
    children: [
      { label: "Contract Register", path: "/contracts" },
      { label: "Master Contracts",  path: "/contracts/msc" },
      { label: "Version History",   path: "/contracts/history" },
      { label: "Document Vault",    path: "/contracts/documents" },
      { label: "Milestones",        path: "/contracts/milestones" },
    ],
  },
  {
    icon: CreditCard, label: "Payables",
    children: [
      { label: "Invoice Register",  path: "/payables/invoices" },
      { label: "Payment Runs",      path: "/payables/payments" },
      { label: "GL Journals",       path: "/payables/journals" },
      { label: "Approval Queue",    path: "/payables/approvals" },
    ],
  },
  {
    icon: Landmark, label: "Bank Reconciliation",
    children: [
      { label: "Bank Accounts",     path: "/bank/accounts" },
      { label: "Import Statement",  path: "/bank/import" },
      { label: "Recon Workspace",   path: "/bank/workspace" },
      { label: "Recon History",     path: "/bank/history" },
      { label: "Matching Rules",    path: "/bank/rules" },
    ],
  },
  {
    icon: BookOpen, label: "Cheque Inventory",
    children: [
      { label: "Cheque Register",   path: "/cheques" },
      { label: "Cheque Books",      path: "/cheques" },
      { label: "Bounce Management", path: "/cheques/bounce" },
      { label: "Stale Alerts",      path: "/cheques" },
      { label: "Signatories",       path: "/cheques" },
    ],
  },
  {
    icon: GitBranch, label: "Workflows",
    children: [
      { label: "My Tasks",          path: "/workflows/tasks" },
      { label: "Process Monitor",   path: "/workflows/monitor" },
      { label: "Process Modeler",   path: "/workflows/modeler" },
      { label: "Escalations",       path: "/workflows/escalations" },
    ],
  },
  {
    icon: BarChart3, label: "MIS & Analytics",
    children: [
      { label: "Portfolio Health",  path: "/mis/portfolio" },
      { label: "Cash Flow Forecast",path: "/mis/cashflow" },
      { label: "Cost Performance",  path: "/mis/cost" },
      { label: "AI Query Panel",    path: "/mis/ai-query" },
      { label: "Custom Reports",    path: "/mis/reports" },
    ],
  },
  {
    icon: Building2, label: "Operational",
    children: [
      { label: "Asset Maintenance", path: "/ops/maintenance" },
      { label: "Insurance",         path: "/ops/insurance" },
      { label: "ESG Dashboard",     path: "/ops/esg" },
      { label: "Document Expiry",   path: "/ops/documents" },
    ],
  },
  {
    icon: Shield, label: "Compliance",
    children: [
      { label: "IFRS 16 Disclosures",path: "/compliance/ifrs16" },
      { label: "Audit Log",         path: "/compliance/audit" },
      { label: "Error Log",         path: "/compliance/errors" },
    ],
  },
  {
    icon: Calculator, label: "Accounting Engine",
    children: [
      { label: "IBR Library",         path: "/accounting/ibr" },
      { label: "Lease Classification", path: "/accounting/classification" },
      { label: "Remeasurement",       path: "/accounting/remeasurement" },
      { label: "CPI Escalation",      path: "/accounting/cpi" },
      { label: "Exemptions",          path: "/accounting/exemptions" },
      { label: "IFRS 16 Disclosure",  path: "/accounting/disclosure" },
      { label: "Roll-Forward Report", path: "/accounting/roll-forward" },
      { label: "ERP Export",          path: "/accounting/erp-export" },
      { label: "Bulk Operations",     path: "/accounting/bulk" },
    ],
  },
  {
    icon: Sparkles, label: "Advanced Lease",
    children: [
      { label: "AI Abstraction",      path: "/leases/ai-abstraction" },
      { label: "Critical Dates",      path: "/leases/critical-dates" },
      { label: "Sub-Leases",          path: "/leases/sub-leases" },
      { label: "Rent Reviews",        path: "/leases/rent-reviews" },
      { label: "Security Deposits",   path: "/leases/security-deposits" },
    ],
  },
  {
    icon: LineChart, label: "Reports & Scenarios",
    children: [
      { label: "Report Builder",      path: "/reports" },
      { label: "Scenario Modelling",  path: "/scenarios" },
    ],
  },
  {
    icon: TrendingUp, label: "Finance & Planning",
    children: [
      { label: "Budget Variance",    path: "/finance/budget-variance" },
      { label: "Maturity Analysis",  path: "/accounting/maturity" },
      { label: "Variable Rent",      path: "/accounting/variable-rent" },
      { label: "ASC 842",            path: "/accounting/asc842" },
    ],
  },
  {
    icon: MapPin, label: "Space & Projects",
    children: [
      { label: "Space Management",   path: "/ops/space" },
      { label: "Capital Projects",   path: "/ops/space" },
      { label: "ESG & Carbon",       path: "/ops/esg-carbon" },
    ],
  },
  {
    icon: ArrowRightLeft, label: "Lease Origination",
    children: [
      { label: "New Origination",    path: "/leases/origination" },
      { label: "Options & Breaks",   path: "/leases/options-breaks" },
    ],
  },
  {
    icon: RefreshCw, label: "Multi-Entity & FX",
    children: [
      { label: "Entity Structure",   path: "/admin/multi-entity" },
      { label: "FX Translations",    path: "/admin/multi-entity" },
      { label: "Lessor Credit Score",path: "/admin/lessor-credit" },
    ],
  },
  {
    icon: Bell, label: "Alerts & Reports",
    children: [
      { label: "Alert Rules",        path: "/admin/alerts-reports" },
      { label: "Scheduled Reports",  path: "/admin/alerts-reports" },
      { label: "Alert Centre",       path: "/alerts" },
    ],
  },
  {
    icon: Building2, label: "Lessor & Assets",
    children: [
      { label: "Lessor Master",      path: "/lessor-master" },
      { label: "Asset Registry",     path: "/asset-registry" },
    ],
  },
  {
    icon: Wrench, label: "Facilities & Vendors",
    children: [
      { label: "Desk Booking",        path: "/ops/desk-booking" },
      { label: "Work Orders",          path: "/ops/work-orders" },
      { label: "Vendor Management",    path: "/ops/vendors" },
    ],
  },
  {
    icon: Shield, label: "Data Quality",
    children: [
      { label: "Lease Data Quality",   path: "/leases/data-quality" },
    ],
  },
  {
    icon: Calculator, label: "Advanced Accounting",
    children: [
      { label: "Lessor Finance Lease", path: "/accounting/lessor-finance" },
      { label: "Consolidation",        path: "/accounting/consolidation" },
      { label: "Hedge Accounting",     path: "/accounting/hedge" },
    ],
  },
  {
    icon: TrendingUp, label: "Budgeting & ESG",
    children: [
      { label: "Budgeting & Forecasting", path: "/finance/budgeting" },
      { label: "ESG Reporting",           path: "/ops/esg-reporting" },
    ],
  },
  {
    icon: Sparkles, label: "AI & Intelligence",
    children: [
      { label: "AI Lease Analytics",   path: "/ai-analytics" },
    ],
  },
  {
    icon: Package, label: "Field & Tenant",
    children: [
      { label: "Mobile Field App",     path: "/mobile-field" },
      { label: "Tenant Portal",        path: "/tenant-portal" },
      { label: "Broker Management",    path: "/leases/brokers" },
      { label: "LOI Tracking",         path: "/leases/loi" },
      { label: "Lease Comparison",     path: "/leases/compare" },
      { label: "TI Allowance",         path: "/leases/ti-allowance" },
    ],
  },
  {
    icon: Settings, label: "System Settings",
    children: [
      { label: "Notification Settings",path: "/admin/notifications" },
      { label: "SSO Configuration",    path: "/admin/sso" },
      { label: "API & Webhooks",       path: "/admin/api-webhooks" },
      { label: "E-Signature",          path: "/admin/esignature" },
      { label: "Administration",       path: "/admin" },
    ],
  },
];

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
  const sidebarRef = useRef<HTMLDivElement>(null);
  const activeMenuItem = menuItems.find(item => item.path === location);
  const isMobile = useIsMobile();

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
              {menuItems.map(item => {
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
                                key={child.path}
                                onClick={() => setLocation(child.path)}
                                className={`text-left text-sm px-2 py-1.5 rounded-md transition-colors w-full ${
                                  location === child.path
                                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                                }`}
                              >
                                {child.label}
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
        <main className="flex-1 p-4">{children}</main>
      </SidebarInset>
    </>
  );
}
