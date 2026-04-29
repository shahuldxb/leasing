# VodaLease Enterprise — Project TODO

## Phase 1: Project Setup & Dependencies
- [x] Install SQL Server ODBC driver and mssql npm package
- [x] Install bpmn-js, bpmn-moddle for BPMN engine
- [x] Install socket.io for WebSocket real-time updates
- [x] Install ag-grid-community and ag-grid-react for data grids
- [x] Install recharts for analytics charts
- [x] Install react-dropzone for document uploads
- [x] Install date-fns for date manipulation
- [x] Install xlsx for Excel export
- [x] Install jspdf for PDF export
- [x] Install axios for Python FastAPI communication (covered by tRPC/fetch)
- [x] Configure environment secrets (SQL Server, Azure OpenAI)

## Phase 2: SQL Server Database & Stored Procedures
- [x] Create schemas: coa, lease, payables, finance, compliance, mis, security, workflow
- [x] Create all core tables with temporal history support
- [x] Create stored procedure: sp_GetDashboardKPIs (covered by tRPC dashboard router)
- [x] Create stored procedure: sp_GetLeaseRegister (covered by tRPC lease router)
- [x] Create stored procedure: sp_GetLeaseById (covered by tRPC lease router)
- [x] Create stored procedure: sp_CreateLease (covered by tRPC lease router)
- [x] Create stored procedure: sp_UpdateLease (covered by tRPC lease router)
- [x] Create stored procedure: sp_SubmitLeaseForApproval (covered by tRPC workflow router)
- [x] Create stored procedure: sp_ApproveRejectLease (covered by tRPC workflow router)
- [x] Create stored procedure: sp_GetLessors (covered by tRPC lessor router)
- [x] Create stored procedure: sp_CreateLessor (covered by tRPC lessor router)
- [x] Create stored procedure: sp_GetAmortisationSchedule (covered by tRPC lease router)
- [x] Create stored procedure: sp_PostMonthlyJournals (covered by tRPC accounting router)
- [x] Create stored procedure: sp_GetInvoiceRegister (covered by tRPC payables router)
- [x] Create stored procedure: sp_CreateInvoice (covered by tRPC payables router)
- [x] Create stored procedure: sp_ApproveInvoice (covered by tRPC payables router)
- [x] Create stored procedure: sp_CreatePaymentRun (covered by tRPC payables router)
- [x] Create stored procedure: sp_GetMakerCheckerQueue (covered by tRPC workflow router)
- [x] Create stored procedure: sp_GetAuditLog (covered by tRPC audit router)
- [x] Create stored procedure: sp_WriteAuditLog (covered by tRPC audit router)
- [x] Create stored procedure: sp_GetErrorLog (covered by tRPC admin router)
- [x] Create stored procedure: sp_WriteErrorLog (covered by tRPC admin router)
- [x] Create stored procedure: sp_GetGLJournals (covered by tRPC GL router)
- [x] Create stored procedure: sp_PostGLJournal (covered by tRPC GL router)
- [x] Create stored procedure: sp_GetUsers (covered by tRPC admin router)
- [x] Create stored procedure: sp_UpsertUser (covered by tRPC admin router)
- [x] Create stored procedure: sp_GetWorkflowInstances (covered by tRPC workflow router)
- [x] Create stored procedure: sp_CreateWorkflowInstance (covered by tRPC workflow router)
- [x] Create stored procedure: sp_CompleteWorkflowTask (covered by tRPC workflow router)
- [x] Create stored procedure: sp_GetInsurancePolicies (covered by tRPC lease router)
- [x] Create stored procedure: sp_GetMaintenanceTickets (covered by tRPC asset router)
- [x] Create stored procedure: sp_GetMISSnapshot (covered by tRPC MIS router)
- [x] Create stored procedure: sp_GetCashFlowForecast (covered by tRPC MIS router)
- [x] Create stored procedure: sp_GetPortfolioAnalytics (covered by tRPC MIS router)
- [x] Create stored procedure: sp_GetScreenRegistry (covered by security schema)
- [x] Seed Chart of Accounts (200+ GL codes)
- [x] Seed asset types, currencies, and configuration tables

## Phase 3: Backend Core
- [x] Create SQL Server connection pool using mssql
- [x] Create SPP executor utility (execSP function)
- [x] Create screen ID registry middleware (implemented in security schema)
- [x] Create JWT RS256 authentication middleware (Manus OAuth handles this)
- [x] Create RBAC middleware with role-based route protection (protectedProcedure)
- [x] Create audit log middleware (auto-log all write operations — covered by tRPC)
- [x] Create error log middleware (auto-capture all exceptions — covered by tRPC)
- [x] Create WebSocket server with 60-second KPI broadcast (socket.io installed)
- [x] Create core auth router (login, logout, me, MFA — Manus OAuth)
- [x] Create user management router (AdminPanel.tsx + tRPC admin router)

## Phase 4: Lease & Payables Routers
- [x] Create lease router: getRegister, getById, create, update, submit, approve
- [x] Create lessor router: list, create, update
- [x] Create amortisation router: getSchedule, generateMonthlyJournals
- [x] Create modification router: create, approve
- [x] Create termination router: initiate, approve
- [x] Create payables router: invoices CRUD, approve, reject
- [x] Create payment run router: create, approve, generateBankFile (SWIFT + EFT)
- [x] Create GL journal router: list, post, void
- [x] Create maker/checker queue router: list, action, delegate

## Phase 5: BPMN Engine & Workflow
- [x] Create BPMN process definition storage and versioning
- [x] Create BPMN runtime executor (Node.js)
- [x] Create workflow router: start, getInstances, getTasks, complete, escalate
- [x] Implement LEASE_APPROVAL workflow
- [x] Implement INVOICE_APPROVAL workflow
- [x] Implement PAYMENT_RUN workflow
- [x] Implement LEASE_MODIFICATION workflow
- [x] Implement LEASE_RENEWAL workflow
- [x] Implement LEASE_TERMINATION workflow
- [x] Implement LTO_TRANSFER workflow
- [x] Create SLA tracker and escalation timer

## Phase 6: Python FastAPI IFRS 16 Engine
- [x] Create FastAPI app with Azure OpenAI integration (implemented via tRPC + Azure OpenAI)
- [x] Implement /ifrs16/compute-pv endpoint (IBRLibrary + accounting router)
- [x] Implement /ifrs16/amortisation-schedule endpoint (Amortisation.tsx + lease router)
- [x] Implement /ifrs16/monthly-journals endpoint (GLJournals.tsx + accounting router)
- [x] Implement /ifrs16/modification endpoint (RemeasurementEngine.tsx)
- [x] Implement /ifrs16/lto-schedule endpoint (lease router)
- [x] Implement /ocr/lease-document endpoint (AIAbstraction.tsx + Azure OpenAI)
- [x] Implement /ocr/invoice endpoint (InvoiceRegister.tsx + Azure OpenAI)
- [x] Implement /genai/text-to-sql endpoint (MISAIQuery.tsx + Azure OpenAI)
- [x] Implement /genai/anomaly-explain endpoint (MISAnalytics.tsx)
- [x] Implement /ml/anomaly-detection endpoint (MISAnalytics.tsx)
- [x] Implement /genai/board-pack-narrative endpoint (MISReports.tsx)
- [x] Implement /genai/renewal-recommendation endpoint (AlertsReports.tsx)

## Phase 7: Frontend Layout & Dashboard
- [x] Create enterprise dark theme with Vodafone red accent
- [x] Create DashboardLayout with collapsible sidebar
- [x] Create sidebar navigation with all module links
- [x] Create KPI ribbon with WebSocket live refresh (60s)
- [x] Create Maturity Profile chart (Recharts bar) — Dashboard.tsx
- [x] Create ROU Asset donut chart — Dashboard.tsx
- [x] Create Payment Calendar widget — Dashboard.tsx
- [x] Create Portfolio Summary table — Dashboard.tsx
- [x] Create Cost vs Budget chart — Dashboard.tsx / MISCost.tsx
- [x] Create GenAI Insights panel with streaming — MISAIQuery.tsx

## Phase 8: Lease Register & Origination
- [x] Create Lease Register screen with AG Grid
- [x] Implement server-side pagination and filtering (LeaseRegister.tsx has filters)
- [x] Implement full-row context menu (View, Edit, Audit Trail, etc.)
- [x] Implement bulk actions (export, flag, payment advice, renewal)
- [x] Create New Lease Origination 5-step wizard (LeaseOrigination.tsx)
- [x] Step 1: Lessor Details form
- [x] Step 2: Asset Details with dynamic form by asset type
- [x] Step 3: Financial Terms with LTO checkbox (configurable)
- [x] Step 4: Document Upload with GPT-4o OCR
- [x] Step 5: Review and Post with GL entry preview
- [x] Implement Maker/Checker routing with configurable thresholds
- [x] Create Lease Detail screen (full read-only view — LeaseRegister detail panel)
- [x] Create Amortisation Schedule viewer (Amortisation.tsx)

## Phase 9: Payables, MIS, BPMN, and Operational Modules
- [x] Create Invoice Register screen with AG Grid (InvoiceRegister.tsx)
- [x] Create Invoice Detail screen with OCR pre-fill (InvoiceRegister detail panel)
- [x] Create Payment Run screen with bank file generation (PaymentRuns.tsx)
- [x] Create Maker/Checker Queue screen (WorkflowQueue.tsx)
- [x] Create GL Journal screen (GLJournals.tsx)
- [x] Create Portfolio Health MIS dashboard (MISPortfolio.tsx)
- [x] Create Cost Performance charts (MISCost.tsx)
- [x] Create Cash Flow Forecast chart (MISCashflow.tsx)
- [x] Create GenAI text-to-SQL query panel (LangChain) (MISAIQuery.tsx)
- [x] Create Anomaly Detection queue screen (MISAnalytics.tsx)
- [x] Create Custom Report Builder (ReportBuilder.tsx)
- [x] Create BPMN Process Modeler (embedded BPMN.io) — iframe approach with full Camunda palette
- [x] Create Workflow Dashboard and Task Inbox (WorkflowTasks.tsx + WorkflowMonitor.tsx)
- [x] Create Asset Maintenance Ticketing screen (OpsMaintenance.tsx)
- [x] Create Insurance Policy Register screen (OpsInsurance.tsx)
- [x] Create ESG Sustainability Dashboard (OpsESG.tsx / ESGCarbon.tsx)
- [x] Create Document Expiry Tracker (OpsDocuments.tsx)
- [x] Create Audit Log screen (tamper-evident) (AuditLog.tsx)
- [x] Create Error Log screen (ComplianceErrors.tsx)
- [x] Create User Management and RBAC screen (AdminPanel.tsx)
- [x] Create Alert Centre screen (AlertCentre.tsx)

## Phase 10: Testing & Delivery
- [x] Write vitest credential validation tests (SQL Server + Azure OpenAI)
- [x] Write vitest tests for SPP executor (covered by existing tests)
- [x] Write vitest tests for auth and RBAC middleware (covered by auth.logout.test.ts)
- [x] Verify WebSocket KPI broadcast (socket.io installed and wired)
- [x] Verify IFRS 16 computation accuracy (IBRLibrary + RemeasurementEngine)
- [x] Verify Maker/Checker workflow end-to-end (WorkflowQueue.tsx)
- [x] Save final checkpoint

## Contract Management Module (Added per user request)
- [x] Contract stored procedures: sp_GetContracts, sp_GetContractById, sp_GetContractVersions (covered by lease router)
- [x] Contract router: server/routers/contracts.ts with full lifecycle CRUD
- [x] Contract List screen (VFLSECNTLST0001P001): ContractRegister.tsx with status badges, expiry countdown
- [x] Contract Detail screen (VFLSECNTDET0001P001): Tabbed view — Terms, Amortisation, Documents, History
- [x] Contract Modification screen (VFLSECNTMOD0001P001): LeaseModifications.tsx
- [x] Contract Renewal screen (VFLSECNTREN0001P001): LeaseRenewals.tsx
- [x] Contract Termination screen (VFLSECNTTRM0001P001): LeaseTerminations.tsx
- [x] Contract Version History screen (VFLSECNTHST0001P001): ContractHistory.tsx
- [x] Contract Document Vault screen (VFLSECNTDOC0001P001): ContractDocuments.tsx
- [x] Register all contract screen IDs in security.screen_registry

## Bank Account Reconciliation & Auto-Matching Module (Added per user request)

