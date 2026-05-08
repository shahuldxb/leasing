/**
 * VodaLease Enterprise — AI Report Engine Router
 * Generates enterprise-level narrative reports using Azure OpenAI
 * Stores results in accounting.report_outputs for instant retrieval
 */
import { z } from 'zod';
import { protectedProcedure, router } from '../_core/trpc';
import { invokeLLM } from '../_core/llm';
import { execSPP, sql, getPool } from '../db-sqlserver';
import { TRPCError } from '@trpc/server';

// ── Report Type Definitions ──────────────────────────────────────────
const REPORT_TYPES = [
  'portfolio_summary',
  'rou_roll_forward',
  'liability_roll_forward',
  'maturity_analysis',
  'interest_depreciation',
  'lease_expiry',
  'cash_forecast',
] as const;

type ReportType = typeof REPORT_TYPES[number];

// ── Enterprise Prompts ───────────────────────────────────────────────
const SYSTEM_PROMPT = `You are a senior IFRS 16 lease accounting analyst at a Big 4 advisory firm. You produce enterprise-level narrative reports for CFOs, audit committees, and board members. Your reports are:
- Precise with numbers (always include currency and exact figures from the data)
- Structured with clear headings, tables, and bullet points in Markdown
- Analytical (identify trends, risks, anomalies, and actionable recommendations)
- Compliant with IFRS 16 terminology and paragraph references
- Professional tone suitable for board-level presentation

Always structure your report with:
1. Executive Summary (2-3 sentences)
2. Key Metrics table
3. Detailed Analysis sections
4. Risk Indicators / Observations
5. Recommendations / Action Items

Use Markdown formatting with tables, bold for key figures, and clear section headers.`;

