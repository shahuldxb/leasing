import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

// Core
import Dashboard          from "./pages/Dashboard";

// Lease Management
import LeaseRegister      from "./pages/LeaseRegister";
import NewLease           from "./pages/NewLease";
import Amortisation       from "./pages/Amortisation";
import LeaseRenewals      from "./pages/LeaseRenewals";
import LeaseModifications from "./pages/LeaseModifications";
import LeaseTerminations  from "./pages/LeaseTerminations";

// Contract Management
import ContractRegister   from "./pages/ContractRegister";
import ContractHistory    from "./pages/ContractHistory";
import ContractDocuments  from "./pages/ContractDocuments";
import ContractMilestones from "./pages/ContractMilestones";

// Payables
import PayablesQueue      from "./pages/PayablesQueue";
import InvoiceRegister    from "./pages/InvoiceRegister";
import PaymentRuns        from "./pages/PaymentRuns";
import GLJournals         from "./pages/GLJournals";
import PayablesApprovals  from "./pages/PayablesApprovals";

// Bank Reconciliation
import BankReconWorkspace from "./pages/BankReconWorkspace";
import BankAccounts       from "./pages/BankAccounts";
import BankImport         from "./pages/BankImport";
import BankHistory        from "./pages/BankHistory";
import BankRules          from "./pages/BankRules";

// Cheque Inventory
import ChequeInventory    from "./pages/ChequeInventory";

// Workflow / BPMN
import WorkflowQueue      from "./pages/WorkflowQueue";
import WorkflowTasks      from "./pages/WorkflowTasks";
import WorkflowMonitor    from "./pages/WorkflowMonitor";
import WorkflowModeler    from "./pages/WorkflowModeler";
import WorkflowEscalations from "./pages/WorkflowEscalations";

// MIS Analytics
import MISAnalytics       from "./pages/MISAnalytics";
import MISPortfolio       from "./pages/MISPortfolio";
import MISCashflow        from "./pages/MISCashflow";
import MISCost            from "./pages/MISCost";
import MISAIQuery         from "./pages/MISAIQuery";
import MISReports         from "./pages/MISReports";

// Operational
import OpsMaintenance     from "./pages/OpsMaintenance";
import OpsInsurance       from "./pages/OpsInsurance";
import OpsESG             from "./pages/OpsESG";
import OpsDocuments       from "./pages/OpsDocuments";

// Compliance
import ComplianceIFRS16   from "./pages/ComplianceIFRS16";
import AuditLog           from "./pages/AuditLog";
import ComplianceErrors   from "./pages/ComplianceErrors";

// Alerts & Admin
import AlertCentre        from "./pages/AlertCentre";
import AdminPanel         from "./pages/AdminPanel";

function Router() {
  return (
    <Switch>
      {/* Root */}
      <Route path="/"                        component={Dashboard} />
      <Route path="/dashboard"               component={Dashboard} />

      {/* Lease Management */}
      <Route path="/leases"                  component={LeaseRegister} />
      <Route path="/leases/new"              component={NewLease} />
      <Route path="/leases/amortisation"     component={Amortisation} />
      <Route path="/leases/renewals"         component={LeaseRenewals} />
      <Route path="/leases/modifications"    component={LeaseModifications} />
      <Route path="/leases/terminations"     component={LeaseTerminations} />

      {/* Contract Management */}
      <Route path="/contracts"               component={ContractRegister} />
      <Route path="/contracts/history"       component={ContractHistory} />
      <Route path="/contracts/documents"     component={ContractDocuments} />
      <Route path="/contracts/milestones"    component={ContractMilestones} />

      {/* Payables */}
      <Route path="/payables"                component={PayablesQueue} />
      <Route path="/payables/invoices"       component={InvoiceRegister} />
      <Route path="/payables/payments"       component={PaymentRuns} />
      <Route path="/payables/journals"       component={GLJournals} />
      <Route path="/payables/approvals"      component={PayablesApprovals} />

      {/* Bank Reconciliation */}
      <Route path="/bank/accounts"           component={BankAccounts} />
      <Route path="/bank/import"             component={BankImport} />
      <Route path="/bank/workspace"          component={BankReconWorkspace} />
      <Route path="/bank/history"            component={BankHistory} />
      <Route path="/bank/rules"              component={BankRules} />
      <Route path="/bank-recon"              component={BankReconWorkspace} />

      {/* Cheque Inventory */}
      <Route path="/cheques"                 component={ChequeInventory} />

      {/* Workflow / BPMN */}
      <Route path="/workflow"                component={WorkflowQueue} />
      <Route path="/workflows/tasks"         component={WorkflowTasks} />
      <Route path="/workflows/monitor"       component={WorkflowMonitor} />
      <Route path="/workflows/modeler"       component={WorkflowModeler} />
      <Route path="/workflows/escalations"   component={WorkflowEscalations} />

      {/* MIS Analytics */}
      <Route path="/analytics"               component={MISAnalytics} />
      <Route path="/mis/portfolio"           component={MISPortfolio} />
      <Route path="/mis/cashflow"            component={MISCashflow} />
      <Route path="/mis/cost"               component={MISCost} />
      <Route path="/mis/ai-query"            component={MISAIQuery} />
      <Route path="/mis/reports"             component={MISReports} />

      {/* Operational */}
      <Route path="/ops/maintenance"         component={OpsMaintenance} />
      <Route path="/ops/insurance"           component={OpsInsurance} />
      <Route path="/ops/esg"                 component={OpsESG} />
      <Route path="/ops/documents"           component={OpsDocuments} />

      {/* Compliance */}
      <Route path="/compliance/ifrs16"       component={ComplianceIFRS16} />
      <Route path="/compliance/audit"        component={AuditLog} />
      <Route path="/compliance/errors"       component={ComplianceErrors} />
      <Route path="/audit"                   component={AuditLog} />

      {/* Alerts & Admin */}
      <Route path="/alerts"                  component={AlertCentre} />
      <Route path="/admin"                   component={AdminPanel} />

      {/* 404 */}
      <Route path="/404"                     component={NotFound} />
      <Route                                 component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster richColors position="top-right" />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
