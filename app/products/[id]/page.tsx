'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, Star, Truck, Shield, RotateCcw } from 'lucide-react'
import Navbar from '../../components/ui/Navbar'
import ChatBot from '../../../components/Chatbot'
import toast from 'react-hot-toast'

interface Product {
  id: number
  name: string
  price: number
  category: string
  description: string
  material: string
  imageUrl: string
  variants: Array<{
    id: number
    size: number
    color: string
    stock: number
  }>
}

export default function ProductDetailPage() {
  const params = useParams()
  const [product, setProduct] = useState<Product | null>(null)
  const [selectedSize, setSelectedSize] = useState<number | null>(null)
  const [selectedColor, setSelectedColor] = useState<string>('')
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params?.id) {
      fetchProduct()
    }
  }, [params.id])

  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/products/${params.id}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          toast.error('Product not found')
        } else {
          toast.error('Failed to load product')
        }
        setProduct(null)
        return
      }
      
      const data = await response.json()
      
      // Ensure variants is always an array
      const productWithSafeVariants = {
        ...data,
        variants: Array.isArray(data.variants) ? data.variants : []
      }
      
      setProduct(productWithSafeVariants)
      
      if (productWithSafeVariants.variants.length > 0) {
        setSelectedSize(productWithSafeVariants.variants[0].size)
        setSelectedColor(productWithSafeVariants.variants[0].color)
      }
    } catch (error) {
      console.error('Error fetching product:', error)
      toast.error('Network error – please try again')
      setProduct(null)
    } finally {
      setLoading(false)
    }
  }

  const addToCartViaChat = () => {
    if (!selectedSize) {
      toast.error('Please select a size')
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

  const getAvailableSizes = () => {
    if (!product?.variants || !Array.isArray(product.variants)) return []
    return [...new Set(product.variants.map(v => v.size))].sort((a, b) => a - b)
  }

  const getAvailableColors = () => {
    if (!product?.variants || !Array.isArray(product.variants) || !selectedSize) return []
    return product.variants
      .filter(v => v.size === selectedSize)
      .map(v => v.color)
  }

  const getStockForSelection = () => {
    if (!product?.variants || !Array.isArray(product.variants) || !selectedSize || !selectedColor) return 0
    const variant = product.variants.find(
      v => v.size === selectedSize && v.color === selectedColor
    )
    return variant?.stock || 0
  }

  if (loading) {
    return (
      <main>
        <Navbar />
        <div className="pt-24 container-custom">
          <div className="animate-pulse">
            <div className="h-96 bg-gray-200 rounded-lg mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
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

  const availableSizes = getAvailableSizes()
  const availableColors = getAvailableColors()
  const currentStock = getStockForSelection()

  return (
    <main>
      <Navbar />
      
      <div className="pt-24 pb-16">
        <div className="container-custom">
          {/* Breadcrumb */}
          <Link href="/products" className="inline-flex items-center text-gray-600 hover:text-amber-600 mb-6">
            <ChevronLeft size={18} />
            Back to Shop
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Product Image - FIXED to use actual imageUrl */}
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

            {/* Product Info */}
            <div>
              <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={18} fill="currentColor" />
                  ))}
                </div>
                <span className="text-gray-600">(12 reviews)</span>
              </div>
              
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
                    >
                      -
                    </button>
                    <span className="text-lg font-semibold w-12 text-center">{quantity}</span>
                    <button
                      onClick={() => setQuantity(Math.min(currentStock, quantity + 1))}
                      className="w-10 h-10 border rounded-lg hover:bg-gray-50"
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
              
              {/* Features */}
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
            </div>
          </div>
        </div>
      </div>
      
      <ChatBot />
    </main>
  )
}