import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const data = await request.json()
    
    const brand = await prisma.brand.update({
      where: { id },
      data: { name: data.name },
    })
    return NextResponse.json(brand)
  } catch (error) {
    console.error('Brand update error:', error)
    return NextResponse.json({ error: 'Failed to update brand' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await prisma.brand.update({
      where: { id },
      data: { isActive: false },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Brand delete error:', error)
    return NextResponse.json({ error: 'Failed to delete brand' }, { status: 500 })
  }
}