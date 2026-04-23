import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

// Pages
import Dashboard       from "./pages/Dashboard";
import LeaseRegister   from "./pages/LeaseRegister";
import ContractRegister from "./pages/ContractRegister";
import PayablesQueue   from "./pages/PayablesQueue";
import WorkflowQueue   from "./pages/WorkflowQueue";
import BankReconWorkspace from "./pages/BankReconWorkspace";
import MISAnalytics    from "./pages/MISAnalytics";
import AuditLog        from "./pages/AuditLog";
import Home            from "./pages/Home";

function Router() {
  return (
    <Switch>
      <Route path="/"                  component={Dashboard} />
      <Route path="/dashboard"         component={Dashboard} />
      <Route path="/leases"            component={LeaseRegister} />
      <Route path="/leases/new"        component={() => { window.location.href = "/leases"; return null; }} />
      <Route path="/contracts"         component={ContractRegister} />
      <Route path="/payables"          component={PayablesQueue} />
      <Route path="/workflow"          component={WorkflowQueue} />
      <Route path="/bank-recon"        component={BankReconWorkspace} />
      <Route path="/analytics"         component={MISAnalytics} />
      <Route path="/audit"             component={AuditLog} />
      <Route path="/404"               component={NotFound} />
      <Route                           component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster richColors position="top-right" />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
