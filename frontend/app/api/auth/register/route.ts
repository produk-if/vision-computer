import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name, username, whatsapp } = body

    // Validate input
    if (!email || !password || !name || !username || !whatsapp) {
      return NextResponse.json(
        { error: 'Email, password, name, username, and WhatsApp are required' },
        { status: 400 }
      )
    }

    // Validate username
    if (username.length < 3) {
      return NextResponse.json(
        { error: 'Username must be at least 3 characters' },
        { status: 400 }
      )
    }

    // Validate whatsapp
    if (whatsapp.length < 10) {
      return NextResponse.json(
        { error: 'WhatsApp number must be at least 10 digits' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate password strength
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingEmail = await prisma.user.findUnique({
      where: { email },
    })

    if (existingEmail) {
      return NextResponse.json(
        { error: 'Email sudah terdaftar' },
        { status: 400 }
      )
    }

    // Check if username already exists
    const existingUsername = await prisma.user.findFirst({
      where: { username: username },
    })

    if (existingUsername) {
      return NextResponse.json(
        { error: 'Username sudah digunakan' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user with profile
    const user = await prisma.user.create({
      data: {
        email,
        username: username, // Username for login
        name: name, // Full name
        password: hashedPassword,
        role: 'USER',
        isActive: true, // User aktif secara default saat register
        profile: {
          create: {
            fullName: name, // Store full name in profile
            phone: whatsapp,
          },
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        profile: {
          select: {
            fullName: true,
            phone: true,
          },
        },
      },
    })

    // Create default user settings
    await prisma.userSettings.create({
      data: {
        userId: user.id,
      },
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'USER_REGISTERED',
        resource: 'user',
        resourceId: user.id,
        details: {
          email: user.email,
          username: user.name,
          fullName: name,
          whatsapp: whatsapp,
        },
      },
    })

    return NextResponse.json({
      success: true,
      message: 'User registered successfully',
      data: user,
    })
  } catch (error: any) {
    console.error('[REGISTER_ERROR]', error)
    return NextResponse.json(
      { error: 'Failed to register user', details: error.message },
      { status: 500 }
    )
  }
}
