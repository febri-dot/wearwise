import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const POINTS_PER_SALE = 50;

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { action, sellerId } = body; // action: "verify" | "reject", now seller verifies

    const tx = await prisma.saleTransaction.findUnique({ where: { id } });
    if (!tx) return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    if (tx.sellerId !== sellerId)
      return NextResponse.json({ error: "Unauthorized — only seller can verify" }, { status: 403 });
    if (tx.status !== "pending_verification")
      return NextResponse.json({ error: "Transaction already processed" }, { status: 400 });

    if (action === "verify") {
      // Update transaction status
      await prisma.saleTransaction.update({
        where: { id },
        data: {
          status: "verified",
          verifiedAt: new Date(),
          pointsAwarded: POINTS_PER_SALE,
        },
      });

      // Mark item as sold
      await prisma.item.update({
        where: { id: tx.itemId },
        data: { status: "sold" },
      });

      // Award points to seller
      await prisma.user.update({
        where: { id: tx.sellerId },
        data: { rewardPoints: { increment: POINTS_PER_SALE } },
      });

      // Create reward record
      await prisma.reward.create({
        data: {
          userId: tx.sellerId,
          type: "sale",
          points: POINTS_PER_SALE,
        },
      });

      return NextResponse.json({ success: true, message: "Transaction verified. Seller rewarded!" });
    } else if (action === "reject") {
      await prisma.saleTransaction.update({
        where: { id },
        data: { status: "rejected" },
      });

      // Revert item to available
      await prisma.item.update({
        where: { id: tx.itemId },
        data: { status: "available" },
      });

      return NextResponse.json({ success: true, message: "Transaction rejected." });
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (err: any) {
    console.error("Failed to verify transaction:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
