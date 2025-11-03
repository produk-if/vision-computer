'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Monitor, Smartphone, Tablet, Trash2, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'

interface Session {
  id: string
  browser: string
  os: string
  ipAddress: string
  lastActivity: string
  createdAt: string
  isCurrent: boolean
}

export function SessionManager() {
  const { toast } = useToast()
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [terminatingAll, setTerminatingAll] = useState(false)
  const [terminatingId, setTerminatingId] = useState<string | null>(null)
  const [showTerminateDialog, setShowTerminateDialog] = useState(false)
  const [sessionToTerminate, setSessionToTerminate] = useState<string | null>(null)

  const loadSessions = async () => {
    try {
      const response = await fetch('/api/sessions')
      const data = await response.json()

      if (data.success) {
        setSessions(data.sessions)
      }
    } catch (error) {
      console.error('Error loading sessions:', error)
      toast({
        variant: 'destructive',
        title: 'Gagal',
        description: 'Gagal memuat daftar sesi',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSessions()
  }, [])

  const handleTerminateSession = async (sessionId: string) => {
    setTerminatingId(sessionId)
    try {
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: 'Berhasil',
          description: 'Sesi berhasil dihentikan',
        })
        await loadSessions()
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Error terminating session:', error)
      toast({
        variant: 'destructive',
        title: 'Gagal',
        description: 'Gagal menghentikan sesi',
      })
    } finally {
      setTerminatingId(null)
      setShowTerminateDialog(false)
      setSessionToTerminate(null)
    }
  }

  const handleTerminateAll = async () => {
    setTerminatingAll(true)
    try {
      const response = await fetch('/api/sessions', {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: 'Berhasil',
          description: 'Semua sesi lain berhasil dihentikan',
        })
        await loadSessions()
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Error terminating sessions:', error)
      toast({
        variant: 'destructive',
        title: 'Gagal',
        description: 'Gagal menghentikan sesi',
      })
    } finally {
      setTerminatingAll(false)
    }
  }

  const getDeviceIcon = (os: string, browser: string) => {
    const osLower = os.toLowerCase()
    const browserLower = browser.toLowerCase()

    if (osLower.includes('android') || osLower.includes('ios')) {
      return <Smartphone className="h-5 w-5 text-gray-500" />
    } else if (osLower.includes('ipad') || browserLower.includes('tablet')) {
      return <Tablet className="h-5 w-5 text-gray-500" />
    }
    return <Monitor className="h-5 w-5 text-gray-500" />
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Baru saja'
    if (minutes < 60) return `${minutes} menit yang lalu`
    if (hours < 24) return `${hours} jam yang lalu`
    if (days < 7) return `${days} hari yang lalu`
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const otherSessions = sessions.filter(s => !s.isCurrent)

  return (
    <>
      <Card className="shadow-sm border border-gray-200 rounded-xl">
        <CardHeader className="pb-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold text-gray-900">Kelola Sesi Login</CardTitle>
              <p className="text-xs text-gray-500 mt-0.5">Pantau dan kelola perangkat yang terhubung ke akun Anda</p>
            </div>
            {otherSessions.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleTerminateAll}
                disabled={terminatingAll}
                className="h-8 text-xs"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                {terminatingAll ? 'Menghentikan...' : 'Hentikan Semua'}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-4 pb-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <svg className="animate-spin h-8 w-8 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">Tidak ada sesi aktif</div>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border ${session.isCurrent
                      ? 'bg-green-50 border-green-200'
                      : 'bg-white border-gray-200 hover:border-gray-300'
                    } transition-colors`}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {getDeviceIcon(session.os, session.browser)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-medium text-gray-900">
                        {session.browser} di {session.os}
                      </h3>
                      {session.isCurrent && (
                        <span className="inline-flex items-center text-xs bg-green-600 text-white px-2 py-0.5 rounded-full font-medium">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Sesi Ini
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 space-y-0.5">
                      <div>IP: {session.ipAddress}</div>
                      <div>Terakhir aktif: {formatDate(session.lastActivity)}</div>
                      <div>Login: {formatDate(session.createdAt)}</div>
                    </div>
                  </div>
                  {!session.isCurrent && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSessionToTerminate(session.id)
                        setShowTerminateDialog(true)
                      }}
                      disabled={terminatingId === session.id}
                      className="h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                      {terminatingId === session.id ? 'Menghentikan...' : 'Hentikan'}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Security Warning */}
          {otherSessions.length > 0 && (
            <div className="mt-4 flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs font-medium text-amber-900">Peringatan Keamanan</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  Ada {otherSessions.length} perangkat lain yang terhubung. Jika Anda tidak mengenali perangkat tersebut, segera hentikan akses dan ubah password Anda.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Terminate Confirmation Dialog */}
      <AlertDialog open={showTerminateDialog} onOpenChange={setShowTerminateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hentikan Sesi?</AlertDialogTitle>
            <AlertDialogDescription>
              Anda akan menghentikan sesi ini. Perangkat tersebut harus login ulang untuk mengakses akun Anda.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (sessionToTerminate) {
                  handleTerminateSession(sessionToTerminate)
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Hentikan Sesi
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
