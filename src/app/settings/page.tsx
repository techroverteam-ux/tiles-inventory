'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { User, Building, Bell, Shield } from 'lucide-react'

export default function SettingsPage() {
  return (
    <div className="w-full px-3 sm:px-4 md:px-6 space-y-8 pb-10">
      <div className="page-header">
        <div className="space-y-1">
          <h1 className="page-title">Settings</h1>
          <p className="text-muted-foreground font-medium flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary/60" />
            Manage your account and application preferences
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="hover:shadow-premium transition-all duration-300 border-border/50 rounded-3xl overflow-hidden glass-card group">
          <CardHeader className="pb-4 border-b border-border/30 bg-muted/20">
            <CardTitle className="flex items-center gap-3 text-xl font-bold text-foreground">
              <div className="p-2 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                <User className="h-5 w-5" />
              </div>
              Profile Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground/80 ml-1">Full Name</label>
              <Input 
                defaultValue="Admin User" 
                className="rounded-2xl bg-muted/20 border-border/40 focus:bg-background transition-all h-12"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground/80 ml-1">Email Address</label>
              <Input 
                defaultValue="admin@tiles.com" 
                className="rounded-2xl bg-muted/20 border-border/40 focus:bg-background transition-all h-12"
              />
            </div>
            <Button className="w-full rounded-2xl h-12 font-bold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95">
              Save Profile Changes
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-premium transition-all duration-300 border-border/50 rounded-3xl overflow-hidden glass-card group">
          <CardHeader className="pb-4 border-b border-border/30 bg-muted/20">
            <CardTitle className="flex items-center gap-3 text-xl font-bold text-foreground">
              <div className="p-2 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                <Building className="h-5 w-5" />
              </div>
              Company Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground/80 ml-1">Company Name</label>
              <Input 
                defaultValue="Tiles Showroom" 
                className="rounded-2xl bg-muted/20 border-border/40 focus:bg-background transition-all h-12"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground/80 ml-1">Business Address</label>
              <Input 
                defaultValue="123 Tile Street" 
                className="rounded-2xl bg-muted/20 border-border/40 focus:bg-background transition-all h-12"
              />
            </div>
            <Button className="w-full rounded-2xl h-12 font-bold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95">
              Update Company Info
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-premium transition-all duration-300 border-border/50 rounded-3xl overflow-hidden glass-card group">
          <CardHeader className="pb-4 border-b border-border/30 bg-muted/20">
            <CardTitle className="flex items-center gap-3 text-xl font-bold text-foreground">
              <div className="p-2 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                <Bell className="h-5 w-5" />
              </div>
              Notification Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="flex items-center justify-between p-4 bg-muted/20 rounded-2xl border border-border/30 group/item hover:bg-muted/30 transition-colors">
              <div className="flex flex-col">
                <span className="font-bold text-foreground">Low Stock Alerts</span>
                <span className="text-xs text-muted-foreground">Notify when products go below threshold</span>
              </div>
              <Button variant="outline" size="sm" className="rounded-xl border-primary/20 bg-primary/5 text-primary font-bold hover:bg-primary hover:text-primary-foreground">Enabled</Button>
            </div>
            <div className="flex items-center justify-between p-4 bg-muted/20 rounded-2xl border border-border/30 group/item hover:bg-muted/30 transition-colors">
              <div className="flex flex-col">
                <span className="font-bold text-foreground">Order Updates</span>
                <span className="text-xs text-muted-foreground">Receive updates on sales and purchase orders</span>
              </div>
              <Button variant="outline" size="sm" className="rounded-xl border-primary/20 bg-primary/5 text-primary font-bold hover:bg-primary hover:text-primary-foreground">Enabled</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-premium transition-all duration-300 border-border/50 rounded-3xl overflow-hidden glass-card group">
          <CardHeader className="pb-4 border-b border-border/30 bg-destructive/5">
            <CardTitle className="flex items-center gap-3 text-xl font-bold text-destructive">
              <div className="p-2 rounded-xl bg-destructive/10 text-destructive group-hover:bg-destructive group-hover:text-white transition-all duration-300">
                <Shield className="h-5 w-5" />
              </div>
              Security & Safety
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <Button variant="outline" className="w-full rounded-2xl h-12 font-bold border-border/50 hover:bg-destructive/5 hover:text-destructive hover:border-destructive/30 transition-all">
              Change Account Password
            </Button>
            <Button variant="outline" className="w-full rounded-2xl h-12 font-bold border-border/50 hover:bg-primary/5 hover:text-primary hover:border-primary/30 transition-all">
              Two-Factor Authentication
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}