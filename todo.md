# VodaLease Enterprise — Project TODO

## Phase 1: Project Setup & Dependencies
- [x] Install SQL Server ODBC driver and mssql npm package
- [x] Install bpmn-js, bpmn-moddle for BPMN engine
- [x] Install socket.io for WebSocket real-time updates
- [x] Install ag-grid-community and ag-grid-react for data grids
- [x] Install recharts for analytics charts
- [ ] Install react-dropzone for document uploads
- [ ] Install date-fns for date manipulation
- [ ] Install xlsx for Excel export
- [ ] Install jspdf for PDF export
- [ ] Install axios for Python FastAPI communication
- [x] Configure environment secrets (SQL Server, Azure OpenAI)

## Phase 2: SQL Server Database & Stored Procedures
- [x] Create schemas: coa, lease, payables, finance, compliance, mis, security, workflow
- [x] Create all core tables with temporal history support
- [ ] Create stored procedure: sp_GetDashboardKPIs
- [ ] Create stored procedure: sp_GetLeaseRegister (paginated)
- [ ] Create stored procedure: sp_GetLeaseById
- [ ] Create stored procedure: sp_CreateLease
- [ ] Create stored procedure: sp_UpdateLease
- [ ] Create stored procedure: sp_SubmitLeaseForApproval
- [ ] Create stored procedure: sp_ApproveRejectLease
- [ ] Create stored procedure: sp_GetLessors
- [ ] Create stored procedure: sp_CreateLessor
- [ ] Create stored procedure: sp_GetAmortisationSchedule
- [ ] Create stored procedure: sp_PostMonthlyJournals
- [ ] Create stored procedure: sp_GetInvoiceRegister
- [ ] Create stored procedure: sp_CreateInvoice
- [ ] Create stored procedure: sp_ApproveInvoice
- [ ] Create stored procedure: sp_CreatePaymentRun
- [ ] Create stored procedure: sp_GetMakerCheckerQueue
- [ ] Create stored procedure: sp_GetAuditLog
- [ ] Create stored procedure: sp_WriteAuditLog
- [ ] Create stored procedure: sp_GetErrorLog
- [ ] Create stored procedure: sp_WriteErrorLog
- [ ] Create stored procedure: sp_GetGLJournals
- [ ] Create stored procedure: sp_PostGLJournal
- [ ] Create stored procedure: sp_GetUsers
- [ ] Create stored procedure: sp_UpsertUser
- [ ] Create stored procedure: sp_GetWorkflowInstances
- [ ] Create stored procedure: sp_CreateWorkflowInstance
- [ ] Create stored procedure: sp_CompleteWorkflowTask
- [ ] Create stored procedure: sp_GetInsurancePolicies
- [ ] Create stored procedure: sp_GetMaintenanceTickets
- [ ] Create stored procedure: sp_GetMISSnapshot
- [ ] Create stored procedure: sp_GetCashFlowForecast
- [ ] Create stored procedure: sp_GetPortfolioAnalytics
- [ ] Create stored procedure: sp_GetScreenRegistry
- [x] Seed Chart of Accounts (200+ GL codes)
- [x] Seed asset types, currencies, and configuration tables

## Phase 3: Backend Core
- [x] Create SQL Server connection pool using mssql
- [x] Create SPP executor utility (execSP function)
- [ ] Create screen ID registry middleware
- [ ] Create JWT RS256 authentication middleware
- [ ] Create RBAC middleware with role-based route protection
- [ ] Create audit log middleware (auto-log all write operations)
- [ ] Create error log middleware (auto-capture all exceptions)
- [ ] Create WebSocket server with 60-second KPI broadcast
- [ ] Create core auth router (login, logout, me, MFA)
- [ ] Create user management router

## Phase 4: Lease & Payables Routers
- [ ] Create lease router: getRegister, getById, create, update, submit, approve
- [ ] Create lessor router: list, create, update
- [ ] Create amortisation router: getSchedule, generateMonthlyJournals
- [ ] Create modification router: create, approve
- [ ] Create termination router: initiate, approve
- [ ] Create payables router: invoices CRUD, approve, reject
- [ ] Create payment run router: create, approve, generateBankFile (SWIFT + EFT)
- [ ] Create GL journal router: list, post, void
- [ ] Create maker/checker queue router: list, action, delegate

