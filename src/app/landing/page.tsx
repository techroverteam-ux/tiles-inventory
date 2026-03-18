'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Package, Star, Menu, X, MapPin, Phone, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const tileCategories = [
    {
      image: '/api/placeholder/400/300',
      title: 'Marble Finish Tiles',
      description: 'Elegant stone-inspired flooring',
    },
    {
      image: '/api/placeholder/400/300',
      title: 'Bathroom Tiles',
      description: 'Moisture resistant luxury surfaces',
    },
    {
      image: '/api/placeholder/400/300',
      title: 'Kitchen Backsplash',
      description: 'Stylish modern kitchen finishes',
    },
    {
      image: '/api/placeholder/400/300',
      title: 'Outdoor Tiles',
      description: 'Durable exterior surfaces',
    },
  ]

  const premiumCollections = [
    { name: 'Royal Statuario', size: '600x1200', finish: 'Glossy' },
    { name: 'Desert Sand', size: '800x1600', finish: 'Matte' },
    { name: 'Nero Marble', size: '600x600', finish: 'High Polish' },
  ]

  return (
    <div className="min-h-screen bg-[hsl(var(--marketing-bg))] text-[hsl(var(--marketing-foreground))]">
      <nav className="fixed top-0 w-full bg-[hsl(var(--marketing-surface)/0.92)] backdrop-blur-md z-50 border-b border-[hsl(var(--marketing-border))]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-serif font-bold text-[hsl(var(--marketing-foreground))]">TilesPro</h1>

            <div className="hidden md:flex items-center space-x-8">
              <a href="#collections" className="text-[hsl(var(--marketing-foreground))] hover:text-[hsl(var(--marketing-accent))] font-medium">
                Collections
              </a>
              <a href="#showroom" className="text-[hsl(var(--marketing-foreground))] hover:text-[hsl(var(--marketing-accent))] font-medium">
                Showroom
              </a>
              <Link href="/login">
                <Button className="bg-[hsl(var(--marketing-accent))] text-[hsl(var(--marketing-accent-foreground))] hover:bg-[hsl(var(--marketing-accent)/0.9)] px-6">
                  Manage Inventory
                </Button>
              </Link>
            </div>

            <Button
              variant="ghost"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              title={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </nav>

      <section className="pt-24 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div>
                <h1 className="text-5xl md:text-7xl font-serif font-light text-[hsl(var(--marketing-foreground))] leading-tight mb-6">
                  Unveiling
                  <span className="block font-normal">Luxury Surfaces</span>
                </h1>
                <p className="text-xl text-[hsl(var(--marketing-foreground))] font-light mb-2">Premium Tiles Collection 2025</p>
                <p className="text-lg text-[hsl(var(--marketing-muted))] mb-8">Discover designer wall and floor tiles crafted for modern homes.</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="bg-[hsl(var(--marketing-strong))] hover:bg-[hsl(var(--marketing-strong)/0.9)] text-white px-8 py-4 text-lg">
                  Explore Collection
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-[hsl(var(--marketing-strong))] text-[hsl(var(--marketing-strong))] hover:bg-[hsl(var(--marketing-strong))] hover:text-white px-8 py-4 text-lg"
                >
                  Visit Showroom
                </Button>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-[hsl(var(--marketing-border))] rounded-full transform scale-110 -z-10" />
              <div className="bg-[hsl(var(--marketing-surface))] rounded-2xl p-8 shadow-2xl border border-[hsl(var(--marketing-border))]">
                <img src="/api/placeholder/500/400" alt="Premium Tiles" className="w-full h-80 object-cover rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="collections" className="py-20 px-4 sm:px-6 lg:px-8 bg-[hsl(var(--marketing-surface))] border-y border-[hsl(var(--marketing-border))]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-serif font-light text-[hsl(var(--marketing-foreground))] mb-4">Featured Collections</h2>
            <p className="text-xl text-[hsl(var(--marketing-muted))] max-w-2xl mx-auto">Explore our curated selection of premium tiles for every space</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {tileCategories.map((category) => (
              <Card key={category.title} className="group cursor-pointer border border-[hsl(var(--marketing-border))] bg-[hsl(var(--marketing-surface))] shadow-lg hover:shadow-2xl transition-all duration-300">
                <CardContent className="p-0">
                  <div className="overflow-hidden rounded-t-lg">
                    <img src={category.image} alt={category.title} className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-serif font-medium text-[hsl(var(--marketing-foreground))] mb-2">{category.title}</h3>
                    <p className="text-[hsl(var(--marketing-muted))] mb-4">{category.description}</p>
                    <Button variant="ghost" className="text-[hsl(var(--marketing-accent))] hover:text-[hsl(var(--marketing-accent))] hover:bg-[hsl(var(--marketing-accent)/0.12)] p-0">
                      View Collection →
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-serif font-light text-[hsl(var(--marketing-foreground))] mb-4">Premium Collections</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {premiumCollections.map((tile) => (
              <Card key={tile.name} className="bg-[hsl(var(--marketing-surface))] border border-[hsl(var(--marketing-border))] shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-6">
                  <img src="/api/placeholder/300/200" alt={tile.name} className="w-full h-48 object-cover rounded-lg mb-4" />
                  <h3 className="text-xl font-serif font-medium text-[hsl(var(--marketing-foreground))] mb-2">{tile.name}</h3>
                  <div className="flex justify-between text-sm text-[hsl(var(--marketing-muted))] mb-4">
                    <span>Size: {tile.size}</span>
                    <span>Finish: {tile.finish}</span>
                  </div>
                  <Button className="w-full bg-[hsl(var(--marketing-accent))] text-[hsl(var(--marketing-accent-foreground))] hover:bg-[hsl(var(--marketing-accent)/0.9)]">
                    Quick View
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[hsl(var(--marketing-surface))] border-y border-[hsl(var(--marketing-border))]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-serif font-light text-[hsl(var(--marketing-foreground))] mb-12">Why Choose Our Showroom</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-4">
              <div className="w-16 h-16 bg-[hsl(var(--marketing-accent))] text-[hsl(var(--marketing-accent-foreground))] rounded-full flex items-center justify-center mx-auto">
                <Package className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-medium text-[hsl(var(--marketing-foreground))]">1000+ Tile Designs</h3>
              <p className="text-[hsl(var(--marketing-muted))]">Extensive collection of premium tiles</p>
            </div>

            <div className="space-y-4">
              <div className="w-16 h-16 bg-[hsl(var(--marketing-accent))] text-[hsl(var(--marketing-accent-foreground))] rounded-full flex items-center justify-center mx-auto">
                <Star className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-medium text-[hsl(var(--marketing-foreground))]">Imported Collections</h3>
              <p className="text-[hsl(var(--marketing-muted))]">Premium international brands</p>
            </div>

            <div className="space-y-4">
              <div className="w-16 h-16 bg-[hsl(var(--marketing-accent))] text-[hsl(var(--marketing-accent-foreground))] rounded-full flex items-center justify-center mx-auto">
                <MapPin className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-medium text-[hsl(var(--marketing-foreground))]">Ready Stock</h3>
              <p className="text-[hsl(var(--marketing-muted))]">Immediate availability</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[hsl(var(--marketing-strong))] text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-serif font-light mb-6">Transform Your Space</h2>
          <p className="text-xl text-white/75 mb-8">With Designer Tiles</p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login">
              <Button size="lg" className="bg-[hsl(var(--marketing-accent))] text-[hsl(var(--marketing-accent-foreground))] hover:bg-[hsl(var(--marketing-accent)/0.9)] px-8 py-4 text-lg">
                Browse Inventory
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-[hsl(var(--marketing-strong))] px-8 py-4 text-lg">
              Get Quote
            </Button>
          </div>
        </div>
      </section>

      <footer className="bg-[hsl(var(--marketing-strong)/0.96)] text-white py-12 px-4 sm:px-6 lg:px-8 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-2xl font-serif font-bold text-[hsl(var(--marketing-accent))] mb-4">TilesPro</h3>
              <p className="text-white/75 mb-4">Premium tiles showroom with luxury collections for modern homes.</p>
              <div className="flex space-x-4">
                <Button size="sm" className="bg-[hsl(var(--marketing-accent))] text-[hsl(var(--marketing-accent-foreground))] hover:bg-[hsl(var(--marketing-accent)/0.9)]">
                  <Phone className="h-4 w-4" />
                </Button>
                <Button size="sm" className="bg-[hsl(var(--success))] text-[hsl(var(--success-foreground))] hover:bg-[hsl(var(--success)/0.9)]">
                  <MessageCircle className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-[hsl(var(--marketing-accent))]">Collections</h4>
              <ul className="space-y-2 text-white/75">
                <li><a href="#" className="hover:text-white">Marble Tiles</a></li>
                <li><a href="#" className="hover:text-white">Bathroom Tiles</a></li>
                <li><a href="#" className="hover:text-white">Kitchen Tiles</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-[hsl(var(--marketing-accent))]">Services</h4>
              <ul className="space-y-2 text-white/75">
                <li><a href="#" className="hover:text-white">Design Consultation</a></li>
                <li><a href="#" className="hover:text-white">Installation</a></li>
                <li><a href="#" className="hover:text-white">Showroom Visit</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-[hsl(var(--marketing-accent))]">Contact</h4>
              <ul className="space-y-2 text-white/75">
                <li>123 Tile Street</li>
                <li>+91 98765 43210</li>
                <li>info@tilespro.com</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/15 mt-8 pt-8 text-center text-white/70">
            <p>&copy; 2026 TilesPro. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
