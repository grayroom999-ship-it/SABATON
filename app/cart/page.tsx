'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Trash2, Minus, Plus, ArrowLeft, ShoppingBag } from 'lucide-react'
import Navbar from '../components/ui/Navbar'
import ChatBot from '../../components/Chatbot'
import toast from 'react-hot-toast'

interface CartItem {
  id: number
  name: string
  size: number
  color: string
  quantity: number
  price: number
  subtotal: number
}

export default function CartPage() {
  const [cart, setCart] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [sessionId, setSessionId] = useState('')

  useEffect(() => {
    const storedId = localStorage.getItem('chat_session_id')
    if (storedId) {
      setSessionId(storedId)
      fetchCart(storedId)
    } else {
      setLoading(false)
    }
  }, [])

  const fetchCart = async (sid: string) => {
    try {
      const response = await fetch('/api/cart', {
        headers: { 'x-session-id': sid }
      })
      const data = await response.json()
      setCart(data.items || [])
    } catch (error) {
      console.error('Error fetching cart:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateQuantity = async (itemId: number, newQuantity: number) => {
    if (newQuantity < 1) {
      await removeItem(itemId)
      return
    }
    
    try {
      const response = await fetch('/api/cart/update', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'x-session-id': sessionId
        },
        body: JSON.stringify({ itemId, quantity: newQuantity })
      })
      
      if (response.ok) {
        await fetchCart(sessionId)
        window.dispatchEvent(new Event('cartUpdated'))
      }
    } catch (error) {
      console.error('Error updating cart:', error)
      toast.error('Failed to update cart')
    }
  }

  const removeItem = async (itemId: number) => {
    try {
      const response = await fetch(`/api/cart/remove?itemId=${itemId}`, {
        method: 'DELETE',
        headers: { 'x-session-id': sessionId }
      })
      
      if (response.ok) {
        await fetchCart(sessionId)
        window.dispatchEvent(new Event('cartUpdated'))
        toast.success('Item removed')
      }
    } catch (error) {
      console.error('Error removing item:', error)
      toast.error('Failed to remove item')
    }
  }

  const cartTotal = cart.reduce((sum, item) => sum + item.subtotal, 0)

  if (loading) {
    return (
      <main>
        <Navbar />
        <div className="pt-24 container-custom">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="space-y-4">
              {[1,2,3].map(i => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main>
      <Navbar />
      
      <div className="pt-24 pb-16">
        <div className="container-custom">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl md:text-3xl font-bold">Your Cart</h1>
            <Link href="/products" className="text-amber-600 hover:underline flex items-center gap-1">
              <ArrowLeft size={16} />
              Continue Shopping
            </Link>
          </div>

          {cart.length === 0 ? (
            <div className="text-center py-16">
              <ShoppingBag className="mx-auto mb-4 text-gray-400" size={64} />
              <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
              <p className="text-gray-600 mb-6">Looks like you haven't added any shoes yet.</p>
              <Link
                href="/products"
                className="inline-block bg-amber-600 text-white px-6 py-2 rounded-lg hover:bg-amber-700"
              >
                Browse Shoes
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-4">
                {cart.map((item) => (
                  <div key={item.id} className="bg-white rounded-lg shadow p-4 flex gap-4">
                    <div className="w-20 h-20 bg-gray-100 rounded flex items-center justify-center">
                      <span className="text-3xl">👞</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{item.name}</h3>
                      <p className="text-sm text-gray-500">Size {item.size} • {item.color}</p>
                      <p className="text-amber-600 font-bold">{item.price.toLocaleString()} FCFA</p>
                      
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center border rounded">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="px-2 py-1 hover:bg-gray-100"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="px-3 py-1 text-sm">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="px-2 py-1 hover:bg-gray-100"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{item.subtotal.toLocaleString()} FCFA</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Summary */}
              <div className="bg-white rounded-lg shadow p-6 h-fit sticky top-24">
                <h2 className="text-xl font-bold mb-4">Order Summary</h2>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{cartTotal.toLocaleString()} FCFA</span>
                  </div>
                  <div className="flex justify-between text-green-600">
                    <span>Delivery (Buea)</span>
                    <span>Free</span>
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span className="text-amber-600">{cartTotal.toLocaleString()} FCFA</span>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => {
                    const event = new CustomEvent('chatbot:open')
                    window.dispatchEvent(event)
                    setTimeout(() => {
                      const inputEvent = new CustomEvent('chatbot:message', {
                        detail: { message: "I'd like to checkout my cart" }
                      })
                      window.dispatchEvent(inputEvent)
                    }, 500)
                  }}
                  className="w-full bg-amber-600 text-white py-3 rounded-lg font-semibold hover:bg-amber-700 transition mb-3"
                >
                  💬 Checkout with AI Assistant
                </button>
                
                <p className="text-xs text-gray-500 text-center">
                  Chat with ShoeBot to complete your order via Mobile Money
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <ChatBot />
    </main>
  )
}