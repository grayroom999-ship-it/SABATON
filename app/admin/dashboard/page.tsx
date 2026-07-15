'use client';

import { useState, useEffect } from 'react';
import {
  Package,
  Search,
  ShoppingCart,
  AlertCircle,
  TrendingUp,
  Eye,
  Clock,
  ChevronRight,
} from 'lucide-react';

interface ProductSummary {
  id: string;
  name: string;
  price: number;
  imageUrl: string | null;
}

interface TopProduct {
  productId: string;
  views: number;
  product: ProductSummary | null;
}

interface PopularSearch {
  query: string;
  count: number;
}

interface LowStockItem {
  id: string;
  sku: string;
  size: number;
  color: string | null;
  stock: number;
  product: { id: string; name: string } | null;
}

interface Summary {
  totalViews: number;
  totalSearches: number;
  totalAddToCarts: number;
}

interface DashboardData {
  period: string;
  dateFilter: string;
  topProducts: TopProduct[];
  popularSearches: PopularSearch[];
  abandonmentRate: number;
  lowStockItems: LowStockItem[];
  summary: Summary;
}

export default function VendorDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('7d');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/analytics?period=${period}`);
      if (!res.ok) {
        throw new Error('Failed to fetch analytics');
      }
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading insights…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center p-8 bg-white rounded-xl shadow-lg max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
          <h2 className="mt-4 text-xl font-semibold text-gray-800">Something went wrong</h2>
          <p className="mt-2 text-gray-600">{error}</p>
          <button
            onClick={() => fetchAnalytics()}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center p-8 bg-white rounded-xl shadow-lg max-w-md">
          <p className="text-gray-600">No data available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              📊 Restock Intelligence
            </h1>
            <p className="text-sm text-gray-500 mt-1">Understand customer behavior and inventory health</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>
            <button
              onClick={fetchAnalytics}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm flex items-center gap-1"
            >
              <span>Refresh</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <MetricCard
            icon={<Eye className="text-blue-500" size={20} />}
            label="Total Views"
            value={data.summary?.totalViews ?? 0}
            bg="bg-blue-50"
          />
          <MetricCard
            icon={<Search className="text-indigo-500" size={20} />}
            label="Total Searches"
            value={data.summary?.totalSearches ?? 0}
            bg="bg-indigo-50"
          />
          <MetricCard
            icon={<ShoppingCart className="text-green-500" size={20} />}
            label="Add to Cart"
            value={data.summary?.totalAddToCarts ?? 0}
            bg="bg-green-50"
          />
          <MetricCard
            icon={<AlertCircle className="text-red-500" size={20} />}
            label="Abandonment Rate"
            value={`${data.abandonmentRate}%`}
            bg="bg-red-50"
          />
        </div>

        {/* Two-column layout: Top Products & Popular Searches */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">🔥 Top Viewed Products</h2>
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">Views</span>
            </div>
            {data.topProducts.length === 0 ? (
              <p className="text-gray-500 text-sm">No product views yet.</p>
            ) : (
              <ul className="space-y-3">
                {data.topProducts.slice(0, 5).map((p, idx) => (
                  <li key={p.productId} className="flex items-center justify-between border-b border-gray-100 pb-2 last:border-0 last:pb-0">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 text-xs font-medium w-5">{idx + 1}</span>
                      <span className="text-sm text-gray-700 truncate max-w-[150px] sm:max-w-[200px]">
                        {p.product?.name || `Product #${p.productId}`}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-blue-600">{p.views}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">🔍 Popular Searches</h2>
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">Count</span>
            </div>
            {data.popularSearches.length === 0 ? (
              <p className="text-gray-500 text-sm">No searches yet.</p>
            ) : (
              <ul className="space-y-3">
                {data.popularSearches.slice(0, 5).map((s, idx) => (
                  <li key={idx} className="flex items-center justify-between border-b border-gray-100 pb-2 last:border-0 last:pb-0">
                    <span className="text-sm text-gray-700 truncate max-w-[150px] sm:max-w-[200px]">
                      “{s.query}”
                    </span>
                    <span className="text-sm text-gray-600">{s.count}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="text-red-500" size={20} />
            <h2 className="text-lg font-semibold text-gray-800">Low Stock Alert</h2>
            <span className="ml-auto text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
              {data.lowStockItems.length} items
            </span>
          </div>
          {data.lowStockItems.length === 0 ? (
            <p className="text-green-600 text-sm font-medium">✅ All stock levels are healthy!</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-xs text-gray-500 uppercase tracking-wider">
                    <th className="py-2 pr-4 font-medium">Product</th>
                    <th className="py-2 px-4 font-medium">Size</th>
                    <th className="py-2 px-4 font-medium">Color</th>
                    <th className="py-2 px-4 font-medium text-right">Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {data.lowStockItems.map((item) => (
                    <tr key={item.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition">
                      <td className="py-2 pr-4 text-gray-800">{item.product?.name || 'Unknown'}</td>
                      <td className="py-2 px-4 text-gray-600">{item.size}</td>
                      <td className="py-2 px-4 text-gray-600">{item.color || 'N/A'}</td>
                      <td className={`py-2 px-4 text-right font-semibold ${item.stock === 0 ? 'text-red-600' : 'text-orange-500'}`}>
                        {item.stock}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Metric Card Component ────────────────────────────────
function MetricCard({
  icon,
  label,
  value,
  bg,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  bg: string;
}) {
  return (
    <div className={`${bg} rounded-xl p-4 border border-gray-100 shadow-sm flex items-center gap-4 transition hover:shadow-md`}>
      <div className="p-2 bg-white rounded-lg shadow-sm">{icon}</div>
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
      </div>
    </div>
  );
}