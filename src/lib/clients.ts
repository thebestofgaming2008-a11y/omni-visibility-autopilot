// Sample workspace data. Replace with real storage when a backend is connected.

export type Confidence = "high" | "medium" | "low";
export type Source = "Search Console" | "GA4" | "Site check" | "Operator" | "Client brief";

export interface Evidence {
  id: string;
  claim: string;
  source: Source;
  collected: string;
  confidence: Confidence;
  detail: string;
}

export interface PageMapRow {
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
  nextDecision: string;
  gsc: "connected" | "not connected";
  ga4: "connected" | "not connected" | "skipped";
  lastCheck: string;
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

export const clients: Client[] = [
  {
    id: "harbor-dental",
    name: "Harbor Dental Studio",
    site: "harbordental.example",
    industry: "Dental clinic",
    location: "Portland, OR",
    step: 4,
    nextDecision: "Approve 2 drafted recommendations before sharing with the client",
    gsc: "connected",
    ga4: "connected",
    lastCheck: "Today, 08:10",
    profile: {
      offer: "General and cosmetic dentistry, emergency appointments",
      audience: "Families and professionals within 10 miles",
      goals: ["More emergency appointment searches", "Grow Invisalign enquiries"],
      constraints: ["No medical claims without dentist review", "Site edits via their web agency"],
    },
    evidence: [
      { id: "e1", claim: "\"emergency dentist portland\" has 4,200 impressions but 0.6% CTR", source: "Search Console", collected: "Last 28 days", confidence: "high", detail: "Average position 7.4. Title on /emergency does not mention same-day care." },
      { id: "e2", claim: "Invisalign page has no indexed version", source: "Search Console", collected: "Today", confidence: "high", detail: "URL inspection: 'Crawled – currently not indexed'." },
      { id: "e3", claim: "Organic sessions to /emergency fell 18% month over month", source: "GA4", collected: "Last 28 days", confidence: "medium", detail: "Seasonality not ruled out; only 14 months of history." },
      { id: "e4", claim: "Homepage title is duplicated on 3 service pages", source: "Site check", collected: "Today", confidence: "high", detail: "Read-only crawl of 46 pages." },
    ],
    pageMap: [
      { query: "emergency dentist portland", intent: "Urgent local", page: "/emergency", status: "weak", impressions: 4200 },
      { query: "invisalign portland", intent: "Commercial", page: "/invisalign", status: "weak", impressions: 2100 },
      { query: "teeth whitening cost", intent: "Research", page: "—", status: "missing", impressions: 1300 },
      { query: "family dentist near me", intent: "Local", page: "/", status: "covered", impressions: 5800 },
    ],
    work: [
      { id: "w1", title: "Rewrite /emergency title and intro for same-day care", why: "High impressions, low CTR on core urgent query.", evidenceIds: ["e1", "e3"], effort: "small", clientFacing: true, status: "draft", brief: "Title: 'Emergency Dentist in Portland — Same-Day Appointments'. Lead with hours and phone. Keep claims reviewed by Dr. Lee." },
      { id: "w2", title: "Fix indexing on /invisalign", why: "Page not indexed; thin content suspected.", evidenceIds: ["e2"], effort: "medium", clientFacing: true, status: "draft", brief: "Expand to ~800 words: process, cost range, FAQs. Request reindex after publish." },
      { id: "w3", title: "Unique titles for 3 service pages", why: "Duplicate titles dilute relevance.", evidenceIds: ["e4"], effort: "small", clientFacing: false, status: "approved" },
    ],
    history: [
      { date: "Oct 30", text: "Search Console evidence refreshed automatically" },
      { date: "Oct 28", text: "Page map updated: 4 queries mapped" },
      { date: "Oct 21", text: "Business profile confirmed with client" },
    ],
  },
  {
    id: "northwind-bikes",
    name: "Northwind Bikes",
    site: "northwindbikes.example",
    industry: "Bike shop & repairs",
    location: "Denver, CO",
    step: 2,
    nextDecision: "Review 1 low-confidence finding before research",
    gsc: "connected",
    ga4: "skipped",
    lastCheck: "Yesterday, 17:42",
    profile: {
      offer: "E-bike sales, servicing, rentals",
      audience: "Commuters and weekend riders",
      goals: ["Rank for e-bike repair", "Rental bookings in spring"],
      constraints: ["Shopify site, limited template control"],
    },
    evidence: [
      { id: "e1", claim: "Repair pages get 60% of organic clicks", source: "Search Console", collected: "Last 28 days", confidence: "high", detail: "312 of 520 clicks." },
      { id: "e2", claim: "Rental page may be blocked by robots rules", source: "Site check", collected: "Yesterday", confidence: "low", detail: "Pattern match only; needs manual confirmation." },
    ],
    pageMap: [],
    work: [],
    history: [{ date: "Nov 1", text: "Search Console connected" }],
  },
  {
    id: "lumen-law",
    name: "Lumen Law Group",
    site: "lumenlaw.example",
    industry: "Employment law",
    location: "Austin, TX",
    step: 1,
    nextDecision: "Confirm services and target areas with client",
    gsc: "not connected",
    ga4: "not connected",
    lastCheck: "Not run yet",
    profile: { offer: "Employment law for employees", audience: "", goals: [], constraints: ["Bar advertising rules apply"] },
    evidence: [],
    pageMap: [],
    work: [],
    history: [{ date: "Nov 2", text: "Client added" }],
  },
  {
    id: "fernway-cafe",
    name: "Fernway Café",
    site: "fernway.example",
    industry: "Café & bakery",
    location: "Seattle, WA",
    step: 5,
    nextDecision: "Send October report after verifying menu page changes",
    gsc: "connected",
    ga4: "connected",
    lastCheck: "Today, 07:55",
    profile: { offer: "Coffee, pastries, catering", audience: "Locals and office catering", goals: ["Catering enquiries"], constraints: [] },
    evidence: [
      { id: "e1", claim: "Catering page impressions up 42% since rewrite", source: "Search Console", collected: "Last 28 days", confidence: "medium", detail: "Only 3 weeks post-change; early signal." },
    ],
    pageMap: [{ query: "catering seattle cafe", intent: "Commercial", page: "/catering", status: "covered", impressions: 900 }],
    work: [
      { id: "w1", title: "Rewrite catering page", why: "No page matched catering intent.", evidenceIds: ["e1"], effort: "medium", clientFacing: true, status: "done" },
    ],
    history: [{ date: "Oct 12", text: "Catering page change verified live" }],
  },
];

export function getClient(id: string) {
  return clients.find((c) => c.id === id);
}

/** Work that is client-facing must be approved by an operator before it can be implemented. */
export function canImplement(item: WorkItem) {
  return item.status === "approved" || (!item.clientFacing && item.status !== "declined" && item.status !== "draft");
}
