import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { uploadToSupabase } from "@/lib/supabase";

// GET — fetch QRIS image URL for a user
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, qrisImageUrl: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, qrisImageUrl: user.qrisImageUrl });
  } catch (err: any) {
    console.error("Failed to fetch QRIS:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST — upload QRIS image for a user
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const userId = formData.get("userId") as string;
    const file = formData.get("qris") as File;

    if (!userId || !file) {
      return NextResponse.json({ error: "userId and qris file are required" }, { status: 400 });
    }

    // Verify user exists
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Upload to Supabase/local storage
    const qrisImageUrl = await uploadToSupabase(file, "qris");

    // Update user record
    await prisma.user.update({
      where: { id: userId },
      data: { qrisImageUrl },
    });

    return NextResponse.json({ success: true, qrisImageUrl });
  } catch (err: any) {
    console.error("Failed to upload QRIS:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
