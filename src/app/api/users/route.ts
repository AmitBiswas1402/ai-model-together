import { db } from "@/config/db";
import { usersTable } from "@/config/schema";
import { currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const user = await currentUser();

  const userResult = await db.select().from(usersTable)
  //@ts-ignore
  .where(eq(usersTable.email, user?.primaryEmailAddress?.emailAddress))

  if (userResult?.length === 0) {
    const data = {
      name: user?.fullName ?? "NA",
      email: user?.primaryEmailAddress?.emailAddress ?? "",
      credits: 100,
    }
    const result = await db.insert(usersTable).values({
      ...data
    })
    return NextResponse.json({ user: data });
  }

  return NextResponse.json({ user });
}