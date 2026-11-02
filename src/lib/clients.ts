// Workspace data, saved in this browser only (localStorage). Swap for real storage later.
import { useSyncExternalStore } from "react";
import { z } from "zod";

export type Confidence = "high" | "medium" | "low";
export type Source = "Search Console" | "GA4" | "Site check" | "Operator" | "Client brief";
export const SOURCES: Source[] = [
  "Search Console",
  "GA4",
  "Site check",
  "Operator",
  "Client brief",
];

export interface Evidence {
  id: string;
  claim: string;
  source: Source;
  collected: string;
  confidence: Confidence;
  detail: string;
  kind?: "observed" | "hypothesis";
  group?: "attention" | "review" | "opportunity" | "passed" | "incomplete";
  page?: string;
  sourceUrl?: string;
  limitation?: string;
  recommendation?: string;
  risk?: string;
  verificationPlan?: string;
}

export interface PageMapRow {
  id: string;
  query: string;
  intent: string;
  page: string;
  status: "covered" | "weak" | "missing";
  impressions: number;
  basis?: string;
}

export interface WorkItem {
  id: string;
  title: string;
  why: string;
  evidenceIds: string[];
  effort: "small" | "medium" | "large";
  clientFacing: boolean;
  status: "draft" | "approved" | "declined" | "done";
  brief?: string;
  deferredReason?: string;
  page?: string;
  implementation?: { date: string; note: string };
  verification?: { date: string; note: string; method: "manual" };
}

export interface HistoryEntry {
  date: string;
  text: string;
}

export interface Client {
  id: string;
  name: string;
  site: string;
  industry: string;
  location: string;
  step: 1 | 2 | 3 | 4 | 5;
  profile: { offer: string; audience: string; goals: string[]; constraints: string[] };
  evidence: Evidence[];
  pageMap: PageMapRow[];
  work: WorkItem[];
  history: HistoryEntry[];
  confirmedAt?: string;
  profileSource?: string;
  noActionReason?: string;
}

export const STEPS = [
  { n: 1, title: "Confirm business facts", short: "Business" },
  { n: 3, title: "Research customer needs", short: "Research" },
  { n: 2, title: "Review the site", short: "Site review" },
  { n: 4, title: "Choose the next changes", short: "Action plan" },
  { n: 5, title: "Verify & report", short: "Verify & report" },
] as const;

/** Work that is client-facing must be approved by an operator before it can be implemented. */
export function canImplement(item: WorkItem) {
  return item.status === "approved";
}

export function stageBlock(c: Client, step: number): string {
  if (step === 1) {
    const missing = [
      !c.site.trim() && "website",
      !c.profile.offer.trim() && "offer",
      !c.profile.audience.trim() && "audience",
      !c.confirmedAt && "business confirmation",
    ].filter(Boolean);
    return missing.length ? `Add ${missing.join(", ")} to continue.` : "";
  }
  if (step === 3 && !c.pageMap.length)
    return "Save a research topic and page decision to continue.";
  if (step === 2 && !c.evidence.length)
    return "Record a manual finding or check, including its source and scope.";
  if (step === 4 && !c.work.some((w) => w.status === "approved" || w.status === "done")) {
    if (
      c.noActionReason?.trim() &&
      c.work.every((w) => w.status === "declined" || Boolean(w.deferredReason))
    )
      return "";
    return "Approve a recommendation, or resolve drafts and record why no changes are needed.";
  }
  return "";
}

export function changeWorkStatus(
  c: Client,
  id: string,
  status: WorkItem["status"],
  note = "",
): Client {
  return {
    ...c,
    work: c.work.map((w) => {
      if (w.id !== id) return w;
      if (status === "done") {
        if (!canImplement(w) || !note.trim())
          throw new Error("Approve this work and record implementation evidence first.");
        return {
          ...w,
          status,
          implementation: { date: new Date().toISOString(), note: note.trim() },
        };
      }
      if (w.status === "done")
        throw new Error("Implemented work cannot be reset through approval.");
      return { ...w, status, deferredReason: "" };
    }),
  };
}

export function verifyWork(c: Client, id: string, note: string): Client {
  return {
    ...c,
    work: c.work.map((w) => {
      if (w.id !== id) return w;
      if (!w.implementation || !note.trim())
        throw new Error("Record implementation evidence and a fresh manual check first.");
      return {
        ...w,
        verification: {
          date: new Date().toISOString(),
          note: note.trim(),
          method: "manual" as const,
        },
      };
    }),
  };
}

