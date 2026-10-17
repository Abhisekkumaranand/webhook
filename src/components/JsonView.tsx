"use client";

import { useMemo } from "react";
import { Box } from "@mui/material";

/**
 * Lightweight dependency-free JSON syntax highlighter used for payload
 * previews and raw webhook body inspection. Colors follow the theme
 * design tokens (indigo keys, emerald strings, amber literals).
 */
const TOKEN_RE =
  /("(?:\\.|[^"\\])*")(\s*:)?|\b(true|false|null)\b|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g;

export default function JsonView({
  data,
  maxHeight = 320,
  fontSize = "0.74rem",
}: {
  data: unknown;
  maxHeight?: number | string;
  fontSize?: string;
}) {
  const nodes = useMemo(() => {
    const json = JSON.stringify(data, null, 2) ?? "null";
    const parts: React.ReactNode[] = [];
    let last = 0;
    let key = 0;
    for (const match of json.matchAll(TOKEN_RE)) {
      const idx = match.index ?? 0;
      if (idx > last) parts.push(json.slice(last, idx));
      const [full, str, colon, literal, num] = match;
      let color = "var(--text-secondary)";
      if (str !== undefined) {
        color = colon ? "#a5b4fc" : "#6ee7b7"; // key (indigo) vs string value (emerald)
      } else if (literal !== undefined) {
        color = "#fbbf24";
      } else if (num !== undefined) {
        color = "#67e8f9";
      }
      parts.push(
        <span key={key++} style={{ color }}>
          {full}
        </span>
      );
      last = idx + full.length;
    }
    if (last < json.length) parts.push(json.slice(last));
    return parts;
  }, [data]);

  return (
    <Box
      component="pre"
      suppressHydrationWarning
      sx={{
        m: 0,
        p: 1.75,
        borderRadius: 1,
        backgroundColor: "var(--conv-thread-bg)",
        border: "1px solid var(--border-secondary)",
        fontFamily: "var(--font-mono)",
        fontSize,
        lineHeight: 1.65,
        color: "var(--text-secondary)",
        overflow: "auto",
        maxHeight,
        whiteSpace: "pre",
      }}
    >
      {nodes}
    </Box>
  );
}
