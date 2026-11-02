import { createFileRoute, Link } from "@tanstack/react-router";
import { type ReactNode } from "react";
import { WorkspaceShell } from "@/components/workspace-shell";
import { canImplement, nextDecision, updateClient, useClients, STEPS, type Client, type Confidence, type WorkItem } from "@/lib/clients";

export const Route = createFileRoute("/clients/$clientId")({
  validateSearch: (s: Record<string, unknown>): { step?: number } => {
    const n = Number(s["step"]);
    return n >= 1 && n <= 5 ? { step: n } : {};
  },
  head: () => ({
    meta: [
      { title: "Client workflow — OmniVisibility Autopilot" },
      { name: "description", content: "Five-step visibility workflow: business, evidence, research, approval, and reporting." },
      { property: "og:title", content: "Client workflow — OmniVisibility Autopilot" },
      { property: "og:description", content: "Guided five-step visibility workflow for a client." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ClientWorkflow,
});

function ClientWorkflow() {
  const { clientId } = Route.useParams();
  const client = useClients().find((c) => c.id === clientId);
  const search = Route.useSearch();
  if (!client) return <WorkspaceShell><Link to="/" className="text-sm text-muted-foreground">← All clients</Link><p className="mt-6 text-muted-foreground">Client not found in this browser.</p></WorkspaceShell>;
  const step = search.step ?? client.step;
  const work = client.work;
  const history = client.history;
  const setStatus = (id: string, status: WorkItem["status"]) => {
    const item = work.find((i) => i.id === id);
    updateClient(client.id, (c) => ({ ...c, work: c.work.map((i) => (i.id === id ? { ...i, status } : i)) }),
      item ? `${status === "approved" ? "Approved" : status === "declined" ? "Declined" : "Marked done"}: ${item.title}` : undefined);
  };
  const current = STEPS[step - 1] ?? STEPS[0];

  return (
    <WorkspaceShell>
      <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">← All clients</Link>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold">{client.name}</h1>
          <p className="text-muted-foreground">{[client.site, client.industry, client.location].filter(Boolean).join(" · ")}</p>
        </div>
        {client.step < 5 && <button onClick={() => updateClient(client.id, (c) => ({ ...c, step: (c.step + 1) as Client["step"] }), `Moved to step ${client.step + 1}`)} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Complete step {client.step}</button>}
      </div>

      <nav className="mt-8 grid gap-2 sm:grid-cols-5">
        {STEPS.map((s) => {
          const active = s.n === step;
          return (
            <Link key={s.n} to="/clients/$clientId" params={{ clientId: client.id }} search={{ step: s.n }}
              className={`rounded-xl border p-3 text-left transition ${active ? "border-primary bg-card shadow-sm" : "border-border hover:bg-card"}`}>
              <span className={`grid h-6 w-6 place-items-center rounded-full text-xs font-semibold ${s.n < client.step ? "bg-primary text-primary-foreground" : active ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"}`}>
                {s.n < client.step ? "✓" : s.n}
              </span>
              <p className={`mt-2 text-sm ${active ? "font-semibold" : "text-muted-foreground"}`}>{s.title}</p>
            </Link>
          );
        })}
      </nav>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_280px]">
        <section>
          <h2 className="font-display text-2xl font-semibold">{step}. {current.title}</h2>
          <div className="mt-5 grid gap-4">
            {step === 1 && <StepBusiness client={client} />}
            {step === 2 && <StepEvidence client={client} />}
            {step === 3 && <StepResearch client={client} />}
            {step === 4 && <StepApprove client={client} work={work} setStatus={setStatus} />}
            {step === 5 && <StepReport client={client} work={work} setStatus={setStatus} />}
          </div>
        </section>
        <aside className="grid content-start gap-4">
          <Card>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">Next decision</p>
            <p className="mt-2 text-sm">{nextDecision(client)}</p>
          </Card>
          <Card>
            <p className="text-sm font-semibold">Work history</p>
            <ul className="mt-3 grid gap-2.5">
              {history.map((h, i) => (
                <li key={i} className="text-sm"><span className="text-xs text-muted-foreground">{h.date}</span><br />{h.text}</li>
              ))}
            </ul>
          </Card>
        </aside>
      </div>
    </WorkspaceShell>
  );
}

function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-border bg-card p-5 ${className}`}>{children}</div>;
}

function SourceRow({ label, note, state }: { label: string; note: string; state: string }) {
  const ok = state === "connected";
  return (
    <div className="mt-3 flex items-start justify-between gap-2 text-sm">
      <div><p>{label}</p><p className="text-xs text-muted-foreground">{note}</p></div>
      <span className={`rounded-full px-2 py-0.5 text-xs ${ok ? "bg-success-soft text-success" : "bg-muted text-muted-foreground"}`}>{state}</span>
    </div>
  );
}

const confStyle: Record<Confidence, string> = {
  high: "bg-success-soft text-success",
  medium: "bg-info-soft text-foreground",
  low: "bg-warning-soft text-warning",
};

function Empty({ children }: { children: ReactNode }) {
  return <Card className="border-dashed text-sm text-muted-foreground">{children}</Card>;
}

function StepBusiness({ client }: { client: Client }) {
  const p = client.profile;
  const Field = ({ label, value }: { label: string; value: ReactNode }) => (
    <div><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p><div className="mt-1 text-sm">{value || <span className="text-warning">Not confirmed yet</span>}</div></div>
  );
  const list = (xs: string[]) => (xs.length ? <ul className="list-disc pl-5">{xs.map((x) => <li key={x}>{x}</li>)}</ul> : null);
  return (
    <>
      <p className="text-muted-foreground">Confirm what the business sells, who it serves, and what success means before looking at data.</p>
      <Card className="grid gap-5 sm:grid-cols-2">
        <Field label="Offer" value={p.offer} />
        <Field label="Audience" value={p.audience} />
        <Field label="Goals" value={list(p.goals)} />
        <Field label="Constraints" value={list(p.constraints)} />
      </Card>
      <p className="text-xs text-muted-foreground">Source: operator notes and client brief.</p>
    </>
  );
}

function StepEvidence({ client }: { client: Client }) {
  if (!client.evidence.length) return <Empty>No evidence yet. Connect Search Console and a read-only site check will run automatically.</Empty>;
  return (
    <>
      <p className="text-muted-foreground">Collected automatically. Each finding shows where it came from and how sure we are.</p>
      {client.evidence.map((e) => (
        <Card key={e.id}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <p className="font-semibold">{e.claim}</p>
            <span className={`rounded-full px-2.5 py-0.5 text-xs ${confStyle[e.confidence]}`}>{e.confidence} confidence</span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">{e.detail}</p>
          <p className="mt-3 text-xs text-muted-foreground">{e.source} · {e.collected}</p>
          {e.confidence === "low" && <p className="mt-3 rounded-lg bg-warning-soft px-3 py-2 text-xs text-warning">Uncertain — confirm manually before using this in a recommendation.</p>}
        </Card>
      ))}
    </>
  );
}

function StepResearch({ client }: { client: Client }) {
  if (!client.pageMap.length) return <Empty>Research hasn't started. Finish reviewing evidence first.</Empty>;
  const tone = { covered: "bg-success-soft text-success", weak: "bg-warning-soft text-warning", missing: "bg-muted text-muted-foreground" };
  return (
    <>
      <p className="text-muted-foreground">Which searches matter and which page should answer each one.</p>
      <Card className="overflow-x-auto p-0">
        <table className="w-full text-left text-sm">
          <thead className="text-xs text-muted-foreground"><tr>{["Search", "Intent", "Page", "Coverage", "Impressions"].map((h) => <th key={h} className="px-5 py-3 font-medium">{h}</th>)}</tr></thead>
          <tbody>
            {client.pageMap.map((r) => (
              <tr key={r.id} className="border-t border-border">
                <td className="px-5 py-3 font-medium">{r.query}</td><td className="px-5 py-3">{r.intent}</td><td className="px-5 py-3">{r.page}</td>
                <td className="px-5 py-3"><span className={`rounded-full px-2 py-0.5 text-xs ${tone[r.status]}`}>{r.status}</span></td>
                <td className="px-5 py-3">{r.impressions.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <p className="text-xs text-muted-foreground">Impressions from Search Console, last 28 days.</p>
    </>
  );
}

function StepApprove({ client, work, setStatus }: { client: Client; work: WorkItem[]; setStatus: (id: string, s: WorkItem["status"]) => void }) {
  if (!work.length) return <Empty>No drafted work yet. Drafts appear here once research is mapped.</Empty>;
  return (
    <>
      <p className="text-muted-foreground">Drafts are prepared for you. Client-facing work needs your approval before it goes anywhere.</p>
      {work.map((w) => (
        <Card key={w.id}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <p className="font-semibold">{w.title}</p>
            <div className="flex gap-2 text-xs">
              {w.clientFacing && <span className="rounded-full bg-info-soft px-2.5 py-0.5">Client-facing</span>}
              <span className="rounded-full bg-secondary px-2.5 py-0.5 text-muted-foreground">{w.effort} effort</span>
              <span className={`rounded-full px-2.5 py-0.5 ${w.status === "approved" || w.status === "done" ? "bg-success-soft text-success" : w.status === "declined" ? "bg-muted text-muted-foreground" : "bg-warning-soft text-warning"}`}>{w.status}</span>
            </div>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">{w.why}</p>
          {w.brief && <div className="mt-3 rounded-lg bg-muted p-3 text-sm"><p className="text-xs font-semibold text-muted-foreground">Content brief (draft)</p><p className="mt-1">{w.brief}</p></div>}
          <p className="mt-3 text-xs text-muted-foreground">Based on: {w.evidenceIds.map((id) => client.evidence.find((e) => e.id === id)?.claim).filter(Boolean).join(" · ")}</p>
          {w.status === "draft" && (
            <div className="mt-4 flex gap-2">
              <button onClick={() => setStatus(w.id, "approved")} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">Approve</button>
              <button onClick={() => setStatus(w.id, "declined")} className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted">Decline</button>
            </div>
          )}
        </Card>
      ))}
    </>
  );
}

function StepReport({ client, work, setStatus }: { client: Client; work: WorkItem[]; setStatus: (id: string, s: WorkItem["status"]) => void }) {
  const ready = work.filter((w) => canImplement(w) || w.status === "done");
  const waiting = work.filter((w) => w.status === "draft");
  return (
    <>
      <p className="text-muted-foreground">Only approved work appears here. Mark it done once it's live, then verify with fresh evidence.</p>
      {ready.length === 0 && <Empty>Nothing approved yet.</Empty>}
      {ready.map((w) => (
        <Card key={w.id} className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-medium">{w.title}</p>
          {w.status === "done"
            ? <span className="rounded-full bg-success-soft px-2.5 py-0.5 text-xs text-success">Done · verify in next check</span>
            : <button onClick={() => setStatus(w.id, "done")} className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-muted">Mark done</button>}
        </Card>
      ))}
      {waiting.length > 0 && <p className="text-xs text-warning">{waiting.length} item(s) still waiting for approval in step 4.</p>}
      <Card>
        <p className="text-sm font-semibold">Report draft</p>
        <p className="mt-2 text-sm text-muted-foreground">
          {client.name}: {work.filter((w) => w.status === "done").length} change(s) completed. {client.evidence[0]?.claim ?? "No evidence collected yet."}
        </p>
        <p className="mt-3 text-xs text-muted-foreground">Review before sending — reports are never sent automatically.</p>
      </Card>
    </>
  );
}
