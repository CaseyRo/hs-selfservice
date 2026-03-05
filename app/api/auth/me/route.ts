import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session.userName) {
    return NextResponse.json({ loggedIn: false });
  }
  return NextResponse.json({ loggedIn: true, userName: session.userName });
}

export async function POST(req: NextRequest) {
  const { name } = await req.json();
  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const session = await getSession();
  session.userName = name.trim();
  await session.save();

  console.log(`[audit] User identified: ${session.userName}`);
  return NextResponse.json({ loggedIn: true, userName: session.userName });
}

export async function DELETE() {
  const session = await getSession();
  const name = session.userName;
  session.destroy();
  console.log(`[audit] User signed out: ${name}`);
  return NextResponse.json({ loggedIn: false });
}
