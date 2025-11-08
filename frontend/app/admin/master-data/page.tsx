'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Building2, GraduationCap, BookOpen, Plus, Edit, Trash2, Check, X } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Institution {
  id: string
  name: string
  shortName: string | null
  type: string | null
  city: string | null
  province: string | null
  isActive: boolean
  _count?: {
    faculties: number
  }
}

interface Faculty {
  id: string
  name: string
  institutionId: string
  isActive: boolean
  institution?: {
    name: string
  }
  _count?: {
    majors: number
  }
}

interface Major {
  id: string
  name: string
  facultyId: string
  degree: string | null
  isActive: boolean
  faculty?: {
    name: string
    institution?: {
      name: string
    }
  }
}

export default function MasterDataPage() {
  const { toast } = useToast()

  const [institutions, setInstitutions] = useState<Institution[]>([])
  const [faculties, setFaculties] = useState<Faculty[]>([])
  const [majors, setMajors] = useState<Major[]>([])

  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  // Institution states
  const [showInstitutionDialog, setShowInstitutionDialog] = useState(false)
  const [editingInstitution, setEditingInstitution] = useState<Institution | null>(null)
  const [institutionForm, setInstitutionForm] = useState({
    name: '',
    shortName: '',
    type: '',
    city: '',
    province: '',
  })

  // Faculty states
  const [showFacultyDialog, setShowFacultyDialog] = useState(false)
  const [editingFaculty, setEditingFaculty] = useState<Faculty | null>(null)
  const [facultyForm, setFacultyForm] = useState({
    name: '',
    institutionId: '',
  })

  // Major states
  const [showMajorDialog, setShowMajorDialog] = useState(false)
  const [editingMajor, setEditingMajor] = useState<Major | null>(null)
  const [majorForm, setMajorForm] = useState({
    name: '',
    facultyId: '',
    degree: '',
  })

  // Delete confirmation
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'institution' | 'faculty' | 'major', id: string, name: string } | null>(null)

  useEffect(() => {
    fetchAllData()
  }, [])

  const fetchAllData = async () => {
    setLoading(true)
    try {
      const [instRes, facRes, majRes] = await Promise.all([
        fetch('/api/admin/master-data/institutions'),
        fetch('/api/admin/master-data/faculties'),
        fetch('/api/admin/master-data/majors'),
      ])

      const instData = await instRes.json()
      const facData = await facRes.json()
      const majData = await majRes.json()

      if (instData.success) setInstitutions(instData.data)
      if (facData.success) setFaculties(facData.data)
      if (majData.success) setMajors(majData.data)
    } catch (error) {
      console.error('Failed to fetch data:', error)
      toast({
        variant: 'destructive',
        title: '❌ Error',
        description: 'Gagal memuat data',
      })
    } finally {
      setLoading(false)
    }
  }

  // Institution handlers
  const handleAddInstitution = () => {
    setEditingInstitution(null)
    setInstitutionForm({ name: '', shortName: '', type: '', city: '', province: '' })
    setShowInstitutionDialog(true)
  }

  const handleEditInstitution = (inst: Institution) => {
    setEditingInstitution(inst)
    setInstitutionForm({
      name: inst.name,
      shortName: inst.shortName || '',
      type: inst.type || '',
      city: inst.city || '',
      province: inst.province || '',
    })
    setShowInstitutionDialog(true)
  }

  const handleSaveInstitution = async () => {
    if (!institutionForm.name.trim()) {
      toast({
        variant: 'destructive',
        title: '❌ Error',
        description: 'Nama institusi harus diisi',
      })
      return
    }

    setActionLoading(true)
    try {
      const url = editingInstitution
        ? `/api/admin/master-data/institutions/${editingInstitution.id}`
        : '/api/admin/master-data/institutions'

      const method = editingInstitution ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(institutionForm),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: '✅ Berhasil',
          description: editingInstitution ? 'Institusi berhasil diperbarui' : 'Institusi berhasil ditambahkan',
        })
        setShowInstitutionDialog(false)
        fetchAllData()
      } else {
        toast({
          variant: 'destructive',
          title: '❌ Gagal',
          description: data.error || 'Gagal menyimpan institusi',
        })
      }
    } catch (error) {
      console.error('Error saving institution:', error)
      toast({
        variant: 'destructive',
        title: '❌ Error',
        description: 'Terjadi kesalahan',
      })
    } finally {
      setActionLoading(false)
    }
  }

  // Faculty handlers
  const handleAddFaculty = () => {
    setEditingFaculty(null)
    setFacultyForm({ name: '', institutionId: '' })
    setShowFacultyDialog(true)
  }

  const handleEditFaculty = (fac: Faculty) => {
    setEditingFaculty(fac)
    setFacultyForm({
      name: fac.name,
      institutionId: fac.institutionId,
    })
    setShowFacultyDialog(true)
  }

  const handleSaveFaculty = async () => {
    if (!facultyForm.name.trim() || !facultyForm.institutionId) {
      toast({
        variant: 'destructive',
        title: '❌ Error',
        description: 'Nama fakultas dan institusi harus diisi',
      })
      return
    }

    setActionLoading(true)
    try {
      const url = editingFaculty
        ? `/api/admin/master-data/faculties/${editingFaculty.id}`
        : '/api/admin/master-data/faculties'

      const method = editingFaculty ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(facultyForm),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: '✅ Berhasil',
          description: editingFaculty ? 'Fakultas berhasil diperbarui' : 'Fakultas berhasil ditambahkan',
        })
        setShowFacultyDialog(false)
        fetchAllData()
      } else {
        toast({
          variant: 'destructive',
          title: '❌ Gagal',
          description: data.error || 'Gagal menyimpan fakultas',
        })
      }
    } catch (error) {
      console.error('Error saving faculty:', error)
      toast({
        variant: 'destructive',
        title: '❌ Error',
        description: 'Terjadi kesalahan',
      })
    } finally {
      setActionLoading(false)
    }
  }

  // Major handlers
  const handleAddMajor = () => {
    setEditingMajor(null)
    setMajorForm({ name: '', facultyId: '', degree: 'S1' })
    setShowMajorDialog(true)
  }

  const handleEditMajor = (maj: Major) => {
    setEditingMajor(maj)
    setMajorForm({
      name: maj.name,
      facultyId: maj.facultyId,
      degree: maj.degree || 'S1',
    })
    setShowMajorDialog(true)
  }

  const handleSaveMajor = async () => {
    if (!majorForm.name.trim() || !majorForm.facultyId) {
      toast({
        variant: 'destructive',
        title: '❌ Error',
        description: 'Nama program studi dan fakultas harus diisi',
      })
      return
    }

    setActionLoading(true)
    try {
      const url = editingMajor
        ? `/api/admin/master-data/majors/${editingMajor.id}`
        : '/api/admin/master-data/majors'

      const method = editingMajor ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(majorForm),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: '✅ Berhasil',
          description: editingMajor ? 'Program studi berhasil diperbarui' : 'Program studi berhasil ditambahkan',
        })
        setShowMajorDialog(false)
        fetchAllData()
      } else {
        toast({
          variant: 'destructive',
          title: '❌ Gagal',
          description: data.error || 'Gagal menyimpan program studi',
        })
      }
    } catch (error) {
      console.error('Error saving major:', error)
      toast({
        variant: 'destructive',
        title: '❌ Error',
        description: 'Terjadi kesalahan',
      })
    } finally {
      setActionLoading(false)
    }
  }

  // Delete handlers
  const handleDeleteClick = (type: 'institution' | 'faculty' | 'major', id: string, name: string) => {
    setDeleteTarget({ type, id, name })
    setShowDeleteDialog(true)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return

    setActionLoading(true)
    try {
      let url = ''
      switch (deleteTarget.type) {
        case 'institution':
          url = `/api/admin/master-data/institutions/${deleteTarget.id}`
          break
        case 'faculty':
          url = `/api/admin/master-data/faculties/${deleteTarget.id}`
          break
        case 'major':
          url = `/api/admin/master-data/majors/${deleteTarget.id}`
          break
      }

      const response = await fetch(url, { method: 'DELETE' })
      const data = await response.json()

      if (data.success) {
        toast({
          title: '✅ Berhasil',
          description: 'Data berhasil dihapus',
        })
        setShowDeleteDialog(false)
        setDeleteTarget(null)
        fetchAllData()
      } else {
        toast({
          variant: 'destructive',
          title: '❌ Gagal',
          description: data.error || 'Gagal menghapus data',
        })
      }
    } catch (error) {
      console.error('Error deleting:', error)
      toast({
        variant: 'destructive',
        title: '❌ Error',
        description: 'Terjadi kesalahan',
      })
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Master Data</h1>
          <p className="text-gray-600">Kelola data institusi, fakultas, dan program studi</p>
        </div>

        <Tabs defaultValue="institutions" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="institutions" className="flex items-center space-x-2">
              <Building2 className="h-4 w-4" />
              <span>Institusi ({institutions.length})</span>
            </TabsTrigger>
            <TabsTrigger value="faculties" className="flex items-center space-x-2">
              <GraduationCap className="h-4 w-4" />
              <span>Fakultas ({faculties.length})</span>
            </TabsTrigger>
            <TabsTrigger value="majors" className="flex items-center space-x-2">
              <BookOpen className="h-4 w-4" />
              <span>Program Studi ({majors.length})</span>
            </TabsTrigger>
          </TabsList>

          {/* Institutions Tab */}
          <TabsContent value="institutions">
            <Card>
              <div className="p-6 border-b flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold">Daftar Institusi</h2>
                  <p className="text-sm text-gray-600">Universitas dan perguruan tinggi</p>
                </div>
                <Button onClick={handleAddInstitution} className="bg-brand-primary hover:bg-brand-primary/90">
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Institusi
                </Button>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">No</TableHead>
                      <TableHead>Nama Institusi</TableHead>
                      <TableHead>Singkatan</TableHead>
                      <TableHead>Tipe</TableHead>
                      <TableHead>Kota</TableHead>
                      <TableHead>Provinsi</TableHead>
                      <TableHead className="text-center">Fakultas</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {institutions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                          Belum ada data institusi
                        </TableCell>
                      </TableRow>
                    ) : (
                      institutions.map((inst, index) => (
                        <TableRow key={inst.id}>
                          <TableCell className="font-medium">{index + 1}</TableCell>
                          <TableCell className="font-medium">{inst.name}</TableCell>
                          <TableCell>{inst.shortName || '-'}</TableCell>
                          <TableCell>{inst.type || '-'}</TableCell>
                          <TableCell>{inst.city || '-'}</TableCell>
                          <TableCell>{inst.province || '-'}</TableCell>
                          <TableCell className="text-center">{inst._count?.faculties || 0}</TableCell>
                          <TableCell className="text-center">
                            {inst.isActive ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <Check className="h-3 w-3 mr-1" />
                                Aktif
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                <X className="h-3 w-3 mr-1" />
                                Nonaktif
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditInstitution(inst)}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteClick('institution', inst.id, inst.name)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>

          {/* Faculties Tab */}
          <TabsContent value="faculties">
            <Card>
              <div className="p-6 border-b flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold">Daftar Fakultas</h2>
                  <p className="text-sm text-gray-600">Fakultas di berbagai institusi</p>
                </div>
                <Button onClick={handleAddFaculty} className="bg-brand-primary hover:bg-brand-primary/90">
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Fakultas
                </Button>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">No</TableHead>
                      <TableHead>Nama Fakultas</TableHead>
                      <TableHead>Institusi</TableHead>
                      <TableHead className="text-center">Program Studi</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {faculties.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                          Belum ada data fakultas
                        </TableCell>
                      </TableRow>
                    ) : (
                      faculties.map((fac, index) => (
                        <TableRow key={fac.id}>
                          <TableCell className="font-medium">{index + 1}</TableCell>
                          <TableCell className="font-medium">{fac.name}</TableCell>
                          <TableCell>{fac.institution?.name || '-'}</TableCell>
                          <TableCell className="text-center">{fac._count?.majors || 0}</TableCell>
                          <TableCell className="text-center">
                            {fac.isActive ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <Check className="h-3 w-3 mr-1" />
                                Aktif
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                <X className="h-3 w-3 mr-1" />
                                Nonaktif
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditFaculty(fac)}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteClick('faculty', fac.id, fac.name)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>

          {/* Majors Tab */}
          <TabsContent value="majors">
            <Card>
              <div className="p-6 border-b flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold">Daftar Program Studi</h2>
                  <p className="text-sm text-gray-600">Program studi di berbagai fakultas</p>
                </div>
                <Button onClick={handleAddMajor} className="bg-brand-primary hover:bg-brand-primary/90">
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Program Studi
                </Button>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">No</TableHead>
                      <TableHead>Nama Program Studi</TableHead>
                      <TableHead>Jenjang</TableHead>
                      <TableHead>Fakultas</TableHead>
                      <TableHead>Institusi</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {majors.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                          Belum ada data program studi
                        </TableCell>
                      </TableRow>
                    ) : (
                      majors.map((maj, index) => (
                        <TableRow key={maj.id}>
                          <TableCell className="font-medium">{index + 1}</TableCell>
                          <TableCell className="font-medium">{maj.name}</TableCell>
                          <TableCell>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {maj.degree || 'S1'}
                            </span>
                          </TableCell>
                          <TableCell>{maj.faculty?.name || '-'}</TableCell>
                          <TableCell>{maj.faculty?.institution?.name || '-'}</TableCell>
                          <TableCell className="text-center">
                            {maj.isActive ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <Check className="h-3 w-3 mr-1" />
                                Aktif
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                <X className="h-3 w-3 mr-1" />
                                Nonaktif
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditMajor(maj)}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteClick('major', maj.id, maj.name)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Institution Dialog */}
        <Dialog open={showInstitutionDialog} onOpenChange={setShowInstitutionDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingInstitution ? 'Edit Institusi' : 'Tambah Institusi'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="inst-name">Nama Institusi *</Label>
                <Input
                  id="inst-name"
                  value={institutionForm.name}
                  onChange={(e) => setInstitutionForm({ ...institutionForm, name: e.target.value })}
                  placeholder="Contoh: Universitas Indonesia"
                />
              </div>
              <div>
                <Label htmlFor="inst-short">Singkatan</Label>
                <Input
                  id="inst-short"
                  value={institutionForm.shortName}
                  onChange={(e) => setInstitutionForm({ ...institutionForm, shortName: e.target.value })}
                  placeholder="Contoh: UI"
                />
              </div>
              <div>
                <Label htmlFor="inst-type">Tipe</Label>
                <Input
                  id="inst-type"
                  value={institutionForm.type}
                  onChange={(e) => setInstitutionForm({ ...institutionForm, type: e.target.value })}
                  placeholder="Contoh: Universitas Negeri"
                />
              </div>
              <div>
                <Label htmlFor="inst-city">Kota</Label>
                <Input
                  id="inst-city"
                  value={institutionForm.city}
                  onChange={(e) => setInstitutionForm({ ...institutionForm, city: e.target.value })}
                  placeholder="Contoh: Jakarta"
                />
              </div>
              <div>
                <Label htmlFor="inst-province">Provinsi</Label>
                <Input
                  id="inst-province"
                  value={institutionForm.province}
                  onChange={(e) => setInstitutionForm({ ...institutionForm, province: e.target.value })}
                  placeholder="Contoh: DKI Jakarta"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setShowInstitutionDialog(false)}>
                  Batal
                </Button>
                <Button onClick={handleSaveInstitution} disabled={actionLoading}>
                  {actionLoading ? 'Menyimpan...' : 'Simpan'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Faculty Dialog */}
        <Dialog open={showFacultyDialog} onOpenChange={setShowFacultyDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingFaculty ? 'Edit Fakultas' : 'Tambah Fakultas'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="fac-name">Nama Fakultas *</Label>
                <Input
                  id="fac-name"
                  value={facultyForm.name}
                  onChange={(e) => setFacultyForm({ ...facultyForm, name: e.target.value })}
                  placeholder="Contoh: Fakultas Teknik"
                />
              </div>
              <div>
                <Label htmlFor="fac-inst">Institusi *</Label>
                <select
                  id="fac-inst"
                  value={facultyForm.institutionId}
                  onChange={(e) => setFacultyForm({ ...facultyForm, institutionId: e.target.value })}
                  className="w-full h-10 px-3 rounded-md border border-gray-300"
                >
                  <option value="">Pilih Institusi</option>
                  {institutions.map((inst) => (
                    <option key={inst.id} value={inst.id}>
                      {inst.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setShowFacultyDialog(false)}>
                  Batal
                </Button>
                <Button onClick={handleSaveFaculty} disabled={actionLoading}>
                  {actionLoading ? 'Menyimpan...' : 'Simpan'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Major Dialog */}
        <Dialog open={showMajorDialog} onOpenChange={setShowMajorDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingMajor ? 'Edit Program Studi' : 'Tambah Program Studi'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="maj-name">Nama Program Studi *</Label>
                <Input
                  id="maj-name"
                  value={majorForm.name}
                  onChange={(e) => setMajorForm({ ...majorForm, name: e.target.value })}
                  placeholder="Contoh: Teknik Informatika"
                />
              </div>
              <div>
                <Label htmlFor="maj-fac">Fakultas *</Label>
                <select
                  id="maj-fac"
                  value={majorForm.facultyId}
                  onChange={(e) => setMajorForm({ ...majorForm, facultyId: e.target.value })}
                  className="w-full h-10 px-3 rounded-md border border-gray-300"
                >
                  <option value="">Pilih Fakultas</option>
                  {faculties.map((fac) => (
                    <option key={fac.id} value={fac.id}>
                      {fac.name} - {fac.institution?.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="maj-degree">Jenjang *</Label>
                <select
                  id="maj-degree"
                  value={majorForm.degree}
                  onChange={(e) => setMajorForm({ ...majorForm, degree: e.target.value })}
                  className="w-full h-10 px-3 rounded-md border border-gray-300"
                >
                  <option value="D3">D3</option>
                  <option value="S1">S1</option>
                  <option value="S2">S2</option>
                  <option value="S3">S3</option>
                </select>
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setShowMajorDialog(false)}>
                  Batal
                </Button>
                <Button onClick={handleSaveMajor} disabled={actionLoading}>
                  {actionLoading ? 'Menyimpan...' : 'Simpan'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Hapus Data?</AlertDialogTitle>
              <AlertDialogDescription>
                Apakah Anda yakin ingin menghapus <strong>{deleteTarget?.name}</strong>?
                <br /><br />
                {deleteTarget?.type === 'institution' && 'Data fakultas dan program studi terkait juga akan terhapus.'}
                {deleteTarget?.type === 'faculty' && 'Data program studi terkait juga akan terhapus.'}
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
                {actionLoading ? 'Menghapus...' : 'Hapus'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
