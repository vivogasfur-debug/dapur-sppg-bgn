'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import Sidebar from './Sidebar';
import StockModule from './StockModule';
import AhliGiziModule from './AhliGiziModule';
import Image from 'next/image';
import * as ExcelJS from 'exceljs';
import { 
  Utensils, Plus, Search, X, Trash2, Phone,
  GraduationCap, Baby, UserCheck, School, Heart, Milk,
  AlertCircle, Calendar, Upload, Loader2, Pencil, Menu, Download
} from 'lucide-react';

interface StudentBeneficiary {
  id: string; no: number; nama: string; schoolName: string;
  nipd: string; jk: 'L' | 'P'; nisn: string; tempatLahir: string;
  tanggalLahir: string; nik: string; agama: string; alamat: string;
  kelas: string; beratBadan: number; tinggiBadan: number;
  namaAyah: string; namaIbu: string; hasAllergy?: boolean; allergyType?: string;
}

interface TeacherBeneficiary {
  id: string; fullName: string; schoolName: string; nuptk: string;
  nip: string; jk: 'L' | 'P'; tempatLahir: string; tanggalLahir: string;
  nik: string; jenisTendik: 'Kepala Sekolah' | 'Guru' | 'Tendik' | 'Non Tendik';
  alamat: string; hasAllergy?: boolean; allergyType?: string; status?: string;
}

interface Beneficiary3B {
  id: string; sppgCode: string; posyanduName: string;
  subCategory: 'Bumil' | 'Busui' | 'Balita'; nik: string; fullName: string;
  gender: 'L' | 'P'; birthDate: string; detailInfo: string;
  picName: string; phone: string; hasAllergy: boolean; allergyType: string;
  status: 'Aktif' | 'Lulus 3B';
}

const calculateAge = (birthDateString: string) => {
  if (!birthDateString || birthDateString === '-') return '-';
  const birthDate = new Date(birthDateString);
  const today = new Date();
  if (isNaN(birthDate.getTime())) return '-';
  let years = today.getFullYear() - birthDate.getFullYear();
  let months = today.getMonth() - birthDate.getMonth();
  if (months < 0 || (months === 0 && today.getDate() < birthDate.getDate())) { years--; months += 12; }
  if (years === 0) return `${months} Bln`;
  return months > 0 ? `${years} Thn ${months} Bln` : `${years} Thn`;
};

