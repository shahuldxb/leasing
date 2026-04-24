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
import { bounceReconRouter } from "./routers/bounceRecon";
import { lessorRouter, assetRouter } from "./routers/lessorAsset";
import { accountingRouter } from "./routers/accounting";
import { furnishedAssetsRouter, assetDepositRouter, handoverChecklistRouter } from "./routers/furnishedAssets";
import { masterContractsRouter } from "./routers/masterContracts";
import { aiFillRouter }         from "./routers/aiFill";
import { furnitureCollectionsRouter } from "./routers/furnitureCollections";
import { criticalDatesRouter, aiAbstractionRouter, subLeaseRouter, rentReviewRouter, securityDepositRouter, reportBuilderRouter, scenarioRouter, asc842Router, leaseOriginationRouter, leaseOptionsRouter, breakClauseRouter, leaseIncentiveRouter, budgetVarianceRouter, costCentreRouter, marketRentRouter, spaceManagementRouter, capitalProjectsRouter, esgCarbonRouter, multiEntityRouter, fxAccountingRouter, lessorCreditRouter, emailAlertsRouter, scheduledReportsRouter, terminationRouter, bouncePenaltyRouter, leaseOriginationNewRouter } from "./routers/features";

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
  lease:       leaseRouter,
  payables:    payablesRouter,
  workflow:    workflowRouter,
  genai:       genaiRouter,
  bankRecon:   bankReconRouter,
  cheque:      chequeRouter,
  bounceRecon: bounceReconRouter,
  lessor:      lessorRouter,
  asset:       assetRouter,
  compliance:  complianceRouter,
  mis:         misRouter,
  accounting:  accountingRouter,
  criticalDates: criticalDatesRouter,
  aiAbstraction: aiAbstractionRouter,
  subLease:    subLeaseRouter,
  rentReview:  rentReviewRouter,
  securityDeposit: securityDepositRouter,
  reportBuilder: reportBuilderRouter,
  scenario:    scenarioRouter,
  asc842:      asc842Router,
  leaseOrigination: leaseOriginationRouter,
  leaseOptions: leaseOptionsRouter,
  breakClause: breakClauseRouter,
  leaseIncentive: leaseIncentiveRouter,
  budgetVariance: budgetVarianceRouter,
  costCentre:  costCentreRouter,
  marketRent:  marketRentRouter,
  spaceManagement: spaceManagementRouter,
  capitalProjects: capitalProjectsRouter,
  esgCarbon:   esgCarbonRouter,
  multiEntity: multiEntityRouter,
  fxAccounting: fxAccountingRouter,
  lessorCredit: lessorCreditRouter,
  emailAlerts: emailAlertsRouter,
  scheduledReports: scheduledReportsRouter,
  termination:  terminationRouter,
  bouncePenalty: bouncePenaltyRouter,
  leaseOriginationNew: leaseOriginationNewRouter,
  furnishedAssets: furnishedAssetsRouter,
  assetDeposit:    assetDepositRouter,
  handoverChecklist: handoverChecklistRouter,
  masterContracts: masterContractsRouter,
  aiFill:          aiFillRouter,
  furnitureCollections: furnitureCollectionsRouter,
});

export type AppRouter = typeof appRouter;
