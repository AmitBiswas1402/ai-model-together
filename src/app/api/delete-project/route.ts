import { db } from "@/config/db";
import { chatTable, frameTable, projectTable } from "@/config/schema";
import { currentUser } from "@clerk/nextjs/server";
import { eq, inArray } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { projectId } = await req.json();

    if (!projectId) {
      return NextResponse.json({ error: "Missing projectId" }, { status: 400 });
    }

    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const userEmail = user.primaryEmailAddress?.emailAddress;
    if (!userEmail) {
      return NextResponse.json({ error: "User email not found" }, { status: 400 });
    }

    const [project] = await db
      .select()
      .from(projectTable)
      .where(eq(projectTable.projectId, projectId))
      .limit(1);

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.createdBy !== userEmail) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const frames = await db
      .select({ frameId: frameTable.frameId })
      .from(frameTable)
      .where(eq(frameTable.projectId, projectId));

    const frameIds = frames
      .map((f) => f.frameId)
      .filter(Boolean)
      .map(String);

    if (frameIds.length > 0) {
      await db.delete(chatTable).where(inArray(chatTable.frameId, frameIds));
      await db.delete(frameTable).where(eq(frameTable.projectId, projectId));
    }

    await db.delete(projectTable).where(eq(projectTable.projectId, projectId));

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE PROJECT ERROR:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
