'use client'

import ShoemakingIcon from './ShoemakingIcon';
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ShoppingBag, Menu, X, Phone } from 'lucide-react'

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [cartItemCount, setCartItemCount] = useState(0)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  // Listen for scroll events
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Check admin authentication status
  const checkAdminStatus = () => {
    const adminAuth = sessionStorage.getItem('admin_auth')
    const isAuth = adminAuth === 'true'
    console.log('🔍 Navbar checkAdminStatus:', { adminAuth, isAuth })
    setIsAdmin(isAuth)
  }

  // Run on mount and when custom event fires
  useEffect(() => {
    checkAdminStatus()
    window.addEventListener('adminAuthChanged', checkAdminStatus)
    // Optional: also re-check when tab becomes visible (in case user logged in from another tab)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') checkAdminStatus()
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      window.removeEventListener('adminAuthChanged', checkAdminStatus)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
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
      isScrolled 
        ? 'bg-white shadow-md py-2' 
        : 'bg-white/80 backdrop-blur-sm md:bg-transparent md:backdrop-blur-none py-4'
    }`}>
      <div className="container-custom px-4 md:px-6">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <ShoemakingIcon size={28} color="#6B3E1F" />
            <span className="font-semibold text-gray-800">SABATON</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className="hover:text-amber-600 transition">Home</Link>
            <Link href="/products" className="hover:text-amber-600 transition">Shop</Link>
            <Link href="/how-it-works" className="hover:text-amber-600 transition">How It Works</Link>
            <Link href="/about" className="hover:text-amber-600 transition">Our Story</Link>
            <Link href="/contact" className="hover:text-amber-600 transition">Contact</Link>
            
            {/* Admin Link - only shown when logged in */}
            {isAdmin && (
              <Link href="/admin" className="hover:text-amber-600 transition">
                Admin
              </Link>
            )}
            
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

          {/* Mobile right side: Cart + Menu button */}
          <div className="flex items-center gap-4 md:hidden">
            <Link href="/cart" className="relative">
              <ShoppingBag className="text-gray-700" />
              {cartItemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-amber-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </Link>

            <button onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X className="text-gray-800" /> : <Menu className="text-gray-800" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-5 pt-2 space-y-3 bg-white rounded-lg shadow-lg border-t border-gray-100">
            <Link href="/" className="block px-2 py-1 hover:text-amber-600" onClick={() => setIsMenuOpen(false)}>Home</Link>
            <Link href="/products" className="block px-2 py-1 hover:text-amber-600" onClick={() => setIsMenuOpen(false)}>Shop</Link>
            <Link href="/how-it-works" className="block px-2 py-1 hover:text-amber-600" onClick={() => setIsMenuOpen(false)}>How It Works</Link>
            <Link href="/about" className="block px-2 py-1 hover:text-amber-600" onClick={() => setIsMenuOpen(false)}>Our Story</Link>
            <Link href="/contact" className="block px-2 py-1 hover:text-amber-600" onClick={() => setIsMenuOpen(false)}>Contact</Link>
            
            {/* Admin Link in mobile menu */}
            {isAdmin && (
              <Link href="/admin" className="block px-2 py-1 hover:text-amber-600" onClick={() => setIsMenuOpen(false)}>
                Admin
              </Link>
            )}
            
            <a 
              href="https://wa.me/2376XXXXXXX" 
              target="_blank"
              className="flex items-center justify-center space-x-2 bg-green-500 text-white px-4 py-2 rounded-lg mt-2"
              onClick={() => setIsMenuOpen(false)}
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