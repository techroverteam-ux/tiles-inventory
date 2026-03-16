import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

const NOTIFICATION_RETENTION_DAYS = 10

type NotificationDbType = 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR'

type NotificationRecord = {
  id: string
  title: string
  message: string
  type: NotificationDbType
  read: boolean
  createdAt: Date
}

const notificationsModel = (
  prisma as unknown as {
    notification: {
      deleteMany: (args: unknown) => Promise<unknown>
      findMany: (args: unknown) => Promise<NotificationRecord[]>
      create: (args: unknown) => Promise<NotificationRecord>
      updateMany: (args: unknown) => Promise<unknown>
    }
  }
).notification

function requireUserId(request: NextRequest) {
  const authUser = getAuthUser(request)
  if (!authUser?.userId) {
    return null
  }
  return authUser.userId
}

function toClientType(type: NotificationDbType) {
  return type.toLowerCase() as 'info' | 'success' | 'warning' | 'error'
}

function toDbType(type?: string) {
  switch ((type || '').toLowerCase()) {
    case 'success':
      return 'SUCCESS' as const
    case 'warning':
      return 'WARNING' as const
    case 'error':
      return 'ERROR' as const
    case 'info':
    default:
      return 'INFO' as const
  }
}

async function cleanupExpiredNotifications(userId: string) {
  const cutoff = new Date(Date.now() - NOTIFICATION_RETENTION_DAYS * 24 * 60 * 60 * 1000)
  await notificationsModel.deleteMany({
    where: {
      userId,
      createdAt: {
        lt: cutoff,
      },
    },
  })
}

export async function GET(request: NextRequest) {
  try {
    const userId = requireUserId(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await cleanupExpiredNotifications(userId)

    const notifications = await notificationsModel.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 200,
    })

    return NextResponse.json({
      notifications: notifications.map((item: NotificationRecord) => ({
        id: item.id,
        title: item.title,
        message: item.message,
        type: toClientType(item.type),
        read: item.read,
        timestamp: item.createdAt,
      })),
    })
  } catch (error) {
    console.error('Notifications fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = requireUserId(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const title = (body.title || '').toString().trim()
    const message = (body.message || '').toString().trim()
    const type = toDbType(body.type)

    if (!title || !message) {
      return NextResponse.json({ error: 'Title and message are required' }, { status: 400 })
    }

    const created = await notificationsModel.create({
      data: {
        userId,
        title,
        message,
        type,
        read: false,
      },
    })

    return NextResponse.json({
      notification: {
        id: created.id,
        title: created.title,
        message: created.message,
        type: toClientType(created.type),
        read: created.read,
        timestamp: created.createdAt,
      },
    }, { status: 201 })
  } catch (error) {
    console.error('Notification create error:', error)
    return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const userId = requireUserId(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const action = body.action as 'markAllRead' | 'deleteRead' | 'clearAll' | undefined

    if (action === 'markAllRead') {
      await notificationsModel.updateMany({
        where: { userId, read: false },
        data: { read: true },
      })
      return NextResponse.json({ success: true })
    }

    if (action === 'deleteRead') {
      await notificationsModel.deleteMany({
        where: { userId, read: true },
      })
      return NextResponse.json({ success: true })
    }

    if (action === 'clearAll') {
      await notificationsModel.deleteMany({
        where: { userId },
      })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Notification bulk action error:', error)
    return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 })
  }
}
