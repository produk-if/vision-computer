/**
 * Format activity action codes to user-friendly Indonesian text
 * Used for displaying activity logs in admin dashboard and user interfaces
 */
export function formatActivityAction(action: string): string {
  const actionMap: Record<string, string> = {
    // Payment Actions
    'PAYMENT_PROOF_UPLOADED': 'Upload Bukti Pembayaran',
    'PAYMENT_VERIFIED': 'Pembayaran Terverifikasi',
    'PAYMENT_REJECTED': 'Pembayaran Ditolak',

    // Document Actions
    'DOCUMENT_UPLOADED': 'Upload Dokumen',
    'DOCUMENT_ANALYZED': 'Dokumen Dianalisis',
    'DOCUMENT_BYPASSED': 'Proses Bypass Dokumen',
    'DOCUMENT_APPROVED': 'Dokumen Disetujui',
    'DOCUMENT_REJECTED': 'Dokumen Ditolak',
    'DOCUMENT_DELETED': 'Dokumen Dihapus',

    // Bypass Actions
    'BYPASS_COMPLETED': 'Bypass Selesai',
    'BYPASS_FAILED': 'Bypass Gagal',
    'BYPASS_STARTED': 'Memulai Bypass',
    'BYPASS_QUEUED': 'Bypass Dalam Antrian',

    // User Actions
    'USER_REGISTERED': 'Registrasi Pengguna Baru',
    'USER_LOGIN': 'Login Pengguna',
    'USER_LOGOUT': 'Logout Pengguna',
    'USER_UPDATED': 'Data Pengguna Diperbarui',
    'USER_DELETED': 'Pengguna Dihapus',

    // Profile Actions
    'PROFILE_COMPLETED': 'Melengkapi Profil',
    'PROFILE_UPDATED': 'Perbarui Profil',

    // Subscription Actions
    'SUBSCRIPTION_CREATED': 'Langganan Dibuat',
    'SUBSCRIPTION_ACTIVATED': 'Langganan Diaktifkan',
    'SUBSCRIPTION_EXPIRED': 'Langganan Berakhir',
    'SUBSCRIPTION_CANCELLED': 'Langganan Dibatalkan',

    // Admin Actions
    'ADMIN_LOGIN': 'Login Admin',
    'ADMIN_ACTION': 'Tindakan Admin',
    'SETTINGS_UPDATED': 'Pengaturan Diperbarui',
  }

  // Return mapped value or format the action string
  return actionMap[action] || action
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (l) => l.toUpperCase())
}

/**
 * Get color classes for activity action badges
 */
export function getActivityActionColor(action: string): string {
  if (action.includes('COMPLETED') || action.includes('SUCCESS') || action.includes('VERIFIED') || action.includes('APPROVED')) {
    return 'bg-green-100 text-green-800 border-green-200'
  }
  if (action.includes('FAILED') || action.includes('REJECTED') || action.includes('DELETED') || action.includes('CANCELLED')) {
    return 'bg-red-100 text-red-800 border-red-200'
  }
  if (action.includes('PENDING') || action.includes('QUEUED') || action.includes('PROCESSING')) {
    return 'bg-yellow-100 text-yellow-800 border-yellow-200'
  }
  if (action.includes('UPLOADED') || action.includes('CREATED') || action.includes('REGISTERED')) {
    return 'bg-blue-100 text-blue-800 border-blue-200'
  }
  return 'bg-gray-100 text-gray-800 border-gray-200'
}

/**
 * Get icon emoji for activity action
 */
export function getActivityActionIcon(action: string): string {
  if (action.includes('PAYMENT')) return '💳'
  if (action.includes('DOCUMENT')) return '📄'
  if (action.includes('BYPASS')) return '🔄'
  if (action.includes('USER') || action.includes('PROFILE')) return '👤'
  if (action.includes('SUBSCRIPTION')) return '📦'
  if (action.includes('ADMIN') || action.includes('SETTINGS')) return '⚙️'
  return '📋'
}
