import { createFileRoute, Link } from "@tanstack/react-router";
import { WorkspaceShell } from "@/components/workspace-shell";
import { clients, STEPS } from "@/lib/clients";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "All clients — OmniVisibility Autopilot" },
      { name: "description", content: "Every client's visibility workflow, current step, and next decision in one calm workspace." },
      { property: "og:title", content: "All clients — OmniVisibility Autopilot" },
      { property: "og:description", content: "Every client's visibility workflow, current step, and next decision." },
    ],
  }),
  component: Home,
});

function Home() {
  const needsYou = clients.filter((c) => c.work.some((w) => w.status === "draft") || c.step === 1);
  return (
    <WorkspaceShell>
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">All clients</p>
        <h1 className="mt-2 font-display text-3xl font-semibold">Good afternoon. {needsYou.length} clients are waiting on a decision.</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">Evidence is collected and drafts are prepared automatically. Nothing goes to a client or a live site until you approve it.</p>
      </div>

      <div className="grid gap-4">
        {clients.map((c) => (
          <Link key={c.id} to="/clients/$clientId" params={{ clientId: c.id }} search={{ step: c.step }}
            className="group rounded-2xl border border-border bg-card p-6 transition hover:border-ring hover:shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-xl font-semibold">{c.name}</h2>
                <p className="text-sm text-muted-foreground">{c.site} · {c.industry} · {c.location}</p>
              </div>
              <div className="flex gap-2 text-xs">
                <span className={`rounded-full px-2.5 py-1 ${c.gsc === "connected" ? "bg-success-soft text-success" : "bg-warning-soft text-warning"}`}>Search Console {c.gsc}</span>
                {c.ga4 === "connected" && <span className="rounded-full bg-secondary px-2.5 py-1 text-muted-foreground">GA4</span>}
              </div>
            </div>
            <ol className="mt-5 grid grid-cols-5 gap-2">
              {STEPS.map((s) => (
                <li key={s.n}>
                  <div className={`h-1.5 rounded-full ${s.n < c.step ? "bg-primary" : s.n === c.step ? "bg-primary/50" : "bg-muted"}`} />
                  <p className={`mt-1.5 text-xs ${s.n === c.step ? "font-semibold text-foreground" : "text-muted-foreground"}`}>{s.short}</p>
                </li>
              ))}
            </ol>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-accent px-4 py-3">
              <p className="text-sm text-accent-foreground"><span className="font-semibold">Next decision:</span> {c.nextDecision}</p>
              <span className="text-sm font-semibold text-primary group-hover:underline">Open workflow →</span>
            </div>
          </Link>
        ))}
      </div>
    </WorkspaceShell>
  );
}
