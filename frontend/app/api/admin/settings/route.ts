import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getAllSettings, isAutoApprovalEnabled } from '@/lib/system-settings'

/**
 * GET /api/admin/settings
 * Get all system settings
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin only' },
        { status: 403 }
      )
    }

    const settings = await getAllSettings()
    const autoApprovalEnabled = await isAutoApprovalEnabled()

    return NextResponse.json({
      success: true,
      settings,
      autoApprovalEnabled,
    })
  } catch (error) {
    console.error('[SETTINGS] Error fetching settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}
