'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Package, Edit, Save, X, Plus, Trash2, DollarSign, Calendar, CheckCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Package {
  id: string
  code: string
  name: string
  price: number
  validityDays: number
  features: string[]
  isActive: boolean
  createdAt: string
  _count: {
    subscriptions: number
  }
}

export default function AdminPackagesPage() {
  const { toast } = useToast()
  const [packages, setPackages] = useState<Package[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({
    name: '',
    price: 0,
    validityDays: 0,
    features: [] as string[],
    isActive: true,
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchPackages()
  }, [])

  const fetchPackages = async () => {
    try {
      const response = await fetch('/api/admin/packages')
      const data = await response.json()
      if (data.success) {
        setPackages(data.data.packages)
      }
    } catch (error) {
      console.error('Failed to fetch packages:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (pkg: Package) => {
    setEditingId(pkg.id)
    setEditForm({
      name: pkg.name,
      price: pkg.price,
      validityDays: pkg.validityDays,
      features: pkg.features,
      isActive: pkg.isActive,
    })
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditForm({
      name: '',
      price: 0,
      validityDays: 0,
      features: [],
      isActive: true,
    })
  }

  const handleSave = async (packageId: string) => {
    setSaving(true)
    try {
      // Filter out empty features
      const cleanedFeatures = editForm.features
        .map(f => f.trim())
        .filter(f => f.length > 0)

      const response = await fetch(`/api/admin/packages/${packageId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...editForm,
          features: cleanedFeatures,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: '✅ Berhasil',
          description: 'Paket berhasil diperbarui!',
        })
        setEditingId(null)
        fetchPackages()
      } else {
        toast({
          variant: 'destructive',
          title: '❌ Gagal',
          description: data.error || 'Gagal memperbarui paket',
        })
      }
    } catch (error) {
      console.error('Error updating package:', error)
      toast({
        variant: 'destructive',
        title: '❌ Error',
        description: 'Terjadi kesalahan saat memperbarui paket',
      })
    } finally {
      setSaving(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat paket...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Manajemen Paket & Harga</h2>
        <p className="text-gray-600">Kelola paket langganan dan pengaturan harga</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="border shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Paket</p>
                <p className="text-2xl font-bold text-gray-900">{packages.length}</p>
              </div>
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Paket Aktif</p>
                <p className="text-2xl font-bold text-green-600">
                  {packages.filter(p => p.isActive).length}
                </p>
              </div>
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Langganan</p>
                <p className="text-2xl font-bold text-purple-600">
                  {packages.reduce((sum, p) => sum + p._count.subscriptions, 0)}
                </p>
              </div>
              <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Packages List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {packages.map((pkg) => {
          const isEditing = editingId === pkg.id

          return (
            <Card key={pkg.id} className={`border shadow-sm ${isEditing ? 'ring-2 ring-blue-500' : ''}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    {isEditing ? (
                      <div className="space-y-2">
                        <Label htmlFor="name">Nama Paket</Label>
                        <Input
                          id="name"
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          className="font-semibold"
                        />
                      </div>
                    ) : (
                      <CardTitle className="text-xl">{pkg.name}</CardTitle>
                    )}
                    <div className="flex items-center space-x-2 mt-2">
                      <span className="text-sm text-gray-500 font-mono">{pkg.code}</span>
                      {pkg.isActive ? (
                        <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded text-xs font-medium">
                          Aktif
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-800 rounded text-xs font-medium">
                          Nonaktif
                        </span>
                      )}
                    </div>
                  </div>

                  {!isEditing && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(pkg)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Price */}
                <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                  <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    {isEditing ? (
                      <div>
                        <Label htmlFor="price" className="text-xs text-gray-600">Harga</Label>
                        <Input
                          id="price"
                          type="number"
                          value={editForm.price}
                          onChange={(e) => setEditForm({ ...editForm, price: parseInt(e.target.value) })}
                          className="mt-1"
                        />
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs text-gray-600">Harga</p>
                        <p className="text-xl font-bold text-gray-900">{formatPrice(pkg.price)}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Validity */}
                <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                  <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    {isEditing ? (
                      <div>
                        <Label htmlFor="validityDays" className="text-xs text-gray-600">Masa Berlaku (Hari)</Label>
                        <Input
                          id="validityDays"
                          type="number"
                          value={editForm.validityDays}
                          onChange={(e) => setEditForm({ ...editForm, validityDays: parseInt(e.target.value) })}
                          className="mt-1"
                        />
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs text-gray-600">Masa Berlaku</p>
                        <p className="text-xl font-bold text-gray-900">{pkg.validityDays} Hari</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Status Toggle */}
                {isEditing && (
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Status Paket</p>
                      <p className="text-xs text-gray-500">Aktifkan atau nonaktifkan paket</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editForm.isActive}
                        onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                )}

                {/* Features */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-700">Fitur</p>
                    {isEditing && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditForm({
                            ...editForm,
                            features: [...editForm.features, '']
                          })
                        }}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Tambah Fitur
                      </Button>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="space-y-2">
                      {editForm.features.map((feature, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                          <Input
                            value={feature}
                            onChange={(e) => {
                              const newFeatures = [...editForm.features]
                              newFeatures[index] = e.target.value
                              setEditForm({ ...editForm, features: newFeatures })
                            }}
                            placeholder="Masukkan fitur..."
                            className="flex-1"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const newFeatures = editForm.features.filter((_, i) => i !== index)
                              setEditForm({ ...editForm, features: newFeatures })
                            }}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <ul className="space-y-1.5">
                      {pkg.features.map((feature, index) => (
                        <li key={index} className="flex items-start space-x-2 text-sm text-gray-600">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Stats */}
                <div className="pt-3 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Total Langganan</span>
                    <span className="font-semibold text-gray-900">{pkg._count.subscriptions}</span>
                  </div>
                </div>

                {/* Edit Actions */}
                {isEditing && (
                  <div className="flex items-center space-x-2 pt-4 border-t">
                    <Button
                      onClick={() => handleSave(pkg.id)}
                      disabled={saving}
                      className="flex-1"
                    >
                      {saving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Menyimpan...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Simpan
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleCancelEdit}
                      disabled={saving}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Batal
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
