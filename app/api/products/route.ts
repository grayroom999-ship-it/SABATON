import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { trackProductView } from '@/lib/analytics'
import { getSessionId } from '@/lib/session'

// Static base64 placeholder (a tiny 1x1 transparent/light-gray image)
function getBlurDataURL(): string {
  return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '6', 10)
    const category = searchParams.get('category')
    const gender = searchParams.get('gender')
    const search = searchParams.get('search')

    const skip = (page - 1) * limit
    const where: any = {}

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

    // Inject the static blurDataURL into each product
    const productsWithBlur = products.map((product) => ({
      ...product,
      blurDataUrl: getBlurDataURL(),
    }))

    // --- Analytics: track each product view ---
    const sessionId = getSessionId(request);
    if (sessionId) {
      // Track each product in the list (fire-and-forget)
      for (const product of products) {
        await trackProductView(product.id, sessionId);
      }
    }

    return NextResponse.json({
      products: productsWithBlur,
      total,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}