import { prisma } from "@/lib/prisma";

export function slugifyBusinessName(input: string) {
  return input
    .toLocaleLowerCase("tr-TR")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 50) || "restoran";
}

export async function generateUniqueBusinessSlug(name: string) {
  const base = slugifyBusinessName(name);

  const existing = await prisma.business.findMany({
    where: {
      slug: {
        startsWith: base
      }
    },
    select: {
      slug: true
    }
  });

  const used = new Set(existing.map((item) => item.slug));
  if (!used.has(base)) {
    return base;
  }

  for (let index = 2; index < 500; index += 1) {
    const candidate = `${base}-${index}`;
    if (!used.has(candidate)) {
      return candidate;
    }
  }

  return `${base}-${Date.now().toString().slice(-6)}`;
}
