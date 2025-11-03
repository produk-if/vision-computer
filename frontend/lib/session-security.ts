import crypto from 'crypto'
import { headers } from 'next/headers'

export interface DeviceFingerprint {
  userAgent: string
  ip: string
  fingerprint: string
}

export function getDeviceFingerprint(): DeviceFingerprint {
  const headersList = headers()

  const userAgent = headersList.get('user-agent') || 'unknown'
  const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headersList.get('x-real-ip') ||
    'unknown'

  // Create fingerprint from UA + IP
  const fingerprint = crypto
    .createHash('sha256')
    .update(`${userAgent}:${ip}`)
    .digest('hex')

  return {
    userAgent,
    ip,
    fingerprint,
  }
}

export function extractBrowserInfo(userAgent: string) {
  // Parse browser name and version
  let browser = 'Unknown'
  let os = 'Unknown'

  if (userAgent.includes('Chrome')) browser = 'Chrome'
  else if (userAgent.includes('Firefox')) browser = 'Firefox'
  else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) browser = 'Safari'
  else if (userAgent.includes('Edge')) browser = 'Edge'

  if (userAgent.includes('Windows')) os = 'Windows'
  else if (userAgent.includes('Mac')) os = 'macOS'
  else if (userAgent.includes('Linux')) os = 'Linux'
  else if (userAgent.includes('Android')) os = 'Android'
  else if (userAgent.includes('iOS')) os = 'iOS'

  return { browser, os }
}

export async function validateSession(userId: string, sessionToken: string) {
  const { prisma } = await import('@/lib/prisma')
  const currentDevice = getDeviceFingerprint()

  // Get active session
  const session = await prisma.userSession.findFirst({
    where: {
      userId,
      sessionToken,
      isActive: true,
    },
  })

  if (!session) {
    return { valid: false, reason: 'Session not found or expired' }
  }

  // Check if fingerprint matches
  if (session.deviceId !== currentDevice.fingerprint) {
    // Device mismatch - possible session theft
    await prisma.userSession.update({
      where: { id: session.id },
      data: {
        isActive: false,
        lastActivity: new Date(),
      },
    })

    return { valid: false, reason: 'Device mismatch detected' }
  }

  // Check session expiry (24 hours)
  const now = new Date()
  const sessionAge = now.getTime() - new Date(session.lastActivity).getTime()
  const maxAge = 24 * 60 * 60 * 1000 // 24 hours

  if (sessionAge > maxAge) {
    await prisma.userSession.update({
      where: { id: session.id },
      data: { isActive: false },
    })

    return { valid: false, reason: 'Session expired' }
  }

  // Update last activity
  await prisma.userSession.update({
    where: { id: session.id },
    data: { lastActivity: now },
  })

  return { valid: true, session }
}

export async function createSession(userId: string, sessionToken: string) {
  const { prisma } = await import('@/lib/prisma')
  const device = getDeviceFingerprint()
  const { browser, os } = extractBrowserInfo(device.userAgent)

  // Deactivate all other sessions for this user (single session policy)
  await prisma.userSession.updateMany({
    where: {
      userId,
      isActive: true,
    },
    data: {
      isActive: false,
    },
  })

  // Create new session
  const session = await prisma.userSession.create({
    data: {
      userId,
      sessionToken,
      deviceId: device.fingerprint,
      ipAddress: device.ip,
      userAgent: device.userAgent,
      browser,
      os,
      isActive: true,
      lastActivity: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    },
  })

  return session
}

export async function terminateSession(sessionId: string) {
  const { prisma } = await import('@/lib/prisma')

  await prisma.userSession.update({
    where: { id: sessionId },
    data: { isActive: false },
  })
}

export async function terminateAllSessions(userId: string, exceptSessionId?: string) {
  const { prisma } = await import('@/lib/prisma')

  await prisma.userSession.updateMany({
    where: {
      userId,
      isActive: true,
      ...(exceptSessionId && { id: { not: exceptSessionId } }),
    },
    data: {
      isActive: false,
    },
  })
}
