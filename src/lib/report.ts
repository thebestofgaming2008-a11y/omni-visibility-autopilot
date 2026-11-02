import type { Client } from "./clients";
export function reportText(client: Client) {
  return [
    `${client.name} — visibility work report`,
    `Website: ${client.site || "Not recorded"}`,
    `Prepared: ${new Date().toISOString()}`,
    "",
    ...client.work.map(
      (w) =>
        `${w.title}\nDecision: ${w.status === "draft" ? "Proposed" : w.status === "declined" ? "Skipped" : w.status === "approved" ? "Approved" : "Legacy / recorded implementation"}${w.deferredReason ? ` (deferred: ${w.deferredReason})` : ""}\nImplementation: ${w.implementation ? `${w.implementation.date} — ${w.implementation.note}` : "No implementation evidence recorded"}\nVerification: ${w.verification ? `Manual check ${w.verification.date} — ${w.verification.note}` : "Not verified"}`,
    ),
    "",
    `No-change decision: ${client.noActionReason || "Not recorded"}`,
    "Observed outcomes: Not enough data. No connected measurement source or verified date range.",
    "Completed technical work does not establish traffic, ranking, or citation gains.",
  ].join("\n\n");
}
