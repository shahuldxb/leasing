# VodaLease Enterprise — Design Decisions & Future Requirements

This file records architectural decisions and future requirements communicated by the product owner.
Any future development session MUST read this file before making changes.

---

## 1. GL Codes → Business Rules Table (Recorded: 2026-05-03)

**Decision:** In future, ALL General Ledger (GL) codes will be stored in the `business_rules` table (or a related rules table). The Business Rules Engine will become the **single source of truth** for GL account codes used across the entire application.

**Scope:** This applies to:
- Journal entry posting (JV lines)
- CPI escalation entries
- Lease modifications
- Lease terminations
- Lease renewals
- Sub-lease entries
- Impairment entries
- Any other accounting transaction

**Implementation guidance:**
- Store GL codes as rules with category `GL_CODE` or add a dedicated `gl_code` column to the `business_rules` table
- Each screen's business rules should define which GL accounts are debited/credited
- The AI generation (Alt+4) should include GL code assignments in the `journalEntryPattern` section
- When posting journals, the system should look up GL codes from the rules engine rather than hardcoding them

**Current state:** GL codes are currently seeded in the Chart of Accounts (`coa` schema) and referenced directly in posting logic. Migration to rules-based GL lookup is a future enhancement.

---
