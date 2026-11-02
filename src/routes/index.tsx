import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Plus, Users, Search } from "lucide-react";
import { WorkspaceShell } from "@/components/workspace-shell";
import { addClient, nextDecision, STEPS, useClients, stageBlock } from "@/lib/clients";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Clients — OmniVisibility" },
      {
        name: "description",
        content: "Evidence, recommendations and verified work for every client.",
      },
    ],
  }),
  component: Home,
});
function Home() {
  const clients = useClients();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [f, setF] = useState({ name: "", site: "", industry: "", location: "" });
  const shown = clients
    .filter((c) => `${c.name} ${c.site}`.toLowerCase().includes(query.toLowerCase()))
    .sort(
      (a, b) =>
        Number(Boolean(stageBlock(b, b.step))) - Number(Boolean(stageBlock(a, a.step))) ||
        (Date.parse(b.history[0]?.date || "") || 0) - (Date.parse(a.history[0]?.date || "") || 0),
    );
  return (
    <WorkspaceShell>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Your workspace</p>
          <h1>Clients</h1>
          <p>One clear next step for every business.</p>
        </div>
        <button className="primary" onClick={() => setOpen(!open)}>
          <Plus size={17} />
          {open ? "Cancel" : "Add client"}
        </button>
      </div>
      {open && (
        <form
          className="panel form-grid"
          onSubmit={(e) => {
            e.preventDefault();
            try {
              const c = addClient({ ...f, name: f.name.trim() });
              navigate({
                to: "/clients/$clientId",
                params: { clientId: c.id },
                search: { step: 1 },
              });
            } catch {
              setError("Client could not be saved. Check browser storage and try again.");
            }
          }}
        >
          <div className="span-all">
            <h2>New client</h2>
            <p>Start with what you know. You can complete the profile later.</p>
          </div>
          {(
            [
              ["name", "Business name"],
              ["site", "Website"],
              ["industry", "Industry"],
              ["location", "Location / service area"],
            ] as const
          ).map(([key, label]) => (
            <label key={key}>
              {label}
              <input
                autoFocus={key === "name"}
                required={key === "name"}
                value={f[key]}
                onChange={(e) => setF({ ...f, [key]: e.target.value })}
              />
            </label>
          ))}
          <div className="span-all actions">
            <button className="primary">
              Create client <ArrowRight size={16} />
            </button>
            <span role="alert">{error}</span>
          </div>
        </form>
      )}
      <section className="panel client-list">
        <div className="section-head">
          <h2>
            All clients <span className="count">{clients.length}</span>
          </h2>
          {clients.length > 0 && (
            <label className="search">
              <Search size={16} />
              <input
                aria-label="Search clients"
                placeholder="Find a client…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
          )}
        </div>
        {!clients.length ? (
          <div className="empty">
            <span className="empty-icon">
              <Users size={26} />
            </span>
            <h2>A workspace for your next client</h2>
            <p>
              Add a client to confirm business facts, gather evidence,
              <br />
              and track work through to verification.
            </p>
            <button className="primary" onClick={() => setOpen(true)}>
              <Plus size={16} /> Add your first client
            </button>
            <small>No connections required to start.</small>
          </div>
        ) : (
          <div className="client-table">
            <div className="client-row table-labels">
              <span>Client / website</span>
              <span>Current stage</span>
              <span>Next action</span>
              <span>Last activity / sources</span>
            </div>
            {shown.map((c) => (
              <div className="client-row" key={c.id}>
                <div>
                  <Link
                    className="client-name"
                    to="/clients/$clientId"
                    params={{ clientId: c.id }}
                    search={{ step: c.step }}
                  >
                    {c.name}
                  </Link>
                  <p className="wrap">{c.site || "Website not added"}</p>
                </div>
                <div>
                  <span className="badge">{STEPS.find((s) => s.n === c.step)?.short}</span>
                </div>
                <Link
                  className="next-link"
                  to="/clients/$clientId"
                  params={{ clientId: c.id }}
                  search={{ step: c.step }}
                >
                  {nextDecision(c)}
                  <ArrowRight size={16} />
                </Link>
                <div>
                  <small>{c.history[0]?.date || "No activity recorded"}</small>
                  <p>Sources not connected</p>
                </div>
              </div>
            ))}
            {!shown.length && <div className="empty">No clients match “{query}”.</div>}
          </div>
        )}
      </section>
      <p className="footnote">
        Client data stays in this browser. Work and measured outcomes are tracked separately.
      </p>
    </WorkspaceShell>
  );
}
