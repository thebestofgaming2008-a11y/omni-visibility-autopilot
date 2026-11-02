import { downloadFile } from "@/lib/download";
import { Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { Layers3, Users, HardDrive, Settings2, ArrowUpRight } from "lucide-react";

export function WorkspaceShell({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState(false);
  return (
    <div className="workspace">
      <a href="#main" className="skip-link">
        Skip to workspace
      </a>
      <aside className="sidebar">
        <Link to="/" className="brand">
          <span className="brand-icon">
            <Layers3 size={20} />
          </span>
          <span>
            Omni<span className="brand-light">Visibility</span>
            <small>Consultant workspace</small>
          </span>
        </Link>
        <nav aria-label="Primary navigation">
          <Link to="/" className="nav-link">
            <Users size={18} /> Clients
          </Link>
          <button
            className="nav-link"
            aria-expanded={settings}
            onClick={() => setSettings(!settings)}
          >
            <Settings2 size={18} /> App settings
          </button>
        </nav>
        <div className="sidebar-note">
          <HardDrive size={18} />
          <strong>Saved in this browser</strong>
          <p>No account sync or cloud backup. Export a backup from app settings.</p>
        </div>
      </aside>
      <div className="workspace-body">
        <header className="topbar">
          <span>Visibility workbench</span>
          <span className="badge">Browser storage only</span>
        </header>
        <main id="main" tabIndex={-1}>
          {settings && (
            <section className="panel settings-panel">
              <div className="section-head">
                <h2>App settings & data</h2>
                <button onClick={() => setSettings(false)}>Close settings</button>
              </div>
              <p>
                Client records are stored on this device, for this browser and website address.
                Authentication and external integrations are not configured.
              </p>
              <button
                onClick={() =>
                  downloadFile(
                    "omni-client-backup.json",
                    localStorage.getItem("ova-clients-v1") || "[]",
                    "application/json",
                  )
                }
              >
                Export browser backup <ArrowUpRight size={16} />
              </button>
            </section>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
