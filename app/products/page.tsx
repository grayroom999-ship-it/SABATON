'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { Filter, ChevronDown, Shield, X } from 'lucide-react'
import Navbar from '../components/ui/Navbar'
import ChatBot from '../../components/Chatbot'

interface Product {
  id: number
  name: string
  price: number
  category: string
  description: string
  imageUrl: string
  variants: Array<{ size: number; color: string; stock: number }>
}

interface ProductsResponse {
  products: Product[]
  total: number
  totalPages: number
}

export default function ProductsPage() {
  const [page, setPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [productsData, setProductsData] = useState<ProductsResponse>({
    products: [],
    total: 0,
    totalPages: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  // Admin state
  const [adminMode, setAdminMode] = useState(false)
  const [adminPassword, setAdminPassword] = useState('')
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false)
  const [adminError, setAdminError] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    category: 'casual',
    description: '',
    imageUrl: '',
    sizes: '',
    colors: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const abortControllerRef = useRef<AbortController | null>(null)
  const categories = ['all', 'casual', 'formal', 'boots']

  // Reset page to 1 when category or search changes
  useEffect(() => {
    setPage(1)
  }, [selectedCategory, searchTerm])

  const fetchProducts = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    const abortController = new AbortController()
    abortControllerRef.current = abortController

    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '6',
        ...(selectedCategory !== 'all' && { category: selectedCategory }),
        ...(searchTerm && { search: searchTerm }),
      })

      const response = await fetch(`/api/products?${params}`, {
        signal: abortController.signal,
      })

      if (!response.ok) throw new Error('Failed to fetch products')

      const data = await response.json()
      
      // ✅ SAFETY: ensure products is always an array, and total/totalPages are numbers
      setProductsData({
        products: Array.isArray(data?.products) ? data.products : [],
        total: typeof data?.total === 'number' ? data.total : 0,
        totalPages: typeof data?.totalPages === 'number' ? data.totalPages : 0,
      })

      if (data?.totalPages && page > data.totalPages) {
        setPage(data.totalPages)
      }
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err.message)
        // ✅ on error, also reset products to empty array to avoid length access issues
        setProductsData({ products: [], total: 0, totalPages: 0 })
      }
    } finally {
      setLoading(false)
    }
  }, [page, selectedCategory, searchTerm])

  useEffect(() => {
    fetchProducts()
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [fetchProducts])

  // ✅ SAFE helper: prevents crash if variants is undefined or not an array
  const getAvailableSizes = (variants: any[] = []) => {
    if (!Array.isArray(variants) || variants.length === 0) {
      return 'N/A'
    }
    return [...new Set(variants.map((v) => v.size))]
      .sort((a, b) => a - b)
      .join(', ')
  }

  // Admin authentication handler
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (adminPassword === 'admin123') {
      setIsAdminAuthenticated(true)
      setAdminError('')
      setAdminMode(true)
    } else {
      setAdminError('Wrong password')
    }
  }

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const sizes = newProduct.sizes
      .split(',')
      .map(s => parseInt(s.trim()))
      .filter(s => !isNaN(s))
    const colors = newProduct.colors
      .split(',')
      .map(c => c.trim())
      .filter(c => c)

    const variants = []
    for (const size of sizes) {
      for (const color of colors) {
        variants.push({ size, color, stock: 10 })
      }
    }

    const productPayload = {
      name: newProduct.name,
      price: parseFloat(newProduct.price),
      category: newProduct.category,
      description: newProduct.description,
      imageUrl: newProduct.imageUrl || '/images/placeholder.webp',
      variants,
    }

    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productPayload),
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || 'Failed to add product')
      }

      setNewProduct({
        name: '',
        price: '',
        category: 'casual',
        description: '',
        imageUrl: '',
        sizes: '',
        colors: '',
      })
      setShowAddForm(false)
      fetchProducts()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main>
      <Navbar />

      <div className="pt-24 pb-16">
        <div className="container-custom">
          {/* Page Header with Admin Toggle */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">Our Collection</h1>
              <p className="text-gray-600">Handcrafted leather footwear for every occasion</p>
            </div>
            <button
              onClick={() => setAdminMode(!adminMode)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
            >
              <Shield size={18} />
              {adminMode ? 'Exit Admin' : 'Admin'}
            </button>
          </div>

          {/* Admin Authentication Panel */}
          {adminMode && !isAdminAuthenticated && (
            <div className="mb-8 p-4 border-2 border-amber-200 rounded-lg bg-amber-50">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Admin Access</h2>
                <button onClick={() => setAdminMode(false)} className="text-gray-500 hover:text-gray-700">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Password</label>
                  <input
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="w-full p-2 border rounded"
                    placeholder="Enter admin password"
                  />
                </div>
                {adminError && <p className="text-red-500 text-sm">{adminError}</p>}
                <button type="submit" className="bg-amber-600 text-white px-4 py-2 rounded hover:bg-amber-700">
                  Login
                </button>
              </form>
            </div>
          )}

          {/* Admin Panel (when authenticated) */}
          {adminMode && isAdminAuthenticated && (
            <div className="mb-8 p-4 border-2 border-green-200 rounded-lg bg-green-50">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-green-800">Admin Controls</h2>
                <button
                  onClick={() => {
                    setIsAdminAuthenticated(false)
                    setAdminMode(false)
                    setAdminPassword('')
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-4">
                <button
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                >
                  {showAddForm ? 'Cancel' : '+ Add New Product'}
                </button>

                {showAddForm && (
                  <form onSubmit={handleAddProduct} className="space-y-4 mt-4 p-4 bg-white rounded border">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium">Product Name *</label>
                        <input
                          type="text"
                          required
                          value={newProduct.name}
                          onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                          className="w-full p-2 border rounded"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium">Price (FCFA) *</label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={newProduct.price}
                          onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                          className="w-full p-2 border rounded"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium">Category</label>
                        <select
                          value={newProduct.category}
                          onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                          className="w-full p-2 border rounded"
                        >
                          {categories.filter(c => c !== 'all').map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium">Image URL</label>
                        <input
                          type="url"
                          value={newProduct.imageUrl}
                          onChange={(e) => setNewProduct({ ...newProduct, imageUrl: e.target.value })}
                          className="w-full p-2 border rounded"
                          placeholder="https://example.com/shoe.jpg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium">Sizes (comma-separated)</label>
                        <input
                          type="text"
                          value={newProduct.sizes}
                          onChange={(e) => setNewProduct({ ...newProduct, sizes: e.target.value })}
                          placeholder="38,39,40,41"
                          className="w-full p-2 border rounded"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium">Colors (comma-separated)</label>
                        <input
                          type="text"
                          value={newProduct.colors}
                          onChange={(e) => setNewProduct({ ...newProduct, colors: e.target.value })}
                          placeholder="Black,Brown,Tan"
                          className="w-full p-2 border rounded"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium">Description</label>
                        <textarea
                          rows={3}
                          value={newProduct.description}
                          onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                          className="w-full p-2 border rounded"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                    >
                      {isSubmitting ? 'Adding...' : 'Add Product'}
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* Search Input */}
          <input
            type="text"
            placeholder="Search shoes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 border rounded-lg mb-4"
          />

          {/* Mobile Filter Button */}
          <button
            className="md:hidden w-full bg-gray-100 py-2 rounded-lg mb-4 flex items-center justify-center gap-2"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={18} />
            Filter by Category
            <ChevronDown size={18} />
          </button>

          {/* Categories */}
          <div className={`${showFilters ? 'block' : 'hidden'} md:block mb-8`}>
            <div className="flex flex-wrap gap-3">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-full capitalize transition ${
                    selectedCategory === category
                      ? 'bg-amber-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
              {error}. Please try again later.
            </div>
          )}

          {/* Products Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-gray-200 animate-pulse h-96 rounded-lg"></div>
              ))}
            </div>
          ) : !productsData.products?.length ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No products found.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {productsData.products.map((product) => (
                  <div key={product.id} className="product-card group">
                    <Link href={`/products/${product.id}`}>
                      <div className="relative h-80 bg-gray-100 flex items-center justify-center overflow-hidden rounded-t-lg">
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          onError={(e) => {
                            e.currentTarget.src = '/images/placeholder.webp'
                            e.currentTarget.onerror = null
                          }}
                        />
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-lg mb-1 group-hover:text-amber-600 transition">
                          {product.name}
                        </h3>
                        <p className="text-amber-600 font-bold text-xl mb-2">
                          {product.price.toLocaleString()} FCFA
                        </p>
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                          {product.description}
                        </p>
                        <div className="text-sm text-gray-500">
                          Sizes: {getAvailableSizes(product.variants)}
                        </div>
                      </div>
                    </Link>
                    <div className="px-4 pb-4">
                      <button
                        onClick={() => {
                          const event = new CustomEvent('chatbot:addProduct', {
                            detail: { productName: product.name },
                          })
                          window.dispatchEvent(event)
                        }}
                        className="w-full bg-amber-600 text-white py-2 rounded-lg hover:bg-amber-700 transition"
                      >
                        💬 Chat to Buy
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination Controls - only show if totalPages > 1 AND products exist */}
              {productsData.totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-8">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1 || loading}
                    className="px-4 py-2 border rounded disabled:opacity-50 hover:bg-gray-50 transition"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2">
                    Page {page} of {productsData.totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(productsData.totalPages, p + 1))}
                    disabled={page === productsData.totalPages || loading}
                    className="px-4 py-2 border rounded disabled:opacity-50 hover:bg-gray-50 transition"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <ChatBot />
    </main>
  )
}