## Phase 5: BPMN Engine & Workflow
- [ ] Create BPMN process definition storage and versioning
- [ ] Create BPMN runtime executor (Node.js)
- [ ] Create workflow router: start, getInstances, getTasks, complete, escalate
- [ ] Implement LEASE_APPROVAL workflow
- [ ] Implement INVOICE_APPROVAL workflow
- [ ] Implement PAYMENT_RUN workflow
- [ ] Implement LEASE_MODIFICATION workflow
- [ ] Implement LEASE_RENEWAL workflow
- [ ] Implement LEASE_TERMINATION workflow
- [ ] Implement LTO_TRANSFER workflow
- [ ] Create SLA tracker and escalation timer

## Phase 6: Python FastAPI IFRS 16 Engine
- [ ] Create FastAPI app with Azure OpenAI integration
- [ ] Implement /ifrs16/compute-pv endpoint
- [ ] Implement /ifrs16/amortisation-schedule endpoint
- [ ] Implement /ifrs16/monthly-journals endpoint
- [ ] Implement /ifrs16/modification endpoint
- [ ] Implement /ifrs16/lto-schedule endpoint
- [ ] Implement /ocr/lease-document endpoint (GPT-4o)
- [ ] Implement /ocr/invoice endpoint (GPT-4o)
- [ ] Implement /genai/text-to-sql endpoint (LangChain)
- [ ] Implement /genai/anomaly-explain endpoint
- [ ] Implement /ml/anomaly-detection endpoint (Scikit-learn)
- [ ] Implement /genai/board-pack-narrative endpoint
- [ ] Implement /genai/renewal-recommendation endpoint

## Phase 7: Frontend Layout & Dashboard
- [x] Create enterprise dark theme with Vodafone red accent
- [x] Create DashboardLayout with collapsible sidebar
- [x] Create sidebar navigation with all module links
- [x] Create KPI ribbon with WebSocket live refresh (60s)
- [ ] Create Maturity Profile chart (Recharts bar)
- [ ] Create ROU Asset donut chart
- [ ] Create Payment Calendar widget
- [ ] Create Portfolio Summary table
- [ ] Create Cost vs Budget chart
- [ ] Create GenAI Insights panel with streaming

## Phase 8: Lease Register & Origination
- [x] Create Lease Register screen with AG Grid
- [ ] Implement server-side pagination and filtering
- [ ] Implement full-row context menu (View, Edit, Audit Trail, etc.)
- [ ] Implement bulk actions (export, flag, payment advice, renewal)
- [ ] Create New Lease Origination 5-step wizard
- [ ] Step 1: Lessor Details form
- [ ] Step 2: Asset Details with dynamic form by asset type
- [ ] Step 3: Financial Terms with LTO checkbox (configurable)
- [ ] Step 4: Document Upload with GPT-4o OCR
- [ ] Step 5: Review and Post with GL entry preview
- [ ] Implement Maker/Checker routing with configurable thresholds
- [ ] Create Lease Detail screen (full read-only view)
- [ ] Create Amortisation Schedule viewer

## Phase 9: Payables, MIS, BPMN, and Operational Modules
- [ ] Create Invoice Register screen with AG Grid
- [ ] Create Invoice Detail screen with OCR pre-fill
- [ ] Create Payment Run screen with bank file generation
- [ ] Create Maker/Checker Queue screen
- [ ] Create GL Journal screen
- [ ] Create Portfolio Health MIS dashboard
- [ ] Create Cost Performance charts
- [ ] Create Cash Flow Forecast chart
- [ ] Create GenAI text-to-SQL query panel (LangChain)
- [ ] Create Anomaly Detection queue screen
- [ ] Create Custom Report Builder
- [x] Create BPMN Process Modeler (embedded BPMN.io) — iframe approach with full Camunda palette
- [ ] Create Workflow Dashboard and Task Inbox
- [ ] Create Asset Maintenance Ticketing screen
- [ ] Create Insurance Policy Register screen
- [ ] Create ESG Sustainability Dashboard
- [ ] Create Document Expiry Tracker
- [ ] Create Audit Log screen (tamper-evident)
- [ ] Create Error Log screen
- [ ] Create User Management and RBAC screen
- [ ] Create Alert Centre screen

## Phase 10: Testing & Delivery
- [x] Write vitest credential validation tests (SQL Server + Azure OpenAI)
- [ ] Write vitest tests for SPP executor
- [ ] Write vitest tests for auth and RBAC middleware
- [ ] Verify WebSocket KPI broadcast
- [ ] Verify IFRS 16 computation accuracy
- [ ] Verify Maker/Checker workflow end-to-end
- [x] Save final checkpoint

