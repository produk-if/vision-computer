import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { terminateSession } from '@/lib/session-security'

/**
 * DELETE /api/sessions/[sessionId]
 * Terminate a specific session
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { sessionId } = params

    // Verify session belongs to user
    const targetSession = await prisma.userSession.findFirst({
      where: {
        id: sessionId,
        userId: session.user.id,
      },
    })

    if (!targetSession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    // Terminate session
    await terminateSession(sessionId)

    return NextResponse.json({
      success: true,
      message: 'Session terminated',
    })
  } catch (error) {
    console.error('[SESSIONS] Error terminating session:', error)
    return NextResponse.json(
      { error: 'Failed to terminate session' },
      { status: 500 }
    )
  }
}
