'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Send, ShoppingBag, Trash2, Minus, Plus, CreditCard, Loader2, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { useChat, type Message } from '@/context/ChatContext';
import { simulatePayment } from '../app/utils/payment';

const PLACEHOLDER_SVG =
  "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23f0f0f0'/%3E%3Ctext x='50' y='50' font-family='Arial' font-size='12' fill='%23999' text-anchor='middle' dominant-baseline='central'%3ENo Image%3C/text%3E%3C/svg%3E";

interface CartItem {
  id: string;
  productId: string;
  name: string;
  size: number;
  color: string;
  quantity: number;
  price: number;
  subtotal: number;
  imageUrl?: string;
}

const productCache = new Map<string, any>();

export default function ChatBot() {
  const { messages, addMessage, clearMessages } = useChat();

  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);

  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'mtn_momo' | 'orange_money'>('mtn_momo');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const [selectedVariants, setSelectedVariants] = useState<Record<string, { size: number; color: string }>>({});
  const [addingProductId, setAddingProductId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const getSessionId = (): string => {
    if (sessionId) return sessionId;
    let sid = localStorage.getItem('chat_session_id');
    if (!sid) {
      sid = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('chat_session_id', sid);
    }
    setSessionId(sid);
    return sid;
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 150);
    }
  }, [isOpen]);

  useEffect(() => {
    const sid = getSessionId();
    setSessionId(sid);
    if (messages.length === 0) {
      addMessage({
        role: 'assistant',
        content: "Hello! 👋 I'm ShoeBot, your AI shopping assistant for SABATON Leather Shoes.\n\nI can help you:\n• Find the perfect leather shoes\n• Add items to your cart\n• Check your cart and checkout\n\nWhat would you like to do today?",
      });
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen && chatContainerRef.current && !chatContainerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) fetchCart();
  }, [isOpen, sessionId]);

  useEffect(() => {
    const handleAddProduct = (event: CustomEvent) => {
      const { productName, size, color, quantity } = event.detail;
      setIsOpen(true);
      if (productName) {
        let msg = `I'd like to buy ${productName}`;
        if (size) msg += ` size ${size}`;
        if (quantity && quantity > 1) msg += ` (${quantity} pairs)`;
        setInput(msg);
        setTimeout(() => sendMessage(msg), 500);
      }
    };
    const handleOpenChat = () => {
      setIsOpen(true);
      setTimeout(() => inputRef.current?.focus(), 100);
    };
    const handleChatMessage = (event: CustomEvent) => {
      const { message } = event.detail;
      if (message) {
        setInput(message);
        setTimeout(() => sendMessage(message), 300);
      }
    };
    window.addEventListener('chatbot:addProduct', handleAddProduct as EventListener);
    window.addEventListener('chatbot:open', handleOpenChat);
    window.addEventListener('chatbot:message', handleChatMessage as EventListener);
    return () => {
      window.removeEventListener('chatbot:addProduct', handleAddProduct as EventListener);
      window.removeEventListener('chatbot:open', handleOpenChat);
      window.removeEventListener('chatbot:message', handleChatMessage as EventListener);
    };
  }, []);

  const fetchCart = async () => {
    const sid = getSessionId();
    try {
      const response = await fetch('/api/cart', {
        headers: { 'x-session-id': sid },
      });
      const data = await response.json();
      if (data.items) setCart(data.items);
    } catch (error) {
      console.error('Error fetching cart:', error);
    }
  };

  const addToCart = async (productId: string, size: number, color: string, quantity: number) => {
    const sid = getSessionId();
    if (!productId || typeof productId !== 'string') {
      toast.error('Invalid product ID');
      return false;
    }
    if (typeof size !== 'number' || isNaN(size) || size <= 0) {
      toast.error('Invalid size');
      return false;
    }
    if (!color || typeof color !== 'string') {
      toast.error('Invalid color');
      return false;
    }
    if (typeof quantity !== 'number' || quantity < 1) {
      toast.error('Quantity must be at least 1');
      return false;
    }

    try {
      const response = await fetch('/api/cart/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sid,
        },
        body: JSON.stringify({ productId, size, color, quantity }),
      });
      if (response.ok) {
        await fetchCart();
        window.dispatchEvent(new Event('cartUpdated'));
        toast.success('Added to cart!');
        return true;
      } else {
        const error = await response.json();
        toast.error(error.error || 'Could not add item');
        return false;
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Network error. Please try again.');
      return false;
    }
  };

  const updateCartItem = async (itemId: string, newQuantity: number) => {
    const sid = getSessionId();
    if (newQuantity < 1) {
      await removeCartItem(itemId);
      return;
    }
    try {
      const response = await fetch('/api/cart/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sid,
        },
        body: JSON.stringify({ itemId, quantity: newQuantity }),
      });
      if (response.ok) {
        await fetchCart();
        window.dispatchEvent(new Event('cartUpdated'));
      }
    } catch (error) {
      console.error('Error updating cart:', error);
    }
  };

  const removeCartItem = async (itemId: string) => {
    const sid = getSessionId();
    try {
      const response = await fetch(`/api/cart/remove?itemId=${itemId}`, {
        method: 'DELETE',
        headers: { 'x-session-id': sid },
      });
      if (response.ok) {
        await fetchCart();
        window.dispatchEvent(new Event('cartUpdated'));
        toast.success('Item removed from cart');
      }
    } catch (error) {
      console.error('Error removing item:', error);
    }
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.subtotal, 0);

  const handleClearChat = () => {
    if (confirm('Clear all conversation history? This will not affect your cart.')) {
      clearMessages();
      addMessage({
        role: 'assistant',
        content: "🔄 Conversation cleared. How can I help you with your shoe needs today? 👞",
      });
      toast.success('Chat history cleared');
    }
  };

  const getImageUrl = (product: any): string => {
    if (product.image && product.image.startsWith('http')) {
      return product.image;
    }
    if (product.image) {
      return product.image;
    }
    return PLACEHOLDER_SVG;
  };

  const handleVariantChange = (productId: string, field: 'size' | 'color', value: string | number) => {
    setSelectedVariants(prev => ({
      ...prev,
      [productId]: {
        ...(prev[productId] || { size: 0, color: '' }),
        [field]: value,
      }
    }));
  };

  const getUniqueOptions = (variants: any[], field: 'size' | 'color') => {
    const values = variants.map(v => v[field]);
    return [...new Set(values)].sort((a, b) => (typeof a === 'number' ? a - b : a.localeCompare(b)));
  };

  const initSelectedVariant = (product: any) => {
    const pid = product.id;
    if (!selectedVariants[pid] && product.variants && product.variants.length > 0) {
      const first = product.variants[0];
      setSelectedVariants(prev => ({
        ...prev,
        [pid]: { size: first.size, color: first.color },
      }));
    }
  };

  const sendMessage = async (messageText?: string) => {
    const userMessage = messageText || input;
    if (!userMessage.trim() || isLoading) return;

    getSessionId();

    addMessage({
      role: 'user',
      content: userMessage,
    });
    setInput('');
    setIsLoading(true);

    try {
      const history = messages.concat({
        id: 'temp',
        role: 'user',
        content: userMessage,
        timestamp: new Date(),
      } as Message);

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: history.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          sessionId: getSessionId(),
        }),
      });

      const data = await response.json();

      const assistantContent = data.message || "I'm having trouble understanding. Can you rephrase?";

      if (data.products && data.products.length > 0) {
        data.products.forEach((p: any) => {
          productCache.set(p.name.toLowerCase(), p);
        });
      }

      addMessage({
        role: 'assistant',
        content: assistantContent,
        recommendations: data.recommendations || [],
        products: data.products || [],
        cart: data.cart || [],
      });

      await fetchCart();

      if (data.products && data.products.length > 0) {
        data.products.forEach((p: any) => {
          initSelectedVariant(p);
        });
      }

      if (data.checkout) {
        setShowCart(false);
        setShowCheckoutModal(true);
        await fetchCart();
      }

    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckoutPayment = async () => {
    if (cart.length === 0) {
      toast.error('Your cart is empty');
      return;
    }
    if (!phoneNumber || phoneNumber.length < 9) {
      setPaymentError('Please enter a valid phone number (e.g., 6XXXXXXXX)');
      return;
    }
    if (!deliveryAddress || deliveryAddress.length < 5) {
      setPaymentError('Please enter a valid delivery address');
      return;
    }

    setIsProcessingPayment(true);
    setPaymentError(null);

    try {
      const paymentResult = await simulatePayment({
        amount: cartTotal,
        currency: 'XAF',
        method: paymentMethod,
        phoneNumber,
      });

      if (!paymentResult.success) {
        throw new Error(paymentResult.message || 'Payment failed');
      }

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: getSessionId(),
          paymentMethod,
          phoneNumber,
          deliveryAddress,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create order');
      }

      await fetchCart();
      setShowCheckoutModal(false);
      toast.success('Order placed successfully! 🎉');

      addMessage({
        role: 'assistant',
        content: `✅ Your order #${data.orderId} has been confirmed!\n\nWe'll prepare your shoes and deliver them within 24 hours in Buea.\n\nThank you for shopping with us! 👞`,
      });

      setCart([]);
      setPhoneNumber('');
      setDeliveryAddress('');
    } catch (err: any) {
      console.error('Checkout error:', err);
      setPaymentError(err.message || 'Payment failed. Please try again.');
      toast.error('Checkout failed');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-5 right-5 bg-amber-600 text-white rounded-full w-14 h-14 sm:w-16 sm:h-16 shadow-lg hover:bg-amber-700 transition-all z-50 flex items-center justify-center text-xl sm:text-2xl group"
      >
        <span className="group-hover:scale-110 transition">💬</span>
        {cart.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {cart.length}
          </span>
        )}
      </button>
    );
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setIsOpen(false)} />
      <div
        ref={chatContainerRef}
        className="fixed bottom-5 right-5 w-[90vw] max-w-[400px] h-[80vh] max-h-[550px] sm:w-[400px] sm:h-[580px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-700 to-amber-600 text-white px-4 py-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 bg-amber-800 rounded-full flex items-center justify-center text-xl">👞</div>
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
            </div>
            <div>
              <h2 className="font-semibold text-base">ShoeBot</h2>
              <p className="text-xs text-amber-100">online • usually replies instantly</p>
            </div>
          </div>
          <div className="flex gap-1">
            <button onClick={handleClearChat} className="p-2 hover:bg-amber-800 rounded-full transition" title="Clear conversation">
              <Trash2 size={16} />
            </button>
            <button onClick={() => setShowCart(!showCart)} className="relative p-2 hover:bg-amber-800 rounded-full transition">
              <ShoppingBag size={18} />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-yellow-400 text-amber-900 text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {cart.length}
                </span>
              )}
            </button>
            <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-amber-800 rounded-full transition">
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
                      <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center overflow-hidden">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-2xl">👞</span>
                        )}
                      </div>
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
                    setShowCart(false);
                    setShowCheckoutModal(true);
                  }}
                  className="w-full bg-amber-600 text-white py-2 rounded-lg font-semibold hover:bg-amber-700 transition"
                >
                  Proceed to Checkout
                </button>
              </div>
            )}
          </div>
        )}

        {/* Checkout Modal */}
        {showCheckoutModal && (
          <div className="absolute inset-0 bg-white z-20 flex flex-col">
            <div className="p-4 border-b flex justify-between items-center bg-amber-50">
              <h3 className="font-bold text-lg">Checkout</h3>
              <button onClick={() => setShowCheckoutModal(false)} className="text-gray-500 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {cart.map((item) => (
                <div key={item.id} className="flex justify-between items-center border-b pb-2">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-gray-500">Size {item.size} • {item.color} × {item.quantity}</p>
                  </div>
                  <p className="font-semibold">{item.subtotal.toLocaleString()} FCFA</p>
                </div>
              ))}

              <div className="flex justify-between font-bold text-lg pt-2 border-t">
                <span>Total</span>
                <span className="text-amber-600">{cartTotal.toLocaleString()} FCFA</span>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="mtn_momo">MTN Mobile Money</option>
                    <option value="orange_money">Orange Money</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="e.g., 6XXXXXXXX"
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Delivery Address</label>
                  <textarea
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="e.g., Molyko, Buea, near the roundabout"
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500"
                    rows={2}
                  />
                </div>
              </div>

              {paymentError && (
                <div className="bg-red-50 text-red-700 p-2 rounded text-sm">
                  {paymentError}
                </div>
              )}
            </div>

            <div className="p-4 border-t bg-gray-50">
              <button
                onClick={handleCheckoutPayment}
                disabled={isProcessingPayment}
                className="w-full bg-amber-600 text-white py-3 rounded-lg font-semibold hover:bg-amber-700 transition disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isProcessingPayment ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard size={18} />
                    Pay {cartTotal.toLocaleString()} FCFA
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Chat Messages */}
        <div
          className="flex-1 overflow-y-auto px-4 py-3 space-y-2"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cpath fill='%23f0e6d8' fill-opacity='0.3' d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-46 48c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4z'%3E%3C/path%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat',
          }}
        >
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[75%] px-3 py-2 rounded-lg text-sm shadow-sm ${
                  message.role === 'user'
                    ? 'bg-amber-600 text-white rounded-br-sm'
                    : 'bg-white text-gray-800 rounded-bl-sm border border-gray-100'
                }`}
              >
                <div className="whitespace-pre-wrap">{message.content}</div>

                {/* ─── PRODUCT CARDS ─── */}
                {message.products && message.products.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-gray-200">
                    <p className="font-semibold text-amber-700 text-xs mb-2">🛍️ Products found:</p>
                    <div className="space-y-3">
                      {message.products.map((product) => {
                        if (!selectedVariants[product.id] && product.variants && product.variants.length > 0) {
                          const first = product.variants[0];
                          setSelectedVariants(prev => ({
                            ...prev,
                            [product.id]: { size: first.size, color: first.color },
                          }));
                        }

                        const selected = selectedVariants[product.id] || { size: 0, color: '' };
                        const sizes = product.variants ? getUniqueOptions(product.variants, 'size') : [];
                        const colors = product.variants ? getUniqueOptions(product.variants, 'color') : [];

                        return (
                          <div key={product.id} className="bg-gray-50 p-2 rounded-lg border border-gray-100">
                            <div className="flex gap-3 items-start">
                              <div className="w-20 h-20 bg-gray-200 rounded flex-shrink-0 flex items-center justify-center overflow-hidden">
                                <img
                                  src={getImageUrl(product)}
                                  alt={product.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = PLACEHOLDER_SVG;
                                  }}
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-sm truncate">{product.name}</h4>
                                <p className="text-xs text-gray-500 truncate">
                                  {product.material} • {product.gender} • {product.category}
                                </p>
                                <p className="text-amber-600 font-bold text-sm">{product.price.toLocaleString()} FCFA</p>

                                {product.variants && product.variants.length > 0 ? (
                                  <div className="mt-2 flex flex-wrap gap-2 items-center">
                                    <select
                                      value={selected.size}
                                      onChange={(e) => handleVariantChange(product.id, 'size', Number(e.target.value))}
                                      className="text-xs border rounded px-2 py-1 bg-white"
                                    >
                                      {sizes.map((s) => (
                                        <option key={s} value={s}>{s}</option>
                                      ))}
                                    </select>
                                    <select
                                      value={selected.color}
                                      onChange={(e) => handleVariantChange(product.id, 'color', e.target.value)}
                                      className="text-xs border rounded px-2 py-1 bg-white"
                                    >
                                      {colors.map((c) => (
                                        <option key={c} value={c}>{c}</option>
                                      ))}
                                    </select>
                                    <button
                                      onClick={async () => {
                                        if (selected.size && selected.color) {
                                          setAddingProductId(product.id);
                                          await addToCart(product.id, selected.size, selected.color, 1);
                                          setAddingProductId(null);
                                        } else {
                                          toast.error('Please select size and colour');
                                        }
                                      }}
                                      disabled={!selected.size || !selected.color || addingProductId === product.id}
                                      className="bg-amber-600 text-white text-xs px-3 py-1 rounded-full hover:bg-amber-700 transition disabled:opacity-50"
                                    >
                                      {addingProductId === product.id ? 'Adding...' : 'Add to Cart'}
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-xs text-gray-400 italic block">No variants available</span>
                                )}

                                <div className="mt-1">
                                  <Link
                                    href={`/products/${product.id}`}
                                    className="inline-flex items-center gap-1 text-xs text-amber-600 hover:underline"
                                  >
                                    View Product <ExternalLink size={12} />
                                  </Link>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ─── CART SUMMARY ─── */}
                {message.cart && message.cart.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-gray-200">
                    <p className="font-semibold text-amber-700 text-xs mb-2">🛒 Your Cart Summary:</p>
                    <div className="space-y-1 text-xs">
                      {message.cart.map((item: any) => (
                        <div key={item.id} className="flex justify-between border-b border-gray-100 pb-1">
                          <span>{item.name} ({item.size}/{item.color}) × {item.quantity}</span>
                          <span className="font-medium">{item.subtotal.toLocaleString()} FCFA</span>
                        </div>
                      ))}
                      <div className="flex justify-between font-bold mt-1">
                        <span>Total</span>
                        <span>{message.cart.reduce((sum: number, i: any) => sum + i.subtotal, 0).toLocaleString()} FCFA</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* ─── RECOMMENDATIONS ─── */}
                {message.recommendations && message.recommendations.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-gray-200">
                    <p className="font-semibold text-amber-700 text-xs mb-2">✨ You might also like:</p>
                    <div className="space-y-2">
                      {message.recommendations.map((rec: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                          <div>
                            <span className="text-sm font-medium">{rec.name}</span>
                            <span className="text-xs text-gray-500 ml-2">{rec.price.toLocaleString()} FCFA</span>
                          </div>
                          <button
                            onClick={() => {
                              const size = rec.defaultSize ?? 42;
                              const color = rec.defaultColor || 'Brown';
                              addToCart(rec.id, size, color, 1);
                            }}
                            className="bg-amber-600 text-white px-2 py-1 rounded text-xs hover:bg-amber-700 transition"
                          >
                            Add
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div
                  className={`text-[10px] mt-1 flex items-center gap-1 ${
                    message.role === 'user' ? 'text-amber-100' : 'text-gray-400'
                  }`}
                >
                  {message.timestamp instanceof Date
                    ? message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : ''}
                  {message.role === 'user' && <span className="text-[10px]">✓✓</span>}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white rounded-lg rounded-bl-sm px-4 py-2 shadow-sm border border-gray-100">
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

        {/* Input Area */}
        <div className="bg-gray-50 p-3 border-t border-gray-200">
          <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex gap-2 items-center">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 p-2 text-sm bg-white border border-gray-300 rounded-full focus:outline-none focus:border-amber-500 px-4"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="bg-amber-600 text-white p-2 rounded-full hover:bg-amber-700 disabled:opacity-50 transition shadow-sm"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>
    </>
  );
}