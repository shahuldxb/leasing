/**
 * VodaLease Enterprise — Database Performance Monitoring Router
 * Provides endpoints for:
 *  - Viewing slow queries from the persistent table
 *  - In-memory query stats (real-time)
 *  - Connection pool status
 *  - SQL Server index recommendations (from DMVs)
 *  - Resolving slow queries
 *  - Purging old records
 */
import { z } from 'zod';
import { protectedProcedure, router } from '../_core/trpc';
import { execSPP, execSPPMulti, execSPPOne, getQueryStats, getPoolStatus, sql } from '../db-sqlserver';
import { TRPCError } from '@trpc/server';

export const performanceRouter = router({
  // ── GET SLOW QUERIES (from persistent table) ──────────────────────
  getSlowQueries: protectedProcedure
    .input(z.object({
      topN: z.number().int().min(1).max(200).default(50),
      procedureName: z.string().optional(),
      minDurationMs: z.number().int().default(500),
      daysBack: z.number().int().min(1).max(365).default(7),
      unresolvedOnly: z.boolean().default(false),
    }).optional())
    .query(async ({ input, ctx }) => {
      if (ctx.user?.role !== 'admin') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
      }
      const rows = await execSPP('sp_GetSlowQueries', [
        { name: 'TopN', type: sql.Int, value: input?.topN ?? 50 },
        { name: 'ProcedureName', type: sql.NVarChar(255), value: input?.procedureName ?? null },
        { name: 'MinDurationMs', type: sql.Int, value: input?.minDurationMs ?? 500 },
        { name: 'DaysBack', type: sql.Int, value: input?.daysBack ?? 7 },
        { name: 'UnresolvedOnly', type: sql.Bit, value: input?.unresolvedOnly ? 1 : 0 },
      ]);
      return rows;
    }),

  // ── GET SLOW QUERY AGGREGATED STATS ───────────────────────────────
  getSlowQueryStats: protectedProcedure
    .input(z.object({ daysBack: z.number().int().min(1).max(365).default(7) }).optional())
    .query(async ({ input, ctx }) => {
      if (ctx.user?.role !== 'admin') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
      }
      const recordsets = await execSPPMulti('sp_GetSlowQueryStats', [
        { name: 'DaysBack', type: sql.Int, value: input?.daysBack ?? 7 },
      ]);
      return {
        byProcedure: recordsets[0] || [],
        summary: recordsets[1]?.[0] || null,
      };
    }),

  // ── GET INDEX RECOMMENDATIONS (from SQL Server DMVs) ──────────────
  getIndexRecommendations: protectedProcedure
    .input(z.object({ topN: z.number().int().min(1).max(50).default(20) }).optional())
    .query(async ({ input, ctx }) => {
      if (ctx.user?.role !== 'admin') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
      }
      const rows = await execSPP('sp_GetIndexRecommendations', [
        { name: 'TopN', type: sql.Int, value: input?.topN ?? 20 },
      ]);
      return rows;
    }),

  // ── GET IN-MEMORY QUERY STATS (real-time, no DB call) ─────────────
  getRealtimeStats: protectedProcedure
    .query(async ({ ctx }) => {
      if (ctx.user?.role !== 'admin') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
      }
      return getQueryStats();
    }),

  // ── GET CONNECTION POOL STATUS ────────────────────────────────────
  getPoolStatus: protectedProcedure
    .query(async ({ ctx }) => {
      if (ctx.user?.role !== 'admin') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
      }
      return getPoolStatus();
    }),

  // ── RESOLVE A SLOW QUERY ──────────────────────────────────────────
  resolveSlowQuery: protectedProcedure
    .input(z.object({
      slowQueryId: z.number().int(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== 'admin') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
      }
      const result = await execSPPOne<{ rows_affected: number }>('sp_ResolveSlowQuery', [
        { name: 'SlowQueryId', type: sql.Int, value: input.slowQueryId },
        { name: 'Notes', type: sql.NVarChar(sql.MAX), value: input.notes ?? null },
      ]);
      return { success: (result?.rows_affected ?? 0) > 0 };
    }),

  // ── PURGE OLD SLOW QUERY RECORDS ──────────────────────────────────
  purgeOldRecords: protectedProcedure
    .input(z.object({ retentionDays: z.number().int().min(7).max(365).default(90) }).optional())
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== 'admin') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
      }
      const result = await execSPPOne<{ rows_purged: number }>('sp_PurgeSlowQueries', [
        { name: 'RetentionDays', type: sql.Int, value: input?.retentionDays ?? 90 },
      ]);
      return { rowsPurged: result?.rows_purged ?? 0 };
    }),
});
