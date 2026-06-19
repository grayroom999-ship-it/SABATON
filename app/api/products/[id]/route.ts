import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Static base64 placeholder (same as used in /api/products)
function getBlurDataURL() {
  return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const product = await prisma.product.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        price: true,
        category: true,
        gender: true,
        description: true,
        material: true,
        imageUrl: true,
        hoverImageUrl: true,
        variants: true,
      },
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // ✅ Add blurDataUrl to the response
    const productWithBlur = {
      ...product,
      blurDataUrl: getBlurDataURL(),
    }

    return NextResponse.json(productWithBlur)
  } catch (error) {
    console.error('Error fetching product:', error)
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 })
  }
}