const REPORT_PROMPTS: Record<ReportType, string> = {
  portfolio_summary: `Generate a **Portfolio Summary Report** for the lease portfolio. Analyse the data and produce:

1. **Executive Summary**: Total portfolio size, composition, and health status
2. **Key Metrics Table**: Total leases, Total ROU Asset, Total Lease Liability, Current vs Non-Current split, Monthly Payment obligation, Weighted Average Remaining Term, Weighted Average IBR
3. **Asset Type Analysis**: Breakdown by asset type (Office, Vehicle, Equipment, Land, Retail, Warehouse) with concentration percentages
4. **Currency Exposure**: Multi-currency breakdown with FX risk commentary
5. **Portfolio Health Indicators**: 
   - Lease concentration risk (any single lease > 20% of portfolio?)
   - Average remaining term vs original term (portfolio ageing)
   - Modification frequency (stability indicator)
6. **Recommendations**: Top 3 actions for portfolio optimisation

Reference IFRS 16 Para 53 disclosure requirements throughout.`,

  rou_roll_forward: `Generate a **Right-of-Use Asset Roll-Forward Report** (IFRS 16 Para 53(a)-(h)). Analyse the data and produce:

1. **Executive Summary**: Net movement in ROU assets for the period
2. **Roll-Forward Table**: Opening Balance → Additions → Depreciation Charge → Modifications (increases/decreases) → Impairment → Disposals → Closing Balance
3. **Movement Analysis**: 
   - Depreciation as % of opening (is it accelerating?)
   - Additions trend (new lease activity)
   - Modification impact (net increase or decrease in ROU)
4. **Asset Class Breakdown**: Roll-forward by asset type
5. **Impairment Assessment**: Any indicators of impairment? (ROU > recoverable amount)
6. **Useful Life Analysis**: Remaining useful life vs lease term alignment
7. **Audit-Ready Disclosure**: Pre-formatted IFRS 16 Para 53(a) note text

All figures must match the data provided. Flag any anomalies.`,

  liability_roll_forward: `Generate a **Lease Liability Roll-Forward Report** (IFRS 16 Para 53(g)-(h)). Analyse the data and produce:

1. **Executive Summary**: Net change in lease liabilities and key drivers
2. **Roll-Forward Table**: Opening Balance → New Leases → Interest Accretion → Lease Payments (principal) → Modifications → Terminations → Closing Balance
3. **Cash Flow Impact Analysis**:
   - Total cash outflow (principal + interest)
   - Interest as % of total payment (effective cost of leasing)
   - Principal repayment rate (deleveraging speed)
4. **Refinancing Risk Assessment**:
   - Liabilities maturing within 12 months vs available liquidity
   - Concentration of maturities in any single quarter
5. **Interest Rate Sensitivity**: Impact of IBR changes on liability
6. **Current vs Non-Current Split**: With 12-month forward projection
7. **Audit-Ready Disclosure**: Pre-formatted IFRS 16 Para 53(g) note text

Highlight any material movements that require management attention.`,

  maturity_analysis: `Generate a **Lease Liability Maturity Analysis Report** (IFRS 16 Para 58 / IAS 1.61). Analyse the data and produce:

1. **Executive Summary**: Total undiscounted future lease payments and maturity profile
2. **Maturity Ladder Table**:
   | Band | Undiscounted Payments | % of Total | Cumulative % |
   - Less than 1 year
   - 1 to 2 years
   - 2 to 5 years
   - More than 5 years
   - Total undiscounted
   - Less: discount effect
   - Present value (= lease liability)
3. **Liquidity Risk Assessment**:
   - Front-loaded vs back-loaded profile
   - Peak payment quarters
   - Renewal cliff risk (multiple leases expiring simultaneously)
4. **Discount Reconciliation**: Undiscounted total vs PV (discount effect as %)
5. **Stress Testing**: What if IBR increases by 100bps? Impact on PV
6. **Renewal Strategy**: Which expiring leases should be renewed vs terminated?
7. **Audit-Ready Disclosure**: Pre-formatted IFRS 16 Para 58 maturity table

This is a critical liquidity disclosure — ensure accuracy.`,

  interest_depreciation: `Generate an **Interest & Depreciation Expense Report** (P&L Impact Analysis). Analyse the data and produce:

1. **Executive Summary**: Total lease-related P&L impact for the period
2. **Expense Summary Table**:
   | Category | Current Period | Prior Period | Variance | Variance % |
   - Finance cost (interest on lease liabilities)
   - Depreciation of ROU assets
   - Total IFRS 16 P&L charge
   - Memo: Cash rent paid (for comparison)
3. **Monthly/Quarterly Trend Analysis**: 
   - Is interest declining period-over-period? (expected as liability reduces)
   - Is depreciation stable? (should be straight-line unless modifications)
   - Any spikes requiring explanation?
4. **Budget vs Actual**: If budget data available, show variance
5. **IFRS 16 vs IAS 17 Comparison**: 
   - Under old standard: straight-line rent expense
   - Under IFRS 16: front-loaded (interest + depreciation)
   - Net P&L impact of transition
6. **Forecast**: Projected expense for next 4 quarters based on current portfolio
7. **Key Ratios**: Interest coverage, lease expense as % of revenue (if available)

Emphasise the front-loading effect of IFRS 16 for management understanding.`,

  lease_expiry: `Generate a **Lease Expiry & Renewal Action Report**. Analyse the data and produce:

1. **Executive Summary**: Number of leases expiring and total liability at risk
2. **Expiry Dashboard Table**:
   | Urgency | Lease | Asset | Expiry Date | Days Remaining | Monthly Rent | Action Required |
   - Critical (< 90 days)
   - Warning (90-180 days)
   - Planning (180-365 days)
   - Monitoring (> 365 days)
3. **Financial Impact of Expiry**:
   - Total monthly payment ceasing if not renewed
   - Liability reduction on expiry
   - ROU asset fully depreciated? (should be zero at expiry)
4. **Renewal Recommendations** (for each expiring lease):
   - Renew: if location/asset is strategic
   - Renegotiate: if market rents have changed
   - Terminate: if no longer needed
   - Relocate: if better alternatives exist
5. **Negotiation Points**: Market rent benchmarks, leverage factors
6. **Timeline**: Critical dates and decision deadlines (notice periods)
7. **Budget Impact**: Renewal at current vs market rates

This is an operational action report — be specific with recommendations.`,

  cash_forecast: `Generate a **Cash Payment Forecast Report** (Treasury Planning). Analyse the data and produce:

1. **Executive Summary**: Total cash outflow over forecast period and peak months
2. **Monthly Cash Forecast Table**:
   | Month | Lease Payments | Interest Portion | Principal Portion | Cumulative |
   (for each month in the forecast period)
3. **Payment Concentration Analysis**:
   - Which months have highest outflows? Why?
   - Any payment clustering (multiple leases paying same day?)
   - Quarterly aggregation for treasury planning
4. **Currency Breakdown**: Payments by currency with FX risk
5. **Cash Flow vs Budget**: Variance analysis if budget available
6. **Liquidity Planning**:
   - Minimum cash reserve required to cover 3-month rolling payments
   - Payment holiday opportunities (if any leases allow deferral)
7. **Optimisation Opportunities**:
   - Payment date alignment (consolidate to reduce admin)
   - Early termination savings (NPV of remaining vs termination cost)
   - Refinancing at lower IBR (if rates have dropped)

This report supports treasury cash management — be precise with dates and amounts.`,
};

