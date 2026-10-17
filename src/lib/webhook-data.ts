/**
 * Shared constants + payload builder for the Webhook Transmitter.
 * Field set mirrors the 49-parameter CRM payload from the reference form,
 * plus sid / result_id identity keys used by the smart-upsert filter.
 */

export const COUNTRY_CODES = [
  { code: "+91", country: "India · +91" },
  { code: "+1", country: "USA/Canada · +1" },
  { code: "+44", country: "UK · +44" },
  { code: "+971", country: "UAE · +971" },
  { code: "+61", country: "Australia · +61" },
  { code: "+49", country: "Germany · +49" },
  { code: "+65", country: "Singapore · +65" },
  { code: "+966", country: "Saudi Arabia · +966" },
];

export interface WebhookFormData {
  // Personal
  first_name: string;
  last_name: string;
  email: string;
  additional_email: string;
  countryCode: string;
  phone_number: string;
  mobile_number: string;
  additional_phone: string;
  gender: string;
  date_of_birth: string;

  // Company
  company_name: string;
  website_url: string;
  industry: string;
  job_title: string;
  department: string;

  // Address
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  billing_address: string;
  shipping_address: string;
  time_zone: string;
  language_preference: string;

  // Lead & CRM
  lead_source: string;
  contact_owner: string;
  contact_type: string;
  prefered_contact_method: string;
  communication_preference: string;
  last_contact_date: string;
  next_contact_date: string;
  pipeline_stage: string;
  lead_score: string;
  estimated_deal_value: string;
  campaign_source: string;
  interests: string;
  consent_to_contact: string;
  opt_out_status: string;

  // Social
  linkedin_profile: string;
  facebook_profile: string;
  twitter_handle: string;
  instagram_handle: string;

  // Call & notes
  sid: string;
  result_id: string;
  call_outcomes: string;
  call_notes: string;
  call_transcription: string;
  call_audio_file: string;
  notes: string;
  custom_fields: string;
}

export const INITIAL_FORM_STATE: WebhookFormData = {
  first_name: "",
  last_name: "",
  email: "",
  additional_email: "",
  countryCode: "+91",
  phone_number: "",
  mobile_number: "",
  additional_phone: "",
  gender: "",
  date_of_birth: "",

  company_name: "",
  website_url: "",
  industry: "",
  job_title: "",
  department: "",

  address_line1: "",
  address_line2: "",
  city: "",
  state: "",
  zip: "",
  country: "",
  billing_address: "",
  shipping_address: "",
  time_zone: "Asia/Kolkata",
  language_preference: "English",

  lead_source: "",
  contact_owner: "",
  contact_type: "",
  prefered_contact_method: "Email",
  communication_preference: "Email & Phone",
  last_contact_date: "",
  next_contact_date: "",
  pipeline_stage: "New",
  lead_score: "",
  estimated_deal_value: "",
  campaign_source: "",
  interests: "",
  consent_to_contact: "Yes",
  opt_out_status: "No",

  linkedin_profile: "",
  facebook_profile: "",
  twitter_handle: "",
  instagram_handle: "",

  sid: "",
  result_id: "",
  call_outcomes: "",
  call_notes: "",
  call_transcription: "",
  call_audio_file: "",
  notes: "",
  custom_fields: "",
};

