/**
 * Master Data untuk Institusi Pendidikan Indonesia
 * User bisa pilih dari list atau input custom
 */

export interface University {
  id: string
  name: string
  shortName: string
  city: string
  faculties: Faculty[]
}

export interface Faculty {
  id: string
  name: string
  majors: string[]
}

export const UNIVERSITIES: University[] = [
  {
    id: 'ui',
    name: 'Universitas Indonesia',
    shortName: 'UI',
    city: 'Depok',
    faculties: [
      {
        id: 'fk',
        name: 'Fakultas Kedokteran',
        majors: ['Pendidikan Dokter', 'Ilmu Keperawatan', 'Gizi'],
      },
      {
        id: 'ft',
        name: 'Fakultas Teknik',
        majors: ['Teknik Sipil', 'Teknik Mesin', 'Teknik Elektro', 'Teknik Kimia', 'Arsitektur', 'Teknik Industri'],
      },
      {
        id: 'fmipa',
        name: 'Fakultas Matematika dan Ilmu Pengetahuan Alam',
        majors: ['Matematika', 'Fisika', 'Kimia', 'Biologi', 'Geografi', 'Statistika'],
      },
      {
        id: 'fh',
        name: 'Fakultas Hukum',
        majors: ['Ilmu Hukum'],
      },
      {
        id: 'feb',
        name: 'Fakultas Ekonomi dan Bisnis',
        majors: ['Ilmu Ekonomi', 'Manajemen', 'Akuntansi', 'Bisnis Islam'],
      },
      {
        id: 'fisip',
        name: 'Fakultas Ilmu Sosial dan Ilmu Politik',
        majors: ['Ilmu Politik', 'Sosiologi', 'Ilmu Komunikasi', 'Kriminologi', 'Hubungan Internasional', 'Ilmu Kesejahteraan Sosial'],
      },
      {
        id: 'fib',
        name: 'Fakultas Ilmu Budaya',
        majors: ['Sastra Indonesia', 'Sastra Inggris', 'Sastra Arab', 'Sejarah', 'Filsafat', 'Arkeologi'],
      },
      {
        id: 'fpsi',
        name: 'Fakultas Psikologi',
        majors: ['Psikologi'],
      },
      {
        id: 'fkm',
        name: 'Fakultas Kesehatan Masyarakat',
        majors: ['Kesehatan Masyarakat', 'Gizi', 'Kesehatan Lingkungan'],
      },
      {
        id: 'fasilkom',
        name: 'Fakultas Ilmu Komputer',
        majors: ['Ilmu Komputer', 'Sistem Informasi'],
      },
      {
        id: 'fkg',
        name: 'Fakultas Kedokteran Gigi',
        majors: ['Kedokteran Gigi'],
      },
      {
        id: 'fik',
        name: 'Fakultas Ilmu Keperawatan',
        majors: ['Ilmu Keperawatan'],
      },
      {
        id: 'farmasi',
        name: 'Fakultas Farmasi',
        majors: ['Farmasi'],
      },
    ],
  },
  {
    id: 'itb',
    name: 'Institut Teknologi Bandung',
    shortName: 'ITB',
    city: 'Bandung',
    faculties: [
      {
        id: 'stei',
        name: 'Sekolah Teknik Elektro dan Informatika',
        majors: ['Teknik Elektro', 'Teknik Informatika', 'Teknik Telekomunikasi', 'Sistem dan Teknologi Informasi'],
      },
      {
        id: 'ftsl',
        name: 'Fakultas Teknik Sipil dan Lingkungan',
        majors: ['Teknik Sipil', 'Teknik Lingkungan', 'Teknik Kelautan', 'Teknik Geodesi'],
      },
      {
        id: 'ftmd',
        name: 'Fakultas Teknik Mesin dan Dirgantara',
        majors: ['Teknik Mesin', 'Teknik Dirgantara', 'Teknik Material'],
      },
      {
        id: 'fmipa',
        name: 'Fakultas Matematika dan Ilmu Pengetahuan Alam',
        majors: ['Matematika', 'Fisika', 'Astronomi', 'Kimia'],
      },
      {
        id: 'sappk',
        name: 'Sekolah Arsitektur, Perencanaan dan Pengembangan Kebijakan',
        majors: ['Arsitektur', 'Perencanaan Wilayah dan Kota'],
      },
      {
        id: 'sith',
        name: 'Sekolah Ilmu dan Teknologi Hayati',
        majors: ['Biologi', 'Mikrobiologi', 'Rekayasa Hayati'],
      },
      {
        id: 'sf',
        name: 'Sekolah Farmasi',
        majors: ['Sains dan Teknologi Farmasi', 'Farmasi Klinik dan Komunitas'],
      },
      {
        id: 'fteti',
        name: 'Fakultas Teknik Pertambangan dan Perminyakan',
        majors: ['Teknik Pertambangan', 'Teknik Perminyakan', 'Teknik Geofisika', 'Teknik Metalurgi'],
      },
      {
        id: 'fti',
        name: 'Fakultas Teknologi Industri',
        majors: ['Teknik Kimia', 'Teknik Fisika', 'Teknik Industri', 'Manajemen Rekayasa Industri'],
      },
      {
        id: 'sbe',
        name: 'Sekolah Bisnis dan Manajemen',
        majors: ['Manajemen', 'Kewirausahaan'],
      },
    ],
  },
  {
    id: 'ugm',
    name: 'Universitas Gadjah Mada',
    shortName: 'UGM',
    city: 'Yogyakarta',
    faculties: [
      {
        id: 'ft',
        name: 'Fakultas Teknik',
        majors: ['Teknik Sipil', 'Teknik Mesin', 'Teknik Elektro', 'Teknik Kimia', 'Arsitektur', 'Teknik Industri', 'Teknik Geodesi'],
      },
      {
        id: 'fmipa',
        name: 'Fakultas Matematika dan Ilmu Pengetahuan Alam',
        majors: ['Matematika', 'Fisika', 'Kimia', 'Ilmu Komputer', 'Elektronika dan Instrumentasi', 'Geofisika'],
      },
      {
        id: 'feb',
        name: 'Fakultas Ekonomika dan Bisnis',
        majors: ['Ilmu Ekonomi', 'Manajemen', 'Akuntansi'],
      },
      {
        id: 'fh',
        name: 'Fakultas Hukum',
        majors: ['Ilmu Hukum'],
      },
      {
        id: 'fisipol',
        name: 'Fakultas Ilmu Sosial dan Ilmu Politik',
        majors: ['Ilmu Politik', 'Sosiologi', 'Ilmu Komunikasi', 'Hubungan Internasional', 'Manajemen dan Kebijakan Publik'],
      },
      {
        id: 'fib',
        name: 'Fakultas Ilmu Budaya',
        majors: ['Sastra Indonesia', 'Sastra Inggris', 'Sastra Jepang', 'Sejarah', 'Arkeologi', 'Antropologi'],
      },
      {
        id: 'fk',
        name: 'Fakultas Kedokteran',
        majors: ['Pendidikan Dokter', 'Ilmu Keperawatan', 'Gizi Kesehatan'],
      },
      {
        id: 'fpsikologi',
        name: 'Fakultas Psikologi',
        majors: ['Psikologi'],
      },
      {
        id: 'fkm',
        name: 'Fakultas Kesehatan Masyarakat',
        majors: ['Ilmu Kesehatan Masyarakat', 'Gizi Kesehatan'],
      },
      {
        id: 'fpp',
        name: 'Fakultas Peternakan',
        majors: ['Peternakan', 'Teknologi Hasil Ternak'],
      },
      {
        id: 'fp',
        name: 'Fakultas Pertanian',
        majors: ['Agronomi', 'Ilmu Tanah', 'Proteksi Tanaman', 'Sosial Ekonomi Pertanian', 'Penyuluhan dan Komunikasi Pertanian'],
      },
      {
        id: 'fkg',
        name: 'Fakultas Kedokteran Gigi',
        majors: ['Kedokteran Gigi'],
      },
      {
        id: 'farmasi',
        name: 'Fakultas Farmasi',
        majors: ['Farmasi'],
      },
    ],
  },
  {
    id: 'unair',
    name: 'Universitas Airlangga',
    shortName: 'UNAIR',
    city: 'Surabaya',
    faculties: [
      {
        id: 'fk',
        name: 'Fakultas Kedokteran',
        majors: ['Pendidikan Dokter', 'Ilmu Keperawatan'],
      },
      {
        id: 'fkg',
        name: 'Fakultas Kedokteran Gigi',
        majors: ['Kedokteran Gigi'],
      },
      {
        id: 'ff',
        name: 'Fakultas Farmasi',
        majors: ['Farmasi'],
      },
      {
        id: 'fkm',
        name: 'Fakultas Kesehatan Masyarakat',
        majors: ['Ilmu Kesehatan Masyarakat'],
      },
      {
        id: 'fh',
        name: 'Fakultas Hukum',
        majors: ['Ilmu Hukum'],
      },
      {
        id: 'feb',
        name: 'Fakultas Ekonomi dan Bisnis',
        majors: ['Ilmu Ekonomi', 'Manajemen', 'Akuntansi', 'Ekonomi Islam'],
      },
      {
        id: 'fisip',
        name: 'Fakultas Ilmu Sosial dan Ilmu Politik',
        majors: ['Sosiologi', 'Ilmu Politik', 'Antropologi', 'Ilmu Komunikasi', 'Ilmu Informasi dan Perpustakaan', 'Ilmu Administrasi Negara'],
      },
      {
        id: 'fib',
        name: 'Fakultas Ilmu Budaya',
        majors: ['Sastra Indonesia', 'Sastra Inggris', 'Sastra Jepang', 'Sejarah', 'Ilmu Filsafat'],
      },
      {
        id: 'fst',
        name: 'Fakultas Sains dan Teknologi',
        majors: ['Matematika', 'Fisika', 'Kimia', 'Biologi', 'Sistem Informasi', 'Teknobiologi'],
      },
      {
        id: 'fpsi',
        name: 'Fakultas Psikologi',
        majors: ['Psikologi'],
      },
      {
        id: 'fkp',
        name: 'Fakultas Keperawatan',
        majors: ['Ilmu Keperawatan'],
      },
    ],
  },
  {
    id: 'its',
    name: 'Institut Teknologi Sepuluh Nopember',
    shortName: 'ITS',
    city: 'Surabaya',
    faculties: [
      {
        id: 'ftsp',
        name: 'Fakultas Teknik Sipil, Perencanaan, dan Kebumian',
        majors: ['Teknik Sipil', 'Arsitektur', 'Teknik Lingkungan', 'Perencanaan Wilayah dan Kota', 'Teknik Geomatika'],
      },
      {
        id: 'fti',
        name: 'Fakultas Teknologi Industri dan Rekayasa Sistem',
        majors: ['Teknik Mesin', 'Teknik Kimia', 'Teknik Fisika', 'Teknik Industri', 'Teknik Material'],
      },
      {
        id: 'ftif',
        name: 'Fakultas Teknologi Informasi dan Komunikasi',
        majors: ['Teknik Informatika', 'Sistem Informasi', 'Teknik Komputer', 'Teknologi Informasi'],
      },
      {
        id: 'fte',
        name: 'Fakultas Teknologi Elektro dan Informatika Cerdas',
        majors: ['Teknik Elektro', 'Teknik Biomedik', 'Teknik Komputer', 'Teknologi Informasi'],
      },
      {
        id: 'fmipa',
        name: 'Fakultas Sains dan Analitika Data',
        majors: ['Matematika', 'Fisika', 'Kimia', 'Biologi', 'Statistika', 'Aktuaria'],
      },
      {
        id: 'ftk',
        name: 'Fakultas Teknologi Kelautan',
        majors: ['Teknik Perkapalan', 'Teknik Sistem Perkapalan', 'Teknik Kelautan', 'Teknik Transportasi Laut'],
      },
    ],
  },
]

// Fungsi helper untuk search
export function searchUniversities(query: string): University[] {
  if (!query) return UNIVERSITIES
  const lowerQuery = query.toLowerCase()
  return UNIVERSITIES.filter(
    (uni) =>
      uni.name.toLowerCase().includes(lowerQuery) ||
      uni.shortName.toLowerCase().includes(lowerQuery) ||
      uni.city.toLowerCase().includes(lowerQuery)
  )
}

export function getFaculties(universityId: string): Faculty[] {
  const university = UNIVERSITIES.find((u) => u.id === universityId)
  return university?.faculties || []
}

export function getMajors(universityId: string, facultyId: string): string[] {
  const university = UNIVERSITIES.find((u) => u.id === universityId)
  const faculty = university?.faculties.find((f) => f.id === facultyId)
  return faculty?.majors || []
}
