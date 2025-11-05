'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import {
  Settings,
  FileCheck,
  Shield,
  Bell,
  Database,
  Save,
  RefreshCw,
  CheckCircle2,
  XCircle,
} from 'lucide-react'

interface SystemSettings {
  autoApproveDocuments: boolean
  autoApproveMaxFileSize: number // in MB
  requirePaymentVerification: boolean
  enableEmailNotifications: boolean
  maintenanceMode: boolean
}

export default function AdminSettingsPage() {
  const { toast } = useToast()
  const [settings, setSettings] = useState<SystemSettings>({
    autoApproveDocuments: false,
    autoApproveMaxFileSize: 10,
    requirePaymentVerification: true,
    enableEmailNotifications: false,
    maintenanceMode: false,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/settings')

      if (!response.ok) {
        throw new Error('Failed to load settings')
      }

      const data = await response.json()

      // Map API response to local state
      setSettings({
        autoApproveDocuments: data.autoApproveDocuments || false,
        autoApproveMaxFileSize: data.autoApproveMaxFileSize || 10,
        requirePaymentVerification: data.requirePaymentVerification !== false,
        enableEmailNotifications: data.enableEmailNotifications || false,
        maintenanceMode: data.maintenanceMode || false,
      })
    } catch (error) {
      console.error('Error loading settings:', error)
      toast({
        title: 'Error',
        description: 'Gagal memuat pengaturan sistem',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)

      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      })

      if (!response.ok) {
        throw new Error('Failed to save settings')
      }

      toast({
        title: 'Berhasil!',
        description: 'Pengaturan sistem berhasil disimpan',
      })
    } catch (error) {
      console.error('Error saving settings:', error)
      toast({
        title: 'Error',
        description: 'Gagal menyimpan pengaturan sistem',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 animate-spin text-brand-primary mx-auto mb-4" />
          <p className="text-gray-600">Memuat pengaturan sistem...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-brand-primary to-brand-sage rounded-xl flex items-center justify-center shadow-lg">
              <Settings className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-brand-navy-dark to-brand-primary bg-clip-text text-transparent">
                Pengaturan Sistem
              </h1>
              <p className="text-gray-600 mt-1">Kelola konfigurasi dan preferensi sistem</p>
            </div>
          </div>
        </div>

        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-brand-primary hover:bg-brand-sage text-white px-6"
        >
          {saving ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Menyimpan...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Simpan Perubahan
            </>
          )}
        </Button>
      </div>

      {/* Document Approval Settings */}
      <Card className="border-l-4 border-l-brand-primary">
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileCheck className="h-5 w-5 text-brand-primary" />
            </div>
            <div>
              <CardTitle>Persetujuan Dokumen</CardTitle>
              <CardDescription>
                Konfigurasi sistem persetujuan otomatis untuk dokumen yang diunggah
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex-1 space-y-1">
              <Label htmlFor="auto-approve" className="text-base font-semibold text-gray-900">
                Auto-Approve Dokumen
              </Label>
              <p className="text-sm text-gray-600">
                Otomatis menyetujui dokumen yang memenuhi kriteria validasi (format file, ukuran, dll)
              </p>
              <div className="flex items-center space-x-2 mt-2">
                {settings.autoApproveDocuments ? (
                  <div className="flex items-center space-x-2 text-green-600">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="text-sm font-medium">Aktif - Dokumen akan disetujui otomatis</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 text-amber-600">
                    <XCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">Nonaktif - Perlu persetujuan manual admin</span>
                  </div>
                )}
              </div>
            </div>
            <Switch
              id="auto-approve"
              checked={settings.autoApproveDocuments}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, autoApproveDocuments: checked })
              }
              className="data-[state=checked]:bg-brand-primary"
            />
          </div>

          <div className="space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <Label htmlFor="max-file-size" className="text-sm font-semibold text-gray-900">
              Ukuran File Maksimal (MB)
            </Label>
            <p className="text-xs text-gray-600">
              Dokumen dengan ukuran lebih dari nilai ini akan direject otomatis
            </p>
            <div className="flex items-center space-x-3">
              <Input
                id="max-file-size"
                type="number"
                min="1"
                max="100"
                value={settings.autoApproveMaxFileSize}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    autoApproveMaxFileSize: parseInt(e.target.value) || 10
                  })
                }
                className="w-32"
              />
              <span className="text-sm text-gray-600 font-medium">MB</span>
            </div>
            <p className="text-xs text-gray-500 italic">
              Rekomendasi: 5-15 MB untuk performa optimal
            </p>
          </div>

          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <Shield className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-amber-900">Kriteria Auto-Approve:</p>
                <ul className="text-xs text-amber-800 space-y-1 ml-4 list-disc">
                  <li>Format file: DOCX, DOC, PDF</li>
                  <li>Ukuran file tidak melebihi batas maksimal</li>
                  <li>File tidak corrupt atau rusak</li>
                  <li>User memiliki paket aktif yang valid</li>
                  <li>Tidak ada riwayat pelanggaran</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment & Verification Settings */}
      <Card className="border-l-4 border-l-brand-teal">
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
              <Shield className="h-5 w-5 text-brand-teal" />
            </div>
            <div>
              <CardTitle>Pembayaran & Verifikasi</CardTitle>
              <CardDescription>
                Pengaturan untuk proses verifikasi pembayaran
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex-1 space-y-1">
              <Label htmlFor="payment-verification" className="text-base font-semibold text-gray-900">
                Verifikasi Pembayaran Wajib
              </Label>
              <p className="text-sm text-gray-600">
                User harus verifikasi pembayaran sebelum bisa menggunakan fitur
              </p>
            </div>
            <Switch
              id="payment-verification"
              checked={settings.requirePaymentVerification}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, requirePaymentVerification: checked })
              }
              className="data-[state=checked]:bg-brand-teal"
            />
          </div>
        </CardContent>
      </Card>

      {/* Notifications Settings */}
      <Card className="border-l-4 border-l-brand-purple">
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Bell className="h-5 w-5 text-brand-purple" />
            </div>
            <div>
              <CardTitle>Notifikasi</CardTitle>
              <CardDescription>
                Kelola pengiriman notifikasi ke pengguna
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex-1 space-y-1">
              <Label htmlFor="email-notifications" className="text-base font-semibold text-gray-900">
                Notifikasi Email
              </Label>
              <p className="text-sm text-gray-600">
                Kirim email untuk event penting (approval, reject, dll)
              </p>
            </div>
            <Switch
              id="email-notifications"
              checked={settings.enableEmailNotifications}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, enableEmailNotifications: checked })
              }
              className="data-[state=checked]:bg-brand-purple"
            />
          </div>
        </CardContent>
      </Card>

      {/* System Settings */}
      <Card className="border-l-4 border-l-red-500">
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <Database className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <CardTitle>Sistem</CardTitle>
              <CardDescription>
                Pengaturan sistem dan maintenance
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex-1 space-y-1">
              <Label htmlFor="maintenance" className="text-base font-semibold text-gray-900">
                Mode Maintenance
              </Label>
              <p className="text-sm text-gray-600">
                Nonaktifkan akses user untuk maintenance sistem
              </p>
            </div>
            <Switch
              id="maintenance"
              checked={settings.maintenanceMode}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, maintenanceMode: checked })
              }
              className="data-[state=checked]:bg-red-500"
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button Bottom */}
      <div className="flex justify-end pt-4 border-t">
        <Button
          onClick={handleSave}
          disabled={saving}
          size="lg"
          className="bg-brand-primary hover:bg-brand-sage text-white px-8"
        >
          {saving ? (
            <>
              <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
              Menyimpan...
            </>
          ) : (
            <>
              <Save className="mr-2 h-5 w-5" />
              Simpan Semua Perubahan
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
