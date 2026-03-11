import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const finishTypes = await prisma.finishType.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ finishTypes })
  } catch (error) {
    console.error('FinishTypes fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch finish types' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    const finishType = await prisma.finishType.create({
      data: {
        name: data.name,
        description: data.description,
      },
    })

    return NextResponse.json(finishType, { status: 201 })
  } catch (error) {
    console.error('FinishType creation error:', error)
    return NextResponse.json({ error: 'Failed to create finish type' }, { status: 500 })
  }
}
