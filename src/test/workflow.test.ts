import { describe, expect, it, beforeEach, vi } from "vitest";
import {
  parseClients,
  stageBlock,
  changeWorkStatus,
  verifyWork,
  STEPS,
  type Client,
  type WorkItem,
} from "@/lib/clients";
const base = (): Client =>
  parseClients(
    JSON.stringify([
      {
        id: "legacy-client",
        name: "Preserved client",
        profile: { offer: "Service", audience: "Customers" },
        customField: { keep: true },
      },
    ]),
  )[0]!;
const draft: WorkItem = {
  id: "work-1",
  title: "Improve title",
  why: "Observed mismatch",
  evidenceIds: ["finding-1"],
  effort: "small",
  clientFacing: true,
  status: "draft",
};
describe("backward-compatible client records", () => {
  it("keeps identity and unknown fields while reading partial records", () => {
    const c = base();
    expect(c.id).toBe("legacy-client");
    expect(c).toHaveProperty("customField", { keep: true });
    expect(c.profile).toEqual({
      offer: "Service",
      audience: "Customers",
      goals: [],
      constraints: [],
    });
    expect(c.evidence).toEqual([]);
    expect(c.work).toEqual([]);
  });
  it("round-trips existing records including unknown nested fields without changing legacy stage semantics", () => {
    const old = {
      ...base(),
      step: 2,
      profile: { ...base().profile, legacy: "preserve" },
      evidence: [
        {
          id: "finding-1",
          claim: "Check title",
          source: "Operator",
          collected: "2026-11-02",
          confidence: "high",
          detail: "Read page source",
          custom: "keep",
        },
      ],
      work: [draft],
    };
    const result = parseClients(JSON.stringify(old instanceof Array ? old : [old]))[0]!;
    expect(result).toEqual(old);
    expect(STEPS.find((s) => s.n === 2)?.short).toBe("Site review");
    expect(STEPS.find((s) => s.n === 3)?.short).toBe("Research");
  });
  it("fails closed on corrupt records rather than silently replacing clients", () => {
    expect(() => parseClients("{broken")).toThrow();
    expect(() => parseClients('[{"name":"missing ID"}]')).toThrow();
    expect(() => parseClients("{}")).toThrow();
  });
  it("does not create scan findings or metrics from missing data", () => {
    const c = base();
    expect(c.evidence).toHaveLength(0);
    expect(c.pageMap).toHaveLength(0);
    expect(c.history).toHaveLength(0);
  });
});
describe("stage requirements and evidence lifecycle", () => {
  it("requires website, offer, audience, and confirmation", () => {
    expect(stageBlock(base(), 1)).toContain("website");
    expect(stageBlock({ ...base(), site: "example.test", confirmedAt: "2026-11-02" }, 1)).toBe("");
    expect(stageBlock({ ...base(), site: "example.test" }, 1)).toContain("confirmation");
  });
  it("blocks empty research, review, and unapproved action plans", () => {
    for (const step of [3, 2, 4]) expect(stageBlock(base(), step)).not.toBe("");
  });
  it("approval never records implementation or verification", () => {
    const c = changeWorkStatus({ ...base(), work: [draft] }, draft.id, "approved");
    expect(c.work[0]?.status).toBe("approved");
    expect(c.work[0]?.implementation).toBeUndefined();
    expect(c.work[0]?.verification).toBeUndefined();
  });
  it("requires approval and implementation evidence before completion", () => {
    expect(() =>
      changeWorkStatus({ ...base(), work: [draft] }, draft.id, "done", "applied"),
    ).toThrow();
    expect(() =>
      changeWorkStatus(
        { ...base(), work: [{ ...draft, status: "approved" }] },
        draft.id,
        "done",
        " ",
      ),
    ).toThrow();
  });
  it("requires separate fresh verification and keeps client/page evidence attached", () => {
    const c = {
      ...base(),
      work: [{ ...draft, status: "approved" as const, page: "https://example.test/service" }],
    };
    expect(() => verifyWork(c, draft.id, "checked")).toThrow();
    const applied = changeWorkStatus(c, draft.id, "done", "Applied title on /service");
    expect(applied.work[0]?.verification).toBeUndefined();
    const checked = verifyWork(
      applied,
      draft.id,
      "Viewed source after publishing: expected title present",
    );
    expect(checked.id).toBe(c.id);
    expect(checked.work[0]?.page).toBe(c.work[0]?.page);
    expect(checked.work[0]?.evidenceIds).toEqual(["finding-1"]);
    expect(checked.work[0]?.verification?.method).toBe("manual");
    expect(c.work[0]?.status).toBe("approved");
  });
  it("legacy done does not count as verified", () => {
    const c = { ...base(), work: [{ ...draft, status: "done" as const }] };
    expect(c.work[0]?.verification).toBeUndefined();
    expect(() => verifyWork(c, draft.id, "check")).toThrow();
  });
});
describe("storage saves", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
  });
  it("preserves all existing IDs, unknown fields, and the storage key when saving a partial record", async () => {
    localStorage.setItem(
      "ova-clients-v1",
      JSON.stringify([
        { id: "a", name: "A", extra: "keep" },
        { id: "b", name: "B" },
      ]),
    );
    const { updateClient } = await import("@/lib/clients");
    updateClient("a", (c) => ({ ...c, site: "a.test" }));
    const stored = JSON.parse(localStorage.getItem("ova-clients-v1")!);
    expect(stored.map((c: Client) => c.id)).toEqual(["a", "b"]);
    expect(stored[0].extra).toBe("keep");
    expect(stored[1].name).toBe("B");
    expect(localStorage.length).toBe(1);
  });
  it("does not overwrite malformed storage when adding a client", async () => {
    localStorage.setItem("ova-clients-v1", "broken data");
    const { addClient } = await import("@/lib/clients");
    expect(() => addClient({ name: "A", site: "", industry: "", location: "" })).toThrow();
    expect(localStorage.getItem("ova-clients-v1")).toBe("broken data");
  });
  it("failed persistence does not report success or replace the cached snapshot", async () => {
    const { saveClients, updateClient } = await import("@/lib/clients");
    saveClients([base()]);
    const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("Storage full");
    });
    expect(() => updateClient("legacy-client", (c) => ({ ...c, name: "Changed" }))).toThrow(
      "Storage full",
    );
    spy.mockRestore();
    updateClient("legacy-client", (c) => ({ ...c, site: "kept.test" }));
    expect(JSON.parse(localStorage.getItem("ova-clients-v1")!)[0].name).toBe("Preserved client");
  });
});

it("allows documented no-change outcomes but does not bypass unresolved drafts", () => {
  const c = { ...base(), noActionReason: "No changes justified by this review" };
  expect(stageBlock(c, 4)).toBe("");
  expect(stageBlock({ ...c, work: [draft] }, 4)).not.toBe("");
  expect(stageBlock({ ...c, work: [{ ...draft, status: "declined" }] }, 4)).toBe("");
});

it("reads newer browser data before updates, retaining clients added in another tab", async () => {
  vi.resetModules();
  localStorage.clear();
  const { saveClients, updateClient } = await import("@/lib/clients");
  saveClients([base()]);
  localStorage.setItem(
    "ova-clients-v1",
    JSON.stringify([base(), { ...base(), id: "other-tab-client" }]),
  );
  updateClient("legacy-client", (c) => ({ ...c, site: "updated.test" }));
  expect(JSON.parse(localStorage.getItem("ova-clients-v1")!).map((c: Client) => c.id)).toEqual([
    "legacy-client",
    "other-tab-client",
  ]);
});
