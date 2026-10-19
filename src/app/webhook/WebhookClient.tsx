"use client";

import { useEffect, useMemo, useState, type ComponentProps, type FormEvent, type ReactNode } from "react";
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  InputAdornment,
  MenuItem,
  Paper,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import toast from "react-hot-toast";
import {
  AlertCircle,
  Building2,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  FileJson2,
  KeyRound,
  Link2,
  MapPin,
  PhoneCall,
  RotateCcw,
  Send,
  Share2,
  Sparkles,
  TrendingUp,
  User,
  Webhook as WebhookIcon,
} from "lucide-react";
import JsonView from "@/components/JsonView";
import {
  COUNTRY_CODES,
  INITIAL_FORM_STATE,
  SAMPLE_TEST_DATA,
  buildPayload,
  cleanPayload,
  type WebhookFormData,
} from "@/lib/webhook-data";

/* ---------------------------------------------------------------- */

type TextFieldProps = ComponentProps<typeof TextField>;

function Field(props: TextFieldProps) {
  return <TextField fullWidth size="small" variant="outlined" {...props} />;
}

interface WebhookResponseState {
  ok: boolean;
  status: number;
  body: unknown;
  payload: Record<string, unknown>;
  at: string;
}

const FALLBACK_OUTBOUND_URL =
  process.env.NEXT_PUBLIC_WEBHOOK_URL ||
  "https://bribe-claw-unguarded.ngrok-free.dev/api/webhook/577d659e-660d-4633-ad00-b75a80ed1135/";

const TAB_ICONS: ReactNode[] = [
  <User key="p" size={16} />,
  <Building2 key="c" size={16} />,
  <MapPin key="l" size={16} />,
  <TrendingUp key="crm" size={16} />,
  <Share2 key="s" size={16} />,
  <PhoneCall key="call" size={16} />,
];

const TAB_LABELS = ["Personal", "Company", "Location", "Lead & CRM", "Social", "Calls & Notes"];

/* ---------------------------------------------------------------- */

