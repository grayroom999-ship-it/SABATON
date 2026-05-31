'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CheckCircle, Package, Truck, Clock } from 'lucide-react'
import Navbar from '../../components/ui/Navbar'
import ChatBot from '../../../components/Chatbot'

export default function OrderSuccessPage() {
  const [orderNumber, setOrderNumber] = useState('')
  
  useEffect(() => {
    // Get order number from URL or localStorage
    const params = new URLSearchParams(window.location.search)
    const order = params.get('order')
    if (order) {
      setOrderNumber(order)
      // Clear cart from localStorage
      localStorage.removeItem('cart')
    }
  }, [])
  
  return (
    <main>
      <Navbar />
      
      <div className="pt-24 pb-16">
        <div className="container-custom max-w-2xl mx-auto text-center">
          <div className="bg-green-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="text-green-500" size={40} />
          </div>
          
          <h1 className="text-3xl font-bold mb-2">Order Confirmed! 🎉</h1>
          <p className="text-gray-600 mb-6">
            Thank you for shopping with Buea Leather Shoes
          </p>
          
          {orderNumber && (
            <div className="bg-gray-100 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-600">Order Number</p>
              <p className="text-xl font-mono font-bold">{orderNumber}</p>
            </div>
          )}
          
          <div className="bg-white rounded-lg shadow p-6 mb-8 text-left">
            <h2 className="font-semibold mb-4">What's Next?</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="bg-amber-100 rounded-full p-2">
                  <Package size={16} className="text-amber-600" />
                </div>
                <div>
                  <p className="font-semibold">Order Processing</p>
                  <p className="text-sm text-gray-600">We're preparing your shoes</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-amber-100 rounded-full p-2">
                  <Clock size={16} className="text-amber-600" />
                </div>
                <div>
                  <p className="font-semibold">Same-Day Dispatch</p>
                  <p className="text-sm text-gray-600">Orders before 2PM ship today</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-amber-100 rounded-full p-2">
                  <Truck size={16} className="text-amber-600" />
                </div>
                <div>
                  <p className="font-semibold">Free Delivery</p>
                  <p className="text-sm text-gray-600">24-hour delivery in Buea</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <Link
              href="/products"
              className="inline-block bg-amber-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-amber-700 transition w-full md:w-auto"
            >
              Continue Shopping
            </Link>
            <div>
              <a
                href="https://wa.me/2376XXXXXXX"
                target="_blank"
                className="text-amber-600 hover:underline"
              >
                Have questions? WhatsApp us
              </a>
            </div>
          </div>
        </div>
      </div>
      
      <ChatBot />
    </main>
  )
}