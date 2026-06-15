// app/page.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import Head from 'next/head'
import { ChevronRight, Truck, Shield, Clock, HeartHandshake, Send, MapPin, Phone, Mail } from 'lucide-react'
import Navbar from './components/ui/Navbar'
import ChatBot from '../components/Chatbot'

interface Product {
  id: number
  name: string
  price: number
  category: string
  description: string
  imageUrl: string
}

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [newsletterStatus, setNewsletterStatus] = useState('')

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const res = await fetch('/api/products?page=1&limit=8')
        const data = await res.json()
        let products: Product[] = []
        if (data.products && Array.isArray(data.products)) products = data.products
        else if (Array.isArray(data)) products = data
        setFeaturedProducts(products.slice(0, 6))
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchFeatured()
  }, [])

  const handleNewsletter = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setNewsletterStatus('Thanks for subscribing!')
    setEmail('')
    setTimeout(() => setNewsletterStatus(''), 3000)
  }

  const craftsmanshipSteps = [
    {
      step: "01",
      title: "Leather Selection",
      description: "Finest calf, cordovan & exotic skins from renowned tanneries.",
      imagePath: "/images/Vass-Shoes-About-Us-2025.08.05.-1.jpg",
    },
    {
      step: "02",
      title: "Pattern Making & Cutting",
      description: "Hand‑drawn patterns and precise cutting by master artisans.",
      imagePath: "/images/Vass-Shoes-About-Us-2025.08.05.-2.jpg",
    },
    {
      step: "03",
      title: "Assembly & Lasting",
      description: "Traditional hand‑lasting and stitching for perfect fit.",
      imagePath: "/images/Vass-Shoes-About-Us-2025.08.05.-3.jpg",
    },
    {
      step: "04",
      title: "Finishing & Polishing",
      description: "Meticulous hand‑finishing and wax polish for lasting shine.",
      imagePath: "/images/Vass-Shoes-About-Us-2025.08.05.-4.jpg",
    },
  ]

  return (
    <>
      <Head>
        <title>Sabaton – Handcrafted Leather Shoes & Boots | Buea, Cameroon</title>
        <meta name="description" content="Sabaton: Premium handmade leather shoes and boots in Buea. Free delivery, genuine leather, and timeless craftsmanship. Shop the collection." />
        <meta name="keywords" content="leather shoes Buea, handmade boots Cameroon, Sabaton, artisan footwear" />
        <meta property="og:title" content="Sabaton – Artisan Leather Footwear" />
        <meta property="og:description" content="Discover handcrafted leather shoes made with passion in Buea." />
        <meta property="og:type" content="website" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main>
        <Navbar />

        {/* HERO SECTION */}
        <section className="relative h-screen min-h-[600px] flex items-center justify-center text-white">
          <div className="absolute inset-0 z-0">
            <Image
              src="/images/hero-bg.jpg"
              alt="Sabaton artisan leather shoes"
              fill
              className="object-cover"
              priority
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-black/40"></div>
          </div>
          <div className="relative z-10 container-custom text-center px-4 max-w-4xl">
            <div className="inline-block mb-4 px-3 py-1 border border-white/40 rounded-full text-xs font-medium tracking-wider backdrop-blur-sm">
              EST. 2018
            </div>
            <h1 className="text-5xl md:text-7xl font-light mb-4 tracking-tight">
              <span className="font-serif italic">Sabaton</span>
            </h1>
            <p className="text-xl md:text-2xl font-light mb-6 max-w-2xl mx-auto">
              Handcrafted leather footwear from Buea – where tradition meets modern elegance.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/products"
                className="bg-white text-gray-900 hover:bg-gray-100 px-8 py-3 rounded-none font-medium transition inline-flex items-center gap-2"
              >
                Shop Collection <ChevronRight size={18} />
              </Link>
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('chatbot:open'))}
                className="border border-white hover:bg-white/10 px-8 py-3 rounded-none font-medium transition backdrop-blur-sm inline-flex items-center gap-2"
              >
                💬 Chat to Order
              </button>
            </div>
          </div>
        </section>

        {/* FEATURED PRODUCTS - Updated grid: 2 columns on mobile, 3 on desktop */}
        <section className="py-20 bg-white">
          <div className="container-custom">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-light tracking-tight">Featured Collection</h2>
              <div className="w-16 h-px bg-gray-300 mx-auto my-4"></div>
              <p className="text-gray-500 max-w-xl mx-auto">Our most sought‑after designs, each pair made with meticulous care.</p>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-8">
                {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="bg-gray-100 animate-pulse aspect-square"></div>)}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-8">
                {featuredProducts.map(product => (
                  <div key={product.id} className="group bg-white border border-gray-100 hover:shadow-md transition-all duration-300">
                    <Link href={`/products/${product.id}`} className="block">
                      <div className="relative aspect-square bg-gray-100 overflow-hidden">
                        {product.imageUrl ? (
                          <Image
                            src={product.imageUrl}
                            alt={product.name}
                            fill
                            className="object-cover group-hover:scale-105 transition duration-500"
                            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full text-4xl">👞</div>
                        )}
                      </div>
                    </Link>
                    <div className="p-3 md:p-5 text-center">
                      <h3 className="font-medium text-gray-800 group-hover:text-amber-600 transition text-sm md:text-base">
                        {product.name}
                      </h3>
                      <p className="text-amber-600 font-semibold mt-1 text-sm md:text-base">
                        {product.price.toLocaleString()} FCFA
                      </p>
                      <button
                        onClick={() => window.dispatchEvent(new CustomEvent('chatbot:addProduct', { detail: { productName: product.name } }))}
                        className="mt-2 md:mt-3 text-xs md:text-sm text-gray-500 hover:text-amber-600 underline-offset-2 underline"
                      >
                        Chat to buy
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="text-center mt-12">
              <Link href="/products" className="inline-block border-b border-gray-400 pb-1 text-gray-700 hover:border-amber-600 hover:text-amber-600 transition">
                View all products →
              </Link>
            </div>
          </div>
        </section>

        {/* ORIGINAL "ABOUT US" SECTION (workshop image) */}
        <section className="py-20 bg-gray-50">
          <div className="container-custom">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="relative h-96 bg-gray-200 overflow-hidden order-2 md:order-1">
                <Image
                  src="/images/workshop2.jpg"
                  alt="Artisan at work"
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const parent = e.currentTarget.parentElement;
                    if (parent) parent.innerHTML = '<div class="flex items-center justify-center h-full bg-amber-100 text-amber-800"><span class="text-6xl">👞</span><span class="ml-2">Craftsmanship in progress</span></div>';
                  }}
                />
              </div>
              <div className="order-1 md:order-2">
                <div className="text-sm text-amber-600 tracking-wider mb-2">HANDCRAFTED IN BUEA</div>
                <h2 className="text-3xl md:text-4xl font-light mb-4">Where leather tells a story</h2>
                <p className="text-gray-600 mb-4 leading-relaxed">
                  At Sabaton, we don’t just make shoes – we shape heirlooms. Each pair is cut, stitched, and finished by skilled artisans using full‑grain leather. The result is footwear that ages beautifully and supports your every step.
                </p>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  From our workshop in Molyko to your doorstep, we combine traditional techniques with modern comfort. No mass production – just passion and precision.
                </p>
                <Link href="/about" className="inline-flex items-center gap-2 text-gray-800 border-b border-gray-400 pb-1 hover:border-amber-600 hover:text-amber-600 transition">
                  Discover our story <ChevronRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* CRAFTSMANSHIP SECTION – 2 paragraphs + 4 images */}
        <section className="py-24 bg-white">
          <div className="container-custom">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-light tracking-tight">The Art of Shoemaking</h2>
              <div className="w-16 h-px bg-amber-500 mx-auto my-4"></div>
            </div>

            <div className="max-w-3xl mx-auto text-center space-y-4 text-gray-700 leading-relaxed mb-16">
              <p>
                From the selection of <span className="font-semibold">calf, cordovan or exotic skins</span> sourced from the best tanneries 
                to the final polishing, every step is performed by meticulous craftsmen. A period of about <span className="font-semibold text-amber-700">6–7 weeks</span> 
                is needed for custom‑made shoes – we build each pair to last for many years.
              </p>
              <p>
                Our ready‑to‑wear collection undergoes the same careful processes. Manual shoemaking has changed little over centuries: 
                our artisans shape shoes by hand, using tools they’ve adapted to their own touch.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {craftsmanshipSteps.map((step) => (
                <div key={step.step} className="group bg-gray-50 rounded-sm overflow-hidden shadow-sm hover:shadow-md transition">
                  <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
                    <Image
                      src={step.imagePath}
                      alt={step.title}
                      fill
                      className="object-cover group-hover:scale-105 transition duration-500"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                      onError={(e) => {
                        const target = e.currentTarget;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          const fallback = document.createElement('div');
                          fallback.className = 'absolute inset-0 flex flex-col items-center justify-center bg-amber-50 text-amber-700';
                          fallback.innerHTML = `<span class="text-5xl mb-2">👞</span><span class="text-sm">${step.title}</span>`;
                          parent.appendChild(fallback);
                        }
                      }}
                    />
                    <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded">
                      {step.step}
                    </div>
                  </div>
                  <div className="p-4 text-center">
                    <h3 className="font-medium text-gray-800 mb-1">{step.title}</h3>
                    <p className="text-sm text-gray-500">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center mt-10">
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('chatbot:open'))}
                className="inline-flex items-center gap-2 text-gray-700 border-b border-gray-400 pb-1 hover:border-amber-600 hover:text-amber-600 transition"
              >
                Inquire about custom‑made shoes <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </section>

        {/* TRUST BADGES */}
        <section className="py-16 border-b border-gray-100">
          <div className="container-custom">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div><Truck className="w-8 h-8 mx-auto text-amber-600 mb-2" /><h3 className="font-medium">Free Delivery</h3><p className="text-sm text-gray-500">Buea town only</p></div>
              <div><Shield className="w-8 h-8 mx-auto text-amber-600 mb-2" /><h3 className="font-medium">Genuine Leather</h3><p className="text-sm text-gray-500">100% authentic</p></div>
              <div><Clock className="w-8 h-8 mx-auto text-amber-600 mb-2" /><h3 className="font-medium">24h Dispatch</h3><p className="text-sm text-gray-500">Same‑day handling</p></div>
              <div><HeartHandshake className="w-8 h-8 mx-auto text-amber-600 mb-2" /><h3 className="font-medium">Satisfaction</h3><p className="text-sm text-gray-500">Guaranteed quality</p></div>
            </div>
          </div>
        </section>

        {/* NEWSLETTER */}
        <section className="py-20 bg-amber-50">
          <div className="container-custom">
            <div className="flex flex-col items-center justify-center text-center max-w-2xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-light mb-2">Join the Sabaton family</h2>
              <p className="text-gray-600 mb-6">
                Be the first to know about new collections and artisan offers.
              </p>
              <form onSubmit={handleNewsletter} className="w-full flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email address"
                  className="flex-1 px-4 py-3 border border-gray-300 focus:outline-none focus:border-amber-500 rounded-md"
                  required
                />
                <button
                  type="submit"
                  className="bg-gray-900 text-white px-6 py-3 rounded-md hover:bg-gray-800 transition flex items-center justify-center gap-2"
                >
                  Subscribe <Send size={18} />
                </button>
              </form>
              {newsletterStatus && (
                <p className="mt-4 text-amber-700 text-sm">{newsletterStatus}</p>
              )}
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="bg-gray-900 text-gray-400 pt-16 pb-8">
          <div className="container-custom">
            <div className="grid md:grid-cols-4 gap-8 mb-12">
              <div><h3 className="text-white text-xl font-light mb-3">Sabaton</h3><p className="text-sm">Handcrafted leather shoes from Buea, Cameroon. Quality that walks with you.</p></div>
              <div><h4 className="text-white font-medium mb-3">Shop</h4><ul className="space-y-2 text-sm"><li><Link href="/products" className="hover:text-white">All Products</Link></li><li><Link href="/products?category=mens" className="hover:text-white">Men's Shoes</Link></li><li><Link href="/products?category=womens" className="hover:text-white">Women's Boots</Link></li></ul></div>
              <div><h4 className="text-white font-medium mb-3">Support</h4><ul className="space-y-2 text-sm"><li><Link href="/contact" className="hover:text-white">Contact</Link></li><li><a href="#" className="hover:text-white">Size Guide</a></li><li><a href="#" className="hover:text-white">Returns</a></li></ul></div>
              <div><h4 className="text-white font-medium mb-3">Contact</h4><ul className="space-y-2 text-sm"><li className="flex items-center gap-2"><MapPin size={14} /> Molyko, Buea</li><li className="flex items-center gap-2"><Phone size={14} /> +237 6XX XXX XXX</li><li className="flex items-center gap-2"><Mail size={14} /> hello@sabaton.cm</li></ul></div>
            </div>
            <div className="border-t border-gray-800 pt-6 text-center text-sm text-gray-500">&copy; {new Date().getFullYear()} Sabaton. All rights reserved.</div>
          </div>
        </footer>

        <ChatBot />
      </main>
    </>
  )
}