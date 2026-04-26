/**
 * VodaLease Enterprise — Lease Management Router
 * All DB access via stored procedures through execSPP/execSPPOne
 */
import { z } from 'zod';
import { protectedProcedure, router } from '../_core/trpc';
import { execSPP, execSPPOne, execSPPMulti, sql } from '../db-sqlserver';
import { writeAuditLog, writeErrorLog, extractClientInfo } from '../audit';
import { TRPCError } from '@trpc/server';

export const leaseRouter = router({

  // ── LESSORS ─────────────────────────────────────────────
  getLessors: protectedProcedure
    .input(z.object({ search: z.string().optional(), status: z.string().optional() }))
    .query(async ({ input }) => {
      return execSPP('sp_GetLessors', [
        { name: 'SearchTerm', type: sql.NVarChar(200), value: input.search || null },
        { name: 'Status', type: sql.VarChar(20), value: input.status || null },
      ]);
    }),

  createLessor: protectedProcedure
    .input(z.object({
      legalName: z.string().min(2),
      registrationNo: z.string().optional(),
      taxNo: z.string().optional(),
      country: z.string().length(2),
      currency: z.string().length(3),
      bankDetails: z.object({
        bankName: z.string().optional(),
        accountNo: z.string().optional(),
        swiftCode: z.string().optional(),
        iban: z.string().optional(),
      }).optional(),
      contacts: z.array(z.object({
        name: z.string(),
        role: z.string().optional(),
        email: z.string().optional(),
        phone: z.string().optional(),
      })).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const start = new Date();
      try {
        const result = await execSPPOne<{ lessor_id: number; lessor_ref: string }>('sp_CreateLessor', [
          { name: 'LegalName', type: sql.NVarChar(300), value: input.legalName },
          { name: 'RegistrationNo', type: sql.VarChar(100), value: input.registrationNo || null },
          { name: 'TaxNo', type: sql.VarChar(100), value: input.taxNo || null },
          { name: 'Country', type: sql.Char(2), value: input.country },
          { name: 'Currency', type: sql.Char(3), value: input.currency },
          { name: 'BankDetailsEnc', type: sql.NVarChar(sql.MAX), value: input.bankDetails ? JSON.stringify(input.bankDetails) : null },
          { name: 'ContactJson', type: sql.NVarChar(sql.MAX), value: input.contacts ? JSON.stringify(input.contacts) : null },
          { name: 'CreatedBy', type: sql.Int, value: ctx.user!.id },
        ]);
        await writeAuditLog({
          userId: ctx.user!.id, username: ctx.user!.name || '', userRole: ctx.user!.role,
          module: 'Lease', subModule: 'Lessor', actionType: 'CREATE',
          recordTable: 'lease.lessors', recordId: String(result?.lessor_id),
          afterState: result, outcome: 'Success', screenId: 'VFLSELESREG0001P001', processStartTime: start,
        });
        return result;
      } catch (err: any) {
        await writeErrorLog({ severity: 'Error', module: 'Lease', message: err.message, stackTrace: err.stack, screenId: 'VFLSELESREG0001P001' });
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: err.message });
      }
    }),

  // ── LEASE REGISTER ──────────────────────────────────────
  getLeaseRegister: protectedProcedure
    .input(z.object({
      page: z.number().default(1),
      pageSize: z.number().default(100),
      status: z.string().optional(),
      assetType: z.string().optional(),
      search: z.string().optional(),
      sortColumn: z.string().default('created_at'),
      sortDirection: z.enum(['ASC', 'DESC']).default('DESC'),
    }))
    .query(async ({ input }) => {
      const rows = await execSPP('sp_GetLeaseRegister', [
        { name: 'PageNumber', type: sql.Int, value: input.page },
        { name: 'PageSize', type: sql.Int, value: input.pageSize },
        { name: 'StatusFilter', type: sql.VarChar(30), value: input.status || null },
        { name: 'AssetType', type: sql.VarChar(50), value: input.assetType || null },
        { name: 'SearchTerm', type: sql.NVarChar(200), value: input.search || null },
        { name: 'SortColumn', type: sql.VarChar(50), value: input.sortColumn },
        { name: 'SortDirection', type: sql.VarChar(4), value: input.sortDirection },
      ]);
      const totalCount = rows.length > 0 ? (rows[0] as any).total_count : 0;
      return { rows, totalCount, page: input.page, pageSize: input.pageSize };
    }),

  getLeaseById: protectedProcedure
    .input(z.object({ contractId: z.number() }))
    .query(async ({ input }) => {
      const result = await execSPPOne('sp_GetLeaseById', [
        { name: 'ContractId', type: sql.Int, value: input.contractId },
      ]);
      if (!result) throw new TRPCError({ code: 'NOT_FOUND', message: 'Lease not found' });
      return result;
    }),

  getAmortisationSchedule: protectedProcedure
    .input(z.object({ contractId: z.number() }))
    .query(async ({ input }) => {
      // SP returns 2 result sets: [0] contract header, [1] schedule rows
      const sets = await execSPPMulti('sp_GetAmortisationSchedule', [
        { name: 'ContractId', type: sql.Int, value: input.contractId },
      ]);
      const header   = sets[0]?.[0] ?? null;
      const schedule = sets[1] ?? [];
      return { header, schedule };
    }),

  getLeaseListForAmortisation: protectedProcedure
    .query(async () => {
      return execSPP('sp_GetLeaseListForAmortisation', []);
    }),

  getAmortisationScheduleAll: protectedProcedure
    .input(z.object({
      year:     z.number().default(0),
      viewMode: z.enum(['monthly', 'yearly']).default('monthly'),
    }))
    .query(async ({ input }) => {
      return execSPP('sp_GetAmortisationScheduleAll', [
        { name: 'Year',     type: sql.Int,          value: input.year },
        { name: 'ViewMode', type: sql.NVarChar(10),  value: input.viewMode },
      ]);
    }),

  getConsolidatedGLEntries: protectedProcedure
    .input(z.object({
      year:     z.number().default(0),
      viewMode: z.enum(['monthly', 'yearly']).default('monthly'),
    }))
    .query(async ({ input }) => {
      return execSPP('sp_GetConsolidatedGLEntries', [
        { name: 'Year',     type: sql.Int,          value: input.year },
        { name: 'ViewMode', type: sql.NVarChar(10),  value: input.viewMode },
      ]);
    }),

  // ── CREATE LEASE ────────────────────────────────────────
  createLease: protectedProcedure
    .input(z.object({
      lessorId: z.number(),
      assetType: z.string(),
      assetDescription: z.string(),
      assetTag: z.string().optional(),
      location: z.object({
        address: z.string().optional(),
        city: z.string().optional(),
        country: z.string().optional(),
        coordinates: z.object({ lat: z.number(), lng: z.number() }).optional(),
      }).optional(),
      commencementDate: z.string(),
      expiryDate: z.string(),
      termMonths: z.number(),
      monthlyPayment: z.number(),
      currency: z.string().length(3),
      escalationRate: z.number().default(0),
      escalationDate: z.string().optional(),
      ibr: z.number(),
      depositAmount: z.number().default(0),
      ifrs16Classification: z.enum(['Finance', 'Operating', 'ShortTerm', 'LowValue']).default('Finance'),
      renewalOption: z.boolean().default(false),
      renewalCertain: z.boolean().default(false),
      purchaseOption: z.boolean().default(false),
      purchaseCertain: z.boolean().default(false),
      makeGoodObligation: z.boolean().default(false),
      makeGoodEstimate: z.number().default(0),
      initialDirectCosts: z.number().default(0),
      leaseIncentives: z.number().default(0),
      isLTO: z.boolean().default(false),
      ltoPurchasePrice: z.number().optional(),
      ltoDeposit: z.number().optional(),
      ltoNetFinanced: z.number().optional(),
      ltoTotalInstalments: z.number().optional(),
      ltoInstalmentAmount: z.number().optional(),
      ltoFrequency: z.string().optional(),
      ltoFinanceChargeRate: z.number().optional(),
      ltoBalloonAmount: z.number().optional(),
      ltoTransferDate: z.string().optional(),
      maintenanceResponsibility: z.enum(['Vodafone', 'Lessor', 'Shared']).default('Lessor'),
    }))
    .mutation(async ({ input, ctx }) => {
      const start = new Date();
      try {
        const result = await execSPPOne<{ contract_id: number; contract_ref: string }>('sp_CreateLease', [
          { name: 'LessorId', type: sql.Int, value: input.lessorId },
          { name: 'AssetType', type: sql.VarChar(50), value: input.assetType },
          { name: 'AssetDescription', type: sql.NVarChar(500), value: input.assetDescription },
          { name: 'AssetTag', type: sql.VarChar(100), value: input.assetTag || null },
          { name: 'LocationJson', type: sql.NVarChar(sql.MAX), value: input.location ? JSON.stringify(input.location) : null },
          { name: 'CommencementDate', type: sql.Date, value: input.commencementDate },
          { name: 'ExpiryDate', type: sql.Date, value: input.expiryDate },
          { name: 'TermMonths', type: sql.Int, value: input.termMonths },
          { name: 'MonthlyPayment', type: sql.Decimal(18, 2), value: input.monthlyPayment },
          { name: 'Currency', type: sql.Char(3), value: input.currency },
          { name: 'EscalationRate', type: sql.Decimal(8, 4), value: input.escalationRate },
          { name: 'EscalationDate', type: sql.Date, value: input.escalationDate || null },
          { name: 'IBR', type: sql.Decimal(8, 6), value: input.ibr },
          { name: 'DepositAmount', type: sql.Decimal(18, 2), value: input.depositAmount },
          { name: 'IFRS16Classification', type: sql.VarChar(20), value: input.ifrs16Classification },
          { name: 'RenewalOption', type: sql.Bit, value: input.renewalOption },
          { name: 'RenewalCertain', type: sql.Bit, value: input.renewalCertain },
          { name: 'PurchaseOption', type: sql.Bit, value: input.purchaseOption },
          { name: 'PurchaseCertain', type: sql.Bit, value: input.purchaseCertain },
          { name: 'MakeGoodObligation', type: sql.Bit, value: input.makeGoodObligation },
          { name: 'MakeGoodEstimate', type: sql.Decimal(18, 2), value: input.makeGoodEstimate },
          { name: 'InitialDirectCosts', type: sql.Decimal(18, 2), value: input.initialDirectCosts },
          { name: 'LeaseIncentives', type: sql.Decimal(18, 2), value: input.leaseIncentives },
          { name: 'IsLTO', type: sql.Bit, value: input.isLTO },
          { name: 'LTOPurchasePrice', type: sql.Decimal(18, 2), value: input.ltoPurchasePrice || null },
          { name: 'LTODeposit', type: sql.Decimal(18, 2), value: input.ltoDeposit || null },
          { name: 'LTONetFinanced', type: sql.Decimal(18, 2), value: input.ltoNetFinanced || null },
          { name: 'LTOTotalInstalments', type: sql.Int, value: input.ltoTotalInstalments || null },
          { name: 'LTOInstalmentAmount', type: sql.Decimal(18, 2), value: input.ltoInstalmentAmount || null },
          { name: 'LTOFrequency', type: sql.VarChar(20), value: input.ltoFrequency || null },
          { name: 'LTOFinanceChargeRate', type: sql.Decimal(8, 6), value: input.ltoFinanceChargeRate || null },
          { name: 'LTOBalloonAmount', type: sql.Decimal(18, 2), value: input.ltoBalloonAmount || null },
          { name: 'LTOTransferDate', type: sql.Date, value: input.ltoTransferDate || null },
          { name: 'MaintenanceResp', type: sql.VarChar(20), value: input.maintenanceResponsibility },
          { name: 'MakerId', type: sql.Int, value: ctx.user!.id },
          { name: 'ScreenId', type: sql.VarChar(20), value: 'VFLSENEWLSE0001P001' },
          { name: 'ProcessStartTime', type: sql.DateTime2, value: start },
        ]);
        await writeAuditLog({
          userId: ctx.user!.id, username: ctx.user!.name || '', userRole: ctx.user!.role,
          module: 'Lease', subModule: 'Origination', actionType: 'CREATE',
          recordTable: 'lease.contracts', recordId: String(result?.contract_id),
          afterState: { contract_ref: result?.contract_ref }, outcome: 'Success',
          screenId: 'VFLSENEWLSE0001P001', processStartTime: start,
        });
        return result;
      } catch (err: any) {
        await writeErrorLog({ severity: 'Error', module: 'Lease', message: err.message, stackTrace: err.stack, screenId: 'VFLSENEWLSE0001P001' });
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: err.message });
      }
    }),

  updateLeaseROU: protectedProcedure
    .input(z.object({
      contractId: z.number(),
      rouAssetValue: z.number(),
      leaseLiabilityCommence: z.number(),
    }))
    .mutation(async ({ input }) => {
      await execSPPOne('sp_UpdateLeaseROU', [
        { name: 'ContractId', type: sql.Int, value: input.contractId },
        { name: 'ROUAssetValue', type: sql.Decimal(18, 2), value: input.rouAssetValue },
        { name: 'LeaseLiabilityCommence', type: sql.Decimal(18, 2), value: input.leaseLiabilityCommence },
      ]);
      return { success: true };
    }),

  saveAmortisationSchedule: protectedProcedure
    .input(z.object({
      contractId: z.number(),
      schedule: z.array(z.object({
        period_date: z.string(),
        opening_liability: z.number(),
        interest_expense: z.number(),
        payment: z.number(),
        principal: z.number(),
        closing_liability: z.number(),
        rou_nbv: z.number(),
        depreciation: z.number(),
        cumulative_depr: z.number(),
      })),
    }))
    .mutation(async ({ input }) => {
      const result = await execSPPOne<{ rows_inserted: number }>('sp_SaveAmortisationSchedule', [
        { name: 'ContractId', type: sql.Int, value: input.contractId },
        { name: 'ScheduleJson', type: sql.NVarChar(sql.MAX), value: JSON.stringify(input.schedule) },
      ]);
      return result;
    }),

  submitForApproval: protectedProcedure
    .input(z.object({ contractId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const result = await execSPPOne<{ queue_ref: string }>('sp_SubmitLeaseForApproval', [
        { name: 'ContractId', type: sql.Int, value: input.contractId },
        { name: 'MakerId', type: sql.Int, value: ctx.user!.id },
        { name: 'ScreenId', type: sql.VarChar(20), value: 'VFLSENEWLSE0001P001' },
      ]);
      return result;
    }),

  approveRejectLease: protectedProcedure
    .input(z.object({
      contractId: z.number(),
      outcome: z.enum(['Approved', 'Rejected']),
      reason: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const start = new Date();
      const result = await execSPPOne<{ new_status: string }>('sp_ApproveRejectLease', [
        { name: 'ContractId', type: sql.Int, value: input.contractId },
        { name: 'CheckerId', type: sql.Int, value: ctx.user!.id },
        { name: 'Outcome', type: sql.VarChar(20), value: input.outcome },
        { name: 'Reason', type: sql.NVarChar(1000), value: input.reason || null },
        { name: 'ScreenId', type: sql.VarChar(20), value: 'VFMCQUEUE0001P001' },
      ]);
      await writeAuditLog({
        userId: ctx.user!.id, username: ctx.user!.name || '', userRole: ctx.user!.role,
        module: 'Lease', subModule: 'Approval', actionType: input.outcome.toUpperCase(),
        recordTable: 'lease.contracts', recordId: String(input.contractId),
        afterState: result, outcome: 'Success', screenId: 'VFMCQUEUE0001P001', processStartTime: start,
      });
      return result;
    }),

  // ── LESSEE DETAILS (Screen: VFLSNEWLS0002P001) ─────────
  upsertLesseeDetails: protectedProcedure
    .input(z.object({
      contractId:   z.number().int(),
      lesseeType:   z.enum(['Staff', 'Client', 'Other']),
      lesseeName:   z.string().min(1),
      staffNumber:  z.string().optional(),
      employeeId:   z.string().optional(),
      grade:        z.string().optional(),
      position:     z.string().optional(),
      department:   z.string().optional(),
      placeOfWork:  z.string().optional(),
      contactEmail: z.string().optional(),
      contactPhone: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const start = new Date();
      try {
        const rows = await execSPP('sp_UpsertLeaseLesseeDetails', [
          { name: 'contract_id',   type: sql.Int,           value: input.contractId },
          { name: 'lessee_type',   type: sql.NVarChar(20),  value: input.lesseeType },
          { name: 'lessee_name',   type: sql.NVarChar(200), value: input.lesseeName },
          { name: 'staff_number',  type: sql.NVarChar(50),  value: input.staffNumber  ?? null },
          { name: 'employee_id',   type: sql.NVarChar(50),  value: input.employeeId   ?? null },
          { name: 'grade',         type: sql.NVarChar(50),  value: input.grade        ?? null },
          { name: 'position',      type: sql.NVarChar(100), value: input.position     ?? null },
          { name: 'department',    type: sql.NVarChar(100), value: input.department   ?? null },
          { name: 'place_of_work', type: sql.NVarChar(200), value: input.placeOfWork  ?? null },
          { name: 'contact_email', type: sql.NVarChar(200), value: input.contactEmail ?? null },
          { name: 'contact_phone', type: sql.NVarChar(50),  value: input.contactPhone ?? null },
        ]);
        await writeAuditLog({
          userId: ctx.user!.id, username: ctx.user!.name || '', userRole: ctx.user!.role,
          module: 'Lease', subModule: 'LesseeDetails', actionType: 'UPSERT',
          recordTable: 'lease.lease_lessee_details', recordId: String(input.contractId),
          afterState: rows[0] ?? {}, outcome: 'Success',
          screenId: 'VFLSNEWLS0002P001', processStartTime: start,
        });
        return rows[0] ?? null;
      } catch (err: any) {
        await writeErrorLog({ severity: 'Error', module: 'Lease', message: err.message, stackTrace: err.stack, screenId: 'VFLSNEWLS0002P001' });
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: err.message });
      }
    }),

  getLesseeDetails: protectedProcedure
    .input(z.object({ contractId: z.number().int() }))
    .query(async ({ input }) => {
      const rows = await execSPP('sp_GetLeaseLesseeDetails', [
        { name: 'contract_id', type: sql.Int, value: input.contractId },
      ]);
      if (!rows.length) return null;
      const r = rows[0] as any;
      return {
        lesseeDetailId: r.lessee_detail_id as number,
        contractId:     r.contract_id      as number,
        lesseeType:     r.lessee_type      as string,
        lesseeName:     r.lessee_name      as string,
        staffNumber:    r.staff_number     as string | null,
        employeeId:     r.employee_id      as string | null,
        grade:          r.grade            as string | null,
        position:       r.position         as string | null,
        department:     r.department       as string | null,
        placeOfWork:    r.place_of_work    as string | null,
        contactEmail:   r.contact_email    as string | null,
        contactPhone:   r.contact_phone    as string | null,
        createdAt:      r.created_at       as string,
        updatedAt:      r.updated_at       as string,
      };
    }),

  // ── INSURANCE ───────────────────────────────────────────
  getInsurancePolicies: protectedProcedure
    .input(z.object({ contractId: z.number().optional(), status: z.string().optional() }))
    .query(async ({ input }) => {
      return execSPP('sp_GetInsurancePolicies', [
        { name: 'ContractId', type: sql.Int, value: input.contractId || null },
        { name: 'Status', type: sql.VarChar(20), value: input.status || null },
      ]);
    }),

  // ── MAINTENANCE ─────────────────────────────────────────
  getMaintenanceTickets: protectedProcedure
    .input(z.object({ contractId: z.number().optional(), status: z.string().optional() }))
    .query(async ({ input }) => {
      return execSPP('sp_GetMaintenanceTickets', [
        { name: 'ContractId', type: sql.Int, value: input.contractId || null },
        { name: 'Status', type: sql.VarChar(20), value: input.status || null },
      ]);
    }),

  // ── SOFT DELETE ──────────────────────────────────────────────────────────
  deleteLease: protectedProcedure
    .input(z.object({ contractId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await execSPP('sp_SoftDeleteContract', [
        { name: 'ContractId', type: sql.Int,         value: input.contractId },
        { name: 'MakerId',    type: sql.Int,         value: ctx.user.id },
        { name: 'ScreenId',   type: sql.VarChar(50), value: 'VFLSLSREG0001P001' },
      ]);
      return { success: true };
    }),
});