## Contract Management Module (Added per user request)
- [ ] Contract stored procedures: sp_GetContracts, sp_GetContractById, sp_GetContractVersions, sp_CreateContractVersion, sp_TerminateContract, sp_RenewContract, sp_ModifyContract, sp_GetContractDocuments, sp_AttachContractDocument, sp_GetContractMilestones
- [ ] Contract router: server/routers/contracts.ts with full lifecycle CRUD, versioning, document vault, renewal, modification, termination, milestone tracking
- [ ] Contract List screen (VFLSECNTLST0001P001): AG Grid with status badges, expiry countdown, bulk actions
- [ ] Contract Detail screen (VFLSECNTDET0001P001): Tabbed view — Terms, Amortisation, Documents, History, Insurance, Maintenance, Milestones
- [ ] Contract Modification screen (VFLSECNTMOD0001P001): IFRS 16 remeasurement, before/after comparison, GL preview
- [ ] Contract Renewal screen (VFLSECNTREN0001P001): Renewal terms form, new amortisation preview, approval routing
- [ ] Contract Termination screen (VFLSECNTTRM0001P001): Penalty vs buyout analysis, derecognition GL preview, final settlement
- [ ] Contract Version History screen (VFLSECNTHST0001P001): Timeline of all changes with diff viewer
- [ ] Contract Document Vault screen (VFLSECNTDOC0001P001): Upload, OCR extraction, version control, expiry tracking
- [ ] Register all contract screen IDs in security.screen_registry

## Bank Account Reconciliation & Auto-Matching Module (Added per user request)

### Database & Stored Procedures
- [ ] Create schema: bank (bank_accounts, bank_statements, bank_transactions, recon_sessions, recon_matches, recon_exceptions, recon_rules)
- [ ] sp_GetBankAccounts — list all registered bank accounts
- [ ] sp_CreateBankAccount — register a new bank account
- [ ] sp_ImportBankStatement — import MT940/CSV/OFX statement rows
- [ ] sp_RunAutoMatch — engine: match bank lines to GL/payment runs via rules
- [ ] sp_GetReconSession — get session with match summary
- [ ] sp_GetUnmatchedItems — unmatched bank lines and GL items
- [ ] sp_ManualMatch — operator manually links a bank line to a GL entry
- [ ] sp_UnmatchItem — reverse a match
- [ ] sp_PostReconJournal — post reconciling GL entries for differences
- [ ] sp_CloseReconSession — lock and finalise a reconciliation period
- [ ] sp_GetReconHistory — historical sessions with status and stats
- [ ] sp_GetReconRules — configurable auto-match rule set
- [ ] sp_UpsertReconRule — create/update a matching rule

### Auto-Matching Engine Rules
- [ ] Rule 1: Exact match — bank amount = GL amount + same date ± 3 days
- [ ] Rule 2: Reference match — bank narrative contains payment run ref or invoice ref
- [ ] Rule 3: Tolerance match — amount within configurable tolerance (e.g. ±0.50)
- [ ] Rule 4: Aggregated match — one bank line matches multiple GL lines (sum)
- [ ] Rule 5: Split match — one GL line matches multiple bank lines
- [ ] Rule 6: AI-assisted match — GPT-4o analyses narrative for fuzzy lessor name match
- [ ] Confidence scoring: each match gets a score (0–100) and match method label
- [ ] Unmatched items flagged for manual review with suggested matches ranked by score

### Backend Router
- [ ] server/routers/bankRecon.ts — full CRUD + auto-match trigger + manual match + close session
- [ ] File upload handler for MT940, CSV, OFX bank statement formats
- [ ] GenAI narrative parser for AI-assisted matching
- [ ] WebSocket broadcast when auto-match completes

