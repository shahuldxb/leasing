/**
 * VodaLease Enterprise — GL Configuration Router
 * Centralized Chart of Accounts (COA) and GL Mapping management.
 * Enterprise-grade CRUD for GL codes, account hierarchy, and transaction mappings.
 */
import { z } from 'zod';
import { protectedProcedure, router } from '../_core/trpc';
import { TRPCError } from '@trpc/server';
import { getPool } from '../db-sqlserver';
import { execSPP, execSPPOne, sql } from '../db-sqlserver';
import { writeAuditLog, writeErrorLog } from '../audit';
import { RulesEngine } from '../rulesEngine';

// ── Account type enum ──────────────────────────────────────────────────────────
const ACCOUNT_TYPES = ['Asset', 'Liability', 'Equity', 'Revenue', 'Expense'] as const;
const NORMAL_BALANCE = ['Dr', 'Cr'] as const;

// ── Lifecycle groups for GL mappings ───────────────────────────────────────────
const LIFECYCLE_GROUPS = {
  INCEPTION: {
    label: 'Lease Inception (Day 1)',
    types: ['ROU_INITIAL_RECOGNITION', 'SECURITY_DEPOSIT_PAID', 'RENT_PREPAYMENT'],
  },
  MONTHLY: {
    label: 'Monthly Amortisation',
    types: ['DEPRECIATION_PROPERTY', 'DEPRECIATION_VEHICLE', 'DEPRECIATION_EQUIPMENT', 'DEPRECIATION_IT_INFRA', 'DEPRECIATION_TOWER', 'INTEREST_EXPENSE', 'LEASE_PAYMENT'],
  },
  REMEASUREMENT: {
    label: 'Remeasurement & Modification',
    types: ['CPI_ESCALATION', 'MODIFICATION_INCREASE', 'MODIFICATION_DECREASE', 'RENEWAL'],
  },
  TERMINATION: {
    label: 'Termination & Derecognition',
    types: ['TERMINATION_GAIN', 'TERMINATION_LOSS', 'IMPAIRMENT'],
  },
  OTHER: {
    label: 'Other Transactions',
    types: ['SUBLEASE_INCOME', 'FX_REVALUATION', 'RENT_EXPENSE'],
  },
} as const;