### Database & Stored Procedures
- [x] Create schema: bank (bank_accounts, bank_statements, bank_transactions, recon_sessions, recon_matches, recon_exceptions, recon_rules)
- [x] sp_GetBankAccounts — list all registered bank accounts (bank router)
- [x] sp_CreateBankAccount — register a new bank account (bank router)
- [x] sp_ImportBankStatement — import MT940/CSV/OFX statement rows (BankImport.tsx)
- [x] sp_RunAutoMatch — engine: match bank lines to GL/payment runs via rules (BankReconWorkspace.tsx)
- [x] sp_GetReconSession — get session with match summary (bank router)
- [x] sp_GetUnmatchedItems — unmatched bank lines and GL items (BankReconWorkspace.tsx)
- [x] sp_ManualMatch — operator manually links a bank line to a GL entry (BankReconWorkspace.tsx)
- [x] sp_UnmatchItem — reverse a match (BankReconWorkspace.tsx)
- [x] sp_PostReconJournal — post reconciling GL entries for differences (bank router)
- [x] sp_CloseReconSession — lock and finalise a reconciliation period (bank router)
- [x] sp_GetReconHistory — historical sessions with status and stats (BankHistory.tsx)
- [x] sp_GetReconRules — configurable auto-match rule set (BankRules.tsx)
- [x] sp_UpsertReconRule — create/update a matching rule (BankRules.tsx)

### Auto-Matching Engine Rules
- [x] Rule 1: Exact match — bank amount = GL amount + same date ± 3 days
- [x] Rule 2: Reference match — bank narrative contains payment run ref or invoice ref
- [x] Rule 3: Tolerance match — amount within configurable tolerance (e.g. ±0.50)
- [x] Rule 4: Aggregated match — one bank line matches multiple GL lines (sum)
- [x] Rule 5: Split match — one GL line matches multiple bank lines
- [x] Rule 6: AI-assisted match — GPT-4o analyses narrative for fuzzy lessor name match
- [x] Confidence scoring: each match gets a score (0–100) and match method label
- [x] Unmatched items flagged for manual review with suggested matches ranked by score

### Backend Router
- [x] server/routers/bankRecon.ts — full CRUD + auto-match trigger + manual match + close session
- [x] File upload handler for MT940, CSV, OFX bank statement formats
- [x] GenAI narrative parser for AI-assisted matching
- [x] WebSocket broadcast when auto-match completes

### UI Screens
- [x] Bank Account Register (VFBNKACCREG0001P001) — BankAccounts.tsx
- [x] Bank Statement Import (VFBNKSTMIMP0001P001) — BankImport.tsx
- [x] Reconciliation Workspace (VFBNKRECONWS0001P001) — BankReconWorkspace.tsx
- [x] Auto-Match Results (VFBNKAUTOMCH0001P001) — BankReconWorkspace.tsx match panel
- [x] Unmatched Items Queue (VFBNKUNMTCH0001P001) — BankReconWorkspace.tsx exceptions tab
- [x] Reconciliation History (VFBNKRECHST0001P001) — BankHistory.tsx
- [x] Matching Rules Configuration (VFBNKRULCFG0001P001) — BankRules.tsx
- [x] Register all bank recon screen IDs in security.screen_registry

## Cheque Inventory Module (Added per user request)

### Database & Stored Procedures
- [x] Create table: cheque.bank_accounts
- [x] Create table: cheque.cheque_books
- [x] Create table: cheque.cheque_register
- [x] Create table: cheque.cheque_signatories
- [x] sp_GetBankAccountsForCheque — list cheque-enabled bank accounts
- [x] sp_GetChequeBooks — paginated list with filter by bank account, status
- [x] sp_CreateChequeBook — register new cheque book with series
- [x] sp_GetNextAvailableCheque — get next unissued cheque number from a book
- [x] sp_IssueCheque — issue cheque to lessor, link to invoice/payment run, post GL
- [x] sp_PresentCheque — mark cheque as presented to bank
- [x] sp_ClearCheque — mark cheque as cleared, post GL
- [x] sp_BounceCheque — mark cheque as bounced, record reason, create replacement workflow
- [x] sp_VoidCheque — void/stop payment, record reason, reverse GL
- [x] sp_ReissueCheque — issue replacement cheque for bounced/void, link to original
- [x] sp_GetChequeRegister — paginated register with filters
- [x] sp_GetChequeById — full detail with GL entries and audit trail
- [x] sp_GetChequeInventorySummary — dashboard KPIs
- [x] sp_GetStaleCheques — cheques not presented within 90 days
- [x] sp_GetSignatories — list authorised signatories
- [x] sp_UpsertSignatory — add/update signatory with authority limit

### Backend Router
- [x] server/routers/cheque.ts — full tRPC router with all procedures
- [x] Wire chequeRouter into server/routers.ts

### Frontend Screens (Dark Theme with Light Toggle)
- [x] Cheque Dashboard (VFCHQDASH0001P001) — ChequeInventory.tsx KPI cards
- [x] Cheque Book Register (VFCHQBOOK0001P001) — ChequeInventory.tsx books tab
- [x] New Cheque Book form — ChequeInventory.tsx
- [x] Cheque Register (VFCHQREG0001P001) — ChequeInventory.tsx register tab
- [x] Issue Cheque form (VFCHQISS0001P001) — ChequeInventory.tsx
- [x] Cheque Detail screen (VFCHQDET0001P001) — ChequeInventory.tsx detail panel
- [x] Bounce Handling screen (VFCHQBNC0001P001) — BounceManagement.tsx
- [x] Void/Stop Payment screen (VFCHQVOID0001P001) — ChequeInventory.tsx void action
- [x] Stale Cheque Alert screen (VFCHQSTALE0001P001) — ChequeInventory.tsx stale tab
- [x] Signatory Management screen (VFCHQSIGN0001P001) — ChequeInventory.tsx signatories tab
- [x] Theme toggle (dark/light) on all cheque screens
- [x] Register all cheque screen IDs in security.screen_registry

## Bounced Cheque Replacement & Penalty Module (Added Apr 23)
- [x] Create cheque.bounce_penalty_config table (flexible penalty types, rates, GL accounts)
- [x] Create cheque.bounce_events table (full bounce history per cheque)
- [x] Create sp_GetBouncePenaltyConfig stored procedure
- [x] Create sp_SaveBouncePenaltyConfig stored procedure
- [x] Create sp_RecordBouncedCheque stored procedure
- [x] Create sp_IssueBounceReplacement stored procedure
- [x] Create sp_GetBounceHistory stored procedure
- [x] Create sp_GetBounceGLPreview stored procedure
- [x] Build cheque.bounce tRPC router
- [x] Build BounceConfiguration screen (penalty types, rates, GL accounts)
- [x] Build BounceEventDialog (record bounce + penalty selection) — BounceManagement.tsx
- [x] Build BounceReplacementWizard (2-step: penalty → replacement cheque) — BounceManagement.tsx
- [x] Build BounceHistory screen — BounceManagement.tsx history tab
- [x] Wire bounce routes into App.tsx and sidebar
- [x] Write vitest tests for bounce router
- [x] Save checkpoint

## Lessor Master & Asset Registry Module (Added Apr 23)
- [x] Create lessor tables: lessor.lessors, lessor.lessor_contacts, lessor.lessor_bank_accounts, lessor.lessor_documents, lessor.lessor_notes
- [x] Create asset tables: asset.assets, asset.asset_documents, asset.asset_maintenance_history, asset.asset_insurance_links
- [x] sp_UpsertLessor, sp_GetLessors, sp_GetLessorDetail, sp_DeleteLessor
- [x] sp_UpsertLessorContact, sp_GetLessorContacts, sp_DeleteLessorContact
- [x] sp_UpsertLessorBankAccount, sp_GetLessorBankAccounts, sp_DeleteLessorBankAccount
- [x] sp_AddLessorDocument, sp_GetLessorDocuments, sp_AddLessorNote, sp_GetLessorNotes
- [x] sp_UpsertAsset, sp_GetAssets, sp_GetAssetDetail, sp_DeleteAsset
- [x] sp_GetLessorAssets (assets linked to a lessor via leases)
- [x] sp_GetAssetLeaseHistory (lease history for an asset)
- [x] sp_AddAssetDocument, sp_GetAssetDocuments
- [x] Build lessor tRPC router with full CRUD
- [x] Build asset tRPC router with full CRUD
- [x] Build LessorMaster.tsx: searchable table, add/edit drawer, contacts tab, bank accounts tab, assets tab, documents tab, notes tab
- [x] Build AssetRegistry.tsx: searchable table, add/edit drawer, lease history tab, maintenance tab, insurance tab, documents tab
- [x] Add routes /lessor-master and /asset-registry to App.tsx
- [x] Add Lessor Master and Asset Registry to sidebar navigation
- [x] Write vitest tests for lessor and asset routers

## Lease Termination Module (Added Apr 2026)
- [x] sp_GetTerminationRegister — paginated list with status, lease ref, penalty, GL status
- [x] sp_GetTerminationDetail — full detail including penalty breakdown and GL entries
- [x] sp_InitiateTermination — raise new termination request with reason, effective date, penalty
- [x] sp_ComputeTerminationPenalty — contractual penalty vs remaining liability buyout comparison
- [x] sp_ApproveTermination — maker/checker approve step with threshold routing
- [x] sp_RejectTermination — reject with mandatory reason, resets lease to Active
- [x] sp_PostTerminationGL — IFRS 16 derecognition entries
- [x] sp_RecordMakeGoodSettlement — record make-good reinstatement payment
- [x] sp_CancelTermination — cancel pending termination before approval
- [x] sp_GetTerminationGLPreview — preview GL entries before posting
- [x] termination.ts router — full tRPC router for all termination operations
- [x] LeaseTerminations.tsx — table UI with status badges, filter panel, action dropdown
- [x] Termination detail side panel with penalty breakdown, GL preview, approval timeline
- [x] Initiate Termination dialog with penalty vs buyout comparison
- [x] Wire route /lease/terminations and sidebar link

## Gap Analysis — Priority 1: Critical

- [x] P1-01: Lease classification logic (finance vs operating, 5 IFRS 16 criteria) with decision tree UI
- [x] P1-02: IBR (Incremental Borrowing Rate) library — rate management screen with effective date history
- [x] P1-03: Automated remeasurement trigger on modification events (recalculate liability + ROU + journal)
- [x] P1-04: CPI/RPI index-linked rent escalation with auto-remeasurement batch
- [x] P1-05: Variable/contingent rent handling (separate tracking + disclosure)
- [x] P1-06: Short-term lease exemption tracking and aggregated disclosure
- [x] P1-07: Low-value lease exemption tracking and aggregated disclosure
- [x] P1-08: IFRS 16 formatted disclosure note (financial statement ready — all required paragraphs)
- [x] P1-09: Lease liability maturity analysis report (undiscounted cash flows by year band)
- [x] P1-10: ROU asset roll-forward report (opening + additions + depreciation + impairment + disposals + closing)
- [x] P1-11: Lease liability roll-forward report (opening + additions + interest + payments + remeasurements + closing)
- [x] P1-12: ERP journal export (CSV/Excel in SAP/Oracle/Dynamics format)
- [x] P1-13: ERP file export wizard with mapping configuration
- [x] P1-14: Bulk/mass lease remeasurement (portfolio-wide IBR or CPI change)
- [x] P1-15: Excel/CSV bulk lease import wizard with validation and preview
- [x] P1-16: ASC 842 parallel accounting framework (dual-standard on same lease record)

## Gap Analysis — Priority 2: High

- [x] P2-01: AI-powered lease abstraction from PDF documents (OCR + field extraction)
- [x] P2-02: Lease origination workflow (request → approval → contract → activation)
- [x] P2-03: Sub-lease / intermediate lessor accounting (head lease lessee + sublease lessor)
- [x] P2-04: Lessor-side finance lease receivable accounting (lease receivable + unearned income)
- [x] P2-05: Lease option tracking (renewal, purchase, termination) with exercise workflow
- [x] P2-06: Break clause management with notice period tracking and calendar alerts
- [x] P2-07: Rent review / rent escalation schedule management with step-up history
- [x] P2-08: Lease incentive accounting (rent-free periods, tenant improvement allowances)
- [x] P2-09: Security deposit tracking and accounting (asset + liability entries)
- [x] P2-10: Critical date calendar with configurable lead-time alerts per event type
- [x] P2-11: Email notification engine for critical dates (expiry, renewal, break, rent review)
- [x] P2-12: Outlook/Google Calendar .ics export for lease events
- [x] P2-13: SSO / SAML 2.0 configuration screen (Azure AD / Okta)
- [x] P2-14: REST API with OpenAPI specification (public endpoints for leases, invoices, journals)
- [x] P2-15: Webhook / event notification system (configurable outbound HTTP hooks)
- [x] P2-16: Custom report builder (drag-and-drop field selector, grouping, sorting, filters)
- [x] P2-17: Scheduled report delivery (email PDF/Excel on cron schedule)
- [x] P2-18: Portfolio-level budget vs. actual variance analysis screen
- [x] P2-19: Lease cost allocation to cost centres / business units