export function nextDecision(c: Client): string {
  const blocked = stageBlock(c, c.step);
  if (blocked) return blocked;
  const drafts = c.work.filter((w) => w.status === "draft").length;
  if (drafts) return `Approve or decline ${drafts} drafted item(s)`;
  const low = c.evidence.filter((e) => e.confidence === "low").length;
  switch (c.step) {
    case 1:
      return "Continue to research";
    case 2:
      return low
        ? `Review ${low} low-confidence finding(s)`
        : "Prepare recommendations from the review";
    case 3:
      return "Continue to site review";
    case 4:
      return c.noActionReason && !c.work.length
        ? "Continue to the report"
        : "Move approved work to implementation";
    default: {
      const open = c.work.filter((w) => canImplement(w) && w.status !== "done").length;
      return open
        ? `Record implementation for ${open} approved item(s)`
        : "Review verification evidence and export the report";
    }
  }
}

export const uid = () => Math.random().toString(36).slice(2, 10);
export const nowLabel = () =>
  new Date().toLocaleString(undefined, {
    month: "short",
    year: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const KEY = "ova-clients-v1";
const EMPTY: Client[] = [];
let cache: Client[] | null = null;
let cachedRaw: string | null = null;
const listeners = new Set<() => void>();

// Default missing fields on read only. passthrough preserves unknown legacy fields.
const record = z.object({ id: z.string() }).passthrough();
const schema = record.extend({
  name: z.string().default("Unnamed client"),
  site: z.string().default(""),
  industry: z.string().default(""),
  location: z.string().default(""),
  step: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]).default(1),
  profile: z
    .object({
      offer: z.string().default(""),
      audience: z.string().default(""),
      goals: z.array(z.string()).default([]),
      constraints: z.array(z.string()).default([]),
    })
    .passthrough()
    .default({}),
  evidence: z
    .array(
      record.extend({
        claim: z.string(),
        source: z.enum(["Search Console", "GA4", "Site check", "Operator", "Client brief"]),
        collected: z.string().default("Date not recorded"),
        confidence: z.enum(["high", "medium", "low"]).default("low"),
        detail: z.string().default(""),
      }),
    )
    .default([]),
  pageMap: z
    .array(
      record.extend({
        query: z.string(),
        intent: z.string().default(""),
        page: z.string().default(""),
        status: z.enum(["covered", "weak", "missing"]).default("missing"),
        impressions: z.number().default(0),
      }),
    )
    .default([]),
  work: z
    .array(
      record.extend({
        title: z.string(),
        why: z.string().default(""),
        evidenceIds: z.array(z.string()).default([]),
        effort: z.enum(["small", "medium", "large"]).default("medium"),
        clientFacing: z.boolean().default(true),
        status: z.enum(["draft", "approved", "declined", "done"]).default("draft"),
      }),
    )
    .default([]),
  history: z.array(z.object({ date: z.string(), text: z.string() }).passthrough()).default([]),
});
export function parseClients(raw: string): Client[] {
  return z.array(schema).parse(JSON.parse(raw)) as Client[];
}

function read(): Client[] {
  try {
    const raw = localStorage.getItem(KEY) || "[]";
    if (cache && cachedRaw === raw) return cache;
    cache = parseClients(raw);
    cachedRaw = raw;
  } catch {
    throw new Error(
      "Saved client data could not be read. It has not been changed. Export a browser backup before repairing the record.",
    );
  }
  return cache!;
}

export function saveClients(next: Client[]) {
  const raw = JSON.stringify(next);
  localStorage.setItem(KEY, raw);
  cachedRaw = raw;
  cache = next;
  listeners.forEach((l) => l());
}

export function useClients(): Client[] {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      const sync = (event: StorageEvent) => {
        if (event.key === KEY || event.key === null) l();
      };
      window.addEventListener("storage", sync);
      return () => {
        listeners.delete(l);
        window.removeEventListener("storage", sync);
      };
    },
    read,
    () => EMPTY,
  );
}

export function addClient(
  c: Omit<Client, "id" | "step" | "evidence" | "pageMap" | "work" | "history" | "profile">,
) {
  const client: Client = {
    ...c,
    id: uid(),
    step: 1,
    profile: { offer: "", audience: "", goals: [], constraints: [] },
    evidence: [],
    pageMap: [],
    work: [],
    history: [{ date: nowLabel(), text: "Client added" }],
  };
  saveClients([client, ...read()]);
  return client;
}

export function updateClient(id: string, fn: (c: Client) => Client, logText?: string) {
  saveClients(
    read().map((c) => {
      if (c.id !== id) return c;
      const n = fn(c);
      return logText ? { ...n, history: [{ date: nowLabel(), text: logText }, ...n.history] } : n;
    }),
  );
}

export function deleteClient(id: string) {
  saveClients(read().filter((c) => c.id !== id));
}
