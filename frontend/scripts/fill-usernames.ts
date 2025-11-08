/**
 * Script to fill username field for existing users
 * This script generates username from email for users that don't have username yet
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔄 Starting to fill username for existing users...\n')

  // Get all users without username
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { username: null },
        { username: '' },
      ],
    },
    select: {
      id: true,
      email: true,
      name: true,
      username: true,
    },
  })

  console.log(`Found ${users.length} users without username\n`)

  for (const user of users) {
    // Generate username from email (part before @)
    const emailUsername = user.email.split('@')[0]

    // Clean username (remove special characters, keep only alphanumeric and underscore)
    let newUsername = emailUsername.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase()

    // Ensure username is at least 3 characters
    if (newUsername.length < 3) {
      newUsername = newUsername + user.id.slice(0, 3)
    }

    // Check if username already exists
    let finalUsername = newUsername
    let counter = 1
    while (true) {
      const existing = await prisma.user.findUnique({
        where: { username: finalUsername },
      })

      if (!existing) {
        break
      }

      // If exists, add counter
      finalUsername = `${newUsername}${counter}`
      counter++
    }

    // Update user
    await prisma.user.update({
      where: { id: user.id },
      data: { username: finalUsername },
    })

    console.log(`✅ Updated user ${user.email} -> username: ${finalUsername}`)
  }

  console.log(`\n✅ Successfully updated ${users.length} users`)
}

main()
  .catch((error) => {
    console.error('❌ Error:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
