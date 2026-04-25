import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    requireAuth(request)

    const { id } = await context.params
    const body = await request.json()

    const data: {
      isActive?: boolean
      name?: string
      phone?: string
      address?: string
    } = {}

    if (typeof body.isActive === 'boolean') data.isActive = body.isActive
    if (typeof body.name === 'string') data.name = body.name.trim()
    if (typeof body.phone === 'string') data.phone = body.phone.trim()
    if (typeof body.address === 'string') data.address = body.address.trim()

    const updated = await prisma.customer.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        phone: true,
        address: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({ customer: updated })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update customer'
    const status = message.includes('Authentication required') ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    requireAuth(request)
    const { id } = await context.params

    await prisma.customer.delete({ where: { id } })
    return NextResponse.json({ message: 'Customer deleted' })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete customer'
    const status = message.includes('Authentication required') ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
