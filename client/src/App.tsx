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
import Amortisation           from "./pages/Amortisation";
import AmortisationBlackboard from "./pages/AmortisationBlackboard";
import LeaseRenewals      from "./pages/LeaseRenewals";
import LeaseModifications from "./pages/LeaseModifications";
import LeaseTerminations  from "./pages/LeaseTerminations";
import BouncePenalty       from "./pages/BouncePenalty";

// Contract Management
import ContractRegister            from "./pages/ContractRegister";
import ContractMetadataTemplates   from "./pages/ContractMetadataTemplates";
import ContractHistory       from "./pages/ContractHistory";
import ContractDocuments     from "./pages/ContractDocuments";
import ContractMilestones    from "./pages/ContractMilestones";
import ContractModifications from "./pages/ContractModifications";

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

// Accounting Engine (P1 features)
import IBRLibrary         from "./pages/IBRLibrary";
import LeaseClassification from "./pages/LeaseClassification";
import RemeasurementEngine from "./pages/RemeasurementEngine";
import CPIEscalation      from "./pages/CPIEscalation";
import LeaseExemptions    from "./pages/LeaseExemptions";
import IFRS16Disclosure   from "./pages/IFRS16Disclosure";
import RollForwardReport  from "./pages/RollForwardReport";
import ERPExport          from "./pages/ERPExport";
import BulkOperations     from "./pages/BulkOperations";

// P2 Features
import CriticalDateCalendar from "./pages/CriticalDateCalendar";
import AIAbstraction      from "./pages/AIAbstraction";
import SubLeases          from "./pages/SubLeases";
import RentReviews        from "./pages/RentReviews";
import SecurityDeposits   from "./pages/SecurityDeposits";
import ReportBuilder      from "./pages/ReportBuilder";
import ScenarioModelling  from "./pages/ScenarioModelling";

// Alerts & Admin
import AlertCentre        from "./pages/AlertCentre";
import AdminPanel         from "./pages/AdminPanel";

// New P2/P3/P4 Features
import LessorFinanceLease   from "./pages/LessorFinanceLease";
import NotificationSettings from "./pages/NotificationSettings";
import SSOConfig            from "./pages/SSOConfig";
import APIWebhookConfig     from "./pages/APIWebhookConfig";
import DeskBooking          from "./pages/DeskBooking";
import FacilitiesWorkOrders from "./pages/FacilitiesWorkOrders";
import VendorManagement     from "./pages/VendorManagement";
import LeaseDataQuality     from "./pages/LeaseDataQuality";
import ConsolidationReporting from "./pages/ConsolidationReporting";
import HedgeAccounting      from "./pages/HedgeAccounting";
import BudgetingForecasting from "./pages/BudgetingForecasting";
import ESGReporting         from "./pages/ESGReporting";
import AILeaseAnalytics     from "./pages/AILeaseAnalytics";
import MobileFieldApp       from "./pages/MobileFieldApp";
import TenantPortal         from "./pages/TenantPortal";
import BrokerManagement     from "./pages/BrokerManagement";
import LOITracking          from "./pages/LOITracking";
import LeaseComparison      from "./pages/LeaseComparison";
import TenantImprovementAllowance from "./pages/TenantImprovementAllowance";
import ESignatureIntegration from "./pages/ESignatureIntegration";
import FurnishedAssets       from "./pages/FurnishedAssets";
import AssetDepositRegister  from "./pages/AssetDepositRegister";
import HandoverChecklist     from "./pages/HandoverChecklist";
import MSCRegister           from "./pages/MSCRegister";
import MSCContractViewer     from "./pages/MSCContractViewer";

// Lessor & Asset
import LessorMaster              from "./pages/LessorMaster";
import AssetRegistry             from "./pages/AssetRegistry";
import SubAssetTransactionLog    from "./pages/SubAssetTransactionLog";
import LeaseSubAssets            from "./pages/LeaseSubAssets";

// P2/P3 New Features
import MaturityAnalysis   from "./pages/MaturityAnalysis";
import VariableRent       from "./pages/VariableRent";
import ASC842             from "./pages/ASC842";
import LeaseOrigination   from "./pages/LeaseOrigination";
import LeaseOptionsBreaks from "./pages/LeaseOptionsBreaks";
import BudgetVariance     from "./pages/BudgetVariance";
import SpaceManagement    from "./pages/SpaceManagement";
import ESGCarbon          from "./pages/ESGCarbon";
import MultiEntityFX      from "./pages/MultiEntityFX";
import LessorCreditScore  from "./pages/LessorCreditScore";
import AlertsReports      from "./pages/AlertsReports";
import FurnitureCollections    from "./pages/FurnitureCollections";
import FurnitureCollectionDetail from "./pages/FurnitureCollectionDetail";

