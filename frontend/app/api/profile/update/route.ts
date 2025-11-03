import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/profile/update
 * Update user profile
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Tidak diizinkan. Silakan login terlebih dahulu.' },
        { status: 401 }
      )
    }

    const userId = session.user.id

    const body = await request.json()
    const { fullName, phone, institution, faculty, major } = body

    // Validate required fields
    if (!fullName || !fullName.trim()) {
      return NextResponse.json(
        { error: 'Nama lengkap harus diisi' },
        { status: 400 }
      )
    }

    // Update or create profile
    const profile = await prisma.userProfile.upsert({
      where: { userId },
      create: {
        userId,
        fullName: fullName.trim(),
        phone: phone?.trim() || null,
        institution: institution?.trim() || null,
        faculty: faculty?.trim() || null,
        major: major?.trim() || null,
      },
      update: {
        fullName: fullName.trim(),
        phone: phone?.trim() || null,
        institution: institution?.trim() || null,
        faculty: faculty?.trim() || null,
        major: major?.trim() || null,
      },
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId,
        action: 'PROFILE_UPDATED',
        resource: 'user_profile',
        resourceId: profile.id,
        details: {
          fullName,
          institution,
          faculty,
          major,
        },
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Profil berhasil diperbarui',
      data: profile,
    })
  } catch (error: any) {
    console.error('[PROFILE_UPDATE_ERROR]', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Gagal memperbarui profil',
        message: error.message,
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/profile/update
 * Get current user's profile
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Tidak diizinkan. Silakan login terlebih dahulu.' },
        { status: 401 }
      )
    }

    const userId = session.user.id

    const profile = await prisma.userProfile.findUnique({
      where: { userId },
    })

    if (!profile) {
      return NextResponse.json({
        success: true,
        data: null,
        message: 'Profil belum diatur',
      })
    }

    return NextResponse.json({
      success: true,
      data: profile,
    })
  } catch (error: any) {
    console.error('[PROFILE_GET_ERROR]', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Gagal mengambil profil',
        message: error.message,
      },
      { status: 500 }
    )
  }
}
