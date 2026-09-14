/**
 * Versions of the documents a member agrees to (guide §3 `termsVersion`, §14.2).
 *
 * The version is the document's "last updated" date. The terms and privacy
 * pages render their date from here, and every consent record stores the
 * version it agreed to, so the two can never drift apart. Changing a document
 * means changing its entry here; existing consents keep the version they were
 * given against.
 */
export const legalDocuments = {
  terms: { version: "2026-08-14", updated: "14 August 2026" },
  privacy: { version: "2026-08-14", updated: "14 August 2026" },
} as const;
