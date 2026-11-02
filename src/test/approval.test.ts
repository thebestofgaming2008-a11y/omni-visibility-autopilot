import { describe, expect, it } from "vitest";
import { canImplement, type WorkItem } from "@/lib/clients";

const base: WorkItem = { id: "x", title: "t", why: "w", evidenceIds: [], effort: "small", clientFacing: true, status: "draft" };

describe("approval rule", () => {
  it("blocks client-facing drafts from implementation", () => {
    expect(canImplement(base)).toBe(false);
  });
  it("allows client-facing work once approved", () => {
    expect(canImplement({ ...base, status: "approved" })).toBe(true);
  });
});
