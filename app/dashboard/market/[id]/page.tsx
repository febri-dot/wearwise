import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import ItemDetailClient from "./ItemDetailClient";

export default async function ItemDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const id = resolvedParams.id;

  const item = await prisma.item.findUnique({
    where: { id },
    include: { user: true }
  });

  if (!item) return notFound();

  const scan = await prisma.scan.findUnique({
    where: { id: item.scanId }
  });

  const imageUrl = scan?.imageUrl || "/placeholder.png";

  return (
    <ItemDetailClient
      item={{
        id: item.id,
        title: item.title,
        description: item.description,
        price: item.price,
        status: item.status,
        userId: item.userId,
        imageUrl,
        user: {
          id: item.user.id,
          name: item.user.name,
          phone: item.user.phone,
          address: item.user.address,
        }
      }}
    />
  );
}
