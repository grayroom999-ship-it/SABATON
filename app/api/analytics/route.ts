// app/api/analytics/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const period = searchParams.get('period') || '7d';

  const dateFilter = new Date();
  if (period === '7d') dateFilter.setDate(dateFilter.getDate() - 7);
  else if (period === '30d') dateFilter.setDate(dateFilter.getDate() - 30);
  else if (period === '90d') dateFilter.setDate(dateFilter.getDate() - 90);
  else dateFilter.setDate(dateFilter.getDate() - 7);

  try {
    // ─── 1. Top 10 products by views ──────────────────────
    const topProductsRaw = await prisma.productView.groupBy({
      by: ['productId'],
      _count: { productId: true },
      where: { viewedAt: { gte: dateFilter } },
      orderBy: { _count: { productId: 'desc' } },
      take: 10,
    });

    const productIds = topProductsRaw.map((p) => p.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, price: true, imageUrl: true },
    });
    const productMap = new Map(products.map((p) => [p.id, p]));

    const topProducts = topProductsRaw.map((p) => ({
      productId: p.productId,
      views: p._count.productId,
      product: productMap.get(p.productId) || null,
    }));

    // ─── 2. Top 10 search queries ──────────────────────────
    const popularSearchesRaw = await prisma.searchQuery.groupBy({
      by: ['query'],
      _count: { query: true },
      where: { createdAt: { gte: dateFilter } },
      orderBy: { _count: { query: 'desc' } },
      take: 10,
    });
    const popularSearches = popularSearchesRaw.map((s) => ({
      query: s.query,
      count: s._count.query,
    }));

    // ─── 3. Abandonment rate (carts with items, no order) ──
    const cartsWithItems = await prisma.cart.findMany({
      where: {
        createdAt: { gte: dateFilter },
        items: { some: {} }, // at least one CartItem
      },
      select: {
        id: true,
        orders: { select: { id: true } },
      },
    });
    const totalCartsWithItems = cartsWithItems.length;
    const abandonedCarts = cartsWithItems.filter((cart) => cart.orders.length === 0);
    const abandonmentRate =
      totalCartsWithItems > 0 ? (abandonedCarts.length / totalCartsWithItems) * 100 : 0;

    // ─── 4. Low stock items (variants with stock < 5) ─────
    const lowStockItems = await prisma.variant.findMany({
      where: { stock: { lt: 5, gt: 0 } },
      include: { product: { select: { id: true, name: true } } },
      orderBy: { stock: 'asc' },
      take: 10,
    });

    // ─── 5. Summary totals ──────────────────────────────────
    const [totalViews, totalSearches, totalAddToCarts] = await Promise.all([
      prisma.productView.count({ where: { viewedAt: { gte: dateFilter } } }),
      prisma.searchQuery.count({ where: { createdAt: { gte: dateFilter } } }),
      prisma.addToCartEvent.count({ where: { createdAt: { gte: dateFilter } } }),
    ]);

    return NextResponse.json({
      period,
      dateFilter,
      topProducts,
      popularSearches,
      abandonmentRate: Math.round(abandonmentRate * 10) / 10,
      lowStockItems: lowStockItems.map((v) => ({
        id: v.id,
        sku: v.sku,
        size: v.size,
        color: v.color,
        stock: v.stock,
        product: v.product,
      })),
      summary: {
        totalViews,
        totalSearches,
        totalAddToCarts,
      },
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}