export const glConfigurationRouter = router({
  // ═══════════════════════════════════════════════════════════════
  // CHART OF ACCOUNTS (COA)
  // ═══════════════════════════════════════════════════════════════

  /** Get all COA accounts with optional filters */
  getCOA: protectedProcedure
    .input(z.object({
      accountType: z.string().optional(),
      search: z.string().optional(),
      activeOnly: z.boolean().default(true),
      ifrs16Only: z.boolean().default(false),
    }).optional())
    .query(async ({ input }) => {
      const pool = await getPool();
      const req = pool.request();
      const filters = input ?? {};
      // Build dynamic query against accounting.gl_chart_of_accounts
      let query = `
        SELECT
          account_code, account_name, account_type, sub_type,
          normal_balance, currency, parent_code, is_active,
          description, ifrs16_relevant, created_at, updated_at
        FROM accounting.gl_chart_of_accounts
        WHERE 1=1
      `;
      if (filters.accountType) {
        req.input('accountType', sql.NVarChar(50), filters.accountType);
        query += ` AND account_type = @accountType`;
      }
      if (filters.search) {
        req.input('search', sql.NVarChar(200), `%${filters.search}%`);
        query += ` AND (account_code LIKE @search OR account_name LIKE @search)`;
      }
      if (filters.activeOnly) {
        query += ` AND is_active = 1`;
      }
      if (filters.ifrs16Only) {
        query += ` AND ifrs16_relevant = 1`;
      }
      query += ` ORDER BY account_code`;
      try {
        const result = await req.query(query);
        return result.recordset ?? [];
      } catch (err: any) {
        // If table doesn't exist, return empty — we'll create it
        if (err.message?.includes('Invalid object name')) {
          return [];
        }
        throw err;
      }
    }),

  /** Get COA hierarchy (tree structure) */
  getCOAHierarchy: protectedProcedure
    .query(async () => {
      const pool = await getPool();
      try {
        const result = await pool.request().query(`
          SELECT
            c.account_code, c.account_name, c.account_type, c.sub_type,
            c.normal_balance, c.currency, c.parent_code, c.is_active,
            c.description, c.ifrs16_relevant,
            (SELECT COUNT(*) FROM accounting.gl_chart_of_accounts ch WHERE ch.parent_code = c.account_code) AS child_count,
            (SELECT COUNT(*) FROM dbo.business_rules br
             WHERE br.category_code = 'GL_CODE' AND br.is_active = 1
             AND (br.jv_debit_account = c.account_code OR br.jv_credit_account = c.account_code)) AS usage_count
          FROM accounting.gl_chart_of_accounts c
          ORDER BY c.account_code
        `);
        return result.recordset ?? [];
      } catch (err: any) {
        if (err.message?.includes('Invalid object name')) return [];
        throw err;
      }
    }),

  /** Create or update a COA account */
  upsertCOAAccount: protectedProcedure
    .input(z.object({
      accountCode: z.string().min(1).max(20),
      accountName: z.string().min(1).max(200),
      accountType: z.enum(ACCOUNT_TYPES),
      subType: z.string().optional(),
      normalBalance: z.enum(NORMAL_BALANCE),
      currency: z.string().default('QAR'),
      parentCode: z.string().optional(),
      description: z.string().optional(),
      ifrs16Relevant: z.boolean().default(true),
      isActive: z.boolean().default(true),
    }))
    .mutation(async ({ input, ctx }) => {
      const pool = await getPool();
      const req = pool.request();
      req.input('account_code', sql.NVarChar(20), input.accountCode);
      req.input('account_name', sql.NVarChar(200), input.accountName);
      req.input('account_type', sql.NVarChar(50), input.accountType);
      req.input('sub_type', sql.NVarChar(100), input.subType ?? null);
      req.input('normal_balance', sql.NVarChar(5), input.normalBalance);
      req.input('currency', sql.NVarChar(10), input.currency);
      req.input('parent_code', sql.NVarChar(20), input.parentCode ?? null);
      req.input('description', sql.NVarChar(500), input.description ?? null);
      req.input('ifrs16_relevant', sql.Bit, input.ifrs16Relevant ? 1 : 0);
      req.input('is_active', sql.Bit, input.isActive ? 1 : 0);

      try {
        const result = await req.query(`
          MERGE accounting.gl_chart_of_accounts AS target
          USING (SELECT @account_code AS account_code) AS source
          ON target.account_code = source.account_code
          WHEN MATCHED THEN UPDATE SET
            account_name = @account_name, account_type = @account_type, sub_type = @sub_type,
            normal_balance = @normal_balance, currency = @currency, parent_code = @parent_code,
            description = @description, ifrs16_relevant = @ifrs16_relevant, is_active = @is_active,
            updated_at = GETDATE()
          WHEN NOT MATCHED THEN INSERT
            (account_code, account_name, account_type, sub_type, normal_balance, currency, parent_code, description, ifrs16_relevant, is_active, created_at, updated_at)
          VALUES
            (@account_code, @account_name, @account_type, @sub_type, @normal_balance, @currency, @parent_code, @description, @ifrs16_relevant, @is_active, GETDATE(), GETDATE())
          OUTPUT $action AS action;
        `);
        const action = result.recordset?.[0]?.action ?? 'UNKNOWN';
        await writeAuditLog('gl_chart_of_accounts', action === 'INSERT' ? 'INSERT' : 'UPDATE',
          ctx.user?.name || 'system',
          `COA Account ${action}: ${input.accountCode} — ${input.accountName}`,
          { account_code: input.accountCode, account_type: input.accountType }
        );
        return { success: true, action, accountCode: input.accountCode };
      } catch (err: any) {
        await writeErrorLog('glConfiguration.upsertCOAAccount', err.message, 'gl_configuration', input);
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: `Failed to save account: ${err.message}` });
      }
    }),

  /** Toggle COA account active/inactive */
  toggleCOAAccount: protectedProcedure
    .input(z.object({ accountCode: z.string(), isActive: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      const pool = await getPool();
      await pool.request()
        .input('code', sql.NVarChar(20), input.accountCode)
        .input('active', sql.Bit, input.isActive ? 1 : 0)
        .query(`UPDATE accounting.gl_chart_of_accounts SET is_active = @active, updated_at = GETDATE() WHERE account_code = @code`);
      await writeAuditLog('gl_chart_of_accounts', 'UPDATE', ctx.user?.name || 'system',
        `COA Account ${input.isActive ? 'activated' : 'deactivated'}: ${input.accountCode}`, input);
      return { success: true };
    }),

  /** Get usage details for a specific GL account code */
  getCOAUsage: protectedProcedure
    .input(z.object({ accountCode: z.string() }))
    .query(async ({ input }) => {
      const pool = await getPool();
      try {
        const result = await pool.request()
          .input('code', sql.NVarChar(20), input.accountCode)
          .query(`
            SELECT rule_id, screen_id, rule_name, jv_debit_account, jv_credit_account,
              CASE WHEN jv_debit_account = @code THEN 'DEBIT' ELSE 'CREDIT' END AS usage_side,
              is_active, ifrs_reference
            FROM dbo.business_rules
            WHERE category_code = 'GL_CODE' AND is_active = 1
              AND (jv_debit_account = @code OR jv_credit_account = @code)
            ORDER BY screen_id, rule_name
          `);
        return result.recordset ?? [];
      } catch {
        return [];
      }
    }),

  /** Get COA summary statistics */
  getCOASummary: protectedProcedure
    .query(async () => {
      const pool = await getPool();
      try {
        const result = await pool.request().query(`
          SELECT
            COUNT(*) AS total_accounts,
            SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) AS active_accounts,
            SUM(CASE WHEN ifrs16_relevant = 1 THEN 1 ELSE 0 END) AS ifrs16_accounts,
            SUM(CASE WHEN account_type = 'Asset' THEN 1 ELSE 0 END) AS asset_count,
            SUM(CASE WHEN account_type = 'Liability' THEN 1 ELSE 0 END) AS liability_count,
            SUM(CASE WHEN account_type = 'Equity' THEN 1 ELSE 0 END) AS equity_count,
            SUM(CASE WHEN account_type = 'Revenue' THEN 1 ELSE 0 END) AS revenue_count,
            SUM(CASE WHEN account_type = 'Expense' THEN 1 ELSE 0 END) AS expense_count
          FROM accounting.gl_chart_of_accounts
        `);
        return result.recordset?.[0] ?? {};
      } catch {
        return {};
      }
    }),

  // ═══════════════════════════════════════════════════════════════
  // GL MAPPING RULES (Transaction Type → GL Code pairs)
  // ═══════════════════════════════════════════════════════════════

  /** Get all GL mappings (from business_rules where category_code = GL_CODE) */
  getAllMappings: protectedProcedure
    .query(async () => {
      return await RulesEngine.getAllGLCodeRules();
    }),

  /** Get GL mappings grouped by lifecycle stage */
  getMappingsByLifecycle: protectedProcedure
    .query(async () => {
      const allMappings = await RulesEngine.getAllGLCodeRules();
      const grouped: Record<string, { label: string; mappings: any[] }> = {};

      for (const [key, group] of Object.entries(LIFECYCLE_GROUPS)) {
        grouped[key] = {
          label: group.label,
          mappings: allMappings.filter((m: any) =>
            group.types.some(t => m.rule_name?.includes(t) || m.jv_description?.includes(t) ||
              (m.rule_name && m.rule_name.toUpperCase().replace(/\s+/g, '_').includes(t)))
          ),
        };
      }

      // Add unmapped rules to OTHER
      const allMappedIds = new Set(Object.values(grouped).flatMap(g => g.mappings.map((m: any) => m.rule_id)));
      const unmapped = allMappings.filter((m: any) => !allMappedIds.has(m.rule_id));
      if (unmapped.length > 0) {
        grouped.OTHER.mappings.push(...unmapped);
      }

      return grouped;
    }),

  /** Upsert a GL mapping rule */
  upsertMapping: protectedProcedure
    .input(z.object({
      screenId: z.string().default('GLOBAL'),
      transactionType: z.string(),
      debitGLCode: z.string(),
      creditGLCode: z.string(),
      description: z.string().optional(),
      ifrsReference: z.string().optional(),
      priority: z.number().default(50),
    }))
    .mutation(async ({ input, ctx }) => {
      // Validate GL codes exist in COA
      const pool = await getPool();
      const drCheck = await pool.request()
        .input('code', sql.NVarChar(20), input.debitGLCode)
        .query(`SELECT COUNT(*) AS cnt FROM accounting.gl_chart_of_accounts WHERE account_code = @code`);
      const crCheck = await pool.request()
        .input('code', sql.NVarChar(20), input.creditGLCode)
        .query(`SELECT COUNT(*) AS cnt FROM accounting.gl_chart_of_accounts WHERE account_code = @code`);

      const warnings: string[] = [];
      if ((drCheck.recordset?.[0]?.cnt ?? 0) === 0) warnings.push(`Debit GL code ${input.debitGLCode} not found in Chart of Accounts`);
      if ((crCheck.recordset?.[0]?.cnt ?? 0) === 0) warnings.push(`Credit GL code ${input.creditGLCode} not found in Chart of Accounts`);

      const result = await RulesEngine.upsertGLCodeRule({
        screenId: input.screenId,
        transactionType: input.transactionType,
        debitGLCode: input.debitGLCode,
        creditGLCode: input.creditGLCode,
        description: input.description,
        ifrsReference: input.ifrsReference,
        priority: input.priority,
        updatedBy: ctx.user?.name || 'system',
      });

      return { ...result, warnings };
    }),

  /** Delete a GL mapping */
  deleteMapping: protectedProcedure
    .input(z.object({ ruleId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const pool = await getPool();
      await pool.request()
        .input('ruleId', sql.Int, input.ruleId)
        .query(`UPDATE dbo.business_rules SET is_active = 0, updated_at = GETDATE() WHERE rule_id = @ruleId`);
      await writeAuditLog('business_rules', 'DELETE', ctx.user?.name || 'system',
        `GL Mapping rule deactivated: #${input.ruleId}`, input);
      return { success: true };
    }),

  /** Simulate a JV for a transaction type (preview mode) */
  simulateJV: protectedProcedure
    .input(z.object({
      transactionType: z.string(),
      amount: z.number().default(100000),
      screenId: z.string().default('GLOBAL'),
    }))
    .query(async ({ input }) => {
      const drResult = await RulesEngine.lookupGLCode(input.screenId, input.transactionType, 'DEBIT');
      const crResult = await RulesEngine.lookupGLCode(input.screenId, input.transactionType, 'CREDIT');

      // Look up account names from COA
      const pool = await getPool();
      let drName = 'Unknown Account';
      let crName = 'Unknown Account';
      if (drResult.glCode) {
        const r = await pool.request().input('code', sql.NVarChar(20), drResult.glCode)
          .query(`SELECT account_name FROM accounting.gl_chart_of_accounts WHERE account_code = @code`);
        drName = r.recordset?.[0]?.account_name ?? drResult.glCode;
      }
      if (crResult.glCode) {
        const r = await pool.request().input('code', sql.NVarChar(20), crResult.glCode)
          .query(`SELECT account_name FROM accounting.gl_chart_of_accounts WHERE account_code = @code`);
        crName = r.recordset?.[0]?.account_name ?? crResult.glCode;
      }

      return {
        transactionType: input.transactionType,
        amount: input.amount,
        debit: { glCode: drResult.glCode, accountName: drName, amount: input.amount },
        credit: { glCode: crResult.glCode, accountName: crName, amount: input.amount },
        autoCreated: drResult.autoCreated || crResult.autoCreated,
      };
    }),

  /** Seed default GL code rules */
  seedDefaults: protectedProcedure
    .mutation(async ({ ctx }) => {
      const count = await RulesEngine.seedDefaultGLCodeRules(ctx.user?.name || 'system');
      return { success: true, seededCount: count };
    }),

  /** Get lifecycle groups metadata */
  getLifecycleGroups: protectedProcedure
    .query(() => {
      return Object.entries(LIFECYCLE_GROUPS).map(([key, val]) => ({
        key,
        label: val.label,
        transactionTypes: [...val.types],
      }));
    }),

  // ═══════════════════════════════════════════════════════════════
  // ENSURE COA TABLE EXISTS
  // ═══════════════════════════════════════════════════════════════

  /** Initialize the COA table if it doesn't exist */
  ensureCOATable: protectedProcedure
    .mutation(async ({ ctx }) => {
      const pool = await getPool();
      try {
        await pool.request().query(`
          IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'accounting')
            EXEC('CREATE SCHEMA accounting');
        `);
        await pool.request().query(`
          IF OBJECT_ID('accounting.gl_chart_of_accounts', 'U') IS NULL
          BEGIN
            CREATE TABLE accounting.gl_chart_of_accounts (
              account_code    NVARCHAR(20)   NOT NULL PRIMARY KEY,
              account_name    NVARCHAR(200)  NOT NULL,
              account_type    NVARCHAR(50)   NOT NULL,  -- Asset, Liability, Equity, Revenue, Expense
              sub_type        NVARCHAR(100)  NULL,       -- Current Asset, Non-Current, etc.
              normal_balance  NVARCHAR(5)    NOT NULL DEFAULT 'Dr',  -- Dr or Cr
              currency        NVARCHAR(10)   NOT NULL DEFAULT 'QAR',
              parent_code     NVARCHAR(20)   NULL,
              description     NVARCHAR(500)  NULL,
              ifrs16_relevant BIT            NOT NULL DEFAULT 1,
              is_active       BIT            NOT NULL DEFAULT 1,
              created_at      DATETIME       NOT NULL DEFAULT GETDATE(),
              updated_at      DATETIME       NOT NULL DEFAULT GETDATE()
            );
          END
        `);
        // Seed standard IFRS 16 accounts if table is empty
        const countResult = await pool.request().query(`SELECT COUNT(*) AS cnt FROM accounting.gl_chart_of_accounts`);
        if ((countResult.recordset?.[0]?.cnt ?? 0) === 0) {
          await pool.request().query(`
            INSERT INTO accounting.gl_chart_of_accounts (account_code, account_name, account_type, sub_type, normal_balance, currency, parent_code, description, ifrs16_relevant) VALUES
            ('10000', 'Assets', 'Asset', 'Header', 'Dr', 'QAR', NULL, 'Top-level asset header', 0),
            ('10100', 'Right-of-Use Assets', 'Asset', 'Non-Current Asset', 'Dr', 'QAR', '10000', 'IFRS 16 Right-of-Use Assets — net carrying amount', 1),
            ('10200', 'Accumulated Depreciation — ROU Property', 'Asset', 'Contra Asset', 'Cr', 'QAR', '10100', 'Accumulated depreciation on ROU property assets', 1),
            ('10210', 'Accumulated Depreciation — ROU Vehicles', 'Asset', 'Contra Asset', 'Cr', 'QAR', '10100', 'Accumulated depreciation on ROU vehicle assets', 1),
            ('10220', 'Accumulated Depreciation — ROU Equipment', 'Asset', 'Contra Asset', 'Cr', 'QAR', '10100', 'Accumulated depreciation on ROU equipment', 1),
            ('10230', 'Accumulated Depreciation — ROU IT Infra', 'Asset', 'Contra Asset', 'Cr', 'QAR', '10100', 'Accumulated depreciation on ROU IT infrastructure', 1),
            ('10240', 'Accumulated Depreciation — ROU Towers', 'Asset', 'Contra Asset', 'Cr', 'QAR', '10100', 'Accumulated depreciation on ROU tower sites', 1),
            ('11100', 'Security Deposits', 'Asset', 'Current Asset', 'Dr', 'QAR', '10000', 'Refundable security deposits paid to lessors', 1),
            ('11200', 'Prepaid Rent', 'Asset', 'Current Asset', 'Dr', 'QAR', '10000', 'Prepaid rent for short-term/low-value leases', 1),
            ('20000', 'Liabilities', 'Liability', 'Header', 'Cr', 'QAR', NULL, 'Top-level liability header', 0),
            ('20100', 'Lease Liabilities', 'Liability', 'Non-Current Liability', 'Cr', 'QAR', '20000', 'IFRS 16 Lease Liabilities — present value of future payments', 1),
            ('20200', 'Lease Liabilities — Current Portion', 'Liability', 'Current Liability', 'Cr', 'QAR', '20100', 'Current portion of lease liabilities (due within 12 months)', 1),
            ('40000', 'Revenue', 'Revenue', 'Header', 'Cr', 'QAR', NULL, 'Top-level revenue header', 0),
            ('40100', 'Sub-lease Income', 'Revenue', 'Operating Revenue', 'Cr', 'QAR', '40000', 'Rental income from sub-leased assets', 1),
            ('50000', 'Expenses', 'Expense', 'Header', 'Dr', 'QAR', NULL, 'Top-level expense header', 0),
            ('50100', 'Depreciation Expense — ROU Property', 'Expense', 'Operating Expense', 'Dr', 'QAR', '50000', 'Depreciation of ROU property assets', 1),
            ('50110', 'Depreciation Expense — ROU Vehicles', 'Expense', 'Operating Expense', 'Dr', 'QAR', '50000', 'Depreciation of ROU vehicle assets', 1),
            ('50120', 'Depreciation Expense — ROU Equipment', 'Expense', 'Operating Expense', 'Dr', 'QAR', '50000', 'Depreciation of ROU equipment', 1),
            ('50130', 'Depreciation Expense — ROU IT Infra', 'Expense', 'Operating Expense', 'Dr', 'QAR', '50000', 'Depreciation of ROU IT infrastructure', 1),
            ('50140', 'Depreciation Expense — ROU Towers', 'Expense', 'Operating Expense', 'Dr', 'QAR', '50000', 'Depreciation of ROU tower sites', 1),
            ('60000', 'Finance Costs', 'Expense', 'Header', 'Dr', 'QAR', NULL, 'Finance cost header', 0),
            ('60100', 'Interest Expense — Lease Liabilities', 'Expense', 'Finance Cost', 'Dr', 'QAR', '60000', 'Interest expense on IFRS 16 lease liabilities (unwinding of discount)', 1),
            ('60200', 'Impairment Loss — ROU Assets', 'Expense', 'Finance Cost', 'Dr', 'QAR', '60000', 'Impairment losses on ROU assets per IAS 36', 1),
            ('60300', 'FX Revaluation — Lease Liabilities', 'Expense', 'Finance Cost', 'Dr', 'QAR', '60000', 'Foreign exchange gains/losses on lease liabilities', 1),
            ('70000', 'Other Income/Expense', 'Revenue', 'Header', 'Cr', 'QAR', NULL, 'Other income and expense header', 0),
            ('70100', 'Gain on Lease Termination', 'Revenue', 'Other Income', 'Cr', 'QAR', '70000', 'Gain on derecognition of lease liability exceeding ROU asset', 1),
            ('70200', 'Loss on Lease Termination', 'Expense', 'Other Expense', 'Dr', 'QAR', '70000', 'Loss on derecognition when ROU asset exceeds lease liability', 1),
            ('80000', 'Rent Expense (Exempt Leases)', 'Expense', 'Operating Expense', 'Dr', 'QAR', '50000', 'Straight-line rent expense for short-term and low-value leases', 1)
          `);
        }
        await writeAuditLog('gl_chart_of_accounts', 'INIT', ctx.user?.name || 'system', 'COA table ensured with seed data', {});
        return { success: true, message: 'COA table initialized' };
      } catch (err: any) {
        await writeErrorLog('glConfiguration.ensureCOATable', err.message, 'gl_configuration', {});
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: err.message });
      }
    }),
});
