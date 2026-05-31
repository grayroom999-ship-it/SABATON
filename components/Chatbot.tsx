'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Send, ShoppingBag, Trash2, Minus, Plus } from 'lucide-react'
import toast from 'react-hot-toast'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface CartItem {
  id: number
  name: string
  size: number
  color: string
  quantity: number
  price: number
  subtotal: number
}

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId, setSessionId] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [showCart, setShowCart] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  // Initialize session ID
  useEffect(() => {
    let storedId = localStorage.getItem('chat_session_id')
    if (!storedId) {
      storedId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
      localStorage.setItem('chat_session_id', storedId)
    }
    setSessionId(storedId)
    
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: "Hello! 👋 I'm ShoeBot, your AI shopping assistant for SABATON Leather Shoes.\n\nI can help you:\n• Find the perfect leather shoes\n• Add items to your cart\n• Check your cart and checkout\n\nWhat would you like to do today?",
        timestamp: new Date()
      }
    ])
  }, [])

  // Close chat when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen && chatContainerRef.current && !chatContainerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  // Listen for custom events to open chat or add product
  useEffect(() => {
    const handleAddProduct = (event: CustomEvent) => {
      const { productName, size, color, quantity } = event.detail
      setIsOpen(true)
      if (productName) {
        let message = `I'd like to buy ${productName}`
        if (size) message += ` size ${size}`
        if (quantity && quantity > 1) message += ` (${quantity} pairs)`
        setInput(message)
        setTimeout(() => {
          sendMessage(message)
        }, 500)
      }
    }
    
    const handleOpenChat = () => {
      setIsOpen(true)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
    
    window.addEventListener('chatbot:addProduct', handleAddProduct as EventListener)
    window.addEventListener('chatbot:open', handleOpenChat)
    
    return () => {
      window.removeEventListener('chatbot:addProduct', handleAddProduct as EventListener)
      window.removeEventListener('chatbot:open', handleOpenChat)
    }
  }, [])

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Fetch cart when chat opens
  useEffect(() => {
    if (isOpen && sessionId) {
      fetchCart()
    }
  }, [isOpen, sessionId])

  const fetchCart = async () => {
    try {
      const response = await fetch('/api/cart', {
        headers: { 'x-session-id': sessionId }
      })
      const data = await response.json()
      if (data.items) setCart(data.items)
    } catch (error) {
      console.error('Error fetching cart:', error)
    }
  }

  const sendMessage = async (messageText?: string) => {
    const userMessage = messageText || input
    if (!userMessage.trim() || isLoading) return

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messages.concat(userMsg).map(m => ({
            role: m.role,
            content: m.content
          })),
          sessionId: sessionId
        })
      })

      const data = await response.json()
      
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message || "I'm having trouble understanding. Can you rephrase?",
        timestamp: new Date()
      }
      setMessages(prev => [...prev, aiMsg])
      
      if (data.cartUpdated) {
        await fetchCart()
        window.dispatchEvent(new Event('cartUpdated'))
      }
      
    } catch (error) {
      console.error('Error sending message:', error)
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Sorry, I'm having connection issues. Please try again or WhatsApp us directly.",
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMsg])
    } finally {
      setIsLoading(false)
    }
  }

  const updateCartItem = async (itemId: number, newQuantity: number) => {
    if (newQuantity < 1) {
      await removeCartItem(itemId)
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
        await fetchCart()
        window.dispatchEvent(new Event('cartUpdated'))
      }
    } catch (error) {
      console.error('Error updating cart:', error)
    }
  }

  const removeCartItem = async (itemId: number) => {
    try {
      const response = await fetch(`/api/cart/remove?itemId=${itemId}`, {
        method: 'DELETE',
        headers: { 'x-session-id': sessionId }
      })
      if (response.ok) {
        await fetchCart()
        window.dispatchEvent(new Event('cartUpdated'))
        toast.success('Item removed from cart')
      }
    } catch (error) {
      console.error('Error removing item:', error)
    }
  }

  const cartTotal = cart.reduce((sum, item) => sum + item.subtotal, 0)

  // Floating button (closed state)
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-5 right-5 bg-amber-600 text-white rounded-full w-16 h-16 shadow-lg hover:bg-amber-700 transition-all z-50 flex items-center justify-center text-2xl group"
      >
        <span className="group-hover:scale-110 transition">💬</span>
        {cart.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {cart.length}
          </span>
        )}
      </button>
    )
  }

  // Open state: overlay + chat window
  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setIsOpen(false)} />
      <div 
        ref={chatContainerRef}
        className="fixed bottom-5 right-5 w-[400px] h-[650px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 border border-gray-200 overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-700 to-amber-600 text-white p-4 flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">👞</span>
              <span className="font-bold">ShoeBot Assistant</span>
            </div>
            <p className="text-xs opacity-90 mt-1">AI-powered • Always here to help</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowCart(!showCart)} className="relative p-2 hover:bg-amber-800 rounded-lg transition">
              <ShoppingBag size={18} />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-yellow-400 text-amber-900 text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {cart.length}
                </span>
              )}
            </button>
            <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-amber-800 rounded-lg transition">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Cart Sidebar */}
        {showCart && (
          <div className="absolute inset-0 bg-white z-10 flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-bold text-lg">Your Cart</h3>
              <button onClick={() => setShowCart(false)} className="text-gray-500"><X size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {cart.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <ShoppingBag className="mx-auto mb-2" size={48} />
                  <p>Your cart is empty</p>
                  <p className="text-sm">Chat with ShoeBot to add items!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div key={item.id} className="flex gap-3 border-b pb-3">
                      <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center"><span className="text-2xl">👞</span></div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm">{item.name}</h4>
                        <p className="text-xs text-gray-500">Size {item.size} • {item.color}</p>
                        <p className="text-amber-600 font-bold text-sm">{item.price.toLocaleString()} FCFA</p>
                        <div className="flex items-center gap-2 mt-2">
                          <button onClick={() => updateCartItem(item.id, item.quantity - 1)} className="w-6 h-6 border rounded flex items-center justify-center hover:bg-gray-100"><Minus size={12} /></button>
                          <span className="text-sm w-6 text-center">{item.quantity}</span>
                          <button onClick={() => updateCartItem(item.id, item.quantity + 1)} className="w-6 h-6 border rounded flex items-center justify-center hover:bg-gray-100"><Plus size={12} /></button>
                          <button onClick={() => removeCartItem(item.id)} className="ml-auto text-red-500 hover:text-red-700"><Trash2 size={14} /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {cart.length > 0 && (
              <div className="p-4 border-t">
                <div className="flex justify-between font-bold mb-3">
                  <span>Total:</span>
                  <span className="text-amber-600">{cartTotal.toLocaleString()} FCFA</span>
                </div>
                <button
                  onClick={() => {
                    setShowCart(false)
                    setInput("I'd like to checkout")
                    sendMessage("I'd like to checkout")
                  }}
                  className="w-full bg-amber-600 text-white py-2 rounded-lg font-semibold hover:bg-amber-700"
                >
                  Proceed to Checkout
                </button>
              </div>
            )}
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-3 rounded-lg ${message.role === 'user' ? 'bg-amber-600 text-white rounded-br-none' : 'bg-gray-100 text-gray-800 rounded-bl-none'}`}>
                <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                <div className={`text-xs mt-1 ${message.role === 'user' ? 'text-amber-100' : 'text-gray-400'}`}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 p-3 rounded-lg rounded-bl-none">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="p-4 border-t border-gray-200 flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-amber-500"
            disabled={isLoading}
          />
          <button type="submit" disabled={isLoading || !input.trim()} className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 disabled:opacity-50">
            <Send size={18} />
          </button>
        </form>
      </div>
    </>
  )
}