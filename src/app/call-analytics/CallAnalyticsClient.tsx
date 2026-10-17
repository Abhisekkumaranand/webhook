"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  Collapse,
  Grid,
  IconButton,
  InputAdornment,
  LinearProgress,
  MenuItem,
  Paper,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import toast from "react-hot-toast";
import {
  AudioLines,
  Braces,
  Building2,
  ChevronDown,
  ChevronUp,
  Clock,
  DollarSign,
  FileText,
  Gauge,
  Globe,
  KeyRound,
  Mail,
  MapPin,
  MessageSquareText,
  Pause,
  Phone,
  PhoneCall,
  Play,
  Radio,
  RefreshCw,
  Search,
  Send,
  StickyNote,
  Trash2,
  Users,
  Zap,
} from "lucide-react";
import JsonView from "@/components/JsonView";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface CallRecord {
  id: number;
  sid: string | null;
  resultId: string | null;
  contactNumber: string | null;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  name: string | null;
  gender: string | null;
  mobileNumber: string | null;
  phoneNumber: string | null;
  companyName: string | null;
  websiteUrl: string | null;
  industry: string | null;
  jobTitle: string | null;
  department: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  country: string | null;
  timeZone: string | null;
  leadSource: string | null;
  contactOwner: string | null;
  contactType: string | null;
  preferedContactMethod: string | null;
  communicationPreference: string | null;
  lastContactDate: string | null;
  nextContactDate: string | null;
  pipelineStage: string | null;
  leadScore: number | null;
  estimatedDealValue: string | null;
  campaignSource: string | null;
  interests: string | null;
  linkedinProfile: string | null;
  facebookProfile: string | null;
  twitterHandle: string | null;
  instagramHandle: string | null;
  callOutcomes: string | null;
  callNotes: string | null;
  callTranscription: string | null;
  callAudioFile: string | null;
  notes: string | null;
  customFields: string | null;
  matchedBy: string | null;
  webhookSource: string | null;
  updateCount: number;
  rawPayload: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

/* ------------------------------------------------------------------ */
/* Theme-token driven style maps                                       */
/* ------------------------------------------------------------------ */

const POLL_INTERVAL = 5000;

/** Pipeline stages mapped onto the design system's status/outcome tokens. */
const STAGE_STYLES: Record<string, { color: string; bg: string; border: string }> = {
  New: {
    color: "#9ca3af",
    bg: "var(--outcome-none-bg)",
    border: "var(--status-dumped-border)",
  },
  Contacted: {
    color: "var(--status-paused)",
    bg: "var(--status-paused-bg)",
    border: "var(--status-paused-border)",
  },
  Qualified: {
    color: "#818cf8",
    bg: "var(--outcome-interested-bg)",
    border: "var(--primary-border)",
  },
  "Demo Scheduled": {
    color: "var(--outcome-followup)",
    bg: "var(--outcome-followup-bg)",
    border: "var(--status-scheduled-border)",
  },
  Proposal: {
    color: "var(--status-scheduled)",
    bg: "var(--status-scheduled-bg)",
    border: "var(--status-scheduled-border)",
  },
  Negotiation: {
    color: "#fb923c",
    bg: "rgba(251, 146, 60, 0.12)",
    border: "rgba(251, 146, 60, 0.3)",
  },
  Won: {
    color: "var(--outcome-meeting)",
    bg: "var(--outcome-meeting-bg)",
    border: "var(--status-active-border)",
  },
  Lost: {
    color: "var(--outcome-not-interested)",
    bg: "var(--outcome-not-interested-bg)",
    border: "var(--status-completed-border)",
  },
};

/** 8 avatar gradients straight from the theme system. */
const AVATAR_GRADIENTS = [
  "var(--avatar-gradient-1)",
  "var(--avatar-gradient-2)",
  "var(--avatar-gradient-3)",
  "var(--avatar-gradient-4)",
  "var(--avatar-gradient-5)",
  "var(--avatar-gradient-6)",
  "var(--avatar-gradient-7)",
  "var(--avatar-gradient-8)",
];

/** Section accent colors (readable on both modes). */
const ACCENT = {
  contact: "#a5b4fc",
  crm: "#60a5fa",
  social: "#f0abfc",
  call: "#34d399",
  notes: "#fbbf24",
};

function avatarGradient(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_GRADIENTS[h % AVATAR_GRADIENTS.length];
}

function initials(name: string | null) {
  if (!name) return "?";
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 10) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

/** Lead score bar color thresholds → sentiment tokens. */
function scoreColor(score: number) {
  if (score >= 70) return "var(--sentiment-high)";
  if (score >= 40) return "var(--sentiment-mid)";
  return "var(--sentiment-low)";
}

/* Parse "Agent: ... Client: ..." transcripts into chat turns. */
function parseTranscript(text: string): { speaker: string | null; text: string }[] {
  const parts = text
    .split(/(?=(?:Agent|Client|Customer|Caller|Prospect|Rep|AI|Bot|User)\s*:)/i)
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length === 0) return [];
  return parts.map((p) => {
    const m = p.match(/^([A-Za-z][A-Za-z ]{0,18}):\s*([\s\S]*)$/);
    if (m) return { speaker: m[1].trim(), text: m[2].trim() };
    return { speaker: null, text: p };
  });
}

