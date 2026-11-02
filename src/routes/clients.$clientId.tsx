import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  CircleAlert,
  CircleCheck,
  Lightbulb,
  Link2,
  Plus,
  ShieldCheck,
  Download,
} from "lucide-react";
import { WorkspaceShell } from "@/components/workspace-shell";
import { downloadFile } from "@/lib/download";
import { reportText } from "@/lib/report";
import {
  changeWorkStatus,
  verifyWork,
  stageBlock,
  nextDecision,
  updateClient,
  useClients,
  STEPS,
  uid,
  type Client,
  type Evidence,
  type WorkItem,
} from "@/lib/clients";

export const Route = createFileRoute("/clients/$clientId")({
  validateSearch: (s: Record<string, unknown>): { step?: number } => {
    const n = Number(s["step"]);
    return Number.isInteger(n) && n >= 1 && n <= 5 ? { step: n } : {};
  },
  head: () => ({
    meta: [
      { title: "Client workspace — OmniVisibility" },
      {
        name: "description",
        content: "Business, research, site review, action plan, and verification.",
      },
    ],
  }),
  component: ClientWorkflow,
});
type Save = (fn: (c: Client) => Client, message: string) => boolean;
function ClientWorkflow() {
  const { clientId } = Route.useParams();
  const client = useClients().find((c) => c.id === clientId);
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  if (!client)
    return (
      <WorkspaceShell>
        <Link to="/">All clients</Link>
        <section className="panel empty">
          <h1>Client not found in this browser</h1>
          <p>Open the original browser and site address where you saved this client.</p>
        </section>
      </WorkspaceShell>
    );
  const step = search.step ?? client.step;
  const current = STEPS.find((s) => s.n === step)!;
  const index = STEPS.findIndex((s) => s.n === step);
  const reached = STEPS.findIndex((s) => s.n === client.step);
  const block = stageBlock(client, step);
  const locked = index > reached;
  const save: Save = (fn, message) => {
    try {
      updateClient(client.id, fn, message);
      setError("");
      setNotice(message);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save. Check browser storage.");
      return false;
    }
  };
  const next = STEPS[index + 1];
  return (
    <WorkspaceShell>
      <Link to="/" className="back-link">
        <ArrowLeft size={15} /> All clients
      </Link>
      <div className="page-heading client-heading">
        <div>
          <p className="eyebrow">Client workspace</p>
          <h1>{client.name}</h1>
          <p className="wrap">
            {client.site || "Website not added"}
            {client.location && ` · ${client.location}`}
          </p>
        </div>
        <span className="badge">
          <ShieldCheck size={14} />{" "}
          {client.confirmedAt ? "Business confirmed" : "Business not confirmed"}
        </span>
      </div>
      <nav aria-label="Client workflow" className="stepper">
        {STEPS.map((s, i) => (
          <Link
            key={s.n}
            to="/clients/$clientId"
            params={{ clientId }}
            search={{ step: s.n }}
            aria-current={step === s.n ? "step" : undefined}
            aria-disabled={i > reached}
            onClick={(e) => {
              if (i > reached) e.preventDefault();
              else {
                setNotice("");
                setError("");
              }
            }}
            tabIndex={i > reached ? -1 : 0}
            title={i > reached ? `Complete ${STEPS[reached]?.short} first` : s.title}
            className={`step ${step === s.n ? "active" : ""} ${i < reached ? "complete" : ""} ${i > reached ? "locked" : ""}`}
          >
            <span className="step-circle">{i < reached ? <Check size={16} /> : i + 1}</span>
            <span>
              {s.short}
              <small>
                {i < reached
                  ? "Reviewed"
                  : i === reached
                    ? "Current stage"
                    : "Complete prior stage"}
              </small>
            </span>
          </Link>
        ))}
      </nav>
      <div role="status" className={notice ? "notice" : ""}>
        {notice}
      </div>
      <div role="alert" className={error ? "error" : ""}>
        {error}
      </div>
      {locked ? (
        <section className="panel empty">
          <h2>Complete the current stage first</h2>
          <p>
            {stageBlock(client, client.step) ||
              "Continue from the current stage after reviewing your work."}
          </p>
          <Link
            className="button primary"
            to="/clients/$clientId"
            params={{ clientId }}
            search={{ step: client.step }}
          >
            Return to {STEPS[reached]?.short}
          </Link>
        </section>
      ) : (
        <div className="work-grid">
          <section className="stage-content" key={`${client.id}-${step}`}>
            <div className="section-head stage-title">
              <div>
                <p className="eyebrow">Stage {index + 1} of 5</p>
                <h2>{current.title}</h2>
              </div>
            </div>
            {step === 1 && <Business client={client} save={save} />}
            {step === 3 && <Research client={client} save={save} />}
            {step === 2 && <SiteReview client={client} save={save} />}
            {step === 4 && <ActionPlan client={client} save={save} />}
            {step === 5 && <Report client={client} save={save} />}
            {next && (
              <div className="stage-footer">
                <p>{block || `Ready to continue to ${next.short.toLowerCase()}.`}</p>
                <button
                  className="primary"
                  disabled={Boolean(block)}
                  onClick={() => {
                    if (
                      save(
                        (c) => ({ ...c, step: STEPS[Math.max(reached, index + 1)]!.n }),
                        `Reviewed ${current.short}`,
                      )
                    )
                      navigate({
                        to: "/clients/$clientId",
                        params: { clientId },
                        search: { step: next.n },
                      });
                  }}
                >
                  Continue to {next.short}
                  <ArrowRight size={16} />
                </button>
              </div>
            )}
          </section>
          <aside className="context-rail">
            <section>
              <p className="eyebrow">Next action</p>
              <h3>{nextDecision(client)}</h3>
              <p>Record the evidence, then decide what deserves action.</p>
            </section>
            <Sources />
            <section>
              <h3>Recent activity</h3>
              {client.history.length ? (
                <ol className="activity">
                  {client.history.slice(0, 6).map((h, i) => (
                    <li key={i}>
                      <span>{h.text}</span>
                      <small>{h.date}</small>
                    </li>
                  ))}
                </ol>
              ) : (
                <p>No activity recorded.</p>
              )}
              {client.history.length > 6 && (
                <details>
                  <summary>Earlier activity</summary>
                  <ol className="activity">
                    {client.history.slice(6).map((h, i) => (
                      <li key={i}>
                        {h.text}
                        <small>{h.date}</small>
                      </li>
                    ))}
                  </ol>
                </details>
              )}
            </section>
          </aside>
        </div>
      )}
    </WorkspaceShell>
  );
}
function Sources() {
  return (
    <details className="sources">
      <summary>
        <Link2 size={16} /> Source readiness <ChevronDown size={16} />
      </summary>
      <p>Search Console · Not connected</p>
      <p>GA4 · Not connected</p>
      <p>Site scanner · Not available</p>
      <small>
        This app has no connection backend. Record dated observations from your own tools, including
        their source and scope.
      </small>
    </details>
  );
}
function Empty({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="empty compact">
      <CircleAlert size={22} />
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  );
}
function Field({
  label,
  value,
  onChange,
  required = false,
  multiline = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  multiline?: boolean;
}) {
  return (
    <label>
      {label}
      {multiline ? (
        <textarea value={value} required={required} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input value={value} required={required} onChange={(e) => onChange(e.target.value)} />
      )}
    </label>
  );
}
function Business({ client, save }: { client: Client; save: Save }) {
  const [f, setF] = useState({
    name: client.name,
    site: client.site,
    industry: client.industry,
    location: client.location,
    offer: client.profile.offer,
    audience: client.profile.audience,
    goals: client.profile.goals.join("\n"),
    constraints: client.profile.constraints.join("\n"),
    source: client.profileSource || "",
  });
  const [confirmed, setConfirmed] = useState(Boolean(client.confirmedAt));
  const set = (key: keyof typeof f, value: string) => {
    setF({ ...f, [key]: value });
    setConfirmed(false);
  };
  return (
    <form
      className="panel form-grid"
      onSubmit={(e) => {
        e.preventDefault();
        save(
          (c) => ({
            ...c,
            name: f.name.trim() || c.name,
            site: f.site.trim(),
            industry: f.industry,
            location: f.location,
            profile: {
              ...c.profile,
              offer: f.offer,
              audience: f.audience,
              goals: f.goals.split("\n").filter(Boolean),
              constraints: f.constraints.split("\n").filter(Boolean),
            },
            profileSource: f.source,
            confirmedAt: confirmed ? new Date().toISOString() : "",
          }),
          confirmed ? "Business facts confirmed and saved" : "Partial business profile saved",
        );
      }}
    >
      <div className="span-all">
        <h3>The facts behind the work</h3>
        <p>Leave unknown facts blank. Save partial work at any time.</p>
      </div>
      {(
        [
          ["name", "Business name"],
          ["site", "Website"],
          ["industry", "Industry"],
          ["location", "Location / service area"],
          ["offer", "Products, services, and differentiators"],
          ["audience", "Who the business serves"],
          ["goals", "Business goals · one per line"],
          ["constraints", "Constraints · one per line"],
          ["source", "Confirmation source / client brief"],
        ] as const
      ).map(([key, label]) => (
        <Field
          key={key}
          label={label}
          value={f[key]}
          onChange={(v) => set(key, v)}
          multiline={["offer", "audience", "goals", "constraints"].includes(key)}
        />
      ))}
      <label className="check-label span-all">
        <input
          type="checkbox"
          checked={confirmed}
          disabled={!f.offer.trim() || !f.audience.trim() || !f.site.trim() || !f.source.trim()}
          onChange={(e) => setConfirmed(e.target.checked)}
        />
        I confirmed the offer, audience, and website against the source above.
      </label>
      <div className="actions span-all">
        <button className="primary">Save business facts</button>
        <small>
          {client.confirmedAt
            ? `Last confirmed: ${new Date(client.confirmedAt).toLocaleString()}`
            : "Not confirmed · offer, audience, website, and source are required for confirmation."}
        </small>
      </div>
    </form>
  );
}
function Research({ client, save }: { client: Client; save: Save }) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState("");
  const [intent, setIntent] = useState("");
  const [basis, setBasis] = useState("");
  return (
    <>
      <p className="stage-description">
        Map customer needs to the real offer. A topic is a hypothesis until a dated source supports
        it.
      </p>
      <section className="panel">
        <div className="section-head">
          <h3>Topics & page decisions</h3>
          <span className="badge">{client.pageMap.length} saved</span>
        </div>
        {!client.pageMap.length ? (
          <Empty title="No research saved">
            Start with a customer question. Choose an existing page, a useful new page, or no
            action.
          </Empty>
        ) : (
          client.pageMap.map((r) => (
            <details className="finding" key={r.id}>
              <summary>
                <Lightbulb size={17} />
                <span>
                  <strong>{r.query}</strong>
                  <small>{r.page || "No page assigned"} · Hypothesis / manual research</small>
                </span>
                <ChevronDown size={16} />
              </summary>
              <div className="finding-body">
                <p>
                  <b>Intent & decision:</b> {r.intent || "Not recorded"}
                </p>
                <p>
                  <b>Basis:</b>{" "}
                  {r.basis || "Legacy research: source and date not recorded. Validate before use."}
                </p>
                <p>
                  Measurement unavailable: no verified property or date range is attached. Stored
                  impression values are not treated as measured traffic.
                </p>
              </div>
            </details>
          ))
        )}
      </section>
      <form
        className="panel form-grid"
        onSubmit={(e) => {
          e.preventDefault();
          if (
            save(
              (c) => ({
                ...c,
                pageMap: [
                  ...c.pageMap,
                  {
                    id: uid(),
                    query,
                    intent,
                    page,
                    status: page ? "weak" : "missing",
                    impressions: 0,
                    basis,
                  },
                ],
              }),
              "Research hypothesis saved",
            )
          ) {
            setQuery("");
            setPage("");
            setIntent("");
            setBasis("");
          }
        }}
      >
        <div className="span-all">
          <h3>Add a research hypothesis</h3>
          <p>No keyword volume or ranking data is generated.</p>
        </div>
        <Field label="Customer question / topic" value={query} onChange={setQuery} required />
        <Field label="Existing page or proposed URL (optional)" value={page} onChange={setPage} />
        <Field
          label="Intent, relevant offer, and page decision"
          value={intent}
          onChange={setIntent}
          required
          multiline
        />
        <Field
          label="Basis, source links, observation date, and unknowns"
          value={basis}
          onChange={setBasis}
          required
          multiline
        />
        <div className="span-all">
          <button className="primary">
            <Plus size={16} /> Save hypothesis
          </button>
        </div>
      </form>
    </>
  );
}
const groups = [
  ["attention", "Needs attention"],
  ["review", "Review"],
  ["opportunity", "Opportunities"],
  ["incomplete", "Incomplete checks"],
  ["passed", "Checks passed"],
] as const;
function SiteReview({ client, save }: { client: Client; save: Save }) {
  const [adding, setAdding] = useState(false);
  const prepare = (e: Evidence) =>
    save(
      (c) => ({
        ...c,
        work: [
          ...c.work,
          {
            id: uid(),
            title: e.recommendation || `Review: ${e.claim}`,
            why: e.detail || e.claim,
            evidenceIds: [e.id],
            effort: "medium",
            clientFacing: true,
            status: "draft",
            page: e.page || "",
            brief: `Risk: ${e.risk || "Needs assessment"}\nVerification: ${e.verificationPlan || "Define a fresh technical check before implementing."}`,
          },
        ],
      }),
      `Recommendation prepared: ${e.claim}`,
    );
  return (
    <>
      <section className="panel">
        <div className="section-head">
          <div>
            <h3>Site review</h3>
            <p>No automated scan has run</p>
          </div>
          <button className="primary" onClick={() => setAdding(!adding)}>
            <Plus size={16} />
            {adding ? "Close form" : "Record manual check"}
          </button>
        </div>
        <div className="coverage">
          <span>
            <b>{client.evidence.length}</b> saved observations
          </span>
          <span>Coverage: manually recorded scope only</span>
          <span>Scanner unavailable</span>
        </div>
        <p className="panel-note">
          Review pages in your own tools, then record exactly what was checked. Unchecked pages are
          not passes. Saved findings are operator-entered, not live scan results.
        </p>
      </section>
      {adding && <FindingForm save={save} close={() => setAdding(false)} />}
      <section className="panel audit-list">
        {!client.evidence.length ? (
          <Empty title="No checks recorded yet">
            Record a manual finding, successful check, or incomplete check. Include the page,
            source, and date.
          </Empty>
        ) : (
          groups.map(([key, label]) => {
            const findings = client.evidence.filter(
              (e) =>
                (e.kind === "hypothesis" && e.group === "passed"
                  ? "review"
                  : e.group || "review") === key,
            );
            return (
              findings.length > 0 && (
                <details className="finding-group" key={key} open={key !== "passed"}>
                  <summary>
                    {label}
                    <span className="count">{findings.length}</span>
                    <ChevronDown size={16} />
                  </summary>
                  {findings.map((e) => (
                    <details className="finding" key={e.id}>
                      <summary>
                        {key === "passed" ? (
                          <CircleCheck className="success" size={18} />
                        ) : key === "opportunity" ? (
                          <Lightbulb size={18} />
                        ) : (
                          <CircleAlert className={key === "attention" ? "danger" : ""} size={18} />
                        )}
                        <span>
                          <strong>{e.claim}</strong>
                          <small>
                            {e.page || "Scope not recorded"} ·{" "}
                            {e.kind === "hypothesis" ? "Hypothesis" : "Manual record"} ·{" "}
                            {e.confidence} confidence
                          </small>
                        </span>
                        <ChevronDown size={16} />
                      </summary>
                      <div className="finding-body">
                        <dl className="evidence-grid">
                          <div>
                            <dt>Observed / why it matters</dt>
                            <dd>{e.detail || "Not recorded"}</dd>
                          </div>
                          <div>
                            <dt>Source & observation date</dt>
                            <dd>
                              {e.source} · {e.collected}
                              {safeUrl(e.sourceUrl) && (
                                <a href={safeUrl(e.sourceUrl)} target="_blank" rel="noreferrer">
                                  Open source
                                </a>
                              )}
                            </dd>
                          </div>
                          <div>
                            <dt>Affected page / scope</dt>
                            <dd>{e.page || "Not recorded — confirm scope before acting"}</dd>
                          </div>
                          <div>
                            <dt>Confidence & limitations</dt>
                            <dd>
                              {e.confidence} ·{" "}
                              {e.limitation ||
                                "Confidence rationale and omissions not recorded. Review before acting."}
                            </dd>
                          </div>
                          <div>
                            <dt>Recommendation & risk</dt>
                            <dd>
                              {e.recommendation || "No recommendation recorded"}
                              <br />
                              {e.risk || "Risk and reversibility need review"}
                            </dd>
                          </div>
                          <div>
                            <dt>Verification plan</dt>
                            <dd>
                              {e.verificationPlan || "Define a fresh check after implementation"}
                            </dd>
                          </div>
                        </dl>
                        {!["passed", "incomplete"].includes(key) && (
                          <div className="actions">
                            <button
                              disabled={client.work.some((w) => w.evidenceIds.includes(e.id))}
                              onClick={() => prepare(e)}
                            >
                              {client.work.some((w) => w.evidenceIds.includes(e.id))
                                ? "In action plan"
                                : "Prepare recommendation"}
                            </button>
                            <small>Creates a draft. Does not change the site.</small>
                          </div>
                        )}
                      </div>
                    </details>
                  ))}
                </details>
              )
            );
          })
        )}
      </section>
    </>
  );
}
function safeUrl(value?: string) {
  try {
    const u = new URL(value || "");
    return ["http:", "https:"].includes(u.protocol) ? u.href : undefined;
  } catch {
    return undefined;
  }
}
function FindingForm({ save, close }: { save: Save; close: () => void }) {
  const [f, setF] = useState({
    claim: "",
    page: "",
    detail: "",
    collected: new Date().toISOString().slice(0, 10),
    sourceUrl: "",
    limitation: "",
    recommendation: "",
    risk: "",
    verificationPlan: "",
  });
  const [group, setGroup] = useState<NonNullable<Evidence["group"]>>("review");
  const [kind, setKind] = useState<"observed" | "hypothesis">("observed");
  const [confidence, setConfidence] = useState<Evidence["confidence"]>("low");
  return (
    <form
      className="panel form-grid"
      onSubmit={(e) => {
        e.preventDefault();
        if (
          save(
            (c) => ({
              ...c,
              evidence: [
                ...c.evidence,
                { ...f, id: uid(), source: "Operator", group, kind, confidence },
              ],
            }),
            "Manual check saved",
          )
        )
          close();
      }}
    >
      <h3 className="span-all">Record a manual check</h3>
      <Field
        label="Specific finding / check"
        value={f.claim}
        onChange={(v) => setF({ ...f, claim: v })}
        required
      />
      <Field
        label="Affected URL or exact scope"
        value={f.page}
        onChange={(v) => setF({ ...f, page: v })}
        required
      />
      <label>
        Result
        <select value={group} onChange={(e) => setGroup(e.target.value as typeof group)}>
          {groups.map(([k, l]) => (
            <option key={k} value={k} disabled={kind === "hypothesis" && k === "passed"}>
              {l}
            </option>
          ))}
        </select>
      </label>
      <label>
        Evidence type
        <select
          value={kind}
          onChange={(e) => {
            setKind(e.target.value as typeof kind);
            if (e.target.value === "hypothesis" && group === "passed") setGroup("review");
          }}
        >
          <option value="observed">Operator observation</option>
          <option value="hypothesis">Hypothesis · needs evidence</option>
        </select>
      </label>
      <label>
        Observation date
        <input
          type="date"
          required
          max={new Date().toISOString().slice(0, 10)}
          value={f.collected}
          onChange={(e) => setF({ ...f, collected: e.target.value })}
        />
      </label>
      <label>
        Confidence
        <select
          value={confidence}
          onChange={(e) => setConfidence(e.target.value as typeof confidence)}
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </label>
      {(
        [
          ["detail", "Observation, source/tool, reproducible check, and why it matters"],
          ["sourceUrl", "Source URL (optional)"],
          ["limitation", "Confidence rationale, omitted pages, and limitations"],
          ["recommendation", "Recommended change (optional for passed / incomplete checks)"],
          ["risk", "Risk and reversibility"],
          ["verificationPlan", "How to check the change afterward"],
        ] as const
      ).map(([key, label]) => (
        <Field
          key={key}
          label={label}
          value={f[key]}
          onChange={(v) => setF({ ...f, [key]: v })}
          multiline={key !== "sourceUrl"}
          required={key === "detail" || key === "limitation"}
        />
      ))}
      <div className="span-all actions">
        <button className="primary">Save manual check</button>
        <button type="button" onClick={close}>
          Cancel
        </button>
      </div>
    </form>
  );
}
function ActionPlan({ client, save }: { client: Client; save: Save }) {
  const [reason, setReason] = useState(client.noActionReason || "");
  return (
    <>
      <p className="stage-description">
        Review recommendations in priority order. Approval records a decision; implementation
        happens in your site tools.
      </p>
      <section className="panel">
        <div className="section-head">
          <h3>Work queue</h3>
          <span className="badge">{client.work.length} recommendations</span>
        </div>
        {!client.work.length ? (
          <Empty title="No proposed changes">
            Prepare a recommendation from a site-review finding. Successful checks do not need a
            fix.
          </Empty>
        ) : (
          client.work.map((w, i) => (
            <WorkRow key={w.id} item={w} index={i} client={client} save={save} />
          ))
        )}
      </section>
      {client.work.every((w) => w.status === "declined" || Boolean(w.deferredReason)) && (
        <form
          className="panel form-grid"
          onSubmit={(e) => {
            e.preventDefault();
            save((c) => ({ ...c, noActionReason: reason }), "No-change decision recorded");
          }}
        >
          <div className="span-all">
            <h3>No changes needed right now?</h3>
            <p>
              A review can end without implementation. Explain the decision and any remaining
              limitations.
            </p>
          </div>
          <div className="span-all">
            <Field
              label="Reason for no changes"
              value={reason}
              onChange={setReason}
              required
              multiline
            />
          </div>
          <div className="span-all">
            <button>Save no-change decision</button>
          </div>
        </form>
      )}
    </>
  );
}
function WorkRow({
  item: w,
  index,
  client,
  save,
}: {
  item: WorkItem;
  index: number;
  client: Client;
  save: Save;
}) {
  const [reason, setReason] = useState("");
  const [reorder, setReorder] = useState(false);
  return (
    <details className="finding">
      <summary>
        <span className="priority">{index + 1}</span>
        <span>
          <strong>{w.title}</strong>
          <small>
            {w.page || "Page not recorded"} ·{" "}
            {w.deferredReason
              ? "Deferred"
              : w.status === "draft"
                ? "Proposed"
                : w.status === "declined"
                  ? "Skipped"
                  : w.status === "done"
                    ? "Implementation recorded"
                    : "Approved"}
          </small>
        </span>
        <ChevronDown size={16} />
      </summary>
      <div className="finding-body">
        <p>
          <b>Priority rationale / likely benefit:</b> {w.why || "Not recorded"}
        </p>
        <p>
          <b>Owner:</b> Consultant · <b>Effort:</b> Not estimated (no estimation method recorded)
        </p>
        <p>
          <b>Dependencies & confidence:</b> Review linked evidence and resolve unknown facts before
          implementation.
        </p>
        {w.brief && <p className="prewrap">{w.brief}</p>}
        <div>
          <b>Supporting evidence</b>
          {w.evidenceIds.map((id) => {
            const e = client.evidence.find((e) => e.id === id);
            return (
              <p key={id}>
                {e
                  ? `${e.claim} · ${e.page || "Scope unknown"} · ${e.source} · ${e.collected} · ${e.confidence} confidence`
                  : "Linked evidence is missing. Confirm before implementation."}
              </p>
            );
          })}
        </div>
        {w.deferredReason && <p className="notice">Deferred: {w.deferredReason}</p>}
        {w.status !== "done" && (
          <>
            <div className="actions">
              <button
                className="primary"
                disabled={w.status === "approved"}
                onClick={() =>
                  save((c) => changeWorkStatus(c, w.id, "approved"), `Approved: ${w.title}`)
                }
              >
                {w.status === "approved" ? "Approved" : "Approve"}
              </button>
              <button
                disabled={w.status === "declined"}
                onClick={() =>
                  save((c) => changeWorkStatus(c, w.id, "declined"), `Skipped: ${w.title}`)
                }
              >
                Skip
              </button>
              <button onClick={() => setReorder(!reorder)}>Defer / reorder</button>
            </div>
            {reorder && (
              <div className="inline-form">
                <Field
                  label="Reason for deferral or priority change"
                  value={reason}
                  onChange={setReason}
                  required
                />
                <div className="actions">
                  <button
                    disabled={!reason.trim()}
                    onClick={() =>
                      save(
                        (c) => ({
                          ...c,
                          work: c.work.map((x) =>
                            x.id === w.id ? { ...x, status: "draft", deferredReason: reason } : x,
                          ),
                        }),
                        `Deferred: ${w.title} — ${reason}`,
                      )
                    }
                  >
                    Defer
                  </button>
                  <button
                    disabled={!reason.trim() || index === 0}
                    onClick={() =>
                      save(
                        (c) => ({ ...c, work: [w, ...c.work.filter((x) => x.id !== w.id)] }),
                        `Moved to top: ${w.title} — ${reason}`,
                      )
                    }
                  >
                    Move to top
                  </button>
                </div>
              </div>
            )}
          </>
        )}
        <p className="footnote">
          No publishing connection. Approved work must be applied manually.
        </p>
      </div>
    </details>
  );
}
function Report({ client, save }: { client: Client; save: Save }) {
  const ready = client.work.filter((w) => w.status === "approved" || w.status === "done");
  return (
    <>
      <p className="stage-description">
        Record what was applied, then a fresh check of the result. Technical verification is
        separate from traffic or ranking outcomes.
      </p>
      <section className="panel">
        <div className="section-head">
          <h3>Implementation & verification</h3>
        </div>
        {!ready.length ? (
          <Empty title="No approved work">Approve a recommendation in the action plan first.</Empty>
        ) : (
          ready.map((w) => <Implementation key={w.id} item={w} save={save} />)
        )}
      </section>
      <section className="panel report">
        <div className="section-head">
          <h3>Client report</h3>
          <button
            onClick={() => downloadFile(`visibility-report-${client.id}.txt`, reportText(client))}
          >
            <Download size={16} /> Export report
          </button>
        </div>
        <div className="report-counts">
          <span>
            <b>{client.work.filter((w) => w.implementation).length}</b> implementation records
          </span>
          <span>
            <b>{client.work.filter((w) => w.verification).length}</b> manual verifications
          </span>
        </div>
        <h3>Outcomes: not enough data</h3>
        <p>
          No connected measurement source or verified date range. Work completed is not evidence of
          ranking, traffic, or citation gains.
        </p>
        <details>
          <summary>Preview report</summary>
          <pre>{reportText(client)}</pre>
        </details>
      </section>
    </>
  );
}
function Implementation({ item: w, save }: { item: WorkItem; save: Save }) {
  const [note, setNote] = useState("");
  return (
    <details className="finding">
      <summary>
        <CircleCheck size={18} className={w.verification ? "success" : ""} />
        <span>
          <strong>{w.title}</strong>
          <small>
            {w.verification
              ? "Manually verified"
              : w.implementation
                ? "Implemented · not verified"
                : w.status === "done"
                  ? "Legacy done · evidence missing"
                  : "Approved · not implemented"}
          </small>
        </span>
        <ChevronDown size={16} />
      </summary>
      <div className="finding-body">
        {w.implementation && (
          <p>
            <b>Implementation:</b> {w.implementation.date} · {w.implementation.note}
          </p>
        )}
        {w.verification ? (
          <p>
            <b>Manual verification:</b> {w.verification.date} · {w.verification.note}
          </p>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const ok = save(
                (c) =>
                  w.implementation
                    ? verifyWork(c, w.id, note)
                    : changeWorkStatus(
                        w.status === "done"
                          ? {
                              ...c,
                              work: c.work.map((x) =>
                                x.id === w.id ? { ...x, status: "approved" } : x,
                              ),
                            }
                          : c,
                        w.id,
                        "done",
                        note,
                      ),
                `${w.implementation ? "Manual verification" : "Implementation evidence"} recorded: ${w.title}`,
              );
              if (ok) setNote("");
            }}
          >
            <Field
              label={
                w.implementation
                  ? "Fresh manual check: URL, check date, method, and observed result"
                  : "Implementation record: URL, actual change, date applied, and evidence link"
              }
              value={note}
              onChange={setNote}
              required
              multiline
            />
            <button className="primary">
              {w.implementation ? "Record manual verification" : "Record implementation"}
            </button>
            <p className="footnote">
              This saves your record only. It does not apply changes or run a check.
            </p>
          </form>
        )}
      </div>
    </details>
  );
}