export default function WebhookClient() {
  const [formData, setFormData] = useState<WebhookFormData>(INITIAL_FORM_STATE);
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [lastResponse, setLastResponse] = useState<WebhookResponseState | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedInbound, setCopiedInbound] = useState(false);
  const [isProduction, setIsProduction] = useState(false);
  const [inboundBaseUrl, setInboundBaseUrl] = useState<string>(
    () => process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_NGROK_URL || ""
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isLocal =
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1";
      setIsProduction(!isLocal);

      if (!isLocal) {
        // Deployed environment (Vercel, Render, Railway, custom domain):
        // Automatically use current live domain (no ngrok required!)
        setInboundBaseUrl(window.location.origin);
      } else {
        // Local machine: use ngrok if configured, or localhost
        setInboundBaseUrl(
          process.env.NEXT_PUBLIC_NGROK_URL ||
            window.location.origin ||
            "https://0ba3-2401-4900-8811-3a12-9076-8bbe-911d-732a.ngrok-free.app"
        );
      }
    }
  }, []);

  const presetEndpoints = useMemo(() => {
    const base = inboundBaseUrl || "";
    return [
      {
        label: "Send Target (Bribe-Claw)",
        url: FALLBACK_OUTBOUND_URL,
      },
      {
        label: isProduction ? "Production Receiver" : "Ngrok Receiver",
        url: base ? `${base}/api/webhooks` : "/api/webhooks",
      },
      { label: "Internal · /api/webhooks", url: "/api/webhooks" },
      { label: "Wildcard · GHL", url: base ? `${base}/api/webhook/ghl` : "/api/webhook/ghl" },
      { label: "Wildcard · Dialer", url: base ? `${base}/api/webhook/dialer/ivr` : "/api/webhook/dialer/ivr" },
    ];
  }, [inboundBaseUrl, isProduction]);

  // Default target read from env (NEXT_PUBLIC_WEBHOOK_URL), overridable in the UI.
  const [targetWebhookUrl, setTargetWebhookUrl] = useState(
    () => FALLBACK_OUTBOUND_URL
  );

  const handleChange = (field: keyof WebhookFormData, value: string) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const livePayload = useMemo(
    () => cleanPayload(buildPayload(formData)),
    [formData]
  );
  const payloadFieldCount = useMemo(
    () =>
      Object.values(livePayload).filter(
        (v) => v !== undefined && String(v ?? "").trim() !== ""
      ).length,
    [livePayload]
  );

  const fillSampleData = () => {
    setFormData(SAMPLE_TEST_DATA);
    toast.success("Sample test data populated into all fields.");
  };

  const clearForm = () => {
    setFormData(INITIAL_FORM_STATE);
    setLastResponse(null);
    toast.success("Form reset to blank state.");
  };

  const copyPayload = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(livePayload, null, 2));
      setCopied(true);
      toast.success("Payload copied to clipboard.");
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Clipboard blocked by browser permissions.");
    }
  };

  const handleSubmit = async (e?: FormEvent) => {
    e?.preventDefault();
    const url = targetWebhookUrl.trim();
    if (!url) {
      toast.error("Please enter a valid webhook endpoint URL.");
      return;
    }
    if (
      !formData.first_name.trim() &&
      !formData.email.trim() &&
      !formData.phone_number.trim() &&
      !formData.sid.trim()
    ) {
      toast.error("Fill at least First Name, Email, Phone or a Session ID.");
      return;
    }

    setLoading(true);
    setLastResponse(null);
    const payload = { ...livePayload, submitted_at: new Date().toISOString() };

    try {
      let ok = false;
      let status = 0;
      let body: unknown = null;

      // External URLs (e.g. ngrok or remote APIs) are relayed through server-side /api/transmit
      // This completely bypasses browser CORS, Referrer-Policy, and ngrok interstitial restrictions!
      if (url.startsWith("http://") || url.startsWith("https://")) {
        const relayRes = await fetch("/api/transmit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ targetUrl: url, payload }),
        });
        const relayData = await relayRes.json();
        ok = Boolean(relayData.ok);
        status = relayData.status ?? relayRes.status;
        body = relayData.body;
      } else {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        ok = res.ok;
        status = res.status;
        const text = await res.text();
        try {
          body = JSON.parse(text);
        } catch {
          body = text;
        }
      }

      const bodyObj = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
      if (ok) {
        if (bodyObj.action === "updated") {
          toast.success(`Smart upsert — record #${bodyObj.id} updated via ${bodyObj.matchedBy} match.`);
        } else {
          toast.success(`Webhook delivered — ${bodyObj.message || `HTTP ${status}`}`);
        }
      } else {
        const errorMsg =
          typeof bodyObj.error === "string"
            ? bodyObj.error
            : typeof body === "string"
            ? body.slice(0, 100)
            : `HTTP ${status}`;
        toast.error(`Webhook failed: ${errorMsg}`);
      }

      setLastResponse({
        ok,
        status,
        body,
        payload,
        at: new Date().toISOString(),
      });
    } catch (err) {
      toast.error("Network request failed. Check the endpoint URL.");
      setLastResponse({
        ok: false,
        status: 0,
        body: { error: err instanceof Error ? err.message : "Network failure" },
        payload,
        at: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  };

  const responseBodyObj = (lastResponse?.body ?? {}) as Record<string, unknown>;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {/* ── Hero header ─────────────────────────────────────────── */}
      <Paper
        sx={{
          p: { xs: 2.5, md: 3.5 },
          borderRadius: 1,
          background:
            "linear-gradient(120deg, rgba(99,102,241,0.14) 0%, rgba(255,255,255,0.02) 42%, rgba(139,92,246,0.08) 100%)",
          backdropFilter: "blur(14px)",
          display: "flex",
          flexDirection: { xs: "column", lg: "row" },
          alignItems: { xs: "flex-start", lg: "center" },
          justifyContent: "space-between",
          gap: 2.5,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Box
            sx={{
              width: 54,
              height: 54,
              borderRadius: "6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              background: "var(--avatar-gradient-1)",
              boxShadow: "0 10px 28px -6px rgba(99, 102, 241, 0.65)",
              color: "#fff",
            }}
          >
            <WebhookIcon size={28} />
          </Box>
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
              <Typography variant="h5">Webhook Transmitter</Typography>
              <Chip
                label="51 Parameters"
                size="small"
                sx={{
                  backgroundColor: "var(--primary-bg)",
                  color: "var(--primary)",
                  border: "1px solid var(--primary-border)",
                  fontSize: "0.72rem",
                }}
              />
              <Chip
                label="Smart Upsert Enabled"
                size="small"
                icon={<KeyRound size={12} />}
                sx={{
                  backgroundColor: "var(--status-active-bg)",
                  color: "var(--status-active)",
                  border: "1px solid var(--status-active-border)",
                  fontSize: "0.72rem",
                  "& .MuiChip-icon": { color: "var(--status-active)" },
                }}
              />
            </Box>
            <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.75, maxWidth: 560 }}>
              Compose a full 49-point CRM contact profile, POST it as JSON to any
              webhook endpoint, and let the backend smart-upsert it into CallAnalytics
              via <b>sid → result_id → phone</b> matching.
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: "flex", gap: 1.25, flexWrap: "wrap" }}>
          <Button
            variant="outlined"
            size="small"
            onClick={fillSampleData}
            startIcon={<Sparkles size={15} color="var(--status-scheduled)" />}
          >
            Fill Sample Data
          </Button>
          <Button
            variant="outlined"
            size="small"
            onClick={copyPayload}
            startIcon={copied ? <Check size={15} color="var(--status-active)" /> : <Copy size={15} />}
          >
            {copied ? "Copied" : "Copy JSON"}
          </Button>
          <Button
            variant="text"
            size="small"
            onClick={clearForm}
            startIcon={<RotateCcw size={15} />}
            sx={{ color: "text.secondary" }}
          >
            Reset
          </Button>
        </Box>
      </Paper>

      {/* ── Endpoint configuration ──────────────────────────────── */}
      <Paper sx={{ p: { xs: 2.5, md: 3 }, borderRadius: 1, backdropFilter: "blur(12px)", display: "flex", flexDirection: "column", gap: 2.5 }}>
        {/* Inbound Receiver Info */}
        <Box
          sx={{
            p: 2,
            borderRadius: 1,
            backgroundColor: isProduction ? "rgba(59, 130, 246, 0.08)" : "rgba(16, 185, 129, 0.08)",
            border: isProduction ? "1px solid rgba(59, 130, 246, 0.25)" : "1px solid rgba(16, 185, 129, 0.25)",
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            alignItems: { sm: "center" },
            justifyContent: "space-between",
            gap: 1.5,
          }}
        >
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
              <Chip
                label="RECEIVE (Inbound)"
                size="small"
                sx={{
                  backgroundColor: isProduction ? "rgba(59, 130, 246, 0.2)" : "rgba(16, 185, 129, 0.2)",
                  color: isProduction ? "#3b82f6" : "#10b981",
                  fontWeight: 700,
                  fontSize: "0.68rem",
                  letterSpacing: "0.05em",
                }}
              />
              <Chip
                label={isProduction ? "Production Domain (Active)" : "Dev Ngrok Tunnel"}
                size="small"
                variant="outlined"
                sx={{
                  fontSize: "0.68rem",
                  color: isProduction ? "#3b82f6" : "#10b981",
                  borderColor: isProduction ? "rgba(59, 130, 246, 0.4)" : "rgba(16, 185, 129, 0.4)",
                }}
              />
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Active Inbound Webhook Endpoint:
              </Typography>
            </Box>
            <Typography
              variant="caption"
              sx={{
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: "0.82rem",
                color: "var(--text-primary)",
                wordBreak: "break-all",
              }}
            >
              {inboundBaseUrl ? `${inboundBaseUrl}/api/webhooks` : "/api/webhooks"}
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              {isProduction
                ? "Production Environment: Listening for incoming webhook events on your primary domain."
                : "Development Tunnel Active: Routing incoming payloads via secure proxy. Automatically transitions to your live domain in production."}
            </Typography>
          </Box>
          <Button
            size="small"
            variant="outlined"
            startIcon={copiedInbound ? <Check size={14} /> : <Copy size={14} />}
            color={copiedInbound ? "success" : "primary"}
            onClick={async () => {
              const fullUrl = inboundBaseUrl
                ? `${inboundBaseUrl}/api/webhooks`
                : `${window.location.origin}/api/webhooks`;
              try {
                await navigator.clipboard.writeText(fullUrl);
                setCopiedInbound(true);
                toast.success("Inbound Webhook URL copied!");
                setTimeout(() => setCopiedInbound(false), 2000);
              } catch {
                toast.error("Failed to copy to clipboard");
              }
            }}
            sx={{ whiteSpace: "nowrap", alignSelf: { xs: "flex-start", sm: "center" } }}
          >
            {copiedInbound ? "Copied!" : "Copy Inbound URL"}
          </Button>
        </Box>

        {/* Outbound Destination Input */}
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5, flexWrap: "wrap" }}>
            <Link2 size={16} color="var(--primary)" />
            <Typography variant="subtitle2">
              SEND (Outbound) Destination Webhook Endpoint
            </Typography>
            <Box sx={{ display: "flex", gap: 0.75, ml: { md: "auto" }, flexWrap: "wrap" }}>
              {presetEndpoints.map((p) => (
                <Chip
                  key={p.url}
                  label={p.label}
                  size="small"
                  onClick={() => setTargetWebhookUrl(p.url)}
                  variant={targetWebhookUrl === p.url ? "filled" : "outlined"}
                  sx={{
                    cursor: "pointer",
                    fontSize: "0.72rem",
                    ...(targetWebhookUrl === p.url
                      ? {
                          backgroundColor: "var(--primary-bg)",
                          color: "var(--primary)",
                          border: "1px solid var(--primary-border)",
                        }
                      : { color: "text.secondary" }),
                  }}
                />
              ))}
            </Box>
          </Box>
          <TextField
            fullWidth
            size="small"
            placeholder="https://your-server.com/api/webhooks"
            value={targetWebhookUrl}
            onChange={(e) => setTargetWebhookUrl(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <ExternalLink size={16} color="var(--primary)" />
                  </InputAdornment>
                ),
                sx: { fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "0.85rem" },
              },
            }}
            helperText="Target endpoint where outbound test payloads are transmitted. Defaults to NEXT_PUBLIC_WEBHOOK_URL."
          />
        </Box>
      </Paper>

      {/* ── Form + live rail ────────────────────────────────────── */}
      <Grid container spacing={3} sx={{ alignItems: "flex-start" }}>
        {/* Form card */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card sx={{ borderRadius: 1, overflow: "hidden", backdropFilter: "blur(12px)" }}>
            <Box sx={{ borderBottom: 1, borderColor: "divider", backgroundColor: "var(--bg-secondary)" }}>
              <Tabs
                value={activeTab}
                onChange={(_, v: number) => setActiveTab(v)}
                variant="scrollable"
                scrollButtons="auto"
              >
                {TAB_LABELS.map((label, i) => (
                  <Tab key={label} icon={TAB_ICONS[i] as never} iconPosition="start" label={label} />
                ))}
              </Tabs>
            </Box>

            <CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
              <form onSubmit={handleSubmit}>
                {/* TAB 0 — PERSONAL */}
                {activeTab === 0 && (
                  <Grid container spacing={2.5}>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <Field label="First Name" placeholder="Rahul" value={formData.first_name} onChange={(e) => handleChange("first_name", e.target.value)} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <Field label="Last Name" placeholder="Sharma" value={formData.last_name} onChange={(e) => handleChange("last_name", e.target.value)} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <Field label="Gender" placeholder="Male / Female / Other" value={formData.gender} onChange={(e) => handleChange("gender", e.target.value)} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <Field type="email" label="Primary Email" placeholder="rahul@example.com" value={formData.email} onChange={(e) => handleChange("email", e.target.value)} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <Field type="email" label="Additional Email" placeholder="rahul.work@example.com" value={formData.additional_email} onChange={(e) => handleChange("additional_email", e.target.value)} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <Field type="date" label="Date of Birth" value={formData.date_of_birth} onChange={(e) => handleChange("date_of_birth", e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Box sx={{ display: "flex", gap: 1.5 }}>
                        <TextField
                          select
                          size="small"
                          label="Code"
                          value={formData.countryCode}
                          onChange={(e) => handleChange("countryCode", e.target.value)}
                          sx={{ width: 118, flexShrink: 0 }}
                        >
                          {COUNTRY_CODES.map((c) => (
                            <MenuItem key={c.code} value={c.code}>
                              {c.country}
                            </MenuItem>
                          ))}
                        </TextField>
                        <Field type="tel" label="Phone Number" placeholder="9876543210" value={formData.phone_number} onChange={(e) => handleChange("phone_number", e.target.value)} />
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <Field label="Mobile Number" placeholder="9876543210" value={formData.mobile_number} onChange={(e) => handleChange("mobile_number", e.target.value)} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <Field label="Additional Phone" placeholder="9123456789" value={formData.additional_phone} onChange={(e) => handleChange("additional_phone", e.target.value)} />
                    </Grid>
                  </Grid>
                )}

                {/* TAB 1 — COMPANY */}
                {activeTab === 1 && (
                  <Grid container spacing={2.5}>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <Field label="Company Name" placeholder="Acme Corp" value={formData.company_name} onChange={(e) => handleChange("company_name", e.target.value)} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <Field label="Job Title" placeholder="Senior Product Manager" value={formData.job_title} onChange={(e) => handleChange("job_title", e.target.value)} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <Field label="Department" placeholder="Sales & Marketing" value={formData.department} onChange={(e) => handleChange("department", e.target.value)} />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Field label="Industry" placeholder="Information Technology / SaaS" value={formData.industry} onChange={(e) => handleChange("industry", e.target.value)} />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Field type="url" label="Website URL" placeholder="https://example.com" value={formData.website_url} onChange={(e) => handleChange("website_url", e.target.value)} />
                    </Grid>
                  </Grid>
                )}

                {/* TAB 2 — LOCATION */}
                {activeTab === 2 && (
                  <Grid container spacing={2.5}>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Field label="Address Line 1" placeholder="Building, Street, Landmark" value={formData.address_line1} onChange={(e) => handleChange("address_line1", e.target.value)} />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Field label="Address Line 2" placeholder="Suite, Unit, Floor" value={formData.address_line2} onChange={(e) => handleChange("address_line2", e.target.value)} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <Field label="City" placeholder="Bengaluru" value={formData.city} onChange={(e) => handleChange("city", e.target.value)} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <Field label="State" placeholder="Karnataka" value={formData.state} onChange={(e) => handleChange("state", e.target.value)} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <Field label="ZIP / Postal Code" placeholder="560001" value={formData.zip} onChange={(e) => handleChange("zip", e.target.value)} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <Field label="Country" placeholder="India" value={formData.country} onChange={(e) => handleChange("country", e.target.value)} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Field label="Time Zone" placeholder="Asia/Kolkata (GMT+5:30)" value={formData.time_zone} onChange={(e) => handleChange("time_zone", e.target.value)} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Field label="Language Preference" placeholder="English" value={formData.language_preference} onChange={(e) => handleChange("language_preference", e.target.value)} />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Field multiline rows={2} label="Billing Address" placeholder="Full billing address" value={formData.billing_address} onChange={(e) => handleChange("billing_address", e.target.value)} />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Field multiline rows={2} label="Shipping Address" placeholder="Full shipping address" value={formData.shipping_address} onChange={(e) => handleChange("shipping_address", e.target.value)} />
                    </Grid>
                  </Grid>
                )}

                {/* TAB 3 — LEAD & CRM */}
                {activeTab === 3 && (
                  <Grid container spacing={2.5}>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <Field label="Lead Source" placeholder="Website / Referral / Organic" value={formData.lead_source} onChange={(e) => handleChange("lead_source", e.target.value)} />
                    </Grid>
                    {/* <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <Field label="Contact Owner" placeholder="Sales Representative" value={formData.contact_owner} onChange={(e) => handleChange("contact_owner", e.target.value)} />
                    </Grid> */}
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <Field label="Contact Type" placeholder="Lead / Prospect / Customer" value={formData.contact_type} onChange={(e) => handleChange("contact_type", e.target.value)} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <Field label="Preferred Contact Method" placeholder="Email / Phone / WhatsApp" value={formData.prefered_contact_method} onChange={(e) => handleChange("prefered_contact_method", e.target.value)} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <Field label="Communication Preference" placeholder="WhatsApp & Email" value={formData.communication_preference} onChange={(e) => handleChange("communication_preference", e.target.value)} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <Field select label="Pipeline Stage" value={formData.pipeline_stage} onChange={(e) => handleChange("pipeline_stage", e.target.value)}>
                        {["New", "Contacted", "Qualified", "Demo Scheduled", "Proposal", "Negotiation", "Won", "Lost"].map((s) => (
                          <MenuItem key={s} value={s}>{s}</MenuItem>
                        ))}
                      </Field>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <Field type="number" label="Lead Score" placeholder="85" value={formData.lead_score} onChange={(e) => handleChange("lead_score", e.target.value)} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <Field type="number" label="Deal Value ($)" placeholder="50000" value={formData.estimated_deal_value} onChange={(e) => handleChange("estimated_deal_value", e.target.value)} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <Field type="date" label="Last Contact" value={formData.last_contact_date} onChange={(e) => handleChange("last_contact_date", e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <Field type="date" label="Next Contact" value={formData.next_contact_date} onChange={(e) => handleChange("next_contact_date", e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Field label="Campaign Source" placeholder="Google Ad Campaign 2026" value={formData.campaign_source} onChange={(e) => handleChange("campaign_source", e.target.value)} />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Field label="Interests" placeholder="Webhooks, API Integration, CRM Sync" value={formData.interests} onChange={(e) => handleChange("interests", e.target.value)} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Field select label="Consent to Contact" value={formData.consent_to_contact} onChange={(e) => handleChange("consent_to_contact", e.target.value)}>
                        <MenuItem value="Yes">Yes</MenuItem>
                        <MenuItem value="No">No</MenuItem>
                      </Field>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Field select label="Opt Out Status" value={formData.opt_out_status} onChange={(e) => handleChange("opt_out_status", e.target.value)}>
                        <MenuItem value="No">No (Subscribed)</MenuItem>
                        <MenuItem value="Yes">Yes (Opted Out)</MenuItem>
                      </Field>
                    </Grid>
                  </Grid>
                )}

                {/* TAB 4 — SOCIAL */}
                {activeTab === 4 && (
                  <Grid container spacing={2.5}>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Field label="LinkedIn Profile" placeholder="https://linkedin.com/in/username" value={formData.linkedin_profile} onChange={(e) => handleChange("linkedin_profile", e.target.value)} />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Field label="Facebook Profile" placeholder="https://facebook.com/username" value={formData.facebook_profile} onChange={(e) => handleChange("facebook_profile", e.target.value)} />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Field label="Twitter / X Handle" placeholder="@username" value={formData.twitter_handle} onChange={(e) => handleChange("twitter_handle", e.target.value)} />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Field label="Instagram Handle" placeholder="@username" value={formData.instagram_handle} onChange={(e) => handleChange("instagram_handle", e.target.value)} />
                    </Grid>
                  </Grid>
                )}

                {/* TAB 5 — CALLS & NOTES */}
                {activeTab === 5 && (
                  <Grid container spacing={2.5}>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Alert severity="info" icon={<KeyRound size={17} />} sx={{ mb: 0.5 }}>
                        <AlertTitle sx={{ fontSize: "0.85rem" }}>Smart-upsert identity keys</AlertTitle>
                        Re-sending the same <b>sid</b> or <b>result_id</b> updates the existing record instead of creating a duplicate.
                      </Alert>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }} />
                    <Grid size={{ xs: 12, md: 3 }}>
                      <Field
                        label="Call Session ID (sid)"
                        placeholder="sess_88214"
                        value={formData.sid}
                        onChange={(e) => handleChange("sid", e.target.value)}
                        slotProps={{ input: { sx: { fontFamily: "'JetBrains Mono', monospace", fontSize: "0.8rem" } } }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 3 }}>
                      <Field
                        label="Result ID"
                        placeholder="res_55291"
                        value={formData.result_id}
                        onChange={(e) => handleChange("result_id", e.target.value)}
                        slotProps={{ input: { sx: { fontFamily: "'JetBrains Mono', monospace", fontSize: "0.8rem" } } }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Field label="Call Outcomes" placeholder="Connected - Interested in demo" value={formData.call_outcomes} onChange={(e) => handleChange("call_outcomes", e.target.value)} />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Field label="Call Audio File URL" placeholder="https://storage.example.com/audio/call_10293.mp3" value={formData.call_audio_file} onChange={(e) => handleChange("call_audio_file", e.target.value)} />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Field multiline rows={2} label="Call Notes" placeholder="Client expressed interest in webhook automation..." value={formData.call_notes} onChange={(e) => handleChange("call_notes", e.target.value)} />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <Field multiline rows={3} label="Call Transcription" placeholder="Agent: Hello Rahul. Client: Hi, I wanted to inquire about the webhook API integration..." value={formData.call_transcription} onChange={(e) => handleChange("call_transcription", e.target.value)} />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Field multiline rows={3} label="General Notes" placeholder="High priority prospect..." value={formData.notes} onChange={(e) => handleChange("notes", e.target.value)} />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Field
                        multiline
                        rows={3}
                        label="Custom Fields (JSON or text)"
                        placeholder='{"priority": "High", "tier": "Enterprise"}'
                        value={formData.custom_fields}
                        onChange={(e) => handleChange("custom_fields", e.target.value)}
                        slotProps={{ input: { sx: { fontFamily: "'JetBrains Mono', monospace", fontSize: "0.78rem" } } }}
                      />
                    </Grid>
                  </Grid>
                )}

                {/* Submit */}
                <Box sx={{ mt: 4, pt: 2.5, borderTop: 1, borderColor: "divider" }}>
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    size="large"
                    disabled={loading}
                    startIcon={
                      loading ? <CircularProgress size={18} color="inherit" /> : <Send size={17} />
                    }
                    sx={{ py: 1.5, borderRadius: 1, fontSize: "0.95rem" }}
                  >
                    {loading
                      ? `Transmitting ${payloadFieldCount} fields to webhook...`
                      : "Transmit CRM Payload to Webhook"}
                  </Button>
                </Box>
              </form>
            </CardContent>
          </Card>
        </Grid>

        {/* Live rail */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3, position: { lg: "sticky" }, top: { lg: 92 } }}>
            {/* Live payload preview */}
            <Paper sx={{ p: 2.5, borderRadius: 1, backdropFilter: "blur(12px)" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                <FileJson2 size={16} color="#a78bfa" />
                <Typography variant="subtitle2" className="hs-gradient-text">
                  Live Payload Preview
                </Typography>
                <Chip
                  label={`${payloadFieldCount} fields`}
                  size="small"
                  sx={{
                    ml: "auto",
                    fontSize: "0.7rem",
                    backgroundColor: "rgba(139, 92, 246, 0.12)",
                    color: "#c4b5fd",
                    border: "1px solid rgba(139, 92, 246, 0.3)",
                  }}
                />
              </Box>
              <JsonView data={livePayload} maxHeight={330} />
              <Typography variant="caption" sx={{ display: "block", mt: 1.25, color: "text.secondary" }}>
                Auto-composed from the form — exactly what will be POSTed as JSON.
              </Typography>
            </Paper>

            {/* Response log */}
            <Paper sx={{ p: 2.5, borderRadius: 1, backdropFilter: "blur(12px)" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                <CheckCircle2 size={16} color="var(--status-active)" />
                <Typography variant="subtitle2">Webhook Response Log</Typography>
                {lastResponse && (
                  <Chip
                    label={`HTTP ${lastResponse.status}`}
                    size="small"
                    color={lastResponse.ok ? "success" : "error"}
                    variant="outlined"
                    sx={{ ml: "auto", fontSize: "0.7rem", fontFamily: "'JetBrains Mono', monospace" }}
                  />
                )}
              </Box>

              {!lastResponse ? (
                <Box
                  sx={{
                    border: "1px dashed rgba(141, 160, 196, 0.3)",
                    borderRadius: 1,
                    p: 3,
                    textAlign: "center",
                    color: "text.secondary",
                  }}
                >
                  <Send size={20} style={{ opacity: 0.5, marginBottom: 6 }} />
                  <Typography variant="caption" sx={{ display: "block" }}>
                    No transmission yet. Submit the form to see the endpoint response here.
                  </Typography>
                </Box>
              ) : (
                <Alert
                  severity={lastResponse.ok ? "success" : "error"}
                  icon={lastResponse.ok ? <CheckCircle2 size={19} /> : <AlertCircle size={19} />}
                  sx={{ alignItems: "flex-start" }}
                >
                  <AlertTitle sx={{ fontSize: "0.85rem" }}>
                    {lastResponse.ok
                      ? responseBodyObj.action === "updated"
                        ? "Smart Upsert — Record Updated"
                        : "Delivery Successful — Record Created"
                      : "Delivery Failed"}
                  </AlertTitle>
                  <Typography variant="caption" sx={{ display: "block", mb: 1, opacity: 0.9 }}>
                    {String(
                      responseBodyObj.message ??
                        (lastResponse.ok ? "Payload accepted by endpoint." : "Endpoint rejected the payload.")
                    )}
                  </Typography>
                  <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap", mb: 1.25 }}>
                    {"action" in responseBodyObj && (
                      <Tooltip title="create vs update decision made by the smart-upsert filter">
                        <Chip size="small" label={`action: ${String(responseBodyObj.action)}`} variant="outlined" sx={{ fontSize: "0.68rem" }} />
                      </Tooltip>
                    )}
                    {Boolean(responseBodyObj.matchedBy) && (
                      <Tooltip title="which identity key matched the existing row">
                        <Chip size="small" label={`matchedBy: ${String(responseBodyObj.matchedBy)}`} variant="outlined" color="warning" sx={{ fontSize: "0.68rem" }} />
                      </Tooltip>
                    )}
                    {Boolean(responseBodyObj.receivedFields) && (
                      <Chip size="small" label={`fields: ${String(responseBodyObj.receivedFields)}`} variant="outlined" sx={{ fontSize: "0.68rem" }} />
                    )}
                  </Box>
                  <JsonView data={lastResponse.body} maxHeight={260} fontSize="0.7rem" />
                </Alert>
              )}
            </Paper>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