/* ------------------------------------------------------------------ */
/* Small presentational pieces                                         */
/* ------------------------------------------------------------------ */

function StatCard({
  icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  accent: string;
}) {
  return (
    <Paper
      sx={{
        p: 2.25,
        borderRadius: 1,
        display: "flex",
        alignItems: "center",
        gap: 2,
        backdropFilter: "blur(12px)",
        position: "relative",
        overflow: "hidden",
        "&::after": {
          content: '""',
          position: "absolute",
          inset: "auto -30% -60% auto",
          width: 140,
          height: 140,
          borderRadius: "50%",
          background: accent,
          opacity: 0.14,
          filter: "blur(30px)",
        },
      }}
    >
      <Box
        sx={{
          width: 44,
          height: 44,
          borderRadius: "6px",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: accent,
          color: "#fff",
          boxShadow: "var(--shadow-md)",
        }}
      >
        {icon}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="h5" sx={{ lineHeight: 1.1, fontVariantNumeric: "tabular-nums" }}>
          {value}
        </Typography>
        <Typography variant="caption" sx={{ color: "var(--text-secondary)", display: "block" }}>
          {label}
        </Typography>
        <Typography variant="caption" sx={{ color: "var(--text-tertiary)", fontSize: "0.66rem" }}>
          {sub}
        </Typography>
      </Box>
    </Paper>
  );
}

