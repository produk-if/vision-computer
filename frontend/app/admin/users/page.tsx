'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Users, Search, Mail, Phone, Building, Calendar, FileText, CheckCircle, XCircle, CreditCard, Ban, Trash2, Power } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface User {
  id: string
  name: string
  username: string | null
  email: string
  role: string
  emailVerified: Date | null
  isActive: boolean
  createdAt: string
  profile: {
    fullName: string
    phone: string
    institution: string | null
    faculty: string | null
    major: string | null
  } | null
  subscriptions: {
    id: string
    status: string
    startDate: string
    endDate: string
    package: {
      code: string
      name: string
      validityDays: number
    }
  }[]
  _count: {
    documents: number
    bypasses: number
  }
}

export default function AdminUsersPage() {
  const { toast } = useToast()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users')
      const data = await response.json()
      if (data.success) {
        setUsers(data.data.users)
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetail = (user: User) => {
    setSelectedUser(user)
    setShowDetailDialog(true)
  }

  const handleCloseDialog = (open: boolean) => {
    setShowDetailDialog(open)
    if (!open) {
      setSelectedUser(null)
    }
  }

  const handleToggleActive = async (user: User) => {
    if (user.role === 'ADMIN') {
      toast({
        variant: 'destructive',
        title: '❌ Tidak Diizinkan',
        description: 'Tidak dapat menonaktifkan akun admin',
      })
      return
    }

    setActionLoading(true)
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isActive: !user.isActive,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: '✅ Berhasil',
          description: `User ${user.isActive ? 'dinonaktifkan' : 'diaktifkan'}`,
        })
        fetchUsers()
      } else {
        toast({
          variant: 'destructive',
          title: '❌ Gagal',
          description: data.error || 'Gagal mengubah status user',
        })
      }
    } catch (error) {
      console.error('Error toggling user status:', error)
      toast({
        variant: 'destructive',
        title: '❌ Error',
        description: 'Terjadi kesalahan saat mengubah status user',
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteClick = (user: User) => {
    if (user.role === 'ADMIN') {
      toast({
        variant: 'destructive',
        title: '❌ Tidak Diizinkan',
        description: 'Tidak dapat menghapus akun admin',
      })
      return
    }
    setUserToDelete(user)
    setShowDeleteDialog(true)
  }

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return

    setActionLoading(true)
    try {
      const response = await fetch(`/api/admin/users/${userToDelete.id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: '✅ Berhasil',
          description: 'User berhasil dihapus',
        })
        setShowDeleteDialog(false)
        setUserToDelete(null)
        fetchUsers()
      } else {
        toast({
          variant: 'destructive',
          title: '❌ Gagal',
          description: data.error || 'Gagal menghapus user',
        })
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      toast({
        variant: 'destructive',
        title: '❌ Error',
        description: 'Terjadi kesalahan saat menghapus user',
      })
    } finally {
      setActionLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  const getSubscriptionStatus = (subscriptions: User['subscriptions']) => {
    const subscription = subscriptions?.[0] // Get latest subscription
    if (!subscription) {
      return { label: 'Tidak Aktif', color: 'bg-gray-100 text-gray-800' }
    }

    const now = new Date()
    const endDate = new Date(subscription.endDate)

    if (subscription.status === 'ACTIVE' && endDate > now) {
      return { label: 'Aktif', color: 'bg-green-100 text-green-800' }
    } else if (subscription.status === 'EXPIRED' || endDate < now) {
      return { label: 'Expired', color: 'bg-red-100 text-red-800' }
    } else if (subscription.status === 'PENDING') {
      return { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' }
    }

    return { label: subscription.status, color: 'bg-gray-100 text-gray-800' }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.profile?.fullName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.profile?.institution || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.profile?.faculty || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.profile?.major || '').toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && user.isActive) ||
      (statusFilter === 'INACTIVE' && !user.isActive)

    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat pengguna...</p>
        </div>
      </div>
    )
  }

  const activeUsers = users.filter(u => u.subscriptions?.[0]?.status === 'ACTIVE').length
  const pendingUsers = users.filter(u => u.subscriptions?.[0]?.status === 'PENDING').length

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border border-gray-200 shadow-sm hover:shadow-md hover:border-brand-primary/50 transition-all">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-brand-navy mb-1">Total Pengguna</p>
                  <p className="text-3xl font-bold text-brand-navy-dark">{users.length}</p>
                </div>
                <div className="w-12 h-12 bg-brand-secondary rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-brand-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 shadow-sm hover:shadow-md hover:border-green-500/50 transition-all">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-brand-navy mb-1">Akun Aktif</p>
                  <p className="text-3xl font-bold text-brand-navy-dark">{users.filter(u => u.isActive).length}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 shadow-sm hover:shadow-md hover:border-red-500/50 transition-all">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-brand-navy mb-1">Akun Non-Aktif</p>
                  <p className="text-3xl font-bold text-brand-navy-dark">{users.filter(u => !u.isActive).length}</p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <Ban className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-4 mb-6 border border-gray-200 shadow-sm">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="🔍 Cari nama, email, institusi, fakultas, atau program studi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-blue-500 text-sm"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center space-x-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border-2 border-gray-200 rounded-xl px-4 py-2.5 pr-10 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white h-12 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2210%22%20height%3D%2210%22%20viewBox%3D%220%200%2012%2012%22%3E%3Cpath%20fill%3D%22%23666%22%20d%3D%22M10.293%203.293L6%207.586%201.707%203.293A1%201%200%2000.293%204.707l5%205a1%201%200%20001.414%200l5-5a1%201%200%2010-1.414-1.414z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:14px] bg-[center_right_0.75rem] bg-no-repeat"
              >
                <option value="ALL">Semua Status</option>
                <option value="ACTIVE">Aktif</option>
                <option value="INACTIVE">Non-Aktif</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Users List */}
        {filteredUsers.length === 0 ? (
          <Card className="p-12 text-center border border-gray-200 shadow-sm">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="h-10 w-10 text-gray-400" />
            </div>
            <p className="text-lg font-semibold text-gray-700 mb-1">
              {searchQuery || statusFilter !== 'ALL'
                ? 'Tidak ada pengguna yang sesuai dengan filter'
                : 'Belum ada pengguna'}
            </p>
            <p className="text-sm text-gray-500">
              {searchQuery || statusFilter !== 'ALL'
                ? 'Coba ubah filter pencarian Anda'
                : 'Pengguna baru akan muncul di sini'}
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredUsers.map((user) => {
              const subscriptionStatus = getSubscriptionStatus(user.subscriptions)

              return (
                <Card key={user.id} className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        {/* Avatar */}
                        <div className="w-12 h-12 bg-brand-secondary rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-brand-primary font-bold text-lg">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>

                        {/* User Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-semibold text-brand-navy-dark">{user.name}</h3>
                            {user.role === 'ADMIN' && (
                              <span className="px-2 py-0.5 rounded text-xs font-medium bg-brand-teal/20 text-brand-teal">
                                Admin
                              </span>
                            )}
                            {!user.isActive && (
                              <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                Non-Aktif
                              </span>
                            )}
                            <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-md ${subscriptionStatus.color}`}>
                              {subscriptionStatus.label}
                            </span>
                          </div>

                          {user.username && (
                            <p className="text-sm text-gray-600 mb-2">
                              <span className="font-medium">@{user.username}</span>
                            </p>
                          )}

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
                            <div className="flex items-center space-x-2">
                              <Mail className="h-4 w-4 text-gray-400" />
                              <span>{user.email}</span>
                            </div>

                            {user.profile?.phone && (
                              <div className="flex items-center space-x-2">
                                <Phone className="h-4 w-4 text-gray-400" />
                                <span>{user.profile.phone}</span>
                              </div>
                            )}

                            {user.profile?.institution && (
                              <div className="flex items-center space-x-2">
                                <Building className="h-4 w-4 text-gray-400" />
                                <span className="truncate">{user.profile.institution}</span>
                              </div>
                            )}

                            {user.profile?.faculty && (
                              <div className="flex items-center space-x-2">
                                <Building className="h-4 w-4 text-gray-400" />
                                <span className="truncate">{user.profile.faculty}</span>
                              </div>
                            )}

                            {user.profile?.major && (
                              <div className="flex items-center space-x-2 col-span-2">
                                <FileText className="h-4 w-4 text-gray-400" />
                                <span className="truncate">{user.profile.major}</span>
                              </div>
                            )}

                            <div className="flex items-center space-x-2">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              <span>Bergabung: {formatDate(user.createdAt)}</span>
                            </div>
                          </div>

                          {/* Subscription Info */}
                          {user.subscriptions?.[0] && (
                            <div className="p-3 bg-gray-50 rounded-lg border">
                              <div className="flex items-center justify-between text-sm">
                                <div>
                                  <p className="font-medium text-gray-900">{user.subscriptions[0].package.name}</p>
                                  <p className="text-xs text-gray-600 mt-1">
                                    {formatDate(user.subscriptions[0].startDate)} - {formatDate(user.subscriptions[0].endDate)}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-xs text-gray-600">Aktivitas</p>
                                  <p className="font-medium text-gray-900">
                                    {user._count.documents} dokumen, {user._count.bypasses} bypass
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* No Subscription */}
                          {!user.subscriptions?.[0] && (
                            <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                              <p className="text-sm text-yellow-800">
                                Belum memiliki langganan aktif
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center space-x-2 ml-4">
                        <Button
                          onClick={() => handleViewDetail(user)}
                          variant="outline"
                          size="sm"
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Detail
                        </Button>

                        {user.role !== 'ADMIN' && (
                          <>
                            <Button
                              onClick={() => handleToggleActive(user)}
                              variant="outline"
                              size="sm"
                              disabled={actionLoading}
                              className={user.isActive ? 'text-orange-600 hover:text-orange-700 hover:bg-orange-50' : 'text-green-600 hover:text-green-700 hover:bg-green-50'}
                            >
                              {user.isActive ? (
                                <>
                                  <Ban className="h-4 w-4 mr-2" />
                                  Nonaktifkan
                                </>
                              ) : (
                                <>
                                  <Power className="h-4 w-4 mr-2" />
                                  Aktifkan
                                </>
                              )}
                            </Button>

                            <Button
                              onClick={() => handleDeleteClick(user)}
                              variant="outline"
                              size="sm"
                              disabled={actionLoading}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Detail Dialog */}
        <Dialog open={showDetailDialog} onOpenChange={handleCloseDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-gray-900">
                Detail Pengguna
              </DialogTitle>
            </DialogHeader>

            {selectedUser && (
              <div className="mt-4 space-y-6">
                {/* User Basic Info */}
                <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-2xl">
                      {selectedUser.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{selectedUser.name}</h3>
                    <p className="text-sm text-gray-600">{selectedUser.profile?.fullName || '-'}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      {selectedUser.role === 'ADMIN' && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          Admin
                        </span>
                      )}
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getSubscriptionStatus(selectedUser.subscriptions).color}`}>
                        {getSubscriptionStatus(selectedUser.subscriptions).label}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900 flex items-center">
                    <Mail className="h-4 w-4 mr-2 text-blue-600" />
                    Informasi Kontak
                  </h4>
                  <div className="pl-6 space-y-2 text-sm">
                    {selectedUser.username && (
                      <div className="flex items-start">
                        <span className="text-gray-600 w-32">Username:</span>
                        <span className="text-gray-900 font-medium font-mono">@{selectedUser.username}</span>
                      </div>
                    )}
                    <div className="flex items-start">
                      <span className="text-gray-600 w-32">Email:</span>
                      <span className="text-gray-900 font-medium">{selectedUser.email}</span>
                    </div>
                    {selectedUser.profile?.phone && (
                      <div className="flex items-start">
                        <span className="text-gray-600 w-32">Telepon:</span>
                        <span className="text-gray-900 font-medium">{selectedUser.profile.phone}</span>
                      </div>
                    )}
                    {selectedUser.profile?.institution && (
                      <div className="flex items-start">
                        <span className="text-gray-600 w-32">Institusi:</span>
                        <span className="text-gray-900 font-medium">{selectedUser.profile.institution}</span>
                      </div>
                    )}
                    {selectedUser.profile?.faculty && (
                      <div className="flex items-start">
                        <span className="text-gray-600 w-32">Fakultas:</span>
                        <span className="text-gray-900 font-medium">{selectedUser.profile.faculty}</span>
                      </div>
                    )}
                    {selectedUser.profile?.major && (
                      <div className="flex items-start">
                        <span className="text-gray-600 w-32">Program Studi:</span>
                        <span className="text-gray-900 font-medium">{selectedUser.profile.major}</span>
                      </div>
                    )}
                    <div className="flex items-start">
                      <span className="text-gray-600 w-32">Bergabung:</span>
                      <span className="text-gray-900 font-medium">{formatDate(selectedUser.createdAt)}</span>
                    </div>
                    <div className="flex items-start">
                      <span className="text-gray-600 w-32">Email Verified:</span>
                      <span className="text-gray-900 font-medium">
                        {selectedUser.emailVerified ? (
                          <span className="text-green-600 flex items-center">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Terverifikasi
                          </span>
                        ) : (
                          <span className="text-red-600 flex items-center">
                            <XCircle className="h-4 w-4 mr-1" />
                            Belum Terverifikasi
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Subscription Info */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900 flex items-center">
                    <CreditCard className="h-4 w-4 mr-2 text-blue-600" />
                    Informasi Langganan
                  </h4>
                  {selectedUser.subscriptions?.[0] ? (
                    <div className="pl-6 p-4 bg-gray-50 rounded-lg border space-y-2 text-sm">
                      <div className="flex items-start">
                        <span className="text-gray-600 w-32">Paket:</span>
                        <span className="text-gray-900 font-medium">{selectedUser.subscriptions[0].package.name}</span>
                      </div>
                      <div className="flex items-start">
                        <span className="text-gray-600 w-32">Kode Paket:</span>
                        <span className="text-gray-900 font-medium">{selectedUser.subscriptions[0].package.code}</span>
                      </div>
                      <div className="flex items-start">
                        <span className="text-gray-600 w-32">Status:</span>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getSubscriptionStatus(selectedUser.subscriptions).color}`}>
                          {getSubscriptionStatus(selectedUser.subscriptions).label}
                        </span>
                      </div>
                      <div className="flex items-start">
                        <span className="text-gray-600 w-32">Periode:</span>
                        <span className="text-gray-900 font-medium">
                          {formatDate(selectedUser.subscriptions[0].startDate)} - {formatDate(selectedUser.subscriptions[0].endDate)}
                        </span>
                      </div>
                      <div className="flex items-start">
                        <span className="text-gray-600 w-32">Durasi:</span>
                        <span className="text-gray-900 font-medium">{selectedUser.subscriptions[0].package.validityDays} hari</span>
                      </div>
                    </div>
                  ) : (
                    <div className="pl-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                      <p className="text-sm text-yellow-800">Belum memiliki langganan aktif</p>
                    </div>
                  )}
                </div>

                {/* Activity Stats */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900 flex items-center">
                    <FileText className="h-4 w-4 mr-2 text-blue-600" />
                    Statistik Aktivitas
                  </h4>
                  <div className="pl-6 grid grid-cols-2 gap-4">
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-600 font-medium">Total Dokumen</p>
                      <p className="text-2xl font-bold text-blue-900">{selectedUser._count.documents}</p>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                      <p className="text-sm text-purple-600 font-medium">Total Bypass</p>
                      <p className="text-2xl font-bold text-purple-900">{selectedUser._count.bypasses}</p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => handleCloseDialog(false)}
                  >
                    Tutup
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Hapus User?</AlertDialogTitle>
              <AlertDialogDescription>
                Apakah Anda yakin ingin menghapus user <strong>{userToDelete?.name}</strong> ({userToDelete?.email})?
                <br /><br />
                Tindakan ini akan menghapus:
                <ul className="list-disc list-inside mt-2 text-sm">
                  <li>Data profil user</li>
                  <li>{userToDelete?._count.documents || 0} dokumen</li>
                  <li>{userToDelete?._count.bypasses || 0} bypass</li>
                  <li>Semua data terkait lainnya</li>
                </ul>
                <br />
                <span className="text-red-600 font-semibold">Tindakan ini tidak dapat dibatalkan!</span>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={actionLoading}>Batal</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                disabled={actionLoading}
                className="bg-red-600 hover:bg-red-700"
              >
                {actionLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Menghapus...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Hapus User
                  </>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
