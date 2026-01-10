import { db } from "@/db/db";
import { usersTable } from "@/db/schema";
import { currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const user = await currentUser();

  if (!user) {
    return NextResponse.json(
      { error: "User not authenticated" },
      { status: 401 }
    );
  }

  const email = user.primaryEmailAddress?.emailAddress ?? "";

  const userResult = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email));

  if (userResult.length === 0) {
    const result = await db
      .insert(usersTable)
      .values({
        name: user.fullName ?? "NA",
        email: email,
        credits: 2,
      })
      .returning();

    return NextResponse.json({
      created: true,
      user: result[0],
    });
  }

  return NextResponse.json({ created: false, user: userResult[0] });
}