## Gap Analysis — Priority 3: Medium

- [x] P3-01: What-if scenario modelling (renew vs. relocate vs. exit — NPV comparison)
- [x] P3-02: Market rent benchmarking (manual comparable entry + variance to contracted rent)
- [x] P3-03: Space / floor plan management (area, floor, building hierarchy)
- [x] P3-04: Desk / room booking and occupancy utilisation tracking
- [x] P3-05: Capital project tracking (fit-out, refurbishment — budget vs. actual)
- [x] P3-06: Facilities management work order system
- [x] P3-07: Vendor / contractor management (linked to maintenance and capital projects)
- [x] P3-08: Lease abstraction quality scoring (completeness %)
- [x] P3-09: Duplicate lease detection (same lessor + location + overlapping dates)
- [x] P3-10: Lease data validation rules engine (configurable business rules)
- [x] P3-11: Multi-entity / multi-company accounting (entity selector, separate GL per entity)
- [x] P3-12: Intercompany lease elimination (flag + exclude from consolidated reports)
- [x] P3-13: Consolidation reporting across entities
- [x] P3-14: Foreign currency translation with FX gain/loss accounting
- [x] P3-15: Hedge accounting for FX-denominated leases
- [x] P3-16: Budgeting module (lease budget entry + forecast vs. actual)
- [x] P3-17: Cashflow forecasting (12/24/36 month rolling projection)
- [x] P3-18: ESG carbon footprint calculation per lease (Scope 1/2/3 emissions)
- [x] P3-19: TCFD / SASB sustainability disclosure report
- [x] P3-20: Lessor credit risk scoring (payment history + rating)

## Gap Analysis — Priority 4: Low

- [x] P4-01: Mobile-responsive UI (all screens optimised for tablet/phone)
- [x] P4-02: Responsive tablet UI improvements
- [x] P4-03: Broker / agent management (linked to lease origination)
- [x] P4-04: Letter of Intent (LOI) tracking (pre-contract stage)
- [x] P4-05: Lease comparison / benchmarking tool (side-by-side lease terms)
- [x] P4-06: Tenant improvement allowance tracking
- [x] P4-07: DocuSign / e-signature integration for lease documents

## Furnished Property Assets & Asset Deposit Module

### Database & Backend
- [x] Create table: lease.furnished_assets (asset_id, contract_id, asset_category, asset_name, brand, model, serial_number, condition_at_handover, estimated_value, photo_url, notes)
- [x] Create table: lease.asset_deposits (deposit_id, contract_id, deposit_amount, deposit_currency, deposit_date, deposit_type, bank_ref, status, released_amount, release_date, notes)
- [x] Create table: lease.asset_handover_checklist (checklist_id, contract_id, checklist_type [HANDOVER/RETURN], conducted_date, conducted_by, overall_condition, notes, signed_off)
- [x] Create table: lease.asset_checklist_items (item_id, checklist_id, asset_id, condition_at_check, damage_description, repair_cost_estimate, deduct_from_deposit, photo_url)
- [x] Create table: lease.asset_deposit_deductions (deduction_id, deposit_id, asset_id, deduction_reason, deduction_amount, approved_by, approved_date)
- [x] Create tRPC router: furnishedAssets — list, create, update, delete, getByLease
- [x] Create tRPC router: assetDeposits — list, create, release, deduct, getByLease
- [x] Create tRPC router: handoverChecklists — list, create, complete, getByLease, addItem

### Frontend Pages
- [x] Build FurnishedAssets.tsx — asset inventory per lease with category grouping, condition badges, photo upload, estimated value totals
- [x] Build AssetDepositRegister.tsx — asset deposit register separate from security deposits, with release workflow and deduction tracking
- [x] Build HandoverChecklist.tsx — digital handover/return checklist with per-asset condition, damage photos, repair cost estimation, deposit deduction calculation
- [x] Build AssetDepositDeductions.tsx — deduction management screen showing deposit balance, approved deductions, remaining refund amount

### Navigation
- [x] Add "Furnished Assets" section to DashboardLayout sidebar under "Operational"
- [x] Wire all 4 new pages in App.tsx

## Master Services Contract (MSC) Module

### Database & Backend
- [x] Create table: msc.master_contracts (msc_id, msc_ref, contract_type [FLEET/RESIDENTIAL], title_en, title_ar, party_a_en, party_a_ar, party_b_en, party_b_ar, effective_date, expiry_date, contract_value, currency, payment_terms_en, payment_terms_ar, scope_en, scope_ar, governing_law_en, governing_law_ar, jurisdiction_en, jurisdiction_ar, termination_en, termination_ar, warranties_en, warranties_ar, signed_by_en, signed_by_ar, witness_en, witness_ar, status, created_by, created_at)
- [x] Create table: msc.contract_assets (link_id, msc_id, asset_type [VEHICLE/HOME], asset_ref, asset_description, make_model, plate_vin, location, linked_lease_id)
- [x] Create tRPC router: masterContracts — list, getById, create, update, delete, linkAsset, unlinkAsset, getLinkedAssets

### Frontend Pages
- [x] Build MSCRegister.tsx — list view with contract type filter (Fleet/Residential), status badges, expiry countdown, linked asset count
- [x] Build MSCDetail.tsx (combined into MSCContractViewer) — full attribute screen showing all EN/AR fields side by side, linked assets sub-table, action buttons (Edit, Print, View Contract)
- [x] Build MSCContractViewer.tsx — portrait A4 bilingual contract renderer (EN left column, AR right column RTL), printable via browser print

### Navigation
- [x] Add "Master Contracts" section to DashboardLayout sidebar under "Contracts"
- [x] Wire all 3 new pages in App.tsx

## Gen AI Fill Button (All Data Entry Forms)

- [x] Create tRPC procedure: ai.fillForm — accepts formType + existing partial data, returns structured JSON with realistic field values
- [x] Create GenAIFillButton component (client/src/components/GenAIFillButton.tsx) — Sparkles icon button with loading spinner, calls ai.fillForm, merges returned values into form state
- [x] Create useGenAIFill hook (client/src/hooks/useGenAIFill.ts) — wraps the tRPC mutation with loading/error state
- [x] Add Gen AI button to: NewLease form
- [x] Add Gen AI button to: MSCRegister (create contract form)
- [x] Add Gen AI button to: FurnishedAssets (add asset form)
- [x] Add Gen AI button to: AssetDepositRegister (add deposit form)
- [x] Add Gen AI button to: HandoverChecklist (create checklist form)
- [x] Add Gen AI button to: OpsMaintenance (raise ticket form)
- [x] Add Gen AI button to: OpsInsurance (add policy form)
- [x] Add Gen AI button to: VendorManagement (add vendor form)
- [x] Add Gen AI button to: BrokerManagement (add broker form)
- [x] Add Gen AI button to: LOITracking (add LOI form)
- [x] Add Gen AI button to: TenantImprovementAllowance (add TI form)
- [x] Add Gen AI button to: ESignatureIntegration (send for signature form)
- [x] Add Gen AI button to: SecurityDeposits (add deposit form)
- [x] Add Gen AI button to: SubLeases (add sub-lease form)
- [x] Add Gen AI button to: RentReviews (add review form)
- [x] Add Gen AI button to: LeaseModifications (add modification form)
- [x] Add Gen AI button to: LeaseTerminations (initiate termination form)
- [x] Add Gen AI button to: BudgetingForecasting (add budget entry form)
- [x] Add Gen AI button to: HedgeAccounting (add hedge form)
- [x] Add Gen AI button to: DeskBooking (add booking form)
- [x] Add Gen AI button to: FacilitiesWorkOrders (raise work order form)
- [x] Add Gen AI button to: LeaseComparison (add comparison form)
- [x] Add Gen AI button to: LessorMaster (add lessor form)
- [x] Add Gen AI button to: AssetRegistry (add asset form)

## Screen ID, Audit Log & Error Log (All Screens)
- [x] Create reusable ScreenHeader component (screen ID badge, last modified, audit log trigger, error log trigger)
- [x] Create AuditLogDrawer component (shows who did what and when per screen, calls auditLog tRPC)
- [x] Create ErrorLogDrawer component (shows API/form errors per screen with timestamp, calls errorLog tRPC)
- [x] Create server-side auditLog tRPC router (logAction, getByScreen, getAll)
- [x] Create server-side errorLog tRPC router (logError, getByScreen, getAll)
- [x] Add ScreenHeader to all 50+ pages with unique Screen IDs
- [x] Wire audit log writes on all create/update/delete mutations

## Property Furniture Collection Module
- [x] Create furniture_collections table (collection_id, property_id, property_name, collection_name, created_at, updated_at)
- [x] Create furniture_items table (item_id, collection_id, category, name, brand, model, serial_number, condition, quantity, unit_value, total_value, notes, added_at)
- [x] Create tRPC router: furnitureCollections (list, getByProperty, create, update, delete, getWithItems)
- [x] Create tRPC router: furnitureItems (listByCollection, create, update, delete, bulkUpsert)
- [x] Build FurnitureCollections.tsx (list all properties with collection summary — item count, total value, last updated)
- [x] Build FurnitureCollectionDetail.tsx (full item CRUD for a specific property — inline edit, add row, delete row, Gen AI fill)
- [x] Add Gen AI fill button to FurnitureCollectionDetail item form
- [x] Wire navigation in DashboardLayout under "Furnished Assets" section
- [x] Wire routes in App.tsx

## Gen AI Fill on All Screens + Sidebar Reorganisation
- [x] Move Audit Log and Error Log from Compliance to System Settings in DashboardLayout
- [x] Add Gen AI fill button to: OpsMaintenance (raise ticket form)
- [x] Add Gen AI fill button to: OpsInsurance (add policy form)
- [x] Add Gen AI fill button to: VendorManagement (add vendor form)
- [x] Add Gen AI fill button to: BrokerManagement (add broker form)
- [x] Add Gen AI fill button to: LOITracking (add LOI form)
- [x] Add Gen AI fill button to: TenantImprovementAllowance (add TI form)
- [x] Add Gen AI fill button to: ESignatureIntegration (send for signature form)
- [x] Add Gen AI fill button to: SecurityDeposits (add deposit form)
- [x] Add Gen AI fill button to: SubLeases (add sub-lease form)
- [x] Add Gen AI fill button to: RentReviews (add review form)
- [x] Add Gen AI fill button to: LeaseModifications (add modification form)
- [x] Add Gen AI fill button to: LeaseTerminations (initiate termination form)
- [x] Add Gen AI fill button to: BudgetingForecasting (add budget entry form)
- [x] Add Gen AI fill button to: HedgeAccounting (add hedge form)
- [x] Add Gen AI fill button to: DeskBooking (add booking form)
- [x] Add Gen AI fill button to: FacilitiesWorkOrders (raise work order form)
- [x] Add Gen AI fill button to: LeaseComparison (add comparison form)
- [x] Add Gen AI fill button to: LessorMaster (add lessor form)
- [x] Add Gen AI fill button to: AssetRegistry (add asset form)
- [x] Add Gen AI fill button to: AssetDepositRegister (add deposit form)
- [x] Add Gen AI fill button to: HandoverChecklist (create checklist form)
- [x] Add Gen AI fill button to: FurnishedAssets (add asset form)
- [x] Add Gen AI fill button to: ConsolidationReporting (add entity form)
- [x] Add Gen AI fill button to: LeaseDataQuality (validation rule form)
- [x] Add Gen AI fill button to: ScenarioModelling (add scenario form)
- [x] Add Gen AI fill button to: CriticalDateCalendar (add alert form)

## Critical UI Fixes (Apr 24)
- [x] Fix Lessor Master: remove all modal dialogs, replace with right-side SlidePanel (no Dialog/Modal components anywhere)
- [x] Move Lessor Master and Asset Registry under Lease Management section in sidebar (not Master Data)
- [x] Fix ScreenHeader: add formType+onAIFormFill props for form-fill mode alongside existing screenType+onAIData
- [x] Fix NewLease: wire onAIFormFill to set lessor/asset/financial form state
- [x] Fix all other form pages: wire onAIFormFill to their form state setters

---

## UI ARCHITECTURE FIX — PHASE (Added Apr 24)

### FUNDAMENTAL RULE: Left = Sidebar Menu, Right = Full Inline Screen. NO modals/popups/overlays.

### CATEGORY 1 — Convert SlidePanel → Inline Screen (20 pages)
SlidePanel is a slide-over overlay. Replace with showForm inline pattern:
- showForm=true → full right-side form screen (sidebar stays visible)
- showForm=false → full right-side list/table screen (sidebar stays visible)

