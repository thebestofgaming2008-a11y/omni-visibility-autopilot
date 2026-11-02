import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ComponentType, ReactNode } from "react";
import { parseClients, type Client } from "@/lib/clients";
import { reportText } from "@/lib/report";
const state = vi.hoisted(() => ({ step: 1, clients: [] as Client[], navigate: vi.fn() }));
vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: { component: ComponentType }) => ({
    options,
    useParams: () => ({ clientId: "qa" }),
    useSearch: () => ({ step: state.step }),
  }),
  useNavigate: () => state.navigate,
  Link: ({
    children,
    to,
    search,
    params,
    ...props
  }: {
    children: ReactNode;
    to: string;
    search?: unknown;
    params?: unknown;
  }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));
vi.mock("@/lib/clients", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/clients")>()),
  useClients: () => state.clients,
  updateClient: (id: string, fn: (c: Client) => Client) => {
    state.clients = state.clients.map((c) => (c.id === id ? fn(c) : c));
  },
}));
import { Route } from "@/routes/clients.$clientId";
const Workflow = Route.options.component as ComponentType;
function fixture() {
  return parseClients(
    JSON.stringify([
      {
        id: "qa",
        name: "QA only",
        site: "https://example.test",
        step: 5,
        profile: { offer: "Service", audience: "Customers" },
      },
    ]),
  )[0]!;
}
describe("workflow screens", () => {
  beforeEach(() => {
    state.step = 1;
    state.clients = [fixture()];
    state.navigate.mockClear();
  });
  it("keeps partial business facts editable and blocks progression without confirmation", () => {
    render(<Workflow />);
    expect(
      screen.getByRole("textbox", { name: "Products, services, and differentiators" }),
    ).toHaveValue("Service");
    expect(screen.getByRole("button", { name: "Continue to Research" })).toBeDisabled();
    fireEvent.change(screen.getByRole("textbox", { name: "Who the business serves" }), {
      target: { value: "Updated audience" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save business facts" }));
    expect(state.clients[0]?.profile.audience).toBe("Updated audience");
    expect(state.clients[0]?.id).toBe("qa");
    expect(state.clients[0]?.confirmedAt).toBe("");
  });
  it("shows no scan and no invented findings or fixes when evidence is absent", () => {
    state.step = 2;
    render(<Workflow />);
    expect(screen.getByText("No automated scan has run")).toBeVisible();
    expect(screen.getByText("No checks recorded yet")).toBeVisible();
    expect(screen.queryByRole("button", { name: /scan|fix all/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continue to Action plan" })).toBeDisabled();
  });
  it("uses keyboard-native disclosures and retains source, page, confidence and verification details", () => {
    state.step = 2;
    state.clients[0]!.evidence = [
      {
        id: "e1",
        claim: "Description absent",
        detail: "Page source had no description",
        source: "Operator",
        collected: "2026-11-02",
        confidence: "high",
        page: "/service",
        group: "attention",
        limitation: "One URL only",
        verificationPlan: "Fetch page source again",
      },
    ];
    const { container } = render(<Workflow />);
    const finding = container.querySelector(".finding");
    expect(finding?.tagName).toBe("DETAILS");
    expect(finding?.querySelector("summary")).toHaveTextContent("Description absent");
    expect(screen.getByText("Fetch page source again")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Prepare recommendation" }));
    expect(state.clients[0]?.work[0]?.evidenceIds).toEqual(["e1"]);
    expect(state.clients[0]?.work[0]?.page).toBe("/service");
    expect(state.clients[0]?.work[0]?.status).toBe("draft");
  });
  it("offers a real no-change decision instead of requiring fabricated work", () => {
    state.step = 4;
    render(<Workflow />);
    fireEvent.change(screen.getByRole("textbox", { name: "Reason for no changes" }), {
      target: { value: "All recorded checks pass; other pages remain unreviewed." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save no-change decision" }));
    expect(state.clients[0]?.noActionReason).toContain("unreviewed");
  });
  it("legacy done records are not reported as implemented or verified evidence", () => {
    const c = fixture();
    c.work = [
      {
        id: "w",
        title: "Legacy",
        why: "",
        evidenceIds: [],
        effort: "small",
        status: "done",
        clientFacing: true,
      },
    ];
    const text = reportText(c);
    expect(text).toContain("No implementation evidence recorded");
    expect(text).toContain("Not verified");
    expect(text).toContain("Not enough data");
  });
});
