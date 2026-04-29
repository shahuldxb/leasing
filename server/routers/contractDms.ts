/**
 * Contract DMS Router
 * Handles: metadata templates, metadata fields, contract documents,
 *          contract milestones, metadata values, file upload/delete
 *
 * NOTE: Uses SQL Server (mssql) — all queries use named @param placeholders.
 */
import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getPool, sql } from "../db-sqlserver";
import { storagePut } from "../storage";
import { invokeLLM } from "../_core/llm";

// ─── Helpers ─────────────────────────────────────────────────────────────────
/**
 * Run a parameterised SELECT and return all rows.
 * params: array of { name, type, value } — name WITHOUT the leading @
 */
async function q<T = Record<string, any>>(
  sqlText: string,
  params: Array<{ name: string; type?: any; value: any }> = []
): Promise<T[]> {
  const pool = await getPool();
  const req = pool.request();
  for (const p of params) {
    req.input(p.name, p.type ?? sql.NVarChar, p.value ?? null);
  }
  const result = await req.query(sqlText);
  return (result.recordset ?? []) as T[];
}

/**
 * Run a parameterised INSERT/UPDATE/DELETE.
 * Returns { rowsAffected, insertId } where insertId comes from OUTPUT INSERTED.
 */
async function exec(
  sqlText: string,
  params: Array<{ name: string; type?: any; value: any }> = []
): Promise<{ rowsAffected: number; insertId?: number }> {
  const pool = await getPool();
  const req = pool.request();
  for (const p of params) {
    req.input(p.name, p.type ?? sql.NVarChar, p.value ?? null);
  }
  const result = await req.query(sqlText);
  const inserted = result.recordset?.[0];
  return {
    rowsAffected: Array.isArray(result.rowsAffected) ? result.rowsAffected[0] : 0,
    insertId: inserted?.id ?? inserted?.template_id ?? inserted?.field_id
      ?? inserted?.doc_id ?? inserted?.milestone_id ?? inserted?.value_id
      ?? inserted?.config_id ?? undefined,
  };
}