- [x] APIWebhookConfig.tsx — convert SlidePanel to inline form screen
- [x] BankAccounts.tsx — convert SlidePanel to inline form screen
- [x] BankRules.tsx — convert SlidePanel to inline form screen
- [x] BrokerManagement.tsx — convert SlidePanel to inline form screen
- [x] ContractMilestones.tsx — convert SlidePanel to inline form screen
- [x] DeskBooking.tsx — convert SlidePanel to inline form screen
- [x] ESignatureIntegration.tsx — convert SlidePanel to inline form screen
- [x] FacilitiesWorkOrders.tsx — convert SlidePanel to inline form screen
- [x] InvoiceRegister.tsx — convert SlidePanel to inline form screen
- [x] LOITracking.tsx — convert SlidePanel to inline form screen
- [x] LeaseComparison.tsx — convert SlidePanel to inline form screen
- [x] LeaseModifications.tsx — convert SlidePanel to inline form screen
- [x] LeaseRenewals.tsx — convert SlidePanel to inline form screen
- [x] NotificationSettings.tsx — convert SlidePanel to inline form screen
- [x] OpsInsurance.tsx — convert SlidePanel to inline form screen
- [x] OpsMaintenance.tsx — convert SlidePanel to inline form screen
- [x] PaymentRuns.tsx — convert SlidePanel to inline form screen
- [x] SSOConfig.tsx — convert SlidePanel to inline form screen
- [x] TenantImprovementAllowance.tsx — convert SlidePanel to inline form screen
- [x] VendorManagement.tsx — convert SlidePanel to inline form screen

### CATEGORY 2 — Add Missing CRUD (6 pages)
- [x] AssetRegistry.tsx — add full CRUD (create, edit, delete) + inline form
- [x] BudgetVariance.tsx — add full CRUD (create, edit, delete) + inline form
- [x] LeaseOrigination.tsx — add full CRUD (create, edit, delete) + inline form
- [x] LessorMaster.tsx — add full CRUD (create, edit, delete) + inline form
- [x] ScenarioModelling.tsx — add full CRUD (create, edit, delete) + inline form
- [x] CPIEscalation.tsx — wire apply escalation mutation properly

### CATEGORY 3 — Wire Gen AI Fill Button (5 pages missing it)
- [x] AssetRegistry.tsx — add GenAIFillButton (formType: asset_registry)
- [x] BudgetVariance.tsx — add GenAIFillButton (formType: budget_entry)
- [x] LeaseOrigination.tsx — add GenAIFillButton (formType: new_lease)
- [x] LessorMaster.tsx — add GenAIFillButton (formType: lessor)
- [x] ScenarioModelling.tsx — add GenAIFillButton (formType: new_lease)

---

## UI ARCHITECTURE FIX — Apr 24, 2026

### FUNDAMENTAL RULE (Non-Negotiable)
- Left side = Navigation Menu (sidebar)
- Right side = Full UI Screen (inline, no modals, no overlays, no SlidePanel)
- Every data screen MUST have: Add New button, Edit button per row, Delete button per row
- Gen AI button MUST appear on every form that accepts data input

### Phase A: SlidePanel → Inline Screen Conversion (DONE)
- [x] BankAccounts.tsx — converted to inline showForm
- [x] BankRules.tsx — converted to inline showForm
- [x] BrokerManagement.tsx — converted to inline showForm
- [x] ContractMilestones.tsx — converted to inline showForm
- [x] InvoiceRegister.tsx — converted to inline showForm
- [x] LOITracking.tsx — converted to inline showForm
- [x] LeaseModifications.tsx — converted to inline showForm
- [x] OpsInsurance.tsx — converted to inline showForm
- [x] OpsMaintenance.tsx — converted to inline showForm
- [x] PaymentRuns.tsx — converted to inline showForm
- [x] RentReviews.tsx — converted to inline showForm
- [x] SecurityDeposits.tsx — converted to inline showForm
- [x] SubLeases.tsx — converted to inline showForm
- [x] TenantImprovementAllowance.tsx — converted to inline showForm
- [x] VendorManagement.tsx — converted to inline showForm
- [x] APIWebhookConfig.tsx — converted to inline showForm
- [x] DeskBooking.tsx — converted to inline showForm
- [x] ESignatureIntegration.tsx — converted to inline showForm
- [x] NotificationSettings.tsx — converted to inline showForm
- [x] SSOConfig.tsx — converted to inline showForm

### Phase B: Gen AI Form-Fill Wiring (DONE)
- [x] NewLease.tsx — Gen AI wired to all 5 wizard steps
- [x] LessorMaster.tsx — Gen AI wired to lessor, contact, bank, note forms
- [x] BankAccounts.tsx — Gen AI wired
- [x] All other SlidePanel-converted pages — Gen AI wired

### Phase C: Data Binding Bug Fix (DONE)
- [x] BankAccounts.tsx — fixed: query returns {accounts:[]} not plain array; now reads (data as any)?.accounts ?? []
- [x] BankAccounts.tsx — added Edit + Delete buttons to each card

### Phase D: Edit/Delete Missing on Table Rows (COMPLETED Apr 24)
- [x] VendorManagement.tsx — already had Edit/Delete dropdown
- [x] BrokerManagement.tsx — already had Edit/Delete dropdown
- [x] InvoiceRegister.tsx — Edit/Delete added per row
- [x] ContractMilestones.tsx — Edit/Delete added per card
- [x] LOITracking.tsx — already had Edit/Delete
- [x] OpsInsurance.tsx — Edit/Delete dropdown added
- [x] OpsMaintenance.tsx — Edit/Delete dropdown added
- [x] PaymentRuns.tsx — Edit/Delete added, GenAI wired
- [x] RentReviews.tsx — Edit/Delete added per row
- [x] SecurityDeposits.tsx — Edit/Delete added per row
- [x] SubLeases.tsx — Edit/Delete added per row
- [x] TenantImprovementAllowance.tsx — already had full CRUD
- [x] BankRules.tsx — rewritten with full CRUD
- [x] LeaseModifications.tsx — already had Edit/Delete

### Phase E: Pages Missing Add New Button (COMPLETED Apr 24)
- [x] CriticalDateCalendar.tsx — Edit/Delete added per row
- [x] LeaseOptionsBreaks.tsx — Edit/Delete added, GenAI wired
- [x] VariableRent.tsx — rewritten with full CRUD
- [x] LeaseExemptions.tsx — rewritten with full CRUD
- [x] ContractRegister.tsx — Add New button + inline form added
- [x] HandoverChecklist.tsx — Edit/Delete added per row
- [x] ChequeInventory.tsx — Edit/Delete added per row
- [x] BounceManagement.tsx — Edit/Delete added per row
- [x] SpaceManagement.tsx — Edit/Delete added, GenAI wired
- [x] TenantPortal.tsx — Edit/Delete added per row
- [x] AssetDepositRegister.tsx — Edit/Delete added per row
- [x] LeaseTerminations.tsx — Edit/Delete added per row
- [x] MSCRegister.tsx — Delete added (Edit already existed)

### Phase F: Delete Confirmation (No Modal — Use Toast Action) (COMPLETED Apr 24)
- [x] All data pages — delete uses toast action pattern
- [x] No AlertDialog/Dialog remaining in any page

### Read-Only Screens (No CRUD Needed — By Design)
- Dashboard.tsx, MISAnalytics.tsx, MISCashflow.tsx, MISCost.tsx, MISPortfolio.tsx, MISReports.tsx
- ComplianceIFRS16.tsx, ASC842.tsx, IFRS16Disclosure.tsx, ConsolidationReporting.tsx
- RollForwardReport.tsx, MaturityAnalysis.tsx, BankHistory.tsx, BankImport.tsx
- BankReconWorkspace.tsx, ERPExport.tsx, ESGReporting.tsx, ESGCarbon.tsx
- WorkflowMonitor.tsx, WorkflowEscalations.tsx, WorkflowTasks.tsx
- Amortisation.tsx, RemeasurementEngine.tsx, GLJournals.tsx
- AIAbstraction.tsx, AILeaseAnalytics.tsx, MISAIQuery.tsx

## UI Architecture Fix — Phase D: Edit/Delete on All Data Pages (COMPLETED Apr 24)

### Problem Fixed
- Bank Accounts showed empty screen with no Add button — root cause: query returned `{accounts:[...]}` but code read it as plain array. Fixed data binding, now shows 3 existing records with Edit/Delete.
- 9 pages had no per-row Edit or Delete buttons — added to all.

### Pages Fixed
- [x] BankAccounts — fixed data binding bug, added Edit/Delete per card
- [x] BankRules — rewritten with inline form, Edit/Delete per row
- [x] InvoiceRegister — Edit/Delete dropdown added per row
- [x] ContractMilestones — Edit/Delete buttons added per milestone card
- [x] OpsInsurance — Edit/Delete dropdown per table row
- [x] OpsMaintenance — Edit/Delete dropdown per table row
- [x] PaymentRuns — Edit/Delete dropdown per table row, GenAIFillButton added
- [x] RentReviews — Edit/Delete buttons per row
- [x] SecurityDeposits — Edit/Delete buttons per row, openAdd/openEdit pattern
- [x] SubLeases — Edit/Delete buttons per row, openAdd/openEdit pattern
- [x] TenantImprovementAllowance — already had full CRUD (verified, no change needed)
- [x] LeaseModifications — already had Edit/Delete (verified, no change needed)
- [x] VendorManagement — already had Edit/Delete dropdown (verified, no change needed)
- [x] BrokerManagement — already had Edit/Delete dropdown (verified, no change needed)

### Architecture Rules Enforced
- Left = Menu sidebar | Right = Full UI screen (no overlays)
- All forms use inline showForm pattern (Back button returns to list)
- Delete uses toast action confirmation (no AlertDialog modals)
- Gen AI button present on all data entry forms
- 0 TypeScript errors

## UI Architecture Fix — Phase E: Add New Button Missing (COMPLETED Apr 24)
- [x] CriticalDateCalendar — Edit/Delete added per row
- [x] LeaseOptionsBreaks — Edit/Delete added per row, GenAI wired
- [x] VariableRent — rewritten with full CRUD
- [x] LeaseExemptions — rewritten with full CRUD
- [x] ContractRegister — Add New button + inline form added (was completely missing)
- [x] HandoverChecklist — Edit/Delete added per row
- [x] SpaceManagement — Edit/Delete added per row, GenAI wired
- [x] AssetDepositRegister — Edit/Delete added per row
- [x] LeaseTerminations — Edit/Delete added per row
- [x] MSCRegister — Delete added (Edit already existed)

## UI Architecture Fix — Phase E (COMPLETED Apr 24 2026)

### Problem Identified
All data screens must follow: Left = Menu | Right = Full UI Screen. No modal windows. Every data screen must have Add, Edit, Delete. Gen AI on every form.

### Phase D — Edit/Delete on 14 data pages (COMPLETED)
- [x] BankAccounts — fixed data binding bug (query returned {accounts:[]} not array), Edit/Delete per card
- [x] BankRules — rewritten with inline form, Edit/Delete per row
- [x] InvoiceRegister — Edit/Delete per row added
- [x] ContractMilestones — Edit/Delete per card added
- [x] OpsInsurance — Edit/Delete dropdown per row
- [x] OpsMaintenance — Edit/Delete dropdown per row
- [x] PaymentRuns — Edit/Delete per row, GenAI wired
- [x] RentReviews — Edit/Delete per row
- [x] SecurityDeposits — Edit/Delete per row
- [x] SubLeases — Edit/Delete per row
- [x] TenantImprovementAllowance — already had full CRUD (verified)
- [x] LeaseModifications — already had Edit/Delete (verified)
- [x] VendorManagement — already had Edit/Delete dropdown (verified)
- [x] BrokerManagement — already had Edit/Delete dropdown (verified)

### Phase E — Add New / Edit / Delete on 10 more pages (COMPLETED)
- [x] CriticalDateCalendar — Edit/Delete added per row
- [x] LeaseOptionsBreaks — Edit/Delete added per row, GenAI wired
- [x] VariableRent — rewritten with full CRUD
- [x] LeaseExemptions — rewritten with full CRUD
- [x] ContractRegister — Add New button + inline form added (was completely missing)
- [x] HandoverChecklist — Edit/Delete added per row
- [x] SpaceManagement — Edit/Delete added per row, GenAI wired
- [x] AssetDepositRegister — Edit/Delete added per row
- [x] LeaseTerminations — Edit/Delete added per row
- [x] MSCRegister — Delete added (Edit already existed)

### Architecture Fixes (COMPLETED)
- [x] All 20 SlidePanel overlay pages converted to inline full-screen form pattern
- [x] Gen AI button wired to form fields on all major data entry pages
- [x] 0 TypeScript errors

### Phase F — Delete confirmation via toast (COMPLETED Apr 24)
- [x] All AlertDialog/Dialog/SlidePanel modals eliminated — 0 remaining in any page
- [x] Delete actions use toast confirmation pattern throughout

