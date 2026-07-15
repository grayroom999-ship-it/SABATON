// app/api/admin/products/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, price, category, gender, description, imageUrl, hoverImageUrl, variants } = body

    // --- Validation (original, unchanged) ---
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

    if (!gender || (gender !== 'male' && gender !== 'female')) {
      return NextResponse.json(
        { error: 'Gender must be "male" or "female"' },
        { status: 400 }
      )
    }

    // Ensure variants is an array
    const variantsArray = Array.isArray(variants) ? variants : []

    // --- Create product with variants (colour removed) ---
    const newProduct = await prisma.product.create({
      data: {
        name: name.trim(),
        price: parseFloat(price),
        category: category?.trim() || 'casual',
        gender: gender,
        description: description?.trim() || '',
        imageUrl: imageUrl?.trim() || '/images/placeholder.webp',
        hoverImageUrl: hoverImageUrl?.trim() || null,
        variants: {
          create: variantsArray.map((v: any) => ({
            // SKU now uses only name + size (no colour)
            sku: v.sku?.trim() || `${name.trim()}-${v.size}`,
            size: typeof v.size === 'number' ? v.size : parseInt(v.size) || 0,
            // Colour is fixed to 'Default' – we no longer accept it from input
            color: 'Default',
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

    // Prisma unique constraint violation
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