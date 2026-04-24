import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { invokeLLM } from "../_core/llm";

// ─── Form type definitions ────────────────────────────────────────────────────
const FORM_PROMPTS: Record<string, { description: string; schema: Record<string, string> }> = {
  new_lease: {
    description: "A commercial real estate lease for an office or retail space in the UAE",
    schema: {
      leaseRef: "Unique lease reference like LEASE-2024-001",
      leaseName: "Descriptive name e.g. 'Dubai Marina Office - Floor 12'",
      leaseType: "One of: OPERATING, FINANCE",
      assetClass: "One of: OFFICE, RETAIL, WAREHOUSE, RESIDENTIAL, VEHICLE, EQUIPMENT",
      lessorName: "UAE-based property company name",
      lessorContact: "Contact person full name",
      lessorEmail: "Professional email address",
      lessorPhone: "+971 XX XXX XXXX format",
      propertyAddress: "Full UAE property address",
      city: "UAE city: Dubai, Abu Dhabi, Sharjah, etc.",
      country: "UAE",
      commencementDate: "ISO date YYYY-MM-DD, within last 2 years",
      expiryDate: "ISO date YYYY-MM-DD, 3-5 years from commencement",
      monthlyRent: "Realistic AED monthly rent as number (e.g. 45000)",
      currency: "AED",
      rentFrequency: "One of: MONTHLY, QUARTERLY, ANNUALLY",
      depositAmount: "Security deposit as number, typically 2-3 months rent",
      floorArea: "Floor area in sqm as number",
      floorAreaUnit: "SQM",
      renewalOption: "true or false",
      renewalTermMonths: "Number of months for renewal option (e.g. 12)",
      breakOption: "true or false",
      notes: "Realistic lease notes about the property",
    },
  },
  msc_contract: {
    description: "A Master Services Contract governing a fleet of vehicles or residential homes in the UAE",
    schema: {
      mscRef: "Reference like MSC-2024-001",
      contractType: "One of: FLEET, RESIDENTIAL",
      titleEn: "Contract title in English",
      titleAr: "Contract title in Arabic",
      partyAEn: "First party company name in English (the lessee/client)",
      partyAAr: "First party company name in Arabic",
      partyBEn: "Second party company name in English (the lessor/provider)",
      partyBAr: "Second party company name in Arabic",
      effectiveDate: "ISO date YYYY-MM-DD",
      expiryDate: "ISO date YYYY-MM-DD, 2-3 years from effective",
      contractValue: "Total contract value in AED as number",
      currency: "AED",
      paymentTermsEn: "Payment terms in English",
      paymentTermsAr: "Payment terms in Arabic",
      scopeEn: "Scope of services in English (2-3 sentences)",
      scopeAr: "Scope of services in Arabic (2-3 sentences)",
      governingLawEn: "Governing law in English",
      governingLawAr: "Governing law in Arabic",
      jurisdictionEn: "Jurisdiction in English",
      jurisdictionAr: "Jurisdiction in Arabic",
      terminationEn: "Termination clause in English",
      terminationAr: "Termination clause in Arabic",
      warrantiesEn: "Warranties clause in English",
      warrantiesAr: "Warranties clause in Arabic",
      signedByEn: "Signatory name in English",
      signedByAr: "Signatory name in Arabic",
      witnessEn: "Witness name in English",
      witnessAr: "Witness name in Arabic",
    },
  },
  furnished_asset: {
    description: "A furnished asset (furniture or appliance) included with a leased property in the UAE",
    schema: {
      assetName: "Specific item name e.g. 'Executive Desk', 'Samsung Refrigerator'",
      assetCategory: "One of: Furniture, Appliance, Electronics, Fixture, Other",
      serialNumber: "Serial number like SN-2024-XXXXX",
      conditionAtHandover: "One of: Excellent, Good, Fair, Poor",
      notes: "Brief condition notes",
    },
  },
  asset_deposit: {
    description: "An asset deposit payment for furnished items in a leased property in the UAE",
    schema: {
      assetDescription: "Description of the asset e.g. 'Office Furniture Set - Floor 12'",
      depositAmount: "Deposit amount in AED as number e.g. 15000",
      currency: "AED",
      depositType: "One of: Cash, Cheque, Bank Guarantee, Letter of Credit",
    },
  },
  maintenance_ticket: {
    description: "A maintenance/repair ticket for a leased property in the UAE",
    schema: {
      title: "Short descriptive title of the issue",
      description: "Detailed description of the maintenance issue",
      priority: "One of: LOW, MEDIUM, HIGH, CRITICAL",
      category: "One of: PLUMBING, ELECTRICAL, HVAC, STRUCTURAL, CLEANING, SECURITY, OTHER",
      reportedBy: "Full name of person reporting",
      location: "Specific location within the property",
      estimatedCost: "Estimated repair cost in AED as number",
    },
  },
  insurance_policy: {
    description: "A property or fleet insurance policy in the UAE",
    schema: {
      policyNumber: "Policy number like POL-2024-XXXXX",
      insurer: "UAE insurance company name",
      policyType: "One of: PROPERTY, LIABILITY, FLEET, CONTENTS, COMPREHENSIVE",
      coverageAmount: "Coverage amount in AED as number",
      premium: "Annual premium in AED as number",
      startDate: "ISO date YYYY-MM-DD",
      endDate: "ISO date YYYY-MM-DD, 1 year from start",
      contactPerson: "Insurance agent full name",
      contactEmail: "Agent email address",
      contactPhone: "+971 XX XXX XXXX format",
      notes: "Key policy notes or exclusions",
    },
  },
  vendor: {
    description: "A vendor or contractor providing services to leased properties in the UAE",
    schema: {
      vendorName: "Company name",
      vendorCode: "Vendor code like VND-001",
      category: "One of: MAINTENANCE, CLEANING, SECURITY, LANDSCAPING, IT, CATERING, CONSTRUCTION, OTHER",
      contactPerson: "Primary contact full name",
      email: "Professional email",
      phone: "+971 XX XXX XXXX format",
      address: "UAE business address",
      taxRegistration: "UAE TRN number like 100XXXXXXXXX5",
      paymentTerms: "e.g. Net 30, Net 60",
      rating: "Number 1-5",
      notes: "Brief vendor notes",
    },
  },
  broker: {
    description: "A real estate broker or agent in the UAE",
    schema: {
      brokerName: "Full name",
      brokerCode: "Code like BRK-001",
      agency: "Real estate agency name",
      licenseNumber: "RERA license number like RERA-XXXXX",
      email: "Professional email",
      phone: "+971 XX XXX XXXX format",
      specialization: "One of: COMMERCIAL, RESIDENTIAL, INDUSTRIAL, MIXED",
      commissionRate: "Commission percentage as number (e.g. 2.5)",
      notes: "Brief broker notes",
    },
  },
  loi: {
    description: "A Letter of Intent for a commercial lease in the UAE",
    schema: {
      loiRef: "Reference like LOI-2024-001",
      propertyAddress: "Full UAE property address",
      proposedRent: "Proposed monthly rent in AED as number",
      proposedTerm: "Proposed lease term in months as number",
      proposedStartDate: "ISO date YYYY-MM-DD",
      depositOffered: "Deposit amount in AED as number",
      specialConditions: "Any special conditions or requests",
      validUntil: "ISO date YYYY-MM-DD, typically 30 days from today",
      notes: "Additional LOI notes",
    },
  },
  ti_allowance: {
    description: "A Tenant Improvement (TI) allowance for a leased commercial space in the UAE",
    schema: {
      projectName: "TI project name",
      approvedAmount: "Approved TI allowance in AED as number",
      spentToDate: "Amount spent to date in AED as number",
      contractor: "Contractor company name",
      startDate: "ISO date YYYY-MM-DD",
      completionDate: "ISO date YYYY-MM-DD, 3-6 months from start",
      scopeDescription: "Description of improvement works",
      notes: "Additional notes",
    },
  },
  security_deposit: {
    description: "A security deposit for a commercial lease in the UAE",
    schema: {
      depositAmount: "Deposit amount in AED as number",
      depositDate: "ISO date YYYY-MM-DD",
      depositType: "One of: CASH, BANK_GUARANTEE, CHEQUE",
      bankName: "UAE bank name",
      bankRef: "Bank reference number",
      maturityDate: "ISO date YYYY-MM-DD for bank guarantee maturity",
      notes: "Brief deposit notes",
    },
  },
  sub_lease: {
    description: "A sub-lease arrangement for part of a leased property in the UAE",
    schema: {
      subTenantName: "Sub-tenant company or person name",
      subTenantContact: "Contact person name",
      subTenantEmail: "Email address",
      subTenantPhone: "+971 XX XXX XXXX format",
      subleaseArea: "Sub-leased area in sqm as number",
      monthlyRent: "Monthly sub-lease rent in AED as number",
      startDate: "ISO date YYYY-MM-DD",
      endDate: "ISO date YYYY-MM-DD",
      notes: "Sub-lease terms and conditions",
    },
  },
  rent_review: {
    description: "A rent review for a commercial lease in the UAE",
    schema: {
      reviewDate: "ISO date YYYY-MM-DD",
      currentRent: "Current monthly rent in AED as number",
      proposedRent: "Proposed new monthly rent in AED as number",
      reviewBasis: "One of: CPI, FIXED_PERCENTAGE, MARKET_RATE, NEGOTIATED",
      increasePercentage: "Percentage increase as number",
      effectiveDate: "ISO date YYYY-MM-DD when new rent takes effect",
      notes: "Review notes and justification",
    },
  },
  lease_modification: {
    description: "A lease modification (remeasurement event) for an IFRS 16 lease in the UAE",
    schema: {
      modificationDate: "ISO date YYYY-MM-DD",
      modificationType: "One of: EXTENSION, REDUCTION, SCOPE_CHANGE, RENT_CHANGE",
      description: "Description of the modification",
      newMonthlyRent: "New monthly rent in AED as number",
      newExpiryDate: "ISO date YYYY-MM-DD",
      newIBR: "New incremental borrowing rate as percentage (e.g. 4.5)",
      notes: "Modification notes",
    },
  },
  lease_termination: {
    description: "A lease termination event for a commercial lease in the UAE",
    schema: {
      terminationDate: "ISO date YYYY-MM-DD",
      terminationType: "One of: BREAK_OPTION, MUTUAL_AGREEMENT, EXPIRY, DEFAULT",
      penaltyAmount: "Termination penalty in AED as number",
      noticePeriodDays: "Notice period in days as number",
      reason: "Reason for termination",
      notes: "Additional termination notes",
    },
  },
  budget_entry: {
    description: "A budget entry for lease-related costs in the UAE",
    schema: {
      budgetYear: "Budget year as number (e.g. 2025)",
      costCategory: "One of: RENT, MAINTENANCE, INSURANCE, UTILITIES, RATES, OTHER",
      budgetedAmount: "Budgeted amount in AED as number",
      actualAmount: "Actual amount spent in AED as number",
      variance: "Variance amount in AED as number",
      notes: "Budget notes",
    },
  },
  hedge: {
    description: "A hedge accounting entry for an FX-denominated lease in the UAE",
    schema: {
      hedgeType: "One of: FAIR_VALUE, CASH_FLOW, NET_INVESTMENT",
      instrumentType: "One of: FORWARD_CONTRACT, OPTION, SWAP",
      notionalAmount: "Notional amount in original currency as number",
      originalCurrency: "Currency code e.g. USD, EUR, GBP",
      hedgeRate: "Hedged exchange rate as number",
      startDate: "ISO date YYYY-MM-DD",
      maturityDate: "ISO date YYYY-MM-DD",
      counterparty: "UAE bank or financial institution name",
      notes: "Hedge notes",
    },
  },
  desk_booking: {
    description: "A desk or meeting room booking in a leased office space in the UAE",
    schema: {
      deskId: "Desk or room identifier like DESK-A12 or ROOM-B3",
      bookedBy: "Full name of person booking",
      bookingDate: "ISO date YYYY-MM-DD",
      startTime: "Start time in HH:MM format",
      endTime: "End time in HH:MM format",
      purpose: "Purpose of booking",
      notes: "Additional booking notes",
    },
  },
  work_order: {
    description: "A facilities management work order for a leased property in the UAE",
    schema: {
      title: "Short work order title",
      description: "Detailed description of work required",
      priority: "One of: LOW, MEDIUM, HIGH, URGENT",
      category: "One of: PLUMBING, ELECTRICAL, HVAC, PAINTING, CARPENTRY, CLEANING, LANDSCAPING, OTHER",
      assignedTo: "Contractor or technician name",
      estimatedCost: "Estimated cost in AED as number",
      scheduledDate: "ISO date YYYY-MM-DD",
      completionDate: "ISO date YYYY-MM-DD",
      notes: "Work order notes",
    },
  },
  lessor: {
    description: "A property lessor (landlord) in the UAE",
    schema: {
      lessorName: "Company or individual name e.g. Emirates Property Management LLC",
      lessorType: "One of: Individual, Company, Government, REIT, Trust",
      registrationNo: "UAE company registration number like CN-1234567",
      taxId: "UAE TRN number like 100XXXXXXXXX5",
      country: "2-letter ISO code: AE",
      city: "UAE city e.g. Dubai",
      addressLine1: "Street address e.g. Office 1204, Al Moosa Tower 1",
      addressLine2: "Area/district e.g. Sheikh Zayed Road",
      postalCode: "UAE postal code e.g. 12345",
      website: "Company website URL",
      creditRating: "One of: AAA, AA, A, BBB, BB, B, CCC",
      paymentTerms: "Payment terms in days as number e.g. 30",
      preferredCurrency: "AED",
      status: "One of: Active, Inactive, Blacklisted",
    },
  },
  asset_registry: {
    description: "A physical asset in a leased property portfolio in the UAE",
    schema: {
      assetCode: "Asset code like ASSET-001",
      assetName: "Descriptive asset name",
      assetType: "One of: BUILDING, VEHICLE, EQUIPMENT, LAND, FIXTURE",
      description: "Detailed asset description",
      location: "UAE location",
      purchaseDate: "ISO date YYYY-MM-DD",
      purchaseValue: "Purchase value in AED as number",
      currentValue: "Current value in AED as number",
      depreciationRate: "Annual depreciation rate as percentage",
      condition: "One of: EXCELLENT, GOOD, FAIR, POOR",
      notes: "Asset notes",
    },
  },
  lease_comparison: {
    description: "A lease comparison/benchmarking entry for commercial properties in the UAE",
    schema: {
      propertyName: "Property name",
      propertyAddress: "Full UAE address",
      assetClass: "One of: OFFICE, RETAIL, WAREHOUSE, RESIDENTIAL",
      floorArea: "Floor area in sqm as number",
      monthlyRent: "Monthly rent in AED as number",
      rentPerSqm: "Rent per sqm in AED as number",
      leaseTermMonths: "Lease term in months as number",
      fitoutContribution: "Fit-out contribution in AED as number",
      parkingSpaces: "Number of parking spaces as number",
      notes: "Comparison notes",
    },
  },
  // alias — AssetRegistry page uses formType="asset"
  asset: {
    description: "A physical asset in a leased property portfolio in the UAE",
    schema: {
      assetName: "Descriptive asset name e.g. Dubai Tower Site 01",
      assetType: "One of: Office, Retail, Warehouse, Industrial, Residential",
      status: "One of: Available, Leased, Under Maintenance",
      country: "2-letter ISO country code e.g. AE",
      city: "UAE city name e.g. Dubai",
      address: "Full UAE street address",
      floorArea: "Floor area in sqm as number",
      notes: "Brief asset notes",
    },
  },
  budget_variance: {
    description: "A budget vs actual variance entry for lease costs in the UAE",
    schema: {
      period: "Quarter/year like 2024-Q1",
      budgetAmount: "Budgeted amount in AED as number",
      actualAmount: "Actual amount in AED as number",
      varianceAmount: "Variance in AED as number",
      variancePct: "Variance percentage as number",
      category: "One of: Rent, Service Charge, Insurance, Maintenance, Other",
      notes: "Variance explanation",
    },
  },
  cpi_escalation: {
    description: "A CPI escalation record for lease rent adjustments in the UAE",
    schema: {
      escalationDate: "ISO date YYYY-MM-DD",
      cpiIndex: "CPI index value as number e.g. 108.5",
      escalationRate: "Escalation rate as percentage e.g. 3.5",
      previousRent: "Previous monthly rent in AED as number",
      newRent: "New monthly rent in AED as number",
      notes: "Escalation notes",
    },
  },
  lease_origination: {
    description: "A new lease origination request for commercial property in the UAE",
    schema: {
      propertyName: "Property name e.g. Business Bay Tower A",
      propertyAddress: "Full UAE address",
      assetType: "One of: Office, Retail, Warehouse, Industrial, Residential",
      floorArea: "Floor area in sqm as number",
      monthlyRent: "Monthly rent in AED as number",
      leaseTerm: "Lease term in months as number",
      commencementDate: "ISO date YYYY-MM-DD",
      lessorName: "Lessor company name",
      notes: "Origination notes",
    },
  },
  lease_option: {
    description: "A lease renewal option or break clause for a commercial lease in the UAE",
    schema: {
      optionType: "One of: RENEWAL, PURCHASE, TERMINATION, EXPANSION",
      exerciseDeadline: "ISO date YYYY-MM-DD",
      noticePeriodDays: "Notice period in days as number e.g. 90",
      newTermMonths: "New term in months as number",
      newRent: "New monthly rent in AED as number",
      notes: "Option notes",
    },
  },
  lessor_bank: {
    description: "A lessor bank account record for payment processing in the UAE",
    schema: {
      bankName: "UAE bank name e.g. Emirates NBD",
      accountNumber: "Bank account number",
      iban: "UAE IBAN like AE070331234567890123456",
      swiftCode: "SWIFT/BIC code",
      currency: "Currency code e.g. AED",
      accountType: "One of: Current, Savings",
    },
  },
  lessor_contact: {
    description: "A lessor contact person record in the UAE",
    schema: {
      contactName: "Full name",
      role: "One of: Primary, Finance, Legal, Operations",
      email: "Professional email address",
      phone: "UAE phone number +971 XX XXX XXXX",
      department: "Department name",
    },
  },
  lessor_note: {
    description: "A note or memo regarding a lessor in the UAE",
    schema: {
      noteDate: "ISO date YYYY-MM-DD",
      noteType: "One of: General, Legal, Financial, Operational",
      subject: "Brief subject line",
      content: "Detailed note content 2-3 sentences",
      author: "Author name",
    },
  },
  payment_runs: {
    description: "A payment run batch for lease invoices in the UAE",
    schema: {
      runDate: "ISO date YYYY-MM-DD",
      paymentMethod: "One of: Bank Transfer, Cheque, Direct Debit",
      totalAmount: "Total payment amount in AED as number",
      invoiceCount: "Number of invoices as number",
      bankAccount: "Paying bank account name",
      notes: "Payment run notes",
    },
  },
  space_management: {
    description: "A building or space management record for commercial property in the UAE",
    schema: {
      buildingName: "Building name e.g. Dubai World Trade Centre",
      totalArea: "Total area in sqm as number",
      occupiedArea: "Occupied area in sqm as number",
      availableArea: "Available area in sqm as number",
      occupancyRate: "Occupancy rate as percentage",
      location: "UAE city and district",
      notes: "Space notes",
    },
  },
  esg_carbon: {
    description: "An ESG carbon and energy reporting record for a leased property in the UAE",
    schema: {
      reportingPeriod: "Year-month like 2024-01",
      carbonKg: "Carbon emissions in kg CO2 as number e.g. 12500",
      energyKwh: "Energy consumption in kWh as number e.g. 45000",
      waterM3: "Water consumption in cubic meters as number e.g. 320",
      wasteKg: "Waste generated in kg as number e.g. 850",
      renewablePercent: "Percentage of renewable energy used e.g. 25",
    },
  },
  lessor_credit_score: {
    description: "A credit score assessment for a property lessor in the UAE",
    schema: {
      score: "Credit score from 0 to 1000 as number e.g. 720",
      rating: "One of: AAA, AA, A, BBB, BB, B, CCC",
      assessmentDate: "ISO date YYYY-MM-DD",
      notes: "Brief assessment notes",
    },
  },
  lessor_finance_lease: {
    description: "A finance lease or credit facility record for a property lessor in the UAE",
    schema: {
      financeType: "One of: Operating Lease, Finance Lease, Mortgage, Term Loan, Revolving Credit",
      facilityAmount: "Facility amount in AED as number e.g. 5000000",
      currency: "AED",
      interestRate: "Annual interest rate as percentage e.g. 4.5",
      maturityDate: "ISO date YYYY-MM-DD",
      lender: "Bank or lender name e.g. Emirates NBD",
    },
  },
  lease_data_quality: {
    description: "A data quality rule for lease data validation in the UAE",
    schema: {
      ruleName: "Short rule name e.g. 'Missing Commencement Date'",
      ruleType: "One of: Completeness, Accuracy, Consistency, Timeliness, Validity",
      severity: "One of: Critical, Warning, Info",
      description: "Detailed description of the data quality rule",
    },
  },
  tenant_request: {
    description: "A tenant service request or maintenance request for a leased property in the UAE",
    schema: {
      requestType: "One of: Maintenance, Complaint, Query, Document Request, Inspection",
      subject: "Short subject line e.g. 'AC Unit Not Working - Floor 5'",
      description: "Detailed description of the request",
      priority: "One of: Low, Medium, High, Urgent",
    },
  },
  ibr_form: {
    description: "An incremental borrowing rate entry for IFRS 16 in the UAE",
    schema: {
      currency: "One of: AED, USD, EUR, GBP, SAR",
      tenor: "Lease term in months as number e.g. 36",
      rate: "Annual IBR rate as percentage e.g. 5.25",
      effectiveDate: "ISO date YYYY-MM-DD",
      source: "Source e.g. CBUAE, Emirates NBD, ENBD",
    },
  },
};