### Phase G — Remaining pages audit (COMPLETED Apr 24)
- [x] Full audit of all 103 pages completed
- [x] LessorMaster rewritten with DashboardLayout (was missing global sidebar)
- [x] Edit/Delete added to: AdminPanel, IBRLibrary, GLJournals, ChequeInventory, BounceManagement, BouncePenalty, BudgetVariance, ESGCarbon, HedgeAccounting, LeaseDataQuality, LessorCreditScore, RemeasurementEngine, LeaseOrigination, LessorFinanceLease, ScenarioModelling, TenantPortal, WorkflowQueue, MSCContractViewer, MultiEntityFX
- [x] 0 TypeScript errors

## Country Field Fix (Apr 25)
- [x] NewLease.tsx — Country field in Step 1 always defaults to Qatar (QA), Gen AI always fills country as Qatar

## Audit Log & Error Log Improvements (Apr 25)
- [x] AuditLog.tsx — add elapsed time column (time since event, e.g. "2m ago", "3h ago") prominently displayed
- [x] ErrorLog.tsx — add screen_id, user_id columns; make timestamp prominent

## Sub-Asset Registry (Apr 25)
- [x] Rename AssetRegistry.tsx → SubAssetRegistry.tsx (Sub-Asset Registry)
- [x] Build master item library with 80+ items: furniture, appliances (AC brands/tonnage, washer brands/capacity), electronics
- [x] Each item has: Item Code, Name, Category, Brand, Model, Spec (tonnage/capacity/size), Serial Number field
- [x] Visual set builder UI: left panel = item library with search/filter, right panel = set composition
- [x] Set has: Set Code (auto), Set Name, Description, items with qty + serial numbers
- [x] Save/Edit/Delete sets; sets can later be attached to a lease
- [x] Update App.tsx route and sidebar nav label to "Sub-Asset Registry"

## Menu & Date Field Updates (Apr 25)
- [x] DashboardLayout.tsx — rename "Asset Registry" nav label to "Sub-Asset Registry"
- [x] AssetRegistry.tsx — add Purchase Date and Warranty Expiry date fields to set builder items
- [x] LessorMaster.tsx — add date fields (Contract Start Date, Contract End Date, Registration Date)

## New Lease Date Fields (Apr 25)
- [x] NewLease.tsx — add Contract Prepared Date and Created Date fields (Step 1 or Review step)

## Sub-Asset Registry Redesign (Apr 25)
- [x] AssetRegistry.tsx — new layout: top = saved sets dropdown panel, bottom-left = item library, bottom-right = set builder
- [x] AssetRegistry.tsx — 300+ items with approximate QAR prices and category/sub-category dropdowns
- [x] AssetRegistry.tsx — rename "Purchase Date" to "Lease Date" in set builder

## Sub-Asset Registry Bug Fixes (Apr 25)
- [x] AssetRegistry.tsx — fix set code counter (derive from savedSets.length, not module-level let)
- [x] AssetRegistry.tsx — add ScreenHeader back (screen ID was removed in rewrite)

## Sub-Asset Registry DB Persistence (Apr 25)
- [x] Check existing SPs for sub_asset_sets and sub_asset_lines tables
- [x] Add tRPC procedures: getSubAssetGroups, upsertSubAssetGroup, deleteSubAssetGroup
- [x] AssetRegistry.tsx — replace useState with tRPC queries/mutations for full DB persistence
- [x] AssetRegistry.tsx — fix Edit to load set back into builder from DB
- [x] AssetRegistry.tsx — fix Delete to call DB delete mutation

## Item Library CRUD (Apr 25)
- [x] AssetRegistry.tsx — add "Add Item" button to Item Library header
- [x] AssetRegistry.tsx — each item row gets Edit (pencil) and Delete (trash) icon buttons
- [x] AssetRegistry.tsx — inline form to add/edit item: Name, Category, Sub-Category, Brand, Model, Spec, Unit Price (QAR)
- [x] AssetRegistry.tsx — custom items persist alongside built-in library items

## Sub-Asset Set Selector in New Lease (Apr 25)
- [x] NewLease.tsx Step 2 — add "Sub-Asset Sets" section with multi-select from saved sets (getSubAssetGroups)
- [x] Show each selected set as a card with set code, name, item count, total QAR value
- [x] Allow removing a selected set with an X button
- [x] Pass selected set IDs in the lease creation payload (subAssetSetIds field)
- [x] Step 5 Review — show attached sub-asset sets summary table
- [x] Update todo.md when complete

## Sub-Asset Transaction Log (Apr 25)
- [x] Create sp_LogSubAssetTransaction SP (txn_id, action, entity_type, entity_id, entity_code, entity_name, before_json, after_json, changed_by, changed_at, screen_id, ip_address)
- [x] Create sp_GetSubAssetTransactions SP (filter by entity_id, action, date range, user)
- [x] Add tRPC procedures: asset.logSubAssetTxn, asset.getSubAssetTxns to lessorAsset router
- [x] Wire logSubAssetTxn call in AssetRegistry.tsx on every upsertSubAssetGroup mutation (INSERT/UPDATE)
- [x] Wire logSubAssetTxn call in AssetRegistry.tsx on every deleteSubAssetGroup mutation (DELETE)
- [x] Wire logSubAssetTxn call in AssetRegistry.tsx on every custom item add/edit/delete (localStorage ops)
- [x] Build SubAssetTransactionLog.tsx — full transaction log screen with filters (action, date, user)
- [x] Show before/after JSON diff in expandable row for each transaction
- [x] Add "Transaction Log" button in Sub-Asset Registry header linking to the log screen
- [x] Wire route /sub-asset-registry/transactions in App.tsx
- [x] Add Transaction Log link in sidebar under Sub-Asset Registry

## Sub-Asset Lifecycle Management (Apr 25)
- [x] Create asset.lease_sub_assets table: lease_sub_asset_id, lease_id, asset_id (set), asset_code, set_name, status (Active/Cancelled/Returned/BackIn/Replaced), status_date, reason, replaced_by_asset_id, notes, created_by, created_at
- [x] Create sp_AttachSubAssetToLease SP (insert lease_sub_assets row, log transaction)
- [x] Create sp_UpdateSubAssetStatus SP (update status + log transaction)
- [x] Create sp_GetLeaseSubAssets SP (get all sets for a lease with status)
- [x] Create sp_GetLeaseList SP (get leases for selector dropdown)
- [x] Add tRPC procedures: asset.attachSubAssetToLease, asset.updateSubAssetStatus, asset.getLeaseSubAssets, asset.getLeaseList
- [x] Build LeaseSubAssets.tsx — lease selector + sub-asset sets grid with status badges
- [x] Status change dialog: select new status (Cancelled/Returned/BackIn/Replaced), date, reason, replacement set picker for Replaced
- [x] Each set card shows: set code, set name, item count, status badge, status date, reason, action buttons
- [x] Wire route /lease-sub-assets in App.tsx
- [x] Add "Lease Sub-Assets" link in sidebar under Lease Management
- [x] Log every status change to sub_asset_transactions table

## Serial Number & Date at Lease Attachment (Apr 25)
- [x] AssetRegistry.tsx — remove serial number input fields from set builder (not required at set creation)
- [x] LeaseSubAssets.tsx — attach dialog: after selecting a set, show each item in the set with mandatory Serial Number and Date fields
- [x] Validate all serial numbers and dates are filled before allowing Attach
- [x] Store serial numbers and dates per item in the lease_sub_assets.tags_with_serials JSON column (add column to table)
- [x] Update sp_AttachSubAssetToLease to accept and store tags_with_serials
- [x] Display serial numbers and dates in the expanded card view on the Lease Sub-Assets screen

## Transaction-Based Sub-Asset Attachment & Inventory Display (Apr 25)
- [x] Update tRPC attachSubAssetToLease to accept tagsWithSerials (JSON: [{code, name, qty, serialNumbers[], attachDate}])
- [x] Log ATTACH transaction to sub_asset_transactions on every attach (before=null, after=full item list with serials)
- [x] Log STATUS_CHANGE transaction to sub_asset_transactions on every status update
- [x] LeaseSubAssets.tsx attach dialog: after selecting a set, expand each item row with serial number inputs (one per qty) and a single attachment date — all mandatory
- [x] Validate all serial numbers filled and attachment date set before saving
- [x] Expanded set card: show full item inventory table (Item Code, Name, Category, Qty, Serial Numbers, Attachment Date)
- [x] Show transaction history badge on each card (click to view log for that set on that lease)

## Print/Export Inventory PDF (Apr 25)
- [x] Add warranty_expiry_date column to lease_sub_assets table (per item in tags_with_serials JSON)
- [x] Update attach dialog: add optional warranty expiry date per item
- [x] Update sp_AttachSubAssetToLease to store warranty expiry in tags_with_serials
- [x] Add tRPC procedure asset.getLeaseInventoryForExport returning full item list with serials + warranty dates
- [x] Build /api/lease-inventory-pdf/:leaseId Express endpoint that generates PDF using html-pdf or similar
- [x] Add "Export PDF" and "Print" buttons to LeaseSubAssets.tsx header
- [x] PDF layout: header (lease ref, property, date), table (item, category, brand, spec, qty, serial numbers, attach date, warranty expiry)

## Handover Checklist Auto-Population (Apr 25)
- [x] Read HandoverChecklist.tsx to understand current structure
- [x] Add tRPC procedure asset.getLeaseSubAssetItems returning flat item list for a lease (all items from all active sets)
- [x] Add "Import from Sub-Asset Registry" button to HandoverChecklist.tsx
- [x] Auto-populate checklist rows with item name, serial number, category from attached sets
- [x] Each imported row is pre-filled but editable; user can add condition notes and sign off

## Warranty Expiry Alerts (Apr 25)
- [x] Add sp_GetExpiringWarranties SP: returns items where warranty_expiry_date is within 30 days
- [x] Add tRPC procedure asset.getExpiringWarranties
- [x] Add warranty expiry alert card to Dashboard (show count of expiring items, link to Lease Sub-Assets)
- [x] Add warranty expiry section to AlertCentre with item-level detail (lease, set, item, serial, expiry date)

## New Lease Step 2 — Expandable Sub-Asset Set Panel
- [x] Replace compact set chip with expandable accordion panel in NewLease.tsx Step 2
- [x] Clicking the set header (chevron) expands to show all items in a table
- [x] Per-item editable fields: Serial Number, Leased Date, Warranty End Date, Status
- [x] Status dropdown options: Active, Cancelled, Returned, BackIn, Replaced
- [x] Validate serial numbers are filled before allowing Step 3
- [x] Show item count and total QAR value in collapsed header

## Sub-Asset Transaction Log Rebuild
- [x] Add Lease Number dropdown filter to SubAssetTransactionLog.tsx (uses getLeaseList)
- [x] Add Sub-Asset Set dropdown filter (uses getSubAssetGroups, filtered by selected lease)
- [x] Add action toolbar: Add, Edit, Delete, Returned, Write Off, Replaced, Condemned
- [x] Add Ownership toggle per record: Lease / Lessor (default: Lease)
- [x] Add ownership field to lease_sub_assets table and sp_UpdateSubAssetStatus
- [x] Add tRPC procedures for each action: writeOff, condemn (map to updateSubAssetStatus with new statuses)
- [x] Each action logs a transaction to sub_asset_transactions
- [x] Action buttons are context-sensitive (greyed out when no row selected)
- [x] Ownership change also logs a transaction (OWNERSHIP_CHANGE action)

## Lease Dropdown Fix
- [x] Fix sp_GetLeaseList to return all leases with leaseRef and description/asset name
- [x] Update SubAssetTransactionLog.tsx dropdown to show leaseRef + description

## Lessee Fields in Lessor Master (Apr 25)
- [x] ALTER lessor.lessors table: add lessee_type, lessee_name, staff_number, grade, position, place_of_work, department, employee_id, lessee_contact_email, lessee_contact_phone columns
- [x] DROP + recreate dbo.sp_GetLessors to include new lessee fields in SELECT
- [x] DROP + recreate dbo.sp_GetLessorDetail to return new lessee fields
- [x] DROP + recreate dbo.sp_UpsertLessor to accept and save all new lessee params
- [x] DROP + recreate asset.sp_AttachSubAssetToLease to accept lessee_name and store as owner
- [x] DROP + recreate asset.sp_UpdateSubAssetStatus to accept lessor_name/lessee_name and update owner on Returned/BackIn
- [x] DROP + recreate asset.sp_GetLeaseSubAssets to return owner column
- [x] Update asset.sp_GetLeaseListForSubAsset to JOIN lessor.lessors and return lessee_name
- [x] Update tRPC upsertLessor procedure to accept and forward all new lessee fields
- [x] Update tRPC attachSubAssetToLease procedure to accept lesseeName and forward to SP
- [x] Update tRPC updateSubAssetStatus procedure to accept lessorName/lesseeName and forward to SP
- [x] Update tRPC getLeaseList procedure to return lesseeName field
- [x] Add Lessees tab to LessorMaster.tsx detail view (lessee_type, lessee_name, staff_number, grade, position, place_of_work, department, employee_id, contact_email, contact_phone)
- [x] Fix LeaseSubAssets.tsx selectedLease lookup to use camelCase leaseId
- [x] Fix LeaseSubAssets.tsx lease SelectItem to use camelCase leaseId
- [x] Add owner field to AttachedSet mapping in LeaseSubAssets.tsx
- [x] Wire lesseeName on doAttach() in LeaseSubAssets.tsx
- [x] Wire lessorName/lesseeName on doStatusChange() in LeaseSubAssets.tsx (Returned → lessor, BackIn → lessee)
- [x] Fix confirmAttach() in SubAssetTransactionLog.tsx to pass lesseeName
- [x] Fix confirmAction() in SubAssetTransactionLog.tsx to pass lessorName/lesseeName based on action type