### UI Screens
- [ ] Bank Account Register (VFBNKACCREG0001P001) — list accounts with balance, last recon date
- [ ] Bank Statement Import (VFBNKSTMIMP0001P001) — drag-drop upload MT940/CSV/OFX, preview rows
- [ ] Reconciliation Workspace (VFBNKRECONWS0001P001) — split-pane: bank lines left, GL items right, match lines in centre
- [ ] Auto-Match Results (VFBNKAUTOMCH0001P001) — matched items with confidence scores, one-click accept all
- [ ] Unmatched Items Queue (VFBNKUNMTCH0001P001) — exceptions with AI suggested matches, manual link UI
- [ ] Reconciliation Summary (VFBNKRECSUM0001P001) — closing balance proof, difference analysis, post button
- [ ] Reconciliation History (VFBNKRECHST0001P001) — all closed sessions with drill-down
- [ ] Matching Rules Configuration (VFBNKRULCFG0001P001) — admin screen to configure tolerance, rules, priorities
- [ ] Register all bank recon screen IDs in security.screen_registry

## Cheque Inventory Module (Added per user request)

### Database & Stored Procedures
- [ ] Create table: cheque.bank_accounts (account_id, bank_name, account_number, account_name, currency, branch, is_active)
- [ ] Create table: cheque.cheque_books (book_id, bank_account_id, book_number, series_from, series_to, total_leaves, issued_leaves, available_leaves, status, received_date, screen_id)
- [ ] Create table: cheque.cheque_register (cheque_id, cheque_book_id, cheque_number, payee_lessor_id, payment_run_id, invoice_id, amount, currency, issue_date, presented_date, cleared_date, status, signatory_1, signatory_2, signature_type, void_reason, bounce_reason, replacement_cheque_id, gl_posted, screen_id, audit_no)
- [ ] Create table: cheque.cheque_signatories (signatory_id, user_name, designation, is_active, authority_limit)
- [ ] sp_GetBankAccountsForCheque — list cheque-enabled bank accounts
- [ ] sp_GetChequeBooks — paginated list with filter by bank account, status
- [ ] sp_CreateChequeBook — register new cheque book with series
- [ ] sp_GetNextAvailableCheque — get next unissued cheque number from a book
- [ ] sp_IssueCheque — issue cheque to lessor, link to invoice/payment run, post GL (Dr Payable / Cr Cheques in Transit)
- [ ] sp_PresentCheque — mark cheque as presented to bank
- [ ] sp_ClearCheque — mark cheque as cleared, post GL (Dr Cheques in Transit / Cr Bank)
- [ ] sp_BounceCheque — mark cheque as bounced, record reason, create replacement workflow
- [ ] sp_VoidCheque — void/stop payment, record reason, reverse GL
- [ ] sp_ReissueCheque — issue replacement cheque for bounced/void, link to original
- [ ] sp_GetChequeRegister — paginated register with filters (status, bank account, lessor, date range)
- [ ] sp_GetChequeById — full detail with GL entries and audit trail
- [ ] sp_GetChequeInventorySummary — dashboard KPIs (total in stock, issued, presented, cleared, bounced, stale)
- [ ] sp_GetStaleCheques — cheques not presented within 90 days
- [ ] sp_GetSignatories — list authorised signatories
- [ ] sp_UpsertSignatory — add/update signatory with authority limit

### Backend Router
- [ ] server/routers/cheque.ts — full tRPC router with all procedures
- [ ] Wire chequeRouter into server/routers.ts

### Frontend Screens (Dark Theme with Light Toggle)
- [ ] Cheque Dashboard (VFCHQDASH0001P001) — KPI cards: In Stock, Issued, Presented, Cleared, Bounced, Stale; dark theme default
- [ ] Cheque Book Register (VFCHQBOOK0001P001) — AG-style table, register new book button, status dropdown filter
- [ ] New Cheque Book form — bank account dropdown, book number, series from/to, received date, signatory assignment
- [ ] Cheque Register (VFCHQREG0001P001) — full register with status badges, amount, payee, dates, action menu
- [ ] Issue Cheque form (VFCHQISS0001P001) — select bank account → auto-select next cheque number, payee dropdown, amount, signatory dropdown (single/dual), link to invoice
- [ ] Cheque Detail screen (VFCHQDET0001P001) — full lifecycle timeline, GL entries, audit trail
- [ ] Bounce Handling screen (VFCHQBNC0001P001) — record bounce reason, bounce fee, trigger replacement cheque issuance
- [ ] Void/Stop Payment screen (VFCHQVOID0001P001) — void reason dropdown, GL reversal preview, confirm
- [ ] Stale Cheque Alert screen (VFCHQSTALE0001P001) — list of cheques not presented in 90+ days with action options
- [ ] Signatory Management screen (VFCHQSIGN0001P001) — manage authorised signatories, authority limits
- [ ] Theme toggle (dark/light) on all cheque screens
- [ ] Register all cheque screen IDs in security.screen_registry

