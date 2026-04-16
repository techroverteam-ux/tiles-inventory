import { NextRequest } from 'next/server'

type RateLimitResult = {
  success: boolean
  limit: number
  remaining: number
  resetAt: number
}

type Bucket = {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()

function cleanupExpiredBuckets(now: number) {
  if (buckets.size < 5000) return
  for (const [key, bucket] of buckets.entries()) {
    if (bucket.resetAt <= now) {
      buckets.delete(key)
    }
  }
}

export function getRateLimitKey(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for')
  const ip = forwardedFor?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown'
  const userAgent = request.headers.get('user-agent') || 'unknown'
  return `${ip}:${userAgent.slice(0, 40)}`
}

export function checkRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now()
  cleanupExpiredBuckets(now)

  const bucket = buckets.get(key)

  if (!bucket || bucket.resetAt <= now) {
    const nextBucket: Bucket = {
      count: 1,
      resetAt: now + windowMs,
    }
    buckets.set(key, nextBucket)
    return {
      success: true,
      limit,
      remaining: Math.max(0, limit - 1),
      resetAt: nextBucket.resetAt,
    }
  }

  if (bucket.count >= limit) {
    return {
      success: false,
      limit,
      remaining: 0,
      resetAt: bucket.resetAt,
    }
  }

  bucket.count += 1
  buckets.set(key, bucket)

  return {
    success: true,
    limit,
    remaining: Math.max(0, limit - bucket.count),
    resetAt: bucket.resetAt,
  }
}
