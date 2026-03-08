import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const sizes = await prisma.finishType.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ sizes })
  } catch (error) {
    console.error('Sizes fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch sizes' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const size = await prisma.finishType.create({
      data: { name: data.name },
    })
    return NextResponse.json(size, { status: 201 })
  } catch (error) {
    console.error('Size creation error:', error)
    return NextResponse.json({ error: 'Failed to create size' }, { status: 500 })
  }
}