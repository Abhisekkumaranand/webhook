import {
  pgTable,
  serial,
  text,
  integer,
  numeric,
  jsonb,
  timestamp,
} from "drizzle-orm/pg-core";

/**
 * CallAnalytics model — mirrors the MongoDB "CallAnalytics" document from the
 * MERN reference, but persisted in PostgreSQL. Stores every CRM/contact data
 * point transmitted by external webhook sources (49+ parameters) plus the
 * ingestion metadata used by the smart-upsert filter (sid / result_id / phone).
 */
export const callAnalytics = pgTable("call_analytics", {
  id: serial("id").primaryKey(),

  // ── Smart-upsert identity keys ──────────────────────────────
  sid: text("sid"),
  resultId: text("result_id"),

  // ── Personal details ────────────────────────────────────────
  contactNumber: text("contact_number"),
  email: text("email"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  name: text("name"),
  gender: text("gender"),
  dateOfBirth: text("date_of_birth"),
  mobileNumber: text("mobile_number"),
  phoneNumber: text("phone_number"),
  additionalPhone: text("additional_phone"),
  additionalEmail: text("additional_email"),
  countryCode: text("country_code"),

  // ── Company details ─────────────────────────────────────────
  companyName: text("company_name"),
  websiteUrl: text("website_url"),
  industry: text("industry"),
  jobTitle: text("job_title"),
  department: text("department"),

  // ── Address / location details ──────────────────────────────
  addressLine1: text("address_line1"),
  addressLine2: text("address_line2"),
  city: text("city"),
  state: text("state"),
  zip: text("zip"),
  country: text("country"),
  billingAddress: text("billing_address"),
  shippingAddress: text("shipping_address"),
  timeZone: text("time_zone"),
  languagePreference: text("language_preference"),

  // ── Lead & CRM details ──────────────────────────────────────
  leadSource: text("lead_source"),
  // contactOwner: text("contact_owner"),
  contactType: text("contact_type"),
  preferedContactMethod: text("prefered_contact_method"),
  communicationPreference: text("communication_preference"),
  lastContactDate: text("last_contact_date"),
  nextContactDate: text("next_contact_date"),
  pipelineStage: text("pipeline_stage"),
  leadScore: integer("lead_score"),
  estimatedDealValue: numeric("estimated_deal_value"),
  campaignSource: text("campaign_source"),
  interests: text("interests"),
  consentToContact: text("consent_to_contact"),
  optOutStatus: text("opt_out_status"),

  // ── Social profiles ─────────────────────────────────────────
  linkedinProfile: text("linkedin_profile"),
  facebookProfile: text("facebook_profile"),
  twitterHandle: text("twitter_handle"),
  instagramHandle: text("instagram_handle"),

  // ── Call & notes details ────────────────────────────────────
  callOutcomes: text("call_outcomes"),
  callNotes: text("call_notes"),
  callTranscription: text("call_transcription"),
  callAudioFile: text("call_audio_file"),
  notes: text("notes"),
  customFields: text("custom_fields"),

  // ── Ingestion metadata ──────────────────────────────────────
  rawPayload: jsonb("raw_payload").$type<Record<string, unknown>>(),
  matchedBy: text("matched_by"),
  webhookSource: text("webhook_source"),
  updateCount: integer("update_count").default(1).notNull(),

  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type CallAnalyticsRow = typeof callAnalytics.$inferSelect;
export type NewCallAnalyticsRow = typeof callAnalytics.$inferInsert;
