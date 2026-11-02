import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { WorkspaceShell } from "@/components/workspace-shell";
import { addClient, nextDecision, STEPS, useClients } from "@/lib/clients";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "All clients — OmniVisibility Autopilot" },
      { name: "description", content: "Every client's visibility workflow, current step, and next decision in one calm workspace." },
      { property: "og:title", content: "All clients — OmniVisibility Autopilot" },
      { property: "og:description", content: "Every client's visibility workflow, current step, and next decision." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Home,
});

const input = "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm";

function Home() {
  const clients = useClients();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ name: "", site: "", industry: "", location: "" });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.name.trim()) return;
    const c = addClient(f);
    setF({ name: "", site: "", industry: "", location: "" });
    navigate({ to: "/clients/$clientId", params: { clientId: c.id }, search: { step: 1 } });
  };

  return (
    <WorkspaceShell>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">All clients</p>
          <h1 className="mt-2 font-display text-3xl font-semibold">
            {clients.length ? `${clients.length} client${clients.length > 1 ? "s" : ""} in your workspace` : "Add your first client"}
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">Nothing goes to a client or a live site until you approve it. Saved in this browser only.</p>
        </div>
        <button onClick={() => setOpen((o) => !o)} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">
          {open ? "Cancel" : "Add client"}
        </button>
      </div>

      {open && (
        <form onSubmit={submit} className="mb-6 grid gap-3 rounded-2xl border border-border bg-card p-5 sm:grid-cols-2">
          <input required className={input} placeholder="Business name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
          <input className={input} placeholder="Website (e.g. example.com)" value={f.site} onChange={(e) => setF({ ...f, site: e.target.value })} />
          <input className={input} placeholder="Industry" value={f.industry} onChange={(e) => setF({ ...f, industry: e.target.value })} />
          <input className={input} placeholder="Location" value={f.location} onChange={(e) => setF({ ...f, location: e.target.value })} />
          <button className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground sm:col-span-2">Create client</button>
        </form>
      )}

      <div className="grid gap-4">
        {!clients.length && !open && (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">No clients yet. Click “Add client” to start.</div>
        )}
        {clients.map((c) => (
          <Link key={c.id} to="/clients/$clientId" params={{ clientId: c.id }} search={{ step: c.step }}
            className="group rounded-2xl border border-border bg-card p-6 transition hover:border-ring hover:shadow-sm">
            <h2 className="font-display text-xl font-semibold">{c.name}</h2>
            <p className="text-sm text-muted-foreground">{[c.site, c.industry, c.location].filter(Boolean).join(" · ")}</p>
            <ol className="mt-5 grid grid-cols-5 gap-2">
              {STEPS.map((s) => (
                <li key={s.n}>
                  <div className={`h-1.5 rounded-full ${s.n < c.step ? "bg-primary" : s.n === c.step ? "bg-primary/50" : "bg-muted"}`} />
                  <p className={`mt-1.5 text-xs ${s.n === c.step ? "font-semibold text-foreground" : "text-muted-foreground"}`}>{s.short}</p>
                </li>
              ))}
            </ol>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-accent px-4 py-3">
              <p className="text-sm text-accent-foreground"><span className="font-semibold">Next decision:</span> {nextDecision(c)}</p>
              <span className="text-sm font-semibold text-primary group-hover:underline">Open workflow →</span>
            </div>
          </Link>
        ))}
      </div>
    </WorkspaceShell>
  );
}
