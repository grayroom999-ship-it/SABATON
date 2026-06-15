// app/about/page.tsx
import { Metadata } from 'next'
import Link from 'next/link'
import {
  CheckCircle,
  Leaf,
  Shield,
  Truck,
  Watch,
  Hammer,
  MapPin,
  Sparkles,
  Award,
  Clock,
  Footprints,
} from 'lucide-react'
import Navbar from '../components/ui/Navbar'

export const metadata: Metadata = {
  title: 'About Us | SABATON Leather Shoes',
  description:
    'Handcrafted leather footwear for men in Buea, Cameroon. Traditional hand-lasting, premium calf leather, and honest pricing. Built to last.',
}

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main className="pt-24 pb-20 bg-white">
        <div className="container-custom max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero Section */}
          <div className="text-center mb-20">
            <span className="text-amber-600 text-sm tracking-widest font-serif uppercase">
              Built the Right Way
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-light tracking-tight text-gray-900 mt-2">
              About SABATON
            </h1>
            <div className="w-16 h-px bg-gradient-to-r from-transparent via-amber-500 to-transparent mx-auto my-5" />
            <p className="text-gray-500 text-lg max-w-3xl mx-auto">
              Made to Last. Handcrafted in Buea, Cameroon.
            </p>
          </div>

          {/* Our Story – with embedded Google Map */}
          <div className="grid md:grid-cols-2 gap-12 items-start mb-24">
            <div>
              <span className="text-amber-600 text-sm tracking-widest font-serif uppercase">
                Our Story
              </span>
              <h2 className="text-3xl md:text-4xl font-light tracking-tight text-gray-900 mt-2 mb-4">
                From the foot of Mount Cameroon
              </h2>
              <div className="space-y-4 text-gray-500 leading-relaxed">
                <p>
                  SABATON was born from a simple frustration: most leather shoes
                  today are designed to fail. Glued soles, corrected‑grain
                  leathers, and automated shortcuts produce shoes that look good
                  for a season and then fall apart.
                </p>
                <p>
                  We started our workshop in <strong className="text-gray-700">Buea</strong> to offer
                  something different — shoes that respect the wearer, the
                  material, and the craft. Every pair is{' '}
                  <strong className="text-gray-700">hand‑lasted, stitched, and finished</strong> by
                  artisans who take pride in their work.
                </p>
                <p>
                  <strong className="text-gray-700">SABATON</strong> means “flexible and strong” in middle english
                  — two qualities every great shoe must have.
                  Flexibility for all‑day comfort. Strength for years of wear.
                </p>
              </div>
            </div>

            {/* MAP CARD – Google Maps iframe centred on Molyko, Buea */}
            <div className="bg-amber-50/30 rounded-2xl p-2 shadow-sm border border-amber-100">
              <div className="aspect-[4/3] rounded-xl overflow-hidden">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15896.122767786663!2d9.296419!3d4.152089!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x10613a1b5b0b0b0b%3A0x123456789abcdef!2sMolyko%2C%20Buea%2C%20Cameroon!5e0!3m2!1sen!2s!4v1234567890123!5m2!1sen!2s"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="SABATON workshop location - Molyko, Buea"
                  className="w-full h-full"
                />
              </div>
              <p className="text-sm text-gray-400 text-center mt-3">
                📍 Workshop near Molyko market, Buea – exact location shared upon appointment
              </p>
            </div>
          </div>

          {/* Craftsmanship deep-dive */}
          <div className="mb-24">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="text-amber-600 text-sm tracking-widest font-serif uppercase">
                Process over shortcuts
              </span>
              <h2 className="text-3xl md:text-4xl font-light tracking-tight mt-2 mb-4">
                The Hand‑Lasting Difference
              </h2>
              <p className="text-gray-500">
                Most “handmade” shoes are assembled by machine. Ours are shaped
                around a last by human hands — a dying skill that delivers
                unmatched fit and durability.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm hover:shadow-md transition">
                <div className="bg-amber-50 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <Hammer className="text-amber-600" size={24} />
                </div>
                <h3 className="text-xl font-medium text-gray-800 mb-2">Hand‑Lasting</h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  Each upper is pulled, stretched, and nailed onto the last by
                  hand. This respects the leather’s natural grain and creates a
                  perfect 3D shape that machines cannot replicate.
                </p>
              </div>

              <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm hover:shadow-md transition">
                <div className="bg-amber-50 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <Watch className="text-amber-600" size={24} />
                </div>
                <h3 className="text-xl font-medium text-gray-800 mb-2">Time‑Intensive Build</h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  A single pair takes 8–12 hours of concentrated work. We use
                  traditional cement construction with reinforced stitching where
                  it matters — no hot melts or shortcuts.
                </p>
              </div>

              <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm hover:shadow-md transition">
                <div className="bg-amber-50 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <Footprints className="text-amber-600" size={24} />
                </div>
                <h3 className="text-xl font-medium text-gray-800 mb-2">Anatomical Fit</h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  Every last is designed from years of foot‑shape research. The
                  result: a shoe that supports the arch, leaves room for the
                  toes, and feels broken‑in from day one.
                </p>
              </div>
            </div>
          </div>

          {/* Leather & Materials */}
          <div className="bg-gray-50/50 rounded-2xl p-8 md:p-10 mb-24 border border-gray-100">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <span className="text-amber-600 text-sm tracking-widest font-serif uppercase">
                  Material Integrity
                </span>
                <h2 className="text-3xl md:text-4xl font-light tracking-tight mt-2 mb-4">
                  Premium Calf Leather
                </h2>
                <div className="space-y-4 text-gray-500">
                  <p>
                    We source full‑grain and top‑grain calf leather from
                    ethical, traceable tanneries. No split leather, no
                    “genuine”‑grade tricks. Our leather develops a rich patina
                    over time — it tells the story of your life.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="text-amber-500 shrink-0 mt-0.5" size={18} />
                      <span><strong className="text-gray-700">Full‑grain</strong> – strongest, most durable layer, natural surface</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="text-amber-500 shrink-0 mt-0.5" size={18} />
                      <span><strong className="text-gray-700">Vegetable‑retanned</strong> – firmer structure, better shape retention</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="text-amber-500 shrink-0 mt-0.5" size={18} />
                      <span><strong className="text-gray-700">Breathable lining</strong> – full‑leather interior, no synthetic substitutes</span>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center gap-3 mb-4">
                  <Shield className="text-amber-600" size={28} />
                  <h3 className="font-medium text-gray-800">What we don’t use</h3>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm text-gray-500">
                  {[
                    'Corrected grain',
                    'Bonded leather',
                    'PU / synthetic uppers',
                    'Cardboard stiffeners',
                    'Glued soles only',
                    'Plastic lining',
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Our Promise */}
          <div className="mb-24">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-light tracking-tight mb-3">
                Our Promise to You
              </h2>
              <p className="text-gray-500 max-w-2xl mx-auto">
                No marketing fluff. No hidden compromises. Just honest footwear.
              </p>
              <div className="w-12 h-px bg-amber-500 mx-auto my-4" />
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[
                {
                  icon: <Truck className="text-amber-600" size={20} />,
                  title: 'Free delivery in Buea',
                  desc: 'We hand‑deliver within the city. No shipping surprises.',
                },
                {
                  icon: <Award className="text-amber-600" size={20} />,
                  title: 'Made to order',
                  desc: 'Reduced waste, perfect quality. Each pair is built for you.',
                },
                {
                  icon: <Clock className="text-amber-600" size={20} />,
                  title: '2‑year construction warranty',
                  desc: 'If a seam fails or sole separates, we repair or replace.',
                },
                {
                  icon: <Sparkles className="text-amber-600" size={20} />,
                  title: 'Honest pricing',
                  desc: 'We sell directly – no retailer markups, no fake “sales”.',
                },
                {
                  icon: <Hammer className="text-amber-600" size={20} />,
                  title: 'Resoleable construction',
                  desc: 'When the sole wears out, we can replace it. The shoe lives on.',
                },
                {
                  icon: <Leaf className="text-amber-600" size={20} />,
                  title: 'Low‑impact packaging',
                  desc: 'Recycled cardboard, no plastic, minimal waste.',
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="flex items-start gap-3 p-4 bg-white border border-gray-100 rounded-xl shadow-sm"
                >
                  <div className="shrink-0 mt-0.5">{item.icon}</div>
                  <div>
                    <h4 className="font-medium text-gray-800">{item.title}</h4>
                    <p className="text-sm text-gray-500">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* The Workshop */}
          <div className="bg-amber-50/30 rounded-2xl p-8 md:p-10 mb-20 text-center md:text-left border border-amber-100">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-light tracking-tight mb-3">
                  The SABATON Workshop
                </h2>
                <p className="text-gray-500 mb-4 leading-relaxed">
                  Located near the Molyko market in Buea, our small workshop
                  houses four master shoemakers and two apprentices. We are not a
                  factory — we are a collective of craftspeople who believe in
                  patience, precision, and pride in every stitch.
                </p>
                <p className="text-gray-500">
                  You are welcome to visit by appointment. See the lasts, smell
                  the leather, and watch a shoe being born.
                </p>
                <div className="mt-6 flex flex-wrap gap-4 justify-center md:justify-start">
                  <Link
                    href="/contact"
                    className="inline-flex items-center gap-2 bg-amber-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-amber-700 transition shadow-sm"
                  >
                    Visit the workshop
                  </Link>
                  <Link
                    href="/products"
                    className="inline-flex items-center gap-2 border border-amber-600 text-amber-700 px-5 py-2 rounded-lg text-sm font-medium hover:bg-amber-50 transition"
                  >
                    See our shoes
                  </Link>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white h-28 rounded-xl flex flex-col items-center justify-center border border-gray-100">
                  <span className="text-2xl font-light text-amber-700">4</span>
                  <span className="text-xs text-gray-500">Master shoemakers</span>
                </div>
                <div className="bg-white h-28 rounded-xl flex flex-col items-center justify-center border border-gray-100">
                  <span className="text-2xl font-light text-amber-700">10+</span>
                  <span className="text-xs text-gray-500">Years combined experience</span>
                </div>
                <div className="bg-white h-28 rounded-xl flex flex-col items-center justify-center border border-gray-100">
                  <span className="text-2xl font-light text-amber-700">8–12</span>
                  <span className="text-xs text-gray-500">Hours per pair</span>
                </div>
                <div className="bg-white h-28 rounded-xl flex flex-col items-center justify-center border border-gray-100">
                  <span className="text-2xl font-light text-amber-700">100%</span>
                  <span className="text-xs text-gray-500">Hand‑finished</span>
                </div>
              </div>
            </div>
          </div>

          {/* Final CTA */}
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-light tracking-tight mb-4">
              Walk With Vision
            </h2>
            <p className="text-gray-500 mb-6">
              SABATON shoes are for men who refuse to replace their footwear every
              year. Who value restraint, durability, and quiet confidence. Shoes
              that grow better with age — just like their wearer.
            </p>
            <Link
              href="/products"
              className="inline-block bg-amber-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-amber-700 transition shadow-md"
            >
              Explore the collection
            </Link>
            <div className="mt-8 text-xs text-gray-400 border-t border-gray-100 pt-6">
              📍 Handcrafted in Buea, Cameroon – at the foot of Mount Cameroon
            </div>
          </div>
        </div>
      </main>
    </>
  )
}