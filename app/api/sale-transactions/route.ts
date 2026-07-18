import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { uploadToSupabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const sellerId = formData.get("sellerId") as string;
    const buyerId = formData.get("buyerId") as string;
    const file = formData.get("proof") as File;
    // Support both single itemId and multiple itemIds
    const singleItemId = formData.get("itemId") as string | null;
    const itemIdsJson = formData.get("itemIds") as string | null;

    let itemIds: string[] = [];
    if (itemIdsJson) {
      try {
        itemIds = JSON.parse(itemIdsJson);
      } catch {
        return NextResponse.json({ error: "Invalid itemIds format" }, { status: 400 });
      }
    } else if (singleItemId) {
      itemIds = [singleItemId];
    }

    if (itemIds.length === 0 || !sellerId || !buyerId || !file) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify all items exist and belong to seller
    const items = await prisma.item.findMany({
      where: { id: { in: itemIds } },
    });

    if (items.length !== itemIds.length) {
      return NextResponse.json({ error: "One or more items not found" }, { status: 404 });
    }

    for (const item of items) {
      if (item.userId !== sellerId) {
        return NextResponse.json({ error: `Item ${item.id} does not belong to seller` }, { status: 403 });
      }
      if (item.status !== "available") {
        return NextResponse.json({ error: `Item "${item.title}" is no longer available` }, { status: 400 });
      }
    }

    // Upload proof image
    const proofImageUrl = await uploadToSupabase(file, "proofs");

    // Create sale transactions for each item and mark items as pending
    const transactions = [];
    for (const itemId of itemIds) {
      const transaction = await prisma.saleTransaction.create({
        data: {
          itemId,
          sellerId,
          buyerId,
          proofImageUrl,
          status: "pending_verification",
        },
      });
      transactions.push(transaction);

      // Mark item as pending
      await prisma.item.update({
        where: { id: itemId },
        data: { status: "pending" },
      });
    }

    return NextResponse.json({ success: true, transactions }, { status: 201 });
  } catch (err: any) {
    console.error("Failed to create sale transaction:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
