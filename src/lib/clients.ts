// Workspace data, saved in this browser only (localStorage). Swap for real storage later.
import { useSyncExternalStore } from "react";

export type Confidence = "high" | "medium" | "low";
export type Source = "Search Console" | "GA4" | "Site check" | "Operator" | "Client brief";
export const SOURCES: Source[] = ["Search Console", "GA4", "Site check", "Operator", "Client brief"];

export interface Evidence {
  id: string;
  claim: string;
  source: Source;
  collected: string;
  confidence: Confidence;
  detail: string;
}

export interface PageMapRow {
  id: string;
  query: string;
  intent: string;
  page: string;
  status: "covered" | "weak" | "missing";
  impressions: number;
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
}

export const STEPS = [
  { n: 1, title: "Understand the business", short: "Business" },
  { n: 2, title: "Check evidence", short: "Evidence" },
  { n: 3, title: "Research and map pages", short: "Research" },
  { n: 4, title: "Choose and approve work", short: "Approve" },
  { n: 5, title: "Implement, verify, and report", short: "Report" },
] as const;

/** Work that is client-facing must be approved by an operator before it can be implemented. */
export function canImplement(item: WorkItem) {
  return item.status === "approved" || (!item.clientFacing && item.status !== "declined" && item.status !== "draft");
}

export function nextDecision(c: Client): string {
  const drafts = c.work.filter((w) => w.status === "draft").length;
  if (drafts) return `Approve or decline ${drafts} drafted item(s)`;
  const low = c.evidence.filter((e) => e.confidence === "low").length;
  switch (c.step) {
    case 1: return c.profile.offer && c.profile.audience ? "Profile filled in — move on to evidence" : "Confirm offer, audience and goals";
    case 2: return !c.evidence.length ? "Add the first findings" : low ? `Confirm ${low} low-confidence finding(s)` : "Move on to research";
    case 3: return c.pageMap.length ? "Draft work from the page map" : "Map key searches to pages";
    case 4: return c.work.length ? "Move approved work to implementation" : "Draft the first piece of work";
    default: {
      const open = c.work.filter((w) => canImplement(w) && w.status !== "done").length;
      return open ? `Finish and verify ${open} approved item(s)` : "Review and send the report";
    }
  }
}

export const uid = () => Math.random().toString(36).slice(2, 10);
export const nowLabel = () => new Date().toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

const KEY = "ova-clients-v1";
const EMPTY: Client[] = [];
let cache: Client[] | null = null;
const listeners = new Set<() => void>();

function read(): Client[] {
  if (cache) return cache;
  try { cache = JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { cache = []; }
  return cache!;
}

export function saveClients(next: Client[]) {
  cache = next;
  localStorage.setItem(KEY, JSON.stringify(next));
  listeners.forEach((l) => l());
}

export function useClients(): Client[] {
  return useSyncExternalStore(
    (l) => { listeners.add(l); return () => listeners.delete(l); },
    read,
    () => EMPTY,
  );
}

export function addClient(c: Omit<Client, "id" | "step" | "evidence" | "pageMap" | "work" | "history" | "profile">) {
  const client: Client = {
    ...c, id: uid(), step: 1,
    profile: { offer: "", audience: "", goals: [], constraints: [] },
    evidence: [], pageMap: [], work: [],
    history: [{ date: nowLabel(), text: "Client added" }],
  };
  saveClients([client, ...read()]);
  return client;
}

export function updateClient(id: string, fn: (c: Client) => Client, logText?: string) {
  saveClients(read().map((c) => {
    if (c.id !== id) return c;
    const n = fn(c);
    return logText ? { ...n, history: [{ date: nowLabel(), text: logText }, ...n.history] } : n;
  }));
}

export function deleteClient(id: string) {
  saveClients(read().filter((c) => c.id !== id));
}