// ── Helper: Fetch report data from SPs ───────────────────────────────
async function fetchReportData(reportType: ReportType, params: { startDate?: string; endDate?: string; currency?: string }): Promise<string> {
  let data: unknown[];
  
  switch (reportType) {
    case 'portfolio_summary':
      data = await execSPP('sp_ReportPortfolioSummary', []);
      break;
    case 'rou_roll_forward':
      data = await execSPP('sp_ReportROURollForward', [
        { name: 'StartDate', type: sql.Date, value: params.startDate || null },
        { name: 'EndDate', type: sql.Date, value: params.endDate || null },
        { name: 'Currency', type: sql.VarChar(3), value: params.currency || null },
      ]);
      break;
    case 'liability_roll_forward':
      data = await execSPP('sp_ReportLiabilityRollForward', [
        { name: 'StartDate', type: sql.Date, value: params.startDate || null },
        { name: 'EndDate', type: sql.Date, value: params.endDate || null },
        { name: 'Currency', type: sql.VarChar(3), value: params.currency || null },
      ]);
      break;
    case 'maturity_analysis':
      data = await execSPP('sp_ReportMaturityAnalysis', [
        { name: 'AsOfDate', type: sql.Date, value: params.endDate || null },
        { name: 'Currency', type: sql.VarChar(3), value: params.currency || null },
      ]);
      break;
    case 'interest_depreciation':
      data = await execSPP('sp_ReportInterestExpense', [
        { name: 'StartDate', type: sql.Date, value: params.startDate || null },
        { name: 'EndDate', type: sql.Date, value: params.endDate || null },
        { name: 'Currency', type: sql.VarChar(3), value: params.currency || null },
        { name: 'Granularity', type: sql.VarChar(10), value: 'Monthly' },
      ]);
      break;
    case 'lease_expiry':
      data = await execSPP('sp_ReportLeaseExpiry', [
        { name: 'DaysAhead', type: sql.Int, value: 365 },
        { name: 'Currency', type: sql.VarChar(3), value: params.currency || null },
      ]);
      break;
    case 'cash_forecast':
      data = await execSPP('sp_ReportCashForecast', [
        { name: 'Months', type: sql.Int, value: 12 },
        { name: 'Currency', type: sql.VarChar(3), value: params.currency || null },
      ]);
      break;
  }
  
  return JSON.stringify(data, null, 2);
}