function DetailItem({ label, value, mono }: { label: string; value: string | null | undefined; mono?: boolean }) {
  if (!value) return null;
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="caption" sx={{ color: "var(--text-tertiary)", letterSpacing: "0.05em", fontSize: "0.64rem" }}>
        {label.toUpperCase()}
      </Typography>
      <Typography
        variant="body2"
        sx={{
          mt: 0.25,
          fontSize: "0.82rem",
          wordBreak: "break-word",
          color: "var(--text-primary)",
          ...(mono ? { fontFamily: "var(--font-mono)", fontSize: "0.76rem" } : {}),
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}

function TranscriptView({ transcript }: { transcript: string }) {
  const turns = parseTranscript(transcript);
  const isAgent = (s: string | null) =>
    (s ?? "").toLowerCase().startsWith("agent") ||
    (s ?? "").toLowerCase().startsWith("rep") ||
    (s ?? "").toLowerCase().startsWith("ai");

  if (turns.every((t) => !t.speaker)) {
    return (
      <Typography variant="body2" sx={{ color: "var(--conv-bubble-in-text)", fontSize: "0.82rem", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
        {transcript}
      </Typography>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
      {turns.map((turn, i) => {
        const agent = isAgent(turn.speaker);
        return (
          <Box
            key={i}
            sx={{
              display: "flex",
              gap: 1.25,
              flexDirection: agent ? "row" : "row-reverse",
              alignItems: "flex-start",
            }}
          >
            <Avatar
              sx={{
                width: 28,
                height: 28,
                fontSize: "0.62rem",
                fontWeight: 700,
                color: "#fff",
                background: agent ? "var(--avatar-gradient-1)" : "var(--avatar-gradient-6)",
              }}
            >
              {turn.speaker?.slice(0, 2).toUpperCase() ?? "??"}
            </Avatar>
            <Box
              sx={{
                maxWidth: "82%",
                px: 1.75,
                py: 1.1,
                borderRadius: agent ? "2px 6px 6px 6px" : "6px 2px 6px 6px",
                backgroundColor: agent ? "var(--conv-bubble-out-bg)" : "var(--conv-bubble-in-bg)",
                border: agent
                  ? "1px solid var(--conv-bubble-out-border)"
                  : "1px solid var(--conv-bubble-in-border)",
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 700,
                  color: agent ? "#a5b4fc" : ACCENT.social,
                  fontSize: "0.66rem",
                  letterSpacing: "0.05em",
                }}
              >
                {(turn.speaker ?? "UNKNOWN").toUpperCase()}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontSize: "0.8rem",
                  lineHeight: 1.6,
                  mt: 0.25,
                  color: agent ? "var(--conv-bubble-out-text)" : "var(--conv-bubble-in-text)",
                }}
              >
                {turn.text}
              </Typography>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}

/** Compact social link button (wordmarks since lucide dropped brand icons). */
function SocialButton({
  mark,
  title,
  href,
  color,
}: {
  mark: string;
  title: string;
  href?: string | null;
  color: string;
}) {
  return (
    <Tooltip title={title} arrow>
      <IconButton
        size="small"
        component={href ? "a" : "button"}
        href={href ?? undefined}
        target={href ? "_blank" : undefined}
        sx={{
          width: 30,
          height: 30,
          border: "1px solid var(--border-secondary)",
          color,
          fontSize: "0.68rem",
          fontWeight: 800,
          fontFamily: "'Inter', sans-serif",
          "&:hover": { borderColor: color, backgroundColor: "var(--bg-hover)" },
        }}
      >
        {mark}
      </IconButton>
    </Tooltip>
  );
}

/* ------------------------------------------------------------------ */
/* Record card                                                         */
/* ------------------------------------------------------------------ */

function RecordCard({
  record,
  expanded,
  onToggle,
  onDelete,
  deleting,
}: {
  record: CallRecord;
  expanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  const [confirming, setConfirming] = useState(false);
  const [showRaw, setShowRaw] = useState(false);
  const confirmTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stage = record.pipelineStage ?? "New";
  const stageStyle = STAGE_STYLES[stage] ?? STAGE_STYLES.New;
  const deal = record.estimatedDealValue ? Number(record.estimatedDealValue) : null;
  const score = record.leadScore ?? 0;
  const isFresh = Date.now() - new Date(record.createdAt).getTime() < 45_000;

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirming) {
      setConfirming(true);
      confirmTimer.current = setTimeout(() => setConfirming(false), 3000);
      return;
    }
    if (confirmTimer.current) clearTimeout(confirmTimer.current);
    setConfirming(false);
    onDelete();
  };

  useEffect(() => () => {
    if (confirmTimer.current) clearTimeout(confirmTimer.current);
  }, []);

  return (
    <Paper
      sx={{
        borderRadius: 1,
        overflow: "hidden",
        backdropFilter: "blur(12px)",
        transition: "border-color 0.25s ease, box-shadow 0.25s ease",
        "&:hover": { backgroundColor: "var(--bg-card-hover)" },
        ...(expanded && {
          borderColor: "var(--primary-border)",
          boxShadow: "0 16px 48px -18px rgba(99, 102, 241, 0.35)",
        }),
      }}
    >
      {/* Header row */}
      <Box
        onClick={onToggle}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          p: 2,
          cursor: "pointer",
          "&:hover": { backgroundColor: "var(--bg-hover)" },
        }}
      >
        <Avatar
          sx={{
            width: 44,
            height: 44,
            fontWeight: 800,
            fontSize: "0.9rem",
            color: "#fff",
            background: avatarGradient(record.name ?? ""),
          }}
        >
          {initials(record.name)}
        </Avatar>

        <Box sx={{ minWidth: 0, flexGrow: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
            <Typography variant="subtitle2" sx={{ fontSize: "0.95rem" }}>
              {record.name ?? "Unnamed contact"}
            </Typography>
            {isFresh && (
              <Chip
                label="NEW"
                size="small"
                sx={{
                  height: 18,
                  fontSize: "0.62rem",
                  backgroundColor: "var(--status-active-bg)",
                  color: "var(--status-active)",
                  border: "1px solid var(--status-active-border)",
                }}
              />
            )}
            {record.updateCount > 1 && (
              <Tooltip title={`Webhook re-sent this contact ${record.updateCount} times — smart upsert merged them${record.matchedBy ? ` (latest via ${record.matchedBy})` : ""}.`}>
                <Chip
                  icon={<Zap size={11} />}
                  label={`${record.updateCount} syncs${record.matchedBy ? ` · ${record.matchedBy}` : ""}`}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: "0.64rem",
                    backgroundColor: "var(--status-scheduled-bg)",
                    color: "var(--status-scheduled)",
                    border: "1px solid var(--status-scheduled-border)",
                    "& .MuiChip-icon": { color: "var(--status-scheduled)" },
                  }}
                />
              </Tooltip>
            )}
          </Box>
          <Typography variant="caption" sx={{ color: "var(--text-secondary)", display: "block", mt: 0.25 }}>
            {[record.jobTitle, record.companyName].filter(Boolean).join(" · ") ||
              record.email ||
              record.contactNumber ||
              "No details"}
          </Typography>
        </Box>

        {/* Meta cluster */}
        <Box sx={{ display: { xs: "none", md: "flex" }, alignItems: "center", gap: 1.5 }}>
          {record.contactNumber && (
            <Chip
              icon={<Phone size={11} />}
              label={record.contactNumber}
              size="small"
              variant="outlined"
              sx={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--text-secondary)", "& .MuiChip-icon": { color: "var(--text-tertiary)" } }}
            />
          )}
          <Chip
            label={stage}
            size="small"
            sx={{
              backgroundColor: stageStyle.bg,
              color: stageStyle.color,
              border: `1px solid ${stageStyle.border}`,
              fontSize: "0.72rem",
            }}
          />
          {record.leadScore !== null && (
            <Tooltip title={`Lead score ${score}/100`}>
              <Box sx={{ width: 74 }}>
                <Typography variant="caption" sx={{ fontSize: "0.64rem", color: "var(--text-tertiary)" }}>
                  Score {score}
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(score, 100)}
                  sx={{
                    height: 5,
                    borderRadius: 1,
                    backgroundColor: "var(--bg-secondary)",
                    "& .MuiLinearProgress-bar": { backgroundColor: scoreColor(score), borderRadius: 3 },
                  }}
                />
              </Box>
            </Tooltip>
          )}
          {deal !== null && (
            <Typography variant="subtitle2" sx={{ color: "var(--status-active)", fontVariantNumeric: "tabular-nums" }}>
              {money.format(deal)}
            </Typography>
          )}
          <Chip
            icon={<Clock size={11} />}
            label={timeAgo(record.updatedAt)}
            size="small"
            variant="outlined"
            sx={{ fontSize: "0.68rem", color: "var(--text-tertiary)", "& .MuiChip-icon": { color: "var(--text-tertiary)" } }}
          />
        </Box>

        <IconButton size="small">
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </IconButton>
      </Box>

      {/* Expanded body */}
      <Collapse in={expanded} timeout={280}>
        <Box sx={{ px: { xs: 2, md: 3 }, pb: 3, pt: 0.5, borderTop: 1, borderColor: "divider" }}>
          <Grid container spacing={3} sx={{ mt: 0.5 }}>
            {/* Contact */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                <Mail size={14} color={ACCENT.contact} />
                <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: "0.08em", color: ACCENT.contact }}>
                  CONTACT
                </Typography>
              </Box>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                <DetailItem label="Email" value={record.email} />
                <DetailItem label="Primary Number" value={record.contactNumber} mono />
                <DetailItem label="Mobile" value={record.mobileNumber} mono />
                <DetailItem label="Preferred Method" value={record.preferedContactMethod} />
                <DetailItem label="Timezone" value={record.timeZone} />
              </Box>
            </Grid>

            {/* CRM */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                <Gauge size={14} color={ACCENT.crm} />
                <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: "0.08em", color: ACCENT.crm }}>
                  CRM PROFILE
                </Typography>
              </Box>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                <DetailItem label="Owner" value={record.contactOwner} />
                <DetailItem label="Lead Source" value={record.leadSource} />
                <DetailItem label="Campaign" value={record.campaignSource} />
                <DetailItem label="Estimated Deal Value" value={deal !== null ? money.format(deal) : null} />
                <DetailItem label="Next Contact Date" value={record.nextContactDate} />
                <DetailItem label="Interests" value={record.interests} />
              </Box>
            </Grid>

            {/* Location & social */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                <MapPin size={14} color={ACCENT.social} />
                <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: "0.08em", color: ACCENT.social }}>
                  LOCATION & SOCIAL
                </Typography>
              </Box>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                <DetailItem
                  label="City / Region"
                  value={[record.city, record.state, record.country].filter(Boolean).join(", ") || null}
                />
                <DetailItem label="Industry" value={record.industry} />
                <Box sx={{ display: "flex", gap: 0.75, mt: 0.5 }}>
                  {record.linkedinProfile && (
                    <SocialButton mark="in" title={`LinkedIn · ${record.linkedinProfile}`} href={record.linkedinProfile} color="#60a5fa" />
                  )}
                  {record.facebookProfile && (
                    <SocialButton mark="f" title={`Facebook · ${record.facebookProfile}`} href={record.facebookProfile} color="#818cf8" />
                  )}
                  {record.twitterHandle && (
                    <SocialButton mark="X" title={`Twitter / X · ${record.twitterHandle}`} color="#93c5fd" />
                  )}
                  {record.instagramHandle && (
                    <SocialButton mark="ig" title={`Instagram · ${record.instagramHandle}`} color="#f0abfc" />
                  )}
                  {record.websiteUrl && (
                    <Tooltip title={`Website · ${record.websiteUrl}`} arrow>
                      <IconButton size="small" component="a" href={record.websiteUrl} target="_blank" sx={{ width: 30, height: 30, border: "1px solid var(--border-secondary)", color: "var(--status-active)" }}><Globe size={14} /></IconButton>
                    </Tooltip>
                  )}
                </Box>
                {/* Identity keys */}
                <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap", mt: 0.5 }}>
                  {record.sid && (
                    <Chip icon={<KeyRound size={10} />} label={`sid: ${record.sid}`} size="small" variant="outlined" sx={{ fontFamily: "var(--font-mono)", fontSize: "0.64rem", color: "var(--text-tertiary)", "& .MuiChip-icon": { color: "var(--outcome-followup)" } }} />
                  )}
                  {record.resultId && (
                    <Chip icon={<KeyRound size={10} />} label={`res: ${record.resultId}`} size="small" variant="outlined" sx={{ fontFamily: "var(--font-mono)", fontSize: "0.64rem", color: "var(--text-tertiary)", "& .MuiChip-icon": { color: "var(--outcome-followup)" } }} />
                  )}
                </Box>
              </Box>
            </Grid>

            {/* Call intelligence */}
            {(record.callTranscription || record.callNotes || record.callOutcomes) && (
              <Grid size={{ xs: 12 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5, flexWrap: "wrap" }}>
                  <MessageSquareText size={14} color={ACCENT.call} />
                  <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: "0.08em", color: ACCENT.call }}>
                    CALL INTELLIGENCE
                  </Typography>
                  {record.callOutcomes && (
                    <Chip label={record.callOutcomes} size="small" sx={{ height: 20, fontSize: "0.68rem", backgroundColor: "var(--outcome-meeting-bg)", color: "var(--outcome-meeting)", border: "1px solid var(--status-active-border)" }} />
                  )}
                  {record.callAudioFile && (
                    <Button
                      size="small"
                      variant="outlined"
                      component="a"
                      href={record.callAudioFile}
                      target="_blank"
                      startIcon={<AudioLines size={13} />}
                      sx={{ fontSize: "0.7rem", py: 0.25 }}
                    >
                      Call Recording
                    </Button>
                  )}
                </Box>

                <Grid container spacing={2.5}>
                  {record.callTranscription && (
                    <Grid size={{ xs: 12, md: record.callNotes || record.notes ? 7 : 12 }}>
                      <Paper variant="outlined" sx={{ p: 2, borderRadius: 1, backgroundColor: "var(--conv-thread-bg)", borderColor: "var(--border-primary)" }}>
                        <TranscriptView transcript={record.callTranscription} />
                      </Paper>
                    </Grid>
                  )}
                  {(record.callNotes || record.notes) && (
                    <Grid size={{ xs: 12, md: record.callTranscription ? 5 : 12 }}>
                      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                        {record.callNotes && (
                          <Paper variant="outlined" sx={{ p: 2, borderRadius: 1, backgroundColor: "var(--conv-thread-bg)", borderColor: "var(--border-primary)" }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 0.75 }}>
                              <StickyNote size={13} color={ACCENT.notes} />
                              <Typography variant="caption" sx={{ fontWeight: 700, color: ACCENT.notes, fontSize: "0.66rem", letterSpacing: "0.06em" }}>CALL NOTES</Typography>
                            </Box>
                            <Typography variant="body2" sx={{ fontSize: "0.8rem", lineHeight: 1.65, color: "var(--text-secondary)" }}>{record.callNotes}</Typography>
                          </Paper>
                        )}
                        {record.notes && (
                          <Paper variant="outlined" sx={{ p: 2, borderRadius: 1, backgroundColor: "var(--conv-thread-bg)", borderColor: "var(--border-primary)" }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 0.75 }}>
                              <FileText size={13} color={ACCENT.crm} />
                              <Typography variant="caption" sx={{ fontWeight: 700, color: ACCENT.crm, fontSize: "0.66rem", letterSpacing: "0.06em" }}>GENERAL NOTES</Typography>
                            </Box>
                            <Typography variant="body2" sx={{ fontSize: "0.8rem", lineHeight: 1.65, color: "var(--text-secondary)" }}>{record.notes}</Typography>
                          </Paper>
                        )}
                      </Box>
                    </Grid>
                  )}
                </Grid>
              </Grid>
            )}
          </Grid>

          {/* Footer strip */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mt: 3, pt: 2, borderTop: 1, borderColor: "divider", flexWrap: "wrap" }}>
            <Typography variant="caption" sx={{ color: "var(--text-tertiary)", fontFamily: "var(--font-mono)", fontSize: "0.66rem" }}>
              #{record.id} · created {new Date(record.createdAt).toLocaleString()} · updated {new Date(record.updatedAt).toLocaleString()}
              {record.webhookSource ? ` · via ${record.webhookSource}` : ""}
            </Typography>
            <Box sx={{ ml: "auto", display: "flex", gap: 1 }}>
              {record.customFields && (
                <Tooltip title={<Box component="pre" sx={{ m: 0, fontSize: "0.7rem", fontFamily: "var(--font-mono)" }}>{record.customFields}</Box>} arrow>
                  <Chip icon={<Braces size={11} />} label="custom fields" size="small" variant="outlined" sx={{ fontSize: "0.68rem", color: "var(--text-tertiary)", "& .MuiChip-icon": { color: "var(--text-tertiary)" } }} />
                </Tooltip>
              )}
              <Button
                size="small"
                variant="text"
                startIcon={<Braces size={13} />}
                onClick={() => setShowRaw((s) => !s)}
                sx={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}
              >
                {showRaw ? "Hide raw payload" : "Raw payload"}
              </Button>
              <Button
                size="small"
                variant="outlined"
                color="error"
                disabled={deleting}
                startIcon={<Trash2 size={13} />}
                onClick={handleDeleteClick}
                sx={{ fontSize: "0.72rem" }}
              >
                {deleting ? "Deleting…" : confirming ? "Confirm delete?" : "Delete"}
              </Button>
            </Box>
          </Box>

          <Collapse in={showRaw}>
            <Box sx={{ mt: 2 }}>
              <JsonView data={record.rawPayload ?? record} maxHeight={280} />
            </Box>
          </Collapse>
        </Box>
      </Collapse>
    </Paper>
  );
}

