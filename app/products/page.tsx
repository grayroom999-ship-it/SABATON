'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Filter, ChevronDown, Shield, X, Upload, Search, Heart, Eye, Trash2, Loader2 } from 'lucide-react'
import Navbar from '../components/ui/Navbar'
import ChatBot from '../../components/Chatbot'

interface Variant {
  size: number
  color: string   // kept for compatibility, but we always set "Default"
  stock: number
}

interface Product {
  id: string
  name: string
  price: number
  category: string
  gender: 'male' | 'female' | 'unisex'
  description: string
  imageUrl: string
  hoverImageUrl?: string
  variants: Variant[]
  blurDataUrl: string
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
  const [selectedGender, setSelectedGender] = useState<string>('all')
  const [productsData, setProductsData] = useState<ProductsResponse>({
    products: [],
    total: 0,
    totalPages: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  // Admin state (unchanged)
  const [adminMode, setAdminMode] = useState(false)
  const [adminPassword, setAdminPassword] = useState('')
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false)
  const [adminError, setAdminError] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    category: 'casual',
    gender: 'male',
    description: '',
    imageUrl: '',
    hoverImageUrl: '',
    sizes: '',      // only sizes remain – no colours
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [imageUploadError, setImageUploadError] = useState<string | null>(null)

  const [selectedHoverImageFile, setSelectedHoverImageFile] = useState<File | null>(null)
  const [hoverImagePreview, setHoverImagePreview] = useState<string | null>(null)
  const [uploadingHoverImage, setUploadingHoverImage] = useState(false)
  const [hoverImageUploadError, setHoverImageUploadError] = useState<string | null>(null)

  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [hoveredProductId, setHoveredProductId] = useState<string | null>(null)

  const abortControllerRef = useRef<AbortController | null>(null)
  const categories = ['all', 'casual', 'formal', 'boots']
  const genders = ['all', 'male', 'female']

  useEffect(() => {
    const storedAuth = sessionStorage.getItem('admin_auth')
    const storedPassword = sessionStorage.getItem('admin_password')
    if (storedAuth === 'true' && storedPassword) {
      setIsAdminAuthenticated(true)
      setAdminMode(true)
      setAdminPassword(storedPassword)
    }
  }, [])

  useEffect(() => {
    setPage(1)
  }, [selectedCategory, selectedGender, searchTerm])

  const fetchProducts = useCallback(async () => {
    if (abortControllerRef.current) abortControllerRef.current.abort()
    const abortController = new AbortController()
    abortControllerRef.current = abortController

    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '8',
        ...(selectedCategory !== 'all' && { category: selectedCategory }),
        ...(selectedGender !== 'all' && { gender: selectedGender }),
        ...(searchTerm && { search: searchTerm }),
      })

      const response = await fetch(`/api/products?${params}`, {
        signal: abortController.signal,
      })

      if (!response.ok) throw new Error('Failed to fetch products')

      const data = await response.json()
      setProductsData({
        products: Array.isArray(data?.products) ? data.products : [],
        total: typeof data?.total === 'number' ? data.total : 0,
        totalPages: typeof data?.totalPages === 'number' ? data.totalPages : 0,
      })
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err.message)
        setProductsData({ products: [], total: 0, totalPages: 0 })
      }
    } finally {
      setLoading(false)
    }
  }, [page, selectedCategory, selectedGender, searchTerm])

  useEffect(() => {
    fetchProducts()
    return () => abortControllerRef.current?.abort()
  }, [fetchProducts])

  const getAvailableSizes = (variants: Variant[] = []) => {
    if (!variants.length) return 'N/A'
    return [...new Set(variants.map((v) => v.size))].sort((a, b) => a - b).join(', ')
  }

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedPassword = adminPassword.trim()
    if (trimmedPassword === 'admin123') {
      setIsAdminAuthenticated(true)
      setAdminError('')
      setAdminMode(true)
      sessionStorage.setItem('admin_auth', 'true')
      sessionStorage.setItem('admin_password', trimmedPassword)
      window.dispatchEvent(new Event('adminAuthChanged'))
    } else {
      setAdminError('Wrong password')
    }
  }

  const handleLogout = () => {
    setIsAdminAuthenticated(false)
    setAdminMode(false)
    setAdminPassword('')
    sessionStorage.removeItem('admin_auth')
    sessionStorage.removeItem('admin_password')
    window.dispatchEvent(new Event('adminAuthChanged'))
  }

  const deleteProduct = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This cannot be undone.`)) return
    setDeletingId(id)
    try {
      const password = sessionStorage.getItem('admin_password') || adminPassword
      const response = await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${password}` }
      })
      if (response.ok) {
        setProductsData(prev => ({
          ...prev,
          products: prev.products.filter(p => p.id !== id),
          total: prev.total - 1
        }))
        alert(`${name} deleted successfully`)
      } else {
        const errorData = await response.json()
        alert(`Failed to delete: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      alert('Error deleting product')
    } finally {
      setDeletingId(null)
    }
  }

  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)
    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${sessionStorage.getItem('admin_password') || adminPassword}`
      }
    })
    if (!res.ok) {
      const errorData = await res.json()
      throw new Error(errorData.error || 'Upload failed')
    }
    const data = await res.json()
    return data.url
  }

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImageUploadError(null)
    setUploadingImage(true)
    setSelectedImageFile(file)
    const localPreview = URL.createObjectURL(file)
    setImagePreview(localPreview)

    try {
      const uploadedUrl = await uploadFile(file)
      setNewProduct(prev => ({ ...prev, imageUrl: uploadedUrl }))
      setImageUploadError(null)
    } catch (err: any) {
      console.error('Image upload failed:', err)
      setImageUploadError(err.message)
      setImagePreview(null)
      setNewProduct(prev => ({ ...prev, imageUrl: '' }))
    } finally {
      setUploadingImage(false)
    }
  }

  const handleHoverImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setHoverImageUploadError(null)
    setUploadingHoverImage(true)
    setSelectedHoverImageFile(file)
    const localPreview = URL.createObjectURL(file)
    setHoverImagePreview(localPreview)

    try {
      const uploadedUrl = await uploadFile(file)
      setNewProduct(prev => ({ ...prev, hoverImageUrl: uploadedUrl }))
      setHoverImageUploadError(null)
    } catch (err: any) {
      console.error('Hover image upload failed:', err)
      setHoverImageUploadError(err.message)
      setHoverImagePreview(null)
      setNewProduct(prev => ({ ...prev, hoverImageUrl: '' }))
    } finally {
      setUploadingHoverImage(false)
    }
  }

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newProduct.imageUrl) {
      alert('Please upload a main image for the product.')
      return
    }

    setIsSubmitting(true)

    const sizes = newProduct.sizes
      .split(',')
      .map(s => parseInt(s.trim()))
      .filter(s => !isNaN(s))

    // ─── REMOVED COLOURS – now we create one variant per size with a default colour ───
    const variants = sizes.map(size => ({
      size,
      color: 'Default',      // fallback – can be ignored
      stock: 10,
    }))

    const finalImageUrl = newProduct.imageUrl
    const finalHoverImageUrl = newProduct.hoverImageUrl || null

    const productPayload = {
      name: newProduct.name,
      price: parseFloat(newProduct.price),
      category: newProduct.category,
      gender: newProduct.gender,
      description: newProduct.description,
      imageUrl: finalImageUrl,
      hoverImageUrl: finalHoverImageUrl,
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
        gender: 'male',
        description: '',
        imageUrl: '',
        hoverImageUrl: '',
        sizes: '',
      })
      setSelectedImageFile(null)
      setImagePreview(null)
      setSelectedHoverImageFile(null)
      setHoverImagePreview(null)
      setImageUploadError(null)
      setHoverImageUploadError(null)
      setShowAddForm(false)
      fetchProducts()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const getCategoryName = (cat: string) => {
    const map: Record<string, string> = { casual: 'Casual', formal: 'Formal', boots: 'Boots' }
    return map[cat] || cat
  }

  const clearAllFilters = () => {
    setSearchTerm('')
    setSelectedCategory('all')
    setSelectedGender('all')
  }

  return (
    <main className="bg-white">
      <Navbar />

      <div className="pt-24 pb-12 bg-white">
        <div className="container-custom text-center">
          <span className="text-amber-600 text-sm tracking-widest font-serif uppercase">Our finest collection</span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-light tracking-tight mt-2">
            Premium Leather Footwear
          </h1>
          <div className="w-16 h-px bg-amber-500 mx-auto my-4"></div>
          <p className="text-gray-500 max-w-xl mx-auto">
            Discover timeless craftsmanship and modern design, made for every step.
          </p>
        </div>
      </div>

      <div className="container-custom pb-16">
        {/* Admin button */}
        <div className="flex justify-end mb-6">
          <button
            onClick={() => {
              if (isAdminAuthenticated) handleLogout()
              else setAdminMode(!adminMode)
            }}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-full hover:border-amber-500 hover:text-amber-600 transition text-sm"
          >
            <Shield size={16} />
            {isAdminAuthenticated ? 'Exit Admin' : (adminMode ? 'Exit Admin' : 'Admin')}
          </button>
        </div>

        {/* Admin Auth */}
        {adminMode && !isAdminAuthenticated && (
          <div className="mb-10 p-6 border border-amber-200 bg-amber-50/30 rounded-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-light">Admin Access</h2>
              <button onClick={() => setAdminMode(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAdminLogin} className="space-y-4 max-w-sm">
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full p-3 border border-gray-200 focus:border-amber-500 outline-none"
              />
              {adminError && <p className="text-red-500 text-sm">{adminError}</p>}
              <button type="submit" className="bg-amber-600 text-white px-6 py-2 hover:bg-amber-700 transition">
                Login
              </button>
            </form>
          </div>
        )}

        {/* Admin Panel */}
        {adminMode && isAdminAuthenticated && (
          <div className="mb-10 p-6 border border-green-200 bg-green-50/30 rounded-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-light text-green-800">Admin Controls</h2>
              <button onClick={handleLogout} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-amber-600 text-white px-5 py-2 hover:bg-amber-700 transition"
            >
              {showAddForm ? 'Cancel' : '+ Add New Product'}
            </button>

            {showAddForm && (
              <form onSubmit={handleAddProduct} className="mt-6 space-y-5 bg-white p-6 border border-gray-100">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
                    <input
                      type="text"
                      required
                      value={newProduct.name}
                      onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                      className="w-full p-2 border border-gray-200 focus:border-amber-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price (FCFA) *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={newProduct.price}
                      onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                      className="w-full p-2 border border-gray-200 focus:border-amber-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select
                      value={newProduct.category}
                      onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                      className="w-full p-2 border border-gray-200 focus:border-amber-500 outline-none"
                    >
                      {categories.filter(c => c !== 'all').map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Gender *</label>
                    <select
                      required
                      value={newProduct.gender}
                      onChange={(e) => setNewProduct({ ...newProduct, gender: e.target.value as 'male' | 'female' })}
                      className="w-full p-2 border border-gray-200 focus:border-amber-500 outline-none"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Main Image *</label>
                    <div className="flex items-center gap-3">
                      <label className={`flex items-center gap-2 px-4 py-2 border border-gray-200 hover:border-amber-500 cursor-pointer transition ${uploadingImage ? 'opacity-50 pointer-events-none' : ''}`}>
                        {uploadingImage ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                        {uploadingImage ? 'Uploading...' : 'Choose file'}
                        <input type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
                      </label>
                      {imagePreview && (
                        <div className="relative w-10 h-10 overflow-hidden">
                          <Image src={imagePreview} alt="Preview" fill className="object-cover" />
                        </div>
                      )}
                    </div>
                    {imageUploadError && <p className="text-red-500 text-xs mt-1">{imageUploadError}</p>}
                    {uploadingImage && <p className="text-gray-400 text-xs mt-1">Uploading image, please wait...</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hover Image (optional)</label>
                    <div className="flex items-center gap-3">
                      <label className={`flex items-center gap-2 px-4 py-2 border border-gray-200 hover:border-amber-500 cursor-pointer transition ${uploadingHoverImage ? 'opacity-50 pointer-events-none' : ''}`}>
                        {uploadingHoverImage ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                        {uploadingHoverImage ? 'Uploading...' : 'Choose file'}
                        <input type="file" accept="image/*" onChange={handleHoverImageSelect} className="hidden" />
                      </label>
                      {hoverImagePreview && (
                        <div className="relative w-10 h-10 overflow-hidden">
                          <Image src={hoverImagePreview} alt="Hover Preview" fill className="object-cover" />
                        </div>
                      )}
                    </div>
                    {hoverImageUploadError && <p className="text-red-500 text-xs mt-1">{hoverImageUploadError}</p>}
                    <p className="text-xs text-gray-400 mt-1">Will swap with main image on hover</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sizes (comma separated) *</label>
                    <input
                      type="text"
                      required
                      value={newProduct.sizes}
                      onChange={(e) => setNewProduct({ ...newProduct, sizes: e.target.value })}
                      placeholder="38,39,40,41"
                      className="w-full p-2 border border-gray-200 focus:border-amber-500 outline-none"
                    />
                    <p className="text-xs text-gray-400 mt-1">Each size will automatically get one variant with default colour.</p>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      rows={3}
                      value={newProduct.description}
                      onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                      className="w-full p-2 border border-gray-200 focus:border-amber-500 outline-none"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting || uploadingImage || !!(selectedImageFile && !newProduct.imageUrl)}
                  className="bg-gray-900 text-white px-6 py-2 hover:bg-gray-800 transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Adding...' : 'Add Product'}
                </button>
              </form>
            )}
          </div>
        )}

        {/* Filter Bar */}
        <div className="mb-10">
          <div className="hidden md:flex items-center gap-6 w-full">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search by name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-full focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none bg-white"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 mr-1">Category:</span>
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-3 py-1.5 text-sm capitalize rounded-full transition ${
                    selectedCategory === category
                      ? 'bg-amber-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category === 'all' ? 'All' : getCategoryName(category)}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 mr-1">For:</span>
              {genders.map((gender) => (
                <button
                  key={gender}
                  onClick={() => setSelectedGender(gender)}
                  className={`px-3 py-1.5 text-sm capitalize rounded-full transition ${
                    selectedGender === gender
                      ? 'bg-amber-100 text-amber-700 border border-amber-300'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {gender === 'all' ? 'All' : gender === 'male' ? 'Men' : 'Women'}
                </button>
              ))}
            </div>
            {(selectedCategory !== 'all' || selectedGender !== 'all' || searchTerm) && (
              <button onClick={clearAllFilters} className="text-sm text-red-500 hover:text-red-700 whitespace-nowrap">
                Clear all
              </button>
            )}
          </div>

          <div className="md:hidden">
            <div className="flex items-center gap-2 mb-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-full text-sm"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-4 py-2 border border-gray-200 rounded-full text-sm flex items-center gap-1"
              >
                <Filter size={14} />
                Filter
                <ChevronDown size={14} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>
            </div>
            {showFilters && (
              <div className="space-y-4 mt-2">
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">Category</div>
                  <div className="flex flex-wrap gap-2">
                    {categories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-3 py-1.5 text-sm capitalize rounded-full ${
                          selectedCategory === cat ? 'bg-amber-600 text-white' : 'bg-gray-100'
                        }`}
                      >
                        {cat === 'all' ? 'All' : getCategoryName(cat)}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">Gender</div>
                  <div className="flex flex-wrap gap-2">
                    {genders.map(g => (
                      <button
                        key={g}
                        onClick={() => setSelectedGender(g)}
                        className={`px-3 py-1.5 text-sm capitalize rounded-full ${
                          selectedGender === g
                            ? 'bg-amber-100 text-amber-700 border border-amber-300'
                            : 'bg-gray-100'
                        }`}
                      >
                        {g === 'all' ? 'All' : g === 'male' ? 'Men' : 'Women'}
                      </button>
                    ))}
                  </div>
                </div>
                {(selectedCategory !== 'all' || selectedGender !== 'all' || searchTerm) && (
                  <button onClick={clearAllFilters} className="text-sm text-red-500 underline">
                    Clear all filters
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Products Grid */}
        <style jsx>{`
          .products-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            column-gap: 30px;
            row-gap: 70px;
            max-width: 1200px;
            margin: 0 auto;
          }
          @media (max-width: 999.98px) {
            .products-grid {
              grid-template-columns: repeat(2, 1fr);
              column-gap: 30px;
              row-gap: 70px;
            }
          }
        `}</style>

        {loading ? (
          <div className="products-grid">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-gray-100 animate-pulse rounded-lg" style={{ aspectRatio: '1 / 1' }}></div>
            ))}
          </div>
        ) : !productsData.products?.length ? (
          <div className="text-center py-16 bg-gray-50 rounded-lg">
            <p className="text-gray-400">No products match your criteria.</p>
          </div>
        ) : (
          <>
            <div className="products-grid">
              {productsData.products.map((product) => (
                <div
                  key={product.id}
                  className="group bg-white border border-gray-100 rounded-lg hover:shadow-md transition-all duration-300 overflow-hidden"
                  onMouseEnter={() => setHoveredProductId(product.id)}
                  onMouseLeave={() => setHoveredProductId(null)}
                >
                  <Link href={`/products/${product.id}`}>
                    <div className="relative aspect-square bg-gray-100 overflow-hidden">
                      <Image
                        src={product.imageUrl}
                        alt={product.name}
                        fill
                        className={`object-cover transition-opacity duration-300 ${
                          hoveredProductId === product.id && product.hoverImageUrl ? 'opacity-0' : 'opacity-100'
                        }`}
                        placeholder="blur"
                        blurDataURL={product.blurDataUrl}
                        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 50vw, 25vw"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/images/placeholder.webp'
                        }}
                      />
                      {product.hoverImageUrl && (
                        <Image
                          src={product.hoverImageUrl}
                          alt={`${product.name} alternate`}
                          fill
                          className={`object-cover transition-opacity duration-300 ${
                            hoveredProductId === product.id ? 'opacity-100' : 'opacity-0'
                          }`}
                          placeholder="blur"
                          blurDataURL={product.blurDataUrl}
                          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 50vw, 25vw"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/images/placeholder.webp'
                          }}
                        />
                      )}
                      <button className="absolute top-2 right-2 bg-white/80 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition">
                        <Heart size={16} className="text-gray-600 hover:text-red-500" />
                      </button>
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                        <span className="bg-white text-gray-800 px-3 py-1.5 text-xs font-medium flex items-center gap-1">
                          <Eye size={14} /> Quick View
                        </span>
                      </div>
                    </div>
                    <div className="p-3 md:p-5 text-center">
                      <div className="flex justify-center gap-2 mb-1">
                        <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                          {getCategoryName(product.category)}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          product.gender === 'male' ? 'bg-blue-100 text-blue-700' :
                          product.gender === 'female' ? 'bg-pink-100 text-pink-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {product.gender === 'male' && '👞 Men'}
                          {product.gender === 'female' && '👠 Women'}
                          {product.gender === 'unisex' && '🧑‍🤝‍🧑 Unisex'}
                        </span>
                      </div>
                      <h3 className="font-medium text-gray-800 group-hover:text-amber-600 transition text-sm md:text-base">
                        {product.name}
                      </h3>
                      <p className="text-amber-600 font-semibold mt-1 md:mt-2 text-sm md:text-base">
                        {product.price.toLocaleString()} FCFA
                      </p>
                      <p className="text-gray-500 text-xs mt-1 line-clamp-2 hidden md:block">{product.description}</p>
                      <div className="mt-1 md:mt-2 text-xs text-gray-400">
                        Sizes: {getAvailableSizes(product.variants)}
                      </div>
                    </div>
                  </Link>
                  <div className="px-3 pb-3 md:px-5 md:pb-5 pt-0 space-y-2">
                    <button
                      onClick={() => {
                        window.dispatchEvent(new CustomEvent('chatbot:addProduct', { detail: { productName: product.name } }))
                      }}
                      className="w-full border border-amber-600 text-amber-600 py-1.5 md:py-2 text-sm rounded-md hover:bg-amber-600 hover:text-white transition"
                    >
                      💬 Chat to Buy
                    </button>
                    {isAdminAuthenticated && (
                      <button
                        onClick={() => deleteProduct(product.id, product.name)}
                        disabled={deletingId === product.id}
                        className="w-full bg-red-50 text-red-600 py-1.5 md:py-2 text-sm rounded-md hover:bg-red-100 transition disabled:opacity-50 flex items-center justify-center gap-1"
                      >
                        <Trash2 size={14} />
                        {deletingId === product.id ? 'Deleting...' : 'Delete (Admin)'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {productsData.totalPages > 1 && (
              <div className="flex justify-center gap-3 mt-12">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1 || loading}
                  className="px-5 py-2 border border-gray-200 rounded-md hover:border-amber-500 disabled:opacity-50 transition"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-gray-600">
                  Page {page} of {productsData.totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(productsData.totalPages, p + 1))}
                  disabled={page === productsData.totalPages || loading}
                  className="px-5 py-2 border border-gray-200 rounded-md hover:border-amber-500 disabled:opacity-50 transition"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <ChatBot />
    </main>
  )
}