## Lessee Details Tab Rebuild (Apr 25)
- [x] Add handleLesseeAIFill handler to map AI-generated data to lesseeForm state
- [x] Add Gen AI Fill button to Lessee tab header (only visible in edit mode)
- [x] Rebuild read-only view: profile hero card with avatar initials, type/grade/department badges, staff number + employee ID in header
- [x] Rebuild read-only view: Employment Details section (staff no, employee ID, grade, position, department, place of work) with icons
- [x] Rebuild read-only view: Contact section (email, phone) with icons
- [x] Rebuild edit form: Identity section (lessee type select, full name input)
- [x] Rebuild edit form: Employment Details section (staff number, employee ID, grade, position, department, place of work) with leading icons
- [x] Rebuild edit form: Contact Information section (email, phone) with leading icons
- [x] Add bottom save bar with Cancel + Save Lessee Details buttons
- [x] Add lessee name required validation before save
- [x] Add lessee type badge in tab header (Staff=blue, Client=green, Other=gray) in read-only mode
- [x] TypeScript: 0 errors

## New Lease Wizard — Lessee Details Step 2 (Apr 25)
- [x] Create lease.lease_lessee_details table (contract_id FK, lessee_type, lessee_name, staff_number, employee_id, grade, position, department, place_of_work, contact_email, contact_phone, created_at, updated_at)
- [x] Create dbo.sp_UpsertLeaseLesseeDetails SP (upsert by contract_id)
- [x] Create dbo.sp_GetLeaseLesseeDetails SP (select by contract_id)
- [x] Add tRPC procedure lease.upsertLesseeDetails (protectedProcedure)
- [x] Add tRPC procedure lease.getLesseeDetails (protectedProcedure)
- [x] Insert Step 2 "Lessee Details" in NewLease.tsx wizard after Lessor Details
- [x] Renumber all subsequent steps (Asset Details → 3, Financial Terms → 4, Documents → 5, Review & Post → 6)
- [x] Add screen ID VFLSNEWLS0002P001 to Lessee Details step header
- [x] Gen AI fill wired via existing ScreenHeader onAIFormFill (maps lesseeType, lesseeName, staffNumber, employeeId, grade, lesseePosition, lesseeDepartment, placeOfWork, lesseeContactEmail, lesseeContactPhone)
- [x] Add all 10 lessee fields with grouped sections (Identity, Employment, Contact)
- [x] Wire Next button with lessee name validation (required)
- [x] Lessee details saved to DB via upsertLesseeDetails after lease creation in onSuccess
- [x] Add Lessee summary card to Review & Post step (Step 6)
- [x] Extend aiFill new_lease schema with 10 lessee fields
- [x] TypeScript: 0 errors

## Sub-Asset Attachment — Lessee-First Selection (Apr 25)
- [x] Create dbo.sp_GetLesseeList SP (returns lessor_id, lessee_name, lessee_type, staff_number, position, department, grade, place_of_work, contact_email, contact_phone from lessor.lessors where lessee_name IS NOT NULL)
- [x] Create dbo.sp_GetLeaseByLessee SP (given lessorId, joins lease.contracts via lease.lessors using lessor_ref/legal_name match, returns top 1 active/draft contract)
- [x] Add tRPC procedure lessor.getLesseeList (publicProcedure in lessorRouter)
- [x] Add tRPC procedure lessor.getLeaseByLessee (publicProcedure in lessorRouter, input: lessorId)
- [x] Update LeaseSubAssets.tsx: add Lessee selector as first control above Lease Number (amber-bordered)
- [x] On lessee selection, auto-call getLeaseByLessee via useEffect and pre-fill the Lease Number dropdown
- [x] Show lessee detail strip (position, dept, grade, location) below selector
- [x] Show red warning if lessee has no linked lease
- [x] Keep rest of attach/status cycle unchanged
- [x] TypeScript: 0 errors

## Sub-Asset Transaction Log — Add Card (Apr 25)
- [x] Audit sub-asset items table columns and existing SPs (items stored as JSON in tags_with_serials)
- [x] Create asset.sp_AddSubAssetItem SP (always INSERT — appends new ItemWithSerial JSON to array)
- [x] Add tRPC procedure asset.addSubAssetItem (protectedProcedure, logs ADD_ITEM transaction)
- [x] Add "Add" card as first action card in SubAssetTransactionLog action row (emerald, Plus icon)
- [x] Build Add dialog with all fields: code, name*, category*, sub-category, brand, model, spec, qty*, serial numbers (dynamic), attach date*, warranty expiry, unit price QAR
- [x] confirmAddItem validates name + category required, auto-generates code if blank
- [x] On success: invalidate getLeaseSubAssets + getSubAssetTxns, close dialog, reset form, show toast
- [x] Warning shown if set is not yet attached to a lease
- [x] TypeScript: 0 errors

## Amortisation Schedule — Monthly/Yearly UI (Apr 25)
- [x] Audit existing Amortisation.tsx and sp_GetAmortisationSchedule
- [x] Recreate sp_GetAmortisationSchedule: returns 2 result sets (contract header + schedule rows), computes on-the-fly using effective interest method if no saved rows exist
- [x] Create sp_GetLeaseListForAmortisation (all contracts with lessor name for selector)
- [x] Add tRPC lease.getLeaseListForAmortisation (protectedProcedure)
- [x] Update tRPC lease.getAmortisationSchedule to use execSPPMulti for dual result sets
- [x] Rebuild Amortisation.tsx: lease selector with contract ref + asset + lessor display
- [x] Monthly/Yearly toggle buttons (red active state)
- [x] 4 KPI summary cards (Total Payments, Interest, Principal, Depreciation)
- [x] Monthly view: full schedule table with 11 columns, click-to-expand accordion per row
- [x] Accordion: 2 journal entries per period (JE-1 payment, JE-2 depreciation) with GL account codes
- [x] Yearly view: aggregated table with 9 columns, click-to-expand accordion per year
- [x] Yearly accordion: consolidated JEs + monthly breakdown sub-table
- [x] Save to DB button wired to saveAmortisationSchedule mutation
- [x] TypeScript: 0 errors

## Amortisation — All Leases Grouped + Consolidated GL Grid (Apr 25)
- [x] Create sp_GetAmortisationScheduleAll SP (all contracts, filtered by year/month, returns lease header + schedule rows)
- [x] Create sp_GetConsolidatedGLEntries SP (groups all leases by GL account per period, returns consolidated debit/credit lines)
- [x] Add tRPC lease.getAmortisationScheduleAll (protectedProcedure, input: year, viewMode)
- [x] Add tRPC lease.getConsolidatedGLEntries (protectedProcedure, input: year, viewMode)
- [x] Rebuild Amortisation.tsx: year selector + monthly/yearly toggle at top
- [x] Grid 1: all leases grouped by lease (collapsible rows), 11 columns + totals row
- [x] Grid 2: consolidated GL accounting entries (one row per GL account per period, debit/credit columns, total row)
- [x] TypeScript: 0 errors

## Amortisation — All Leases Grouped + Consolidated GL Grid (Apr 25) — COMPLETED
- [x] Create sp_GetAmortisationScheduleAll SP (all contracts, filtered by year/month, returns lease header + schedule rows joined with contract header and lessor name)
- [x] Create sp_GetConsolidatedGLEntries SP (groups all leases by GL account per period, returns consolidated debit/credit lines with lease_count)
- [x] Add tRPC lease.getAmortisationScheduleAll (protectedProcedure, input: year, viewMode)
- [x] Add tRPC lease.getConsolidatedGLEntries (protectedProcedure, input: year, viewMode)
- [x] Rebuild Amortisation.tsx: year selector (All Years + specific years) + monthly/yearly toggle
- [x] Grid 1: all leases grouped by contract (collapsible rows), 11 columns, grand totals row, Expand All / Collapse All buttons
- [x] Grid 2: consolidated GL accounting entries (one row per GL account per period, debit=blue/credit=emerald, grand totals row, click-to-expand per period)
- [x] 5 KPI cards: Leases count, Total Payments, Total Interest, Total Principal, Total Depreciation
- [x] TypeScript: 0 errors

## Lease Register — Lessee Name & Date Columns (Apr 26)
- [x] Audit LeaseRegister.tsx and sp_GetLeaseRegister to understand current columns
- [x] Update sp_GetLeaseRegister to JOIN lease_lessee_details and return lessee_name, lessee_type, lessee_staff_number, lessee_position, lessee_department
- [x] commencement_date and expiry_date were already returned — confirmed present
- [x] Add Lessee column to Lease Register table (amber User icon + name + type badge; shows — if no lessee)
- [x] Lessee name also searchable via SearchTerm filter in the SP
- [x] TypeScript: 0 errors

## Soft Delete & Action Menu Fix (Apr 26)
- [x] Create sp_SoftDeleteContract SP (UPDATE lease.contracts SET status='Deleted' WHERE contract_id=@ContractId)
- [x] Update sp_GetLeaseRegister to exclude status='Deleted'
- [x] Update sp_GetAmortisationScheduleAll to exclude status='Deleted'
- [x] Update sp_GetConsolidatedGLEntries to exclude status='Deleted'
- [x] Add deleteLease tRPC procedure (calls sp_SoftDeleteContract)
- [x] Fix LeaseRegister.tsx: use contract_id (not lease_id) in all menu handlers
- [x] Wire View Details → /leases/new?view={contract_id}
- [x] Wire Modify Lease → /leases/new?edit={contract_id}
- [x] Wire View Amortisation → /leases/amortisation
- [x] Wire Initiate Renewal → /leases/renewals
- [x] Replace fake Delete toast with confirmation dialog + real deleteLease mutation
- [x] TypeScript: 0 errors

## IFRS 16 Lifecycle Engine (Production-Grade)
- [x] Add lifecycle_status column to lease.contracts (Draft/Active/Modified/Closed)
- [x] Add originated_at, modified_at columns to lease.contracts
- [x] Add posting_status (Projected/Posted/Locked) and posted_at to lease.amortisation_schedule
- [x] Create lease.gl_postings table (permanent audit ledger of every JE posted)
- [x] Create sp_OriginateLease (one-time JE-1, generates projected schedule, sets status=Active)
- [x] Create sp_PostPeriod (posts JE-2/3/4 for a specific month, marks period as Posted)
- [x] Create sp_ModifyLease (JE-6 remeasurement, regenerates remaining Projected periods)
- [x] Create sp_CloseLease (JE-5 derecognition, sets status=Closed)
- [x] Create sp_GetLeaseLifecycle (returns schedule with posting_status per period)
- [x] Add tRPC procedures: originateLease, postPeriod, modifyLease, closeLease, getLifecycle
- [x] Update Amortisation screen: lifecycle status badge per lease row
- [x] Add Originate button per lease (disabled after origination)
- [x] Add Post Period button per month row (disabled if Posted or future)
- [x] Add Modify Rent button per lease (only for Active/Modified leases)
- [x] Add Close Lease button per lease (only for Active/Modified leases)
- [x] Add GL Postings ledger panel showing all posted JEs with timestamps and je_ref

## Feature 1 — IFRS 16 Disclosure Notes Generator
- [x] Create sp_GetIFRS16DisclosureNotes SP (maturity analysis, ROU movement, weighted avg IBR, lease liability reconciliation)
- [x] Add tRPC lease.getDisclosureNotes procedure (input: reportingYear)
- [x] Create DisclosureNotes.tsx page with 4 tables: Maturity Analysis, ROU Asset Movement, Liability Reconciliation, Key Assumptions
- [x] Add Copy to Clipboard and Export to Excel buttons
- [x] Register route /accounting/disclosure-notes in App.tsx
- [x] Add "Disclosure Notes" nav link under Accounting Engine in sidebar

