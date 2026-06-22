'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, Truck, Shield, RotateCcw, ShoppingCart, Check } from 'lucide-react'
import Navbar from '../../components/ui/Navbar'
import ChatBot from '../../../components/Chatbot'
import toast from 'react-hot-toast'

interface Variant {
  id: string
  size: number | string
  color: string
  stock: number | string
}

interface Product {
  id: string
  name: string
  price: number
  category: string
  description: string
  material: string
  imageUrl: string
  hoverImageUrl?: string
  variants: Variant[]
  blurDataUrl?: string
  gender: 'male' | 'female' | 'unisex'
}

const DEFAULT_BLUR =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='

export default function ProductDetailPage() {
  const params = useParams()
  const [product, setProduct] = useState<Product | null>(null)
  const [selectedSize, setSelectedSize] = useState<string>('')
  const [selectedColor, setSelectedColor] = useState<string>('')
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)

  const normalizeSize = (size: unknown): string => String(size)
  const getStockNumber = (stock: unknown): number => {
    const num = Number(stock)
    return isNaN(num) ? 0 : num
  }

  const availableSizes = useMemo(() => {
    if (!product?.variants?.length) return []
    const sizes = product.variants.map(v => normalizeSize(v.size))
    return [...new Set(sizes)].sort((a, b) => Number(a) - Number(b))
  }, [product])

  const availableColors = useMemo(() => {
    if (!product?.variants?.length || !selectedSize) return []
    return product.variants
      .filter(v => normalizeSize(v.size) === selectedSize)
      .map(v => v.color)
  }, [product, selectedSize])

  const currentStock = useMemo(() => {
    if (!product?.variants?.length || !selectedSize || !selectedColor) return 0
    const variant = product.variants.find(
      v => normalizeSize(v.size) === selectedSize && v.color === selectedColor
    )
    return variant ? getStockNumber(variant.stock) : 0
  }, [product, selectedSize, selectedColor])

  useEffect(() => {
    if (!product?.variants?.length) return

    const inStockVariant = product.variants.find(v => getStockNumber(v.stock) > 0)
    if (inStockVariant) {
      setSelectedSize(normalizeSize(inStockVariant.size))
      setSelectedColor(inStockVariant.color)
    } else if (product.variants.length > 0) {
      setSelectedSize(normalizeSize(product.variants[0].size))
      setSelectedColor(product.variants[0].color)
    }
  }, [product])

  useEffect(() => {
    if (availableColors.length > 0 && !availableColors.includes(selectedColor)) {
      setSelectedColor(availableColors[0])
    } else if (availableColors.length === 0) {
      setSelectedColor('')
    }
  }, [selectedSize, availableColors, selectedColor])

  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/products/${params.id}`)
      if (!response.ok) {
        toast.error(response.status === 404 ? 'Product not found' : 'Failed to load product')
        setProduct(null)
        return
      }

      const data = await response.json()
      const variants = Array.isArray(data.variants) ? data.variants : []
      setProduct({ ...data, variants, blurDataUrl: data.blurDataUrl || DEFAULT_BLUR })
      setQuantity(1)
    } catch (error) {
      console.error('Error fetching product:', error)
      toast.error('Network error – please try again')
      setProduct(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (params?.id) fetchProduct()
  }, [params.id])

  // ─── DIRECT ADD TO CART ──────────────────────────────────────
  const addToCartDirect = async () => {
    if (!selectedSize) {
      toast.error('Please select a size')
      return
    }
    if (!selectedColor) {
      toast.error('Please select a colour')
      return
    }
    if (currentStock === 0) {
      toast.error('This combination is out of stock')
      return
    }
    if (quantity > currentStock) {
      toast.error(`Only ${currentStock} in stock`)
      return
    }

    setIsAdding(true)

    // Get or create session ID
    let sessionId = localStorage.getItem('chat_session_id')
    if (!sessionId) {
      sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
      localStorage.setItem('chat_session_id', sessionId)
    }

    try {
      const response = await fetch('/api/cart/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sessionId,
        },
        body: JSON.stringify({
          productId: product!.id,
          size: Number(selectedSize),
          color: selectedColor,
          quantity,
        }),
      })

      if (response.ok) {
        toast.success(`Added ${quantity} x ${product!.name} to cart!`)
        // Update the cart badge by dispatching event
        window.dispatchEvent(new Event('cartUpdated'))
      } else {
        const error = await response.json()
        toast.error(error.error || 'Could not add item')
      }
    } catch (error) {
      console.error('Add to cart error:', error)
      toast.error('Network error. Please try again.')
    } finally {
      setIsAdding(false)
    }
  }

  if (loading) {
    return (
      <main>
        <Navbar />
        <div className="pt-24 container-custom">
          <div className="animate-pulse">
            <div className="h-96 bg-gray-200 rounded-lg mb-4" />
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-2" />
            <div className="h-4 bg-gray-200 rounded w-1/4" />
          </div>
        </div>
      </main>
    )
  }

  if (!product) {
    return (
      <main>
        <Navbar />
        <div className="pt-24 container-custom text-center">
          <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
          <Link href="/products" className="text-amber-600 hover:underline">
            Back to Shop
          </Link>
        </div>
      </main>
    )
  }

  const getGenderDisplay = () => {
    if (product.gender === 'male') return { label: 'Men', style: 'bg-blue-100 text-blue-700' }
    if (product.gender === 'female') return { label: 'Women', style: 'bg-pink-100 text-pink-700' }
    if (product.gender === 'unisex') return { label: 'Unisex', style: 'bg-gray-100 text-gray-600' }
    return { label: '', style: 'bg-gray-100 text-gray-600' }
  }

  const genderDisplay = getGenderDisplay()

  return (
    <main>
      <Navbar />
      <div className="pt-24 pb-16 bg-gray-50 min-h-screen">
        <div className="container-custom max-w-6xl mx-auto px-4 sm:px-6">
          {/* Back button */}
          <Link
            href="/products"
            className="inline-flex items-center text-gray-500 hover:text-amber-600 transition-colors mb-6 text-sm font-medium"
          >
            <ChevronLeft size={16} className="mr-1" />
            Back to Shop
          </Link>

          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
              {/* ─── LEFT: IMAGES ─────────────────────────────────────── */}
              <div className="bg-gray-50 p-6 lg:p-8 flex flex-col">
                <div className="relative aspect-square w-full bg-white rounded-xl overflow-hidden shadow-inner">
                  {product.imageUrl ? (
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      fill
                      className="object-contain p-4 transition-transform duration-300 hover:scale-105"
                      priority
                      placeholder="blur"
                      blurDataURL={product.blurDataUrl || DEFAULT_BLUR}
                      sizes="(max-width: 768px) 100vw, 50vw"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/images/placeholder.webp'
                      }}
                    />
                  ) : (
                    <span className="text-9xl flex items-center justify-center h-full">👞</span>
                  )}
                </div>

                {product.hoverImageUrl && (
                  <div className="mt-4">
                    <p className="text-xs text-gray-400 mb-1">Alternative view</p>
                    <div className="relative aspect-video w-full bg-white rounded-xl overflow-hidden shadow-inner">
                      <Image
                        src={product.hoverImageUrl}
                        alt={`${product.name} alternate`}
                        fill
                        className="object-contain p-2"
                        placeholder="blur"
                        blurDataURL={product.blurDataUrl || DEFAULT_BLUR}
                        sizes="(max-width: 768px) 100vw, 50vw"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/images/placeholder.webp'
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* ─── RIGHT: DETAILS ────────────────────────────────────── */}
              <div className="p-6 lg:p-8 flex flex-col">
                <div className="flex-1">
                  {/* Gender badge */}
                  <span className={`inline-block text-xs px-3 py-1 rounded-full ${genderDisplay.style} mb-3`}>
                    {genderDisplay.label}
                  </span>

                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 leading-tight">
                    {product.name}
                  </h1>

                  <p className="text-2xl sm:text-3xl font-bold text-amber-600 mt-2">
                    {product.price.toLocaleString()} FCFA
                  </p>

                  <div className="mt-4 border-t border-gray-100 pt-4">
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {product.description}
                    </p>
                  </div>

                  <div className="mt-4">
                    <h3 className="text-sm font-semibold text-gray-700">Material</h3>
                    <p className="text-gray-600 text-sm capitalize">{product.material}</p>
                  </div>

                  {/* ─── SIZES ───────────────────────────────────────────── */}
                  <div className="mt-6">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Select Size</h3>
                    <div className="flex flex-wrap gap-2">
                      {availableSizes.map(size => (
                        <button
                          key={size}
                          onClick={() => setSelectedSize(size)}
                          className={`w-12 h-12 rounded-lg border-2 transition-all flex items-center justify-center text-sm font-medium ${
                            selectedSize === size
                              ? 'border-amber-600 bg-amber-50 text-amber-600'
                              : 'border-gray-200 hover:border-amber-300 text-gray-700'
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* ─── COLORS ──────────────────────────────────────────── */}
                  {availableColors.length > 0 && (
                    <div className="mt-4">
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">Select Colour</h3>
                      <div className="flex flex-wrap gap-2">
                        {availableColors.map(color => (
                          <button
                            key={color}
                            onClick={() => setSelectedColor(color)}
                            className={`px-4 py-2 rounded-lg border-2 transition-all text-sm capitalize font-medium ${
                              selectedColor === color
                                ? 'border-amber-600 bg-amber-50 text-amber-600'
                                : 'border-gray-200 hover:border-amber-300 text-gray-700'
                            }`}
                          >
                            {color}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ─── QUANTITY ────────────────────────────────────────── */}
                  <div className="mt-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Quantity</h3>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="w-10 h-10 rounded-lg border border-gray-200 hover:border-amber-300 flex items-center justify-center text-gray-600 disabled:opacity-50"
                        disabled={currentStock === 0}
                      >
                        -
                      </button>
                      <span className="text-lg font-semibold w-12 text-center">{quantity}</span>
                      <button
                        onClick={() => setQuantity(Math.min(currentStock, quantity + 1))}
                        className="w-10 h-10 rounded-lg border border-gray-200 hover:border-amber-300 flex items-center justify-center text-gray-600 disabled:opacity-50"
                        disabled={currentStock === 0 || quantity >= currentStock}
                      >
                        +
                      </button>
                      <span className="text-sm text-gray-500 ml-2">
                        {currentStock} in stock
                      </span>
                    </div>
                  </div>
                </div>

                {/* ─── ADD TO CART BUTTON ────────────────────────────────── */}
                <div className="mt-6">
                  <button
                    onClick={addToCartDirect}
                    disabled={currentStock === 0 || isAdding}
                    className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-semibold transition-all shadow-lg ${
                      currentStock === 0
                        ? 'bg-gray-400 cursor-not-allowed'
                        : isAdding
                        ? 'bg-amber-400 cursor-wait'
                        : 'bg-amber-600 hover:bg-amber-700 hover:shadow-xl'
                    }`}
                  >
                    {isAdding ? (
                      <>
                        <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                        Adding...
                      </>
                    ) : currentStock === 0 ? (
                      'Out of Stock'
                    ) : (
                      <>
                        <ShoppingCart size={18} />
                        Add to Cart
                      </>
                    )}
                  </button>
                  <p className="text-xs text-gray-400 text-center mt-2">
                    Secured checkout • Free delivery in Buea
                  </p>
                </div>

                {/* ─── FEATURES ───────────────────────────────────────────── */}
                <div className="mt-6 grid grid-cols-3 gap-3 border-t border-gray-100 pt-6">
                  <div className="flex flex-col items-center text-center">
                    <Truck size={18} className="text-amber-600 mb-1" />
                    <span className="text-xs text-gray-500">Free Delivery</span>
                  </div>
                  <div className="flex flex-col items-center text-center">
                    <Shield size={18} className="text-amber-600 mb-1" />
                    <span className="text-xs text-gray-500">Genuine Leather</span>
                  </div>
                  <div className="flex flex-col items-center text-center">
                    <RotateCcw size={18} className="text-amber-600 mb-1" />
                    <span className="text-xs text-gray-500">7‑Day Exchange</span>
                  </div>
                </div>

                {/* ─── CHAT PROMPT ────────────────────────────────────────── */}
                <div className="mt-4 text-center border-t border-gray-100 pt-4">
                  <p className="text-xs text-gray-400">
                    💬 Have questions?{' '}
                    <button
                      onClick={() => window.dispatchEvent(new CustomEvent('chatbot:open'))}
                      className="text-amber-600 hover:underline font-medium"
                    >
                      Chat with us
                    </button>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ChatBot />
    </main>
  )
}