// ── Router ───────────────────────────────────────────────────────────
export const reportEngineRouter = router({

  // Generate a new AI report
  generateReport: protectedProcedure
    .input(z.object({
      reportType: z.enum(REPORT_TYPES),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      currency: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { reportType, startDate, endDate, currency } = input;
      
      // 1. Fetch live data from SP
      const rawData = await fetchReportData(reportType, { startDate, endDate, currency });
      
      // 2. Build the prompt
      const userPrompt = `${REPORT_PROMPTS[reportType]}

---

**RAW DATA FROM DATABASE** (use these exact figures in your report):

\`\`\`json
${rawData}
\`\`\`

**Report Parameters:**
- Period: ${startDate || 'Inception'} to ${endDate || 'Today'}
- Currency Filter: ${currency || 'All currencies'}
- Generated: ${new Date().toISOString()}
- Entity: VodaLease Enterprise (Qatar)

Generate the full report now in Markdown format.`;

      // 3. Call Azure OpenAI
      const llmResponse = await invokeLLM({
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        maxTokens: 4096,
      });

      const content = typeof llmResponse.choices[0]?.message?.content === 'string'
        ? llmResponse.choices[0].message.content
        : Array.isArray(llmResponse.choices[0]?.message?.content)
          ? llmResponse.choices[0].message.content.map((p: any) => p.type === 'text' ? p.text : '').join('')
          : '';

      if (!content) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'AI failed to generate report content' });
      }

      // 4. Store in database
      const pool = await getPool();
      const req = pool.request();
      req.input('reportType', sql.NVarChar(50), reportType);
      req.input('content', sql.NVarChar(sql.MAX), content);
      req.input('params', sql.NVarChar(sql.MAX), JSON.stringify({ startDate, endDate, currency }));
      req.input('generatedBy', sql.NVarChar(100), ctx.user?.name || ctx.user?.openId || 'system');
      req.input('fromDate', sql.Date, startDate || null);
      req.input('toDate', sql.Date, endDate || null);
      req.input('currency', sql.NVarChar(10), currency || 'ALL');

      await req.query(`
        INSERT INTO accounting.report_outputs 
          (report_type, content_markdown, parameters_json, generated_by, from_date, to_date, currency, status)
        VALUES 
          (@reportType, @content, @params, @generatedBy, @fromDate, @toDate, @currency, 'ready')
      `);

      return { success: true, content, generatedAt: new Date().toISOString() };
    }),

  // Get the latest generated report for a type
  getLatestReport: protectedProcedure
    .input(z.object({
      reportType: z.enum(REPORT_TYPES),
    }))
    .query(async ({ input }) => {
      const pool = await getPool();
      const req = pool.request();
      req.input('reportType', sql.NVarChar(50), input.reportType);
      
      const result = await req.query(`
        SELECT TOP 1 id, report_type, generated_at, content_markdown, parameters_json, generated_by, from_date, to_date, currency, status
        FROM accounting.report_outputs
        WHERE report_type = @reportType AND status = 'ready'
        ORDER BY generated_at DESC
      `);
      
      return result.recordset[0] || null;
    }),

  // List all generated reports (history)
  listReports: protectedProcedure
    .input(z.object({
      reportType: z.enum(REPORT_TYPES).optional(),
      limit: z.number().optional(),
    }))
    .query(async ({ input }) => {
      const pool = await getPool();
      const req = pool.request();
      
      let query = `
        SELECT id, report_type, generated_at, generated_by, from_date, to_date, currency, status,
               LEN(content_markdown) as content_length
        FROM accounting.report_outputs
      `;
      
      if (input.reportType) {
        req.input('reportType', sql.NVarChar(50), input.reportType);
        query += ` WHERE report_type = @reportType`;
      }
      
      query += ` ORDER BY generated_at DESC`;
      
      if (input.limit) {
        query = query.replace('SELECT ', `SELECT TOP ${input.limit} `);
      }
      
      const result = await req.query(query);
      return result.recordset;
    }),

  // Get a specific report by ID
  getReportById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const pool = await getPool();
      const req = pool.request();
      req.input('id', sql.Int, input.id);
      
      const result = await req.query(`
        SELECT id, report_type, generated_at, content_markdown, parameters_json, generated_by, from_date, to_date, currency, status
        FROM accounting.report_outputs
        WHERE id = @id
      `);
      
      return result.recordset[0] || null;
    }),
});
