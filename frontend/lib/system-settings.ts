import { prisma } from '@/lib/prisma'

/**
 * System Settings Management
 * Centralized configuration for admin-controlled features
 */

export const SETTING_KEYS = {
  AUTO_APPROVE_DOCUMENTS: 'auto_approve_documents',
  MAX_UPLOAD_SIZE: 'max_upload_size',
  MAINTENANCE_MODE: 'maintenance_mode',
} as const

/**
 * Get system setting by key
 */
export async function getSystemSetting(key: string, defaultValue?: string): Promise<string | null> {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key },
    })

    return setting?.value || defaultValue || null
  } catch (error) {
    console.error('[SETTINGS] Error fetching setting:', key, error)
    return defaultValue || null
  }
}

/**
 * Get boolean setting
 */
export async function getBooleanSetting(key: string, defaultValue: boolean = false): Promise<boolean> {
  const value = await getSystemSetting(key, defaultValue.toString())
  return value === 'true' || value === '1'
}

/**
 * Update system setting
 */
export async function updateSystemSetting(
  key: string,
  value: string,
  updatedBy?: string,
  description?: string
): Promise<void> {
  await prisma.systemSetting.upsert({
    where: { key },
    update: {
      value,
      updatedBy,
      updatedAt: new Date(),
    },
    create: {
      key,
      value,
      description,
      updatedBy,
    },
  })
}

/**
 * Check if auto-approval is enabled
 */
export async function isAutoApprovalEnabled(): Promise<boolean> {
  return await getBooleanSetting(SETTING_KEYS.AUTO_APPROVE_DOCUMENTS, false)
}

/**
 * Toggle auto-approval
 */
export async function toggleAutoApproval(enabled: boolean, adminId: string): Promise<void> {
  await updateSystemSetting(
    SETTING_KEYS.AUTO_APPROVE_DOCUMENTS,
    enabled.toString(),
    adminId,
    'Otomatis menyetujui dokumen tanpa review manual admin'
  )

  console.log(`[SETTINGS] Auto-approval ${enabled ? 'ENABLED' : 'DISABLED'} by admin ${adminId}`)
}

/**
 * Get all system settings
 */
export async function getAllSettings() {
  return await prisma.systemSetting.findMany({
    orderBy: { key: 'asc' },
  })
}
