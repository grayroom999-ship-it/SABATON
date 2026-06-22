'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Trash2, Minus, Plus, ArrowLeft, ShoppingBag, Truck, Shield, RotateCcw } from 'lucide-react'
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
  imageUrl?: string
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
        toast.success('Cart updated')
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
      <main className="bg-white min-h-screen">
        <Navbar />
        <div className="pt-24 container-custom">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="space-y-4">
              {[1,2,3].map(i => (
                <div key={i} className="h-28 bg-gray-100 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="bg-white min-h-screen">
      <Navbar />

      <div className="pt-24 pb-8 bg-white">
        <div className="container-custom text-center">
          <span className="text-amber-600 text-sm tracking-widest font-serif uppercase">Your selection</span>
          <h1 className="text-3xl md:text-4xl font-light tracking-tight mt-2">
            Shopping Cart
          </h1>
          <div className="w-16 h-px bg-amber-500 mx-auto my-4"></div>
          <p className="text-gray-500 max-w-xl mx-auto">
            Review your items and proceed to checkout with our AI assistant.
          </p>
        </div>
      </div>

      <div className="container-custom pb-16">
        <div className="flex items-center justify-between mb-8">
          <Link 
            href="/products" 
            className="text-amber-600 hover:text-amber-700 flex items-center gap-1 text-sm transition"
          >
            <ArrowLeft size={16} />
            Continue Shopping
          </Link>
        </div>

        {cart.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-lg">
            <ShoppingBag className="mx-auto mb-4 text-gray-400" size={64} strokeWidth={1.5} />
            <h2 className="text-2xl font-light mb-2">Your cart is empty</h2>
            <p className="text-gray-500 mb-6">Looks like you haven't added any shoes yet.</p>
            <Link
              href="/products"
              className="inline-block bg-amber-600 text-white px-8 py-2 rounded-full hover:bg-amber-700 transition"
            >
              Browse Collection
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {cart.map((item) => (
                <div 
                  key={item.id} 
                  className="bg-white border border-gray-100 rounded-lg shadow-sm hover:shadow-md transition p-4 flex gap-4"
                >
                  <div className="w-20 h-20 bg-gray-100 rounded-md flex items-center justify-center overflow-hidden">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        width={80}
                        height={80}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <span className="text-3xl">👞</span>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-800">{item.name}</h3>
                    <p className="text-sm text-gray-500 mt-0.5">
                      Size {item.size} • {item.color}
                    </p>
                    <p className="text-amber-600 font-semibold mt-1">
                      {item.price.toLocaleString()} FCFA
                    </p>
                    
                    <div className="flex items-center gap-4 mt-3">
                      <div className="flex items-center border border-gray-200 rounded-md">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="px-2 py-1 hover:bg-gray-50 transition"
                          aria-label="Decrease quantity"
                        >
                          <Minus size={14} className="text-gray-600" />
                        </button>
                        <span className="w-8 text-center text-sm">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="px-2 py-1 hover:bg-gray-50 transition"
                          aria-label="Increase quantity"
                        >
                          <Plus size={14} className="text-gray-600" />
                        </button>
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-gray-400 hover:text-red-500 transition"
                        aria-label="Remove item"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-semibold text-gray-800">
                      {item.subtotal.toLocaleString()} FCFA
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="lg:sticky lg:top-24 h-fit">
              <div className="bg-white border border-gray-100 rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-medium text-gray-800 mb-4">Order Summary</h2>
                
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>{cartTotal.toLocaleString()} FCFA</span>
                  </div>
                  <div className="flex justify-between text-green-600">
                    <span>Delivery (Buea town)</span>
                    <span>Free</span>
                  </div>
                  <div className="border-t border-gray-100 pt-3 mt-3">
                    <div className="flex justify-between font-semibold text-gray-800">
                      <span>Total</span>
                      <span className="text-amber-600 text-lg">{cartTotal.toLocaleString()} FCFA</span>
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
                  className="w-full bg-amber-600 text-white py-3 rounded-md font-medium hover:bg-amber-700 transition mt-6"
                >
                  💬 Checkout with AI Assistant
                </button>
                
                <p className="text-xs text-gray-400 text-center mt-3">
                  Chat with ShoeBot to complete your order via Mobile Money
                </p>
              </div>

              <div className="mt-6 grid grid-cols-3 gap-2 text-center text-xs text-gray-500 border-t border-gray-100 pt-6">
                <div><Truck className="mx-auto mb-1" size={18} strokeWidth={1.5} /> Free Delivery</div>
                <div><RotateCcw className="mx-auto mb-1" size={18} strokeWidth={1.5} /> 7 Days Returns</div>
                <div><Shield className="mx-auto mb-1" size={18} strokeWidth={1.5} /> Genuine Leather</div>
              </div>
            </div>
          </div>
        )}
      </div>

      <ChatBot />
    </main>
  )
}