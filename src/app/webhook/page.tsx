import type { Metadata } from "next";
import WebhookClient from "./WebhookClient";

export const metadata: Metadata = {
  title: "Webhook Transmitter — HookStream",
};

export default function WebhookPage() {
  return <WebhookClient />;
}
