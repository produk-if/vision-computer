import { prisma } from '@/lib/prisma'

/**
 * Package Access Control
 * Enforces package limits and feature restrictions
 */

export interface PackageFeatures {
  code: string
  name: string
  maxDocuments: number
  maxFileSize: number
  maxPages?: number // Batas halaman untuk setiap jenis paket
  requiresApproval: boolean // Apakah perlu admin approval sebelum proses
  allowedDocumentTypes: string[] // Jenis dokumen yang diizinkan
}

// Package definitions dengan batasan spesifik
export const PACKAGE_DEFINITIONS: Record<string, PackageFeatures> = {
  PROPOSAL: {
    code: 'PROPOSAL',
    name: 'Paket Proposal',
    maxDocuments: 10,
    maxFileSize: 10, // MB
    maxPages: 50, // Maksimal 50 halaman untuk proposal
    requiresApproval: true, // Proposal perlu review admin dulu
    allowedDocumentTypes: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  },
  HASIL: {
    code: 'HASIL',
    name: 'Paket Hasil',
    maxDocuments: 20,
    maxFileSize: 15, // MB
    maxPages: 100, // Maksimal 100 halaman untuk hasil
    requiresApproval: true,
    allowedDocumentTypes: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  },
  TUTUP: {
    code: 'TUTUP',
    name: 'Paket Tutup',
    maxDocuments: 30,
    maxFileSize: 20, // MB
    maxPages: 150, // Maksimal 150 halaman untuk tutup
    requiresApproval: true,
    allowedDocumentTypes: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  },
}

/**
 * Get active subscription for user
 */
export async function getUserActiveSubscription(userId: string) {
  const subscription = await prisma.subscription.findFirst({
    where: {
      userId,
      status: 'ACTIVE',
      isActive: true,
      endDate: {
        gte: new Date(), // Belum expired
      },
    },
    include: {
      package: true,
    },
    orderBy: {
      endDate: 'desc', // Ambil yang paling lama
    },
  })

  return subscription
}

/**
 * Check if user has access to a specific package feature
 */
export async function checkPackageAccess(
  userId: string,
  requiredPackageCode: string
): Promise<{
  allowed: boolean
  reason?: string
  subscription?: any
  packageFeatures?: PackageFeatures
}> {
  // Get user's active subscription
  const subscription = await getUserActiveSubscription(userId)

  if (!subscription) {
    return {
      allowed: false,
      reason: 'Anda tidak memiliki paket aktif. Silakan berlangganan terlebih dahulu.',
    }
  }

  // Check if subscription package matches required package
  if (subscription.package.code !== requiredPackageCode) {
    return {
      allowed: false,
      reason: `Fitur ini memerlukan ${PACKAGE_DEFINITIONS[requiredPackageCode]?.name || requiredPackageCode}. Anda saat ini menggunakan ${subscription.package.name}.`,
      subscription,
    }
  }

  // Check document usage limit
  const packageFeatures = PACKAGE_DEFINITIONS[subscription.package.code]
  if (packageFeatures && packageFeatures.maxDocuments > 0) {
    if (subscription.documentsUsed >= packageFeatures.maxDocuments) {
      return {
        allowed: false,
        reason: `Anda telah mencapai batas maksimal ${packageFeatures.maxDocuments} dokumen untuk ${subscription.package.name}.`,
        subscription,
        packageFeatures,
      }
    }
  }

  return {
    allowed: true,
    subscription,
    packageFeatures,
  }
}

/**
 * Validate document against package limits
 */
export async function validateDocumentAgainstPackage(
  userId: string,
  fileSize: number, // in bytes
  pageCount?: number
): Promise<{
  valid: boolean
  reason?: string
  packageFeatures?: PackageFeatures
  requiresApproval?: boolean
}> {
  const subscription = await getUserActiveSubscription(userId)

  if (!subscription) {
    return {
      valid: false,
      reason: 'Anda tidak memiliki paket aktif.',
    }
  }

  const packageFeatures = PACKAGE_DEFINITIONS[subscription.package.code]
  if (!packageFeatures) {
    return {
      valid: false,
      reason: 'Paket tidak valid.',
    }
  }

  // Check file size limit
  const fileSizeMB = fileSize / (1024 * 1024)
  if (fileSizeMB > packageFeatures.maxFileSize) {
    return {
      valid: false,
      reason: `Ukuran file melebihi batas ${packageFeatures.maxFileSize} MB untuk ${packageFeatures.name}.`,
      packageFeatures,
    }
  }

  // Check page count limit (if provided)
  if (pageCount && packageFeatures.maxPages && pageCount > packageFeatures.maxPages) {
    return {
      valid: false,
      reason: `Jumlah halaman (${pageCount}) melebihi batas ${packageFeatures.maxPages} halaman untuk ${packageFeatures.name}.`,
      packageFeatures,
    }
  }

  return {
    valid: true,
    packageFeatures,
    requiresApproval: packageFeatures.requiresApproval,
  }
}

/**
 * Increment document usage counter
 */
export async function incrementDocumentUsage(subscriptionId: string) {
  await prisma.subscription.update({
    where: { id: subscriptionId },
    data: {
      documentsUsed: {
        increment: 1,
      },
    },
  })
}

/**
 * Check if document requires admin approval before processing
 */
export function requiresAdminApproval(packageCode: string): boolean {
  const packageFeatures = PACKAGE_DEFINITIONS[packageCode]
  return packageFeatures?.requiresApproval || false
}

/**
 * Get package features by code
 */
export function getPackageFeatures(packageCode: string): PackageFeatures | null {
  return PACKAGE_DEFINITIONS[packageCode] || null
}
