'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '../components/ui/Navbar';     // relative path
import ChatBot from '../../components/Chatbot';       // relative path
import { simulatePayment } from '../utils/payment'; // relative path
import { Loader2, ShoppingBag, Trash2, Minus, Plus } from 'lucide-react';

export default function CheckoutPage() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [sessionId, setSessionId] = useState('');
  const [totalPrice, setTotalPrice] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'mtn_momo' | 'orange_money'>('mtn_momo');

  // Load cart from localStorage (same as your chat uses)
  useEffect(() => {
    let sid = localStorage.getItem('chat_session_id');
    if (!sid) {
      sid = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('chat_session_id', sid);
    }
    setSessionId(sid);

    const stored = localStorage.getItem('cart_items');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setItems(parsed);
        const total = parsed.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0);
        setTotalPrice(total);
      } catch (e) {
        console.error('Failed to parse cart', e);
      }
    }
  }, []);

  const updateQuantity = (id: string, newQty: number) => {
    if (newQty < 1) {
      removeItem(id);
      return;
    }
    const updated = items.map(item =>
      item.id === id ? { ...item, quantity: newQty } : item
    );
    setItems(updated);
    localStorage.setItem('cart_items', JSON.stringify(updated));
    const total = updated.reduce((sum, item) => sum + item.price * item.quantity, 0);
    setTotalPrice(total);
  };

  const removeItem = (id: string) => {
    const updated = items.filter(item => item.id !== id);
    setItems(updated);
    localStorage.setItem('cart_items', JSON.stringify(updated));
    const total = updated.reduce((sum, item) => sum + item.price * item.quantity, 0);
    setTotalPrice(total);
  };

  const handleCheckout = async () => {
    if (items.length === 0) {
      setError('Your cart is empty');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const paymentResult = await simulatePayment({
        amount: totalPrice,
        currency: 'XAF',
        method: paymentMethod,
      });

      if (!paymentResult.success) {
        throw new Error(paymentResult.message || 'Payment failed');
      }

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, paymentMethod }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create order');
      }

      localStorage.removeItem('cart_items');
      router.push(`/checkout/success?order=${data.orderId}`);
    } catch (err: any) {
      console.error('Checkout error:', err);
      setError(err.message || 'Something went wrong. Please try again.');
      setIsProcessing(false);
    }
  };

  if (items.length === 0) {
    return (
      <main>
        <Navbar />
        <div className="pt-32 pb-16 container-custom max-w-3xl mx-auto text-center">
          <ShoppingBag size={64} className="mx-auto text-gray-300 mb-4" />
          <h1 className="text-2xl font-bold mb-2">Your cart is empty</h1>
          <p className="text-gray-600 mb-6">Looks like you haven't added any items yet.</p>
          <Link href="/products" className="bg-amber-600 text-white px-6 py-3 rounded-lg inline-block">
            Browse Products
          </Link>
        </div>
        <ChatBot />
      </main>
    );
  }

  return (
    <main>
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container-custom max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Checkout</h1>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <div className="bg-white rounded-lg shadow p-4 space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-4 border-b pb-4">
                    <img
                      src={item.imageUrl || '/images/placeholder.jpg'}
                      alt={item.name}
                      className="w-20 h-20 object-cover rounded"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold">{item.name}</h3>
                      <p className="text-sm text-gray-600">
                        {item.size && `Size: ${item.size}`}
                        {item.color && `, Color: ${item.color}`}
                      </p>
                      <p className="font-bold text-amber-600">CFA {item.price.toLocaleString()}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-1 border rounded hover:bg-gray-100"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-1 border rounded hover:bg-gray-100"
                        >
                          <Plus size={14} />
                        </button>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="ml-4 text-red-500 hover:text-red-700"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="md:col-span-1">
              <div className="bg-white rounded-lg shadow p-6 sticky top-24">
                <h2 className="text-lg font-bold mb-4">Order Summary</h2>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal ({items.length} items)</span>
                    <span>CFA {totalPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery</span>
                    <span className="text-green-600">Free</span>
                  </div>
                  <hr className="my-2" />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>CFA {totalPrice.toLocaleString()}</span>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="mtn_momo">MTN Mobile Money</option>
                    <option value="orange_money">Orange Money</option>
                  </select>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={isProcessing}
                  className="w-full mt-4 bg-amber-600 text-white py-3 rounded-lg font-semibold hover:bg-amber-700 transition disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Proceed to Payment'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ChatBot />
    </main>
  );
}