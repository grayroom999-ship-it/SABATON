'use client'

import { MapPin, Phone, Mail, Clock, MessageCircle } from 'lucide-react'
import { SiFacebook, SiInstagram } from '@icons-pack/react-simple-icons';
import Navbar from '../components/ui/Navbar'
import ChatBot from '../../components/Chatbot'

export default function ContactPage() {
  return (
    <main>
      <Navbar />
      
      <div className="pt-24 pb-16">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Contact Us</h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Have questions? We're here to help. Reach out to us through any of these channels.
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Info */}
            <div>
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4">Get in Touch</h2>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="text-amber-600 mt-1" size={20} />
                    <div>
                      <p className="font-semibold">Location</p>
                      <p className="text-gray-600">Buea Town, near Commercial Avenue<br />Opposite Total Filling Station</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="text-amber-600 mt-1" size={20} />
                    <div>
                      <p className="font-semibold">Phone</p>
                      <p className="text-gray-600">+237 6XX XXX XXX</p>
                      <p className="text-sm text-gray-500">Mon-Sat, 8AM - 6PM</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Mail className="text-amber-600 mt-1" size={20} />
                    <div>
                      <p className="font-semibold">Email</p>
                      <p className="text-gray-600">info@buealeathershoes.com</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="text-amber-600 mt-1" size={20} />
                    <div>
                      <p className="font-semibold">Business Hours</p>
                      <p className="text-gray-600">Monday - Saturday: 8:00 AM - 6:00 PM</p>
                      <p className="text-gray-600">Sunday: Closed</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Social Media */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Follow Us</h2>
                <div className="flex gap-4">
                  <a
                    href="https://facebook.com"
                    target="_blank"
                    className="bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 transition"
                  >
                    <SiFacebook size={20} color="#1877f2" />
                  </a>
                  <a
                    href="https://instagram.com"
                    target="_blank"
                    className="bg-pink-600 text-white p-3 rounded-full hover:bg-pink-700 transition"
                  >
                    <SiInstagram size={20} color="#E4405F" />
                  </a>
                  <a
                    href="https://wa.me/2376XXXXXXX"
                    target="_blank"
                    className="bg-green-500 text-white p-3 rounded-full hover:bg-green-600 transition"
                  >
                    <MessageCircle size={24} />
                  </a>
                </div>
              </div>
            </div>
            
            {/* Contact Form */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Send us a Message</h2>
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <input
                    type="text"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-amber-500"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input
                    type="email"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-amber-500"
                    placeholder="your@email.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Phone</label>
                  <input
                    type="tel"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-amber-500"
                    placeholder="6XXXXXXXX"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Message</label>
                  <textarea
                    rows={4}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-amber-500"
                    placeholder="How can we help you?"
                  ></textarea>
                </div>
                <button
                  type="submit"
                  className="w-full bg-amber-600 text-white py-2 rounded-lg font-semibold hover:bg-amber-700 transition"
                >
                  Send Message
                </button>
              </form>
              <p className="text-xs text-gray-500 text-center mt-4">
                Or chat with our AI assistant for immediate help!
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <ChatBot />
    </main>
  )
}