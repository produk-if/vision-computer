'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import {
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Calendar,
  FileCheck,
  Download,
  Eye
} from 'lucide-react'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Document {
  id: string
  title: string
  originalFilename: string
  fileSize: number
  pageCount: number | null
  wordCount: number | null
  packageCode: string | null
  approvalStatus: string
  uploadedAt: string
  user: {
    id: string
    name: string
    email: string
  }
}

export default function ApprovalsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const { toast } = useToast()

  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING')
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [processing, setProcessing] = useState<string | null>(null)
  const [autoApprovalEnabled, setAutoApprovalEnabled] = useState(false)
  const [togglingAutoApproval, setTogglingAutoApproval] = useState(false)

  // Check admin access
  useEffect(() => {
    if (session && session.user.role !== 'ADMIN') {
      router.push('/dashboard')
    }
  }, [session, router])

  const loadDocuments = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/approvals?status=${filter}`)
      const data = await response.json()

      if (data.success) {
        setDocuments(data.documents)
      }
    } catch (error) {
      console.error('Error loading documents:', error)
      toast({
        variant: 'destructive',
        title: 'Gagal',
        description: 'Gagal memuat daftar dokumen',
      })
    } finally {
      setLoading(false)
    }
  }

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings')
      const data = await response.json()

      if (data.success) {
        setAutoApprovalEnabled(data.autoApprovalEnabled)
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    }
  }

  useEffect(() => {
    if (session?.user?.role === 'ADMIN') {
      loadDocuments()
      loadSettings()
    }
  }, [filter, session])

  const handleToggleAutoApproval = async () => {
    setTogglingAutoApproval(true)
    try {
      const response = await fetch('/api/admin/settings/auto-approval', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          enabled: !autoApprovalEnabled,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setAutoApprovalEnabled(data.enabled)
        toast({
          title: 'Berhasil',
          description: data.message,
        })
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Error toggling auto-approval:', error)
      toast({
        variant: 'destructive',
        title: 'Gagal',
        description: 'Gagal mengubah pengaturan',
      })
    } finally {
      setTogglingAutoApproval(false)
    }
  }

  const handleApprove = async (documentId: string) => {
    setProcessing(documentId)
    try {
      const response = await fetch(`/api/admin/approvals/${documentId}/approve`, {
        method: 'POST',
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: 'Berhasil',
          description: 'Dokumen berhasil disetujui',
        })
        await loadDocuments()
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Error approving document:', error)
      toast({
        variant: 'destructive',
        title: 'Gagal',
        description: 'Gagal menyetujui dokumen',
      })
    } finally {
      setProcessing(null)
    }
  }

  const handleReject = async () => {
    if (!selectedDoc || !rejectionReason.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Alasan penolakan harus diisi',
      })
      return
    }

    setProcessing(selectedDoc.id)
    try {
      const response = await fetch(`/api/admin/approvals/${selectedDoc.id}/reject`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: rejectionReason,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: 'Berhasil',
          description: 'Dokumen berhasil ditolak',
        })
        setShowRejectDialog(false)
        setRejectionReason('')
        setSelectedDoc(null)
        await loadDocuments()
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Error rejecting document:', error)
      toast({
        variant: 'destructive',
        title: 'Gagal',
        description: 'Gagal menolak dokumen',
      })
    } finally {
      setProcessing(null)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getPackageBadge = (code: string | null) => {
    const colors: Record<string, string> = {
      PROPOSAL: 'bg-blue-100 text-blue-700',
      HASIL: 'bg-green-100 text-green-700',
      TUTUP: 'bg-purple-100 text-purple-700',
    }
    return (
      <span className={`text-xs px-2 py-1 rounded font-medium ${colors[code || ''] || 'bg-gray-100 text-gray-700'}`}>
        {code || 'N/A'}
      </span>
    )
  }

  if (session?.user?.role !== 'ADMIN') {
    return null
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Approval Dokumen</h2>
            <p className="text-gray-500 text-sm">Review dan setujui dokumen sebelum diproses</p>
          </div>

          {/* Auto-Approval Toggle */}
          <Card className="shadow-sm border border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-gray-900">Auto-Approval</h3>
                  <p className="text-xs text-gray-500">Otomatis setujui dokumen tanpa review</p>
                </div>
                <Button
                  variant={autoApprovalEnabled ? 'default' : 'outline'}
                  size="sm"
                  onClick={handleToggleAutoApproval}
                  disabled={togglingAutoApproval}
                  className={`gap-2 ${autoApprovalEnabled ? 'bg-green-600 hover:bg-green-700' : ''}`}
                >
                  {togglingAutoApproval ? (
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : autoApprovalEnabled ? (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Aktif
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4" />
                      Nonaktif
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6 flex gap-2">
          <Button
            variant={filter === 'PENDING' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('PENDING')}
            className="gap-2"
          >
            <Clock className="h-4 w-4" />
            Menunggu
          </Button>
          <Button
            variant={filter === 'APPROVED' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('APPROVED')}
            className="gap-2"
          >
            <CheckCircle className="h-4 w-4" />
            Disetujui
          </Button>
          <Button
            variant={filter === 'REJECTED' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('REJECTED')}
            className="gap-2"
          >
            <XCircle className="h-4 w-4" />
            Ditolak
          </Button>
        </div>

        {/* Auto-Approval Status Banner */}
        {autoApprovalEnabled && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-green-900">Mode Auto-Approval Aktif</h3>
                <p className="text-xs text-green-700 mt-1">
                  Semua dokumen yang di-upload akan otomatis disetujui tanpa memerlukan review manual dari admin.
                  Sistem tetap akan memvalidasi batasan paket (ukuran file, jumlah halaman, quota dokumen).
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Documents List */}
        <Card>
          <CardContent className="pt-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <svg className="animate-spin h-8 w-8 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            ) : documents.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <FileCheck className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>Tidak ada dokumen {filter.toLowerCase()}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                  >
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FileText className="h-5 w-5 text-blue-600" />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="text-sm font-semibold text-gray-900 mb-1">{doc.title}</h3>
                          <p className="text-xs text-gray-500">{doc.originalFilename}</p>
                        </div>
                        {getPackageBadge(doc.packageCode)}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-gray-600 mb-3">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {doc.user.name}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(doc.uploadedAt)}
                        </div>
                        <div>Ukuran: {formatFileSize(doc.fileSize)}</div>
                        {doc.pageCount && <div>Halaman: {doc.pageCount}</div>}
                      </div>

                      {filter === 'PENDING' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleApprove(doc.id)}
                            disabled={processing === doc.id}
                            className="h-8 text-xs bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            {processing === doc.id ? 'Memproses...' : 'Setujui'}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              setSelectedDoc(doc)
                              setShowRejectDialog(true)
                            }}
                            disabled={processing === doc.id}
                            className="h-8 text-xs"
                          >
                            <XCircle className="h-3 w-3 mr-1" />
                            Tolak
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Reject Dialog */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tolak Dokumen</AlertDialogTitle>
            <AlertDialogDescription>
              Masukkan alasan penolakan dokumen ini
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="reason" className="text-sm font-medium">
              Alasan Penolakan
            </Label>
            <Input
              id="reason"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Contoh: Dokumen tidak sesuai format, halaman melebihi batas, dll"
              className="mt-2"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setRejectionReason('')
              setSelectedDoc(null)
            }}>
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              disabled={!rejectionReason.trim() || processing !== null}
              className="bg-red-600 hover:bg-red-700"
            >
              {processing ? 'Memproses...' : 'Tolak Dokumen'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
