/**
 * VodaLease Enterprise — Workflow, Compliance, MIS & Dashboard Routers
 */
import { z } from 'zod';
import { protectedProcedure, router } from '../_core/trpc';
import { execSPP, execSPPOne, sql } from '../db-sqlserver';
import { writeAuditLog, writeErrorLog } from '../audit';

export const workflowRouter = router({
  getQueue: protectedProcedure
    .input(z.object({
      module: z.string().optional(),
      outcome: z.string().default('Pending'),
      page: z.number().default(1),
      pageSize: z.number().default(50),
    }))
    .query(async ({ input, ctx }) => {
      const rows = await execSPP('sp_GetMakerCheckerQueue', [
        { name: 'CheckerId', type: sql.Int, value: ctx.user!.id },
        { name: 'Module', type: sql.VarChar(50), value: input.module || null },
        { name: 'Status', type: sql.VarChar(20), value: input.outcome },   // SP uses @Status not @Outcome
        { name: 'PageNumber', type: sql.Int, value: input.page },
        { name: 'PageSize', type: sql.Int, value: input.pageSize },
      ]);
      const totalCount = rows.length > 0 ? (rows[0] as any).total_count : 0;
      return { rows, totalCount };
    }),

  getMyTasks: protectedProcedure
    .input(z.object({ status: z.string().default('Open') }))
    .query(async ({ input, ctx }) => {
      return execSPP('sp_GetUserTasks', [
        { name: 'UserId', type: sql.Int, value: ctx.user!.id },
        // SP has no @UserRole param — removed
        { name: 'Status', type: sql.VarChar(20), value: input.status },
      ]);
    }),

  completeTask: protectedProcedure
    .input(z.object({
      taskId: z.number(),
      outcome: z.string(),
      comment: z.string().optional(),
      screenId: z.string().default('VFWKFACTNS0003P001'),
    }))
    .mutation(async ({ input, ctx }) => {
      const start = new Date();
      // SP uses @QueueId, @CheckerId, @Decision, @Comments — not TaskId/UserId/Outcome/Comment/ScreenId
      const result = await execSPPOne<{ rows_updated: number }>('sp_CompleteWorkflowTask', [
        { name: 'QueueId', type: sql.Int, value: input.taskId },
        { name: 'CheckerId', type: sql.Int, value: ctx.user!.id },
        { name: 'Decision', type: sql.VarChar(50), value: input.outcome },
        { name: 'Comments', type: sql.NVarChar(500), value: input.comment || null },
      ]);
      await writeAuditLog({
        userId: ctx.user!.id, username: ctx.user!.name || '', userRole: ctx.user!.role,
        module: 'Workflow', subModule: 'Tasks', actionType: 'COMPLETE_TASK',
        recordTable: 'workflow.user_tasks', recordId: String(input.taskId),
        afterState: { outcome: input.outcome }, outcome: 'Success',
        screenId: input.screenId, processStartTime: start,
      });
      return result;
    }),

  getMCThresholds: protectedProcedure.query(async () => {
    return execSPP('sp_GetMCThresholds');
  }),
});

export const complianceRouter = router({
  getAuditLog: protectedProcedure
    .input(z.object({
      module: z.string().optional(),
      actionType: z.string().optional(),
      fromDate: z.string().optional(),
      toDate: z.string().optional(),
      page: z.number().default(1),
      pageSize: z.number().default(100),
    }))
    .query(async ({ input }) => {
      const rows = await execSPP('sp_GetAuditLog', [
        { name: 'Module', type: sql.VarChar(50), value: input.module || null },
        { name: 'UserId', type: sql.Int, value: null },
        { name: 'ActionType', type: sql.VarChar(50), value: input.actionType || null },
        { name: 'FromDate', type: sql.DateTime2, value: input.fromDate || null },
        { name: 'ToDate', type: sql.DateTime2, value: input.toDate || null },
        { name: 'PageNumber', type: sql.Int, value: input.page },
        { name: 'PageSize', type: sql.Int, value: input.pageSize },
      ]);
      const totalCount = rows.length > 0 ? (rows[0] as any).total_count : 0;
      return { rows, totalCount };
    }),

  getScreenRegistry: protectedProcedure.query(async () => {
    return execSPP('sp_GetScreenRegistry');
  }),
});

export const misRouter = router({
  getDashboardKPIs: protectedProcedure.query(async () => {
    return execSPPOne('sp_GetDashboardKPIs');
  }),

  getPortfolioAnalytics: protectedProcedure.query(async () => {
    return execSPP('sp_GetPortfolioAnalytics');
  }),

  getCashFlowForecast: protectedProcedure
    .input(z.object({ months: z.number().default(12) }))
    .query(async ({ input }) => {
      return execSPP('sp_GetCashFlowForecast', [
        { name: 'Months', type: sql.Int, value: input.months },
      ]);
    }),
});
