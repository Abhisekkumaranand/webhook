import type { Metadata } from "next";
import CallAnalyticsClient from "./CallAnalyticsClient";

export const metadata: Metadata = {
  title: "Call Analytics — HookStream",
};

export default function CallAnalyticsPage() {
  return <CallAnalyticsClient />;
}
