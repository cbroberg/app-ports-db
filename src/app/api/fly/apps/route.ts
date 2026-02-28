import { NextResponse } from "next/server";
import { execSync } from "child_process";

export interface FlyApp {
  name: string;
  org: "personal" | "webhouse" | string;
  status: "deployed" | "suspended" | "pending" | string;
  hostname: string;
  appUrl: string;
  latestDeploy: string | null; // ISO timestamp
}

const FLY_BIN = "/opt/homebrew/bin/fly";

export async function GET() {
  try {
    const raw = execSync(`${FLY_BIN} apps list --json`, {
      encoding: "utf-8",
      timeout: 15_000,
    });

    const parsed = JSON.parse(raw) as Array<{
      Name: string;
      Status: string;
      Hostname: string;
      AppURL: string;
      Organization: { Slug: string } | null;
      CurrentRelease: { CreatedAt: string } | null;
    }>;

    const flyApps: FlyApp[] = parsed.map(a => ({
      name: a.Name,
      org: a.Organization?.Slug ?? "personal",
      status: a.Status || "unknown",
      hostname: a.Hostname,
      appUrl: a.AppURL || `https://${a.Hostname}`,
      latestDeploy: a.CurrentRelease?.CreatedAt ?? null,
    }));

    return NextResponse.json({ apps: flyApps });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const unavailable = msg.includes("not found") || msg.includes("not logged") || msg.includes("ENOENT");
    return NextResponse.json(
      { apps: [], error: unavailable ? "Fly CLI not available or not logged in" : msg },
      { status: unavailable ? 503 : 500 }
    );
  }
}
