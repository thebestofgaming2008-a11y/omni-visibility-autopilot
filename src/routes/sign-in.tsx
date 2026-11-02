import { createFileRoute, Link } from "@tanstack/react-router";
import { WorkspaceShell } from "@/components/workspace-shell";
export const Route = createFileRoute("/sign-in")({
  head: () => ({ meta: [{ title: "Workspace access — OmniVisibility" }] }),
  component: Access,
});
function Access() {
  return (
    <WorkspaceShell>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Workspace access</p>
          <h1>Use your local workspace</h1>
        </div>
      </div>
      <section className="panel empty">
        <h2>Sign-in is not configured</h2>
        <p>
          This app saves client records in this browser. There is no account,
          <br />
          Google authentication, or cross-device sync available.
        </p>
        <Link to="/" className="button primary">
          Open clients
        </Link>
      </section>
    </WorkspaceShell>
  );
}
