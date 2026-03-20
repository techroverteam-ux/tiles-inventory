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
    
    // Check if finish type name already exists (including inactive ones)
    const existingFinishType = await prisma.finishType.findFirst({
      where: { name: { equals: data.name?.trim(), mode: 'insensitive' } }
    })

    if (existingFinishType) {
      if (existingFinishType.isActive) {
        return NextResponse.json(
          { error: 'Finish type already exists' },
          { status: 400 }
        )
      }

      // Reactivate inactive finish type
      const reactivatedFinishType = await prisma.finishType.update({
        where: { id: existingFinishType.id },
        data: {
          description: data.description?.trim() || existingFinishType.description,
          isActive: true,
          updatedAt: new Date(),
        }
      })
      return NextResponse.json(reactivatedFinishType, { status: 200 })
    }

    const finishType = await prisma.finishType.create({
      data: {
        name: data.name?.trim(),
        description: data.description?.trim(),
      },
    })

    return NextResponse.json(finishType, { status: 201 })
  } catch (error) {
    console.error('FinishType creation error:', error)
    return NextResponse.json({ error: 'Failed to create finish type' }, { status: 500 })
  }
}