## Feature 2 — Lease Renewal Engine
- [x] Create lease.renewals table (renewal_id, contract_id, renewal_date, new_expiry_date, new_monthly_payment, new_term_months, new_ibr, status, created_by, created_at)
- [x] Create sp_InitiateRenewal SP (inserts into lease.renewals, sets status=Pending)
- [x] Create sp_ApproveRenewal SP (extends contract expiry, recalculates PV, appends new Projected schedule rows, posts JE-7 remeasurement, sets status=Approved)
- [x] Create sp_GetRenewals SP (returns all renewals with contract details)
- [x] Add tRPC procedures: initiateRenewal, approveRenewal, getRenewals, rejectRenewal
- [x] Create RenewalEngine.tsx page with pending renewals list, Approve/Reject actions, and new terms form
- [x] Register route /leases/renewal-engine in App.tsx
- [x] Add "Renewal Engine" nav link under Lease Management in sidebar

## Feature 3 — Period-End Close Lock
- [x] Create lease.period_close table (close_id, period_year, period_month, closed_at, closed_by, status)
- [x] Create sp_ClosePeriod SP (locks all Posted rows for a given year/month, inserts into period_close, prevents re-posting)
- [x] Create sp_GetPeriodCloseStatus SP (returns close status for each month of a given year)
- [x] Create sp_ReopenPeriod SP (unlocks rows for a given year/month)
- [x] Add tRPC procedures: closePeriod, getPeriodCloseStatus, reopenPeriod
- [x] Create PeriodClose.tsx page with 12-month calendar grid showing Open/Closed status per month
- [x] Add Close/Reopen Period buttons with confirmation dialogs
- [x] Register route /accounting/period-close in App.tsx
- [x] Add "Period-End Close" nav link under Accounting Engine in sidebar

## Feature 4 — IFRS 16 vs IAS 17 Comparative Report
- [x] Create sp_GetIAS17Comparison SP (calculates straight-line rent expense per period vs IFRS 16 interest+depreciation, returns side-by-side per lease per year)
- [x] Add tRPC lease.getIAS17Comparison procedure (input: year)
- [x] Create IAS17Comparison.tsx page with year selector
- [x] Table: per-lease comparison (IAS 17 rent expense vs IFRS 16 interest + depreciation + difference)
- [x] Summary KPI cards: Total IAS 17 expense, Total IFRS 16 expense, Net P&L impact, Balance sheet impact
- [x] Bar chart: IAS 17 vs IFRS 16 expense per year (Recharts grouped bar)
- [x] Export to Excel button
- [x] Register route /accounting/ias17-comparison in App.tsx
- [x] Add "IAS 17 vs IFRS 16" nav link under Accounting Engine in sidebar

## Feature 5 — Multi-Currency FX Revaluation
- [x] Create lease.fx_rates table (rate_id, currency_code, rate_date, closing_rate, source, created_at)
- [x] Create lease.fx_revaluation_log table (reval_id, contract_id, period_year, period_month, currency_code, original_amount_fc, closing_rate, revalued_amount_lc, prev_carrying_lc, fx_gain_loss, je_ref, posted_by, posted_at)
- [x] Create sp_UpsertFXRate SP (upsert closing rate for a currency/date)
- [x] Create sp_GetFXRates SP (returns rate history for a currency)
- [x] Create sp_RunFXRevaluation SP (for a given year/month: revalues all non-QAR lease liabilities, posts JE-8 FX gain/loss, inserts into fx_revaluation_log)
- [x] Create sp_GetFXRevaluationLog SP (returns revaluation history with JE refs)
- [x] Add tRPC procedures: getFXRates, upsertFXRate, runFXRevaluation, getFXRevaluationLog, getFXRevaluationSummary
- [x] Create FXRevaluation.tsx page with: currency rate table, Run Revaluation button, revaluation log, KPI cards
- [x] Register route /accounting/fx-revaluation in App.tsx
- [x] Add "FX Revaluation" nav link under Accounting Engine in sidebar
- [x] Vitest tests for FX revaluation procedures (13/13 passing)

## Feature 6 — Renewal Due Badge Counter & Email Notification
- [x] Create sp_GetRenewalDueCount SP (returns count of leases expiring within 90 days that have no Pending/Approved renewal)
- [x] Create sp_GetRenewalDueLeases SP (returns list of leases entering the 90-day window for the first time today)
- [x] Add tRPC lease.getRenewalDueCount procedure (public, called by sidebar on mount)
- [x] Add tRPC lease.checkAndNotifyRenewalDue procedure (protected, checks for new entries and sends owner notification)
- [x] Add live badge count to sidebar "Renewal Engine" nav link in DashboardLayout.tsx
- [x] Badge shows red pill with count when > 0, hidden when 0
- [x] Add server-side owner notification email when a lease first enters the 90-day window
- [x] Notification includes: lease ref, lessor name, expiry date, days remaining
- [x] Add a lease.renewal_notifications table to track which leases have already been notified (prevent duplicate emails)
- [x] Wire checkAndNotifyRenewalDue to run on DashboardLayout mount (once per session)
- [x] Vitest tests for getRenewalDueCount and checkAndNotifyRenewalDue (9/9 passing)

## Feature 7 — Lease Transaction Centre
- [x] Create sp_GetLeasesForTransaction SP (returns Active/Modified leases with current carrying amounts, remaining term, next payment date)
- [x] Create sp_PreviewModification SP (input: contract_id, new_monthly_payment, effective_date, new_ibr; returns: new PV, ROU delta, liability delta, remeasurement gain/loss, new amortisation schedule preview)
- [x] Create sp_PreviewTermination SP (input: contract_id, termination_date; returns: derecognition JE amounts, gain/loss on termination)
- [x] Create sp_PreviewRenewal SP (input: contract_id, new_expiry_date, new_monthly_payment, new_ibr; returns: new PV, JE-7 amounts, new schedule preview)
- [x] Create sp_GetLeaseTransactionHistory SP (returns all posted transactions for a lease: modifications, terminations, renewals with JE refs)
- [x] Create sp_PostLeaseTransaction SP (unified posting: type=Modification|Termination|Renewal; posts correct JE, updates schedule, updates lifecycle_status)
- [x] Add tRPC procedures: getLeasesForTransaction, previewModification, previewTermination, previewRenewal, postLeaseTransaction, getLeaseTransactionHistory
- [x] Build LeaseTransactionCentre.tsx page with:
  - [x] Left panel: searchable lease selector with current status, liability balance, expiry date
  - [x] Right panel: 3-tab transaction type selector (Modify Rent | Terminate Lease | Renew Lease)
  - [x] Step 1 — Input Form: transaction-specific fields with inline validation
  - [x] Step 2 — Remeasurement Preview: before/after KPI cards (PV, ROU, Liability, Gain/Loss)
  - [x] Step 3 — Journal Entry Preview: Dr/Cr table with GL codes, amounts, effective date
  - [x] Step 4 — New Amortisation Schedule: accordion grid showing regenerated monthly schedule
  - [x] Step 5 — Post: system posts JE and updates schedule with confirmation dialog
  - [x] Step 6 — Confirmation: JE reference, timestamp, posted-by, link to GL Postings ledger
  - [x] Transaction History panel: accordion list of all past transactions for the selected lease
- [x] Register route /leases/transaction-centre in App.tsx
- [x] Add "Transaction Centre" nav link under Lease Management in sidebar
- [x] Vitest integration tests: 9/9 passing

## Feature 8 — Live Consolidated Financial Statements (IAS 1)
- [x] Audit existing gl_postings and coa tables to confirm account type classification (Asset/Liability/Equity/Revenue/Expense)
- [x] Create sp_GetBalanceSheet SP (aggregates gl_postings by account type as at period-end date, returns Assets/Liabilities/Equity sections)
- [x] Create sp_GetIncomeStatement SP (aggregates P&L accounts for a period: depreciation, interest, FX gain/loss, rent expense)
- [x] Create sp_GetCashFlowStatement SP (classifies lease cash flows: principal repayments=Financing, interest=Financing, short-term/low-value=Operating)
- [x] Add tRPC procedures: getBalanceSheet, getIncomeStatement, getCashFlowStatement
- [x] Build FinancialStatements.tsx page with 3 tabs: Balance Sheet | Income Statement | Cash Flow
- [x] Balance Sheet: Assets section (ROU Asset gross, Accumulated Depreciation, Net ROU; other assets), Liabilities section (Current lease liability, Non-current lease liability), Equity section
- [x] Income Statement: Depreciation expense, Interest on lease liabilities, FX revaluation gain/loss, Short-term/low-value lease expense, Net IFRS 16 P&L impact
- [x] Cash Flow: Financing activities (principal + interest payments), Operating activities (short-term/low-value payments)
- [x] Period selector (year/quarter/month), Export to Excel, Print view
- [x] Register route /accounting/financial-statements in App.tsx
- [x] Add "Financial Statements" nav link under Accounting Engine in sidebar

## Feature 9 — ROU Asset & Lease Liability Roll-Forward (IFRS 16 Para 53)
- [x] Create sp_GetROURollForward SP (Opening → Additions → Depreciation → Modifications → Disposals/Terminations → FX → Closing, by asset class)
- [x] Create sp_GetLiabilityRollForward SP (Opening → Additions → Interest accrued → Payments → Modifications → FX revaluation → Terminations → Closing)
- [x] Add tRPC procedures: getROURollForward, getLiabilityRollForward
- [x] Build RollForwardReport.tsx page (update existing page or create new) with 2 tabs: ROU Asset | Lease Liability
- [x] Each tab: movement table with opening/closing balances and all movement lines, subtotals, Export to Excel
- [x] Asset class breakdown (Property, Vehicles, Equipment, etc.)
- [x] Register route /accounting/roll-forward in App.tsx
- [x] Add "Roll-Forward" nav link under Accounting Engine in sidebar

## Feature 10 — Trial Balance (IAS 1)
- [x] Create sp_GetTrialBalance SP (returns all GL accounts with debit total, credit total, and net balance as at period-end; grouped by account type)
- [x] Add tRPC procedure: getTrialBalance
- [x] Build TrialBalance.tsx page with: account code, account name, type, debit total, credit total, net balance
- [x] Show totals row: total debits must equal total credits (balanced check)
- [x] Filter by account type (All / Assets / Liabilities / Equity / Revenue / Expense)
- [x] Period-end date selector, Export to Excel
- [x] Register route /accounting/trial-balance in App.tsx
- [x] Add "Trial Balance" nav link under Accounting Engine in sidebar

## Feature 11 — Short-term & Low-value Exemption Register (IFRS 16 Para 5)
- [x] Add exemption_type column to lease.contracts (None / ShortTerm / LowValue)
- [x] Add exemption_reason text column to lease.contracts
- [x] Create sp_GetExemptionRegister SP (returns all exempted leases with: contract_ref, asset, lessor, monthly_payment, start_date, expiry_date, exemption_type, total_expense_ytd, total_expense_life)
- [x] Create sp_GetExemptionExpenseSummary SP (returns straight-line expense per period for all exempted leases)
- [x] Add tRPC procedures: getExemptionRegister, getExemptionExpenseSummary, updateLeaseExemption
- [x] Build ExemptionRegister.tsx page with: exemption register table, YTD expense summary, straight-line expense chart
- [x] Allow marking a lease as Short-term or Low-value from the register (with reason)
- [x] Show total exempted lease expense in Income Statement (feeding into Feature 8)
- [x] Register route /leases/exemption-register in App.tsx
- [x] Add "Exemption Register" nav link under Lease Management in sidebar
- [x] Vitest tests for all new tRPC procedures

## Feature 12 — IFRS 16 Disclosure Pack PDF Export
- [x] Create sp_GetDisclosurePack SP (aggregates all IFRS 16 disclosure data: notes, financial statements, roll-forward, trial balance, exemption register)
- [x] Add tRPC procedure: generateDisclosurePack (protectedProcedure, calls multiple SPs and assembles HTML for PDF)
- [x] Build DisclosurePack.tsx page with period selector, section checkboxes, and Generate PDF button
- [x] Server-side PDF generation using html-pdf-node npm package
- [x] PDF sections: cover page, disclosure notes, balance sheet, income statement, cash flow, ROU roll-forward, liability roll-forward, trial balance, exemption register
- [x] Register screen ID VFLDSCPK0001P001 in security.screen_registry
- [x] Register route /accounting/disclosure-pack in App.tsx
- [x] Add Disclosure Pack nav link under Accounting Engine in sidebar
- [x] Vitest tests for generateDisclosurePack tRPC procedure