// ─── Screen data generation prompts ─────────────────────────────────────────
const SCREEN_PROMPTS: Record<string, { description: string; count: number; rowSchema: Record<string, string> }> = {
  lease_register: {
    description: "Active IFRS 16 leases in a UAE enterprise portfolio",
    count: 8,
    rowSchema: {
      id: "Sequential number",
      lease_ref: "Like LEASE-2024-001",
      lease_name: "Descriptive name e.g. 'Dubai Marina Office'",
      lessor_name: "UAE property company",
      asset_class: "One of: OFFICE, RETAIL, WAREHOUSE, RESIDENTIAL, VEHICLE",
      commencement_date: "ISO date YYYY-MM-DD",
      expiry_date: "ISO date YYYY-MM-DD 2-5 years later",
      monthly_rent: "Number 20000-500000",
      currency: "AED",
      status: "One of: ACTIVE, PENDING_APPROVAL, EXPIRED, TERMINATED",
      rou_asset: "Number close to monthly_rent * lease months",
      lease_liability: "Number slightly less than rou_asset",
    },
  },
  payables: {
    description: "Lease payment invoices and payables in a UAE enterprise",
    count: 8,
    rowSchema: {
      id: "Sequential number",
      invoice_ref: "Like INV-2024-001",
      lease_ref: "Like LEASE-2024-001",
      lessor_name: "UAE property company",
      invoice_date: "ISO date YYYY-MM-DD recent",
      due_date: "ISO date YYYY-MM-DD 30 days after invoice",
      amount: "Number 20000-500000",
      currency: "AED",
      status: "One of: PENDING, APPROVED, PAID, OVERDUE",
      description: "Invoice description",
    },
  },
  bank_reconciliation: {
    description: "Bank statement transactions for lease payment reconciliation",
    count: 8,
    rowSchema: {
      id: "Sequential number",
      transaction_date: "ISO date YYYY-MM-DD recent",
      description: "Bank transaction description",
      debit: "Number or empty string",
      credit: "Number or empty string",
      balance: "Running balance number",
      reference: "Bank reference number",
      status: "One of: MATCHED, UNMATCHED, PARTIAL",
      matched_invoice: "Invoice ref or empty string",
    },
  },
  cheque_inventory: {
    description: "Cheque book inventory for lease payments in UAE",
    count: 8,
    rowSchema: {
      id: "Sequential number",
      cheque_number: "6-digit number",
      bank_name: "UAE bank name",
      account_number: "UAE bank account number",
      payee: "Payee name",
      amount: "Number 20000-500000",
      issue_date: "ISO date YYYY-MM-DD",
      due_date: "ISO date YYYY-MM-DD",
      status: "One of: BLANK, ISSUED, PRESENTED, CLEARED, BOUNCED, CANCELLED",
      lease_ref: "Like LEASE-2024-001",
    },
  },
  maintenance: {
    description: "Asset maintenance tickets for leased properties in UAE",
    count: 7,
    rowSchema: {
      id: "Sequential number",
      ticket_ref: "Like TKT-2024-001",
      lease_ref: "Like LEASE-2024-001",
      property: "Property name",
      issue_type: "One of: HVAC, PLUMBING, ELECTRICAL, STRUCTURAL, CLEANING, SECURITY",
      description: "Issue description",
      priority: "One of: LOW, MEDIUM, HIGH, CRITICAL",
      status: "One of: OPEN, IN_PROGRESS, RESOLVED, CLOSED",
      reported_date: "ISO date YYYY-MM-DD",
      assigned_to: "Technician name",
      estimated_cost: "Number 500-50000",
    },
  },
  insurance: {
    description: "Insurance policies for leased properties in UAE",
    count: 6,
    rowSchema: {
      id: "Sequential number",
      policy_ref: "Like POL-2024-001",
      lease_ref: "Like LEASE-2024-001",
      property: "Property name",
      insurer: "UAE insurance company",
      policy_type: "One of: PROPERTY, LIABILITY, CONTENTS, COMPREHENSIVE",
      coverage_amount: "Number 500000-10000000",
      premium_annual: "Number 5000-100000",
      start_date: "ISO date YYYY-MM-DD",
      expiry_date: "ISO date YYYY-MM-DD 1 year later",
      status: "One of: ACTIVE, EXPIRING_SOON, EXPIRED",
    },
  },
  security_deposits: {
    description: "Security deposits held for leased properties in UAE",
    count: 7,
    rowSchema: {
      id: "Sequential number",
      deposit_ref: "Like DEP-2024-001",
      lease_ref: "Like LEASE-2024-001",
      lessor_name: "UAE property company",
      deposit_amount: "Number 50000-500000",
      currency: "AED",
      deposit_date: "ISO date YYYY-MM-DD",
      expected_release: "ISO date YYYY-MM-DD at lease end",
      bank_name: "UAE bank",
      bank_ref: "Bank reference",
      status: "One of: HELD, PARTIALLY_RELEASED, RELEASED, FORFEITED",
    },
  },
  sub_leases: {
    description: "Sub-lease agreements where the company is sub-lessor in UAE",
    count: 5,
    rowSchema: {
      id: "Sequential number",
      sublease_ref: "Like SL-2024-001",
      parent_lease_ref: "Like LEASE-2024-001",
      sub_lessee: "Company name",
      property: "Property name",
      area_sqm: "Number 100-2000",
      monthly_income: "Number 10000-200000",
      start_date: "ISO date YYYY-MM-DD",
      end_date: "ISO date YYYY-MM-DD",
      status: "One of: ACTIVE, EXPIRED, PENDING",
    },
  },
  rent_reviews: {
    description: "Scheduled rent reviews for leased properties in UAE",
    count: 6,
    rowSchema: {
      id: "Sequential number",
      lease_ref: "Like LEASE-2024-001",
      property: "Property name",
      lessor: "UAE property company",
      review_date: "ISO date YYYY-MM-DD upcoming",
      current_rent: "Number 20000-500000",
      proposed_rent: "Number slightly higher than current",
      review_type: "One of: CPI, Fixed, Market, Negotiated",
      status: "One of: Pending, Agreed, Upcoming, Disputed",
      basis: "Review basis e.g. CPI + 3%",
    },
  },
  lease_modifications: {
    description: "IFRS 16 lease modifications and remeasurements in UAE",
    count: 5,
    rowSchema: {
      id: "Sequential number",
      modification_ref: "Like MOD-2024-001",
      lease_ref: "Like LEASE-2024-001",
      modification_type: "One of: EXTENSION, REDUCTION, SCOPE_CHANGE, RENT_CHANGE",
      effective_date: "ISO date YYYY-MM-DD",
      old_liability: "Number",
      new_liability: "Number",
      gain_loss: "Number positive or negative",
      status: "One of: PENDING, APPROVED, POSTED",
      notes: "Modification notes",
    },
  },
  lease_terminations: {
    description: "Lease terminations and early exits in UAE portfolio",
    count: 4,
    rowSchema: {
      id: "Sequential number",
      termination_ref: "Like TERM-2024-001",
      lease_ref: "Like LEASE-2024-001",
      property: "Property name",
      termination_date: "ISO date YYYY-MM-DD",
      reason: "One of: BUSINESS_CLOSURE, RELOCATION, COST_REDUCTION, MUTUAL_AGREEMENT",
      penalty_amount: "Number 0-500000",
      rou_derecognition: "Number",
      liability_derecognition: "Number",
      status: "One of: PENDING, APPROVED, COMPLETED",
    },
  },
  lease_renewals: {
    description: "Lease renewal negotiations in UAE portfolio",
    count: 5,
    rowSchema: {
      id: "Sequential number",
      renewal_ref: "Like REN-2024-001",
      lease_ref: "Like LEASE-2024-001",
      property: "Property name",
      current_expiry: "ISO date YYYY-MM-DD upcoming",
      proposed_new_expiry: "ISO date YYYY-MM-DD 2-3 years later",
      current_rent: "Number",
      proposed_rent: "Number slightly higher",
      status: "One of: UNDER_NEGOTIATION, AGREED, DECLINED, PENDING_APPROVAL",
      notes: "Renewal notes",
    },
  },
  msc_register: {
    description: "Master Services Contracts governing vehicle fleets and residential homes in UAE",
    count: 5,
    rowSchema: {
      id: "Sequential number",
      msc_ref: "Like MSC-2024-001",
      title_en: "Contract title in English",
      contract_type: "One of: FLEET, RESIDENTIAL",
      party_a_en: "Client company name",
      party_b_en: "Service provider company name",
      effective_date: "ISO date YYYY-MM-DD",
      expiry_date: "ISO date YYYY-MM-DD 2-3 years later",
      contract_value: "Number 500000-10000000",
      linked_assets: "Number 5-50",
      status: "One of: ACTIVE, EXPIRED, DRAFT, UNDER_REVIEW",
    },
  },
  furnished_assets: {
    description: "Furniture and appliance inventory for furnished residential leases in UAE",
    count: 8,
    rowSchema: {
      id: "Sequential number",
      asset_code: "Like FA-001",
      name: "Item name e.g. 'Leather Sofa 3-Seater'",
      category: "One of: FURNITURE, APPLIANCE, ELECTRONICS, FIXTURE, KITCHEN",
      room: "One of: Living Room, Bedroom, Kitchen, Bathroom, Office",
      brand: "Brand name",
      model: "Model number or name",
      condition: "One of: EXCELLENT, GOOD, FAIR, POOR",
      purchase_value: "Number 500-50000",
      current_value: "Number less than purchase",
      quantity: "Number 1-4",
    },
  },
  asset_deposits: {
    description: "Asset/furniture deposits for furnished properties in UAE",
    count: 6,
    rowSchema: {
      id: "Sequential number",
      deposit_ref: "Like AD-2024-001",
      property: "Property name",
      tenant: "Tenant company or person name",
      deposit_amount: "Number 10000-100000",
      currency: "AED",
      deposit_date: "ISO date YYYY-MM-DD",
      assets_covered: "Number 5-20",
      status: "One of: HELD, PARTIALLY_RELEASED, RELEASED",
      bank_ref: "Bank reference",
    },
  },
  vendors: {
    description: "Vendor and contractor records for property maintenance in UAE",
    count: 7,
    rowSchema: {
      id: "Sequential number",
      vendor_code: "Like VND-001",
      company_name: "UAE company name",
      category: "One of: HVAC, PLUMBING, ELECTRICAL, CLEANING, SECURITY, IT, GENERAL",
      contact_person: "Contact name",
      phone: "+971 XX XXX XXXX",
      email: "Professional email",
      trade_license: "UAE trade license number",
      rating: "Number 1-5",
      status: "One of: APPROVED, PENDING, BLACKLISTED",
      last_engagement: "ISO date YYYY-MM-DD",
    },
  },
  brokers: {
    description: "Real estate brokers and agents for lease origination in UAE",
    count: 6,
    rowSchema: {
      id: "Sequential number",
      broker_code: "Like BRK-001",
      name: "Full name",
      agency: "Real estate agency name",
      rera_number: "RERA registration number",
      phone: "+971 XX XXX XXXX",
      email: "Professional email",
      specialization: "One of: COMMERCIAL, RESIDENTIAL, INDUSTRIAL, MIXED",
      deals_ytd: "Number 1-20",
      commission_ytd: "Number 50000-500000",
      status: "One of: ACTIVE, INACTIVE",
    },
  },
  loi_tracking: {
    description: "Letters of Intent for pre-contract lease negotiations in UAE",
    count: 5,
    rowSchema: {
      id: "Sequential number",
      loi_ref: "Like LOI-2024-001",
      property: "Property name",
      lessor: "Lessor company",
      proposed_area: "Number sqm",
      proposed_rent: "Number monthly AED",
      loi_date: "ISO date YYYY-MM-DD",
      expiry_date: "ISO date YYYY-MM-DD 30 days later",
      status: "One of: DRAFT, SUBMITTED, ACCEPTED, REJECTED, CONVERTED",
      notes: "LOI notes",
    },
  },
  gl_journals: {
    description: "General ledger journal entries for IFRS 16 lease accounting",
    count: 8,
    rowSchema: {
      id: "Sequential number",
      journal_ref: "Like JNL-2024-001",
      posting_date: "ISO date YYYY-MM-DD",
      description: "Journal description",
      debit_account: "GL account code like 1200",
      credit_account: "GL account code like 2100",
      amount: "Number 10000-500000",
      currency: "AED",
      lease_ref: "Like LEASE-2024-001",
      status: "One of: DRAFT, POSTED, REVERSED",
    },
  },
  amortisation: {
    description: "IFRS 16 amortisation schedule entries for a lease",
    count: 12,
    rowSchema: {
      period: "Month number 1-12",
      payment_date: "ISO date YYYY-MM-DD monthly",
      opening_liability: "Number decreasing each period",
      interest_charge: "Number (opening * IBR/12)",
      principal_payment: "Number (payment - interest)",
      lease_payment: "Number (consistent monthly payment)",
      closing_liability: "Number (opening - principal)",
      rou_depreciation: "Number (ROU / lease months)",
      rou_closing: "Number decreasing each period",
    },
  },
  ibr_library: {
    description: "Incremental borrowing rates by currency and term for IFRS 16 in UAE",
    count: 6,
    rowSchema: {
      id: "Sequential number",
      currency: "One of: AED, USD, EUR, GBP, SAR",
      lease_term_min: "Number months",
      lease_term_max: "Number months",
      rate_pct: "Number 4.5-8.5",
      effective_from: "ISO date YYYY-MM-DD",
      source: "Central bank or financial source",
      is_active: "true",
    },
  },
  workflow_tasks: {
    description: "Pending workflow approval tasks in a lease management system",
    count: 7,
    rowSchema: {
      id: "Sequential number",
      task_ref: "Like TASK-2024-001",
      workflow_type: "One of: LEASE_APPROVAL, INVOICE_APPROVAL, PAYMENT_RUN, MODIFICATION",
      subject: "Task subject description",
      requested_by: "Requester name",
      assigned_to: "Approver name",
      created_date: "ISO date YYYY-MM-DD",
      due_date: "ISO date YYYY-MM-DD",
      priority: "One of: LOW, MEDIUM, HIGH, URGENT",
      status: "One of: PENDING, IN_REVIEW, ESCALATED",
    },
  },
  audit_log: {
    description: "System audit log entries for a lease management platform",
    count: 10,
    rowSchema: {
      id: "Sequential number",
      timestamp: "ISO datetime recent",
      user: "Username",
      action: "One of: CREATE, UPDATE, DELETE, APPROVE, REJECT, LOGIN, EXPORT",
      module: "One of: Lease, Payables, Workflow, Security, Reports",
      record_ref: "Reference like LEASE-2024-001",
      description: "Action description",
      ip_address: "IP address like 192.168.1.x",
      result: "One of: SUCCESS, FAILED",
    },
  },
  error_log: {
    description: "System error log entries for a lease management platform",
    count: 8,
    rowSchema: {
      id: "Sequential number",
      timestamp: "ISO datetime recent",
      severity: "One of: INFO, WARNING, ERROR, CRITICAL",
      module: "Module name",
      error_code: "Error code like ERR-001",
      message: "Error message description",
      user: "Username or SYSTEM",
      resolved: "true or false",
    },
  },
  work_orders: {
    description: "Facilities work orders for leased properties in UAE",
    count: 7,
    rowSchema: {
      id: "Sequential number",
      wo_ref: "Like WO-2024-001",
      property: "Property name",
      category: "One of: HVAC, PLUMBING, ELECTRICAL, CLEANING, STRUCTURAL",
      description: "Work description",
      vendor: "Vendor company name",
      raised_date: "ISO date YYYY-MM-DD",
      scheduled_date: "ISO date YYYY-MM-DD",
      cost_estimate: "Number 1000-100000",
      status: "One of: OPEN, ASSIGNED, IN_PROGRESS, COMPLETED, CANCELLED",
    },
  },
  desk_booking: {
    description: "Desk and meeting room bookings in leased office spaces in UAE",
    count: 8,
    rowSchema: {
      id: "Sequential number",
      booking_ref: "Like BKG-001",
      space_name: "Desk or room name",
      space_type: "One of: HOT_DESK, MEETING_ROOM, PRIVATE_OFFICE, PHONE_BOOTH",
      booked_by: "Employee name",
      booking_date: "ISO date YYYY-MM-DD",
      start_time: "Time like 09:00",
      end_time: "Time like 17:00",
      floor: "Floor number or name",
      status: "One of: CONFIRMED, CHECKED_IN, COMPLETED, CANCELLED",
    },
  },
  esg_reporting: {
    description: "ESG and carbon footprint data for leased properties in UAE",
    count: 6,
    rowSchema: {
      id: "Sequential number",
      property: "Property name",
      period: "Quarter like Q1 2024",
      electricity_kwh: "Number 10000-500000",
      water_m3: "Number 100-5000",
      carbon_tonnes: "Number 5-500",
      waste_tonnes: "Number 1-50",
      green_rating: "One of: LEED Gold, LEED Silver, BREEAM, None",
      renewable_pct: "Number 0-100",
      notes: "ESG notes",
    },
  },
  hedge_accounting: {
    description: "FX hedge instruments for foreign currency leases in UAE",
    count: 5,
    rowSchema: {
      id: "Sequential number",
      instrument_ref: "Like HED-2024-001",
      lease_ref: "Like LEASE-2024-001",
      instrument_type: "One of: FORWARD, OPTION, SWAP, COLLAR",
      currency_pair: "Like USD/AED",
      notional_amount: "Number 500000-10000000",
      strike_rate: "Number 3.5-4.0",
      start_date: "ISO date YYYY-MM-DD",
      maturity_date: "ISO date YYYY-MM-DD 1 year later",
      fair_value: "Number positive or negative",
      status: "One of: ACTIVE, MATURED, CANCELLED",
    },
  },
  consolidation: {
    description: "Multi-entity lease consolidation data for a UAE group",
    count: 6,
    rowSchema: {
      id: "Sequential number",
      entity: "Subsidiary company name",
      country: "UAE or GCC country",
      lease_count: "Number 5-50",
      total_rou: "Number millions",
      total_liability: "Number millions",
      intercompany_elimination: "Number",
      currency: "AED",
      period: "Like Q1 2024",
      status: "One of: DRAFT, REVIEWED, APPROVED",
    },
  },
  budgeting: {
    description: "Lease cost budget vs actual for a UAE enterprise",
    count: 8,
    rowSchema: {
      id: "Sequential number",
      cost_center: "Department or cost center",
      lease_ref: "Like LEASE-2024-001",
      property: "Property name",
      budget_annual: "Number",
      actual_ytd: "Number less than budget",
      forecast_annual: "Number close to budget",
      variance: "Number positive or negative",
      variance_pct: "Number percentage",
      period: "Like FY2024",
    },
  },
  furniture_collections: {
    description: "Furniture collection packs assigned to residential properties in UAE",
    count: 6,
    rowSchema: {
      id: "Sequential number",
      collection_name: "Like 'Villa A-101 Furniture Pack'",
      property_id: "Like PROP-001",
      property_name: "Villa or flat name",
      item_count: "Number 10-40",
      total_value: "Number 50000-500000",
      condition: "One of: EXCELLENT, GOOD, FAIR",
      last_inspection: "ISO date YYYY-MM-DD",
      status: "One of: ACTIVE, NEEDS_REVIEW, ARCHIVED",
    },
  },
  lessor_master: {
    description: "Lessor/landlord master records for UAE lease portfolio",
    count: 7,
    rowSchema: {
      id: "Sequential number",
      lessor_code: "Like LSR-001",
      company_name: "UAE property company",
      contact_person: "Contact name",
      phone: "+971 XX XXX XXXX",
      email: "Professional email",
      city: "UAE city",
      active_leases: "Number 1-20",
      total_portfolio_value: "Number millions AED",
      payment_terms: "Like Net 30",
      status: "One of: ACTIVE, INACTIVE",
    },
  },
  asset_registry: {
    description: "Physical asset registry for leased properties in UAE",
    count: 7,
    rowSchema: {
      id: "Sequential number",
      asset_code: "Like ASSET-001",
      asset_name: "Asset name",
      asset_type: "One of: BUILDING, VEHICLE, EQUIPMENT, LAND, FIXTURE",
      location: "UAE location",
      purchase_value: "Number",
      current_value: "Number less than purchase",
      depreciation_rate: "Number 5-25",
      condition: "One of: EXCELLENT, GOOD, FAIR, POOR",
      lease_ref: "Like LEASE-2024-001",
      status: "One of: ACTIVE, DISPOSED, UNDER_MAINTENANCE",
    },
  },
  ti_allowance: {
    description: "Tenant improvement allowance records for commercial leases in UAE",
    count: 5,
    rowSchema: {
      id: "Sequential number",
      ti_ref: "Like TI-2024-001",
      lease_ref: "Like LEASE-2024-001",
      property: "Property name",
      lessor: "Lessor name",
      allowance_agreed: "Number 100000-2000000",
      claimed_to_date: "Number less than agreed",
      remaining: "Number",
      claim_deadline: "ISO date YYYY-MM-DD",
      status: "One of: ACTIVE, FULLY_CLAIMED, EXPIRED",
    },
  },
  esignature: {
    description: "E-signature requests for lease documents in UAE",
    count: 6,
    rowSchema: {
      id: "Sequential number",
      request_ref: "Like ESIG-2024-001",
      document_name: "Document name",
      lease_ref: "Like LEASE-2024-001",
      sent_to: "Signatory name",
      sent_date: "ISO date YYYY-MM-DD",
      signed_date: "ISO date YYYY-MM-DD or empty",
      provider: "One of: DocuSign, Adobe Sign, HelloSign",
      status: "One of: SENT, VIEWED, SIGNED, DECLINED, EXPIRED",
    },
  },
  lease_comparison: {
    description: "Market lease comparison and benchmarking data for UAE properties",
    count: 6,
    rowSchema: {
      id: "Sequential number",
      property_name: "Property name",
      location: "UAE location",
      asset_class: "One of: OFFICE, RETAIL, WAREHOUSE, RESIDENTIAL",
      floor_area: "Number sqm",
      monthly_rent: "Number AED",
      rent_per_sqm: "Number AED/sqm",
      lease_term_months: "Number",
      fit_out_contribution: "Number AED",
      vs_portfolio_avg: "Percentage like +12% or -5%",
    },
  },
  sso_config: {
    description: "SSO/SAML identity provider configurations for enterprise login",
    count: 3,
    rowSchema: {
      id: "Sequential number",
      provider_name: "Like Microsoft Azure AD",
      entity_id: "SAML entity ID URL",
      sso_url: "SSO login URL",
      certificate_expiry: "ISO date YYYY-MM-DD",
      user_count: "Number 50-500",
      last_login: "ISO datetime",
      status: "One of: ACTIVE, INACTIVE, TESTING",
    },
  },
  api_webhooks: {
    description: "API webhook configurations for lease system integrations",
    count: 5,
    rowSchema: {
      id: "Sequential number",
      webhook_name: "Webhook name",
      endpoint_url: "HTTPS URL",
      event_type: "One of: lease.created, payment.due, approval.required, document.signed",
      last_triggered: "ISO datetime",
      success_rate: "Number 90-100",
      status: "One of: ACTIVE, PAUSED, ERROR",
    },
  },
};

