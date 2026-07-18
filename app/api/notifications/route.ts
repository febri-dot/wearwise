import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const buyerId = searchParams.get("buyerId");
    const sellerId = searchParams.get("sellerId");

    if (!buyerId && !sellerId) {
      return NextResponse.json({ error: "buyerId or sellerId is required" }, { status: 400 });
    }

    // If sellerId is provided, fetch seller's pending verifications
    if (sellerId) {
      const sellerTransactions = await prisma.saleTransaction.findMany({
        where: {
          sellerId,
          status: "pending_verification",
        },
        include: {
          item: true,
          buyer: { select: { id: true, name: true, email: true, phone: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json({ success: true, notifications: sellerTransactions });
    }

    // Default: buyer notifications (backward compatible)
    const pendingTransactions = await prisma.saleTransaction.findMany({
      where: {
        buyerId: buyerId!,
        status: "pending_verification",
      },
      include: {
        item: true,
        seller: { select: { id: true, name: true, phone: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, notifications: pendingTransactions });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
