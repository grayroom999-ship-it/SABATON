// app/how-it-works/page.tsx
'use client'

import { MessageCircle, ShoppingBag, Smartphone, Truck } from 'lucide-react'
import { SiFacebook, SiInstagram } from '@icons-pack/react-simple-icons'
import Navbar from '../components/ui/Navbar'
import ChatBot from '../../components/Chatbot'

export default function HowItWorksPage() {
  const steps = [
    {
      icon: MessageCircle,
      title: 'Chat with AI',
      description: 'Open the chatbot and tell us what you\'re looking for. Our AI will help you find the perfect shoes.',
      details: [
        '"Show me casual shoes"',
        '"I need formal shoes for work"',
        '"Add black loafer size 41"'
      ]
    },
    {
      icon: ShoppingBag,
      title: 'Review Cart',
      description: 'The AI will add items to your cart. You can review, modify quantities, or remove items anytime.',
      details: [
        'Check your cart with "my cart"',
        'Remove items you don\'t want',
        'Adjust quantities easily'
      ]
    },
    {
      icon: Smartphone,
      title: 'Pay via Mobile Money',
      description: 'Complete checkout with MTN or Orange Money. You\'ll receive a payment request on your phone.',
      details: [
        'MTN Mobile Money',
        'Orange Money',
        'Secure payment'
      ]
    },
    {
      icon: Truck,
      title: 'Free Delivery',
      description: 'We deliver free within Buea town. Your shoes will arrive within 24 hours.',
      details: [
        'Free delivery in Buea',
        '24-hour delivery',
        'Track your order'
      ]
    }
  ]

  const handleOpenChatbot = () => {
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('chatbot:open')
      window.dispatchEvent(event)
    }
  }

  return (
    <main>
      <Navbar />
      
      <div className="pt-24 pb-16">
        <div className="container-custom">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Getting your perfect leather shoes is simple. Follow these four steps and you'll be walking in style in no time.
            </p>
          </div>
          
          {/* Steps */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            {steps.map((step, index) => (
              <div key={index} className="text-center">
                <div className="relative">
                  <div className="bg-amber-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                    <step.icon className="text-amber-600" size={32} />
                  </div>
                  {index < steps.length - 1 && (
                    <div className="hidden lg:block absolute top-10 left-full w-full h-0.5 bg-amber-200 -translate-y-1/2"></div>
                  )}
                  <div className="absolute -top-2 -right-2 bg-amber-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
                    {index + 1}
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-gray-600 mb-3">{step.description}</p>
                <ul className="text-sm text-gray-500 space-y-1">
                  {step.details.map((detail, i) => (
                    <li key={i}>• {detail}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          
          {/* FAQ Section */}
          <div className="bg-gray-50 rounded-2xl p-8 mb-12">
            <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2">How do I know my size?</h3>
                <p className="text-gray-600 text-sm">
                  Chat with our AI for size guidance. We can help you find the perfect fit based on your regular shoe size.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">What if the shoes don't fit?</h3>
                <p className="text-gray-600 text-sm">
                  We offer free size exchange within 7 days. Just contact us and we'll arrange the swap.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">How long does delivery take?</h3>
                <p className="text-gray-600 text-sm">
                  Delivery within Buea takes 24 hours. We deliver to Molyko, Mile 17, Great Soppo, and surrounding areas.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Is the leather genuine?</h3>
                <p className="text-gray-600 text-sm">
                  Yes! We use 100% genuine leather sourced from quality suppliers. Each shoe is handcrafted with care.
                </p>
              </div>
            </div>
          </div>
          
          {/* CTA */}
          <div className="text-center mb-16">
            <h2 className="text-2xl font-bold mb-4">Ready to find your perfect shoes?</h2>
            <button
              onClick={handleOpenChatbot}
              className="bg-amber-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-amber-700 transition inline-flex items-center gap-2"
            >
              <MessageCircle size={20} />
              Chat with ShoeBot Now
            </button>
          </div>

{/* Social Media Section */}
<div className="border-t border-gray-200 pt-12 text-center">
    <h2 className="text-2xl font-bold mb-6">Follow Us</h2>
    <p className="text-gray-600 mb-6">Stay updated with our latest styles and offers</p>
    <div className="flex justify-center gap-6">
        <a
            href="https://facebook.com/yourpage"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#1877F2] text-white p-3 rounded-full hover:opacity-90 transition inline-flex items-center gap-2 px-6"
        >
            <SiFacebook size={20} />
            Facebook
        </a>
        <a
            href="https://instagram.com/yourpage"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-gradient-to-r from-[#f09433] to-[#bc1888] text-white p-3 rounded-full hover:opacity-90 transition inline-flex items-center gap-2 px-6"
        >
            <SiInstagram size={20} />
            Instagram
        </a>
    </div>
</div>
        </div>
      </div>
      
      <ChatBot />
    </main>
  )
}