// ─── Router ──────────────────────────────────────────────────────────────────
export const contractDmsRouter = router({
  // ── Metadata Templates ───────────────────────────────────────────────────
  listTemplates: protectedProcedure.query(async () => {
    return q(`
      SELECT t.*,
        (SELECT COUNT(*) FROM contract_metadata_fields f WHERE f.template_id = t.template_id) AS field_count
      FROM contract_metadata_templates t
      ORDER BY t.contract_type, t.template_name
    `);
  }),

  getTemplate: protectedProcedure
    .input(z.object({ templateId: z.number() }))
    .query(async ({ input }) => {
      const rows = await q(
        `SELECT * FROM contract_metadata_templates WHERE template_id = @templateId`,
        [{ name: "templateId", type: sql.Int, value: input.templateId }]
      );
      if (!rows[0]) throw new Error("Template not found");
      const fields = await q(
        `SELECT * FROM contract_metadata_fields WHERE template_id = @templateId ORDER BY display_order, field_id`,
        [{ name: "templateId", type: sql.Int, value: input.templateId }]
      );
      return { ...rows[0], fields };
    }),

  createTemplate: protectedProcedure
    .input(z.object({
      templateName: z.string().min(1),
      contractType: z.string().min(1),
      description:  z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const r = await exec(
        `INSERT INTO contract_metadata_templates (template_name, contract_type, description, created_by)
         OUTPUT INSERTED.template_id AS id
         VALUES (@templateName, @contractType, @description, @createdBy)`,
        [
          { name: "templateName", value: input.templateName },
          { name: "contractType", value: input.contractType },
          { name: "description",  value: input.description ?? null },
          { name: "createdBy",    type: sql.Int, value: ctx.user.id },
        ]
      );
      return { templateId: r.insertId };
    }),

  updateTemplate: protectedProcedure
    .input(z.object({
      templateId:   z.number(),
      templateName: z.string().min(1),
      contractType: z.string().min(1),
      description:  z.string().optional(),
      isActive:     z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      await exec(
        `UPDATE contract_metadata_templates
         SET template_name=@templateName, contract_type=@contractType,
             description=@description, is_active=@isActive
         WHERE template_id=@templateId`,
        [
          { name: "templateName", value: input.templateName },
          { name: "contractType", value: input.contractType },
          { name: "description",  value: input.description ?? null },
          { name: "isActive",     type: sql.Bit, value: input.isActive !== false ? 1 : 0 },
          { name: "templateId",   type: sql.Int, value: input.templateId },
        ]
      );
      return { ok: true };
    }),

  deleteTemplate: protectedProcedure
    .input(z.object({ templateId: z.number() }))
    .mutation(async ({ input }) => {
      await exec(
        `DELETE FROM contract_metadata_templates WHERE template_id=@templateId`,
        [{ name: "templateId", type: sql.Int, value: input.templateId }]
      );
      return { ok: true };
    }),

  // ── Metadata Fields ──────────────────────────────────────────────────────
  upsertField: protectedProcedure
    .input(z.object({
      fieldId:         z.number().optional(),
      templateId:      z.number(),
      fieldName:       z.string().min(1),
      fieldLabel:      z.string().min(1),
      fieldType:       z.string().default("text"),
      dropdownOptions: z.string().optional(),
      isRequired:      z.boolean().default(false),
      displayOrder:    z.number().default(0),
      placeholder:     z.string().optional(),
      helpText:        z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const opts = input.dropdownOptions ?? null;
      if (input.fieldId) {
        await exec(
          `UPDATE contract_metadata_fields
           SET field_name=@fieldName, field_label=@fieldLabel, field_type=@fieldType,
               dropdown_options=@dropdownOptions, is_required=@isRequired,
               display_order=@displayOrder, placeholder=@placeholder, help_text=@helpText
           WHERE field_id=@fieldId`,
          [
            { name: "fieldName",       value: input.fieldName },
            { name: "fieldLabel",      value: input.fieldLabel },
            { name: "fieldType",       value: input.fieldType },
            { name: "dropdownOptions", value: opts },
            { name: "isRequired",      type: sql.Bit, value: input.isRequired ? 1 : 0 },
            { name: "displayOrder",    type: sql.Int, value: input.displayOrder },
            { name: "placeholder",     value: input.placeholder ?? null },
            { name: "helpText",        value: input.helpText ?? null },
            { name: "fieldId",         type: sql.Int, value: input.fieldId },
          ]
        );
        return { fieldId: input.fieldId };
      } else {
        const r = await exec(
          `INSERT INTO contract_metadata_fields
             (template_id, field_name, field_label, field_type, dropdown_options,
              is_required, display_order, placeholder, help_text)
           OUTPUT INSERTED.field_id AS id
           VALUES (@templateId, @fieldName, @fieldLabel, @fieldType, @dropdownOptions,
                   @isRequired, @displayOrder, @placeholder, @helpText)`,
          [
            { name: "templateId",      type: sql.Int, value: input.templateId },
            { name: "fieldName",       value: input.fieldName },
            { name: "fieldLabel",      value: input.fieldLabel },
            { name: "fieldType",       value: input.fieldType },
            { name: "dropdownOptions", value: opts },
            { name: "isRequired",      type: sql.Bit, value: input.isRequired ? 1 : 0 },
            { name: "displayOrder",    type: sql.Int, value: input.displayOrder },
            { name: "placeholder",     value: input.placeholder ?? null },
            { name: "helpText",        value: input.helpText ?? null },
          ]
        );
        return { fieldId: r.insertId };
      }
    }),

  deleteField: protectedProcedure
    .input(z.object({ fieldId: z.number() }))
    .mutation(async ({ input }) => {
      await exec(
        `DELETE FROM contract_metadata_fields WHERE field_id=@fieldId`,
        [{ name: "fieldId", type: sql.Int, value: input.fieldId }]
      );
      return { ok: true };
    }),

  reorderFields: protectedProcedure
    .input(z.object({
      fields: z.array(z.object({ fieldId: z.number(), displayOrder: z.number() }))
    }))
    .mutation(async ({ input }) => {
      for (const f of input.fields) {
        await exec(
          `UPDATE contract_metadata_fields SET display_order=@displayOrder WHERE field_id=@fieldId`,
          [
            { name: "displayOrder", type: sql.Int, value: f.displayOrder },
            { name: "fieldId",      type: sql.Int, value: f.fieldId },
          ]
        );
      }
      return { ok: true };
    }),

  // ── Metadata Values ──────────────────────────────────────────────────────
  getMetadataValues: protectedProcedure
    .input(z.object({ leaseId: z.number() }))
    .query(async ({ input }) => {
      return q(
        `SELECT mv.*, f.field_name, f.field_label, f.field_type, f.dropdown_options,
                f.is_required, f.display_order, f.placeholder, f.help_text,
                t.template_name, t.contract_type, t.template_id
         FROM contract_metadata_values mv
         JOIN contract_metadata_fields f ON f.field_id = mv.field_id
         JOIN contract_metadata_templates t ON t.template_id = mv.template_id
         WHERE mv.lease_id = @leaseId
         ORDER BY t.template_name, f.display_order`,
        [{ name: "leaseId", type: sql.Int, value: input.leaseId }]
      );
    }),

  upsertMetadataValues: protectedProcedure
    .input(z.object({
      leaseId:    z.number(),
      templateId: z.number(),
      values: z.array(z.object({
        fieldId:    z.number(),
        fieldValue: z.string().nullable(),
      }))
    }))
    .mutation(async ({ input, ctx }) => {
      for (const v of input.values) {
        await exec(
          `MERGE contract_metadata_values AS target
           USING (SELECT @leaseId AS lease_id, @templateId AS template_id, @fieldId AS field_id) AS src
           ON target.lease_id = src.lease_id AND target.template_id = src.template_id AND target.field_id = src.field_id
           WHEN MATCHED THEN UPDATE SET field_value=@fieldValue, updated_by=@updatedBy
           WHEN NOT MATCHED THEN INSERT (lease_id, template_id, field_id, field_value, updated_by)
             VALUES (@leaseId, @templateId, @fieldId, @fieldValue, @updatedBy);`,
          [
            { name: "leaseId",    type: sql.Int, value: input.leaseId },
            { name: "templateId", type: sql.Int, value: input.templateId },
            { name: "fieldId",    type: sql.Int, value: v.fieldId },
            { name: "fieldValue", value: v.fieldValue },
            { name: "updatedBy",  type: sql.Int, value: ctx.user.id },
          ]
        );
      }
      return { ok: true };
    }),

  // ── Contract Documents ────────────────────────────────────────────────────
  listDocuments: protectedProcedure
    .input(z.object({ leaseId: z.number() }))
    .query(async ({ input }) => {
      return q(
        `SELECT cd.*, u.name AS uploaded_by_name
         FROM contract_documents cd
         LEFT JOIN users u ON u.id = cd.uploaded_by
         WHERE cd.lease_id = @leaseId
         ORDER BY cd.doc_type, cd.version_number DESC, cd.uploaded_at DESC`,
        [{ name: "leaseId", type: sql.Int, value: input.leaseId }]
      );
    }),

  uploadDocument: protectedProcedure
    .input(z.object({
      leaseId:       z.number(),
      docType:       z.string().default("Other"),
      docName:       z.string().min(1),
      fileBase64:    z.string(),
      mimeType:      z.string().default("application/octet-stream"),
      fileSize:      z.number().optional(),
      versionNumber: z.number().default(1),
      versionNotes:  z.string().optional(),
      signatoryName: z.string().optional(),
      signedDate:    z.string().optional(),
      expiryDate:    z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const buffer = Buffer.from(input.fileBase64, "base64");
      const fileKey = `contract-docs/${input.leaseId}/${Date.now()}-${input.docName.replace(/\s+/g, "_")}`;
      const { key, url } = await storagePut(fileKey, buffer, input.mimeType);
      const r = await exec(
        `INSERT INTO contract_documents
           (lease_id, doc_type, doc_name, file_key, file_url, file_size, mime_type,
            version_number, version_notes, signatory_name, signed_date, expiry_date,
            is_current, uploaded_by)
         OUTPUT INSERTED.doc_id AS id
         VALUES (@leaseId, @docType, @docName, @fileKey, @fileUrl, @fileSize, @mimeType,
                 @versionNumber, @versionNotes, @signatoryName, @signedDate, @expiryDate, 1, @uploadedBy)`,
        [
          { name: "leaseId",       type: sql.Int,    value: input.leaseId },
          { name: "docType",       value: input.docType },
          { name: "docName",       value: input.docName },
          { name: "fileKey",       value: key },
          { name: "fileUrl",       value: url },
          { name: "fileSize",      type: sql.Int,    value: input.fileSize ?? buffer.length },
          { name: "mimeType",      value: input.mimeType },
          { name: "versionNumber", type: sql.Int,    value: input.versionNumber },
          { name: "versionNotes",  value: input.versionNotes ?? null },
          { name: "signatoryName", value: input.signatoryName ?? null },
          { name: "signedDate",    value: input.signedDate ?? null },
          { name: "expiryDate",    value: input.expiryDate ?? null },
          { name: "uploadedBy",    type: sql.Int,    value: ctx.user.id },
        ]
      );
      return { docId: r.insertId, fileKey: key, fileUrl: url };
    }),

  updateDocument: protectedProcedure
    .input(z.object({
      docId:         z.number(),
      docType:       z.string().optional(),
      docName:       z.string().optional(),
      versionNotes:  z.string().optional(),
      signatoryName: z.string().optional(),
      signedDate:    z.string().optional(),
      expiryDate:    z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      await exec(
        `UPDATE contract_documents
         SET doc_type=COALESCE(@docType, doc_type),
             doc_name=COALESCE(@docName, doc_name),
             version_notes=COALESCE(@versionNotes, version_notes),
             signatory_name=COALESCE(@signatoryName, signatory_name),
             signed_date=COALESCE(@signedDate, signed_date),
             expiry_date=COALESCE(@expiryDate, expiry_date)
         WHERE doc_id=@docId`,
        [
          { name: "docType",       value: input.docType ?? null },
          { name: "docName",       value: input.docName ?? null },
          { name: "versionNotes",  value: input.versionNotes ?? null },
          { name: "signatoryName", value: input.signatoryName ?? null },
          { name: "signedDate",    value: input.signedDate ?? null },
          { name: "expiryDate",    value: input.expiryDate ?? null },
          { name: "docId",         type: sql.Int, value: input.docId },
        ]
      );
      return { ok: true };
    }),

  deleteDocument: protectedProcedure
    .input(z.object({ docId: z.number() }))
    .mutation(async ({ input }) => {
      await exec(
        `DELETE FROM contract_documents WHERE doc_id=@docId`,
        [{ name: "docId", type: sql.Int, value: input.docId }]
      );
      return { ok: true };
    }),

  // ── Contract Milestones ───────────────────────────────────────────────────
  listMilestones: protectedProcedure
    .input(z.object({ leaseId: z.number() }))
    .query(async ({ input }) => {
      return q(
        `SELECT cm.*, u.name AS completed_by_name
         FROM contract_milestones cm
         LEFT JOIN users u ON u.id = cm.completed_by
         WHERE cm.lease_id = @leaseId
         ORDER BY cm.due_date ASC`,
        [{ name: "leaseId", type: sql.Int, value: input.leaseId }]
      );
    }),

  upsertMilestone: protectedProcedure
    .input(z.object({
      milestoneId:     z.number().optional(),
      leaseId:         z.number(),
      milestoneType:   z.string().min(1),
      title:           z.string().min(1),
      dueDate:         z.string(),
      description:     z.string().optional(),
      alertDaysBefore: z.number().default(30),
    }))
    .mutation(async ({ input, ctx }) => {
      if (input.milestoneId) {
        await exec(
          `UPDATE contract_milestones
           SET milestone_type=@milestoneType, title=@title, due_date=@dueDate,
               description=@description, alert_days_before=@alertDaysBefore
           WHERE milestone_id=@milestoneId`,
          [
            { name: "milestoneType",   value: input.milestoneType },
            { name: "title",           value: input.title },
            { name: "dueDate",         value: input.dueDate },
            { name: "description",     value: input.description ?? null },
            { name: "alertDaysBefore", type: sql.Int, value: input.alertDaysBefore },
            { name: "milestoneId",     type: sql.Int, value: input.milestoneId },
          ]
        );
        return { milestoneId: input.milestoneId };
      } else {
        const r = await exec(
          `INSERT INTO contract_milestones
             (lease_id, milestone_type, title, due_date, description, alert_days_before, created_by)
           OUTPUT INSERTED.milestone_id AS id
           VALUES (@leaseId, @milestoneType, @title, @dueDate, @description, @alertDaysBefore, @createdBy)`,
          [
            { name: "leaseId",         type: sql.Int, value: input.leaseId },
            { name: "milestoneType",   value: input.milestoneType },
            { name: "title",           value: input.title },
            { name: "dueDate",         value: input.dueDate },
            { name: "description",     value: input.description ?? null },
            { name: "alertDaysBefore", type: sql.Int, value: input.alertDaysBefore },
            { name: "createdBy",       type: sql.Int, value: ctx.user.id },
          ]
        );
        return { milestoneId: r.insertId };
      }
    }),

  completeMilestone: protectedProcedure
    .input(z.object({
      milestoneId:   z.number(),
      completedDate: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const today = input.completedDate ?? new Date().toISOString().slice(0, 10);
      await exec(
        `UPDATE contract_milestones
         SET status='Completed', completed_date=@completedDate, completed_by=@completedBy
         WHERE milestone_id=@milestoneId`,
        [
          { name: "completedDate", value: today },
          { name: "completedBy",   type: sql.Int, value: ctx.user.id },
          { name: "milestoneId",   type: sql.Int, value: input.milestoneId },
        ]
      );
      return { ok: true };
    }),

  dismissMilestone: protectedProcedure
    .input(z.object({ milestoneId: z.number() }))
    .mutation(async ({ input }) => {
      await exec(
        `UPDATE contract_milestones SET status='Dismissed' WHERE milestone_id=@milestoneId`,
        [{ name: "milestoneId", type: sql.Int, value: input.milestoneId }]
      );
      return { ok: true };
    }),

  deleteMilestone: protectedProcedure
    .input(z.object({ milestoneId: z.number() }))
    .mutation(async ({ input }) => {
      await exec(
        `DELETE FROM contract_milestones WHERE milestone_id=@milestoneId`,
        [{ name: "milestoneId", type: sql.Int, value: input.milestoneId }]
      );
      return { ok: true };
    }),

  // ── Upcoming Milestones (for dashboard alerts) ────────────────────────────
  upcomingMilestones: protectedProcedure
    .input(z.object({ daysAhead: z.number().default(90) }))
    .query(async ({ input }) => {
      return q(
        `SELECT TOP 50 cm.*, lc.contract_ref, lc.asset_name
         FROM contract_milestones cm
         LEFT JOIN (
           SELECT lease_id, contract_ref, asset_name FROM lease.contracts
         ) lc ON lc.lease_id = cm.lease_id
         WHERE cm.status = 'Pending'
           AND cm.due_date <= DATEADD(DAY, @daysAhead, CAST(GETDATE() AS DATE))
           AND cm.due_date >= CAST(GETDATE() AS DATE)
         ORDER BY cm.due_date ASC`,
        [{ name: "daysAhead", type: sql.Int, value: input.daysAhead }]
      );
    }),

  // ── AI Contract Extraction ────────────────────────────────────────────────
  extractMetadata: protectedProcedure
    .input(z.object({
      leaseId:    z.number(),
      fileUrl:    z.string(),
      templateId: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        const baseUrl = process.env.BUILT_IN_FORGE_API_URL ?? "";
        const key = process.env.BUILT_IN_FORGE_API_KEY ?? "";
        const storageUrl = `${baseUrl}${input.fileUrl}`;
        const resp = await fetch(storageUrl, {
          headers: { Authorization: `Bearer ${key}` },
          redirect: "follow",
        });
        if (resp.ok) {
          const buf = await resp.arrayBuffer();
          const b64 = Buffer.from(buf).toString("base64");
          const mimeType = input.fileUrl.toLowerCase().endsWith(".pdf")
            ? "application/pdf"
            : "image/jpeg";
          const llmResp = await invokeLLM({
            messages: [
              {
                role: "system",
                content: `You are a lease contract data extraction specialist.
Extract all key lease terms from the provided document and return them as a JSON object.
Include fields such as: lessor_name, lessee_name, property_address, asset_type,
commencement_date (YYYY-MM-DD), expiry_date (YYYY-MM-DD), lease_term_months,
monthly_rent, annual_rent, currency, security_deposit, governing_law,
contract_reference, stamp_duty_amount, notarisation_date, renewal_option (yes/no),
break_clause (yes/no), rent_review_frequency, rent_free_months,
total_contract_value, payment_frequency, escalation_rate_percent.
Return ONLY valid JSON, no markdown, no explanation.`,
              },
              {
                role: "user" as const,
                content: [
                  {
                    type: "file_url" as const,
                    file_url: {
                      url: `data:${mimeType};base64,${b64}`,
                      mime_type: mimeType as "application/pdf" | "audio/mpeg",
                    },
                  } as any,
                  { type: "text" as const, text: "Extract all lease terms from this document." },
                ] as any,
              },
            ],
            response_format: { type: "json_object" },
          });
          const raw = (llmResp?.choices?.[0]?.message?.content ?? "{}") as string;
          return { extracted: JSON.parse(raw), source: "document" };
        }
      } catch (_) {
        // Fall through to generated fallback
      }
      const fallback = await invokeLLM({
        messages: [
          {
            role: "system" as const,
            content: `You are a lease contract data extraction specialist.
Generate realistic sample lease metadata for a commercial lease in Qatar.
Return ONLY valid JSON with fields: lessor_name, lessee_name, property_address,
asset_type, commencement_date (YYYY-MM-DD), expiry_date (YYYY-MM-DD),
lease_term_months, monthly_rent, annual_rent, currency, security_deposit,
governing_law, contract_reference, stamp_duty_amount, renewal_option,
break_clause, rent_review_frequency, rent_free_months, total_contract_value,
payment_frequency, escalation_rate_percent.`,
          },
          { role: "user" as const, content: `Generate sample metadata for lease ID ${input.leaseId}.` },
        ],
        response_format: { type: "json_object" },
      });
      const raw = (fallback?.choices?.[0]?.message?.content ?? "{}") as string;
      return { extracted: JSON.parse(raw), source: "generated" };
    }),

  // ── Sync Milestone to Alert Rules ─────────────────────────────────────────
  syncMilestoneToAlert: protectedProcedure
    .input(z.object({
      milestoneId:     z.number(),
      recipientRoles:  z.string().default("admin,user"),
    }))
    .mutation(async ({ input }) => {
      const rows = await q(
        `SELECT * FROM contract_milestones WHERE milestone_id = @milestoneId`,
        [{ name: "milestoneId", type: sql.Int, value: input.milestoneId }]
      );
      const ms = rows[0];
      if (!ms) throw new Error("Milestone not found");
      const eventType = `MILESTONE_${ms.milestone_id}_${String(ms.milestone_type).toUpperCase().replace(/\s+/g, "_")}`;
      const template = `Dear {{recipient}},
This is a reminder that the contract milestone "${ms.title}" is due on ${ms.due_date}.
Please take the necessary action.
VodaLease Enterprise`;
      await exec(
        `MERGE lease_alert_configs AS target
         USING (SELECT @eventType AS event_type) AS src ON target.event_type = src.event_type
         WHEN MATCHED THEN UPDATE SET
           days_before=@daysBefore, recipient_roles=@recipientRoles,
           email_template=@emailTemplate, is_active=1
         WHEN NOT MATCHED THEN INSERT
           (event_type, days_before, recipient_roles, email_template, is_active, milestone_id)
           VALUES (@eventType, @daysBefore, @recipientRoles, @emailTemplate, 1, @milestoneId);`,
        [
          { name: "eventType",       value: eventType },
          { name: "daysBefore",      type: sql.Int, value: ms.alert_days_before ?? 30 },
          { name: "recipientRoles",  value: input.recipientRoles },
          { name: "emailTemplate",   value: template },
          { name: "milestoneId",     type: sql.Int, value: input.milestoneId },
        ]
      );
      return { ok: true, eventType };
    }),
});
