// app/contact/page.tsx
'use client'

import { MapPin, Phone, Mail, Clock, MessageCircle, Send } from 'lucide-react'
import { SiFacebook, SiInstagram } from '@icons-pack/react-simple-icons'
import Navbar from '../components/ui/Navbar'
import ChatBot from '../../components/Chatbot'

export default function ContactPage() {
  const handleOpenChatbot = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('chatbot:open'))
    }
  }

  return (
    <main>
      <Navbar />

      {/* Hero with subtle gradient */}
      <div className="relative pt-24 pb-10 bg-white overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2"></div>
        </div>
        <div className="container-custom relative z-10 text-center">
          <span className="text-amber-600 text-sm tracking-widest font-serif uppercase">Visit us</span>
          <h1 className="text-4xl md:text-5xl font-light tracking-tight mt-2">Contact</h1>
          <div className="w-12 h-px bg-amber-500 mx-auto my-4"></div>
          <p className="text-gray-500 max-w-xl mx-auto">
            Visit our workshop in Buea, or reach out – we're here to help with sizing, orders, and custom requests.
          </p>
        </div>
      </div>

      <div className="py-12 bg-white">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Left Column – Contact Info + Social (map excluded) */}
            <div className="space-y-8">
              {/* Contact details card – clean border style */}
              <div className="border border-gray-100 bg-white p-6 hover:border-amber-200 transition">
                <h2 className="text-xl font-light tracking-tight mb-6">Get in Touch</h2>
                <div className="space-y-5">
                  <div className="flex items-start gap-4">
                    <div className="w-9 h-9 flex items-center justify-center border border-gray-200 rounded-full shrink-0">
                      <MapPin className="text-amber-600" size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">Location</p>
                      <p className="text-gray-500 text-sm">Buea Town, near Commercial Avenue,<br />Opposite Total Filling Station</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-9 h-9 flex items-center justify-center border border-gray-200 rounded-full shrink-0">
                      <Phone className="text-amber-600" size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">Phone</p>
                      <p className="text-gray-500 text-sm">+237 6XX XXX XXX</p>
                      <p className="text-xs text-gray-400">Mon-Sat, 8AM – 6PM</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-9 h-9 flex items-center justify-center border border-gray-200 rounded-full shrink-0">
                      <Mail className="text-amber-600" size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">Email</p>
                      <p className="text-gray-500 text-sm">hello@sabaton.cm</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-9 h-9 flex items-center justify-center border border-gray-200 rounded-full shrink-0">
                      <Clock className="text-amber-600" size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">Workshop Hours</p>
                      <p className="text-gray-500 text-sm">Monday – Saturday: 8:00 – 18:00</p>
                      <p className="text-gray-500 text-sm">Sunday: Closed</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Social – subtle outline style */}
              <div className="border border-gray-100 p-6">
                <h2 className="text-xl font-light tracking-tight mb-4">Follow the Craftsmanship</h2>
                <div className="flex gap-4">
                  <a
                    href="https://facebook.com/sabaton.cm"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-full text-gray-600 hover:border-[#1877F2] hover:text-[#1877F2] hover:bg-[#1877F2]/5 transition text-sm"
                  >
                    <SiFacebook size={16} />
                    Facebook
                  </a>
                  <a
                    href="https://instagram.com/sabaton.cm"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-full text-gray-600 hover:border-[#bc1888] hover:text-[#bc1888] hover:bg-[#bc1888]/5 transition text-sm"
                  >
                    <SiInstagram size={16} />
                    Instagram
                  </a>
                  <a
                    href="https://wa.me/2376XXXXXXX"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-full text-gray-600 hover:border-green-500 hover:text-green-600 hover:bg-green-50 transition text-sm"
                  >
                    <MessageCircle size={16} />
                    WhatsApp
                  </a>
                </div>
              </div>
            </div>

            {/* Right Column – Contact Form (elegant) */}
            <div className="border border-gray-100 bg-white p-6 md:p-8">
              <h2 className="text-xl font-light tracking-tight mb-6">Send us a Message</h2>
              <form className="space-y-5">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Full name</label>
                  <input
                    type="text"
                    className="w-full p-2.5 border border-gray-200 focus:border-amber-400 outline-none transition bg-gray-50/30"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Email address</label>
                  <input
                    type="email"
                    className="w-full p-2.5 border border-gray-200 focus:border-amber-400 outline-none transition bg-gray-50/30"
                    placeholder="you@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Phone (optional)</label>
                  <input
                    type="tel"
                    className="w-full p-2.5 border border-gray-200 focus:border-amber-400 outline-none transition bg-gray-50/30"
                    placeholder="6XXXXXXXX"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Message</label>
                  <textarea
                    rows={5}
                    className="w-full p-2.5 border border-gray-200 focus:border-amber-400 outline-none transition bg-gray-50/30"
                    placeholder="Tell us about your enquiry – size, shoe style, custom order, etc."
                  ></textarea>
                </div>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 bg-amber-600 text-white px-6 py-2.5 text-sm hover:bg-amber-700 transition"
                >
                  Send Message <Send size={14} />
                </button>
              </form>
              <div className="mt-6 pt-4 border-t border-gray-100 text-center">
                <p className="text-xs text-gray-400">
                  Prefer instant help? <button onClick={handleOpenChatbot} className="text-amber-600 hover:underline">Chat with our AI assistant →</button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ✨ NEW: Size Guide Section – placeholder for a size chart image */}
      <div className="py-10 bg-white border-t border-gray-100">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-light tracking-tight text-gray-800 mb-2">
              Find Your Perfect Fit
            </h2>
            <p className="text-gray-500 text-sm mb-6">
              Use our size guide to measure your feet correctly – if you're unsure, just ask us!
            </p>
            {/* Placeholder for the size chart image */}
            <div className="w-full bg-gray-50 border border-gray-200 rounded-sm p-4 flex items-center justify-center aspect-[4/3] md:aspect-[16/9]">
              <div className="text-center">
                <span className="text-gray-400 text-sm block">📏 Size Chart Image</span>
                <span className="text-gray-300 text-xs">(replace with your own chart image)</span>
                {/* Uncomment and replace src when you have the actual image */}
                {/* <img src="/images/size-chart.jpg" alt="Shoe size guide" className="w-full h-auto max-h-80 object-contain" /> */}
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-3">
              Need help? <a href="#" className="text-amber-600 hover:underline">Contact us</a> for personalised sizing advice.
            </p>
          </div>
        </div>
      </div>

      {/* Small CTA band */}
      <div className="py-10 bg-amber-50/40 border-y border-amber-100">
        <div className="container-custom text-center">
          <p className="text-gray-600 text-sm">
            📍 Visit our workshop – see the shoemaking process in person. Call ahead to book a tour.
          </p>
        </div>
      </div>

      <ChatBot />
    </main>
  )
}