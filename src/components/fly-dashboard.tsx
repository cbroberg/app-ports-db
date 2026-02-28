"use client";

import { useState, useEffect, useCallback } from "react";
import { RefreshCw, Loader2, ExternalLink, Plane } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { FlyApp } from "@/app/api/fly/apps/route";

type OrgFilter = "all" | "personal" | "webhouse";
type StatusFilter = "all" | "deployed" | "suspended";

function statusColor(status: string) {
  if (status === "deployed") return "bg-green-500";
  if (status === "suspended") return "bg-zinc-600";
  if (status === "pending") return "bg-yellow-400 animate-pulse";
  return "bg-zinc-600";
}

function formatDeploy(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const now = Date.now();
  const diff = now - d.getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString("da-DK", { day: "numeric", month: "short" });
}

export function FlyDashboard() {
  const [apps, setApps] = useState<FlyApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orgFilter, setOrgFilter] = useState<OrgFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const fetchApps = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/fly/apps");
      const data = await res.json();
      if (data.error && data.apps.length === 0) {
        setError(data.error);
      } else {
        setApps(data.apps);
        setError(null);
      }
    } catch {
      setError("Failed to reach Fly API");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApps();
  }, [fetchApps]);

  const filtered = apps.filter(a => {
    if (orgFilter !== "all" && a.org !== orgFilter) return false;
    if (statusFilter !== "all" && a.status !== statusFilter) return false;
    return true;
  });

  const counts = {
    personal: apps.filter(a => a.org === "personal").length,
    webhouse: apps.filter(a => a.org === "webhouse").length,
    deployed: apps.filter(a => a.status === "deployed").length,
    suspended: apps.filter(a => a.status === "suspended").length,
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Topbar */}
      <header className="flex items-center gap-3 px-6 h-14 border-b border-border shrink-0">
        <div className="flex-1 flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Plane className="h-4 w-4" />
            <span className="font-medium text-foreground">Fly.io</span>
          </div>

          {/* Org filter */}
          <div className="flex items-center gap-1 ml-4">
            {(["all", "personal", "webhouse"] as OrgFilter[]).map(o => (
              <button
                key={o}
                onClick={() => setOrgFilter(o)}
                className={cn(
                  "px-2.5 py-1 rounded-md text-xs transition-colors capitalize",
                  orgFilter === o
                    ? "bg-accent text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/60"
                )}
              >
                {o}
                {o !== "all" && (
                  <span className="tabular-nums ml-1 opacity-60">{counts[o]}</span>
                )}
              </button>
            ))}
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-1 ml-3 border-l border-border pl-3">
            {(["all", "deployed", "suspended"] as StatusFilter[]).map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  "px-2.5 py-1 rounded-md text-xs transition-colors capitalize",
                  statusFilter === s
                    ? "bg-accent text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/60"
                )}
              >
                {s}
                {s !== "all" && (
                  <span className="tabular-nums ml-1 opacity-60">{counts[s]}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground tabular-nums">
            {filtered.length} shown · {counts.deployed} deployed
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchApps}
            disabled={loading}
            className="h-8 w-8 p-0 text-muted-foreground"
            title="Refresh"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-6">
        {error ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3 text-muted-foreground">
            <Plane className="h-10 w-10 opacity-30" />
            <p className="text-sm">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchApps}>Retry</Button>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            <span className="text-sm">Fetching Fly.io apps…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <Plane className="h-10 w-10 opacity-30 mb-3" />
            <p className="text-sm">No apps match the current filters.</p>
          </div>
        ) : (
          <div className="rounded-lg border border-border overflow-hidden">
            {filtered.map((app, i) => (
              <FlyAppRow
                key={app.name}
                app={app}
                last={i === filtered.length - 1}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function FlyAppRow({ app, last }: { app: FlyApp; last: boolean }) {
  const isDeployed = app.status === "deployed";

  return (
    <div className={cn(
      "flex items-center gap-4 px-4 py-3 bg-card hover:bg-accent/30 transition-colors",
      !last && "border-b border-border"
    )}>
      {/* Status dot */}
      <span className={cn("h-2 w-2 rounded-full shrink-0", statusColor(app.status))} />

      {/* Name + hostname */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{app.name}</p>
        <p className="text-[11px] text-muted-foreground/70 font-mono truncate">{app.hostname}</p>
      </div>

      {/* Org badge */}
      <span className={cn(
        "text-[10px] px-1.5 py-0.5 rounded border font-mono shrink-0",
        app.org === "personal"
          ? "border-blue-500/30 text-blue-400"
          : "border-orange-500/30 text-orange-400"
      )}>
        {app.org === "personal" ? "personal" : "webhouse"}
      </span>

      {/* Latest deploy */}
      <div className="w-20 shrink-0 text-right">
        <p className="text-xs text-muted-foreground tabular-nums">{formatDeploy(app.latestDeploy)}</p>
      </div>

      {/* Links */}
      <div className="flex items-center gap-0.5 shrink-0">
        {isDeployed && (
          <a
            href={`https://${app.hostname}`}
            target="_blank"
            rel="noopener noreferrer"
            title={`Open ${app.hostname}`}
            className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
        <a
          href={`https://fly.io/apps/${app.name}`}
          target="_blank"
          rel="noopener noreferrer"
          title="Open in Fly.io dashboard"
          className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          <Plane className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  );
}
