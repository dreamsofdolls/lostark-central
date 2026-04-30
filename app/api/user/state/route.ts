import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongo/db";
import { User } from "@/lib/mongo/models/User";

type StatePayload = {
  roster?: unknown;
  tasks?: unknown;
  settings?: unknown;
  completion?: unknown;
  updatedAt?: number;
};

export async function GET(request: NextRequest) {
  const discordId = request.nextUrl.searchParams.get("discordId")?.trim();
  if (!discordId) {
    return NextResponse.json({ error: "Missing discordId" }, { status: 400 });
  }

  await connectDB();
  const user = await User.findOne({ discordId }).select("discordId centralWebState").lean();
  return NextResponse.json({
    discordId,
    state: user?.centralWebState ?? null
  });
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { discordId?: string; state?: StatePayload };
  const discordId = String(body.discordId ?? "").trim();
  if (!discordId) {
    return NextResponse.json({ error: "Missing discordId" }, { status: 400 });
  }
  if (!body.state || typeof body.state !== "object") {
    return NextResponse.json({ error: "Missing state payload" }, { status: 400 });
  }

  await connectDB();
  const now = Date.now();
  const nextState: StatePayload = {
    ...body.state,
    updatedAt: typeof body.state.updatedAt === "number" ? body.state.updatedAt : now
  };

  await User.findOneAndUpdate(
    { discordId },
    {
      $setOnInsert: { discordId },
      $set: { centralWebState: nextState }
    },
    { upsert: true }
  );

  return NextResponse.json({ ok: true, discordId, state: nextState });
}
