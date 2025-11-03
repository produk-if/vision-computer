import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { toggleAutoApproval } from '@/lib/system-settings'

/**
 * POST /api/admin/settings/auto-approval
 * Toggle auto-approval setting
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin only' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { enabled } = body

    if (typeof enabled !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid request - enabled must be boolean' },
        { status: 400 }
      )
    }

    // Toggle the setting
    await toggleAutoApproval(enabled, session.user.id)

    console.log(`[ADMIN] Auto-approval ${enabled ? 'ENABLED' : 'DISABLED'} by ${session.user.name}`)

    return NextResponse.json({
      success: true,
      enabled,
      message: enabled
        ? 'Auto-approval diaktifkan. Semua dokumen akan otomatis disetujui.'
        : 'Auto-approval dinonaktifkan. Dokumen memerlukan persetujuan manual admin.',
    })
  } catch (error) {
    console.error('[SETTINGS] Error toggling auto-approval:', error)
    return NextResponse.json(
      { error: 'Failed to toggle auto-approval' },
      { status: 500 }
    )
  }
}
