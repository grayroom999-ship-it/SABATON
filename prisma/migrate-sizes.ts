// prisma/migrate-sizes.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// US to EU conversion maps
const menUsToEu: Record<number, number> = {
  8: 42,
  9: 44,
  10: 46,
  11: 48,
  // add more as needed
};

const womenUsToEu: Record<number, number> = {
  6: 36,
  7: 37,
  8: 38,
  // add more as needed
};

async function main() {
  // Get all product variants with their product's gender
  const variants = await prisma.variant.findMany({
    include: { product: { select: { gender: true } } },
  });

  console.log(`Found ${variants.length} variants.`);

  let updated = 0;
  let skipped = 0;

  for (const variant of variants) {
    const usSize = variant.size;
    const gender = variant.product.gender;
    let euSize: number | undefined;

    if (gender === 'male') {
      euSize = menUsToEu[usSize];
    } else if (gender === 'female') {
      euSize = womenUsToEu[usSize];
    } else {
      // unisex – default to men's mapping? or skip
      euSize = menUsToEu[usSize] || womenUsToEu[usSize];
    }

    if (euSize !== undefined) {
      await prisma.variant.update({
        where: { id: variant.id },
        data: { size: euSize },
      });
      updated++;
      console.log(`✅ Updated variant ${variant.id}: US ${usSize} → EU ${euSize} (${gender})`);
    } else {
      skipped++;
      console.warn(`⚠️ Skipped variant ${variant.id}: no mapping for US size ${usSize} (${gender})`);
    }
  }

  console.log(`✅ Updated ${updated} variants. Skipped ${skipped} variants.`);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());