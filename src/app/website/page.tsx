'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Search, Filter, Grid, List, ShoppingCart, Heart, Eye, Star, ArrowRight, Phone, Mail, MapPin, Award, Truck, Shield, Users, ChevronRight, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { toast } from 'react-hot-toast'
import Image from 'next/image'
import Link from 'next/link'
import { CartSidebar } from '@/components/CartSidebar'

interface Product {
  id: string
  name: string
  code: string
  imageUrl: string
  brand: { id: string; name: string }
  category: { id: string; name: string }
  size: { id: string; name: string } | null
  sqftPerBox: number
  pcsPerBox: number
  totalStock: number
  isActive: boolean
}

interface Brand {
  id: string
  name: string
}

interface Category {
  id: string
  name: string
}

interface Size {
  id: string
  name: string
}

export default function WebsitePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [sizes, setSizes] = useState<Size[]>([])  
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([])
  const [popularCategories, setPopularCategories] = useState<Category[]>([])
  const [stats, setStats] = useState({ totalProducts: 0, totalBrands: 0, totalCategories: 0 })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedBrand, setSelectedBrand] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedSize, setSelectedSize] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [cart, setCart] = useState<Product[]>([])
  const [wishlist, setWishlist] = useState<Product[]>([])
  const [showEnquiryForm, setShowEnquiryForm] = useState(false)
  const [enquiryProduct, setEnquiryProduct] = useState<Product | null>(null)
  const [showCart, setShowCart] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [productsRes, brandsRes, categoriesRes, sizesRes, statsRes] = await Promise.all([
        fetch('/api/products?isActive=true&limit=100'),
        fetch('/api/brands?isActive=true'),
        fetch('/api/categories?isActive=true'),
        fetch('/api/sizes?isActive=true'),
        fetch('/api/dashboard/stats')
      ])

      if (productsRes.ok) {
        const productsData = await productsRes.json()
        const allProducts = productsData.products || []
        setProducts(allProducts)
        // Set featured products (first 8 products with images)
        setFeaturedProducts(allProducts.filter(p => p.imageUrl).slice(0, 8))
      }

      if (brandsRes.ok) {
        const brandsData = await brandsRes.json()
        setBrands(brandsData.brands || [])
      }

      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json()
        const allCategories = categoriesData.categories || []
        setCategories(allCategories)
        // Set popular categories (first 6)
        setPopularCategories(allCategories.slice(0, 6))
      }

      if (sizesRes.ok) {
        const sizesData = await sizesRes.json()
        setSizes(sizesData.sizes || [])
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats({
          totalProducts: statsData.totalProducts || 0,
          totalBrands: statsData.totalBrands || 0,
          totalCategories: statsData.totalCategories || 0
        })
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.brand.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.category.name.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesBrand = !selectedBrand || product.brand.id === selectedBrand
    const matchesCategory = !selectedCategory || product.category.id === selectedCategory
    const matchesSize = !selectedSize || product.size?.id === selectedSize

    return matchesSearch && matchesBrand && matchesCategory && matchesSize
  })

  const addToCart = (product: Product) => {
    setCart(prev => [...prev, product])
    toast.success(`${product.name} added to cart`)
  }

  const addToWishlist = (product: Product) => {
    if (!wishlist.find(item => item.id === product.id)) {
      setWishlist(prev => [...prev, product])
      toast.success(`${product.name} added to wishlist`)
    }
  }

  const removeFromWishlist = (productId: string) => {
    setWishlist(prev => prev.filter(item => item.id !== productId))
    toast.success('Removed from wishlist')
  }

  const handleEnquiry = (product: Product) => {
    setEnquiryProduct(product)
    setShowEnquiryForm(true)
  }

  const submitEnquiry = async (formData: FormData) => {
    try {
      const enquiryData = {
        productId: enquiryProduct?.id,
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        quantity: formData.get('quantity'),
        message: formData.get('message')
      }

      const response = await fetch('/api/enquiries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(enquiryData)
      })

      if (response.ok) {
        toast.success('Enquiry submitted successfully! We will contact you soon.')
        setShowEnquiryForm(false)
        setEnquiryProduct(null)
      } else {
        throw new Error('Failed to submit enquiry')
      }
    } catch (error) {
      toast.error('Failed to submit enquiry')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="h-80 rounded-2xl animate-pulse bg-muted/30" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-primary">House of Tiles</h1>
              <Badge variant="secondary" className="hidden md:flex">
                Premium Tiles Collection
              </Badge>
            </div>
            
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" className="relative">
                <Heart className="h-4 w-4" />
                {wishlist.length > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs">
                    {wishlist.length}
                  </Badge>
                )}
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="relative"
                onClick={() => setShowCart(true)}
              >
                <ShoppingCart className="h-4 w-4" />
                {cart.length > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs">
                    {cart.length}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/10 via-background to-primary/5 py-20 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/hero-pattern.svg')] opacity-5" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-tight">
                Transform Your
                <span className="text-primary block">Living Space</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8 max-w-lg">
                Discover our premium collection of {stats.totalProducts}+ tiles from {stats.totalBrands}+ trusted brands. 
                Quality craftsmanship meets modern design.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="rounded-full px-8 text-lg">
                  Explore Collection <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button size="lg" variant="outline" className="rounded-full px-8 text-lg">
                  <Play className="mr-2 h-5 w-5" />
                  Watch Showcase
                </Button>
              </div>
              
              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 mt-12">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">{stats.totalProducts}+</div>
                  <div className="text-sm text-muted-foreground">Products</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">{stats.totalBrands}+</div>
                  <div className="text-sm text-muted-foreground">Brands</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">{stats.totalCategories}+</div>
                  <div className="text-sm text-muted-foreground">Categories</div>
                </div>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="grid grid-cols-2 gap-4">
                {featuredProducts.slice(0, 4).map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                    className={`relative rounded-2xl overflow-hidden ${
                      index === 0 ? 'col-span-2 h-64' : 'h-32'
                    }`}
                  >
                    <Image
                      src={product.imageUrl || '/placeholder-tile.svg'}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <div className="absolute bottom-4 left-4 text-white">
                      <h3 className="font-semibold text-sm">{product.name}</h3>
                      <p className="text-xs opacity-90">{product.brand.name}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Popular Categories */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Shop by Category
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Explore our diverse range of tiles designed for every space and style
            </p>
          </motion.div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {popularCategories.map((category, index) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group cursor-pointer"
                onClick={() => {
                  setSelectedCategory(category.id)
                  document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' })
                }}
              >
                <Card className="text-center hover:shadow-lg transition-all duration-300 group-hover:scale-105">
                  <CardContent className="p-6">
                    <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                      <div className="text-2xl font-bold">{category.name.charAt(0)}</div>
                    </div>
                    <h3 className="font-semibold text-sm">{category.name}</h3>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Featured Products
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Handpicked tiles that showcase the perfect blend of quality and design
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="group hover:shadow-xl transition-all duration-300 overflow-hidden">
                  <div className="relative aspect-square overflow-hidden">
                    <Image
                      src={product.imageUrl || '/placeholder-tile.svg'}
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                    <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-8 w-8 p-0 rounded-full"
                        onClick={() => addToWishlist(product)}
                      >
                        <Heart className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-8 w-8 p-0 rounded-full"
                        onClick={() => setSelectedProduct(product)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                    {product.totalStock < 10 && (
                      <Badge className="absolute top-3 left-3 bg-destructive">
                        Low Stock
                      </Badge>
                    )}
                  </div>
                  
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <h3 className="font-semibold text-sm line-clamp-2">{product.name}</h3>
                      <p className="text-xs text-muted-foreground">{product.brand.name}</p>
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs">
                          {product.category.name}
                        </Badge>
                        {product.size && (
                          <span className="text-xs text-muted-foreground">
                            {product.size.name}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {product.sqftPerBox} sq ft/box • {product.pcsPerBox} pcs/box
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={() => handleEnquiry(product)}
                        >
                          Enquire Now
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => addToCart(product)}
                        >
                          <ShoppingCart className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Button 
              size="lg" 
              variant="outline" 
              className="rounded-full px-8"
              onClick={() => document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' })}
            >
              View All Products <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Why Choose House of Tiles?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              We're committed to providing the highest quality tiles and exceptional service
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <Award className="h-8 w-8" />,
                title: "Premium Quality",
                description: "Handpicked tiles from trusted manufacturers worldwide"
              },
              {
                icon: <Truck className="h-8 w-8" />,
                title: "Fast Delivery",
                description: "Quick and secure delivery to your doorstep"
              },
              {
                icon: <Shield className="h-8 w-8" />,
                title: "Quality Guarantee",
                description: "100% satisfaction guarantee on all our products"
              },
              {
                icon: <Users className="h-8 w-8" />,
                title: "Expert Support",
                description: "Professional guidance from our tile experts"
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="text-center h-full hover:shadow-lg transition-shadow duration-300">
                  <CardContent className="p-6">
                    <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                      {feature.icon}
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground text-sm">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section id="products-section" className="py-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Complete Tile Collection
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Browse through our extensive catalog of premium tiles
            </p>
          </motion.div>

          {/* Filters */}
          <div className="py-8 border-b border-border">
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tiles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="All Brands" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Brands</SelectItem>
                  {brands.map(brand => (
                    <SelectItem key={brand.id} value={brand.id}>
                      {brand.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedSize} onValueChange={setSelectedSize}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="All Sizes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Sizes</SelectItem>
                  {sizes.map(size => (
                    <SelectItem key={size.id} value={size.id}>
                      {size.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Products Grid */}
          <div className="py-8">
            <div className="mb-6">
              <p className="text-muted-foreground">
                Showing {filteredProducts.length} products
              </p>
            </div>

          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="group hover:shadow-lg transition-all duration-300 overflow-hidden">
                    <div className="relative aspect-square overflow-hidden">
                      <Image
                        src={product.imageUrl || '/placeholder-tile.svg'}
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                      <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-8 w-8 p-0"
                          onClick={() => addToWishlist(product)}
                        >
                          <Heart className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-8 w-8 p-0"
                          onClick={() => setSelectedProduct(product)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                      {product.totalStock < 10 && (
                        <Badge className="absolute top-2 left-2 bg-destructive">
                          Low Stock
                        </Badge>
                      )}
                    </div>
                    
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <h3 className="font-semibold text-sm line-clamp-2">{product.name}</h3>
                        <p className="text-xs text-muted-foreground">{product.brand.name}</p>
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-xs">
                            {product.category.name}
                          </Badge>
                          {product.size && (
                            <span className="text-xs text-muted-foreground">
                              {product.size.name}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {product.sqftPerBox} sq ft/box • {product.pcsPerBox} pcs/box
                        </div>
                        <div className="flex gap-2 pt-2">
                          <Button
                            size="sm"
                            className="flex-1"
                            onClick={() => handleEnquiry(product)}
                          >
                            Enquire Now
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => addToCart(product)}
                          >
                            <ShoppingCart className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredProducts.map((product) => (
                <Card key={product.id} className="overflow-hidden">
                  <div className="flex">
                    <div className="relative w-48 h-32">
                      <Image
                        src={product.imageUrl || '/placeholder-tile.svg'}
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <CardContent className="flex-1 p-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <h3 className="font-semibold">{product.name}</h3>
                          <p className="text-sm text-muted-foreground">{product.brand.name}</p>
                          <div className="flex items-center gap-4">
                            <Badge variant="outline">{product.category.name}</Badge>
                            {product.size && (
                              <span className="text-sm text-muted-foreground">
                                {product.size.name}
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {product.sqftPerBox} sq ft/box • {product.pcsPerBox} pcs/box
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleEnquiry(product)}>
                            Enquire Now
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => addToCart(product)}>
                            <ShoppingCart className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
        </div>
      </section>

      {/* Product Detail Modal */}
      <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
        <DialogContent className="max-w-4xl">
          {selectedProduct && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="relative aspect-square">
                <Image
                  src={selectedProduct.imageUrl || '/placeholder-tile.svg'}
                  alt={selectedProduct.name}
                  fill
                  className="object-cover rounded-lg"
                />
              </div>
              <div className="space-y-4">
                <div>
                  <h2 className="text-2xl font-bold">{selectedProduct.name}</h2>
                  <p className="text-muted-foreground">{selectedProduct.brand.name}</p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{selectedProduct.category.name}</Badge>
                    {selectedProduct.size && (
                      <Badge variant="secondary">{selectedProduct.size.name}</Badge>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Coverage:</span>
                      <p className="text-muted-foreground">{selectedProduct.sqftPerBox} sq ft per box</p>
                    </div>
                    <div>
                      <span className="font-medium">Pieces:</span>
                      <p className="text-muted-foreground">{selectedProduct.pcsPerBox} pieces per box</p>
                    </div>
                    <div>
                      <span className="font-medium">Product Code:</span>
                      <p className="text-muted-foreground">{selectedProduct.code}</p>
                    </div>
                    <div>
                      <span className="font-medium">Stock:</span>
                      <p className={selectedProduct.totalStock < 10 ? 'text-destructive' : 'text-success'}>
                        {selectedProduct.totalStock} units available
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button className="flex-1" onClick={() => handleEnquiry(selectedProduct)}>
                    Get Quote
                  </Button>
                  <Button variant="outline" onClick={() => addToCart(selectedProduct)}>
                    Add to Cart
                  </Button>
                  <Button variant="outline" onClick={() => addToWishlist(selectedProduct)}>
                    <Heart className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Enquiry Form Modal */}
      <Dialog open={showEnquiryForm} onOpenChange={setShowEnquiryForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Product Enquiry</DialogTitle>
          </DialogHeader>
          {enquiryProduct && (
            <form onSubmit={(e) => {
              e.preventDefault()
              const formData = new FormData(e.currentTarget)
              submitEnquiry(formData)
            }} className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium">{enquiryProduct.name}</h4>
                <p className="text-sm text-muted-foreground">{enquiryProduct.brand.name}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Name *</Label>
                  <Input id="name" name="name" required />
                </div>
                <div>
                  <Label htmlFor="phone">Phone *</Label>
                  <Input id="phone" name="phone" type="tel" required />
                </div>
              </div>
              
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input id="email" name="email" type="email" required />
              </div>
              
              <div>
                <Label htmlFor="quantity">Quantity (sq ft)</Label>
                <Input id="quantity" name="quantity" type="number" placeholder="Enter area in sq ft" />
              </div>
              
              <div>
                <Label htmlFor="message">Message</Label>
                <Textarea id="message" name="message" placeholder="Any specific requirements..." />
              </div>
              
              <Button type="submit" className="w-full">
                Submit Enquiry
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Testimonials */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              What Our Customers Say
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Don't just take our word for it - hear from our satisfied customers
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: "Rajesh Kumar",
                role: "Homeowner",
                content: "Excellent quality tiles and outstanding service. The team helped us choose the perfect tiles for our new home.",
                rating: 5
              },
              {
                name: "Priya Sharma",
                role: "Interior Designer",
                content: "House of Tiles has been our go-to supplier for all projects. Their collection is unmatched and delivery is always on time.",
                rating: 5
              },
              {
                name: "Amit Patel",
                role: "Contractor",
                content: "Professional service and competitive prices. They have tiles for every budget and style requirement.",
                rating: 5
              }
            ].map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="h-full">
                  <CardContent className="p-6">
                    <div className="flex mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-muted-foreground mb-6 italic">
                      "{testimonial.content}"
                    </p>
                    <div>
                      <h4 className="font-semibold">{testimonial.name}</h4>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Transform Your Space?
            </h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
              Get in touch with our experts for personalized recommendations and quotes
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" className="rounded-full px-8">
                <Phone className="mr-2 h-5 w-5" />
                Call Now: +91 98765 43210
              </Button>
              <Button size="lg" variant="outline" className="rounded-full px-8 border-white text-white hover:bg-white hover:text-primary">
                <Mail className="mr-2 h-5 w-5" />
                Get Free Quote
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
      {/* Footer */}
      <footer className="bg-muted/50 py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <h3 className="text-2xl font-bold mb-4 text-primary">House of Tiles</h3>
              <p className="text-muted-foreground mb-6 max-w-md">
                Your trusted partner for premium tiles and flooring solutions. 
                We bring quality, style, and durability to every project.
              </p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                <MapPin className="h-4 w-4" />
                <span>123 Tile Street, Design District, Mumbai 400001</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                <Phone className="h-4 w-4" />
                <span>+91 98765 43210</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>info@houseoftiles.com</span>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <div className="space-y-2 text-sm">
                <Link href="#" className="block text-muted-foreground hover:text-primary transition-colors">
                  About Us
                </Link>
                <Link href="#" className="block text-muted-foreground hover:text-primary transition-colors">
                  Our Services
                </Link>
                <Link href="#" className="block text-muted-foreground hover:text-primary transition-colors">
                  Installation Guide
                </Link>
                <Link href="#" className="block text-muted-foreground hover:text-primary transition-colors">
                  Maintenance Tips
                </Link>
                <Link href="#" className="block text-muted-foreground hover:text-primary transition-colors">
                  Contact Us
                </Link>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Categories</h4>
              <div className="space-y-2 text-sm">
                {categories.slice(0, 5).map(category => (
                  <button
                    key={category.id}
                    onClick={() => {
                      setSelectedCategory(category.id)
                      document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' })
                    }}
                    className="block text-muted-foreground hover:text-primary transition-colors text-left"
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          <div className="border-t border-border pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="text-sm text-muted-foreground">
                <p>&copy; 2024 House of Tiles. All rights reserved.</p>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
                <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  Terms of Service
                </Link>
                <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  Shipping Policy
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Cart Sidebar */}
      <CartSidebar 
        isOpen={showCart}
        onClose={() => setShowCart(false)}
        cart={cart}
        setCart={setCart}
      />
    </div>
  )
}