export const aiFillRouter = router({
  generateScreenData: protectedProcedure
    .input(
      z.object({
        screenType: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const screenConfig = SCREEN_PROMPTS[input.screenType];
      if (!screenConfig) {
        // Return generic data for unknown screen types
        return { rows: [], screenType: input.screenType, generated: true };
      }

      const schemaDescription = Object.entries(screenConfig.rowSchema)
        .map(([key, desc]) => `  "${key}": ${desc}`)
        .join(",\n");

      const systemPrompt = `You are a data generation assistant for VodaLease Enterprise, an IFRS 16 lease management platform used by companies in the UAE. Generate realistic, professional, and internally consistent sample data. All monetary values in AED unless specified. Dates should be realistic. Names should be realistic UAE/Middle East names or international companies operating in UAE. Return ONLY valid JSON, no markdown, no explanation.`;

      const userPrompt = `Generate ${screenConfig.count} realistic sample records for: ${screenConfig.description}.

Return ONLY a valid JSON object with a "rows" array containing exactly ${screenConfig.count} objects, each with these fields:
{
  "rows": [
    {
${schemaDescription}
    }
  ]
}`;

      const response = await invokeLLM({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "screen_data",
            strict: false,
            schema: {
              type: "object",
              properties: {
                rows: {
                  type: "array",
                  items: {
                    type: "object",
                    additionalProperties: true,
                  },
                },
              },
              required: ["rows"],
              additionalProperties: false,
            },
          },
        },
      });

      const rawContent = response.choices?.[0]?.message?.content;
      if (!rawContent) throw new Error("No response from AI");
      const content = typeof rawContent === "string" ? rawContent : JSON.stringify(rawContent);

      try {
        const parsed = JSON.parse(content);
        return { rows: parsed.rows || [], screenType: input.screenType, generated: true };
      } catch {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return { rows: parsed.rows || [], screenType: input.screenType, generated: true };
        }
        throw new Error("Failed to parse AI response as JSON");
      }
    }),

  fillForm: protectedProcedure
    .input(
      z.object({
        formType: z.string(),
        existingData: z.record(z.string(), z.unknown()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const formConfig = FORM_PROMPTS[input.formType];
      if (!formConfig) {
        throw new Error(`Unknown form type: ${input.formType}`);
      }

      const schemaDescription = Object.entries(formConfig.schema)
        .map(([key, desc]) => `  "${key}": ${desc}`)
        .join(",\n");

      const existingContext = input.existingData && Object.keys(input.existingData).length > 0
        ? `\n\nExisting partial data to build upon:\n${JSON.stringify(input.existingData, null, 2)}`
        : "";

      const systemPrompt = `You are a data generation assistant for VodaLease Enterprise, an IFRS 16 lease management platform used by companies in the UAE. Generate realistic, professional, and internally consistent sample data for lease management forms. All monetary values should be in AED unless specified. Dates should be realistic and internally consistent. Names should be realistic UAE/Middle East names or international company names operating in UAE.`;

      const userPrompt = `Generate realistic sample data for: ${formConfig.description}.${existingContext}

Return ONLY a valid JSON object with exactly these fields (no extra fields, no markdown, no explanation):
{
${schemaDescription}
}`;

      const response = await invokeLLM({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "form_fill_data",
            strict: false,
            schema: {
              type: "object",
              properties: Object.fromEntries(
                Object.keys(formConfig.schema).map((key) => [key, { type: "string" }])
              ),
              additionalProperties: true,
            },
          },
        },
      });

      const rawContent = response.choices?.[0]?.message?.content;
      if (!rawContent) throw new Error("No response from AI");
      const content = typeof rawContent === "string" ? rawContent : JSON.stringify(rawContent);

      try {
        return JSON.parse(content) as Record<string, string>;
      } catch {
        // Try to extract JSON from the response if it contains extra text
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]) as Record<string, string>;
        }
        throw new Error("Failed to parse AI response as JSON");
      }
    }),
});