export const SAMPLE_TEST_DATA: WebhookFormData = {
  first_name: "Rahul",
  last_name: "Sharma",
  email: "rahul.sharma@example.com",
  additional_email: "rahul.work@example.com",
  countryCode: "+91",
  phone_number: "9876543210",
  mobile_number: "9876543210",
  additional_phone: "9123456789",
  gender: "Male",
  date_of_birth: "1992-08-15",

  company_name: "Tech Solutions Pvt Ltd",
  website_url: "https://example.com",
  industry: "Information Technology",
  job_title: "Product Manager",
  department: "Product Engineering",

  address_line1: "123 Business Hub, MG Road",
  address_line2: "Suite 402",
  city: "Bengaluru",
  state: "Karnataka",
  zip: "560001",
  country: "India",
  billing_address: "123 Business Hub, MG Road, Bengaluru, Karnataka, 560001",
  shipping_address: "123 Business Hub, MG Road, Bengaluru, Karnataka, 560001",
  time_zone: "Asia/Kolkata (GMT+5:30)",
  language_preference: "English",

  lead_source: "Website Form",
  contact_owner: "Sales Admin",
  contact_type: "Lead",
  prefered_contact_method: "Phone",
  communication_preference: "WhatsApp & Email",
  last_contact_date: new Date().toISOString().split("T")[0],
  next_contact_date: new Date(Date.now() + 86400000 * 3)
    .toISOString()
    .split("T")[0],
  pipeline_stage: "Qualified",
  lead_score: "85",
  estimated_deal_value: "50000",
  campaign_source: "Google Ad Campaign 2026",
  interests: "Webhooks, API Integration, CRM Sync",
  consent_to_contact: "Yes",
  opt_out_status: "No",

  linkedin_profile: "https://linkedin.com/in/rahulsharma",
  facebook_profile: "https://facebook.com/rahulsharma",
  twitter_handle: "@rahul_tech",
  instagram_handle: "@rahul.sharma",

  sid: "sess_rahul_88214",
  result_id: "res_call_55291",
  call_outcomes: "Connected - Interested in demo",
  call_notes:
    "Client expressed interest in real-time webhook automation for CRM sync.",
  call_transcription:
    "Agent: Hello Rahul, this is Ananya from HookStream sales. Client: Hi, I wanted to inquire about the webhook API integration for our CRM. Agent: Great choice. Our webhook layer supports smart upserts so duplicate contacts never pile up. Client: That is exactly what we need. Can we get a demo this week? Agent: Absolutely, I will schedule a session for Thursday and share the invite on your email. Client: Perfect, looking forward to it.",
  call_audio_file: "https://storage.example.com/audio/call_10293.mp3",
  notes: "High priority prospect looking for immediate deployment.",
  custom_fields: JSON.stringify({ priority: "High", tier: "Enterprise" }, null, 2),
};

/** Compose the final JSON payload posted to the webhook endpoint. */
export function buildPayload(formData: WebhookFormData) {
  const contact_number = formData.countryCode
    ? `${formData.countryCode}${formData.phone_number}`
    : formData.phone_number;

  return {
    sid: formData.sid || undefined,
    result_id: formData.result_id || undefined,
    contact_number,
    email: formData.email.trim(),
    first_name: formData.first_name,
    last_name: formData.last_name,
    mobile_number: formData.mobile_number,
    phone_number: formData.phone_number,
    additional_phone: formData.additional_phone,
    additional_email: formData.additional_email,
    company_name: formData.company_name,
    website_url: formData.website_url,
    industry: formData.industry,
    job_title: formData.job_title,
    department: formData.department,
    address_line1: formData.address_line1,
    address_line2: formData.address_line2,
    city: formData.city,
    state: formData.state,
    zip: formData.zip,
    country: formData.country,
    date_of_birth: formData.date_of_birth,
    lead_source: formData.lead_source,
    contact_owner: formData.contact_owner,
    contact_type: formData.contact_type,
    prefered_contact_method: formData.prefered_contact_method,
    linkedin_profile: formData.linkedin_profile,
    facebook_profile: formData.facebook_profile,
    twitter_handle: formData.twitter_handle,
    instagram_handle: formData.instagram_handle,
    communication_preference: formData.communication_preference,
    last_contact_date: formData.last_contact_date,
    next_contact_date: formData.next_contact_date,
    pipeline_stage: formData.pipeline_stage,
    lead_score: formData.lead_score,
    estimated_deal_value: formData.estimated_deal_value,
    notes: formData.notes,
    campaign_source: formData.campaign_source,
    interests: formData.interests,
    billing_address: formData.billing_address,
    shipping_address: formData.shipping_address,
    language_preference: formData.language_preference,
    time_zone: formData.time_zone,
    consent_to_contact: formData.consent_to_contact,
    opt_out_status: formData.opt_out_status,
    call_transcription: formData.call_transcription,
    call_audio_file: formData.call_audio_file,
    call_outcomes: formData.call_outcomes,
    call_notes: formData.call_notes,
    custom_fields: formData.custom_fields,
    gender: formData.gender,
    // Metadata helpers
    name: `${formData.first_name} ${formData.last_name}`.trim(),
    country_code: formData.countryCode,
    // submitted_at will be attached when form is submitted
  } as Record<string, unknown>;
}

/** Drop keys with undefined values (used for the live payload preview). */
export function cleanPayload(payload: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(payload)) {
    if (v !== undefined) out[k] = v;
  }
  return out;
}
