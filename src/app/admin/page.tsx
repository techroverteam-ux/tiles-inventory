import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function AdminIndexPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value
  const scope = cookieStore.get('auth-scope')?.value

  if (!token || scope === 'customer') {
    redirect('/admin/login')
  }

  redirect('/admin/dashboard')
}
