import { db } from "@/config/db";
import {
  chatTable,
  frameTable,
  projectTable,
  usersTable,
} from "@/config/schema";
import { currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { projectId, frameId, messages } = await req.json();
    const user = await currentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const email = user.primaryEmailAddress?.emailAddress;

    if (!email) {
      return NextResponse.json({ error: "Email not found" }, { status: 400 });
    }

    if (!projectId || !frameId || !messages) {
      return NextResponse.json(
        { error: "projectId, frameId, and messages are required" },
        { status: 400 },
      );
    }

    const existingUser = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);

    if (!existingUser.length) {
      await db.insert(usersTable).values({
        name: user.fullName ?? "NA",
        email,
        credits: 100,
      });
    } else if ((existingUser[0].credits ?? 0) <= 0) {
      return NextResponse.json(
        { error: "Insufficient credits" },
        { status: 403 },
      );
    }

    const userRecord = existingUser.length
      ? existingUser[0]
      : (
          await db
            .select()
            .from(usersTable)
            .where(eq(usersTable.email, email))
            .limit(1)
        )[0];

    if (!userRecord) {
      return NextResponse.json(
        { error: "Failed to resolve user record" },
        { status: 500 },
      );
    }

    await db.insert(projectTable).values({
      projectId,
      createdBy: email,
    });

    await db.insert(frameTable).values({
      frameId: String(frameId),
      projectId,
    });

    await db.insert(chatTable).values({
      chatMessage: messages,
      frameId: String(frameId),
      createdBy: email,
    });

    return NextResponse.json({
      projectId,
      frameId,
      messages,
    });
  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