## Bounced Cheque Replacement & Penalty Module (Added Apr 23)
- [ ] Create cheque.bounce_penalty_config table (flexible penalty types, rates, GL accounts)
- [ ] Create cheque.bounce_events table (full bounce history per cheque)
- [ ] Create sp_GetBouncePenaltyConfig stored procedure
- [ ] Create sp_SaveBouncePenaltyConfig stored procedure
- [ ] Create sp_RecordBouncedCheque stored procedure
- [ ] Create sp_IssueBounceReplacement stored procedure
- [ ] Create sp_GetBounceHistory stored procedure
- [ ] Create sp_GetBounceGLPreview stored procedure
- [ ] Build cheque.bounce tRPC router
- [ ] Build BounceConfiguration screen (penalty types, rates, GL accounts)
- [ ] Build BounceEventDialog (record bounce + penalty selection)
- [ ] Build BounceReplacementWizard (2-step: penalty → replacement cheque)
- [ ] Build BounceHistory screen
- [ ] Wire bounce routes into App.tsx and sidebar
- [ ] Write vitest tests for bounce router
- [ ] Save checkpoint

## Lessor Master & Asset Registry Module (Added Apr 23)
- [ ] Create lessor tables: lessor.lessors, lessor.lessor_contacts, lessor.lessor_bank_accounts, lessor.lessor_documents, lessor.lessor_notes
- [ ] Create asset tables: asset.assets, asset.asset_documents, asset.asset_maintenance_history, asset.asset_insurance_links
- [ ] sp_UpsertLessor, sp_GetLessors, sp_GetLessorDetail, sp_DeleteLessor
- [ ] sp_UpsertLessorContact, sp_GetLessorContacts, sp_DeleteLessorContact
- [ ] sp_UpsertLessorBankAccount, sp_GetLessorBankAccounts, sp_DeleteLessorBankAccount
- [ ] sp_AddLessorDocument, sp_GetLessorDocuments, sp_AddLessorNote, sp_GetLessorNotes
- [ ] sp_UpsertAsset, sp_GetAssets, sp_GetAssetDetail, sp_DeleteAsset
- [ ] sp_GetLessorAssets (assets linked to a lessor via leases)
- [ ] sp_GetAssetLeaseHistory (lease history for an asset)
- [ ] sp_AddAssetDocument, sp_GetAssetDocuments
- [ ] Build lessor tRPC router with full CRUD
- [ ] Build asset tRPC router with full CRUD
- [ ] Build LessorMaster.tsx: searchable table, add/edit drawer, contacts tab, bank accounts tab, assets tab, documents tab, notes tab
- [ ] Build AssetRegistry.tsx: searchable table, add/edit drawer, lease history tab, maintenance tab, insurance tab, documents tab
- [ ] Add routes /lessor-master and /asset-registry to App.tsx
- [ ] Add Lessor Master and Asset Registry to sidebar navigation
- [ ] Write vitest tests for lessor and asset routers

## Lease Termination Module (Added Apr 2026)
- [ ] sp_GetTerminationRegister — paginated list with status, lease ref, penalty, GL status
- [ ] sp_GetTerminationDetail — full detail including penalty breakdown and GL entries
- [ ] sp_InitiateTermination — raise new termination request with reason, effective date, penalty
- [ ] sp_ComputeTerminationPenalty — contractual penalty vs remaining liability buyout comparison
- [ ] sp_ApproveTermination — maker/checker approve step with threshold routing
- [ ] sp_RejectTermination — reject with mandatory reason, resets lease to Active
- [ ] sp_PostTerminationGL — IFRS 16 derecognition: Dr Lease Liability, Dr Accum Dep, Cr ROU Asset, Cr/Dr Gain-Loss
- [ ] sp_RecordMakeGoodSettlement — record make-good reinstatement payment
- [ ] sp_CancelTermination — cancel pending termination before approval
- [ ] sp_GetTerminationGLPreview — preview GL entries before posting
- [ ] termination.ts router — full tRPC router for all termination operations
- [ ] LeaseTerminations.tsx — table UI with status badges, filter panel, action dropdown
- [ ] Termination detail side panel with penalty breakdown, GL preview, approval timeline
- [ ] Initiate Termination dialog with penalty vs buyout comparison
- [ ] Wire route /lease/terminations and sidebar link