/* ------------------------------------------------------------------ */
/* Main page                                                           */
/* ------------------------------------------------------------------ */

export default function CallAnalyticsClient() {
  const [records, setRecords] = useState<CallRecord[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("All");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const knownIds = useRef<Set<number>>(new Set());
  const hadFirstLoad = useRef(false);

  const fetchData = useCallback(async (silent: boolean) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch("/api/ghl/call-analytics?limit=200", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error ?? `HTTP ${res.status}`);

      const rows = json.data as CallRecord[];
      if (hadFirstLoad.current) {
        const fresh = rows.filter((r) => !knownIds.current.has(r.id));
        if (fresh.length > 0) {
          toast.success(`${fresh.length} new webhook record${fresh.length > 1 ? "s" : ""} received — ${fresh[0].name ?? "unnamed contact"}`);
        }
      }
      knownIds.current = new Set(rows.map((r) => r.id));
      hadFirstLoad.current = true;

      setRecords(rows);
      setTotalCount(json.count ?? rows.length);
      setLastSync(new Date());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch call analytics.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(false);
  }, [fetchData]);

  useEffect(() => {
    if (!autoRefresh) return;
    const t = setInterval(() => fetchData(true), POLL_INTERVAL);
    return () => clearInterval(t);
  }, [autoRefresh, fetchData]);

  const deleteRecord = useCallback(async (id: number) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/ghl/call-analytics/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error ?? `HTTP ${res.status}`);
      setRecords((prev) => prev.filter((r) => r.id !== id));
      knownIds.current.delete(id);
      toast.success(`Record #${id} deleted.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed.");
    } finally {
      setDeletingId(null);
    }
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return records.filter((r) => {
      if (stageFilter !== "All" && (r.pipelineStage ?? "New") !== stageFilter) return false;
      if (!q) return true;
      const hay = [r.name, r.email, r.contactNumber, r.phoneNumber, r.mobileNumber, r.companyName, r.jobTitle, r.city]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [records, search, stageFilter]);

  const stats = useMemo(() => {
    const scores = records.map((r) => r.leadScore).filter((n): n is number => n !== null);
    const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    const pipeline = records
      .filter((r) => r.pipelineStage !== "Lost" && r.estimatedDealValue)
      .reduce((sum, r) => sum + Number(r.estimatedDealValue ?? 0), 0);
    const transcripts = records.filter((r) => r.callTranscription).length;
    const synced = records.filter((r) => r.updateCount > 1).length;
    return { avgScore, pipeline, transcripts, synced };
  }, [records]);

  const stages = useMemo(
    () => ["All", ...Array.from(new Set(records.map((r) => r.pipelineStage ?? "New")))],
    [records]
  );

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {/* ── Header ─────────────────────────────────────────────── */}
      <Paper
        sx={{
          p: { xs: 2.5, md: 3.5 },
          borderRadius: 1,
          background:
            "linear-gradient(120deg, rgba(16,185,129,0.1) 0%, rgba(255,255,255,0.02) 40%, rgba(99,102,241,0.1) 100%)",
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
              background: "linear-gradient(135deg, #34d399 0%, #059669 100%)",
              boxShadow: "0 10px 28px -6px rgba(16, 185, 129, 0.55)",
              color: "#fff",
            }}
          >
            <PhoneCall size={28} />
          </Box>
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
              <Typography variant="h5">Call Analytics</Typography>
              <Chip
                icon={<Box className="hs-live-dot" component="span" />}
                label={autoRefresh ? "LIVE · 5s polling" : "PAUSED"}
                size="small"
                sx={{
                  backgroundColor: autoRefresh ? "var(--status-active-bg)" : "var(--bg-secondary)",
                  color: autoRefresh ? "var(--status-active)" : "var(--text-secondary)",
                  border: autoRefresh ? "1px solid var(--status-active-border)" : "1px solid var(--border-secondary)",
                  fontSize: "0.72rem",
                  "& .MuiChip-icon": { ml: 0.75 },
                }}
              />
            </Box>
            <Typography variant="body2" sx={{ color: "var(--text-secondary)", mt: 0.75 }}>
              Auto-polling <b>GET /api/ghl/call-analytics</b> every 5 seconds — every
              webhook event lands here in real time with transcripts and CRM context.
              {lastSync && (
                <>
                  {" "}· Last synced <b>{lastSync.toLocaleTimeString()}</b>
                </>
              )}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: "flex", gap: 1.25, flexWrap: "wrap" }}>
          <Tooltip title={autoRefresh ? "Pause live polling" : "Resume live polling"}>
            <Button
              variant="outlined"
              size="small"
              onClick={() => setAutoRefresh((v) => !v)}
              startIcon={autoRefresh ? <Pause size={15} /> : <Play size={15} />}
            >
              {autoRefresh ? "Pause Live" : "Resume Live"}
            </Button>
          </Tooltip>
          <Button
            variant="outlined"
            size="small"
            onClick={() => fetchData(false)}
            startIcon={<RefreshCw size={15} />}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            size="small"
            component={Link}
            href="/webhook"
            startIcon={<Send size={15} />}
          >
            Transmit Webhook
          </Button>
        </Box>
      </Paper>

      {/* ── Stats ──────────────────────────────────────────────── */}
      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            icon={<Users size={20} />}
            label="Total Records"
            value={String(totalCount)}
            sub="in call_analytics table"
            accent="var(--avatar-gradient-1)"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            icon={<Gauge size={20} />}
            label="Avg Lead Score"
            value={stats.avgScore ? `${stats.avgScore}/100` : "—"}
            sub="across scored contacts"
            accent="var(--avatar-gradient-2)"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            icon={<DollarSign size={20} />}
            label="Pipeline Value"
            value={stats.pipeline ? money.format(stats.pipeline) : "—"}
            sub="open estimated deal value"
            accent="linear-gradient(135deg, #34d399 0%, #059669 100%)"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            icon={<Radio size={20} />}
            label="Smart Upserts"
            value={String(stats.synced)}
            sub="records merged via sid/phone"
            accent="linear-gradient(135deg, #fbbf24 0%, #f97316 100%)"
          />
        </Grid>
      </Grid>

      {/* ── Filters ────────────────────────────────────────────── */}
      <Paper sx={{ p: 2, borderRadius: 1, display: "flex", gap: 1.5, flexWrap: "wrap", alignItems: "center", backdropFilter: "blur(12px)" }}>
        <TextField
          size="small"
          placeholder="Search name, phone, company, email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ flexGrow: 1, minWidth: 220 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={15} color="var(--text-tertiary)" />
                </InputAdornment>
              ),
            },
          }}
        />
        <TextField
          select
          size="small"
          label="Pipeline Stage"
          value={stageFilter}
          onChange={(e) => setStageFilter(e.target.value)}
          sx={{ minWidth: 170 }}
        >
          {stages.map((s) => (
            <MenuItem key={s} value={s}>{s}</MenuItem>
          ))}
        </TextField>
        <Chip
          label={`${filtered.length} of ${records.length} shown`}
          size="small"
          variant="outlined"
          sx={{ fontSize: "0.72rem", color: "var(--text-tertiary)" }}
        />
      </Paper>

      {/* ── Content ────────────────────────────────────────────── */}
      {error && (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => fetchData(false)}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {loading && records.length === 0 ? (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {[0, 1, 2].map((i) => (
            <Box key={i} className="hs-skeleton" sx={{ height: 84, borderRadius: 3 }} />
          ))}
        </Box>
      ) : filtered.length === 0 ? (
        <Paper
          sx={{
            p: { xs: 5, md: 8 },
            borderRadius: 1,
            textAlign: "center",
            borderStyle: "dashed",
            borderColor: "var(--border-hover)",
          }}
        >
          <Box
            sx={{
              width: 72,
              height: 72,
              mx: "auto",
              mb: 2.5,
              borderRadius: "6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "var(--primary-bg)",
              border: "1px solid var(--primary-border)",
              color: "var(--primary)",
            }}
          >
            <Radio size={32} />
          </Box>
          <Typography variant="h6" gutterBottom>
            {records.length === 0 ? "Waiting for webhook events…" : "No records match your filters"}
          </Typography>
          <Typography variant="body2" sx={{ color: "var(--text-secondary)", maxWidth: 440, mx: "auto", mb: 3 }}>
            {records.length === 0
              ? "This dashboard auto-polls every 5 seconds. POST a payload to /api/webhooks (or use the transmitter form) and it will appear here live — transcripts, scores and all."
              : "Try clearing the search query or switching the pipeline stage filter."}
          </Typography>
          {records.length === 0 && (
            <Button variant="contained" component={Link} href="/webhook" startIcon={<Send size={15} />}>
              Open Webhook Transmitter
            </Button>
          )}
        </Paper>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.75 }}>
          {filtered.map((record) => (
            <RecordCard
              key={record.id}
              record={record}
              expanded={expandedId === record.id}
              onToggle={() => setExpandedId((id) => (id === record.id ? null : record.id))}
              onDelete={() => deleteRecord(record.id)}
              deleting={deletingId === record.id}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}
