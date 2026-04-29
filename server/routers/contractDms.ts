/**
 * Contract DMS Router
 * Handles: metadata templates, metadata fields, contract documents,
 *          contract milestones, metadata values, file upload/delete
 */
import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getPool } from "../db-sqlserver";
import { storagePut } from "../storage";

// ─── Helpers ────────────────────────────────────────────────────────────────

async function q(sql: string, params: unknown[] = []) {
  const pool = await getPool();
  const [rows] = await (pool as any).execute(sql, params);
  return rows as any[];
}

async function exec(sql: string, params: unknown[] = []) {
  const pool = await getPool();
  const [result] = await (pool as any).execute(sql, params);
  return result as any;
}

// ─── Router ─────────────────────────────────────────────────────────────────

export const contractDmsRouter = router({

  // ── Metadata Templates ──────────────────────────────────────────────────

  listTemplates: protectedProcedure.query(async () => {
    const rows = await q(`
      SELECT t.*,
        (SELECT COUNT(*) FROM contract_metadata_fields f WHERE f.template_id = t.template_id) AS field_count
      FROM contract_metadata_templates t
      ORDER BY t.contract_type, t.template_name
    `);
    return rows;
  }),

  getTemplate: protectedProcedure
    .input(z.object({ templateId: z.number() }))
    .query(async ({ input }) => {
      const [tmpl] = await q(
        `SELECT * FROM contract_metadata_templates WHERE template_id = ?`,
        [input.templateId]
      );
      if (!tmpl) throw new Error("Template not found");
      const fields = await q(
        `SELECT * FROM contract_metadata_fields WHERE template_id = ? ORDER BY display_order, field_id`,
        [input.templateId]
      );
      return { ...tmpl, fields };
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
         VALUES (?, ?, ?, ?)`,
        [input.templateName, input.contractType, input.description ?? null, ctx.user.id]
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
         SET template_name=?, contract_type=?, description=?, is_active=?
         WHERE template_id=?`,
        [input.templateName, input.contractType, input.description ?? null,
         input.isActive !== false ? 1 : 0, input.templateId]
      );
      return { ok: true };
    }),

  deleteTemplate: protectedProcedure
    .input(z.object({ templateId: z.number() }))
    .mutation(async ({ input }) => {
      await exec(`DELETE FROM contract_metadata_templates WHERE template_id=?`, [input.templateId]);
      return { ok: true };
    }),

  // ── Metadata Fields ─────────────────────────────────────────────────────

  upsertField: protectedProcedure
    .input(z.object({
      fieldId:         z.number().optional(),
      templateId:      z.number(),
      fieldName:       z.string().min(1),
      fieldLabel:      z.string().min(1),
      fieldType:       z.enum(["text","number","currency","date","boolean","dropdown","textarea"]),
      dropdownOptions: z.array(z.string()).optional(),
      isRequired:      z.boolean().default(false),
      displayOrder:    z.number().default(0),
      placeholder:     z.string().optional(),
      helpText:        z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const opts = input.dropdownOptions ? JSON.stringify(input.dropdownOptions) : null;
      if (input.fieldId) {
        await exec(
          `UPDATE contract_metadata_fields
           SET field_name=?, field_label=?, field_type=?, dropdown_options=?,
               is_required=?, display_order=?, placeholder=?, help_text=?
           WHERE field_id=?`,
          [input.fieldName, input.fieldLabel, input.fieldType, opts,
           input.isRequired ? 1 : 0, input.displayOrder,
           input.placeholder ?? null, input.helpText ?? null, input.fieldId]
        );
        return { fieldId: input.fieldId };
      } else {
        const r = await exec(
          `INSERT INTO contract_metadata_fields
             (template_id, field_name, field_label, field_type, dropdown_options,
              is_required, display_order, placeholder, help_text)
           VALUES (?,?,?,?,?,?,?,?,?)`,
          [input.templateId, input.fieldName, input.fieldLabel, input.fieldType, opts,
           input.isRequired ? 1 : 0, input.displayOrder,
           input.placeholder ?? null, input.helpText ?? null]
        );
        return { fieldId: r.insertId };
      }
    }),

  deleteField: protectedProcedure
    .input(z.object({ fieldId: z.number() }))
    .mutation(async ({ input }) => {
      await exec(`DELETE FROM contract_metadata_fields WHERE field_id=?`, [input.fieldId]);
      return { ok: true };
    }),

  reorderFields: protectedProcedure
    .input(z.object({
      fields: z.array(z.object({ fieldId: z.number(), displayOrder: z.number() }))
    }))
    .mutation(async ({ input }) => {
      for (const f of input.fields) {
        await exec(`UPDATE contract_metadata_fields SET display_order=? WHERE field_id=?`,
          [f.displayOrder, f.fieldId]);
      }
      return { ok: true };
    }),

  // ── Metadata Values ─────────────────────────────────────────────────────

  getMetadataValues: protectedProcedure
    .input(z.object({ leaseId: z.number() }))
    .query(async ({ input }) => {
      const rows = await q(
        `SELECT mv.*, f.field_name, f.field_label, f.field_type, f.dropdown_options,
                f.is_required, f.display_order, f.placeholder, f.help_text,
                t.template_name, t.contract_type, t.template_id
         FROM contract_metadata_values mv
         JOIN contract_metadata_fields f ON f.field_id = mv.field_id
         JOIN contract_metadata_templates t ON t.template_id = mv.template_id
         WHERE mv.lease_id = ?
         ORDER BY t.template_name, f.display_order`,
        [input.leaseId]
      );
      return rows;
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
          `INSERT INTO contract_metadata_values (lease_id, template_id, field_id, field_value, updated_by)
           VALUES (?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE field_value=VALUES(field_value), updated_by=VALUES(updated_by)`,
          [input.leaseId, input.templateId, v.fieldId, v.fieldValue, ctx.user.id]
        );
      }
      return { ok: true };
    }),

  // ── Contract Documents ───────────────────────────────────────────────────

  listDocuments: protectedProcedure
    .input(z.object({ leaseId: z.number() }))
    .query(async ({ input }) => {
      const rows = await q(
        `SELECT cd.*, u.name AS uploaded_by_name
         FROM contract_documents cd
         LEFT JOIN users u ON u.id = cd.uploaded_by
         WHERE cd.lease_id = ?
         ORDER BY cd.doc_type, cd.version_number DESC, cd.uploaded_at DESC`,
        [input.leaseId]
      );
      return rows;
    }),

  uploadDocument: protectedProcedure
    .input(z.object({
      leaseId:       z.number(),
      docType:       z.string().default("Other"),
      docName:       z.string().min(1),
      fileBase64:    z.string(),          // base64 encoded file content
      mimeType:      z.string().default("application/octet-stream"),
      fileSize:      z.number().optional(),
      versionNumber: z.number().default(1),
      versionNotes:  z.string().optional(),
      signatoryName: z.string().optional(),
      signedDate:    z.string().optional(),
      expiryDate:    z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Decode base64 and upload to S3
      const buffer = Buffer.from(input.fileBase64, "base64");
      const fileKey = `contract-docs/${input.leaseId}/${Date.now()}-${input.docName.replace(/\s+/g, "_")}`;
      const { key, url } = await storagePut(fileKey, buffer, input.mimeType);

      const r = await exec(
        `INSERT INTO contract_documents
           (lease_id, doc_type, doc_name, file_key, file_url, file_size, mime_type,
            version_number, version_notes, signatory_name, signed_date, expiry_date,
            is_current, uploaded_by)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,1,?)`,
        [input.leaseId, input.docType, input.docName, key, url,
         input.fileSize ?? buffer.length, input.mimeType,
         input.versionNumber, input.versionNotes ?? null,
         input.signatoryName ?? null,
         input.signedDate ?? null,
         input.expiryDate ?? null,
         ctx.user.id]
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
         SET doc_type=COALESCE(?,doc_type), doc_name=COALESCE(?,doc_name),
             version_notes=COALESCE(?,version_notes),
             signatory_name=COALESCE(?,signatory_name),
             signed_date=COALESCE(?,signed_date),
             expiry_date=COALESCE(?,expiry_date)
         WHERE doc_id=?`,
        [input.docType ?? null, input.docName ?? null, input.versionNotes ?? null,
         input.signatoryName ?? null, input.signedDate ?? null,
         input.expiryDate ?? null, input.docId]
      );
      return { ok: true };
    }),

  deleteDocument: protectedProcedure
    .input(z.object({ docId: z.number() }))
    .mutation(async ({ input }) => {
      await exec(`DELETE FROM contract_documents WHERE doc_id=?`, [input.docId]);
      return { ok: true };
    }),

  // ── Contract Milestones ──────────────────────────────────────────────────

  listMilestones: protectedProcedure
    .input(z.object({ leaseId: z.number() }))
    .query(async ({ input }) => {
      const rows = await q(
        `SELECT cm.*, u.name AS completed_by_name
         FROM contract_milestones cm
         LEFT JOIN users u ON u.id = cm.completed_by
         WHERE cm.lease_id = ?
         ORDER BY cm.due_date ASC`,
        [input.leaseId]
      );
      return rows;
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
           SET milestone_type=?, title=?, due_date=?, description=?, alert_days_before=?
           WHERE milestone_id=?`,
          [input.milestoneType, input.title, input.dueDate,
           input.description ?? null, input.alertDaysBefore, input.milestoneId]
        );
        return { milestoneId: input.milestoneId };
      } else {
        const r = await exec(
          `INSERT INTO contract_milestones
             (lease_id, milestone_type, title, due_date, description, alert_days_before, created_by)
           VALUES (?,?,?,?,?,?,?)`,
          [input.leaseId, input.milestoneType, input.title, input.dueDate,
           input.description ?? null, input.alertDaysBefore, ctx.user.id]
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
         SET status='Completed', completed_date=?, completed_by=?
         WHERE milestone_id=?`,
        [today, ctx.user.id, input.milestoneId]
      );
      return { ok: true };
    }),

  dismissMilestone: protectedProcedure
    .input(z.object({ milestoneId: z.number() }))
    .mutation(async ({ input }) => {
      await exec(
        `UPDATE contract_milestones SET status='Dismissed' WHERE milestone_id=?`,
        [input.milestoneId]
      );
      return { ok: true };
    }),

  deleteMilestone: protectedProcedure
    .input(z.object({ milestoneId: z.number() }))
    .mutation(async ({ input }) => {
      await exec(`DELETE FROM contract_milestones WHERE milestone_id=?`, [input.milestoneId]);
      return { ok: true };
    }),

  // ── Upcoming Milestones (for dashboard alerts) ───────────────────────────

  upcomingMilestones: protectedProcedure
    .input(z.object({ daysAhead: z.number().default(90) }))
    .query(async ({ input }) => {
      const rows = await q(
        `SELECT cm.*, lc.contract_ref, lc.asset_name
         FROM contract_milestones cm
         LEFT JOIN (
           SELECT lease_id, contract_ref, asset_name FROM lease.contracts
         ) lc ON lc.lease_id = cm.lease_id
         WHERE cm.status = 'Pending'
           AND cm.due_date <= DATE_ADD(CURDATE(), INTERVAL ? DAY)
           AND cm.due_date >= CURDATE()
         ORDER BY cm.due_date ASC
         LIMIT 50`,
        [input.daysAhead]
      );
      return rows;
    }),
});
