import { db } from "@/db";
import {
  callAnalytics,
  type CallAnalyticsRow,
  type NewCallAnalyticsRow,
} from "@/db/schema";
import { eq, gte, desc } from "drizzle-orm";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export type WebhookPayload = Record<string, unknown>;

export interface HandleWebhookResult {
  ok: boolean;
  status: number;
  action: "created" | "updated" | "rejected";
  matchedBy: "sid" | "result_id" | "phone" | null;
  message: string;
  id?: number;
  receivedFields?: number;
  record?: CallAnalyticsRow;
}

/* ------------------------------------------------------------------ */
/* Payload key → column map (49+ CRM data points)                      */
/* ------------------------------------------------------------------ */

type ColumnKey = Exclude<keyof typeof callAnalytics.$inferInsert, "id" | "createdAt" | "updatedAt">;

const FIELD_MAP: Record<string, ColumnKey> = {
  sid: "sid",
  result_id: "resultId",
  contact_number: "contactNumber",
  email: "email",
  first_name: "firstName",
  last_name: "lastName",
  name: "name",
  gender: "gender",
  date_of_birth: "dateOfBirth",
  mobile_number: "mobileNumber",
  phone_number: "phoneNumber",
  additional_phone: "additionalPhone",
  additional_email: "additionalEmail",
  country_code: "countryCode",
  company_name: "companyName",
  website_url: "websiteUrl",
  industry: "industry",
  job_title: "jobTitle",
  department: "department",
  address_line1: "addressLine1",
  address_line2: "addressLine2",
  city: "city",
  state: "state",
  zip: "zip",
  country: "country",
  billing_address: "billingAddress",
  shipping_address: "shippingAddress",
  time_zone: "timeZone",
  language_preference: "languagePreference",
  lead_source: "leadSource",
  // contact_owner: "contactOwner",
  contact_type: "contactType",
  prefered_contact_method: "preferedContactMethod",
  communication_preference: "communicationPreference",
  last_contact_date: "lastContactDate",
  next_contact_date: "nextContactDate",
  pipeline_stage: "pipelineStage",
  lead_score: "leadScore",
  estimated_deal_value: "estimatedDealValue",
  campaign_source: "campaignSource",
  interests: "interests",
  consent_to_contact: "consentToContact",
  opt_out_status: "optOutStatus",
  linkedin_profile: "linkedinProfile",
  facebook_profile: "facebookProfile",
  twitter_handle: "twitterHandle",
  instagram_handle: "instagramHandle",
  call_outcomes: "callOutcomes",
  call_notes: "callNotes",
  call_transcription: "callTranscription",
  call_audio_file: "callAudioFile",
  notes: "notes",
  custom_fields: "customFields",
};

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

/** Keep only digits so "+91 98765-43210" and "919876543210" match. */
function normalizePhone(raw: unknown): string | null {
  if (typeof raw !== "string" && typeof raw !== "number") return null;
  const digits = String(raw).replace(/\D/g, "");
  return digits.length >= 6 ? digits : null;
}

/** Trim + coerce anything primitive-ish to a string; null when empty. */
function asText(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return null;
    }
  }
  const str = String(value).trim();
  return str.length > 0 ? str : null;
}

function asInt(value: unknown): number | null {
  const str = asText(value);
  if (!str) return null;
  const n = parseInt(str, 10);
  return Number.isFinite(n) ? n : null;
}

