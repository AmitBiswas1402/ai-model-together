import { db } from "@/config/db";
import { chatTable, frameTable, projectTable } from "@/config/schema";
import { currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

type ChatMessage = { role: string; content: string };

function buildRenamedMessages(
  current: unknown,
  newName: string,
): ChatMessage[] {
  const trimmed = newName.trim();

  if (Array.isArray(current)) {
    const messages = [...(current as ChatMessage[])];
    const userIndex = messages.findIndex((m) => m.role === "user");

    if (userIndex >= 0) {
      messages[userIndex] = { ...messages[userIndex], content: trimmed };
      return messages;
    }

    return [{ role: "user", content: trimmed }, ...messages];
  }

  if (typeof current === "string" && current.trim()) {
    return [{ role: "user", content: trimmed }];
  }

  return [{ role: "user", content: trimmed }];
}

export async function POST(req: NextRequest) {
  try {
    const { projectId, newName } = await req.json();

    if (!projectId || !newName?.trim()) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
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

    const [frame] = await db
      .select()
      .from(frameTable)
      .where(eq(frameTable.projectId, projectId))
      .limit(1);

    if (!frame) {
      return NextResponse.json({ error: "Frame not found" }, { status: 404 });
    }

    const [chat] = await db
      .select()
      .from(chatTable)
      .where(eq(chatTable.frameId, String(frame.frameId)))
      .limit(1);

    if (!chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    const updatedMessages = buildRenamedMessages(chat.chatMessage, newName);

    await db
      .update(chatTable)
      .set({ chatMessage: updatedMessages })
      .where(eq(chatTable.id, chat.id));

    return NextResponse.json({ success: true, chatMessage: updatedMessages });
  } catch (err) {
    console.error("RENAME PROJECT ERROR:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
