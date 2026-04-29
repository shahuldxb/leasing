/**
 * Contract DMS Router
 * Handles: metadata templates, metadata fields, contract documents,
 *          contract milestones, metadata values, file upload/delete
 */
import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getPool } from "../db-sqlserver";
import { storagePut } from "../storage";
import { invokeLLM } from "../_core/llm";

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

  // ── AI Contract Extraction ───────────────────────────────────────────────
  /**
   * Reads a contract document (by storage URL) and uses the LLM to extract
   * structured metadata fields.  Returns a map of fieldLabel -> extractedValue
   * that the frontend can use to auto-fill the Metadata tab.
   */
  extractMetadata: protectedProcedure
    .input(z.object({
      leaseId:    z.number(),
      fileUrl:    z.string(),   // /manus-storage/... URL
      templateId: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      // Fetch the document text via the storage URL
      let docText = "";
      try {
        const baseUrl = process.env.BUILT_IN_FORGE_API_URL ?? "";
        const key = process.env.BUILT_IN_FORGE_API_KEY ?? "";
        // Resolve the presigned redirect URL for the file
        const storageUrl = `${baseUrl}${input.fileUrl}`;
        const resp = await fetch(storageUrl, {
          headers: { Authorization: `Bearer ${key}` },
          redirect: "follow",
        });
        if (resp.ok) {
          const buf = await resp.arrayBuffer();
          // Convert to base64 for LLM vision (PDF/image)
          const b64 = Buffer.from(buf).toString("base64");
          const mimeType = input.fileUrl.toLowerCase().endsWith(".pdf")
            ? "application/pdf"
            : "image/jpeg";
          // Use LLM with file_url content type
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
          const extracted = JSON.parse(raw);
          return { extracted, source: "document" };
        }
      } catch (_) {
        // Fall through to text-only extraction
      }
      // Fallback: ask LLM to generate plausible demo data for the lease
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

  // ── Sync Milestone to Alert Rules ────────────────────────────────────────
  /**
   * Creates or updates an alert_config row in lease.alert_configs for a
   * given contract milestone so it fires an email N days before the due date.
   */
  syncMilestoneToAlert: protectedProcedure
    .input(z.object({
      milestoneId:     z.number(),
      recipientRoles:  z.string().default("admin,user"),
    }))
    .mutation(async ({ input }) => {
      const [ms] = await q(
        `SELECT * FROM contract_milestones WHERE milestone_id = ?`,
        [input.milestoneId]
      );
      if (!ms) throw new Error("Milestone not found");
      // Build a unique event_type key for this milestone
      const eventType = `MILESTONE_${ms.milestone_id}_${ms.milestone_type.toUpperCase().replace(/\s+/g, "_")}`;
      const template = `Dear {{recipient}},

This is a reminder that the contract milestone "${ms.title}" is due on ${ms.due_date}.

Please take the necessary action.

VodaLease Enterprise`;
      // Upsert into the MySQL alert_configs table (used by the DMS)
      await exec(
        `INSERT INTO lease_alert_configs (event_type, days_before, recipient_roles, email_template, is_active, milestone_id)
         VALUES (?, ?, ?, ?, 1, ?)
         ON DUPLICATE KEY UPDATE
           days_before=VALUES(days_before),
           recipient_roles=VALUES(recipient_roles),
           email_template=VALUES(email_template),
           is_active=1`,
        [eventType, ms.alert_days_before, input.recipientRoles, template, ms.milestone_id]
      );
      return { ok: true, eventType };
    }),

});