function asNumeric(value: unknown): string | null {
  const str = asText(value);
  if (!str) return null;
  const n = Number(str.replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? String(n) : null;
}

/**
 * Parse + sanitize an incoming webhook payload into typed column values.
 * Empty values are dropped so a partial update never wipes existing data.
 */
export function parsePayload(payload: WebhookPayload) {
  const columns: Record<string, string | number> = {};

  for (const [key, value] of Object.entries(payload)) {
    const column = FIELD_MAP[key];
    if (!column) continue;

    if (column === "leadScore") {
      const n = asInt(value);
      if (n !== null) columns[column] = n;
      continue;
    }
    if (column === "estimatedDealValue") {
      const n = asNumeric(value);
      if (n !== null) columns[column] = n;
      continue;
    }

    const str = asText(value);
    if (str !== null) columns[column] = str;
  }

  // Derived helpers
  if (!columns.name && (columns.firstName || columns.lastName)) {
    columns.name = [columns.firstName, columns.lastName]
      .filter(Boolean)
      .join(" ");
  }
  if (
    !columns.contactNumber &&
    columns.countryCode &&
    (columns.phoneNumber || columns.mobileNumber)
  ) {
    columns.contactNumber = `${columns.countryCode}${columns.phoneNumber ?? columns.mobileNumber}`;
  }

  const primaryPhone =
    normalizePhone(columns.contactNumber) ??
    normalizePhone(columns.mobileNumber) ??
    normalizePhone(columns.phoneNumber);

  return { columns, primaryPhone };
}

/** Validate that the payload carries at least one usable identity marker. */
export function validatePayload(payload: WebhookPayload): string | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return "Request body must be a JSON object.";
  }
  const idCandidates = [
    payload.sid,
    payload.result_id,
    payload.contact_number,
    payload.phone_number,
    payload.mobile_number,
    payload.email,
    payload.first_name,
    payload.name,
  ];
  const hasIdentity = idCandidates.some((v) => asText(v) !== null);
  if (!hasIdentity) {
    return "Payload rejected: provide at least one of sid, result_id, contact_number / phone_number, email or first_name.";
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* Smart upsert filter: sid → result_id → phone (60s dedupe window)    */
/* ------------------------------------------------------------------ */

type DbExecutor = Pick<
  typeof db,
  "select" | "insert" | "update" | "delete"
>;

/**
 * Priority order — mirrors the reference ghl.controller:
 *  1. sid        → same call session, always dedupes (any age)
 *  2. result_id  → same provider result, always dedupes (any age)
 *  3. phone      → contact_number match ONLY inside the dedupe window
 *                  (default 60s) so repeated webhook bursts for the same
 *                  call merge, but a genuinely new call from the same
 *                  person later becomes a fresh record.
 *  4. otherwise  → insert a new row
 */
async function findMatch(
  exec: DbExecutor,
  sid: string | null,
  resultId: string | null,
  phone: string | null,
  dedupeWindowSeconds: number
): Promise<{ row: CallAnalyticsRow; matchedBy: "sid" | "result_id" | "phone" } | null> {
  if (sid) {
    const rows = await exec
      .select()
      .from(callAnalytics)
      .where(eq(callAnalytics.sid, sid))
      .limit(1);
    if (rows[0]) return { row: rows[0], matchedBy: "sid" };
  }

  if (resultId) {
    const rows = await exec
      .select()
      .from(callAnalytics)
      .where(eq(callAnalytics.resultId, resultId))
      .limit(1);
    if (rows[0]) return { row: rows[0], matchedBy: "result_id" };
  }

  if (phone && dedupeWindowSeconds > 0) {
    const cutoff = new Date(Date.now() - dedupeWindowSeconds * 1000);
    // Compare on the digit-only tail so country-code formatting differences match.
    const tail = phone.slice(-10);
    const rows = await exec
      .select()
      .from(callAnalytics)
      .where(gte(callAnalytics.updatedAt, cutoff))
      .orderBy(desc(callAnalytics.updatedAt))
      .limit(100);
    const hit = rows.find((r) => {
      const candidates = [r.contactNumber, r.mobileNumber, r.phoneNumber];
      return candidates.some((c) => {
        const digits = c ? c.replace(/\D/g, "") : "";
        return digits.length >= 6 && (digits.endsWith(tail) || tail.endsWith(digits));
      });
    });
    if (hit) return { row: hit, matchedBy: "phone" };
  }

  return null;
}

/* ------------------------------------------------------------------ */
/* Main handler — port of handleCallAnalyticsWebhook (ghl.controller)  */
/* ------------------------------------------------------------------ */

export async function handleCallAnalyticsWebhook(
  payload: WebhookPayload,
  source = "webhook"
): Promise<HandleWebhookResult> {
  const rawPayload = payload || {};
  // Extract nested data if wrapped (e.g. { success: true, data: {...} } or { event: "...", data: {...} })
  const data = (rawPayload.data && typeof rawPayload.data === "object" && !Array.isArray(rawPayload.data))
    ? (rawPayload.data as WebhookPayload)
    : rawPayload;

  // 1. Payload parsing & validation
  const validationError = validatePayload(data);
  if (validationError) {
    return {
      ok: false,
      status: 400,
      action: "rejected",
      matchedBy: null,
      message: validationError,
      receivedFields: Object.keys(data ?? {}).length,
    };
  }

  const { columns, primaryPhone } = parsePayload(data);
  const sid = columns.sid !== undefined ? String(columns.sid) : null;
  const resultId = columns.resultId !== undefined ? String(columns.resultId) : null;

  // Dedupe window for phone matches (env-configurable, default 60s).
  const envWindow = parseInt(process.env.WEBHOOK_DEDUPE_WINDOW_SECONDS ?? "", 10);
  const dedupeWindowSeconds = Number.isFinite(envWindow) && envWindow >= 0 ? envWindow : 60;

  // 2. Smart upsert filter — sid / result_id / phone (60s window) — and
  // 3. Safe storage, all inside ONE transaction so match + write is atomic
  //    (concurrent duplicate webhooks for the same call can never both insert).
  return db.transaction(async (tx) => {
    const exec = tx as unknown as DbExecutor;
    const match = await findMatch(
      exec,
      sid,
      resultId,
      primaryPhone,
      dedupeWindowSeconds
    );

    if (match) {
      // ── UPDATE: merge non-empty incoming values into the existing row
      const updates: Record<string, unknown> = {
        updatedAt: new Date(),
        matchedBy: match.matchedBy,
        webhookSource: source,
        rawPayload: payload,
        updateCount: (match.row.updateCount ?? 1) + 1,
      };
      for (const [col, val] of Object.entries(columns)) {
        if (val !== null && val !== undefined && val !== "") updates[col] = val;
      }

      const updated = await exec
        .update(callAnalytics)
        .set(updates)
        .where(eq(callAnalytics.id, match.row.id))
        .returning();

      const windowNote =
        match.matchedBy === "phone" ? ` (within ${dedupeWindowSeconds}s dedupe window)` : "";

      return {
        ok: true,
        status: 200,
        action: "updated" as const,
        matchedBy: match.matchedBy,
        message: `Record #${match.row.id} updated via ${match.matchedBy} match${windowNote} (${Object.keys(columns).length} fields merged).`,
        id: match.row.id,
        receivedFields: Object.keys(columns).length,
        record: updated[0],
      };
    }

    // ── INSERT: brand-new record (priority fell through to a fresh row)
    const insertValues: NewCallAnalyticsRow = {
      ...(columns as Partial<NewCallAnalyticsRow>),
      matchedBy: null,
      webhookSource: source,
      rawPayload: payload,
    };
    const inserted = await exec
      .insert(callAnalytics)
      .values(insertValues)
      .returning();

    return {
      ok: true,
      status: 201,
      action: "created" as const,
      matchedBy: null,
      message: `New CallAnalytics record #${inserted[0].id} created with ${Object.keys(columns).length} mapped fields.`,
      id: inserted[0].id,
      receivedFields: Object.keys(columns).length,
      record: inserted[0],
    };
  });
}
