import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { execSPP, execSPPMulti, SPPParam } from "../db-sqlserver";

// ─── Lessor Router ────────────────────────────────────────────────────────────
export const lessorRouter = router({

  getLessors: protectedProcedure
    .input(z.object({
      searchTerm:  z.string().optional(),
      status:      z.enum(["Active","Inactive","Blacklisted"]).optional(),
      lessorType:  z.string().optional(),
      country:     z.string().optional(),
      pageNumber:  z.number().int().min(1).default(1),
      pageSize:    z.number().int().min(1).max(100).default(20),
    }))
    .query(async ({ input }) => {
      const params: SPPParam[] = [
        { name: "SearchTerm",  type: "NVarChar", value: input.searchTerm ?? null },
        { name: "Status",      type: "VarChar",  value: input.status ?? null },
        { name: "LessorType",  type: "VarChar",  value: input.lessorType ?? null },
        { name: "Country",     type: "VarChar",  value: input.country ?? null },
        { name: "PageNumber",  type: "Int",      value: input.pageNumber },
        { name: "PageSize",    type: "Int",      value: input.pageSize },
      ];
      const rows = await execSPP("sp_GetLessors", params);
      const total = rows[0]?.total_rows ?? 0;
      return { lessors: rows, total, pageNumber: input.pageNumber, pageSize: input.pageSize };
    }),

  getLessorDetail: protectedProcedure
    .input(z.object({ lessorId: z.number().int() }))
    .query(async ({ input }) => {
      const params: SPPParam[] = [
        { name: "LessorId", type: "Int", value: input.lessorId },
      ];
      const results = await execSPPMulti("sp_GetLessorDetail", params);
      return {
        lessor:       results[0]?.[0] ?? null,
        contacts:     results[1] ?? [],
        bankAccounts: results[2] ?? [],
        documents:    results[3] ?? [],
        notes:        results[4] ?? [],
        assets:       results[5] ?? [],
      };
    }),

  upsertLessor: protectedProcedure
    .input(z.object({
      lessorId:          z.number().int().optional(),
      lessorName:        z.string().min(2),
      lessorType:        z.enum(["Individual","Company","Government","REIT","Trust"]).default("Company"),
      registrationNo:    z.string().optional(),
      taxId:             z.string().optional(),
      country:           z.string().length(2).default("AE"),
      city:              z.string().optional(),
      addressLine1:      z.string().optional(),
      addressLine2:      z.string().optional(),
      postalCode:        z.string().optional(),
      website:           z.string().optional(),
      creditRating:      z.string().optional(),
      paymentTerms:      z.number().int().default(30),
      preferredCurrency: z.string().length(3).default("AED"),
      status:            z.enum(["Active","Inactive","Blacklisted"]).default("Active"),
      blacklistReason:   z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const params: SPPParam[] = [
        { name: "LessorId",          type: "Int",      value: input.lessorId ?? null },
        { name: "LessorName",        type: "NVarChar",  value: input.lessorName },
        { name: "LessorType",        type: "VarChar",   value: input.lessorType },
        { name: "RegistrationNo",    type: "NVarChar",  value: input.registrationNo ?? null },
        { name: "TaxId",             type: "NVarChar",  value: input.taxId ?? null },
        { name: "Country",           type: "VarChar",   value: input.country },
        { name: "City",              type: "NVarChar",  value: input.city ?? null },
        { name: "AddressLine1",      type: "NVarChar",  value: input.addressLine1 ?? null },
        { name: "AddressLine2",      type: "NVarChar",  value: input.addressLine2 ?? null },
        { name: "PostalCode",        type: "VarChar",   value: input.postalCode ?? null },
        { name: "Website",           type: "NVarChar",  value: input.website ?? null },
        { name: "CreditRating",      type: "VarChar",   value: input.creditRating ?? null },
        { name: "PaymentTerms",      type: "Int",       value: input.paymentTerms },
        { name: "PreferredCurrency", type: "VarChar",   value: input.preferredCurrency },
        { name: "Status",            type: "VarChar",   value: input.status },
        { name: "BlacklistReason",   type: "NVarChar",  value: input.blacklistReason ?? null },
        { name: "CreatedBy",         type: "NVarChar",  value: ctx.user?.name ?? "system" },
        { name: "ScreenId",          type: "VarChar",   value: "VFLSELESSMST0001P001" },
      ];
      const rows = await execSPP("sp_UpsertLessor", params);
      return rows[0];
    }),

  deleteLessor: protectedProcedure
    .input(z.object({ lessorId: z.number().int() }))
    .mutation(async ({ input, ctx }) => {
      const params: SPPParam[] = [
        { name: "LessorId",  type: "Int",     value: input.lessorId },
        { name: "DeletedBy", type: "NVarChar", value: ctx.user?.name ?? "system" },
      ];
      const rows = await execSPP("sp_DeleteLessor", params);
      return rows[0];
    }),

  upsertContact: protectedProcedure
    .input(z.object({
      contactId:      z.number().int().optional(),
      lessorId:       z.number().int(),
      contactType:    z.enum(["Primary","Finance","Legal","Operations","Emergency"]).default("Primary"),
      fullName:       z.string().min(2),
      jobTitle:       z.string().optional(),
      department:     z.string().optional(),
      email:          z.string().email().optional(),
      phonePrimary:   z.string().optional(),
      phoneSecondary: z.string().optional(),
      whatsapp:       z.string().optional(),
      isPrimary:      z.boolean().default(false),
      notes:          z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const params: SPPParam[] = [
        { name: "ContactId",      type: "Int",      value: input.contactId ?? null },
        { name: "LessorId",       type: "Int",      value: input.lessorId },
        { name: "ContactType",    type: "VarChar",  value: input.contactType },
        { name: "FullName",       type: "NVarChar", value: input.fullName },
        { name: "JobTitle",       type: "NVarChar", value: input.jobTitle ?? null },
        { name: "Department",     type: "NVarChar", value: input.department ?? null },
        { name: "Email",          type: "NVarChar", value: input.email ?? null },
        { name: "PhonePrimary",   type: "VarChar",  value: input.phonePrimary ?? null },
        { name: "PhoneSecondary", type: "VarChar",  value: input.phoneSecondary ?? null },
        { name: "Whatsapp",       type: "VarChar",  value: input.whatsapp ?? null },
        { name: "IsPrimary",      type: "Bit",      value: input.isPrimary ? 1 : 0 },
        { name: "Notes",          type: "NVarChar", value: input.notes ?? null },
      ];
      const rows = await execSPP("sp_UpsertLessorContact", params);
      return rows[0];
    }),

  deleteContact: protectedProcedure
    .input(z.object({ contactId: z.number().int(), lessorId: z.number().int() }))
    .mutation(async ({ input }) => {
      const params: SPPParam[] = [
        { name: "ContactId", type: "Int", value: input.contactId },
        { name: "LessorId",  type: "Int", value: input.lessorId },
      ];
      const rows = await execSPP("sp_DeleteLessorContact", params);
      return rows[0];
    }),

  upsertBankAccount: protectedProcedure
    .input(z.object({
      bankAccId:     z.number().int().optional(),
      lessorId:      z.number().int(),
      bankName:      z.string().min(2),
      accountName:   z.string().min(2),
      accountNumber: z.string().min(4),
      iban:          z.string().optional(),
      swiftCode:     z.string().optional(),
      routingNumber: z.string().optional(),
      currency:      z.string().length(3).default("AED"),
      accountType:   z.enum(["Current","Savings","Fixed"]).default("Current"),
      branchName:    z.string().optional(),
      branchCode:    z.string().optional(),
      country:       z.string().length(2).default("AE"),
      isPrimary:     z.boolean().default(false),
      verifiedBy:    z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const params: SPPParam[] = [
        { name: "BankAccId",     type: "Int",      value: input.bankAccId ?? null },
        { name: "LessorId",      type: "Int",      value: input.lessorId },
        { name: "BankName",      type: "NVarChar", value: input.bankName },
        { name: "AccountName",   type: "NVarChar", value: input.accountName },
        { name: "AccountNumber", type: "NVarChar", value: input.accountNumber },
        { name: "IBAN",          type: "NVarChar", value: input.iban ?? null },
        { name: "SwiftCode",     type: "VarChar",  value: input.swiftCode ?? null },
        { name: "RoutingNumber", type: "VarChar",  value: input.routingNumber ?? null },
        { name: "Currency",      type: "VarChar",  value: input.currency },
        { name: "AccountType",   type: "VarChar",  value: input.accountType },
        { name: "BranchName",    type: "NVarChar", value: input.branchName ?? null },
        { name: "BranchCode",    type: "VarChar",  value: input.branchCode ?? null },
        { name: "Country",       type: "VarChar",  value: input.country },
        { name: "IsPrimary",     type: "Bit",      value: input.isPrimary ? 1 : 0 },
        { name: "VerifiedBy",    type: "NVarChar", value: input.verifiedBy ?? null },
      ];
      const rows = await execSPP("sp_UpsertLessorBankAccount", params);
      return rows[0];
    }),

  deleteBankAccount: protectedProcedure
    .input(z.object({ bankAccId: z.number().int(), lessorId: z.number().int() }))
    .mutation(async ({ input }) => {
      const params: SPPParam[] = [
        { name: "BankAccId", type: "Int", value: input.bankAccId },
        { name: "LessorId",  type: "Int", value: input.lessorId },
      ];
      const rows = await execSPP("sp_DeleteLessorBankAccount", params);
      return rows[0];
    }),

  addDocument: protectedProcedure
    .input(z.object({
      lessorId:     z.number().int(),
      docType:      z.string(),
      docName:      z.string(),
      docNumber:    z.string().optional(),
      issueDate:    z.string().optional(),
      expiryDate:   z.string().optional(),
      issuingAuth:  z.string().optional(),
      filePath:     z.string().optional(),
      fileSizeKb:   z.number().int().optional(),
      notes:        z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const params: SPPParam[] = [
        { name: "LessorId",   type: "Int",      value: input.lessorId },
        { name: "DocType",    type: "VarChar",  value: input.docType },
        { name: "DocName",    type: "NVarChar", value: input.docName },
        { name: "DocNumber",  type: "NVarChar", value: input.docNumber ?? null },
        { name: "IssueDate",  type: "Date",     value: input.issueDate ?? null },
        { name: "ExpiryDate", type: "Date",     value: input.expiryDate ?? null },
        { name: "IssuingAuth",type: "NVarChar", value: input.issuingAuth ?? null },
        { name: "FilePath",   type: "NVarChar", value: input.filePath ?? null },
        { name: "FileSizeKb", type: "Int",      value: input.fileSizeKb ?? null },
        { name: "Notes",      type: "NVarChar", value: input.notes ?? null },
        { name: "UploadedBy", type: "NVarChar", value: ctx.user?.name ?? "system" },
      ];
      const rows = await execSPP("sp_AddLessorDocument", params);
      return rows[0];
    }),

  addNote: protectedProcedure
    .input(z.object({
      lessorId:  z.number().int(),
      noteType:  z.enum(["General","Legal","Financial","Dispute","Negotiation"]).default("General"),
      subject:   z.string().min(2),
      noteText:  z.string().min(2),
      isPrivate: z.boolean().default(false),
    }))
    .mutation(async ({ input, ctx }) => {
      const params: SPPParam[] = [
        { name: "LessorId",  type: "Int",      value: input.lessorId },
        { name: "NoteType",  type: "VarChar",  value: input.noteType },
        { name: "Subject",   type: "NVarChar", value: input.subject },
        { name: "NoteText",  type: "NVarChar", value: input.noteText },
        { name: "IsPrivate", type: "Bit",      value: input.isPrivate ? 1 : 0 },
        { name: "CreatedBy", type: "NVarChar", value: ctx.user?.name ?? "system" },
      ];
      const rows = await execSPP("sp_AddLessorNote", params);
      return rows[0];
    }),

  getLessorAssets: protectedProcedure
    .input(z.object({ lessorId: z.number().int() }))
    .query(async ({ input }) => {
      const params: SPPParam[] = [
        { name: "LessorId", type: "Int", value: input.lessorId },
      ];
      return await execSPP("sp_GetLessorAssets", params);
    }),
});

// ─── Asset Router ─────────────────────────────────────────────────────────────
export const assetRouter = router({

  getAssets: protectedProcedure
    .input(z.object({
      searchTerm:       z.string().optional(),
      assetType:        z.string().optional(),
      status:           z.string().optional(),
      country:          z.string().optional(),
      lessorId:         z.number().int().optional(),
      maintenanceResp:  z.string().optional(),
      pageNumber:       z.number().int().min(1).default(1),
      pageSize:         z.number().int().min(1).max(100).default(20),
    }))
    .query(async ({ input }) => {
      const params: SPPParam[] = [
        { name: "SearchTerm",     type: "NVarChar", value: input.searchTerm ?? null },
        { name: "AssetType",      type: "VarChar",  value: input.assetType ?? null },
        { name: "Status",         type: "VarChar",  value: input.status ?? null },
        { name: "Country",        type: "VarChar",  value: input.country ?? null },
        { name: "LessorId",       type: "Int",      value: input.lessorId ?? null },
        { name: "MaintenanceResp",type: "VarChar",  value: input.maintenanceResp ?? null },
        { name: "PageNumber",     type: "Int",      value: input.pageNumber },
        { name: "PageSize",       type: "Int",      value: input.pageSize },
      ];
      const rows = await execSPP("sp_GetAssets", params);
      const total = rows[0]?.total_rows ?? 0;
      return { assets: rows, total, pageNumber: input.pageNumber, pageSize: input.pageSize };
    }),

  getAssetDetail: protectedProcedure
    .input(z.object({ assetId: z.number().int() }))
    .query(async ({ input }) => {
      const params: SPPParam[] = [
        { name: "AssetId", type: "Int", value: input.assetId },
      ];
      const results = await execSPPMulti("sp_GetAssetDetail", params);
      return {
        asset:        results[0]?.[0] ?? null,
        documents:    results[1] ?? [],
        maintenance:  results[2] ?? [],
        insurance:    results[3] ?? [],
      };
    }),

  getAssetLeaseHistory: protectedProcedure
    .input(z.object({ assetId: z.number().int() }))
    .query(async ({ input }) => {
      const params: SPPParam[] = [
        { name: "AssetId", type: "Int", value: input.assetId },
      ];
      return await execSPP("sp_GetAssetLeaseHistory", params);
    }),

  upsertAsset: protectedProcedure
    .input(z.object({
      assetId:                   z.number().int().optional(),
      assetName:                 z.string().min(2),
      assetType:                 z.enum(["Tower Site","Data Centre","Retail Outlet","Office","Warehouse","Vehicle","Network Equipment","Land","Other"]),
      assetSubtype:              z.string().optional(),
      description:               z.string().optional(),
      country:                   z.string().length(2).default("AE"),
      city:                      z.string().optional(),
      area:                      z.string().optional(),
      addressLine1:              z.string().optional(),
      addressLine2:              z.string().optional(),
      postalCode:                z.string().optional(),
      latitude:                  z.number().optional(),
      longitude:                 z.number().optional(),
      floorAreaSqm:              z.number().optional(),
      floors:                    z.number().int().optional(),
      yearBuilt:                 z.number().int().optional(),
      conditionRating:           z.enum(["Excellent","Good","Fair","Poor"]).optional(),
      currentLessorId:           z.number().int().optional(),
      status:                    z.enum(["Available","Leased","Under Maintenance","Decommissioned"]).default("Available"),
      maintenanceResponsibility: z.enum(["Lessor","Vodafone","Shared"]).default("Lessor"),
      estimatedMarketValue:      z.number().optional(),
      lastValuationDate:         z.string().optional(),
      makeGoodProvision:         z.number().default(0),
      tags:                      z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const params: SPPParam[] = [
        { name: "AssetId",                   type: "Int",      value: input.assetId ?? null },
        { name: "AssetName",                 type: "NVarChar", value: input.assetName },
        { name: "AssetType",                 type: "VarChar",  value: input.assetType },
        { name: "AssetSubtype",              type: "NVarChar", value: input.assetSubtype ?? null },
        { name: "Description",               type: "NVarChar", value: input.description ?? null },
        { name: "Country",                   type: "VarChar",  value: input.country },
        { name: "City",                      type: "NVarChar", value: input.city ?? null },
        { name: "Area",                      type: "NVarChar", value: input.area ?? null },
        { name: "AddressLine1",              type: "NVarChar", value: input.addressLine1 ?? null },
        { name: "AddressLine2",              type: "NVarChar", value: input.addressLine2 ?? null },
        { name: "PostalCode",                type: "VarChar",  value: input.postalCode ?? null },
        { name: "Latitude",                  type: "Decimal",  value: input.latitude ?? null },
        { name: "Longitude",                 type: "Decimal",  value: input.longitude ?? null },
        { name: "FloorAreaSqm",              type: "Decimal",  value: input.floorAreaSqm ?? null },
        { name: "Floors",                    type: "Int",      value: input.floors ?? null },
        { name: "YearBuilt",                 type: "Int",      value: input.yearBuilt ?? null },
        { name: "ConditionRating",           type: "VarChar",  value: input.conditionRating ?? null },
        { name: "CurrentLessorId",           type: "Int",      value: input.currentLessorId ?? null },
        { name: "Status",                    type: "VarChar",  value: input.status },
        { name: "MaintenanceResponsibility", type: "VarChar",  value: input.maintenanceResponsibility },
        { name: "EstimatedMarketValue",      type: "Decimal",  value: input.estimatedMarketValue ?? null },
        { name: "LastValuationDate",         type: "Date",     value: input.lastValuationDate ?? null },
        { name: "MakeGoodProvision",         type: "Decimal",  value: input.makeGoodProvision },
        { name: "Tags",                      type: "NVarChar", value: input.tags ?? null },
        { name: "CreatedBy",                 type: "NVarChar", value: ctx.user?.name ?? "system" },
        { name: "ScreenId",                  type: "VarChar",  value: "VFLSEASTREG0001P001" },
      ];
      const rows = await execSPP("sp_UpsertAsset", params);
      return rows[0];
    }),

  deleteAsset: protectedProcedure
    .input(z.object({ assetId: z.number().int() }))
    .mutation(async ({ input, ctx }) => {
      const params: SPPParam[] = [
        { name: "AssetId",   type: "Int",     value: input.assetId },
        { name: "DeletedBy", type: "NVarChar", value: ctx.user?.name ?? "system" },
      ];
      const rows = await execSPP("sp_DeleteAsset", params);
      return rows[0];
    }),

  // ── Sub-Asset Groups (furniture/appliance sets) ─────────────────────────
  getSubAssetGroups: protectedProcedure
    .query(async () => {
      const params: SPPParam[] = [
        { name: "SearchTerm",     type: "NVarChar", value: null },
        { name: "AssetType",      type: "VarChar",  value: "SUB_ASSET_GROUP" },
        { name: "Status",         type: "VarChar",  value: null },
        { name: "Country",        type: "VarChar",  value: null },
        { name: "LessorId",       type: "Int",      value: null },
        { name: "MaintenanceResp",type: "VarChar",  value: null },
        { name: "PageNumber",     type: "Int",      value: 1 },
        { name: "PageSize",       type: "Int",      value: 500 },
      ];
      const rows = await execSPP("sp_GetAssets", params);
      return rows.map((r: Record<string, unknown>) => ({
        assetId:     r.asset_id as number,
        assetCode:   r.asset_code as string,
        setName:     r.asset_name as string,
        description: (r.description as string | null) ?? "",
        tags:        (r.tags as string | null) ?? "[]",
        createdAt:   r.created_at as string,
        updatedAt:   r.updated_at as string,
      }));
    }),

  upsertSubAssetGroup: protectedProcedure
    .input(z.object({
      assetId:     z.number().int().optional(),
      setName:     z.string().min(1),
      description: z.string().optional(),
      tags:        z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const params: SPPParam[] = [
        { name: "AssetId",                   type: "Int",      value: input.assetId ?? null },
        { name: "AssetName",                 type: "NVarChar", value: input.setName },
        { name: "AssetType",                 type: "VarChar",  value: "SUB_ASSET_GROUP" },
        { name: "AssetSubtype",              type: "NVarChar", value: null },
        { name: "Description",               type: "NVarChar", value: input.description ?? null },
        { name: "Country",                   type: "VarChar",  value: "QA" },
        { name: "City",                      type: "NVarChar", value: "Doha" },
        { name: "Area",                      type: "NVarChar", value: null },
        { name: "AddressLine1",              type: "NVarChar", value: null },
        { name: "AddressLine2",              type: "NVarChar", value: null },
        { name: "PostalCode",                type: "VarChar",  value: null },
        { name: "Latitude",                  type: "Decimal",  value: null },
        { name: "Longitude",                 type: "Decimal",  value: null },
        { name: "FloorAreaSqm",              type: "Decimal",  value: null },
        { name: "Floors",                    type: "Int",      value: null },
        { name: "YearBuilt",                 type: "Int",      value: null },
        { name: "ConditionRating",           type: "VarChar",  value: null },
        { name: "CurrentLessorId",           type: "Int",      value: null },
        { name: "Status",                    type: "VarChar",  value: "Available" },
        { name: "MaintenanceResponsibility", type: "VarChar",  value: "Lessor" },
        { name: "EstimatedMarketValue",      type: "Decimal",  value: null },
        { name: "LastValuationDate",         type: "Date",     value: null },
        { name: "MakeGoodProvision",         type: "Decimal",  value: 0 },
        { name: "Tags",                      type: "NVarChar", value: input.tags ?? null },
        { name: "CreatedBy",                 type: "NVarChar", value: ctx.user?.name ?? "system" },
        { name: "ScreenId",                  type: "VarChar",  value: "VFLSASSET001" },
      ];
      const rows = await execSPP("sp_UpsertAsset", params);
      return rows[0] as { asset_id: number; asset_code: string };
    }),

  deleteSubAssetGroup: protectedProcedure
    .input(z.object({ assetId: z.number().int() }))
    .mutation(async ({ input, ctx }) => {
      const params: SPPParam[] = [
        { name: "AssetId",   type: "Int",      value: input.assetId },
        { name: "DeletedBy", type: "NVarChar", value: ctx.user?.name ?? "system" },
      ];
      const rows = await execSPP("sp_DeleteAsset", params);
      return rows[0];
    }),

  addDocument: protectedProcedure
    .input(z.object({
      assetId:    z.number().int(),
      docType:    z.string(),
      docName:    z.string(),
      docNumber:  z.string().optional(),
      issueDate:  z.string().optional(),
      expiryDate: z.string().optional(),
      filePath:   z.string().optional(),
      fileSizeKb: z.number().int().optional(),
      notes:      z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const params: SPPParam[] = [
        { name: "AssetId",    type: "Int",      value: input.assetId },
        { name: "DocType",    type: "VarChar",  value: input.docType },
        { name: "DocName",    type: "NVarChar", value: input.docName },
        { name: "DocNumber",  type: "NVarChar", value: input.docNumber ?? null },
        { name: "IssueDate",  type: "Date",     value: input.issueDate ?? null },
        { name: "ExpiryDate", type: "Date",     value: input.expiryDate ?? null },
        { name: "FilePath",   type: "NVarChar", value: input.filePath ?? null },
        { name: "FileSizeKb", type: "Int",      value: input.fileSizeKb ?? null },
        { name: "Notes",      type: "NVarChar", value: input.notes ?? null },
        { name: "UploadedBy", type: "NVarChar", value: ctx.user?.name ?? "system" },
      ];
      const rows = await execSPP("sp_AddAssetDocument", params);
      return rows[0];
    }),

  addMaintenance: protectedProcedure
    .input(z.object({
      assetId:        z.number().int(),
      maintType:      z.enum(["Routine","Preventive","Corrective","Emergency","Inspection"]),
      description:    z.string().min(2),
      performedBy:    z.enum(["Vodafone","Lessor","Third Party"]).default("Vodafone"),
      contractorName: z.string().optional(),
      costAmount:     z.number().default(0),
      costCurrency:   z.string().length(3).default("AED"),
      isRecoverable:  z.boolean().default(false),
      scheduledDate:  z.string().optional(),
      completedDate:  z.string().optional(),
      status:         z.enum(["Scheduled","In Progress","Completed","Cancelled"]).default("Scheduled"),
      notes:          z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const params: SPPParam[] = [
        { name: "AssetId",        type: "Int",      value: input.assetId },
        { name: "MaintType",      type: "VarChar",  value: input.maintType },
        { name: "Description",    type: "NVarChar", value: input.description },
        { name: "PerformedBy",    type: "VarChar",  value: input.performedBy },
        { name: "ContractorName", type: "NVarChar", value: input.contractorName ?? null },
        { name: "CostAmount",     type: "Decimal",  value: input.costAmount },
        { name: "CostCurrency",   type: "VarChar",  value: input.costCurrency },
        { name: "IsRecoverable",  type: "Bit",      value: input.isRecoverable ? 1 : 0 },
        { name: "ScheduledDate",  type: "Date",     value: input.scheduledDate ?? null },
        { name: "CompletedDate",  type: "Date",     value: input.completedDate ?? null },
        { name: "Status",         type: "VarChar",  value: input.status },
        { name: "Notes",          type: "NVarChar", value: input.notes ?? null },
        { name: "CreatedBy",      type: "NVarChar", value: ctx.user?.name ?? "system" },
      ];
      const rows = await execSPP("sp_AddAssetMaintenance", params);
      return rows[0];
    }),

  addInsurance: protectedProcedure
    .input(z.object({
      assetId:       z.number().int(),
      policyNumber:  z.string(),
      insurerName:   z.string(),
      coverageType:  z.enum(["Property","Liability","Fire","Flood","All Risk","Other"]),
      sumInsured:    z.number().optional(),
      currency:      z.string().length(3).default("AED"),
      premiumAmount: z.number().optional(),
      startDate:     z.string(),
      endDate:       z.string(),
      isMandatory:   z.boolean().default(true),
      insuredBy:     z.enum(["Vodafone","Lessor"]).default("Vodafone"),
      notes:         z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const params: SPPParam[] = [
        { name: "AssetId",       type: "Int",      value: input.assetId },
        { name: "PolicyNumber",  type: "NVarChar", value: input.policyNumber },
        { name: "InsurerName",   type: "NVarChar", value: input.insurerName },
        { name: "CoverageType",  type: "VarChar",  value: input.coverageType },
        { name: "SumInsured",    type: "Decimal",  value: input.sumInsured ?? null },
        { name: "Currency",      type: "VarChar",  value: input.currency },
        { name: "PremiumAmount", type: "Decimal",  value: input.premiumAmount ?? null },
        { name: "StartDate",     type: "Date",     value: input.startDate },
        { name: "EndDate",       type: "Date",     value: input.endDate },
        { name: "IsMandatory",   type: "Bit",      value: input.isMandatory ? 1 : 0 },
        { name: "InsuredBy",     type: "VarChar",  value: input.insuredBy },
        { name: "Notes",         type: "NVarChar", value: input.notes ?? null },
      ];
      const rows = await execSPP("sp_AddAssetInsurance", params);
      return rows[0];
    }),
});
