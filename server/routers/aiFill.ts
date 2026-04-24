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
      assetCategory: "One of: FURNITURE, APPLIANCE, ELECTRONICS, FIXTURE, OTHER",
      assetName: "Specific item name e.g. 'Executive Desk', 'Samsung Refrigerator'",
      brand: "Brand name",
      model: "Model name or number",
      serialNumber: "Serial number like SN-2024-XXXXX",
      conditionAtHandover: "One of: EXCELLENT, GOOD, FAIR, POOR",
      estimatedValue: "Estimated value in AED as number",
      notes: "Brief condition notes",
    },
  },
  asset_deposit: {
    description: "An asset deposit payment for furnished items in a leased property in the UAE",
    schema: {
      depositAmount: "Deposit amount in AED as number",
      depositCurrency: "AED",
      depositDate: "ISO date YYYY-MM-DD",
      depositType: "One of: CASH, BANK_TRANSFER, CHEQUE",
      bankRef: "Bank reference number like TXN-2024-XXXXX",
      notes: "Brief notes about the deposit",
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
      lessorName: "Company or individual name",
      lessorCode: "Code like LSR-001",
      lessorType: "One of: INDIVIDUAL, COMPANY, GOVERNMENT, REIT",
      contactPerson: "Primary contact full name",
      email: "Professional email",
      phone: "+971 XX XXX XXXX format",
      address: "UAE business address",
      taxRegistration: "UAE TRN number",
      bankName: "UAE bank name",
      iban: "UAE IBAN like AE070331234567890123456",
      notes: "Brief lessor notes",
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
};

export const aiFillRouter = router({
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
