// app/how-it-works/page.tsx
'use client'

import Head from 'next/head'
import Image from 'next/image'
import { MessageCircle, ShoppingBag, Smartphone, Truck, ChevronRight, Star } from 'lucide-react'
import { SiFacebook, SiInstagram } from '@icons-pack/react-simple-icons'
import Navbar from '../components/ui/Navbar'
import ChatBot from '../../components/Chatbot'

export default function HowItWorksPage() {
  const steps = [
    {
      icon: MessageCircle,
      title: 'Chat with AI',
      description: 'Tell our shoe expert what you’re looking for. The AI instantly finds the perfect pair.',
      details: ['"Show me casual shoes"', '"I need formal shoes for work"', '"Add black loafer size 41"'],
      color: 'amber'
    },
    {
      icon: ShoppingBag,
      title: 'Review Cart',
      description: 'Items are added to your cart. You can modify quantities or remove items anytime.',
      details: ['Ask "my cart" to review', 'Remove or adjust easily', 'See total price instantly'],
      color: 'stone'
    },
    {
      icon: Smartphone,
      title: 'Pay via Mobile Money',
      description: 'Complete checkout with MTN or Orange Money. A secure payment request is sent to your phone.',
      details: ['MTN Mobile Money', 'Orange Money', 'End‑to‑end encryption'],
      color: 'amber'
    },
    {
      icon: Truck,
      title: 'Free Delivery',
      description: 'We deliver free within Buea town. Your handcrafted shoes arrive within 24 hours.',
      details: ['Free delivery in Buea', '24‑hour dispatch', 'Order tracking available'],
      color: 'stone'
    }
  ]

  const faqs = [
    {
      question: "How do I know my size?",
      answer: "Chat with our AI assistant for personalised size guidance. Provide your usual shoe size (EU/UK/US) and we'll recommend the best fit. All our shoes are true to size, but we also offer free size exchange within 7 days."
    },
    {
      question: "What if the shoes don't fit?",
      answer: "We offer a free size exchange within 7 days of delivery. Simply contact us via the chat or WhatsApp, and we'll arrange a swap at no extra cost. The shoes must be unworn and in original condition."
    },
    {
      question: "How long does delivery take?",
      answer: "For addresses within Buea town (Molyko, Mile 17, Great Soppo, Clerk's Quarter, etc.), delivery is completed within 24 hours after payment confirmation. We use dedicated bike delivery for speed and safety."
    },
    {
      question: "Is the leather genuine?",
      answer: "Absolutely. Sabaton uses 100% genuine full‑grain leather sourced from reputable tanneries. Each shoe is handcrafted in our Buea workshop – no synthetic substitutes, ever."
    },
    {
      question: "Can I customise my shoes?",
      answer: "Yes. We offer custom‑made shoes with your choice of leather (calf, cordovan, exotic), colour, sole type, and even monogramming. Lead time is 6‑7 weeks. Click 'Chat to Order' to start a custom project."
    },
    {
      question: "What payment methods are accepted?",
      answer: "We accept MTN Mobile Money and Orange Money. After checkout, you'll receive a payment request on your phone. Cash on delivery is also available for customers in Buea."
    }
  ]

  const handleOpenChatbot = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('chatbot:open'))
    }
  }

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  }

  return (
    <>
      <Head>
        <title>How It Works – Sabaton | Order Handcrafted Shoes in Buea</title>
        <meta name="description" content="Order custom & ready‑to‑wear leather shoes in 4 easy steps: chat with AI, review cart, pay via MTN/Orange Money, and enjoy free delivery in Buea. Start now." />
        <meta name="keywords" content="how to order leather shoes Buea, Sabaton ordering process, mobile money payment Cameroon, free delivery Buea" />
        <meta property="og:title" content="How It Works – Sabaton" />
        <meta property="og:description" content="Simple, transparent process: chat, review, pay with mobile money, get free delivery in Buea." />
        <meta property="og:type" content="website" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      </Head>

      <main>
        <Navbar />

        {/* Hero with subtle pattern */}
        <div className="relative pt-24 pb-12 bg-white overflow-hidden">
          {/* Decorative background pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-0 left-0 w-72 h-72 bg-amber-500 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-amber-500 rounded-full blur-3xl translate-x-1/3 translate-y-1/3"></div>
          </div>
          
          <div className="container-custom relative z-10">
            <div className="text-center max-w-3xl mx-auto">
              <span className="text-amber-600 text-sm tracking-widest font-serif uppercase">Simple & transparent</span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-light tracking-tight mt-2">How It Works</h1>
              <div className="w-16 h-px bg-gradient-to-r from-transparent via-amber-500 to-transparent mx-auto my-5"></div>
              <p className="text-gray-500 text-lg">
                From chat to doorstep – getting your perfect pair of handcrafted leather shoes takes just four simple steps.
              </p>
            </div>
          </div>
        </div>

        {/* Steps section – visually rich */}
        <div className="py-16 bg-white">
          <div className="container-custom">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
              {steps.map((step, idx) => (
                <div key={idx} className="group relative bg-white rounded-sm border border-gray-100 hover:border-amber-200 hover:shadow-lg transition-all duration-300 p-6 text-center">
                  {/* Connector line (hidden on mobile) */}
                  {idx < steps.length - 1 && (
                    <div className="hidden lg:block absolute top-1/3 left-full w-8 h-px bg-amber-200 -translate-y-1/2 z-0">
                      <div className="absolute right-0 top-1/2 w-2 h-2 border-t border-r border-amber-300 rotate-45 -translate-y-1/2"></div>
                    </div>
                  )}
                  
                  <div className="relative mb-5 inline-block">
                    <div className="absolute inset-0 bg-amber-100 rounded-full blur-md opacity-60 group-hover:opacity-100 transition"></div>
                    <div className="relative w-20 h-20 mx-auto flex items-center justify-center rounded-full bg-amber-50 border border-amber-100 group-hover:border-amber-300 transition">
                      <step.icon className="w-8 h-8 text-amber-600 group-hover:scale-110 transition" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-7 h-7 bg-amber-600 text-white text-xs font-bold flex items-center justify-center rounded-full shadow-md">
                      {idx + 1}
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-medium text-gray-800 mb-2">{step.title}</h3>
                  <p className="text-gray-500 text-sm mb-4 leading-relaxed">{step.description}</p>
                  <ul className="text-xs text-gray-400 space-y-1.5">
                    {step.details.map((detail, i) => (
                      <li key={i} className="flex items-center justify-center gap-1">
                        <span className="w-1 h-1 bg-amber-400 rounded-full"></span>
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Trust badge / mini testimonial */}
        <div className="py-10 bg-amber-50/30 border-y border-amber-100">
          <div className="container-custom">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
              <div className="flex items-center gap-3">
                <div className="flex text-amber-500">
                  {[...Array(5)].map((_, i) => <Star key={i} size={18} fill="currentColor" className="mr-0.5" />)}
                </div>
                <p className="text-gray-600 italic">"Best quality leather shoes in Buea – and the AI chat made ordering effortless."</p>
              </div>
              <div className="text-sm text-gray-500">
                ⚡ <span className="font-medium">100+ satisfied customers</span> this month
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section – two columns for better readability */}
        <div className="py-20 bg-white">
          <div className="container-custom max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-light tracking-tight">Frequently Asked Questions</h2>
              <div className="w-12 h-px bg-amber-500 mx-auto my-4"></div>
              <p className="text-gray-500">Everything you need to know about ordering, delivery, and returns</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-x-12 gap-y-8">
              {faqs.map((faq, idx) => (
                <div key={idx} className="border-b border-gray-100 pb-4">
                  <h3 className="text-md font-medium text-gray-800 mb-2 flex items-start gap-2">
                    <span className="text-amber-500 text-sm">⟶</span>
                    {faq.question}
                  </h3>
                  <p className="text-gray-500 text-sm leading-relaxed pl-5">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA with background accent */}
        <div className="py-16 bg-gradient-to-r from-amber-50 to-white border-y border-amber-100">
          <div className="container-custom text-center">
            <h2 className="text-2xl md:text-3xl font-light tracking-tight mb-3">Ready to find your perfect shoes?</h2>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">Start a conversation – our AI shoe expert is online now.</p>
            <button
              onClick={handleOpenChatbot}
              className="inline-flex items-center gap-2 bg-amber-600 text-white px-8 py-3 text-base hover:bg-amber-700 transition shadow-md hover:shadow-lg"
            >
              <MessageCircle size={18} />
              Chat with Sabaton AI
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Social footer */}
        <div className="py-10 border-t border-gray-100 text-center">
          <div className="container-custom">
            <p className="text-gray-400 text-sm mb-4">Follow the craftsmanship</p>
            <div className="flex justify-center gap-5">
              <a
                href="https://facebook.com/sabaton.cm"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 rounded-full text-gray-600 hover:border-[#1877F2] hover:text-[#1877F2] hover:bg-[#1877F2]/5 transition"
              >
                <SiFacebook size={16} />
                Facebook
              </a>
              <a
                href="https://instagram.com/sabaton.cm"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 rounded-full text-gray-600 hover:border-[#bc1888] hover:text-[#bc1888] hover:bg-[#bc1888]/5 transition"
              >
                <SiInstagram size={16} />
                Instagram
              </a>
            </div>
          </div>
        </div>

        <ChatBot />
      </main>
    </>
  )
}