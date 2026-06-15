// scripts/embed-products.ts
import { PrismaClient } from '@prisma/client';
import { embed } from 'ai';
import { openai } from '@ai-sdk/openai';

const prisma = new PrismaClient();

async function generateEmbeddings() {
    const products = await prisma.product.findMany();

    for (const product of products) {
        // 1. Create descriptive text for each product
        const textToEmbed = `${product.name}. ${product.description}. Material: ${product.material}. Price: ${product.price} FCFA.`;

        // 2. Use Vercel AI SDK to get the embedding
        const { embedding } = await embed({
            model: openai.embedding('text-embedding-3-small'),
            value: textToEmbed,
        });

        // 3. Store the vector and metadata in your new pgvector table
        await prisma.$executeRaw`
            INSERT INTO product_knowledge (content, metadata, embedding)
            VALUES (${textToEmbed}, ${JSON.stringify({ productId: product.id })}, ${embedding}::vector);
        `;
    }
    console.log('✅ All product embeddings created!');
}

generateEmbeddings();