'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/contexts/SessionContext'
import { LoadingPage } from '@/components/ui/skeleton'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, isLoading, router])

  // Show loading spinner while checking authentication
  if (isLoading) {
    return <LoadingPage view="grid" title="Verifying session" items={6} columns={3} />
  }

  // Don't render children if not authenticated
  if (!isAuthenticated || !user) {
    return null
  }

  return <>{children}</>
}