import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { terminateAllSessions } from '@/lib/session-security'

/**
 * GET /api/sessions
 * List all active sessions for current user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get all active sessions
    const sessions = await prisma.userSession.findMany({
      where: {
        userId: session.user.id,
        isActive: true,
      },
      orderBy: {
        lastActivity: 'desc',
      },
      select: {
        id: true,
        browser: true,
        os: true,
        ipAddress: true,
        lastActivity: true,
        createdAt: true,
        sessionToken: true, // To identify current session
      },
    })

    // Mark current session
    const currentSessionToken = (session.user as any).sessionToken
    const enrichedSessions = sessions.map((s) => ({
      ...s,
      isCurrent: s.sessionToken === currentSessionToken,
      sessionToken: undefined, // Don't expose full token
    }))

    return NextResponse.json({
      success: true,
      sessions: enrichedSessions,
      total: sessions.length,
    })
  } catch (error) {
    console.error('[SESSIONS] Error fetching sessions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/sessions
 * Terminate all other sessions (keep current)
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const currentSessionToken = (session.user as any).sessionToken

    // Get current session ID
    const currentSession = await prisma.userSession.findFirst({
      where: {
        userId: session.user.id,
        sessionToken: currentSessionToken,
        isActive: true,
      },
      select: { id: true },
    })

    if (!currentSession) {
      return NextResponse.json(
        { error: 'Current session not found' },
        { status: 400 }
      )
    }

    // Terminate all except current
    await terminateAllSessions(session.user.id, currentSession.id)

    return NextResponse.json({
      success: true,
      message: 'All other sessions terminated',
    })
  } catch (error) {
    console.error('[SESSIONS] Error terminating sessions:', error)
    return NextResponse.json(
      { error: 'Failed to terminate sessions' },
      { status: 500 }
    )
  }
}
