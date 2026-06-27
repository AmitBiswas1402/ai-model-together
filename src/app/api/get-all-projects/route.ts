import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { desc, eq, inArray } from "drizzle-orm";
import { db } from "@/config/db";
import { chatTable, frameTable, projectTable } from "@/config/schema";

export async function GET(req: NextRequest) {
  const user = await currentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const email = user.primaryEmailAddress?.emailAddress;

  // ── Query 1: all projects for this user ───────────────────────────────────
  const projects = await db
    .select()
    .from(projectTable)
    //@ts-ignore
    .where(eq(projectTable.createdBy, email))
    .orderBy(desc(projectTable.id));

  if (projects.length === 0) {
    return NextResponse.json([]);
  }

  const projectIds = projects.map((p) => p.projectId).filter(Boolean) as string[];

  // ── Query 2: all frames for all those projects (single batch) ─────────────
  const allFrames = await db
    .select({
      frameId: frameTable.frameId,
      projectId: frameTable.projectId,
      designCode: frameTable.designCode,
    })
    .from(frameTable)
    //@ts-ignore
    .where(inArray(frameTable.projectId, projectIds));

  const allFrameIds = allFrames.map((f) => f.frameId).filter(Boolean) as string[];

  // ── Query 3: all chats for all those frames (single batch) ────────────────
  let allChats: any[] = [];
  if (allFrameIds.length > 0) {
    allChats = await db
      .select()
      .from(chatTable)
      //@ts-ignore
      .where(inArray(chatTable.frameId, allFrameIds));
  }

  // ── Assemble results in-memory (no more DB round-trips) ───────────────────
  const chatsByFrameId = new Map<string, any[]>();
  for (const chat of allChats) {
    const fid = chat.frameId as string;
    if (!chatsByFrameId.has(fid)) chatsByFrameId.set(fid, []);
    chatsByFrameId.get(fid)!.push(chat);
  }

  const framesByProjectId = new Map<string, typeof allFrames>();
  for (const frame of allFrames) {
    const pid = frame.projectId as string;
    if (!framesByProjectId.has(pid)) framesByProjectId.set(pid, []);
    framesByProjectId.get(pid)!.push(frame);
  }

  const results: {
    projectId: string;
    frameId: string;
    designCode: string | null;
    chats: any[];
  }[] = [];

  for (const project of projects) {
    const pid = project.projectId as string;
    const frames = framesByProjectId.get(pid) ?? [];
    for (const frame of frames) {
      const fid = frame.frameId as string;
      results.push({
        projectId: pid,
        frameId: fid,
        designCode: frame.designCode ?? null,
        chats: chatsByFrameId.get(fid) ?? [],
      });
    }
  }

  return NextResponse.json(results);
}
