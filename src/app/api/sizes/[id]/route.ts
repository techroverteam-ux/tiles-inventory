import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const data = await request.json()
    const size = await prisma.finishType.update({
      where: { id },
      data: { name: data.name },
    })
    return NextResponse.json(size)
  } catch (error) {
    console.error('Size update error:', error)
    return NextResponse.json({ error: 'Failed to update size' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await prisma.finishType.update({
      where: { id },
      data: { isActive: false },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Size delete error:', error)
    return NextResponse.json({ error: 'Failed to delete size' }, { status: 500 })
  }
}