export default function MainApp() {
  const [activeMenu, setActiveMenu] = useState('Penerima Manfaat');
  const [pmMainTab, setPmMainTab] = useState<'Sekolah' | '3B'>('Sekolah');
  const [pmSubTab, setPmSubTab] = useState<'Siswa' | 'Guru' | 'Bumil' | 'Busui' | 'Balita'>('Siswa');
  const [loading, setLoading] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const [students, setStudents] = useState<StudentBeneficiary[]>([]);
  const [teachers, setTeachers] = useState<TeacherBeneficiary[]>([]);
  const [beneficiaries3b, setBeneficiaries3b] = useState<Beneficiary3B[]>([]);

  const fetchData = useCallback(async () => {
    try {
      const [sRes, tRes, bRes] = await Promise.all([
        fetch('/api/students').then(r => r.json()),
        fetch('/api/teachers').then(r => r.json()),
        fetch('/api/beneficiaries-3b').then(r => r.json()),
      ]);
      if (Array.isArray(sRes)) setStudents(sRes.map((s: any) => ({
        id: s.id, no: 0, nama: s.nama, schoolName: s.school_name,
        nipd: s.nipd || '-', jk: s.jk, nisn: s.nisn || '-',
        tempatLahir: s.tempat_lahir || '-', tanggalLahir: s.tanggal_lahir || '-',
        nik: s.nik || '-', agama: s.agama || 'Islam', alamat: s.alamat || '-',
        kelas: s.kelas || '-', beratBadan: s.berat_badan || 0, tinggiBadan: s.tinggi_badan || 0,
        namaAyah: s.nama_ayah || '-', namaIbu: s.nama_ibu || '-',
        hasAllergy: s.has_allergy, allergyType: s.allergy_type || '-',
      })));
      if (Array.isArray(tRes)) setTeachers(tRes.map((t: any) => ({
        id: t.id, fullName: t.full_name, schoolName: t.school_name,
        nuptk: t.nuptk || '-', nip: t.nip || '-', jk: t.jk,
        tempatLahir: t.tempat_lahir || '-', tanggalLahir: t.tanggal_lahir || '-',
        nik: t.nik || '-', jenisTendik: t.jenis_tendik || 'Guru',
        alamat: t.alamat || '-', hasAllergy: t.has_allergy,
        allergyType: t.allergy_type || '-', status: t.status || 'Aktif',
      })));
      if (Array.isArray(bRes)) setBeneficiaries3b(bRes.map((b: any) => ({
        id: b.id, sppgCode: b.sppg_code || '-', posyanduName: b.posyandu_name,
        subCategory: b.sub_category, nik: b.nik || '-', fullName: b.full_name,
        gender: b.gender, birthDate: b.birth_date || '-', detailInfo: b.detail_info || '-',
        picName: b.pic_name, phone: b.phone, hasAllergy: b.has_allergy,
        allergyType: b.allergy_type || '-', status: b.status || 'Aktif',
      })));
    } catch { toast.error('Gagal memuat data dari database'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { fetchData(); }, [fetchData]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const csvInputRef = { current: null as HTMLInputElement | null };

  const [formSiswa, setFormSiswa] = useState({
    schoolName: 'SDN 01 Sambas', nama: '', nipd: '', jk: 'L' as 'L' | 'P',
    nisn: '', tempatLahir: '', tanggalLahir: '', nik: '', agama: 'Islam',
    alamat: '', kelas: '', beratBadan: '', tinggiBadan: '',
    namaAyah: '', namaIbu: '', hasAllergy: false, allergyType: '',
  });
  const [formGuru, setFormGuru] = useState({
    schoolName: 'SDN 01 Sambas', fullName: '', nuptk: '', nip: '',
    jk: 'L' as 'L' | 'P', tempatLahir: '', tanggalLahir: '', nik: '',
    jenisTendik: 'Guru' as 'Kepala Sekolah' | 'Guru' | 'Tendik' | 'Non Tendik',
    alamat: '', hasAllergy: false, allergyType: '',
  });
  const [form3B, setForm3B] = useState({
    posyanduName: '', fullName: '', nik: '', gender: 'P' as 'L' | 'P',
    birthDate: '', detailInfo: '', picName: '', phone: '',
    hasAllergy: false, allergyType: '',
  });

  const handleMainTabChange = (tab: 'Sekolah' | '3B') => {
    setPmMainTab(tab); setPmSubTab(tab === 'Sekolah' ? 'Siswa' : 'Bumil');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (pmMainTab === 'Sekolah' && pmSubTab === 'Siswa') {
        const url = editingId ? `/api/students?id=${editingId}` : '/api/students';
        const res = await fetch(url, { method: editingId ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formSiswa) });
        if (!res.ok) throw new Error(); toast.success(editingId ? 'Data siswa diperbarui' : 'Data siswa tersimpan');
      } else if (pmMainTab === 'Sekolah' && pmSubTab === 'Guru') {
        const url = editingId ? `/api/teachers?id=${editingId}` : '/api/teachers';
        const res = await fetch(url, { method: editingId ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formGuru) });
        if (!res.ok) throw new Error(); toast.success(editingId ? 'Data guru diperbarui' : 'Data guru tersimpan');
      } else {
        const url = editingId ? `/api/beneficiaries-3b?id=${editingId}` : '/api/beneficiaries-3b';
        const res = await fetch(url, { method: editingId ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form3B, subCategory: pmSubTab }) });
        if (!res.ok) throw new Error(); toast.success(editingId ? 'Data 3B diperbarui' : 'Data 3B tersimpan');
      }
      setIsModalOpen(false); setEditingId(null); fetchData();
    } catch { toast.error('Gagal menyimpan data'); }
  };

  const handleEdit = (type: string, item: any) => {
    setEditingId(item.id);
    if (type === 'students') {
      setPmSubTab('Siswa'); setPmMainTab('Sekolah');
      setFormSiswa({ schoolName: item.schoolName, nama: item.nama, nipd: item.nipd || '', jk: item.jk, nisn: item.nisn || '', tempatLahir: item.tempatLahir || '', tanggalLahir: item.tanggalLahir || '', nik: item.nik || '', agama: item.agama || 'Islam', alamat: item.alamat || '', kelas: item.kelas || '', beratBadan: String(item.beratBadan || ''), tinggiBadan: String(item.tinggiBadan || ''), namaAyah: item.namaAyah || '', namaIbu: item.namaIbu || '', hasAllergy: item.hasAllergy || false, allergyType: item.allergyType || '' });
    } else if (type === 'teachers') {
      setPmSubTab('Guru'); setPmMainTab('Sekolah');
      setFormGuru({ schoolName: item.schoolName, fullName: item.fullName, nuptk: item.nuptk || '', nip: item.nip || '', jk: item.jk, tempatLahir: item.tempatLahir || '', tanggalLahir: item.tanggalLahir || '', nik: item.nik || '', jenisTendik: item.jenisTendik || 'Guru', alamat: item.alamat || '', hasAllergy: item.hasAllergy || false, allergyType: item.allergyType || '' });
    } else {
      setPmSubTab(item.subCategory); setPmMainTab('3B');
      setForm3B({ posyanduName: item.posyanduName, fullName: item.fullName, nik: item.nik || '', gender: item.gender, birthDate: item.birthDate || '', detailInfo: item.detailInfo || '', picName: item.picName, phone: item.phone, hasAllergy: item.hasAllergy || false, allergyType: item.allergyType || '' });
    }
    setIsModalOpen(true);
  };

  const handleDelete = async (type: string, id: string) => {
    if (!confirm('Yakin ingin menghapus data ini?')) return;
    try {
      const urls: Record<string, string> = { students: '/api/students', teachers: '/api/teachers', 'beneficiaries-3b': '/api/beneficiaries-3b' };
      const res = await fetch(`${urls[type]}?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast.success('Data berhasil dihapus'); fetchData();
    } catch { toast.error('Gagal menghapus data'); }
  };

  const [deletingAll, setDeletingAll] = useState(false);
  const handleDeleteAll = async () => {
    const count = pmSubTab === 'Siswa' ? students.length
      : pmSubTab === 'Guru' ? teachers.length
      : beneficiaries3b.filter(b => b.subCategory === pmSubTab).length;
    if (count === 0) { toast.error('Tidak ada data untuk dihapus'); return; }
    if (!confirm(`HAPUS SEMUA data ${pmSubTab} (${count} data)?\n\nTindakan ini tidak dapat dibatalkan!`)) return;
    if (!confirm('Anda yakin? Ketuk OK untuk menghapus semua data.')) return;
    setDeletingAll(true);
    try {
      let url = '/api/students?all=true';
      if (pmSubTab === 'Guru') url = '/api/teachers?all=true';
      else if (['Bumil', 'Busui', 'Balita'].includes(pmSubTab)) url = `/api/beneficiaries-3b?all=true&sub_category=${pmSubTab}`;
      const res = await fetch(url, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast.success(`Semua data ${pmSubTab} berhasil dihapus`); fetchData();
    } catch { toast.error('Gagal menghapus semua data'); }
    finally { setDeletingAll(false); }
  };

  const openAddModal = () => {
    setEditingId(null);
    if (pmMainTab === 'Sekolah' && pmSubTab === 'Siswa') setFormSiswa({ schoolName: 'SDN 01 Sambas', nama: '', nipd: '', jk: 'L', nisn: '', tempatLahir: '', tanggalLahir: '', nik: '', agama: 'Islam', alamat: '', kelas: '', beratBadan: '', tinggiBadan: '', namaAyah: '', namaIbu: '', hasAllergy: false, allergyType: '' });
    else if (pmMainTab === 'Sekolah' && pmSubTab === 'Guru') setFormGuru({ schoolName: 'SDN 01 Sambas', fullName: '', nuptk: '', nip: '', jk: 'L', tempatLahir: '', tanggalLahir: '', nik: '', jenisTendik: 'Guru', alamat: '', hasAllergy: false, allergyType: '' });
    else setForm3B({ posyanduName: '', fullName: '', nik: '', gender: 'P', birthDate: '', detailInfo: '', picName: '', phone: '', hasAllergy: false, allergyType: '' });
    setIsModalOpen(true);
  };

  const getImportType = () => {
    if (pmSubTab === 'Siswa') return 'students';
    if (pmSubTab === 'Guru') return 'teachers';
    return 'beneficiaries-3b';
  };

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setImporting(true);
    try {
      const formData = new FormData(); formData.append('file', file); formData.append('type', getImportType());
      const res = await fetch('/api/import-csv', { method: 'POST', body: formData });
      const result = await res.json();
      if (res.ok && result.inserted > 0) { toast.success(`${result.inserted} data berhasil diimport dari CSV`); fetchData(); }
      else toast.error(result.error || 'Gagal import CSV');
    } catch { toast.error('Gagal membaca file CSV'); }
    finally { setImporting(false); if (csvInputRef.current) csvInputRef.current.value = ''; }
  };

  const handleExportExcel = async (scope: 'current' | 'all') => {
    setExporting(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const keyword = searchTerm.trim().replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '-').toLowerCase();
      const safeStr = (v: any) => (v === null || v === undefined || v === '') ? '-' : String(v);

      // Fetch logo
      const logoRes = await fetch('/bgn.png');
      const logoBuf = await logoRes.arrayBuffer();
      const logoB64 = Buffer.from(logoBuf).toString('base64');

      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Dapur SPPG Sangia Wambulu BGN';

      const addKop = (ws: ExcelJS.Worksheet, title: string, headers: string[], rows: string[][], colWidths: number[]) => {
        // Row 1-4: Kop with logo
        ws.mergeCells('A1', 'B4');
        const logoId = workbook.addImage({ base64: `image/png;base64,${logoB64}`, extension: 'png' });
        ws.addImage(logoId, { tl: { col: 0, row: 0 }, ext: { width: 70, height: 70 } });

        // Title text
        ws.mergeCells('C1', `${String.fromCharCode(64 + headers.length)}1`);
        const c1 = ws.getCell('C1');
        c1.value = 'BADAN GIZI NASIONAL';
        c1.font = { bold: true, size: 14, name: 'Calibri' };
        c1.alignment = { vertical: 'middle', horizontal: 'center' };

        ws.mergeCells('C2', `${String.fromCharCode(64 + headers.length)}2`);
        const c2 = ws.getCell('C2');
        c2.value = 'Satuan Pelayanan Pemenuhan Gizi (SPPG)';
        c2.font = { bold: true, size: 11, name: 'Calibri' };
        c2.alignment = { vertical: 'middle', horizontal: 'center' };

        ws.mergeCells('C3', `${String.fromCharCode(64 + headers.length)}3`);
        const c3 = ws.getCell('C3');
        c3.value = 'Kabupaten Buton Tengah';
        c3.font = { size: 10, name: 'Calibri' };
        c3.alignment = { vertical: 'middle', horizontal: 'center' };

        ws.mergeCells('C4', `${String.fromCharCode(64 + headers.length)}4`);
        const c4 = ws.getCell('C4');
        c4.value = 'Kecamatan Sangia Wambulu, Kelurahan Tolandona';
        c4.font = { size: 9, name: 'Calibri', italic: true };
        c4.alignment = { vertical: 'middle', horizontal: 'center' };

        // Set row heights for kop
        ws.getRow(1).height = 22;
        ws.getRow(2).height = 20;
        ws.getRow(3).height = 18;
        ws.getRow(4).height = 18;

        // Row 5: border separator
        ws.getRow(5).height = 4;
        const lastCol = String.fromCharCode(64 + headers.length);
        for (let c = 1; c <= headers.length; c++) {
          const cell = ws.getRow(5).getCell(c);
          cell.border = { bottom: { style: 'double' as any } };
        }

        // Row 6: empty spacer
        ws.getRow(6).height = 8;

        // Row 7: Data title
        ws.mergeCells(`A7`, `${lastCol}7`);
        const titleCell = ws.getCell('A7');
        titleCell.value = title;
        titleCell.font = { bold: true, size: 12, name: 'Calibri' };
        titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
        ws.getRow(7).height = 24;

        // Row 8: Column headers
        const headerRow = ws.getRow(8);
        headerRow.height = 22;
        headers.forEach((h, i) => {
          const cell = headerRow.getCell(i + 1);
          cell.value = h;
          cell.font = { bold: true, size: 10, name: 'Calibri', color: { argb: 'FFFFFFFF' } };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2E7D32' } };
          cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
          cell.border = {
            top: { style: 'thin' as any, color: { argb: 'FFBDBDBD' } },
            left: { style: 'thin' as any, color: { argb: 'FFBDBDBD' } },
            bottom: { style: 'thin' as any, color: { argb: 'FFBDBDBD' } },
            right: { style: 'thin' as any, color: { argb: 'FFBDBDBD' } },
          };
        });

        // Data rows starting at row 9
        rows.forEach((row, ri) => {
          const dataRow = ws.getRow(9 + ri);
          dataRow.height = 18;
          row.forEach((val, ci) => {
            const cell = dataRow.getCell(ci + 1);
            cell.value = val;
            cell.font = { size: 10, name: 'Calibri' };
            cell.alignment = { vertical: 'middle', horizontal: ci === 0 ? 'center' : 'left', wrapText: true };
            cell.border = {
              top: { style: 'thin' as any, color: { argb: 'FFE0E0E0' } },
              left: { style: 'thin' as any, color: { argb: 'FFE0E0E0' } },
              bottom: { style: 'thin' as any, color: { argb: 'FFE0E0E0' } },
              right: { style: 'thin' as any, color: { argb: 'FFE0E0E0' } },
            };
          });
        });

        // Alternate row colors
        rows.forEach((_, ri) => {
          if (ri % 2 === 1) {
            const dataRow = ws.getRow(9 + ri);
            headers.forEach((_, ci) => {
              dataRow.getCell(ci + 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F5' } };
            });
          }
        });

        // Column widths
        colWidths.forEach((w, i) => {
          ws.getColumn(i + 1).width = w;
        });
      };

      // Siswa
      if (scope === 'all' || pmSubTab === 'Siswa') {
        const data = scope === 'all' ? students : filteredStudents;
        const headers = ['No', 'Nama Siswa', 'Sekolah', 'NIPD', 'JK', 'NISN', 'Tempat Lahir', 'Tanggal Lahir', 'NIK', 'Agama', 'Alamat', 'Kelas', 'BB (kg)', 'TB (cm)', 'Nama Ayah', 'Nama Ibu', 'Alergi'];
        const rows = data.map((s, i) => [safeStr(i+1), safeStr(s.nama), safeStr(s.schoolName), safeStr(s.nipd), safeStr(s.jk), safeStr(s.nisn), safeStr(s.tempatLahir), safeStr(s.tanggalLahir), safeStr(s.nik), safeStr(s.agama), safeStr(s.alamat), safeStr(s.kelas), safeStr(s.beratBadan), safeStr(s.tinggiBadan), safeStr(s.namaAyah), safeStr(s.namaIbu), s.hasAllergy ? safeStr(s.allergyType) : 'Tidak']);
        const ws = workbook.addWorksheet('Siswa');
        addKop(ws, 'DATA PENERIMA MANFAAT - SISWA', headers, rows, [5, 25, 25, 12, 5, 18, 15, 15, 20, 10, 20, 8, 8, 8, 20, 20, 12]);
      }

      // Guru
      if (scope === 'all' || pmSubTab === 'Guru') {
        const data = scope === 'all' ? teachers : filteredTeachers;
        const headers = ['No', 'Nama Guru/Tendik', 'Sekolah', 'NUPTK', 'NIP', 'JK', 'Tempat Lahir', 'Tanggal Lahir', 'NIK', 'Jenis Tendik', 'Alamat', 'Status', 'Alergi'];
        const rows = data.map((t, i) => [safeStr(i+1), safeStr(t.fullName), safeStr(t.schoolName), safeStr(t.nuptk), safeStr(t.nip), safeStr(t.jk), safeStr(t.tempatLahir), safeStr(t.tanggalLahir), safeStr(t.nik), safeStr(t.jenisTendik), safeStr(t.alamat), safeStr(t.status || 'Aktif'), t.hasAllergy ? safeStr(t.allergyType) : 'Tidak']);
        const ws = workbook.addWorksheet('Guru/Tendik');
        addKop(ws, 'DATA PENERIMA MANFAAT - GURU/TENDIK', headers, rows, [5, 25, 25, 18, 18, 5, 15, 15, 20, 15, 20, 10, 12]);
      }

      // 3B
      if (scope === 'all' || ['Bumil', 'Busui', 'Balita'].includes(pmSubTab)) {
        const data = scope === 'all' ? beneficiaries3b : filtered3b;
        const headers = ['No', 'Kategori', 'Nama Penerima', 'NIK', 'JK', 'Tanggal Lahir', 'Posyandu', 'Detail Info Gizi', 'PJ Kader', 'No. Telp Kader', 'Status', 'Alergi'];
        const rows = data.map((b, i) => [safeStr(i+1), safeStr(b.subCategory), safeStr(b.fullName), safeStr(b.nik), safeStr(b.gender), safeStr(b.birthDate), safeStr(b.posyanduName), safeStr(b.detailInfo), safeStr(b.picName), safeStr(b.phone), safeStr(b.status), b.hasAllergy ? safeStr(b.allergyType) : 'Tidak']);
        const ws = workbook.addWorksheet(scope === 'all' ? 'Penerima 3B' : pmSubTab);
        addKop(ws, `DATA PENERIMA MANFAAT - ${pmSubTab.toUpperCase()}`, headers, rows, [5, 10, 25, 20, 5, 15, 20, 18, 18, 15, 10, 12]);
      }

      let filename: string;
      if (scope === 'all') {
        filename = keyword
          ? `data-semua-penerima-manfaat-${keyword}-${today}.xlsx`
          : `data-semua-penerima-manfaat-${today}.xlsx`;
      } else {
        const label = pmSubTab.toLowerCase();
        filename = keyword
          ? `data-${label}-${keyword}-${today}.xlsx`
          : `data-${label}-${today}.xlsx`;
      }

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);

      const sheetCount = workbook.worksheets.length;
      toast.success(`File ${filename} berhasil diexport (${sheetCount} sheet)`);
    } catch (err) {
      console.error('Export error:', err);
      toast.error('Gagal export data');
    } finally { setExporting(false); }
  };

  const filteredStudents = students.filter(s => s.nama.toLowerCase().includes(searchTerm.toLowerCase()) || s.schoolName.toLowerCase().includes(searchTerm.toLowerCase()) || s.nisn.includes(searchTerm) || s.nik.includes(searchTerm));
  const filteredTeachers = teachers.filter(t => t.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || t.schoolName.toLowerCase().includes(searchTerm.toLowerCase()) || t.nik.includes(searchTerm) || t.nip.includes(searchTerm));
  const filtered3b = beneficiaries3b.filter(b => b.subCategory === pmSubTab);

  // ===== MOBILE CARD COMPONENTS =====
  const StudentCard = ({ s, idx }: { s: StudentBeneficiary; idx: number }) => (
    <div className="bg-white rounded-xl border border-slate-200 p-3 space-y-2.5">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <span className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs font-bold shrink-0">{idx + 1}</span>
          <div className="min-w-0">
            <p className="font-bold text-slate-800 text-sm truncate">{s.nama}</p>
            <p className="text-[11px] text-slate-400">{s.schoolName}</p>
          </div>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${s.jk === 'L' ? 'bg-blue-50 text-blue-600' : 'bg-pink-50 text-pink-600'}`}>{s.jk}</span>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
        <div><span className="text-slate-400">NISN:</span> <span className="font-mono text-slate-600">{s.nisn}</span></div>
        <div><span className="text-slate-400">NIPD:</span> <span className="font-mono text-slate-600">{s.nipd}</span></div>
        <div><span className="text-slate-400">NIK:</span> <span className="font-mono text-slate-600">{s.nik}</span></div>
        <div><span className="text-slate-400">Kelas:</span> <span className="font-bold text-slate-700">{s.kelas}</span></div>
        <div><span className="text-slate-400">TTL:</span> <span className="text-slate-600">{s.tempatLahir}, {s.tanggalLahir}</span></div>
        <div><span className="text-slate-400">Umur:</span> <span className="font-bold text-blue-600">{calculateAge(s.tanggalLahir)}</span></div>
        <div><span className="text-slate-400">BB/TB:</span> <span className="font-semibold text-emerald-600">{s.beratBadan} kg / {s.tinggiBadan} cm</span></div>
        <div><span className="text-slate-400">Agama:</span> <span className="text-slate-600">{s.agama}</span></div>
      </div>
      {s.alamat && s.alamat !== '-' && <p className="text-[11px] text-slate-400 truncate"><span className="font-medium">Alamat:</span> {s.alamat}</p>}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <div className="text-[11px] text-slate-400"><span className="font-medium">Ayah:</span> {s.namaAyah} <span className="mx-1">|</span> <span className="font-medium">Ibu:</span> {s.namaIbu}</div>
        {s.hasAllergy ? (
          <span className="px-2 py-0.5 bg-rose-50 text-rose-600 rounded-full text-[11px] font-bold flex items-center gap-1"><AlertCircle className="w-3 h-3" />{s.allergyType}</span>
        ) : <span className="px-2 py-0.5 bg-slate-50 text-slate-400 rounded-full text-[11px]">Aman</span>}
      </div>
      <div className="flex justify-end gap-1.5 pt-1">
        <button onClick={() => handleEdit('students', s)} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 text-[11px] font-semibold hover:bg-blue-100"><Pencil className="w-3 h-3" />Edit</button>
        <button onClick={() => handleDelete('students', s.id)} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-500 text-[11px] font-semibold hover:bg-rose-100"><Trash2 className="w-3 h-3" />Hapus</button>
      </div>
    </div>
  );

  const TeacherCard = ({ t, idx }: { t: TeacherBeneficiary; idx: number }) => (
    <div className="bg-white rounded-xl border border-slate-200 p-3 space-y-2.5">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <span className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs font-bold shrink-0">{idx + 1}</span>
          <div className="min-w-0">
            <p className="font-bold text-slate-800 text-sm truncate">{t.fullName}</p>
            <p className="text-[11px] text-emerald-600 font-medium">{t.schoolName}</p>
          </div>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${t.jk === 'L' ? 'bg-blue-50 text-blue-600' : 'bg-pink-50 text-pink-600'}`}>{t.jk}</span>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
        <div><span className="text-slate-400">NUPTK:</span> <span className="font-mono text-slate-600">{t.nuptk}</span></div>
        <div><span className="text-slate-400">NIP:</span> <span className="font-mono text-slate-600">{t.nip}</span></div>
        <div><span className="text-slate-400">NIK:</span> <span className="font-mono text-slate-600">{t.nik}</span></div>
        <div><span className="text-slate-400">Jabatan:</span> <span className="font-bold text-slate-700">{t.jenisTendik}</span></div>
        <div><span className="text-slate-400">TTL:</span> <span className="text-slate-600">{t.tempatLahir}, {t.tanggalLahir}</span></div>
        <div><span className="text-slate-400">Umur:</span> <span className="font-bold text-blue-600">{calculateAge(t.tanggalLahir)}</span></div>
      </div>
      {t.alamat && t.alamat !== '-' && <p className="text-[11px] text-slate-400 truncate"><span className="font-medium">Alamat:</span> {t.alamat}</p>}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        {t.hasAllergy ? (
          <span className="px-2 py-0.5 bg-rose-50 text-rose-600 rounded-full text-[11px] font-bold flex items-center gap-1"><AlertCircle className="w-3 h-3" />{t.allergyType}</span>
        ) : <span className="px-2 py-0.5 bg-slate-50 text-slate-400 rounded-full text-[11px]">Aman</span>}
        <div className="flex gap-1.5">
          <button onClick={() => handleEdit('teachers', t)} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 text-[11px] font-semibold hover:bg-blue-100"><Pencil className="w-3 h-3" />Edit</button>
          <button onClick={() => handleDelete('teachers', t.id)} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-500 text-[11px] font-semibold hover:bg-rose-100"><Trash2 className="w-3 h-3" />Hapus</button>
        </div>
      </div>
    </div>
  );

  const Card3B = ({ b, idx }: { b: Beneficiary3B; idx: number }) => (
    <div className="bg-white rounded-xl border border-slate-200 p-3 space-y-2.5">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <span className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs font-bold shrink-0">{idx + 1}</span>
          <div className="min-w-0">
            <p className="font-bold text-slate-800 text-sm truncate">{b.fullName}</p>
            <p className="text-[11px] text-slate-400">NIK: {b.nik}</p>
          </div>
        </div>
        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full text-[11px] font-bold">{b.status}</span>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
        <div className="col-span-2"><span className="text-slate-400">Posyandu:</span> <span className="font-medium text-slate-700">{b.posyanduName}</span></div>
        <div><span className="text-slate-400">Umur:</span> <span className="font-bold text-blue-600">{calculateAge(b.birthDate)}</span></div>
        <div><span className="text-slate-400">Info Gizi:</span> <span className="font-medium text-amber-700">{b.detailInfo}</span></div>
        <div className="col-span-2"><span className="text-slate-400">Kader:</span> <span className="font-medium text-slate-700">{b.picName}</span> {b.phone && <a href={`tel:${b.phone}`} className="text-blue-500 ml-1">{b.phone}</a>}</div>
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        {b.hasAllergy ? (
          <span className="px-2 py-0.5 bg-rose-50 text-rose-600 rounded-full text-[11px] font-bold flex items-center gap-1"><AlertCircle className="w-3 h-3" />{b.allergyType}</span>
        ) : <span className="px-2 py-0.5 bg-slate-50 text-slate-400 rounded-full text-[11px]">Aman</span>}
        <div className="flex gap-1.5">
          <button onClick={() => handleEdit('beneficiaries-3b', b)} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 text-[11px] font-semibold hover:bg-blue-100"><Pencil className="w-3 h-3" />Edit</button>
          <button onClick={() => handleDelete('beneficiaries-3b', b.id)} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-500 text-[11px] font-semibold hover:bg-rose-100"><Trash2 className="w-3 h-3" />Hapus</button>
        </div>
      </div>
    </div>
  );

  // ===== RENDER CONTENT =====
  const renderContent = () => {
    switch (activeMenu) {
      case 'Dashboard':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Siswa</span>
                  <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg"><GraduationCap className="w-4 h-4" /></div>
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800">{students.length}</h2>
              </div>
              <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Guru/Tendik</span>
                  <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg"><UserCheck className="w-4 h-4" /></div>
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800">{teachers.length}</h2>
              </div>
              <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Penerima 3B</span>
                  <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg"><Baby className="w-4 h-4" /></div>
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800">{beneficiaries3b.length}</h2>
              </div>
              <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Peringatan Alergi</span>
                  <div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg"><AlertCircle className="w-4 h-4" /></div>
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-rose-600">{[...students.filter(s=>s.hasAllergy), ...teachers.filter(t=>t.hasAllergy), ...beneficiaries3b.filter(b=>b.hasAllergy)].length}</h2>
              </div>
            </div>
          </div>
        );

      case 'Penerima Manfaat':
        return (
          <div className="space-y-3 max-w-full">
            {/* TOOLBAR */}
            <div className="bg-white p-2.5 rounded-2xl shadow-sm border border-slate-200 space-y-2.5">
              <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                <button onClick={() => handleMainTabChange('Sekolah')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex-1 justify-center ${pmMainTab === 'Sekolah' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'}`}>
                  <School className="w-3.5 h-3.5" /><span>Sekolah</span>
                </button>
                <button onClick={() => handleMainTabChange('3B')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex-1 justify-center ${pmMainTab === '3B' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'}`}>
                  <Baby className="w-3.5 h-3.5" /><span>3B</span>
                </button>
              </div>
              {pmMainTab === 'Sekolah' ? (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 -mx-1 px-1">
                  <button onClick={() => setPmSubTab('Siswa')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${pmSubTab === 'Siswa' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-bold' : 'text-slate-500 hover:bg-slate-50'}`}>
                    <GraduationCap className="w-3.5 h-3.5" /><span>Siswa ({filteredStudents.length})</span>
                  </button>
                  <button onClick={() => setPmSubTab('Guru')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${pmSubTab === 'Guru' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-bold' : 'text-slate-500 hover:bg-slate-50'}`}>
                    <UserCheck className="w-3.5 h-3.5" /><span>Guru/Tendik ({filteredTeachers.length})</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 -mx-1 px-1">
                  <button onClick={() => setPmSubTab('Bumil')} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${pmSubTab === 'Bumil' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold' : 'text-slate-500'}`}>
                    <Heart className="w-3.5 h-3.5 text-rose-500" /><span>Bumil</span>
                  </button>
                  <button onClick={() => setPmSubTab('Busui')} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${pmSubTab === 'Busui' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold' : 'text-slate-500'}`}>
                    <Milk className="w-3.5 h-3.5 text-blue-500" /><span>Busui</span>
                  </button>
                  <button onClick={() => setPmSubTab('Balita')} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${pmSubTab === 'Balita' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold' : 'text-slate-500'}`}>
                    <Baby className="w-3.5 h-3.5 text-amber-500" /><span>Balita</span>
                  </button>
                </div>
              )}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex-1 min-w-[160px]">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder={`Cari ${pmSubTab}...`} className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={openAddModal} className="flex items-center gap-1 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white px-2.5 py-2 rounded-lg text-xs font-bold transition-all shadow-sm">
                    <Plus className="w-4 h-4" /><span className="sm:inline hidden">Tambah</span>
                  </button>
                  <input ref={csvInputRef} type="file" accept=".csv" onChange={handleImportCSV} className="hidden" />
                  <button onClick={() => csvInputRef.current?.click()} disabled={importing} className="flex items-center gap-1 bg-blue-500 hover:bg-blue-600 active:scale-95 text-white px-2.5 py-2 rounded-lg text-xs font-bold transition-all shadow-sm disabled:opacity-50" title="Import CSV">
                    {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    <span className="sm:inline hidden">Import</span>
                  </button>
                  <button onClick={() => handleExportExcel('current')} disabled={exporting} className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white px-2.5 py-2 rounded-lg text-xs font-bold transition-all shadow-sm disabled:opacity-50" title="Export Excel">
                    {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    <span className="sm:inline hidden">Export</span>
                  </button>
                  <button onClick={() => handleExportExcel('all')} disabled={exporting} className="flex items-center gap-1 bg-violet-500 hover:bg-violet-600 active:scale-95 text-white px-2.5 py-2 rounded-lg text-xs font-bold transition-all shadow-sm disabled:opacity-50" title="Export Semua Data">
                    {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    <span className="sm:inline hidden">Semua</span>
                  </button>
                  <button onClick={handleDeleteAll} disabled={deletingAll} className="flex items-center gap-1 bg-rose-500 hover:bg-rose-600 active:scale-95 text-white px-2.5 py-2 rounded-lg text-xs font-bold transition-all shadow-sm disabled:opacity-50" title="Hapus Semua Data">
                    {deletingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    <span className="sm:inline hidden">Hapus Semua</span>
                  </button>
                </div>
              </div>
            </div>

            {/* DESKTOP: TABLE VIEW (hidden on mobile) */}
            <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                {pmMainTab === 'Sekolah' && pmSubTab === 'Siswa' && (
                  <table className="min-w-max w-full text-left border-collapse text-xs whitespace-nowrap">
                    <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-500 uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="py-2.5 px-3 text-center border-r border-slate-200">No</th>
                        <th className="py-2.5 px-3 border-r border-slate-200">Nama Siswa</th>
                        <th className="py-2.5 px-3 border-r border-slate-200 bg-emerald-50/50 text-emerald-800">Sekolah</th>
                        <th className="py-2.5 px-3 border-r border-slate-200">NIPD</th>
                        <th className="py-2.5 px-3 text-center border-r border-slate-200">JK</th>
                        <th className="py-2.5 px-3 border-r border-slate-200">NISN</th>
                        <th className="py-2.5 px-3 border-r border-slate-200">Tempat, Tgl Lahir</th>
                        <th className="py-2.5 px-3 text-center border-r border-slate-200 bg-blue-50/50 text-blue-800">Umur</th>
                        <th className="py-2.5 px-3 border-r border-slate-200">NIK</th>
                        <th className="py-2.5 px-3 border-r border-slate-200">Agama</th>
                        <th className="py-2.5 px-3 border-r border-slate-200">Alamat</th>
                        <th className="py-2.5 px-3 text-center border-r border-slate-200">Kelas</th>
                        <th className="py-2.5 px-3 text-center border-r border-slate-200">BB</th>
                        <th className="py-2.5 px-3 text-center border-r border-slate-200">TB</th>
                        <th className="py-2.5 px-3 border-r border-slate-200">Orang Tua</th>
                        <th className="py-2.5 px-3 border-r border-slate-200">Alergi</th>
                        <th className="py-2.5 px-3 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {filteredStudents.length > 0 ? filteredStudents.map((s, idx) => (
                        <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-2.5 px-3 text-center border-r border-slate-100 font-semibold text-slate-400">{idx+1}</td>
                          <td className="py-2.5 px-3 font-semibold text-slate-900 border-r border-slate-100">{s.nama}</td>
                          <td className="py-2.5 px-3 border-r border-slate-100 font-bold text-emerald-700 bg-emerald-50/20"><span className="flex items-center space-x-1"><School className="w-3.5 h-3.5 text-emerald-600 shrink-0" /><span>{s.schoolName}</span></span></td>
                          <td className="py-2.5 px-3 border-r border-slate-100 font-mono text-slate-500">{s.nipd}</td>
                          <td className="py-2.5 px-3 text-center border-r border-slate-100 font-bold">{s.jk}</td>
                          <td className="py-2.5 px-3 border-r border-slate-100 font-mono text-slate-500">{s.nisn}</td>
                          <td className="py-2.5 px-3 border-r border-slate-100">{s.tempatLahir}, {s.tanggalLahir}</td>
                          <td className="py-2.5 px-3 text-center border-r border-slate-100 font-bold text-blue-700 bg-blue-50/20"><span className="px-2 py-0.5 rounded-full bg-blue-100/80 text-blue-800 text-[11px]">{calculateAge(s.tanggalLahir)}</span></td>
                          <td className="py-2.5 px-3 border-r border-slate-100 font-mono text-slate-500">{s.nik}</td>
                          <td className="py-2.5 px-3 border-r border-slate-100">{s.agama}</td>
                          <td className="py-2.5 px-3 border-r border-slate-100 max-w-[180px] truncate">{s.alamat}</td>
                          <td className="py-2.5 px-3 text-center border-r border-slate-100"><span className="px-2 py-0.5 bg-slate-100 rounded text-slate-800 font-bold">{s.kelas}</span></td>
                          <td className="py-2.5 px-3 text-center border-r border-slate-100 font-semibold text-emerald-700">{s.beratBadan} kg</td>
                          <td className="py-2.5 px-3 text-center border-r border-slate-100 font-semibold text-blue-700">{s.tinggiBadan} cm</td>
                          <td className="py-2.5 px-3 border-r border-slate-100"><p className="font-medium text-slate-800">A: {s.namaAyah}</p><p className="text-slate-400 text-[11px]">I: {s.namaIbu}</p></td>
                          <td className="py-2.5 px-3 border-r border-slate-100">{s.hasAllergy ? <span className="px-2 py-0.5 bg-rose-100 text-rose-700 rounded font-bold flex items-center space-x-1 w-fit"><AlertCircle className="w-3 h-3" /><span>{s.allergyType}</span></span> : <span className="px-2 py-0.5 bg-slate-100 text-slate-400 rounded">Aman</span>}</td>
                          <td className="py-2.5 px-3 text-center"><div className="flex items-center justify-center space-x-1"><button onClick={() => handleEdit('students', s)} className="text-blue-400 hover:text-blue-600 p-1" title="Edit"><Pencil className="w-3.5 h-3.5" /></button><button onClick={() => handleDelete('students', s.id)} className="text-slate-400 hover:text-rose-500 p-1" title="Hapus"><Trash2 className="w-3.5 h-3.5" /></button></div></td>
                        </tr>
                      )) : (<tr><td colSpan={17} className="py-8 text-center text-slate-400 italic">Data siswa tidak ditemukan...</td></tr>)}
                    </tbody>
                  </table>
                )}

                {pmMainTab === 'Sekolah' && pmSubTab === 'Guru' && (
                  <table className="min-w-max w-full text-left border-collapse text-xs whitespace-nowrap">
                    <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-500 uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="py-2.5 px-3 text-center border-r border-slate-200">No</th>
                        <th className="py-2.5 px-3 border-r border-slate-200">Nama Guru / Tendik</th>
                        <th className="py-2.5 px-3 border-r border-slate-200 bg-emerald-50/50 text-emerald-800">Sekolah</th>
                        <th className="py-2.5 px-3 border-r border-slate-200">NUPTK</th>
                        <th className="py-2.5 px-3 border-r border-slate-200">NIP</th>
                        <th className="py-2.5 px-3 text-center border-r border-slate-200">JK</th>
                        <th className="py-2.5 px-3 border-r border-slate-200">Tempat, Tgl Lahir</th>
                        <th className="py-2.5 px-3 text-center border-r border-slate-200 bg-blue-50/50 text-blue-800">Umur</th>
                        <th className="py-2.5 px-3 border-r border-slate-200">NIK</th>
                        <th className="py-2.5 px-3 border-r border-slate-200">Jenis Tendik</th>
                        <th className="py-2.5 px-3 border-r border-slate-200">Alamat</th>
                        <th className="py-2.5 px-3 border-r border-slate-200">Alergi</th>
                        <th className="py-2.5 px-3 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {filteredTeachers.length > 0 ? filteredTeachers.map((t, idx) => (
                        <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-2.5 px-3 text-center border-r border-slate-100 font-semibold text-slate-400">{idx+1}</td>
                          <td className="py-2.5 px-3 font-semibold text-slate-900 border-r border-slate-100">{t.fullName}</td>
                          <td className="py-2.5 px-3 border-r border-slate-100 font-bold text-emerald-700 bg-emerald-50/20"><span className="flex items-center space-x-1"><School className="w-3.5 h-3.5 text-emerald-600 shrink-0" /><span>{t.schoolName}</span></span></td>
                          <td className="py-2.5 px-3 border-r border-slate-100 font-mono text-slate-500">{t.nuptk}</td>
                          <td className="py-2.5 px-3 border-r border-slate-100 font-mono text-slate-500">{t.nip}</td>
                          <td className="py-2.5 px-3 text-center border-r border-slate-100 font-bold">{t.jk}</td>
                          <td className="py-2.5 px-3 border-r border-slate-100">{t.tempatLahir}, {t.tanggalLahir}</td>
                          <td className="py-2.5 px-3 text-center border-r border-slate-100 font-bold text-blue-700 bg-blue-50/20"><span className="px-2 py-0.5 rounded-full bg-blue-100/80 text-blue-800 text-[11px]">{calculateAge(t.tanggalLahir)}</span></td>
                          <td className="py-2.5 px-3 border-r border-slate-100 font-mono text-slate-500">{t.nik}</td>
                          <td className="py-2.5 px-3 border-r border-slate-100"><span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-bold border border-slate-200/60">{t.jenisTendik}</span></td>
                          <td className="py-2.5 px-3 border-r border-slate-100 max-w-[180px] truncate">{t.alamat}</td>
                          <td className="py-2.5 px-3 border-r border-slate-100">{t.hasAllergy ? <span className="px-2 py-0.5 bg-rose-100 text-rose-700 rounded font-bold flex items-center space-x-1 w-fit"><AlertCircle className="w-3 h-3" /><span>{t.allergyType}</span></span> : <span className="px-2 py-0.5 bg-slate-100 text-slate-400 rounded">Aman</span>}</td>
                          <td className="py-2.5 px-3 text-center"><div className="flex items-center justify-center space-x-1"><button onClick={() => handleEdit('teachers', t)} className="text-blue-400 hover:text-blue-600 p-1" title="Edit"><Pencil className="w-3.5 h-3.5" /></button><button onClick={() => handleDelete('teachers', t.id)} className="text-slate-400 hover:text-rose-500 p-1" title="Hapus"><Trash2 className="w-3.5 h-3.5" /></button></div></td>
                        </tr>
                      )) : (<tr><td colSpan={13} className="py-8 text-center text-slate-400 italic">Data guru / tendik tidak ditemukan...</td></tr>)}
                    </tbody>
                  </table>
                )}

                {pmMainTab === '3B' && (
                  <table className="min-w-max w-full text-left border-collapse text-xs whitespace-nowrap">
                    <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-500 uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="py-2.5 px-3 text-center border-r border-slate-200">No</th>
                        <th className="py-2.5 px-3 border-r border-slate-200">Nama Penerima / NIK</th>
                        <th className="py-2.5 px-3 border-r border-slate-200">Titik Posyandu</th>
                        <th className="py-2.5 px-3 text-center border-r border-slate-200 bg-blue-50/50 text-blue-800">Umur</th>
                        <th className="py-2.5 px-3 border-r border-slate-200">Detail Info Gizi</th>
                        <th className="py-2.5 px-3 border-r border-slate-200">PJ Kader / WA</th>
                        <th className="py-2.5 px-3 border-r border-slate-200">Alergi Makanan</th>
                        <th className="py-2.5 px-3 border-r border-slate-200">Status</th>
                        <th className="py-2.5 px-3 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {filtered3b.length > 0 ? filtered3b.map((b, idx) => (
                        <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-2.5 px-3 text-center border-r border-slate-100 font-semibold text-slate-400">{idx+1}</td>
                          <td className="py-2.5 px-3 border-r border-slate-100"><p className="font-semibold text-slate-800">{b.fullName}</p><p className="text-slate-400 text-[11px]">NIK: {b.nik}</p></td>
                          <td className="py-2.5 px-3 border-r border-slate-100 font-medium text-slate-800">{b.posyanduName}</td>
                          <td className="py-2.5 px-3 text-center border-r border-slate-100 font-bold text-blue-700">{calculateAge(b.birthDate)}</td>
                          <td className="py-2.5 px-3 border-r border-slate-100"><span className="px-2 py-0.5 bg-amber-50 text-amber-800 rounded font-semibold">{b.detailInfo}</span></td>
                          <td className="py-2.5 px-3 border-r border-slate-100"><p className="font-semibold text-slate-800">{b.picName}</p><p className="text-slate-500">{b.phone}</p></td>
                          <td className="py-2.5 px-3 border-r border-slate-100">{b.hasAllergy ? <span className="px-2 py-0.5 bg-rose-100 text-rose-700 rounded font-bold">{b.allergyType}</span> : <span className="px-2 py-0.5 bg-slate-100 text-slate-400 rounded">Aman</span>}</td>
                          <td className="py-2.5 px-3 border-r border-slate-100"><span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-semibold">{b.status}</span></td>
                          <td className="py-2.5 px-3 text-center"><div className="flex items-center justify-center space-x-1"><button onClick={() => handleEdit('beneficiaries-3b', b)} className="text-blue-400 hover:text-blue-600 p-1" title="Edit"><Pencil className="w-3.5 h-3.5" /></button><button onClick={() => handleDelete('beneficiaries-3b', b.id)} className="text-slate-400 hover:text-rose-500 p-1" title="Hapus"><Trash2 className="w-3.5 h-3.5" /></button></div></td>
                        </tr>
                      )) : (<tr><td colSpan={9} className="py-8 text-center text-slate-400 italic">Data {pmSubTab} tidak ditemukan...</td></tr>)}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* MOBILE: CARD VIEW (hidden on desktop) */}
            <div className="md:hidden space-y-3">
              {pmMainTab === 'Sekolah' && pmSubTab === 'Siswa' && (
                filteredStudents.length > 0 ? filteredStudents.map((s, idx) => <StudentCard key={s.id} s={s} idx={idx} />) : (
                  <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400 italic">Data siswa tidak ditemukan...</div>
                )
              )}
              {pmMainTab === 'Sekolah' && pmSubTab === 'Guru' && (
                filteredTeachers.length > 0 ? filteredTeachers.map((t, idx) => <TeacherCard key={t.id} t={t} idx={idx} />) : (
                  <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400 italic">Data guru / tendik tidak ditemukan...</div>
                )
              )}
              {pmMainTab === '3B' && (
                filtered3b.length > 0 ? filtered3b.map((b, idx) => <Card3B key={b.id} b={b} idx={idx} />) : (
                  <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400 italic">Data {pmSubTab} tidak ditemukan...</div>
                )
              )}
            </div>
          </div>
        );

      case 'Gudang & Stok':
        return <StockModule />;

      case 'Ahli Gizi & Menu':
        return <AhliGiziModule />;

      default:
        return <div className="p-4 bg-white rounded-xl border border-slate-200">Modul {activeMenu} — segera hadir</div>;
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="text-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mx-auto" />
        <p className="text-sm text-slate-400 font-medium">Memuat data...</p>
      </div>
    </div>
  );

  return (
    <div className="flex bg-slate-100 min-h-screen">
      <Sidebar activeMenu={activeMenu} setActiveMenu={setActiveMenu} isMobileOpen={mobileSidebarOpen} onMobileClose={() => setMobileSidebarOpen(false)} />
      <main className="flex-1 min-w-0 flex flex-col">
        {/* MOBILE HEADER */}
        <header className="lg:hidden sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-3 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <button onClick={() => setMobileSidebarOpen(true)} className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
              <Menu className="w-5 h-5 text-slate-600" />
            </button>
            <div className="flex items-center gap-2">
              <Image src="/bgn.png" alt="BGN" width={28} height={28} className="rounded-lg" />
              <div>
                <h1 className="text-sm font-bold text-slate-800 leading-tight">Dapur SPPG Sangia Wambulu</h1>
                <p className="text-[10px] text-slate-400">{activeMenu}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={openAddModal} className="p-2 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 active:scale-95 transition-all">
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* DESKTOP HEADER */}
        <header className="hidden lg:block p-5 pb-2">
          <div className="flex justify-between items-end border-b border-slate-200/60 pb-2">
            <div>
              <h1 className="text-xl font-extrabold text-slate-800 leading-none">{activeMenu}</h1>
              <p className="text-slate-400 text-xs mt-1">Sistem Operasional Dapur SPPG Sangia Wambulu BGN</p>
            </div>
          </div>
        </header>

        <div className="flex-1 p-3 lg:p-5 overflow-y-auto">
          {renderContent()}
        </div>
      </main>

      {/* MODAL FORM - Full screen on mobile, centered on desktop */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center">
          <div className="bg-white w-full sm:max-w-xl sm:rounded-2xl shadow-2xl border border-slate-100 overflow-hidden max-h-[95vh] sm:max-h-[90vh] flex flex-col rounded-t-2xl">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <div>
                <h3 className="text-base font-bold text-slate-800">{editingId ? 'Edit Data' : 'Tambah Data'} {pmSubTab}</h3>
                <p className="text-xs text-slate-500">{editingId ? 'Ubah data yang sudah ada' : 'Form Isian Format Tabel Excel BGN'}</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-xl">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-3 overflow-y-auto flex-1">
              {pmMainTab === 'Sekolah' && pmSubTab === 'Siswa' && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="sm:col-span-2"><label className="block text-xs font-semibold text-slate-700 mb-1">Nama Sekolah *</label><input type="text" required placeholder="SDN 01 Sambas" value={formSiswa.schoolName} onChange={(e) => setFormSiswa({...formSiswa, schoolName: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" /></div>
                    <div className="sm:col-span-2"><label className="block text-xs font-semibold text-slate-700 mb-1">Nama Lengkap Siswa *</label><input type="text" required placeholder="Ahmad Rizky Pratama" value={formSiswa.nama} onChange={(e) => setFormSiswa({...formSiswa, nama: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" /></div>
                    <div><label className="block text-xs font-semibold text-slate-700 mb-1">NIPD</label><input type="text" placeholder="21221001" value={formSiswa.nipd} onChange={(e) => setFormSiswa({...formSiswa, nipd: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" /></div>
                    <div><label className="block text-xs font-semibold text-slate-700 mb-1">NISN</label><input type="text" placeholder="0012345678" value={formSiswa.nisn} onChange={(e) => setFormSiswa({...formSiswa, nisn: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" /></div>
                    <div><label className="block text-xs font-semibold text-slate-700 mb-1">NIK</label><input type="text" placeholder="610102..." value={formSiswa.nik} onChange={(e) => setFormSiswa({...formSiswa, nik: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" /></div>
                    <div><label className="block text-xs font-semibold text-slate-700 mb-1">Jenis Kelamin</label><select value={formSiswa.jk} onChange={(e) => setFormSiswa({...formSiswa, jk: e.target.value as 'L'|'P'})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"><option value="L">Laki-laki (L)</option><option value="P">Perempuan (P)</option></select></div>
                    <div><label className="block text-xs font-semibold text-slate-700 mb-1">Tempat Lahir</label><input type="text" placeholder="Sambas" value={formSiswa.tempatLahir} onChange={(e) => setFormSiswa({...formSiswa, tempatLahir: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" /></div>
                    <div><label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal Lahir</label><input type="date" value={formSiswa.tanggalLahir} onChange={(e) => setFormSiswa({...formSiswa, tanggalLahir: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" />{formSiswa.tanggalLahir && <p className="text-[11px] text-blue-600 font-semibold mt-1 flex items-center gap-1"><Calendar className="w-3 h-3" /><span>Umur: {calculateAge(formSiswa.tanggalLahir)}</span></p>}</div>
                    <div><label className="block text-xs font-semibold text-slate-700 mb-1">Kelas *</label><input type="text" required placeholder="4B" value={formSiswa.kelas} onChange={(e) => setFormSiswa({...formSiswa, kelas: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" /></div>
                    <div><label className="block text-xs font-semibold text-slate-700 mb-1">Agama</label><input type="text" placeholder="Islam" value={formSiswa.agama} onChange={(e) => setFormSiswa({...formSiswa, agama: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" /></div>
                    <div><label className="block text-xs font-semibold text-slate-700 mb-1">BB (kg)</label><input type="number" placeholder="28" value={formSiswa.beratBadan} onChange={(e) => setFormSiswa({...formSiswa, beratBadan: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" /></div>
                    <div><label className="block text-xs font-semibold text-slate-700 mb-1">TB (cm)</label><input type="number" placeholder="132" value={formSiswa.tinggiBadan} onChange={(e) => setFormSiswa({...formSiswa, tinggiBadan: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" /></div>
                    <div><label className="block text-xs font-semibold text-slate-700 mb-1">Nama Ayah</label><input type="text" placeholder="Hendra" value={formSiswa.namaAyah} onChange={(e) => setFormSiswa({...formSiswa, namaAyah: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" /></div>
                    <div><label className="block text-xs font-semibold text-slate-700 mb-1">Nama Ibu</label><input type="text" placeholder="Siti Sarah" value={formSiswa.namaIbu} onChange={(e) => setFormSiswa({...formSiswa, namaIbu: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" /></div>
                    <div className="sm:col-span-2"><label className="block text-xs font-semibold text-slate-700 mb-1">Alamat</label><textarea rows={2} placeholder="Jl. Merdeka No. 12" value={formSiswa.alamat} onChange={(e) => setFormSiswa({...formSiswa, alamat: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" /></div>
                  </div>
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-2">
                    <label className="flex items-center space-x-2 text-xs font-bold text-rose-800 cursor-pointer">
                      <input type="checkbox" checked={formSiswa.hasAllergy} onChange={(e) => setFormSiswa({...formSiswa, hasAllergy: e.target.checked})} className="rounded w-4 h-4" />
                      <span>Siswa Memiliki Alergi Makanan?</span>
                    </label>
                    {formSiswa.hasAllergy && <input type="text" placeholder="Contoh: Udang, Telur, Kacang" value={formSiswa.allergyType} onChange={(e) => setFormSiswa({...formSiswa, allergyType: e.target.value})} className="w-full px-3 py-2 bg-white border border-rose-200 rounded-lg text-sm" />}
                  </div>
                </>
              )}

              {pmMainTab === 'Sekolah' && pmSubTab === 'Guru' && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="sm:col-span-2"><label className="block text-xs font-semibold text-slate-700 mb-1">Nama Sekolah *</label><input type="text" required placeholder="SDN 01 Sambas" value={formGuru.schoolName} onChange={(e) => setFormGuru({...formGuru, schoolName: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" /></div>
                    <div className="sm:col-span-2"><label className="block text-xs font-semibold text-slate-700 mb-1">Nama Guru / Tendik *</label><input type="text" required placeholder="Bpk. Supardi, S.Pd" value={formGuru.fullName} onChange={(e) => setFormGuru({...formGuru, fullName: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" /></div>
                    <div><label className="block text-xs font-semibold text-slate-700 mb-1">NUPTK</label><input type="text" placeholder="1234567890123456" value={formGuru.nuptk} onChange={(e) => setFormGuru({...formGuru, nuptk: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" /></div>
                    <div><label className="block text-xs font-semibold text-slate-700 mb-1">NIP</label><input type="text" placeholder="198801012015011001" value={formGuru.nip} onChange={(e) => setFormGuru({...formGuru, nip: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" /></div>
                    <div><label className="block text-xs font-semibold text-slate-700 mb-1">NIK</label><input type="text" placeholder="610102..." value={formGuru.nik} onChange={(e) => setFormGuru({...formGuru, nik: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" /></div>
                    <div><label className="block text-xs font-semibold text-slate-700 mb-1">Jenis Kelamin</label><select value={formGuru.jk} onChange={(e) => setFormGuru({...formGuru, jk: e.target.value as 'L'|'P'})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"><option value="L">Laki-laki (L)</option><option value="P">Perempuan (P)</option></select></div>
                    <div><label className="block text-xs font-semibold text-slate-700 mb-1">Tempat Lahir</label><input type="text" placeholder="Sambas" value={formGuru.tempatLahir} onChange={(e) => setFormGuru({...formGuru, tempatLahir: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" /></div>
                    <div><label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal Lahir</label><input type="date" value={formGuru.tanggalLahir} onChange={(e) => setFormGuru({...formGuru, tanggalLahir: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" />{formGuru.tanggalLahir && <p className="text-[11px] text-blue-600 font-semibold mt-1 flex items-center gap-1"><Calendar className="w-3 h-3" /><span>Umur: {calculateAge(formGuru.tanggalLahir)}</span></p>}</div>
                    <div className="sm:col-span-2"><label className="block text-xs font-semibold text-slate-700 mb-1">Jenis Tendik *</label><select value={formGuru.jenisTendik} onChange={(e) => setFormGuru({...formGuru, jenisTendik: e.target.value as any})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"><option value="Kepala Sekolah">Kepala Sekolah</option><option value="Guru">Guru</option><option value="Tendik">Tendik</option><option value="Non Tendik">Non Tendik</option></select></div>
                    <div className="sm:col-span-2"><label className="block text-xs font-semibold text-slate-700 mb-1">Alamat</label><textarea rows={2} placeholder="Jl. Pemuda No. 05" value={formGuru.alamat} onChange={(e) => setFormGuru({...formGuru, alamat: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" /></div>
                  </div>
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-2">
                    <label className="flex items-center space-x-2 text-xs font-bold text-rose-800 cursor-pointer">
                      <input type="checkbox" checked={formGuru.hasAllergy} onChange={(e) => setFormGuru({...formGuru, hasAllergy: e.target.checked})} className="rounded w-4 h-4" />
                      <span>Memiliki Alergi Makanan?</span>
                    </label>
                    {formGuru.hasAllergy && <input type="text" placeholder="Contoh: Udang, Telur, Seafood" value={formGuru.allergyType} onChange={(e) => setFormGuru({...formGuru, allergyType: e.target.value})} className="w-full px-3 py-2 bg-white border border-rose-200 rounded-lg text-sm" />}
                  </div>
                </>
              )}

              {pmMainTab === '3B' && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="sm:col-span-2"><label className="block text-xs font-semibold text-slate-700 mb-1">Nama Posyandu *</label><input type="text" required placeholder="Posyandu Melati 01" value={form3B.posyanduName} onChange={(e) => setForm3B({...form3B, posyanduName: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" /></div>
                    <div className="sm:col-span-2"><label className="block text-xs font-semibold text-slate-700 mb-1">Nama Penerima ({pmSubTab}) *</label><input type="text" required placeholder="Nama Ibu / Anak" value={form3B.fullName} onChange={(e) => setForm3B({...form3B, fullName: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" /></div>
                    <div><label className="block text-xs font-semibold text-slate-700 mb-1">NIK</label><input type="text" placeholder="610102..." value={form3B.nik} onChange={(e) => setForm3B({...form3B, nik: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" /></div>
                    <div><label className="block text-xs font-semibold text-slate-700 mb-1">Jenis Kelamin</label><select value={form3B.gender} onChange={(e) => setForm3B({...form3B, gender: e.target.value as 'L'|'P'})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"><option value="P">Perempuan (P)</option><option value="L">Laki-laki (L)</option></select></div>
                    <div><label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal Lahir</label><input type="date" value={form3B.birthDate} onChange={(e) => setForm3B({...form3B, birthDate: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" />{form3B.birthDate && <p className="text-[11px] text-blue-600 font-semibold mt-1 flex items-center gap-1"><Calendar className="w-3 h-3" /><span>Umur: {calculateAge(form3B.birthDate)}</span></p>}</div>
                    <div><label className="block text-xs font-semibold text-slate-700 mb-1">Detail Info Gizi</label><input type="text" placeholder="Usia Hamil: 24 Minggu" value={form3B.detailInfo} onChange={(e) => setForm3B({...form3B, detailInfo: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" /></div>
                    <div><label className="block text-xs font-semibold text-slate-700 mb-1">PJ Kader</label><input type="text" placeholder="Ibu Dewi (Kader)" value={form3B.picName} onChange={(e) => setForm3B({...form3B, picName: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" /></div>
                    <div><label className="block text-xs font-semibold text-slate-700 mb-1">No. Telepon Kader</label><div className="flex items-center gap-1.5"><Phone className="w-4 h-4 text-slate-400 shrink-0" /><input type="tel" placeholder="085211223344" value={form3B.phone} onChange={(e) => setForm3B({...form3B, phone: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" /></div></div>
                  </div>
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-2">
                    <label className="flex items-center space-x-2 text-xs font-bold text-rose-800 cursor-pointer">
                      <input type="checkbox" checked={form3B.hasAllergy} onChange={(e) => setForm3B({...form3B, hasAllergy: e.target.checked})} className="rounded w-4 h-4" />
                      <span>Memiliki Alergi Makanan?</span>
                    </label>
                    {form3B.hasAllergy && <input type="text" placeholder="Contoh: Ikan Laut, Kacang" value={form3B.allergyType} onChange={(e) => setForm3B({...form3B, allergyType: e.target.value})} className="w-full px-3 py-2 bg-white border border-rose-200 rounded-lg text-sm" />}
                  </div>
                </>
              )}

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100 sticky bottom-0 bg-white py-3 -mx-4 sm:-mx-5 px-4 sm:px-5">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50">Batal</button>
                <button type="submit" className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold active:scale-95 transition-all">Simpan Data</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}