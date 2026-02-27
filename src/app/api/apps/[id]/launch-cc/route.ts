import { NextResponse } from "next/server";
import { db } from "@/drizzle";
import { apps } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { execFile } from "child_process";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const appId = parseInt(id, 10);
  if (isNaN(appId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const [app] = await db.select().from(apps).where(eq(apps.id, appId));
  if (!app?.localPath) {
    return NextResponse.json({ error: "No local path" }, { status: 404 });
  }

  const path = app.localPath.replace(/"/g, '\\"');

  // Try iTerm2 first, fall back to Terminal.app
  const script = [
    'try',
    '  tell application "iTerm"',
    '    create window with default profile',
    '    tell current session of current window',
    `      write text "cd \\"${path}\\" && claude"`,
    '    end tell',
    '  end tell',
    'on error',
    '  tell application "Terminal"',
    `    do script "cd \\"${path}\\" && claude"`,
    '    activate',
    '  end tell',
    'end try',
  ].join('\n');

  execFile('osascript', ['-e', script]);

  return NextResponse.json({ ok: true });
}
