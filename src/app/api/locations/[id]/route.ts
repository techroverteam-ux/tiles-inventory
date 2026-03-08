import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const data = await request.json()
    
    const location = await prisma.location.update({
      where: { id },
      data: { name: data.name },
    })
    return NextResponse.json(location)
  } catch (error) {
    console.error('Location update error:', error)
    return NextResponse.json({ error: 'Failed to update location' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await prisma.location.update({
      where: { id },
      data: { isActive: false },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Location delete error:', error)
    return NextResponse.json({ error: 'Failed to delete location' }, { status: 500 })
  }
}