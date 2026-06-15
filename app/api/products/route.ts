// app/api/products/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import sharp from 'sharp'

// Simple in‑memory cache for generated blur data URLs
const blurCache = new Map<string, string>()

/**
 * Generates a blur‑up data URL from an image URL using Sharp.
 * The image is fetched, resized to 20x20, and converted to base64.
 */
async function getBlurDataURL(imageUrl: string, width = 20, height = 20): Promise<string> => {
  // Return cached value if available
  const cacheKey = `${imageUrl}-${width}x${height}`
  if (blurCache.has(cacheKey)) {
    return blurCache.get(cacheKey)!
  }

  try {
    // Fetch the image from the provided URL (supports http/https and local `/public` paths)
    const response = await fetch(imageUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`)
    }
    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Process with Sharp: resize, reduce quality, convert to base64
    const resizedBuffer = await sharp(buffer)
      .resize(width, height, { fit: 'inside' })
      .toBuffer()

    const base64 = resizedBuffer.toString('base64')
    const mimeType = 'image/png' // Sharp defaults to PNG if input format is unknown; you can detect it if needed
    const dataUrl = `data:${mimeType};base64,${base64}`

    // Store in cache
    blurCache.set(cacheKey, dataUrl)
    return dataUrl
  } catch (error) {
    console.error(`Error generating blur for ${imageUrl}:`, error)
    // Fallback to a transparent placeholder
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '6')
    const category = searchParams.get('category')
    const gender = searchParams.get('gender')
    const search = searchParams.get('search')

    const skip = (page - 1) * limit

    let where: any = {}

    if (category && category !== 'all') {
      where.category = category
    }
    if (gender && gender !== 'all') {
      where.gender = gender
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    const total = await prisma.product.count({ where })

    const products = await prisma.product.findMany({
      where,
      skip,
      take: limit,
      select: {
        id: true,
        name: true,
        price: true,
        category: true,
        gender: true,
        description: true,
        imageUrl: true,
        hoverImageUrl: true,
        variants: true,
      },
      orderBy: { id: 'asc' },
    })

    // Generate blur placeholders for all products in parallel
    const productsWithBlur = await Promise.all(
      products.map(async (product) => ({
        ...product,
        blurDataUrl: await getBlurDataURL(product.imageUrl),
      }))
    )

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      products: productsWithBlur,
      total,
      totalPages,
    })
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}