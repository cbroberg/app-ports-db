import { NextResponse } from "next/server";
import { db } from "@/drizzle";
import { apps } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import fs from "fs";
import path from "path";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const appId = parseInt(id, 10);
  if (isNaN(appId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const [app] = await db.select().from(apps).where(eq(apps.id, appId));
  if (!app?.localPath) return NextResponse.json({ error: "No local path" }, { status: 404 });

  const readmePath = path.join(app.localPath, "README.md");
  if (!fs.existsSync(readmePath)) {
    return NextResponse.json({ error: "No README.md found" }, { status: 404 });
  }

  const content = fs.readFileSync(readmePath, "utf-8");
  return NextResponse.json({ content, name: app.name });
}
