'use client'

import ShoemakingIcon from './ShoemakingIcon';
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ShoppingBag, Menu, X, Phone } from 'lucide-react'

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [cartItemCount, setCartItemCount] = useState(0)
  const [isScrolled, setIsScrolled] = useState(false)

  // Listen for scroll events
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Listen for cart updates
  useEffect(() => {
    const updateCartCount = () => {
      const cart = localStorage.getItem('cart')
      if (cart) {
        const items = JSON.parse(cart)
        setCartItemCount(items.reduce((sum: number, item: any) => sum + item.quantity, 0))
      }
    }
    
    updateCartCount()
    window.addEventListener('cartUpdated', updateCartCount)
    return () => window.removeEventListener('cartUpdated', updateCartCount)
  }, [])

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${
      isScrolled ? 'bg-white shadow-md py-2' : 'bg-transparent py-4'
    }`}>
      <div className="container-custom">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center gap-2">
  <ShoemakingIcon size={28} color="#6B3E1F" />
  <span className="font-semibold">SABATON</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className="hover:text-amber-600 transition">Home</Link>
            <Link href="/products" className="hover:text-amber-600 transition">Shop</Link>
            <Link href="/how-it-works" className="hover:text-amber-600 transition">How It Works</Link>
            <Link href="/contact" className="hover:text-amber-600 transition">Contact</Link>
            
            {/* WhatsApp Button */}
            <a 
              href="https://wa.me/2376XXXXXXX" 
              target="_blank"
              className="flex items-center space-x-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition"
            >
              <Phone size={18} />
              <span>WhatsApp</span>
            </a>
            
            {/* Cart Button */}
            <Link href="/cart" className="relative">
              <ShoppingBag className="text-gray-700 hover:text-amber-600 transition" />
              {cartItemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-amber-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-4 space-y-3">
            <Link href="/" className="block hover:text-amber-600">Home</Link>
            <Link href="/products" className="block hover:text-amber-600">Shop</Link>
            <Link href="/how-it-works" className="block hover:text-amber-600">How It Works</Link>
            <Link href="/contact" className="block hover:text-amber-600">Contact</Link>
            <a 
              href="https://wa.me/2376XXXXXXX" 
              target="_blank"
              className="flex items-center space-x-2 bg-green-500 text-white px-4 py-2 rounded-lg justify-center"
            >
              <Phone size={18} />
              <span>WhatsApp</span>
            </a>
          </div>
        )}
      </div>
    </nav>
  )
}