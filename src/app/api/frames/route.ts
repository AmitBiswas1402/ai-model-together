import { db } from "@/config/db";
import { chatTable, frameTable } from "@/config/schema";
import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const frameId = searchParams.get("frameId");

  if (!frameId) {
    return NextResponse.json({ error: "frameId is required" }, { status: 400 });
  }

  const frameIdStr = String(frameId);

  const [frameResult, chatResult] = await Promise.all([
    db.select().from(frameTable).where(eq(frameTable.frameId, frameIdStr)),
    db.select().from(chatTable).where(eq(chatTable.frameId, frameIdStr)),
  ]);

  if (!frameResult.length && !chatResult.length) {
    return NextResponse.json({ error: "Frame not found" }, { status: 404 });
  }

  const finalResult = {
    frameId: frameIdStr,
    designCode: frameResult[0]?.designCode ?? null,
    projectId: frameResult[0]?.projectId ?? null,
    chatMessages: chatResult[0]?.chatMessage ?? [],
  };

  return NextResponse.json(finalResult);
}

export async function PUT(req: NextRequest) {
  const { designCode, frameId, projectId } = await req.json();

  await db
    .update(frameTable)
    .set({
      designCode,
    })
    .where(
      and(
        eq(frameTable.frameId, String(frameId)),
        eq(frameTable.projectId, projectId)
      )
    );

  return NextResponse.json({ result: "Updated!" });
}
