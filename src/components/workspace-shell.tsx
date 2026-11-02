import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

export function WorkspaceShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-primary text-primary-foreground">◎</span>
            <span className="font-display text-lg font-semibold">OmniVisibility</span>
          </Link>
          <span className="rounded-full bg-secondary px-3 py-1 text-xs text-muted-foreground">Operator workspace</span>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
    </div>
  );
}
