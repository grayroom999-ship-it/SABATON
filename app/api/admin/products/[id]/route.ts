// app/api/admin/products/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Admin authentication check
  const authHeader = request.headers.get('authorization')
  const expectedPassword = process.env.ADMIN_PASSWORD || 'admin123'

  if (!authHeader || authHeader !== `Bearer ${expectedPassword}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Await params (Next.js 15+ requirement)
  const { id } = await params

  if (!id) {
    return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 })
  }

  try {
    // Because your schema has `onDelete: Cascade` on the Variant → Product relation,
    // deleting the product will automatically delete all its variants.
    // No need to manually delete variants.
    await prisma.product.delete({
      where: { id },
    })

    return NextResponse.json({ success: true, message: 'Product deleted successfully' })
  } catch (error) {
    console.error('Delete error:', error)
    
    // Check if product exists
    if ((error as any).code === 'P2025') {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }
    
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    )
  }
}