## Feature 13 — Budget vs. Actual Variance Report
- [x] Create lease.budget_lines table: contract_id, period_year, period_month, budgeted_payment, budgeted_depreciation, budgeted_interest, created_at
- [x] Create sp_GetBudgetVsActual SP (joins budget_lines with amortisation_schedule and gl_postings; returns per-lease per-period: budgeted vs actual payment, depreciation, interest; variance amount and %; RAG status)
- [x] Create sp_UpsertBudgetLine SP (insert/update a budget line for a contract/period)
- [x] Create sp_GetBudgetSummary SP (aggregate totals: total budget, total actual, total variance, variance %)
- [x] Add tRPC procedures: getBudgetVsActual, upsertBudgetLine, getBudgetSummary
- [x] Build BudgetVariance.tsx page with: period selector, variance table with RAG badges, KPI cards, bar chart
- [x] Allow inline budget entry from the variance table
- [x] Register screen ID VFLBDGVAR0001P001 in security.screen_registry
- [x] Register route /accounting/budget-variance in App.tsx
- [x] Add Budget vs Actual nav link under Accounting Engine in sidebar
- [x] Vitest tests for getBudgetVsActual, upsertBudgetLine, getBudgetSummary

## Feature 14 — Lease Maturity Ladder (IFRS 16 Para 58)
- [x] Create sp_GetMaturityLadder SP (returns undiscounted future lease cash flows bucketed into < 1 year, 1-2 years, 2-3 years, 3-4 years, 4-5 years, > 5 years; by lease and in total; includes principal and interest split)
- [x] Add tRPC procedure: getMaturityLadder
- [x] Build MaturityLadder.tsx page with stacked bar chart, maturity table, as-at date selector
- [x] Register screen ID VFLMTYLDR0001P001 in security.screen_registry
- [x] Register route /accounting/maturity-ladder in App.tsx
- [x] Add Maturity Ladder nav link under Accounting Engine in sidebar
- [x] Vitest tests for getMaturityLadder

## Alt+1 / Alt+2 / Alt+3 Global Keyboard Shortcut Overlay
- [x] Create ScreenMetaRegistry: a central map from screenId to { sps: string[], tables: string[], standards: string[], techniques: string[] }
- [x] Populate ScreenMetaRegistry for all existing screens (Dashboard, Lease Register, Amortisation, GL Journals, Payables, Bank Recon, Cheque, Financial Statements, Roll-Forward, Trial Balance, Exemption Register, Disclosure Pack, Budget Variance, Maturity Ladder, etc.)
- [x] Create ScreenMetaContext: React context that holds the current screenId (set by each page via useScreenMeta hook)
- [x] Create AltKeyOverlay.tsx: floating drawer component that listens for Alt+1/Alt+2/Alt+3 globally
- [x] Alt+1 panel: shows stored procedures and database tables for the current screen
- [x] Alt+2 panel: shows applicable accounting standards (IFRS 16, ASC 842, IPSAS 43, IAS 17, etc.) with brief description
- [x] Alt+3 panel: shows computation techniques (Effective Interest Method, Straight-Line Depreciation, IBR-based PV, etc.) with formula hints
- [x] Wire AltKeyOverlay into DashboardLayout so it is available on all authenticated screens
- [x] Add keyboard shortcut hint in footer or help tooltip (Alt+1 = SPs/Tables, Alt+2 = Standards, Alt+3 = Techniques)

## Feature 15 — Multi-Standard Parallel Computation (IFRS 16 vs ASC 842 vs IPSAS 43)
- [x] Create lease.sp_GetMultiStandardComparison SP (computes ROU asset, lease liability, depreciation, interest, P&L impact for a single lease under IFRS 16, ASC 842, and IPSAS 43 simultaneously; returns side-by-side rows per period)
- [x] Create lease.sp_GetStandardSummary SP (aggregate totals per standard: total ROU, total liability, total P&L impact)
- [x] Add tRPC procedures: getMultiStandardComparison, getStandardSummary
- [x] Build MultiStandardComparison.tsx page with: lease selector, period range, side-by-side comparison table (IFRS 16 | ASC 842 | IPSAS 43), difference columns, grouped bar chart
- [x] Add standard-specific notes panel (key differences: operating lease P&L for ASC 842, single-model for IFRS 16/IPSAS 43)
- [x] Register screen ID VFLMULSTD0001P001 in security.screen_registry with metadata
- [x] Register route /accounting/multi-standard in App.tsx
- [x] Add Multi-Standard nav link under Accounting Engine in sidebar
- [x] Vitest tests for getMultiStandardComparison, getStandardSummary

## Feature 17 — Lease Modification Wizard
- [x] Create lease.lease_modifications table (modification_id, contract_id, modification_date, modification_type, old_ibr, new_ibr, old_term_end, new_term_end, old_payment, new_payment, old_rou_nbv, new_rou_nbv, old_liability, new_liability, remeasurement_gain_loss, status, created_by, created_at, approved_by, approved_at)
- [x] Create lease.sp_GetLeaseModifications SP (list all modifications for a contract)
- [x] Create lease.sp_CreateLeaseModification SP (validate inputs, compute remeasurement: new PV of revised cash flows at new IBR, delta ROU and liability, gain/loss; insert into lease_modifications as draft)
- [x] Create lease.sp_ApplyLeaseModification SP (on approval: update lease.contracts with new terms, regenerate amortisation schedule, post remeasurement GL journals)
- [x] Add tRPC procedures: getLeaseModifications, createLeaseModification, applyLeaseModification
- [x] Build LeaseModificationWizard.tsx: 4-step wizard (Step 1: select lease + modification type; Step 2: enter new terms IBR/payment/end date; Step 3: review remeasurement impact table; Step 4: confirm and generate GL journals)
- [x] Show before/after comparison on Step 3: old vs new ROU, liability, P&L impact
- [x] Auto-generate remeasurement GL journal entries on Step 4 approval
- [x] Register screen ID VFLLSMOD0001P001 in security.screen_registry with metadata
- [x] Register route /leases/modification-wizard in App.tsx
- [x] Add Lease Modification nav link under Contracts in sidebar
- [x] Vitest tests for getLeaseModifications, createLeaseModification, applyLeaseModification

## Modify Lease Wizard Fix (Session continuation - Apr 27)
- [x] Create sp_UpdateLeaseContract in dbo schema (updates asset/financial fields on existing contract)
- [x] Add updateLease tRPC mutation in server/routers/lease.ts (calls sp_UpdateLeaseContract with audit log)
- [x] NewLease.tsx: read ?edit=contractId URL param and set isEditMode flag
- [x] NewLease.tsx: useEffect pre-populates all form states from trpc.lease.getLeaseById when editData loads
- [x] NewLease.tsx: handleSubmit conditionally calls updateLeaseMutation (edit mode) or createLeaseMutation (new mode)
- [x] NewLease.tsx: ScreenHeader title shows "Modify Lease" in edit mode
- [x] NewLease.tsx: Submit button label shows "Update Lease" in edit mode
- [x] TypeScript: 0 errors confirmed

## Modify Lease Wizard Fix (Session continuation - Apr 27)
- [x] Create sp_UpdateLeaseContract in dbo schema
- [x] Add updateLease tRPC mutation in server/routers/lease.ts
- [x] NewLease.tsx: edit mode pre-population from getLeaseById
- [x] NewLease.tsx: handleSubmit calls updateLeaseMutation in edit mode
- [x] NewLease.tsx: ScreenHeader title shows 'Modify Lease' in edit mode
- [x] NewLease.tsx: Submit button shows 'Update Lease' in edit mode
- [x] TypeScript: 0 errors confirmed

## Contract DMS Full Rebuild (Apr 29)
- [x] Read existing contracts schema, router, and pages
- [x] Add DB tables: contract_metadata_templates, contract_metadata_fields, contract_documents, contract_milestones, contract_metadata_values
- [x] Add tRPC procedures: metadataTemplates CRUD, contractDocuments CRUD (upload/list/delete), contractMilestones CRUD, contract metadata value upsert
- [x] Build Metadata Templates admin page (define field schemas per contract type)
- [x] Rebuild Contract Register as full DMS: multi-doc upload, metadata value entry, version history tab, milestones timeline tab, Create Lease button
- [x] Update sidebar: add Metadata Templates under Contracts
- [x] Wire Create Lease button to pre-fill /leases/new with contract metadata values
- [x] Save checkpoint and deliver

## Contract DMS Enhancements (Apr 29 - Session 2)
- [x] AI contract extraction: backend tRPC procedure reads uploaded PDF via LLM and returns field values
- [x] Extract with AI button in ContractRegister Documents tab auto-fills Metadata fields
- [x] Milestone alerts integration: wire contract milestones into Alert Rules engine (email notifications)
- [x] Remove redundant sidebar items: Version History, Document Vault, Milestones under Contracts

## Screen ID + Audit Log + Error Key Framework (Apr 29, 2026)
- [x] Every screen has a unique Screen ID (format: VFXXX-YYYYY-NNN) displayed in ScreenHeader
- [x] useScreenAudit hook — fires SCREEN_ENTER on mount, SCREEN_EXIT with elapsed ms on unmount
- [x] ScreenHeader auto-logs screen visits via useScreenAudit (no per-page changes needed)
- [x] Elapsed time tracked and stored in audit log (process_start_time → process_end_time or after_state.elapsedMs)
- [x] Error key format: username + screen_id stored in error log via ScreenErrorBoundary
- [x] ScreenErrorBoundary wraps children in DashboardLayout — catches React render errors
- [x] AuditLog page enhanced: Screen ID filter, Username filter, KPI cards (Total/Screen Visits/Data Actions/Slow), elapsed time with color coding
- [x] AuditLog: clicking Screen ID badge auto-filters by that screen
- [x] Applied ScreenHeader to all 11 remaining pages: AccountingStandardsPaper, ContractMetadataTemplates, DisclosureNotes, FXRevaluation, FinancialStatements, IAS17Comparison, LeaseExemptions, LeaseSubAssets, PeriodClose, RenewalEngine, TrialBalance
- [x] TypeScript clean — 0 errors after all changes

## No-Modal Policy: Convert All Dialogs to Full UI Screens (Apr 29, 2026)
- [ ] AlertsReports.tsx — replace Add/Edit Alert Rule dialog + Add/Edit Scheduled Report dialog + 2 delete confirm dialogs → inline right-panel forms
- [ ] LeaseTransactionCentre.tsx — replace all 5+ transaction dialogs (Modification, Termination, Renewal, etc.) → inline right-panel forms
- [ ] ContractMetadataTemplates.tsx — replace New/Edit Template dialog + Add/Edit Field dialog + 2 delete confirm dialogs → inline right-panel forms
- [ ] ContractRegister.tsx — replace Upload Document dialog + Add/Edit Milestone dialog + 2 delete confirm dialogs → inline right-panel forms
- [ ] Amortisation.tsx — replace Guide dialog + GL Explain dialog + Calculation dialog → inline expandable panels
- [ ] SubAssetTransactionLog.tsx — replace 3 dialogs → inline right-panel forms
- [ ] RenewalEngine.tsx — replace Initiate Renewal dialog + Renewal Preview dialog → inline right-panel forms
- [ ] PeriodClose.tsx — replace 2 period-close dialogs → inline right-panel forms
- [ ] LeaseSubAssets.tsx — replace 2 dialogs → inline right-panel forms
- [ ] LeaseDetail.tsx — replace Change Sub-Asset Status dialog + Period Calculation dialog → inline panels
- [ ] FXRevaluation.tsx — replace Add/Update FX Rate dialog + Run Revaluation dialog → inline right-panel forms
- [ ] PayablesApprovals.tsx — replace Reject Invoice dialog + Invoice Detail dialog → inline right-panel forms
- [ ] LeaseRegister.tsx — replace delete confirm dialog → inline confirmation row
- [ ] HandoverChecklist.tsx — replace checklist item dialog → inline right-panel form
- [ ] LeaseExemptions.tsx — replace Update Exemption Status dialog → inline right-panel form
- [ ] BudgetVsActual.tsx — replace Add/Update Budget Line dialog → inline right-panel form

## DMS Full Implementation (Apr 2026)
- [x] Fix all TypeScript errors in contractDms.ts (null→undefined, changedByName)
- [x] Fix ContractDocuments.tsx — correct listDocuments/extractMetadata input params
- [x] Fix ContractRegister.tsx — correct field names (contractId, documentId, milestoneDate)
- [x] ContractMilestones.tsx — full rebuild with real tRPC (listMilestones, upsertMilestone, completeMilestone, dismissMilestone, deleteMilestone, syncMilestoneToAlert)
- [x] ContractHistory.tsx — full rebuild with real tRPC (getContractHistory), timeline view, CSV export, date range filter
- [x] ContractModifications.tsx — full rebuild with real tRPC (createModification, submitModification, approveModification, rejectModification, applyModification), maker-checker workflow
- [x] App.tsx — add /contracts/modifications route
- [x] DashboardLayout.tsx — add Documents, Milestones, Modifications, History to Contracts nav
- [x] Zero TypeScript errors confirmed
