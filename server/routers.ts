import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";

// Feature routers — all DB access via SQL Server Stored Procedures
import { leaseRouter }     from "./routers/lease";
import { payablesRouter }  from "./routers/payables";
import { workflowRouter, complianceRouter, misRouter } from "./routers/workflow";
import { genaiRouter }     from "./routers/genai";
import { bankReconRouter } from "./routers/bankRecon";
import { chequeRouter }    from "./routers/cheque";

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ── Domain Routers ─────────────────────────────────────────
  lease:     leaseRouter,
  payables:  payablesRouter,
  workflow:  workflowRouter,
  genai:     genaiRouter,
  bankRecon:   bankReconRouter,
  cheque:      chequeRouter,
  compliance:  complianceRouter,
  mis:         misRouter,
});

export type AppRouter = typeof appRouter;
