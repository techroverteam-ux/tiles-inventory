'use client'

import { useState } from 'react'
import { X, Plus, Minus, Trash2, ShoppingBag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { toast } from 'react-hot-toast'
import Image from 'next/image'

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
}

interface CartItem extends Product {
  quantity: number
}

interface CartSidebarProps {
  isOpen: boolean
  onClose: () => void
  cart: Product[]
  setCart: (cart: Product[]) => void
}

export function CartSidebar({ isOpen, onClose, cart, setCart }: CartSidebarProps) {
  const [showCheckout, setShowCheckout] = useState(false)
  
  // Group cart items by product ID and count quantities
  const cartItems: CartItem[] = cart.reduce((acc: CartItem[], product) => {
    const existingItem = acc.find(item => item.id === product.id)
    if (existingItem) {
      existingItem.quantity += 1
    } else {
      acc.push({ ...product, quantity: 1 })
    }
    return acc
  }, [])

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId)
      return
    }
    
    const product = cartItems.find(item => item.id === productId)
    if (!product) return
    
    const newCart: Product[] = []
    for (let i = 0; i < newQuantity; i++) {
      newCart.push(product)
    }
    
    // Remove all instances of this product and add the new quantity
    const filteredCart = cart.filter(item => item.id !== productId)
    setCart([...filteredCart, ...newCart])
  }

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.id !== productId))
    toast.success('Item removed from cart')
  }

  const clearCart = () => {
    setCart([])
    toast.success('Cart cleared')
  }

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0)
  }

  const handleCheckout = async (formData: FormData) => {
    try {
      const checkoutData = {
        items: cartItems.map(item => ({
          productId: item.id,
          productName: item.name,
          brand: item.brand.name,
          quantity: item.quantity,
          sqftPerBox: item.sqftPerBox
        })),
        customerName: formData.get('name'),
        customerEmail: formData.get('email'),
        customerPhone: formData.get('phone'),
        customerAddress: formData.get('address'),
        message: formData.get('message'),
        totalItems: getTotalItems()
      }

      const response = await fetch('/api/enquiries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...checkoutData,
          type: 'BULK_ENQUIRY'
        })
      })

      if (response.ok) {
        toast.success('Enquiry submitted successfully! We will contact you with a quote.')
        setShowCheckout(false)
        clearCart()
        onClose()
      } else {
        throw new Error('Failed to submit enquiry')
      }
    } catch (error) {
      toast.error('Failed to submit enquiry')
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 z-50" 
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-background border-l border-border z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Cart ({getTotalItems()})</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4">
          {cartItems.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Your cart is empty</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cartItems.map((item) => (
                <Card key={item.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex gap-3">
                      <div className="relative w-16 h-16 rounded-lg overflow-hidden">
                        <Image
                          src={item.imageUrl || '/placeholder-tile.svg'}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm line-clamp-2">{item.name}</h4>
                        <p className="text-xs text-muted-foreground">{item.brand.name}</p>
                        <Badge variant="outline" className="text-xs mt-1">
                          {item.category.name}
                        </Badge>
                        
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 w-6 p-0"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="text-sm font-medium w-8 text-center">
                              {item.quantity}
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 w-6 p-0"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 text-destructive"
                            onClick={() => removeFromCart(item.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                        
                        <div className="text-xs text-muted-foreground mt-1">
                          Total: {(item.quantity * item.sqftPerBox).toFixed(1)} sq ft
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {cartItems.length > 0 && (
          <div className="border-t border-border p-4 space-y-3">
            <div className="text-sm text-muted-foreground">
              Total Coverage: {cartItems.reduce((total, item) => total + (item.quantity * item.sqftPerBox), 0).toFixed(1)} sq ft
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={clearCart} className="flex-1">
                Clear Cart
              </Button>
              <Button onClick={() => setShowCheckout(true)} className="flex-1">
                Get Quote
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Checkout Modal */}
      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Request Quote</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={(e) => {
            e.preventDefault()
            const formData = new FormData(e.currentTarget)
            handleCheckout(formData)
          }} className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Cart Summary</h4>
              <div className="space-y-1 text-sm">
                {cartItems.map(item => (
                  <div key={item.id} className="flex justify-between">
                    <span className="truncate">{item.name}</span>
                    <span>{item.quantity}x</span>
                  </div>
                ))}
                <div className="border-t pt-1 mt-2 font-medium">
                  Total: {cartItems.reduce((total, item) => total + (item.quantity * item.sqftPerBox), 0).toFixed(1)} sq ft
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="checkout-name">Name *</Label>
                <Input id="checkout-name" name="name" required />
              </div>
              <div>
                <Label htmlFor="checkout-phone">Phone *</Label>
                <Input id="checkout-phone" name="phone" type="tel" required />
              </div>
            </div>
            
            <div>
              <Label htmlFor="checkout-email">Email *</Label>
              <Input id="checkout-email" name="email" type="email" required />
            </div>
            
            <div>
              <Label htmlFor="checkout-address">Address</Label>
              <Textarea id="checkout-address" name="address" placeholder="Delivery address..." />
            </div>
            
            <div>
              <Label htmlFor="checkout-message">Additional Requirements</Label>
              <Textarea id="checkout-message" name="message" placeholder="Any specific requirements..." />
            </div>
            
            <Button type="submit" className="w-full">
              Submit Quote Request
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}