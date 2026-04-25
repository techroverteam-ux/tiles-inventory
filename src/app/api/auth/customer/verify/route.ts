import { NextRequest, NextResponse } from 'next/server'
import { getCustomerAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const authUser = getCustomerAuthUser(request)

    if (!authUser) {
      return NextResponse.json({ error: 'No valid customer session found' }, { status: 401 })
    }

    const customerId = authUser.customerId || authUser.userId

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        phone: true,
        address: true,
        isActive: true,
      },
    })

    if (!customer || !customer.isActive) {
      return NextResponse.json({ error: 'Customer not found or inactive' }, { status: 401 })
    }

    return NextResponse.json({ message: 'Customer session valid', customer })
  } catch (error) {
    console.error('Customer session verification error:', error)
    return NextResponse.json({ error: 'Session verification failed' }, { status: 401 })
  }
}
