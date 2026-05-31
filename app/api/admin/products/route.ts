import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, price, category, description, imageUrl, variants } = body

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json(
        { error: 'Product name is required and must be a non-empty string' },
        { status: 400 }
      )
    }

    if (price === undefined || isNaN(parseFloat(price))) {
      return NextResponse.json(
        { error: 'Valid price is required' },
        { status: 400 }
      )
    }

    // Ensure variants is an array
    const variantsArray = Array.isArray(variants) ? variants : []

    // Create product with variants
    const newProduct = await prisma.product.create({
      data: {
        name: name.trim(),
        price: parseFloat(price),
        category: category?.trim() || 'casual',
        description: description?.trim() || '',
        imageUrl: imageUrl?.trim() || '/images/placeholder.webp',
        variants: {
          create: variantsArray.map((v: any) => ({
            sku: v.sku?.trim() || `${name.trim()}-${v.size}-${v.color}`,
            size: typeof v.size === 'number' ? v.size : parseInt(v.size) || 0,
            color: v.color?.trim() || 'Default',
            stock: typeof v.stock === 'number' ? v.stock : (v.stock ? parseInt(v.stock) : 10),
          })),
        },
      },
      include: { variants: true },
    })

    return NextResponse.json(
      {
        success: true,
        product: newProduct,
        message: 'Product added successfully',
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error creating product:', error)

    // Handle unique constraint violation (e.g., duplicate SKU or product name)
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'A product with this name or SKU already exists' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error. Could not create product.' },
      { status: 500 }
    )
  }
}