'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { User, Building, Bell, Shield, Trash2, AlertTriangle, Eye, EyeOff, X } from 'lucide-react'
import { useToast } from '@/contexts/ToastContext'
import { cn } from '@/lib/utils'

type DangerAction = 'delete-account' | 'delete-all-data' | null

interface DangerDialogProps {
  action: DangerAction
  onClose: () => void
  onSuccess: (action: DangerAction) => void
}

function DangerDialog({ action, onClose, onSuccess }: DangerDialogProps) {
  const [step, setStep] = useState<'password' | 'confirm'>('password')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { showToast } = useToast()

  const isDeleteAll = action === 'delete-all-data'
  const title = isDeleteAll ? 'Delete All Data' : 'Delete Account'
  const confirmPhrase = isDeleteAll ? 'DELETE ALL DATA' : 'DELETE ACCOUNT'
  const description = isDeleteAll
    ? 'This will permanently delete ALL brands, categories, products, inventory, orders, and every record in the system. This cannot be undone.'
    : 'This will permanently delete your account. You will be logged out immediately and cannot recover your account.'

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password.trim()) { setError('Password is required'); return }
    setError('')

    setLoading(true)
    try {
      // Verify password first via a lightweight check
      const res = await fetch('/api/admin/danger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: '__verify__', password })
      })
      // 403 = wrong password, anything else means password was accepted (even if action invalid)
      if (res.status === 403) {
        setError('Incorrect password. Please try again.')
        setLoading(false)
        return
      }
      setStep('confirm')
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (confirmText !== confirmPhrase) {
      setError(`Type exactly: ${confirmPhrase}`)
      return
    }
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/admin/danger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, password })
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Operation failed')
        setLoading(false)
        return
      }
      showToast(
        isDeleteAll ? 'All data deleted successfully.' : 'Account deleted successfully.',
        'success'
      )
      onSuccess(action)
    } catch {
      setError('Network error. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Dialog */}
      <div className="relative w-full max-w-md bg-background border border-destructive/30 rounded-3xl shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-destructive/20 bg-destructive/5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-destructive">{title}</h2>
              <p className="text-xs text-muted-foreground">
                {step === 'password' ? 'Step 1 of 2 — Verify identity' : 'Step 2 of 2 — Final confirmation'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-6 space-y-5">
          {/* Warning box */}
          <div className="p-4 bg-destructive/5 border border-destructive/20 rounded-2xl space-y-1">
            <p className="text-sm font-bold text-destructive flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              This action is irreversible
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
          </div>

          {step === 'password' ? (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-foreground/80 ml-1">
                  Enter your password to continue
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError('') }}
                    placeholder="Your account password"
                    autoFocus
                    className="rounded-2xl bg-muted/20 border-border/40 focus:bg-background h-12 pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {error && <p className="text-xs text-destructive font-medium ml-1">{error}</p>}
              </div>
              <div className="flex gap-3 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="flex-1 rounded-2xl h-11 font-bold border-border/50"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !password}
                  className="flex-1 rounded-2xl h-11 font-bold bg-destructive hover:bg-destructive/90 text-white shadow-lg shadow-destructive/20"
                >
                  {loading ? 'Verifying...' : 'Continue'}
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleConfirmSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-foreground/80 ml-1">
                  Type <span className="font-mono text-destructive bg-destructive/10 px-1.5 py-0.5 rounded-lg text-xs">{confirmPhrase}</span> to confirm
                </label>
                <Input
                  value={confirmText}
                  onChange={(e) => { setConfirmText(e.target.value); setError('') }}
                  placeholder={confirmPhrase}
                  autoFocus
                  className="rounded-2xl bg-muted/20 border-border/40 focus:bg-background h-12 font-mono"
                />
                {error && <p className="text-xs text-destructive font-medium ml-1">{error}</p>}
              </div>
              <div className="flex gap-3 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="flex-1 rounded-2xl h-11 font-bold border-border/50"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading || confirmText !== confirmPhrase}
                  className="flex-1 rounded-2xl h-11 font-bold bg-destructive hover:bg-destructive/90 text-white shadow-lg shadow-destructive/20"
                >
                  {loading ? 'Processing...' : isDeleteAll ? 'Delete All Data' : 'Delete Account'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default function SettingsPage() {
  const router = useRouter()
  const [dangerAction, setDangerAction] = useState<DangerAction>(null)
  const { showToast } = useToast()

  const handleDangerSuccess = (action: DangerAction) => {
    setDangerAction(null)
    if (action === 'delete-account') {
      router.push('/login')
    } else {
      showToast('All data has been wiped. The system is now empty.', 'success')
    }
  }

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
        {/* Profile */}
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
              <Input defaultValue="Admin User" className="rounded-2xl bg-muted/20 border-border/40 focus:bg-background transition-all h-12" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground/80 ml-1">Email Address</label>
              <Input defaultValue="admin@tiles.com" className="rounded-2xl bg-muted/20 border-border/40 focus:bg-background transition-all h-12" />
            </div>
            <Button className="w-full rounded-2xl h-12 font-bold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95">
              Save Profile Changes
            </Button>
          </CardContent>
        </Card>

        {/* Company */}
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
              <Input defaultValue="Tiles Showroom" className="rounded-2xl bg-muted/20 border-border/40 focus:bg-background transition-all h-12" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground/80 ml-1">Business Address</label>
              <Input defaultValue="123 Tile Street" className="rounded-2xl bg-muted/20 border-border/40 focus:bg-background transition-all h-12" />
            </div>
            <Button className="w-full rounded-2xl h-12 font-bold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95">
              Update Company Info
            </Button>
          </CardContent>
        </Card>

        {/* Notifications */}
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
            <div className="flex items-center justify-between p-4 bg-muted/20 rounded-2xl border border-border/30 hover:bg-muted/30 transition-colors">
              <div className="flex flex-col">
                <span className="font-bold text-foreground">Low Stock Alerts</span>
                <span className="text-xs text-muted-foreground">Notify when products go below threshold</span>
              </div>
              <Button variant="outline" size="sm" className="rounded-xl border-primary/20 bg-primary/5 text-primary font-bold hover:bg-primary hover:text-primary-foreground shrink-0">Enabled</Button>
            </div>
            <div className="flex items-center justify-between p-4 bg-muted/20 rounded-2xl border border-border/30 hover:bg-muted/30 transition-colors">
              <div className="flex flex-col">
                <span className="font-bold text-foreground">Order Updates</span>
                <span className="text-xs text-muted-foreground">Receive updates on sales and purchase orders</span>
              </div>
              <Button variant="outline" size="sm" className="rounded-xl border-primary/20 bg-primary/5 text-primary font-bold hover:bg-primary hover:text-primary-foreground shrink-0">Enabled</Button>
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card className="hover:shadow-premium transition-all duration-300 border-border/50 rounded-3xl overflow-hidden glass-card group">
          <CardHeader className="pb-4 border-b border-border/30 bg-muted/20">
            <CardTitle className="flex items-center gap-3 text-xl font-bold text-foreground">
              <div className="p-2 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                <Shield className="h-5 w-5" />
              </div>
              Security
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

      {/* Danger Zone — full width */}
      <Card className="border-destructive/40 rounded-3xl overflow-hidden shadow-lg shadow-destructive/5">
        <CardHeader className="pb-4 border-b border-destructive/20 bg-destructive/5">
          <CardTitle className="flex items-center gap-3 text-xl font-bold text-destructive">
            <div className="p-2 rounded-xl bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            Danger Zone
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            These actions are permanent and cannot be undone. Proceed with extreme caution.
          </p>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Delete Account */}
            <div className="flex flex-col gap-3 p-5 rounded-2xl border border-destructive/20 bg-destructive/5 hover:bg-destructive/10 transition-colors">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-destructive/10 shrink-0 mt-0.5">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-foreground">Delete Account</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    Permanently delete your admin account. You will be logged out and cannot log back in.
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => setDangerAction('delete-account')}
                className="w-full rounded-xl h-10 font-bold border-destructive/40 text-destructive hover:bg-destructive hover:text-white hover:border-destructive transition-all"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete My Account
              </Button>
            </div>

            {/* Delete All Data */}
            <div className="flex flex-col gap-3 p-5 rounded-2xl border border-destructive/40 bg-destructive/10 hover:bg-destructive/15 transition-colors">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-destructive/20 shrink-0 mt-0.5">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-foreground flex items-center gap-2">
                    Delete All Data
                    <span className="text-[10px] font-bold bg-destructive text-white px-1.5 py-0.5 rounded-full uppercase tracking-wider">Extreme</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    Wipe all brands, categories, products, inventory, purchase &amp; sales orders from the entire system.
                  </p>
                </div>
              </div>
              <Button
                onClick={() => setDangerAction('delete-all-data')}
                className="w-full rounded-xl h-10 font-bold bg-destructive hover:bg-destructive/90 text-white shadow-lg shadow-destructive/30 transition-all"
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Delete All Data
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger Dialog */}
      {dangerAction && (
        <DangerDialog
          action={dangerAction}
          onClose={() => setDangerAction(null)}
          onSuccess={handleDangerSuccess}
        />
      )}
    </div>
  )
}
