'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, Truck, Shield, RotateCcw } from 'lucide-react'
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
  hoverImageUrl?: string   // 👈 NEW: optional second image
  variants: Variant[]
}

export default function ProductDetailPage() {
  const params = useParams()
  const [product, setProduct] = useState<Product | null>(null)
  const [selectedSize, setSelectedSize] = useState<string>('')
  const [selectedColor, setSelectedColor] = useState<string>('')
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(true)

  // ---- Helper: normalise size to string ----
  const normalizeSize = (size: unknown): string => String(size)

  // ---- Helper: normalise stock to number ----
  const getStockNumber = (stock: unknown): number => {
    const num = Number(stock)
    return isNaN(num) ? 0 : num
  }

  // ---- Memoized derived data ----
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

  // ---- Auto‑select first in‑stock variant after product loads ----
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

  // ---- Reset color when size changes ----
  useEffect(() => {
    if (availableColors.length > 0 && !availableColors.includes(selectedColor)) {
      setSelectedColor(availableColors[0])
    } else if (availableColors.length === 0) {
      setSelectedColor('')
    }
  }, [selectedSize, availableColors, selectedColor])

  // ---- Fetch product ----
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
      setProduct({ ...data, variants })
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

  const addToCartViaChat = () => {
    if (!selectedSize) {
      toast.error('Please select a size')
      return
    }
    if (!selectedColor) {
      toast.error('Please select a color')
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

    const event = new CustomEvent('chatbot:addProduct', {
      detail: {
        productName: product?.name,
        size: selectedSize,
        color: selectedColor,
        quantity: quantity
      }
    })
    window.dispatchEvent(event)
    toast.success('Opening chatbot to add item to cart!')
  }

  // ---- Loading & error states ----
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

  return (
    <main>
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container-custom">
          <Link href="/products" className="inline-flex items-center text-gray-600 hover:text-amber-600 mb-6">
            <ChevronLeft size={18} />
            Back to Shop
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Main Image + Alternate Image (if exists) */}
            <div>
              <div className="bg-gray-100 rounded-lg h-96 lg:h-125 flex items-center justify-center overflow-hidden">
                {product.imageUrl ? (
                  <Image
                    src={product.imageUrl}
                    alt={product.name}
                    width={600}
                    height={600}
                    className="object-cover w-full h-full"
                    priority
                  />
                ) : (
                  <span className="text-9xl">👞</span>
                )}
              </div>
              {/* 👇 NEW: Show hover/alternate image if available */}
              {product.hoverImageUrl && (
                <div className="mt-4">
                  <p className="text-sm text-gray-500 mb-1">Alternate view</p>
                  <div className="bg-gray-100 rounded-lg h-48 flex items-center justify-center overflow-hidden">
                    <Image
                      src={product.hoverImageUrl}
                      alt={`${product.name} alternate`}
                      width={600}
                      height={300}
                      className="object-cover w-full h-full"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Product Info (unchanged) */}
            <div>
              <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
              <p className="text-3xl font-bold text-amber-600 mb-4">
                {product.price.toLocaleString()} FCFA
              </p>

              <p className="text-gray-600 mb-6">{product.description}</p>

              <div className="border-t border-b py-6 mb-6">
                <div className="mb-4">
                  <h3 className="font-semibold mb-2">Material:</h3>
                  <p className="text-gray-600">{product.material}</p>
                </div>

                {/* Size Selection */}
                <div className="mb-4">
                  <h3 className="font-semibold mb-2">Select Size:</h3>
                  <div className="flex flex-wrap gap-2">
                    {availableSizes.map(size => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`w-14 py-2 rounded-lg border transition ${
                          selectedSize === size
                            ? 'border-amber-600 bg-amber-50 text-amber-600'
                            : 'border-gray-300 hover:border-amber-600'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color Selection */}
                {availableColors.length > 0 && (
                  <div className="mb-4">
                    <h3 className="font-semibold mb-2">Select Color:</h3>
                    <div className="flex flex-wrap gap-2">
                      {availableColors.map(color => (
                        <button
                          key={color}
                          onClick={() => setSelectedColor(color)}
                          className={`px-4 py-2 rounded-lg border capitalize transition ${
                            selectedColor === color
                              ? 'border-amber-600 bg-amber-50 text-amber-600'
                              : 'border-gray-300 hover:border-amber-600'
                          }`}
                        >
                          {color}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quantity */}
                <div className="mb-4">
                  <h3 className="font-semibold mb-2">Quantity:</h3>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 border rounded-lg hover:bg-gray-50"
                      disabled={currentStock === 0}
                    >
                      -
                    </button>
                    <span className="text-lg font-semibold w-12 text-center">{quantity}</span>
                    <button
                      onClick={() => setQuantity(Math.min(currentStock, quantity + 1))}
                      className="w-10 h-10 border rounded-lg hover:bg-gray-50"
                      disabled={currentStock === 0 || quantity >= currentStock}
                    >
                      +
                    </button>
                    <span className="text-gray-600 text-sm">
                      {currentStock} in stock
                    </span>
                  </div>
                </div>
              </div>

              {/* Add to Cart Button */}
              <button
                onClick={addToCartViaChat}
                disabled={currentStock === 0}
                className="w-full bg-amber-600 text-white py-3 rounded-lg font-semibold hover:bg-amber-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed mb-4"
              >
                {currentStock === 0 ? 'Out of Stock' : '💬 Add to Cart via Chat'}
              </button>

              {/* Features / Benefits */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-gray-600">
                  <Truck size={20} />
                  <span>Free delivery in Buea town</span>
                </div>
                <div className="flex items-center gap-3 text-gray-600">
                  <Shield size={20} />
                  <span>100% genuine leather</span>
                </div>
                <div className="flex items-center gap-3 text-gray-600">
                  <RotateCcw size={20} />
                  <span>Size exchange within 7 days</span>
                </div>
              </div>

              <div className="mt-8 text-center text-gray-400 text-sm border-t pt-6">
                <p>💬 Have questions about this product? Click “Add to Cart via Chat” and ask us anything!</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ChatBot />
    </main>
  )
}