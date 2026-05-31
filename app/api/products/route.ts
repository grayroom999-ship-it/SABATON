import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '6')
    const category = searchParams.get('category')
    const search = searchParams.get('search')

    // Validate pagination inputs
    const currentPage = page > 0 ? page : 1
    const take = limit > 0 && limit <= 50 ? limit : 6
    const skip = (currentPage - 1) * take

    // Build filter conditions
    const where: any = {}
    if (category && category !== 'all') {
      where.category = category
    }
    if (search) {
      where.name = {
        contains: search,
        mode: 'insensitive', // case-insensitive search
      }
    }

    // Fetch products with variants and total count simultaneously
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take,
        include: {
          variants: true, // includes all variant fields (size, color, stock, etc.)
        },
        orderBy: {
          id: 'desc',
        },
      }),
      prisma.product.count({ where }),
    ])

    // Calculate total pages
    const totalPages = Math.ceil(total / take)

    // Return paginated response with metadata
    return NextResponse.json({
      products,       // array of products (each includes imageUrl and variants)
      total,          // total number of products matching filters
      totalPages,     // total pages available
      currentPage,
      limit: take,
    })
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}