// Phase 5 Features
import DisclosureNotes  from "./pages/DisclosureNotes";
import RenewalEngine   from "./pages/RenewalEngine";
import PeriodClose     from "./pages/PeriodClose";
import IAS17Comparison from "./pages/IAS17Comparison";
import FXRevaluation   from "./pages/FXRevaluation";
import LeaseTransactionCentre from "./pages/LeaseTransactionCentre";
import LeaseDetail           from "./pages/LeaseDetail";
import LeaseRenewal          from "./pages/LeaseRenewal";

// Phase 6 — IFRS Financial Statements
import FinancialStatements   from "./pages/FinancialStatements";
import TrialBalance          from "./pages/TrialBalance";
// Phase 7 — Features 12, 13, 14
import DisclosurePack            from "./pages/DisclosurePack";
import BudgetVsActual            from "./pages/BudgetVsActual";
import MaturityLadder            from "./pages/MaturityLadder";
// Phase 8 — Features 15, 17
import MultiStandardComparison   from "./pages/MultiStandardComparison";
import LeaseModificationWizard   from "./pages/LeaseModificationWizard";

// Accounting Standards Paper
import AccountingStandardsPaper  from "./pages/AccountingStandardsPaper";

function Router() {
  return (
    <Switch>
      {/* Root */}
      <Route path="/"                        component={Dashboard} />
      <Route path="/dashboard"               component={Dashboard} />

      {/* Lease Management */}
      <Route path="/leases"                  component={LeaseRegister} />
      <Route path="/leases/new"              component={NewLease} />
      <Route path="/leases/amortisation"                component={Amortisation} />
      <Route path="/leases/amortisation/blackboard"     component={AmortisationBlackboard} />
      <Route path="/leases/renewals"         component={LeaseRenewals} />
      <Route path="/leases/modifications"    component={LeaseModifications} />
      <Route path="/leases/transaction-centre" component={LeaseTransactionCentre} />
      <Route path="/leases/detail"             component={LeaseDetail} />
      <Route path="/leases/renewal"            component={LeaseRenewal} />
      <Route path="/leases/terminations"     component={LeaseTerminations} />
      <Route path="/cheques/bounce"           component={BouncePenalty} />

      {/* Contract Management */}
      <Route path="/contracts"                          component={ContractRegister} />
      <Route path="/contracts/metadata-templates"        component={ContractMetadataTemplates} />
      <Route path="/contracts/history"        component={ContractHistory} />
      <Route path="/contracts/documents"      component={ContractDocuments} />
      <Route path="/contracts/milestones"     component={ContractMilestones} />
      <Route path="/contracts/modifications"  component={ContractModifications} />

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

      {/* Accounting Engine */}
      <Route path="/accounting/ibr"          component={IBRLibrary} />
      <Route path="/accounting/classification" component={LeaseClassification} />
      <Route path="/accounting/remeasurement" component={RemeasurementEngine} />
      <Route path="/accounting/cpi"          component={CPIEscalation} />
      <Route path="/accounting/exemptions"   component={LeaseExemptions} />
      <Route path="/accounting/disclosure"   component={IFRS16Disclosure} />
      <Route path="/accounting/roll-forward" component={RollForwardReport} />
      <Route path="/accounting/erp-export"   component={ERPExport} />
      <Route path="/accounting/bulk"         component={BulkOperations} />

      {/* Advanced Features */}
      <Route path="/leases/critical-dates"   component={CriticalDateCalendar} />
      <Route path="/leases/ai-abstraction"   component={AIAbstraction} />
      <Route path="/leases/sub-leases"       component={SubLeases} />
      <Route path="/leases/rent-reviews"     component={RentReviews} />
      <Route path="/leases/security-deposits" component={SecurityDeposits} />
      <Route path="/reports"                 component={ReportBuilder} />
      <Route path="/scenarios"               component={ScenarioModelling} />

      {/* Lessor & Asset */}
      <Route path="/lessor-master"                    component={LessorMaster} />
      <Route path="/sub-asset-registry"               component={AssetRegistry} />
      <Route path="/sub-asset-registry/transactions"  component={SubAssetTransactionLog} />
      <Route path="/lease-sub-assets"                   component={LeaseSubAssets} />

      {/* Alerts & Admin */}
      <Route path="/alerts"                  component={AlertCentre} />
      <Route path="/admin"                   component={AdminPanel} />

      {/* Maturity, Variable Rent, ASC 842 */}
      <Route path="/accounting/maturity"     component={MaturityAnalysis} />
      <Route path="/accounting/variable-rent" component={VariableRent} />
      <Route path="/accounting/asc842"       component={ASC842} />

      {/* Lease Lifecycle */}
      <Route path="/leases/origination"      component={LeaseOrigination} />
      <Route path="/leases/options-breaks"   component={LeaseOptionsBreaks} />

      {/* Finance & Analytics */}
      <Route path="/finance/budget-variance" component={BudgetVariance} />
      <Route path="/ops/space"               component={SpaceManagement} />
      <Route path="/ops/esg-carbon"          component={ESGCarbon} />

      {/* Multi-Entity, FX, Lessor Credit */}
      <Route path="/admin/multi-entity"      component={MultiEntityFX} />
      <Route path="/admin/lessor-credit"     component={LessorCreditScore} />

      {/* Alerts & Scheduled Reports */}
      <Route path="/admin/alerts-reports"    component={AlertsReports} />
      <Route path="/admin/scheduled-reports"  component={AlertsReports} />

      {/* New P2/P3/P4 Features */}
      <Route path="/accounting/lessor-finance" component={LessorFinanceLease} />
      <Route path="/admin/notifications"     component={NotificationSettings} />
      <Route path="/admin/sso"               component={SSOConfig} />
      <Route path="/admin/api-webhooks"      component={APIWebhookConfig} />
      <Route path="/ops/desk-booking"        component={DeskBooking} />
      <Route path="/ops/work-orders"         component={FacilitiesWorkOrders} />
      <Route path="/ops/vendors"             component={VendorManagement} />
      <Route path="/leases/data-quality"     component={LeaseDataQuality} />
      <Route path="/accounting/consolidation" component={ConsolidationReporting} />
      <Route path="/accounting/hedge"        component={HedgeAccounting} />
      <Route path="/finance/budgeting"       component={BudgetingForecasting} />
      <Route path="/ops/esg-reporting"       component={ESGReporting} />
      <Route path="/ai-analytics"            component={AILeaseAnalytics} />
      <Route path="/mobile-field"            component={MobileFieldApp} />
      <Route path="/tenant-portal"           component={TenantPortal} />
      <Route path="/leases/brokers"           component={BrokerManagement} />
      <Route path="/leases/loi"               component={LOITracking} />
      <Route path="/leases/compare"           component={LeaseComparison} />
      <Route path="/leases/ti-allowance"      component={TenantImprovementAllowance} />
      <Route path="/admin/esignature"         component={ESignatureIntegration} />

      {/* Furnished Assets & Asset Deposits */}
      <Route path="/ops/furnished-assets"     component={FurnishedAssets} />
      <Route path="/ops/asset-deposits"       component={AssetDepositRegister} />
      <Route path="/ops/handover-checklist"   component={HandoverChecklist} />

      {/* Master Services Contracts */}
      <Route path="/contracts/msc"            component={MSCRegister} />
      <Route path="/contracts/msc/:id"        component={MSCContractViewer} />
      <Route path="/contracts/msc/:id/print"  component={MSCContractViewer} />

      {/* Property Furniture Collections */}
      <Route path="/assets/furniture"            component={FurnitureCollections} />
      <Route path="/assets/furniture/:id"        component={FurnitureCollectionDetail} />

      {/* Phase 5: IFRS 16 Lifecycle Features */}
      <Route path="/accounting/disclosure-notes"  component={DisclosureNotes} />
      <Route path="/leases/renewal-engine"        component={RenewalEngine} />
      <Route path="/accounting/period-close"      component={PeriodClose} />
      <Route path="/accounting/ias17-comparison"  component={IAS17Comparison} />
      <Route path="/accounting/fx-revaluation"    component={FXRevaluation} />
      {/* Phase 7: Features 12, 13, 14 */}
      <Route path="/accounting/disclosure-pack"   component={DisclosurePack} />
      <Route path="/accounting/budget-vs-actual"  component={BudgetVsActual} />
      <Route path="/accounting/maturity-ladder"   component={MaturityLadder} />
      {/* Phase 8: Features 15, 17 */}
      <Route path="/accounting/multi-standard"    component={MultiStandardComparison} />
      <Route path="/leases/modification-wizard"   component={LeaseModificationWizard} />
      {/* Accounting Standards Reference Paper */}
      <Route path="/compliance/standards-paper"   component={AccountingStandardsPaper} />
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
