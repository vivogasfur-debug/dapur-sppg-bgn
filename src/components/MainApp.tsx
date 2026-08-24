'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import Sidebar from './Sidebar';
import UserModule from './UserModule';
import AslapModule from './AslapModule';
import Image from 'next/image';
import * as ExcelJS from 'exceljs';
import { 
  Utensils, Plus, Search, X, Trash2,
  GraduationCap, Baby, UserCheck, School, Heart, Milk,
  AlertCircle, Calendar, Upload, Loader2, Pencil, Menu, Download,
  Users, PieChart, BarChart3, ShieldCheck, TrendingUp, Activity, UtensilsCrossed
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
  id: string; posyanduName: string;
  subCategory: 'Bumil' | 'Busui' | 'Balita'; nik: string; fullName: string;
  gender: 'L' | 'P'; birthDate: string; tempatLahir: string;
  alamat: string; namaOrtu: string;
  beratBadan: number; tinggiBadan: number;
  lingkarKepala: number; lingkarLengan: number;
  usiaKandungan: string;
  hasAllergy: boolean; allergyType: string;
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

const classifyBalita = (birthDateString: string): string => {
  if (!birthDateString || birthDateString === '-') return '-';
  const birthDate = new Date(birthDateString);
  const today = new Date();
  if (isNaN(birthDate.getTime())) return '-';
  let years = today.getFullYear() - birthDate.getFullYear();
  let months = today.getMonth() - birthDate.getMonth();
  if (months < 0 || (months === 0 && today.getDate() < birthDate.getDate())) { years--; months += 12; }
  const totalMonths = years * 12 + months;
  if (totalMonths < 6) return '< 6 Bln';
  if (totalMonths <= 12) return '6-12 Bln';
  if (totalMonths <= 59) return '12-59 Bln';
  return '>= 60 Bln';
};

export default function MainApp() {
  const [activeMenu, setActiveMenu] = useState('Penerima Manfaat');
  const [pmMainTab, setPmMainTab] = useState<'Sekolah' | '3B' | 'Rekapitulasi'>('Sekolah');
  const [pmSubTab, setPmSubTab] = useState<'Siswa' | 'Guru' | 'Bumil' | 'Busui' | 'Balita 0-6 Bln' | 'Balita 6-59 Bln' | 'Balita >= 60 Bln' | 'Balita Tdk Dikategorikan'>('Siswa');
  const isBalitaTab = (tab?: string) => { const t = tab || pmSubTab; return t === 'Balita 0-6 Bln' || t === 'Balita 6-59 Bln' || t === 'Balita >= 60 Bln' || t === 'Balita Tdk Dikategorikan'; };
  const getDbSubCat = (tab?: string) => { const t = tab || pmSubTab; return isBalitaTab(t) ? 'Balita' : t; };
  const getAgeMonths = (birthDateString: string): number => {
    if (!birthDateString || birthDateString === '-') return 999;
    const bd = new Date(birthDateString); const today = new Date();
    if (isNaN(bd.getTime())) return 999;
    let y = today.getFullYear() - bd.getFullYear(); let m = today.getMonth() - bd.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < bd.getDate())) { y--; m += 12; }
    return y * 12 + m;
  };
  const [rekapSubTab, setRekapSubTab] = useState<'Sekolah' | '3B'>('Sekolah');
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
        id: b.id, posyanduName: b.posyandu_name,
        subCategory: b.sub_category, nik: b.nik || '-', fullName: b.full_name,
        gender: b.gender, birthDate: b.birth_date || '-', tempatLahir: b.tempat_lahir || '-',
        alamat: b.alamat || '-', namaOrtu: b.nama_orang_tua || '-',
        beratBadan: b.berat_badan || 0, tinggiBadan: b.tinggi_badan || 0,
        lingkarKepala: b.lingkar_kepala || 0, lingkarLengan: b.lingkar_lengan || 0,
        usiaKandungan: b.usia_kandungan || '-',
        hasAllergy: b.has_allergy,
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
    birthDate: '', tempatLahir: '', alamat: '', namaOrtu: '',
    beratBadan: '', tinggiBadan: '', lingkarKepala: '', lingkarLengan: '',
    usiaKandungan: '',
    hasAllergy: false, allergyType: '',
  });

  // === DETEKSI DATA GANDA ===
  const [duplicateWarnings, setDuplicateWarnings] = useState<Array<{type:string; field:string; label:string; detail:string}>>([]);

  const normalizeStr = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

  const checkDuplicates = useCallback(() => {
    if (editingId) { setDuplicateWarnings([]); return; }
    const warnings: Array<{type:string; field:string; label:string; detail:string}> = [];

    if (pmMainTab === 'Sekolah' && pmSubTab === 'Siswa') {
      const f = formSiswa;
      if (f.nik && f.nik.length >= 10) {
        const dup = students.find(s => s.nik === f.nik);
        if (dup) warnings.push({type:'exact', field:'NIK', label:'NIK Sama', detail:`${dup.nama} (${dup.schoolName}, Kelas ${dup.kelas})`});
      }
      if (f.nisn && f.nisn.length >= 8) {
        const dup = students.find(s => s.nisn === f.nisn);
        if (dup) warnings.push({type:'exact', field:'NISN', label:'NISN Sama', detail:`${dup.nama} (${dup.schoolName}, Kelas ${dup.kelas})`});
      }
      if (f.nama && f.nama.length >= 3) {
        const norm = normalizeStr(f.nama);
        const similar = students.filter(s => {
          if (normalizeStr(s.nama) === norm && s.schoolName === f.schoolName) return true;
          if (normalizeStr(s.nama) === norm && f.tanggalLahir && s.tanggalLahir === f.tanggalLahir) return true;
          return false;
        });
        similar.forEach(s => {
          if (!warnings.some(w => w.detail.includes(s.nama) && w.detail.includes(s.schoolName))) {
            warnings.push({type:'similar', field:'Nama+Sekolah/TTL', label:'Nama Mirip', detail:`${s.nama} (${s.schoolName}${s.tanggalLahir ? ', TTL: '+s.tanggalLahir : ''})`});
          }
        });
      }
    } else if (pmMainTab === 'Sekolah' && pmSubTab === 'Guru') {
      const f = formGuru;
      if (f.nik && f.nik.length >= 10) {
        const dup = teachers.find(t => t.nik === f.nik);
        if (dup) warnings.push({type:'exact', field:'NIK', label:'NIK Sama', detail:`${dup.fullName} (${dup.schoolName}, ${dup.jenisTendik})`});
      }
      if (f.nip && f.nip.length >= 10) {
        const dup = teachers.find(t => t.nip === f.nip);
        if (dup) warnings.push({type:'exact', field:'NIP', label:'NIP Sama', detail:`${dup.fullName} (${dup.schoolName})`});
      }
      if (f.nuptk && f.nuptk.length >= 10) {
        const dup = teachers.find(t => t.nuptk === f.nuptk);
        if (dup) warnings.push({type:'exact', field:'NUPTK', label:'NUPTK Sama', detail:`${dup.fullName} (${dup.schoolName})`});
      }
      if (f.fullName && f.fullName.length >= 3) {
        const norm = normalizeStr(f.fullName);
        const similar = teachers.filter(t => {
          if (normalizeStr(t.fullName) === norm && t.schoolName === f.schoolName) return true;
          if (normalizeStr(t.fullName) === norm && f.tanggalLahir && t.tanggalLahir === f.tanggalLahir) return true;
          return false;
        });
        similar.forEach(t => {
          if (!warnings.some(w => w.detail.includes(t.fullName) && w.detail.includes(t.schoolName))) {
            warnings.push({type:'similar', field:'Nama+Sekolah/TTL', label:'Nama Mirip', detail:`${t.fullName} (${t.schoolName})`});
          }
        });
      }
    } else if (pmMainTab === '3B') {
      const f = form3B;
      if (f.nik && f.nik.length >= 10) {
        const dup = beneficiaries3b.find(b => b.nik === f.nik);
        if (dup) warnings.push({type:'exact', field:'NIK', label:'NIK Sama', detail:`${dup.fullName} (${dup.posyanduName}, ${dup.subCategory})`});
      }
      if (f.fullName && f.fullName.length >= 3) {
        const norm = normalizeStr(f.fullName);
        const similar = beneficiaries3b.filter(b => {
          if (normalizeStr(b.fullName) === norm && b.posyanduName === f.posyanduName) return true;
          if (normalizeStr(b.fullName) === norm && f.birthDate && b.birthDate === f.birthDate) return true;
          return false;
        });
        similar.forEach(b => {
          if (!warnings.some(w => w.detail.includes(b.fullName) && w.detail.includes(b.posyanduName))) {
            warnings.push({type:'similar', field:'Nama+Posyandu/TTL', label:'Nama Mirip', detail:`${b.fullName} (${b.posyanduName}, ${b.subCategory})`});
          }
        });
      }
    }
    setDuplicateWarnings(warnings);
  }, [pmMainTab, pmSubTab, formSiswa, formGuru, form3B, editingId, students, teachers, beneficiaries3b]);

  // Run duplicate check when form data changes (only when modal open)
  useEffect(() => { if (isModalOpen && !editingId) checkDuplicates(); else setDuplicateWarnings([]); }, [checkDuplicates, isModalOpen, editingId]);

  // === SISTEM SCAN DETEKSI DATA GANDA DATABASE ===
  const [dupModalOpen, setDupModalOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [dupResults, setDupResults] = useState<Array<{
    type: 'students' | 'teachers' | '3b'; reason: string; severity: 'exact' | 'similar';
    items: Array<{ id: string; nama: string; lokasi: string; nik: string; detail: string }>;
  }>>([]);

  const levenshtein = (a: string, b: string): number => {
    const m = a.length, n = b.length;
    if (!m) return n; if (!n) return m;
    const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1] : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
    }
    return dp[m][n];
  };

  const scanAllDuplicates = useCallback(() => {
    setScanning(true);
    setTimeout(() => {
      const groups: typeof dupResults = [];
      const seen = new Set<string>();

      // --- SCAN SISWA ---
      for (let i = 0; i < students.length; i++) {
        const a = students[i]; const keyA = `s-${a.id}`; if (seen.has(keyA)) continue;
        const normA = normalizeStr(a.nama);
        for (let j = i + 1; j < students.length; j++) {
          const b = students[j]; const keyB = `s-${b.id}`; if (seen.has(keyB)) continue;
          let match = false; let reason = ''; let severity: 'exact' | 'similar' = 'similar';
          if (a.nik && b.nik && a.nik !== '-' && b.nik !== '-' && a.nik === b.nik) { match = true; reason = 'NIK Sama'; severity = 'exact'; }
          else if (a.nisn && b.nisn && a.nisn !== '-' && b.nisn !== '-' && a.nisn === b.nisn) { match = true; reason = 'NISN Sama'; severity = 'exact'; }
          else if (normA === normalizeStr(b.nama) && a.schoolName === b.schoolName) { match = true; reason = `Nama Identik + Sekolah Sama (${a.schoolName})`; severity = 'exact'; }
          else if (normA.length >= 4 && normalizeStr(b.nama).length >= 4 && levenshtein(normA, normalizeStr(b.nama)) <= 2 && a.schoolName === b.schoolName) { match = true; reason = `Nama Mirip (beda 1-2 huruf) + Sekolah Sama (${a.schoolName})`; }
          if (match) {
            seen.add(keyA); seen.add(keyB);
            groups.push({ type: 'students', reason, severity, items: [
              { id: a.id, nama: a.nama, lokasi: a.schoolName, nik: a.nik, detail: `Kelas ${a.kelas}` },
              { id: b.id, nama: b.nama, lokasi: b.schoolName, nik: b.nik, detail: `Kelas ${b.kelas}` },
            ]});
          }
        }
      }

      // --- SCAN GURU ---
      for (let i = 0; i < teachers.length; i++) {
        const a = teachers[i]; const keyA = `t-${a.id}`; if (seen.has(keyA)) continue;
        const normA = normalizeStr(a.fullName);
        for (let j = i + 1; j < teachers.length; j++) {
          const b = teachers[j]; const keyB = `t-${b.id}`; if (seen.has(keyB)) continue;
          let match = false; let reason = ''; let severity: 'exact' | 'similar' = 'similar';
          if (a.nik && b.nik && a.nik !== '-' && b.nik !== '-' && a.nik === b.nik) { match = true; reason = 'NIK Sama'; severity = 'exact'; }
          else if (a.nip && b.nip && a.nip !== '-' && b.nip !== '-' && a.nip === b.nip) { match = true; reason = 'NIP Sama'; severity = 'exact'; }
          else if (a.nuptk && b.nuptk && a.nuptk !== '-' && b.nuptk !== '-' && a.nuptk === b.nuptk) { match = true; reason = 'NUPTK Sama'; severity = 'exact'; }
          else if (normA === normalizeStr(b.fullName) && a.schoolName === b.schoolName) { match = true; reason = `Nama Identik + Sekolah Sama (${a.schoolName})`; severity = 'exact'; }
          else if (normA.length >= 4 && normalizeStr(b.fullName).length >= 4 && levenshtein(normA, normalizeStr(b.fullName)) <= 2 && a.schoolName === b.schoolName) { match = true; reason = `Nama Mirip (beda 1-2 huruf) + Sekolah Sama (${a.schoolName})`; }
          if (match) {
            seen.add(keyA); seen.add(keyB);
            groups.push({ type: 'teachers', reason, severity, items: [
              { id: a.id, nama: a.fullName, lokasi: a.schoolName, nik: a.nik, detail: a.jenisTendik },
              { id: b.id, nama: b.fullName, lokasi: b.schoolName, nik: b.nik, detail: b.jenisTendik },
            ]});
          }
        }
      }

      // --- SCAN 3B ---
      for (let i = 0; i < beneficiaries3b.length; i++) {
        const a = beneficiaries3b[i]; const keyA = `b-${a.id}`; if (seen.has(keyA)) continue;
        const normA = normalizeStr(a.fullName);
        for (let j = i + 1; j < beneficiaries3b.length; j++) {
          const b = beneficiaries3b[j]; const keyB = `b-${b.id}`; if (seen.has(keyB)) continue;
          let match = false; let reason = ''; let severity: 'exact' | 'similar' = 'similar';
          if (a.nik && b.nik && a.nik !== '-' && b.nik !== '-' && a.nik === b.nik) { match = true; reason = 'NIK Sama'; severity = 'exact'; }
          else if (normA === normalizeStr(b.fullName) && a.posyanduName === b.posyanduName) { match = true; reason = `Nama Identik + Posyandu Sama (${a.posyanduName})`; severity = 'exact'; }
          else if (normA.length >= 4 && normalizeStr(b.fullName).length >= 4 && levenshtein(normA, normalizeStr(b.fullName)) <= 2 && a.posyanduName === b.posyanduName) { match = true; reason = `Nama Mirip (beda 1-2 huruf) + Posyandu Sama (${a.posyanduName})`; }
          if (match) {
            seen.add(keyA); seen.add(keyB);
            groups.push({ type: '3b', reason, severity, items: [
              { id: a.id, nama: a.fullName, lokasi: a.posyanduName, nik: a.nik, detail: a.subCategory },
              { id: b.id, nama: b.fullName, lokasi: b.posyanduName, nik: b.nik, detail: b.subCategory },
            ]});
          }
        }
      }

      setDupResults(groups);
      setScanning(false);
      setDupModalOpen(true);
      if (groups.length === 0) toast.success('Tidak ditemukan data ganda atau mirip!');
      else toast.warning(`Ditemukan ${groups.length} pasang data ganda/mirip`);
    }, 100);
  }, [students, teachers, beneficiaries3b]);

  const [dupFilter, setDupFilter] = useState<'all' | 'students' | 'teachers' | '3b'>('all');
  const filteredDup = dupResults.filter(g => dupFilter === 'all' || g.type === dupFilter);
  const dupExactCount = dupResults.filter(g => g.severity === 'exact').length;
  const dupSimilarCount = dupResults.filter(g => g.severity === 'similar').length;

  const handleDeleteDupItem = async (type: string, id: string) => {
    try {
      const endpoint = type === 'students' ? '/api/students' : type === 'teachers' ? '/api/teachers' : '/api/beneficiaries-3b';
      const res = await fetch(`${endpoint}?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setDupResults(prev => prev.map(g => ({
        ...g, items: g.items.length <= 2 ? [] : g.items.filter(it => it.id !== id),
      })).filter(g => g.items.length >= 2));
      toast.success('Data duplikat dihapus');
      fetchData();
    } catch { toast.error('Gagal menghapus data duplikat'); }
  };

  const handleDeleteAllDup = async () => {
    if (!confirm(`Hapus ${dupResults.length} pasang data duplikat? Data yang dipertahankan adalah baris pertama dari setiap pasangan.`)) return;
    try {
      let deleted = 0;
      for (const g of dupResults) {
        for (let i = 1; i < g.items.length; i++) {
          const endpoint = g.type === 'students' ? '/api/students' : g.type === 'teachers' ? '/api/teachers' : '/api/beneficiaries-3b';
          const res = await fetch(`${endpoint}?id=${g.items[i].id}`, { method: 'DELETE' });
          if (res.ok) deleted++;
        }
      }
      toast.success(`${deleted} data duplikat dihapus`);
      setDupResults([]);
      setDupModalOpen(false);
      fetchData();
    } catch { toast.error('Gagal menghapus beberapa data'); }
  };

  const handleMainTabChange = (tab: 'Sekolah' | '3B' | 'Rekapitulasi') => {
    setPmMainTab(tab); if (tab === 'Sekolah') setPmSubTab('Siswa'); else if (tab === '3B') setPmSubTab('Bumil');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Cek duplikat sebelum simpan (hanya saat tambah baru)
    if (!editingId && duplicateWarnings.length > 0) {
      const exactWarnings = duplicateWarnings.filter(w => w.type === 'exact');
      if (exactWarnings.length > 0) {
        toast.error(`Data ganda terdeteksi! ${exactWarnings.map(w => w.field + ': ' + w.detail).join('; ')}`, { duration: 5000 });
        return;
      }
      const simWarnings = duplicateWarnings.filter(w => w.type === 'similar');
      if (simWarnings.length > 0) {
        const msg = `Data mirip ditemukan:\n${simWarnings.map(w => '- ' + w.label + ': ' + w.detail).join('\n')}\n\nLanjutkan menyimpan?`;
        if (!confirm(msg)) return;
      }
    }
    try {
      let ok = false;
      if (pmMainTab === 'Sekolah' && pmSubTab === 'Siswa') {
        const url = editingId ? `/api/students?id=${editingId}` : '/api/students';
        const res = await fetch(url, { method: editingId ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formSiswa) });
        if (!res.ok) throw new Error();
        toast.success(editingId ? 'Data siswa diperbarui' : 'Data siswa tersimpan');
        ok = true;
      } else if (pmMainTab === 'Sekolah' && pmSubTab === 'Guru') {
        const url = editingId ? `/api/teachers?id=${editingId}` : '/api/teachers';
        const res = await fetch(url, { method: editingId ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formGuru) });
        if (!res.ok) throw new Error();
        toast.success(editingId ? 'Data guru diperbarui' : 'Data guru tersimpan');
        ok = true;
      } else {
        const url = editingId ? `/api/beneficiaries-3b?id=${editingId}` : '/api/beneficiaries-3b';
        const res = await fetch(url, { method: editingId ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form3B, subCategory: getDbSubCat() }) });
        if (!res.ok) throw new Error();
        toast.success(editingId ? 'Data 3B diperbarui' : 'Data 3B tersimpan');
        ok = true;
      }
      if (ok) { setIsModalOpen(false); setEditingId(null); fetchData(); }
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
      setPmSubTab(item.subCategory === 'Balita' ? (getAgeMonths(item.birthDate) < 6 ? 'Balita 0-6 Bln' : getAgeMonths(item.birthDate) < 60 ? 'Balita 6-59 Bln' : getAgeMonths(item.birthDate) >= 999 ? 'Balita Tdk Dikategorikan' : 'Balita >= 60 Bln') : item.subCategory as any); setPmMainTab('3B');
      setForm3B({ posyanduName: item.posyanduName, fullName: item.fullName, nik: item.nik || '', gender: item.gender, birthDate: item.birthDate || '', tempatLahir: item.tempatLahir || '', alamat: item.alamat || '', namaOrtu: item.namaOrtu || '', beratBadan: String(item.beratBadan || ''), tinggiBadan: String(item.tinggiBadan || ''), lingkarKepala: String(item.lingkarKepala || ''), lingkarLengan: String(item.lingkarLengan || ''), usiaKandungan: item.usiaKandungan || '', hasAllergy: item.hasAllergy || false, allergyType: item.allergyType || '' });
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
      else if (isBalitaTab()) url = `/api/beneficiaries-3b?all=true&sub_category=Balita`;
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
    else setForm3B({ posyanduName: '', fullName: '', nik: '', gender: 'P', birthDate: '', tempatLahir: '', alamat: '', namaOrtu: '', beratBadan: '', tinggiBadan: '', lingkarKepala: '', lingkarLengan: '', usiaKandungan: '', hasAllergy: false, allergyType: '' });
    setIsModalOpen(true);
  };

  const getImportType = () => {
    if (pmSubTab === 'Siswa') return 'students';
    if (pmSubTab === 'Guru') return 'teachers';
    return 'beneficiaries-3b';
  };

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setImporting(true);
    const total = files.length;
    let totalInserted = 0;
    const importType = getImportType();
    try {
      for (let i = 0; i < total; i++) {
        const file = files[i];
        toast.info(`Mengimport file ${i+1}/${total}: ${file.name}`);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', importType);
        if (importType === 'beneficiaries-3b') formData.append('sub_category', getDbSubCat());
        const res = await fetch('/api/import-csv', { method: 'POST', body: formData });
        const result = await res.json();
        if (res.ok && result.inserted > 0) totalInserted += result.inserted;
        else if (!res.ok) toast.error(`${file.name}: ${result.error || 'Gagal import'}`);
      }
      if (totalInserted > 0) {
        toast.success(`${totalInserted} data berhasil diimport dari ${total} file CSV`);
        fetchData();
      }
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

      // 3B - Balita
      if (scope === 'all' || isBalitaTab()) {
        const balitaAll = beneficiaries3b.filter(b => b.subCategory === 'Balita');
        const balita06 = scope === 'all' ? balitaAll.filter(b => getAgeMonths(b.birthDate) < 6) : filtered3b;
        const balita659 = scope === 'all' ? balitaAll.filter(b => getAgeMonths(b.birthDate) >= 6 && getAgeMonths(b.birthDate) < 60) : [];
        if (scope === 'all' && balita06.length > 0) {
          const headers = ['No', 'Nama Anak', 'NIK', 'JK', 'Tempat Lahir', 'Tanggal Lahir', 'Umur', 'Klasifikasi', 'Nama Orang Tua', 'Alamat', 'BB (kg)', 'TB (cm)', 'LK (cm)', 'LL (cm)', 'Posyandu', 'Alergi'];
          const rows = balita06.map((b, i) => [safeStr(i+1), safeStr(b.fullName), safeStr(b.nik), safeStr(b.gender), safeStr(b.tempatLahir), safeStr(b.birthDate), calculateAge(b.birthDate), classifyBalita(b.birthDate), safeStr(b.namaOrtu), safeStr(b.alamat), safeStr(b.beratBadan), safeStr(b.tinggiBadan), safeStr(b.lingkarKepala), safeStr(b.lingkarLengan), safeStr(b.posyanduName), b.hasAllergy ? safeStr(b.allergyType) : 'Tidak']);
          const ws = workbook.addWorksheet('Balita 0-6 Bln');
          addKop(ws, 'DATA PENERIMA MANFAAT - BALITA 0-6 BULAN', headers, rows, [5, 25, 20, 5, 15, 15, 12, 12, 25, 20, 8, 8, 8, 8, 20, 12]);
        }
        if (scope === 'all' && balita659.length > 0) {
          const headers = ['No', 'Nama Anak', 'NIK', 'JK', 'Tempat Lahir', 'Tanggal Lahir', 'Umur', 'Klasifikasi', 'Nama Orang Tua', 'Alamat', 'BB (kg)', 'TB (cm)', 'LK (cm)', 'LL (cm)', 'Posyandu', 'Alergi'];
          const rows = balita659.map((b, i) => [safeStr(i+1), safeStr(b.fullName), safeStr(b.nik), safeStr(b.gender), safeStr(b.tempatLahir), safeStr(b.birthDate), calculateAge(b.birthDate), classifyBalita(b.birthDate), safeStr(b.namaOrtu), safeStr(b.alamat), safeStr(b.beratBadan), safeStr(b.tinggiBadan), safeStr(b.lingkarKepala), safeStr(b.lingkarLengan), safeStr(b.posyanduName), b.hasAllergy ? safeStr(b.allergyType) : 'Tidak']);
          const ws = workbook.addWorksheet('Balita 6-59 Bln');
          addKop(ws, 'DATA PENERIMA MANFAAT - BALITA 6-59 BULAN', headers, rows, [5, 25, 20, 5, 15, 15, 12, 12, 25, 20, 8, 8, 8, 8, 20, 12]);
        }
        if (scope !== 'all' && filtered3b.length > 0) {
          const sheetName = pmSubTab;
          const headers = ['No', 'Nama Anak', 'NIK', 'JK', 'Tempat Lahir', 'Tanggal Lahir', 'Umur', 'Klasifikasi', 'Nama Orang Tua', 'Alamat', 'BB (kg)', 'TB (cm)', 'LK (cm)', 'LL (cm)', 'Posyandu', 'Alergi'];
          const rows = filtered3b.map((b, i) => [safeStr(i+1), safeStr(b.fullName), safeStr(b.nik), safeStr(b.gender), safeStr(b.tempatLahir), safeStr(b.birthDate), calculateAge(b.birthDate), classifyBalita(b.birthDate), safeStr(b.namaOrtu), safeStr(b.alamat), safeStr(b.beratBadan), safeStr(b.tinggiBadan), safeStr(b.lingkarKepala), safeStr(b.lingkarLengan), safeStr(b.posyanduName), b.hasAllergy ? safeStr(b.allergyType) : 'Tidak']);
          const ws = workbook.addWorksheet(sheetName);
          addKop(ws, `DATA PENERIMA MANFAAT - ${sheetName.toUpperCase()}`, headers, rows, [5, 25, 20, 5, 15, 15, 12, 12, 25, 20, 8, 8, 8, 8, 20, 12]);
        }
      }
      // 3B - Bumil & Busui
      if (scope === 'all' || pmSubTab === 'Bumil' || pmSubTab === 'Busui') {
        const nonBalitaData = scope === 'all' ? beneficiaries3b.filter(b => b.subCategory !== 'Balita') : filtered3b.filter(b => b.subCategory !== 'Balita');
        if (nonBalitaData.length > 0) {
          const headers = ['No', 'Kategori', 'Nama Penerima', 'NIK', 'JK', 'Tempat Lahir', 'Tanggal Lahir', 'Umur', 'Usia Kandungan', 'Alamat', 'BB (kg)', 'TB (cm)', 'LK (cm)', 'LL (cm)', 'Posyandu', 'Alergi'];
          const rows = nonBalitaData.map((b, i) => [safeStr(i+1), safeStr(b.subCategory), safeStr(b.fullName), safeStr(b.nik), safeStr(b.gender), safeStr(b.tempatLahir), safeStr(b.birthDate), calculateAge(b.birthDate), safeStr(b.usiaKandungan), safeStr(b.alamat), safeStr(b.beratBadan), safeStr(b.tinggiBadan), safeStr(b.lingkarKepala), safeStr(b.lingkarLengan), safeStr(b.posyanduName), b.hasAllergy ? safeStr(b.allergyType) : 'Tidak']);
          const ws = workbook.addWorksheet(scope === 'all' ? 'Bumil-Busui' : pmSubTab);
          addKop(ws, `DATA PENERIMA MANFAAT - ${scope === 'all' ? 'BUMIL & BUSUI' : pmSubTab.toUpperCase()}`, headers, rows, [5, 10, 25, 20, 5, 15, 15, 12, 15, 20, 8, 8, 8, 8, 20, 12]);
        }
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

  const isNumericSearch = /^\d+$/.test(searchTerm.trim());
  const st = searchTerm.toLowerCase();
  const filteredStudents = students.filter(s => s.nama.toLowerCase().includes(st) || s.schoolName.toLowerCase().includes(st) || (isNumericSearch && s.nisn.includes(searchTerm.trim())) || (isNumericSearch && s.nik.includes(searchTerm.trim())));
  const filteredTeachers = teachers.filter(t => t.fullName.toLowerCase().includes(st) || t.schoolName.toLowerCase().includes(st) || (isNumericSearch && t.nik.includes(searchTerm.trim())) || (isNumericSearch && t.nip.includes(searchTerm.trim())));
  const filtered3b = beneficiaries3b.filter(b => {
    if (pmSubTab === 'Balita 0-6 Bln') return b.subCategory === 'Balita' && getAgeMonths(b.birthDate) < 6 && (st === '' || b.fullName.toLowerCase().includes(st) || b.posyanduName.toLowerCase().includes(st) || (isNumericSearch && b.nik.includes(searchTerm.trim())));
    if (pmSubTab === 'Balita 6-59 Bln') return b.subCategory === 'Balita' && getAgeMonths(b.birthDate) >= 6 && getAgeMonths(b.birthDate) < 60 && (st === '' || b.fullName.toLowerCase().includes(st) || b.posyanduName.toLowerCase().includes(st) || (isNumericSearch && b.nik.includes(searchTerm.trim())));
    if (pmSubTab === 'Balita >= 60 Bln') return b.subCategory === 'Balita' && getAgeMonths(b.birthDate) >= 60 && getAgeMonths(b.birthDate) < 999 && (st === '' || b.fullName.toLowerCase().includes(st) || b.posyanduName.toLowerCase().includes(st) || (isNumericSearch && b.nik.includes(searchTerm.trim())));
    if (pmSubTab === 'Balita Tdk Dikategorikan') return b.subCategory === 'Balita' && getAgeMonths(b.birthDate) >= 999 && (st === '' || b.fullName.toLowerCase().includes(st) || b.posyanduName.toLowerCase().includes(st) || (isNumericSearch && b.nik.includes(searchTerm.trim())));
    return b.subCategory === pmSubTab && (st === '' || b.fullName.toLowerCase().includes(st) || b.posyanduName.toLowerCase().includes(st) || (isNumericSearch && b.nik.includes(searchTerm.trim())));
  });

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
        <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-[11px] font-bold">{b.gender}</span>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
        <div className="col-span-2"><span className="text-slate-400">Posyandu:</span> <span className="font-medium text-slate-700">{b.posyanduName}</span></div>
        <div><span className="text-slate-400">TTL:</span> <span className="font-medium">{b.tempatLahir !== '-' ? b.tempatLahir + ', ' : ''}{b.birthDate}</span></div>
        <div><span className="text-slate-400">Umur:</span> <span className="font-bold text-blue-600">{calculateAge(b.birthDate)}</span></div>
        {b.subCategory === 'Balita' ? (<>
          <div><span className="text-slate-400">Klasifikasi:</span> <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${classifyBalita(b.birthDate) === '6-12 Bln' ? 'bg-amber-50 text-amber-700' : classifyBalita(b.birthDate) === '12-59 Bln' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{classifyBalita(b.birthDate)}</span></div>
          <div className="col-span-2"><span className="text-slate-400">Orang Tua:</span> <span className="font-medium text-slate-700">{b.namaOrtu}</span></div>
          <div className="col-span-2"><span className="text-slate-400">Alamat:</span> <span className="font-medium text-slate-700">{b.alamat}</span></div>
          <div className="grid grid-cols-4 gap-1 text-center">
            <div className="bg-emerald-50 rounded-lg p-1.5"><div className="text-[9px] text-slate-400">BB</div><div className="font-bold text-emerald-700">{b.beratBadan || '-'}</div></div>
            <div className="bg-blue-50 rounded-lg p-1.5"><div className="text-[9px] text-slate-400">TB</div><div className="font-bold text-blue-700">{b.tinggiBadan || '-'}</div></div>
            <div className="bg-violet-50 rounded-lg p-1.5"><div className="text-[9px] text-slate-400">LK</div><div className="font-bold text-violet-700">{b.lingkarKepala || '-'}</div></div>
            <div className="bg-amber-50 rounded-lg p-1.5"><div className="text-[9px] text-slate-400">LL</div><div className="font-bold text-amber-700">{b.lingkarLengan || '-'}</div></div>
          </div>
        </>) : (<>
          <div className="col-span-2"><span className="text-slate-400">Usia Kandungan:</span> <span className="font-medium text-amber-700">{b.usiaKandungan}</span></div>
          <div className="col-span-2"><span className="text-slate-400">Alamat:</span> <span className="font-medium text-slate-700">{b.alamat}</span></div>
          <div className="grid grid-cols-4 gap-1 text-center">
            <div className="bg-emerald-50 rounded-lg p-1.5"><div className="text-[9px] text-slate-400">BB</div><div className="font-bold text-emerald-700">{b.beratBadan || '-'}</div></div>
            <div className="bg-blue-50 rounded-lg p-1.5"><div className="text-[9px] text-slate-400">TB</div><div className="font-bold text-blue-700">{b.tinggiBadan || '-'}</div></div>
            <div className="bg-violet-50 rounded-lg p-1.5"><div className="text-[9px] text-slate-400">LK</div><div className="font-bold text-violet-700">{b.lingkarKepala || '-'}</div></div>
            <div className="bg-amber-50 rounded-lg p-1.5"><div className="text-[9px] text-slate-400">LL</div><div className="font-bold text-amber-700">{b.lingkarLengan || '-'}</div></div>
          </div>
        </>)}
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
      case 'Dashboard': {
        const getJenjangDash = (name: string): string => {
          const u = name.toUpperCase().replace(/[^A-Z ]/g, '').trim();
          if (/^(TK|RA|RAUDHATUL)/.test(u)) return 'TK';
          if (/^(SD|MI|SDLB|MIN)/.test(u)) return 'SD';
          if (/^(SMP|MTS|SMPLB)/.test(u)) return 'SMP';
          if (/^(SMA|SMK|MA|MAK|SMAS|SMAN|SMKN|SMKS)/.test(u)) return 'SMA';
          return 'Lainnya';
        };
        const extractKelasDash = (kelas: string): number => {
          if (!kelas || kelas === '-') return -1;
          const cleaned = kelas.replace(/[^0-9]/g, '');
          if (cleaned) return parseInt(cleaned);
          const roman: Record<string,number> = {'I':1,'II':2,'III':3,'IV':4,'V':5,'VI':6,'VII':7,'VIII':8,'IX':9,'X':10,'XI':11,'XII':12};
          return roman[kelas.toUpperCase().trim()] ?? -1;
        };
        const siswaTKRA_dash = students.filter(s => getJenjangDash(s.schoolName) === 'TK').length;
        const siswaSD123_dash = students.filter(s => {
          const j = getJenjangDash(s.schoolName);
          if (j !== 'SD' && j !== 'Lainnya') return false;
          const k = extractKelasDash(s.kelas);
          return k >= 1 && k <= 3;
        }).length;
        const siswaSD456_dash = students.filter(s => {
          const j = getJenjangDash(s.schoolName);
          if (j !== 'SD' && j !== 'Lainnya') return false;
          const k = extractKelasDash(s.kelas);
          return k >= 4 && k <= 6;
        }).length;
        const siswaSMP_dash = students.filter(s => getJenjangDash(s.schoolName) === 'SMP').length;
        const siswaSMA_dash = students.filter(s => getJenjangDash(s.schoolName) === 'SMA').length;
        const bumil_dash = beneficiaries3b.filter(b => b.subCategory === 'Bumil').length;
        const busui_dash = beneficiaries3b.filter(b => b.subCategory === 'Busui').length;
        const balita0_6_dash = beneficiaries3b.filter(b => b.subCategory === 'Balita' && classifyBalita(b.birthDate) === '< 6 Bln').length;
        const balita6_59_dash = beneficiaries3b.filter(b => b.subCategory === 'Balita' && (classifyBalita(b.birthDate) === '6-12 Bln' || classifyBalita(b.birthDate) === '12-59 Bln')).length;
        const porsiKecil_dash = siswaTKRA_dash + siswaSD123_dash + balita0_6_dash + balita6_59_dash;
        const porsiBesar_dash = teachers.length + siswaSD456_dash + siswaSMP_dash + siswaSMA_dash + bumil_dash + busui_dash;
        const totalPorsi_dash = porsiKecil_dash + porsiBesar_dash;
        const totalPenerima = totalPorsi_dash;
        const totalAlergi = [...students.filter(s=>s.hasAllergy), ...teachers.filter(t=>t.hasAllergy), ...beneficiaries3b.filter(b=>b.hasAllergy)].length;
        const siswaL = students.filter(s => s.jk === 'L').length;
        const siswaP = students.filter(s => s.jk === 'P').length;
        const guruL = teachers.filter(t => t.jk === 'L').length;
        const guruP = teachers.filter(t => t.jk === 'P').length;
        const b3bL = beneficiaries3b.filter(b => b.gender === 'L').length;
        const b3bP = beneficiaries3b.filter(b => b.gender === 'P').length;
        const totalL = siswaL + guruL + b3bL;
        const totalP = siswaP + guruP + b3bP;
        const bumil = bumil_dash;
        const busui = busui_dash;
        const balita = beneficiaries3b.filter(b => b.subCategory === 'Balita').length;
        const penerima3bPorsi = bumil + busui + balita0_6_dash + balita6_59_dash;
        // Sekolah distribution
        const schoolMap: Record<string, number> = {};
        students.forEach(s => { schoolMap[s.schoolName] = (schoolMap[s.schoolName] || 0) + 1 });
        const topSchools = Object.entries(schoolMap).sort((a,b) => b[1]-a[1]);
        const maxSchoolCount = topSchools.length > 0 ? topSchools[0][1] : 1;
        // Kelas distribution
        const kelasMap: Record<string, number> = {};
        students.forEach(s => { const k = s.kelas && s.kelas !== '-' ? s.kelas : 'Lainnya'; kelasMap[k] = (kelasMap[k] || 0) + 1 });
        const kelasEntries = Object.entries(kelasMap).sort((a,b) => a[0].localeCompare(b[0], undefined, {numeric:true}));
        const maxKelas = kelasEntries.length > 0 ? Math.max(...kelasEntries.map(e=>e[1])) : 1;
        // Guru distribution
        const guruMap: Record<string, number> = {};
        teachers.forEach(t => { guruMap[t.schoolName] = (guruMap[t.schoolName] || 0) + 1 });
        const topGuruSchools = Object.entries(guruMap).sort((a,b) => b[1]-a[1]);
        // Status gizi siswa (BMI sederhana)
        const giziNormal = students.filter(s => s.beratBadan > 0 && s.tinggiBadan > 0).length;
        const giziDataAvailable = giziNormal;
        const giziCounts = { normal: 0, kurang: 0, lebih: 0 };
        students.forEach(s => {
          if (s.beratBadan > 0 && s.tinggiBadan > 0) {
            const tbm = s.tinggiBadan / 100;
            if (tbm > 0) {
              const bmi = s.beratBadan / (tbm * tbm);
              if (bmi < 18.5) giziCounts.kurang++;
              else if (bmi > 25) giziCounts.lebih++;
              else giziCounts.normal++;
            }
          }
        });
        // Posyandu distribution for 3B
        const posyanduMap: Record<string, number> = {};
        beneficiaries3b.forEach(b => { posyanduMap[b.posyanduName] = (posyanduMap[b.posyanduName] || 0) + 1 });
        const topPosyandu = Object.entries(posyanduMap).sort((a,b) => b[1]-a[1]);

        return (
          <div className="space-y-4">
            {/* ===== SUMMARY CARDS ===== */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
              <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-3 sm:p-4 rounded-2xl shadow-lg shadow-emerald-200/50 text-white">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase opacity-80">Total Penerima</span>
                  <div className="p-1.5 bg-white/20 rounded-lg"><Users className="w-4 h-4" /></div>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold">{totalPenerima}</h2>
                <p className="text-[10px] mt-1 opacity-75">Porsi Kecil {porsiKecil_dash} + Besar {porsiBesar_dash}</p>
              </div>
              <div className="bg-white p-3 sm:p-4 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Siswa</span>
                  <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg"><GraduationCap className="w-4 h-4" /></div>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800">{students.length}</h2>
                <p className="text-[10px] mt-1 text-slate-400">L: {siswaL} | P: {siswaP}</p>
              </div>
              <div className="bg-white p-3 sm:p-4 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Guru/Tendik</span>
                  <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg"><UserCheck className="w-4 h-4" /></div>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800">{teachers.length}</h2>
                <p className="text-[10px] mt-1 text-slate-400">L: {guruL} | P: {guruP}</p>
              </div>
              <div className="bg-white p-3 sm:p-4 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Penerima 3B</span>
                  <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg"><Baby className="w-4 h-4" /></div>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800">{penerima3bPorsi}</h2>
                <p className="text-[10px] mt-1 text-slate-400">Bumil {bumil} + Busui {busui} + Balita {balita0_6_dash + balita6_59_dash}</p>
              </div>
              <div className="bg-white p-3 sm:p-4 rounded-2xl shadow-sm border border-slate-200 col-span-2 lg:col-span-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Peringatan Alergi</span>
                  <div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg"><AlertCircle className="w-4 h-4" /></div>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-rose-600">{totalAlergi}</h2>
                <p className="text-[10px] mt-1 text-slate-400">{totalPenerima > 0 ? ((totalAlergi/totalPenerima)*100).toFixed(1) : 0}% dari total</p>
              </div>
            </div>

            {/* ===== GENDER RATIO + 3B CATEGORY ===== */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {/* Gender Distribution */}
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg"><PieChart className="w-4 h-4" /></div>
                  <h3 className="text-sm font-bold text-slate-700">Distribusi Jenis Kelamin</h3>
                </div>
                {/* Overall */}
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-slate-500">Seluruh Penerima</span>
                      <span className="text-xs text-slate-400">{totalL} L | {totalP} P</span>
                    </div>
                    <div className="flex h-5 rounded-full overflow-hidden bg-slate-100">
                      {totalL + totalP > 0 ? (<>
                        <div className="bg-blue-500 transition-all duration-500" style={{width: `${(totalL/(totalL+totalP))*100}%`}} />
                        <div className="bg-pink-400 transition-all duration-500" style={{width: `${(totalP/(totalL+totalP))*100}%`}} />
                      </>) : null}
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-[10px] text-blue-500 font-semibold">Laki-laki {totalL + totalP > 0 ? ((totalL/(totalL+totalP))*100).toFixed(0) : 0}%</span>
                      <span className="text-[10px] text-pink-400 font-semibold">Perempuan {totalL + totalP > 0 ? ((totalP/(totalL+totalP))*100).toFixed(0) : 0}%</span>
                    </div>
                  </div>
                  {/* Siswa */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-emerald-600">Siswa</span>
                      <span className="text-xs text-slate-400">{siswaL} L | {siswaP} P</span>
                    </div>
                    <div className="flex h-3 rounded-full overflow-hidden bg-slate-100">
                      {siswaL + siswaP > 0 ? (<>
                        <div className="bg-blue-400 transition-all duration-500" style={{width: `${(siswaL/(siswaL+siswaP))*100}%`}} />
                        <div className="bg-pink-300 transition-all duration-500" style={{width: `${(siswaP/(siswaL+siswaP))*100}%`}} />
                      </>) : null}
                    </div>
                  </div>
                  {/* Guru */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-blue-600">Guru/Tendik</span>
                      <span className="text-xs text-slate-400">{guruL} L | {guruP} P</span>
                    </div>
                    <div className="flex h-3 rounded-full overflow-hidden bg-slate-100">
                      {guruL + guruP > 0 ? (<>
                        <div className="bg-blue-400 transition-all duration-500" style={{width: `${(guruL/(guruL+guruP))*100}%`}} />
                        <div className="bg-pink-300 transition-all duration-500" style={{width: `${(guruP/(guruL+guruP))*100}%`}} />
                      </>) : null}
                    </div>
                  </div>
                  {/* 3B */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-amber-600">Penerima 3B</span>
                      <span className="text-xs text-slate-400">{b3bL} L | {b3bP} P</span>
                    </div>
                    <div className="flex h-3 rounded-full overflow-hidden bg-slate-100">
                      {b3bL + b3bP > 0 ? (<>
                        <div className="bg-blue-400 transition-all duration-500" style={{width: `${(b3bL/(b3bL+b3bP))*100}%`}} />
                        <div className="bg-pink-300 transition-all duration-500" style={{width: `${(b3bP/(b3bL+b3bP))*100}%`}} />
                      </>) : null}
                    </div>
                  </div>
                </div>
              </div>

              {/* 3B Category + Posyandu */}
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg"><BarChart3 className="w-4 h-4" /></div>
                  <h3 className="text-sm font-bold text-slate-700">Kategori Penerima 3B</h3>
                </div>
                <div className="space-y-3 mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-16 text-xs font-bold text-slate-500">Bumil</div>
                    <div className="flex-1 h-7 bg-slate-100 rounded-lg overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-rose-400 to-rose-500 rounded-lg transition-all duration-500 flex items-center pl-2" style={{width: `${beneficiaries3b.length > 0 ? (bumil/beneficiaries3b.length)*100 : 0}%`, minWidth: bumil > 0 ? '2rem' : '0'}}>
                        {bumil > 0 && <span className="text-[10px] font-bold text-white">{bumil}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-16 text-xs font-bold text-slate-500">Busui</div>
                    <div className="flex-1 h-7 bg-slate-100 rounded-lg overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-violet-400 to-violet-500 rounded-lg transition-all duration-500 flex items-center pl-2" style={{width: `${beneficiaries3b.length > 0 ? (busui/beneficiaries3b.length)*100 : 0}%`, minWidth: busui > 0 ? '2rem' : '0'}}>
                        {busui > 0 && <span className="text-[10px] font-bold text-white">{busui}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-16 text-xs font-bold text-slate-500">Balita</div>
                    <div className="flex-1 h-7 bg-slate-100 rounded-lg overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-cyan-400 to-cyan-500 rounded-lg transition-all duration-500 flex items-center pl-2" style={{width: `${beneficiaries3b.length > 0 ? (balita/beneficiaries3b.length)*100 : 0}%`, minWidth: balita > 0 ? '2rem' : '0'}}>
                        {balita > 0 && <span className="text-[10px] font-bold text-white">{balita}</span>}
                      </div>
                    </div>
                  </div>
                </div>
                {/* Posyandu distribution */}
                {topPosyandu.length > 0 && (<>
                  <div className="flex items-center gap-2 mb-2 pt-3 border-t border-slate-100">
                    <span className="text-xs font-bold text-slate-600">Per Posyandu</span>
                  </div>
                  <div className="space-y-1.5 max-h-28 overflow-y-auto">
                    {topPosyandu.slice(0, 5).map(([name, count]) => (
                      <div key={name} className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-500 w-28 truncate" title={name}>{name}</span>
                        <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-400 rounded-full transition-all duration-500" style={{width: `${(count/topPosyandu[0][1])*100}%`}} />
                        </div>
                        <span className="text-[10px] font-bold text-slate-600 w-6 text-right">{count}</span>
                      </div>
                    ))}
                  </div>
                </>)}
              </div>
            </div>

            {/* ===== SEKOLAH + KELAS DISTRIBUTION ===== */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {/* Per Sekolah */}
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg"><School className="w-4 h-4" /></div>
                  <h3 className="text-sm font-bold text-slate-700">Distribusi Per Sekolah</h3>
                </div>
                {topSchools.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-4 text-center">Belum ada data sekolah</p>
                ) : (
                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    {topSchools.map(([name, count]) => (
                      <div key={name} className="flex items-center gap-3">
                        <span className="text-[11px] text-slate-600 w-36 truncate font-medium" title={name}>{name}</span>
                        <div className="flex-1 h-6 bg-slate-100 rounded-lg overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-lg transition-all duration-500 flex items-center pl-2" style={{width: `${(count/maxSchoolCount)*100}%`, minWidth: count > 0 ? '1.8rem' : '0'}}>
                            <span className="text-[10px] font-bold text-white">{count}</span>
                          </div>
                        </div>
                        <span className="text-[10px] text-slate-400 w-10 text-right">siswa</span>
                      </div>
                    ))}
                  </div>
                )}
                {topGuruSchools.length > 0 && (<>
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
                    <UserCheck className="w-3.5 h-3.5 text-blue-500" />
                    <span className="text-xs font-bold text-slate-600">Guru Per Sekolah</span>
                  </div>
                  <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1">
                    {topGuruSchools.map(([name, count]) => (
                      <div key={name} className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-500 w-36 truncate" title={name}>{name}</span>
                        <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-400 rounded-full transition-all duration-500" style={{width: `${(count/topGuruSchools[0][1])*100}%`}} />
                        </div>
                        <span className="text-[10px] font-bold text-slate-600 w-6 text-right">{count}</span>
                      </div>
                    ))}
                  </div>
                </>)}
              </div>

              {/* Per Kelas + Status Gizi */}
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg"><BarChart3 className="w-4 h-4" /></div>
                  <h3 className="text-sm font-bold text-slate-700">Distribusi Per Kelas</h3>
                </div>
                {kelasEntries.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-4 text-center">Belum ada data kelas</p>
                ) : (
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {kelasEntries.map(([kelas, count]) => (
                      <div key={kelas} className="flex items-center gap-3">
                        <span className="text-[11px] text-slate-600 w-14 font-bold">Kls {kelas}</span>
                        <div className="flex-1 h-5 bg-slate-100 rounded-lg overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-blue-400 to-blue-500 rounded-lg transition-all duration-500 flex items-center pl-2" style={{width: `${(count/maxKelas)*100}%`, minWidth: count > 0 ? '1.5rem' : '0'}}>
                            <span className="text-[10px] font-bold text-white">{count}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Status Gizi */}
                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100">
                  <div className="p-1.5 bg-teal-50 text-teal-600 rounded-lg"><Activity className="w-4 h-4" /></div>
                  <span className="text-xs font-bold text-slate-700">Status Gizi Siswa (BMI)</span>
                </div>
                {giziDataAvailable === 0 ? (
                  <p className="text-[10px] text-slate-400 italic mt-2">Data BB/TB belum tersedia</p>
                ) : (
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    <div className="bg-orange-50 border border-orange-200/60 rounded-xl p-2.5 text-center">
                      <div className="text-lg font-extrabold text-orange-600">{giziCounts.kurang}</div>
                      <div className="text-[10px] font-semibold text-orange-500">Kurus</div>
                      <div className="text-[9px] text-orange-400">{'>'}18.5</div>
                    </div>
                    <div className="bg-emerald-50 border border-emerald-200/60 rounded-xl p-2.5 text-center">
                      <div className="text-lg font-extrabold text-emerald-600">{giziCounts.normal}</div>
                      <div className="text-[10px] font-semibold text-emerald-500">Normal</div>
                      <div className="text-[9px] text-emerald-400">18.5-25</div>
                    </div>
                    <div className="bg-rose-50 border border-rose-200/60 rounded-xl p-2.5 text-center">
                      <div className="text-lg font-extrabold text-rose-600">{giziCounts.lebih}</div>
                      <div className="text-[10px] font-semibold text-rose-500">Gemuk</div>
                      <div className="text-[9px] text-rose-400">{'>'}25</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ===== QUICK STATS BOTTOM ===== */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/50 p-3 rounded-2xl">
                <div className="flex items-center gap-2 mb-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                  <span className="text-[10px] font-bold text-blue-600 uppercase">Sekolah</span>
                </div>
                <h3 className="text-xl font-extrabold text-blue-700">{topSchools.length}</h3>
                <p className="text-[10px] text-blue-400">terdaftar</p>
              </div>
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/50 p-3 rounded-2xl">
                <div className="flex items-center gap-2 mb-1">
                  <Heart className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-[10px] font-bold text-amber-600 uppercase">Posyandu</span>
                </div>
                <h3 className="text-xl font-extrabold text-amber-700">{topPosyandu.length}</h3>
                <p className="text-[10px] text-amber-400">aktif melayani 3B</p>
              </div>
              <div className="bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-200/50 p-3 rounded-2xl">
                <div className="flex items-center gap-2 mb-1">
                  <Milk className="w-3.5 h-3.5 text-violet-500" />
                  <span className="text-[10px] font-bold text-violet-600 uppercase">Busui</span>
                </div>
                <h3 className="text-xl font-extrabold text-violet-700">{busui}</h3>
                <p className="text-[10px] text-violet-400">ibu menyusui</p>
              </div>
              <div className="bg-gradient-to-br from-teal-50 to-cyan-50 border border-teal-200/50 p-3 rounded-2xl">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-3.5 h-3.5 text-teal-500" />
                  <span className="text-[10px] font-bold text-teal-600 uppercase">Data Gizi</span>
                </div>
                <h3 className="text-xl font-extrabold text-teal-700">{giziDataAvailable}</h3>
                <p className="text-[10px] text-teal-400">siswa dengan BB/TB</p>
              </div>
            </div>
          </div>
        );
      }

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
                <button onClick={() => handleMainTabChange('Rekapitulasi')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex-1 justify-center ${pmMainTab === 'Rekapitulasi' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'}`}>
                  <BarChart3 className="w-3.5 h-3.5" /><span>Rekapitulasi</span>
                </button>
              </div>
              {pmMainTab !== 'Rekapitulasi' && <>
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
                    <Heart className="w-3.5 h-3.5 text-rose-500" /><span>Bumil ({beneficiaries3b.filter(b => b.subCategory === 'Bumil').length})</span>
                  </button>
                  <button onClick={() => setPmSubTab('Busui')} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${pmSubTab === 'Busui' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold' : 'text-slate-500'}`}>
                    <Milk className="w-3.5 h-3.5 text-blue-500" /><span>Busui ({beneficiaries3b.filter(b => b.subCategory === 'Busui').length})</span>
                  </button>
                  <button onClick={() => setPmSubTab('Balita 0-6 Bln')} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${pmSubTab === 'Balita 0-6 Bln' ? 'bg-amber-50 text-amber-700 border border-amber-200 font-bold' : 'text-slate-500'}`}>
                    <Baby className="w-3.5 h-3.5 text-amber-500" /><span>Balita 0-6 Bln ({beneficiaries3b.filter(b => b.subCategory === 'Balita' && getAgeMonths(b.birthDate) < 6).length})</span>
                  </button>
                  <button onClick={() => setPmSubTab('Balita 6-59 Bln')} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${pmSubTab === 'Balita 6-59 Bln' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold' : 'text-slate-500'}`}>
                    <Baby className="w-3.5 h-3.5 text-emerald-500" /><span>Balita 6-59 Bln ({beneficiaries3b.filter(b => b.subCategory === 'Balita' && getAgeMonths(b.birthDate) >= 6 && getAgeMonths(b.birthDate) < 60).length})</span>
                  </button>
                  <button onClick={() => setPmSubTab('Balita >= 60 Bln')} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${pmSubTab === 'Balita >= 60 Bln' ? 'bg-red-50 text-red-700 border border-red-200 font-bold' : 'text-slate-500'}`}>
                    <Baby className="w-3.5 h-3.5 text-red-500" /><span>{'Balita >= 60 Bln'} ({beneficiaries3b.filter(b => b.subCategory === 'Balita' && getAgeMonths(b.birthDate) >= 60 && getAgeMonths(b.birthDate) < 999).length})</span>
                  </button>
                  <button onClick={() => setPmSubTab('Balita Tdk Dikategorikan')} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${pmSubTab === 'Balita Tdk Dikategorikan' ? 'bg-slate-100 text-slate-700 border border-slate-300 font-bold' : 'text-slate-500'}`}>
                    <AlertCircle className="w-3.5 h-3.5 text-slate-400" /><span>Balita Tdk Dikategorikan ({beneficiaries3b.filter(b => b.subCategory === 'Balita' && getAgeMonths(b.birthDate) >= 999).length})</span>
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
                  <input ref={csvInputRef} type="file" accept=".csv" multiple onChange={handleImportCSV} className="hidden" />
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
                  <button onClick={scanAllDuplicates} disabled={scanning} className="flex items-center gap-1 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white px-2.5 py-2 rounded-lg text-xs font-bold transition-all shadow-sm disabled:opacity-50" title="Deteksi Data Ganda/Mirip">
                    {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertCircle className="w-4 h-4" />}
                    <span className="sm:inline hidden">Deteksi Duplikat</span>
                  </button>
                  <button onClick={handleDeleteAll} disabled={deletingAll} className="flex items-center gap-1 bg-rose-500 hover:bg-rose-600 active:scale-95 text-white px-2.5 py-2 rounded-lg text-xs font-bold transition-all shadow-sm disabled:opacity-50" title="Hapus Semua Data">
                    {deletingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    <span className="sm:inline hidden">Hapus Semua</span>
                  </button>
                </div>
              </div>
              </>}
            </div>

            {pmMainTab === 'Rekapitulasi' ? (() => {
  const totalPenerima = students.length + teachers.length + beneficiaries3b.length;
  const siswaL = students.filter(s => s.jk === 'L').length;
  const siswaP = students.filter(s => s.jk === 'P').length;
  const guruL = teachers.filter(t => t.jk === 'L').length;
  const guruP = teachers.filter(t => t.jk === 'P').length;
  const b3bL = beneficiaries3b.filter(b => b.gender === 'L').length;
  const b3bP = beneficiaries3b.filter(b => b.gender === 'P').length;
  const totalL = siswaL + guruL + b3bL;
  const totalP = siswaP + guruP + b3bP;
  const bumil = beneficiaries3b.filter(b => b.subCategory === 'Bumil').length;
  const busui = beneficiaries3b.filter(b => b.subCategory === 'Busui').length;
  const balita = beneficiaries3b.filter(b => b.subCategory === 'Balita').length;
  const alergiSekolah = [...students.filter(s=>s.hasAllergy), ...teachers.filter(t=>t.hasAllergy)].length;
  const alergi3b = beneficiaries3b.filter(b=>b.hasAllergy).length;
  const alergiTotal = alergiSekolah + alergi3b;
  // === HITUNG PORSI ===
  const getJenjang = (name: string): string => {
    const u = name.toUpperCase().replace(/[^A-Z ]/g, '').trim();
    if (/^(TK|RA|RAUDHATUL)/.test(u)) return 'TK';
    if (/^(SD|MI|SDLB|MIN)/.test(u)) return 'SD';
    if (/^(SMP|MTS|SMPLB)/.test(u)) return 'SMP';
    if (/^(SMA|SMK|MA|MAK|SMAS|SMAN|SMKN|SMKS)/.test(u)) return 'SMA';
    return 'Lainnya';
  };
  const extractKelasNum = (kelas: string): number => {
    if (!kelas || kelas === '-') return -1;
    const cleaned = kelas.replace(/[^0-9]/g, '');
    if (cleaned) return parseInt(cleaned);
    const roman: Record<string,number> = {'I':1,'II':2,'III':3,'IV':4,'V':5,'VI':6,'VII':7,'VIII':8,'IX':9,'X':10,'XI':11,'XII':12};
    const upper = kelas.toUpperCase().trim();
    return roman[upper] ?? -1;
  };
  // Porsi Kecil: TK/RA + SD Kelas 1-3 + Balita 6-59 Bln
  const siswaTKRA = students.filter(s => getJenjang(s.schoolName) === 'TK').length;
  const siswaSDKelas123 = students.filter(s => {
    const j = getJenjang(s.schoolName);
    if (j !== 'SD' && j !== 'Lainnya') return false;
    const k = extractKelasNum(s.kelas);
    return k >= 1 && k <= 3;
  }).length;
  // Porsi Besar: Guru + SD Kelas 4-6 + SMP (semua) + SMA (semua) + Bumil + Busui
  const siswaSDKelas456 = students.filter(s => {
    const j = getJenjang(s.schoolName);
    if (j !== 'SD' && j !== 'Lainnya') return false;
    const k = extractKelasNum(s.kelas);
    return k >= 4 && k <= 6;
  }).length;
  const siswaSMP = students.filter(s => getJenjang(s.schoolName) === 'SMP').length;
  const siswaSMA = students.filter(s => getJenjang(s.schoolName) === 'SMA').length;
  const balita0_6 = beneficiaries3b.filter(b => b.subCategory === 'Balita' && classifyBalita(b.birthDate) === '< 6 Bln').length;
  const balita6_59 = beneficiaries3b.filter(b => b.subCategory === 'Balita' && (classifyBalita(b.birthDate) === '6-12 Bln' || classifyBalita(b.birthDate) === '12-59 Bln')).length;
  const balita60plus = beneficiaries3b.filter(b => b.subCategory === 'Balita' && classifyBalita(b.birthDate) === '>= 60 Bln').length;
  const balitaNoDate = beneficiaries3b.filter(b => b.subCategory === 'Balita' && classifyBalita(b.birthDate) === '-').length;
  const porsiKecil = siswaTKRA + siswaSDKelas123 + balita0_6 + balita6_59;
  const porsiBesar = teachers.length + siswaSDKelas456 + siswaSMP + siswaSMA + bumil + busui;
  const totalPorsi = porsiKecil + porsiBesar;
  const totalPenerimaAll = students.length + teachers.length + beneficiaries3b.length;
  const tidakKategori = totalPenerimaAll - totalPorsi;
  const schoolMap: Record<string,number> = {};
  students.forEach(s => { schoolMap[s.schoolName] = (schoolMap[s.schoolName] || 0) + 1; });
  const getJenjangPriority = (name: string): number => {
    const u = name.toUpperCase().replace(/[^A-Z ]/g, '').trim();
    const m1 = u.match(/^(TK|RA|RAUDHATUL)(?: |$)/);
    if (m1) return 1;
    const m2 = u.match(/^(SD|MI|SDLB|MIN)(?: |$)/);
    if (m2) return 2;
    const m3 = u.match(/^(SMP|MTS|SMPLB)(?: |$)/);
    if (m3) return 3;
    const m4 = u.match(/^(SMA|SMK|MA|MAK)(?: |$)/);
    if (m4) return 4;
    const first = u.split(/\s+/)[0];
    if (['TK','RA','RAUDHATUL'].includes(first)) return 1;
    if (['SD','MI','SDLB','MIN'].includes(first)) return 2;
    if (['SMP','MTS','SMPLB'].includes(first)) return 3;
    if (['SMA','SMK','MA','MAK'].includes(first)) return 4;
    return 5;
  };
  const topSchools = Object.entries(schoolMap).sort((a, b) => {
    const pa = getJenjangPriority(a[0]);
    const pb = getJenjangPriority(b[0]);
    if (pa !== pb) return pa - pb;
    return a[0].localeCompare(b[0]);
  });
  const kelasMap: Record<string,number> = {};
  students.forEach(s => { const k = s.kelas && s.kelas !== '-' ? s.kelas : '-'; kelasMap[k] = (kelasMap[k] || 0) + 1; });
  const kelasEntries = Object.entries(kelasMap).sort((a,b) => a[0].localeCompare(b[0], undefined, {numeric:true}));
  const guruSchoolMap: Record<string,number> = {};
  teachers.forEach(t => { guruSchoolMap[t.schoolName] = (guruSchoolMap[t.schoolName] || 0) + 1; });
  const posyanduMap: Record<string,{total:number,bumil:number,busui:number,balita:number}> = {};
  beneficiaries3b.forEach(b => {
    const n = b.posyanduName;
    if (!posyanduMap[n]) posyanduMap[n] = {total:0,bumil:0,busui:0,balita:0};
    posyanduMap[n].total++;
    if (b.subCategory === 'Bumil') posyanduMap[n].bumil++;
    else if (b.subCategory === 'Busui') posyanduMap[n].busui++;
    else posyanduMap[n].balita++;
  });
  const topPosyandu = Object.entries(posyanduMap).sort((a,b) => b[1].total - a[1].total);
  const giziC = {kurang:0,normal:0,lebih:0,noData:0};
  students.forEach(s => {
    if (s.beratBadan > 0 && s.tinggiBadan > 0) {
      const tbm = s.tinggiBadan / 100;
      if (tbm > 0) { const bmi = s.beratBadan / (tbm*tbm); if (bmi < 18.5) giziC.kurang++; else if (bmi > 25) giziC.lebih++; else giziC.normal++; }
    } else giziC.noData++;
  });
  return (
  <div className="space-y-3">
    {/* === HITUNG PORSI === */}
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-4 rounded-2xl shadow-lg text-white">
      <div className="flex items-center gap-2 mb-3"><UtensilsCrossed className="w-4 h-4 text-amber-400" /><h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">Hitung Porsi</h4></div>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white/10 backdrop-blur rounded-xl p-3 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-sky-300">Porsi Kecil</span>
            <span className="text-2xl font-extrabold text-sky-300">{porsiKecil}</span>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between"><span className="text-[10px] text-slate-300">TK/RA</span><span className="text-[10px] font-bold text-white">{siswaTKRA}</span></div>
            <div className="flex items-center justify-between"><span className="text-[10px] text-slate-300">SD Kelas 1-3</span><span className="text-[10px] font-bold text-white">{siswaSDKelas123}</span></div>
            <div className="flex items-center justify-between"><span className="text-[10px] text-slate-300">Balita 0-6 Bln</span><span className="text-[10px] font-bold text-white">{balita0_6}</span></div>
            <div className="flex items-center justify-between"><span className="text-[10px] text-slate-300">Balita 6-59 Bln</span><span className="text-[10px] font-bold text-white">{balita6_59}</span></div>
          </div>
        </div>
        <div className="bg-white/10 backdrop-blur rounded-xl p-3 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-orange-300">Porsi Besar</span>
            <span className="text-2xl font-extrabold text-orange-300">{porsiBesar}</span>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between"><span className="text-[10px] text-slate-300">Guru/Tendik</span><span className="text-[10px] font-bold text-white">{teachers.length}</span></div>
            <div className="flex items-center justify-between"><span className="text-[10px] text-slate-300">SD Kelas 4-6</span><span className="text-[10px] font-bold text-white">{siswaSDKelas456}</span></div>
            <div className="flex items-center justify-between"><span className="text-[10px] text-slate-300">SMP</span><span className="text-[10px] font-bold text-white">{siswaSMP}</span></div>
            <div className="flex items-center justify-between"><span className="text-[10px] text-slate-300">SMA/SMK</span><span className="text-[10px] font-bold text-white">{siswaSMA}</span></div>
            <div className="flex items-center justify-between"><span className="text-[10px] text-slate-300">Bumil</span><span className="text-[10px] font-bold text-white">{bumil}</span></div>
            <div className="flex items-center justify-between"><span className="text-[10px] text-slate-300">Busui</span><span className="text-[10px] font-bold text-white">{busui}</span></div>

          </div>
        </div>
      </div>
      <div className="mt-3 flex h-2.5 rounded-full overflow-hidden bg-white/10">
        {totalPenerimaAll > 0 && <>
          <div className="bg-gradient-to-r from-sky-400 to-sky-500 transition-all" style={{width: `${(porsiKecil/totalPenerimaAll)*100}%`}} />
          <div className="bg-gradient-to-r from-orange-400 to-orange-500 transition-all" style={{width: `${(porsiBesar/totalPenerimaAll)*100}%`}} />
          {tidakKategori > 0 && <div className="bg-gradient-to-r from-slate-500 to-slate-600 transition-all" style={{width: `${(tidakKategori/totalPenerimaAll)*100}%`}} />}
        </>}
      </div>
      <div className="mt-1.5 flex justify-between text-[9px] text-slate-400">
        <span>Kecil {totalPenerimaAll>0?((porsiKecil/totalPenerimaAll)*100).toFixed(0):0}%</span>
        <span className="font-bold text-white">Total: {totalPenerimaAll} penerima</span>
        <span>Besar {totalPenerimaAll>0?((porsiBesar/totalPenerimaAll)*100).toFixed(0):0}%</span>
      </div>
      {tidakKategori > 0 && (
        <div className="mt-2 bg-white/5 rounded-lg px-3 py-1.5 flex items-center justify-between">
          <span className="text-[10px] text-amber-300">Tidak Dikategorikan: Balita {'>= 60 Bln'} ({balita60plus}) + tanpa tanggal lahir ({balitaNoDate})</span>
          <span className="text-[10px] font-extrabold text-amber-300">{tidakKategori}</span>
        </div>
      )}
    </div>

    {/* Sub-tab toggle */}
    <div className="flex items-center bg-slate-100 p-1 rounded-xl">
      <button onClick={() => setRekapSubTab('Sekolah')} className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all flex-1 justify-center ${rekapSubTab === 'Sekolah' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
        <School className="w-3.5 h-3.5" /><span>Rekap Sekolah</span>
      </button>
      <button onClick={() => setRekapSubTab('3B')} className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all flex-1 justify-center ${rekapSubTab === '3B' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
        <Heart className="w-3.5 h-3.5" /><span>Rekap 3B</span>
      </button>
    </div>

    {rekapSubTab === 'Sekolah' ? (<>
    {/* === REKAP SEKOLAH === */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-3 rounded-2xl shadow-lg text-white">
        <div className="text-[10px] font-bold uppercase opacity-80">Total Sekolah</div>
        <h3 className="text-2xl font-extrabold mt-1">{students.length + teachers.length}</h3>
        <p className="text-[10px] opacity-75">Siswa + Guru/Tendik</p>
      </div>
      <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200">
        <div className="text-[10px] font-bold text-blue-400 uppercase">Siswa</div>
        <h3 className="text-2xl font-extrabold text-slate-800 mt-1">{students.length}</h3>
        <p className="text-[10px] text-slate-400">L: {siswaL} | P: {siswaP}</p>
      </div>
      <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200">
        <div className="text-[10px] font-bold text-violet-400 uppercase">Guru/Tendik</div>
        <h3 className="text-2xl font-extrabold text-slate-800 mt-1">{teachers.length}</h3>
        <p className="text-[10px] text-slate-400">L: {guruL} | P: {guruP}</p>
      </div>
      <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200">
        <div className="text-[10px] font-bold text-rose-400 uppercase">Alergi</div>
        <h3 className="text-2xl font-extrabold text-rose-600 mt-1">{alergiSekolah}</h3>
        <p className="text-[10px] text-slate-400">{(students.length+teachers.length) > 0 ? ((alergiSekolah/(students.length+teachers.length))*100).toFixed(1) : 0}% dari sekolah</p>
      </div>
    </div>
    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
      <div className="flex items-center gap-2 mb-3"><PieChart className="w-4 h-4 text-indigo-500" /><h4 className="text-xs font-bold text-slate-700">Distribusi Jenis Kelamin - Sekolah</h4></div>
      <div className="space-y-2">
        <div>
          <div className="flex justify-between mb-1"><span className="text-[10px] font-semibold text-emerald-600">Siswa</span><span className="text-[10px] text-slate-400">{siswaL} L | {siswaP} P</span></div>
          <div className="flex h-3 rounded-full overflow-hidden bg-slate-100">{siswaL+siswaP>0&&<><div className="bg-blue-400" style={{width: `${(siswaL/(siswaL+siswaP))*100}%`}}/><div className="bg-pink-300" style={{width: `${(siswaP/(siswaL+siswaP))*100}%`}}/></>}</div>
          <div className="flex justify-between mt-0.5"><span className="text-[9px] text-blue-500 font-semibold">L {siswaL+siswaP>0?((siswaL/(siswaL+siswaP))*100).toFixed(0):0}%</span><span className="text-[9px] text-pink-400 font-semibold">P {siswaL+siswaP>0?((siswaP/(siswaL+siswaP))*100).toFixed(0):0}%</span></div>
        </div>
        <div>
          <div className="flex justify-between mb-1"><span className="text-[10px] font-semibold text-violet-600">Guru/Tendik</span><span className="text-[10px] text-slate-400">{guruL} L | {guruP} P</span></div>
          <div className="flex h-3 rounded-full overflow-hidden bg-slate-100">{guruL+guruP>0&&<><div className="bg-blue-400" style={{width: `${(guruL/(guruL+guruP))*100}%`}}/><div className="bg-pink-300" style={{width: `${(guruP/(guruL+guruP))*100}%`}}/></>}</div>
          <div className="flex justify-between mt-0.5"><span className="text-[9px] text-blue-500 font-semibold">L {guruL+guruP>0?((guruL/(guruL+guruP))*100).toFixed(0):0}%</span><span className="text-[9px] text-pink-400 font-semibold">P {guruL+guruP>0?((guruP/(guruL+guruP))*100).toFixed(0):0}%</span></div>
        </div>
      </div>
    </div>
    {topSchools.length > 0 && (
    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
      <div className="flex items-center gap-2 mb-3"><School className="w-4 h-4 text-emerald-500" /><h4 className="text-xs font-bold text-slate-700">Rekapitulasi Per Sekolah</h4></div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead><tr className="bg-emerald-50 text-emerald-700"><th className="px-3 py-2 text-left font-semibold border-b border-emerald-200/60">Sekolah</th><th className="px-3 py-2 text-center font-semibold border-b border-emerald-200/60">Siswa</th><th className="px-3 py-2 text-center font-semibold border-b border-emerald-200/60">L</th><th className="px-3 py-2 text-center font-semibold border-b border-emerald-200/60">P</th><th className="px-3 py-2 text-center font-semibold border-b border-emerald-200/60">Guru</th></tr></thead>
          <tbody>
            {topSchools.map(([name, count]) => { const sL = students.filter(s => s.schoolName === name && s.jk === 'L').length; const sP = students.filter(s => s.schoolName === name && s.jk === 'P').length; const gC = guruSchoolMap[name] || 0; return (<tr key={name} className="border-b border-slate-100 hover:bg-slate-50/50"><td className="px-3 py-2 font-medium text-slate-700">{name}</td><td className="px-3 py-2 text-center font-bold">{count}</td><td className="px-3 py-2 text-center text-blue-500">{sL}</td><td className="px-3 py-2 text-center text-pink-400">{sP}</td><td className="px-3 py-2 text-center text-violet-500">{gC}</td></tr>); })}
            <tr className="bg-emerald-50/50 font-bold"><td className="px-3 py-2 text-emerald-800">TOTAL</td><td className="px-3 py-2 text-center">{students.length}</td><td className="px-3 py-2 text-center text-blue-600">{siswaL}</td><td className="px-3 py-2 text-center text-pink-500">{siswaP}</td><td className="px-3 py-2 text-center text-violet-600">{teachers.length}</td></tr>
          </tbody>
        </table>
      </div>
    </div>
    )}
    {kelasEntries.length > 0 && (
    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
      <div className="flex items-center gap-2 mb-3"><BarChart3 className="w-4 h-4 text-blue-500" /><h4 className="text-xs font-bold text-slate-700">Rekapitulasi Per Kelas</h4></div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead><tr className="bg-blue-50 text-blue-700"><th className="px-3 py-2 text-center font-semibold border-b border-blue-200/60">Kelas</th><th className="px-3 py-2 text-center font-semibold border-b border-blue-200/60">Jumlah</th><th className="px-3 py-2 text-center font-semibold border-b border-blue-200/60">L</th><th className="px-3 py-2 text-center font-semibold border-b border-blue-200/60">P</th></tr></thead>
          <tbody>
            {kelasEntries.map(([k, c]) => { const kL = students.filter(s => { const kk = s.kelas && s.kelas !== '-' ? s.kelas : '-'; return kk === k && s.jk === 'L'; }).length; const kP = students.filter(s => { const kk = s.kelas && s.kelas !== '-' ? s.kelas : '-'; return kk === k && s.jk === 'P'; }).length; return (<tr key={k} className="border-b border-slate-100 hover:bg-slate-50/50"><td className="px-3 py-2 text-center font-bold">{k === '-' ? 'Lainnya' : k}</td><td className="px-3 py-2 text-center font-bold">{c}</td><td className="px-3 py-2 text-center text-blue-500">{kL}</td><td className="px-3 py-2 text-center text-pink-400">{kP}</td></tr>); })}
          </tbody>
        </table>
      </div>
    </div>
    )}
    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
      <div className="flex items-center gap-2 mb-3"><Activity className="w-4 h-4 text-teal-500" /><h4 className="text-xs font-bold text-slate-700">Rekapitulasi Status Gizi Siswa (BMI)</h4></div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        <div className="bg-orange-50 border border-orange-200/60 rounded-xl p-3 text-center"><div className="text-xl font-extrabold text-orange-600">{giziC.kurang}</div><div className="text-[10px] font-semibold text-orange-500">Kurus (&lt;18.5)</div><div className="mt-1.5 h-1.5 bg-orange-200 rounded-full overflow-hidden"><div className="h-full bg-orange-500 rounded-full" style={{width: students.length>0?(giziC.kurang/students.length)*100:0+"%"}}/></div></div>
        <div className="bg-emerald-50 border border-emerald-200/60 rounded-xl p-3 text-center"><div className="text-xl font-extrabold text-emerald-600">{giziC.normal}</div><div className="text-[10px] font-semibold text-emerald-500">Normal (18.5-25)</div><div className="mt-1.5 h-1.5 bg-emerald-200 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 rounded-full" style={{width: students.length>0?(giziC.normal/students.length)*100:0+"%"}}/></div></div>
        <div className="bg-rose-50 border border-rose-200/60 rounded-xl p-3 text-center"><div className="text-xl font-extrabold text-rose-600">{giziC.lebih}</div><div className="text-[10px] font-semibold text-rose-500">Gemuk (&gt;25)</div><div className="mt-1.5 h-1.5 bg-rose-200 rounded-full overflow-hidden"><div className="h-full bg-rose-500 rounded-full" style={{width: students.length>0?(giziC.lebih/students.length)*100:0+"%"}}/></div></div>
        <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-3 text-center"><div className="text-xl font-extrabold text-slate-400">{giziC.noData}</div><div className="text-[10px] font-semibold text-slate-400">Belum Ada Data BB/TB</div><div className="mt-1.5 h-1.5 bg-slate-200 rounded-full overflow-hidden"><div className="h-full bg-slate-400 rounded-full" style={{width: students.length>0?(giziC.noData/students.length)*100:0+"%"}}/></div></div>
      </div>
    </div>
    </>) : (<>
    {/* === REKAP 3B === */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <div className="bg-gradient-to-br from-amber-500 to-amber-600 p-3 rounded-2xl shadow-lg text-white">
        <div className="text-[10px] font-bold uppercase opacity-80">Total Penerima 3B</div>
        <h3 className="text-2xl font-extrabold mt-1">{beneficiaries3b.length}</h3>
        <p className="text-[10px] opacity-75">Bumil + Busui + Balita</p>
      </div>
      <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-1.5 mb-1"><div className="w-2 h-2 rounded-full bg-rose-400" /><span className="text-[10px] font-bold text-rose-500 uppercase">Bumil</span></div>
        <h3 className="text-2xl font-extrabold text-slate-800">{bumil}</h3>
        <p className="text-[10px] text-slate-400">ibu hamil</p>
      </div>
      <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-1.5 mb-1"><div className="w-2 h-2 rounded-full bg-violet-400" /><span className="text-[10px] font-bold text-violet-500 uppercase">Busui</span></div>
        <h3 className="text-2xl font-extrabold text-slate-800">{busui}</h3>
        <p className="text-[10px] text-slate-400">ibu menyusui</p>
      </div>
      <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-1.5 mb-1"><div className="w-2 h-2 rounded-full bg-cyan-400" /><span className="text-[10px] font-bold text-cyan-500 uppercase">Balita</span></div>
        <h3 className="text-2xl font-extrabold text-slate-800">{balita}</h3>
        <p className="text-[10px] text-slate-400">anak 0-59 bulan</p>
      </div>
    </div>
    <div className="grid grid-cols-2 gap-3">
      <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200">
        <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Jenis Kelamin</div>
        <div className="flex items-center gap-2 mt-2">
          <div className="flex-1 text-center p-2 bg-blue-50 rounded-xl"><div className="text-lg font-extrabold text-blue-600">{b3bL}</div><div className="text-[10px] text-blue-500 font-semibold">Laki-laki</div></div>
          <div className="flex-1 text-center p-2 bg-pink-50 rounded-xl"><div className="text-lg font-extrabold text-pink-500">{b3bP}</div><div className="text-[10px] text-pink-400 font-semibold">Perempuan</div></div>
        </div>
        <div className="flex h-2.5 rounded-full overflow-hidden bg-slate-100 mt-2">{b3bL+b3bP>0&&<><div className="bg-blue-400" style={{width: `${(b3bL/(b3bL+b3bP))*100}%`}}/><div className="bg-pink-300" style={{width: `${(b3bP/(b3bL+b3bP))*100}%`}}/></>}</div>
      </div>
      <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200">
        <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Posyandu Aktif</div>
        <h3 className="text-2xl font-extrabold text-amber-600 mt-2">{topPosyandu.length}</h3>
        <p className="text-[10px] text-slate-400">melayani penerima 3B</p>
      </div>
    </div>
    {topPosyandu.length > 0 && (
    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
      <div className="flex items-center gap-2 mb-3"><Heart className="w-4 h-4 text-rose-500" /><h4 className="text-xs font-bold text-slate-700">Rekapitulasi Penerima 3B Per Posyandu</h4></div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead><tr className="bg-amber-50 text-amber-700"><th className="px-3 py-2 text-left font-semibold border-b border-amber-200/60">Posyandu</th><th className="px-3 py-2 text-center font-semibold border-b border-amber-200/60">Bumil</th><th className="px-3 py-2 text-center font-semibold border-b border-amber-200/60">Busui</th><th className="px-3 py-2 text-center font-semibold border-b border-amber-200/60">Balita</th><th className="px-3 py-2 text-center font-semibold border-b border-amber-200/60">L</th><th className="px-3 py-2 text-center font-semibold border-b border-amber-200/60">P</th><th className="px-3 py-2 text-center font-semibold border-b border-amber-200/60">Total</th></tr></thead>
          <tbody>
            {topPosyandu.map(([name, d]) => { const pL = beneficiaries3b.filter(b => b.posyanduName === name && b.gender === 'L').length; const pP = beneficiaries3b.filter(b => b.posyanduName === name && b.gender === 'P').length; return (<tr key={name} className="border-b border-slate-100 hover:bg-slate-50/50"><td className="px-3 py-2 font-medium text-slate-700">{name}</td><td className="px-3 py-2 text-center"><span className="inline-block px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 font-bold text-[10px]">{d.bumil}</span></td><td className="px-3 py-2 text-center"><span className="inline-block px-2 py-0.5 rounded-full bg-violet-50 text-violet-600 font-bold text-[10px]">{d.busui}</span></td><td className="px-3 py-2 text-center"><span className="inline-block px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-600 font-bold text-[10px]">{d.balita}</span></td><td className="px-3 py-2 text-center text-blue-500">{pL}</td><td className="px-3 py-2 text-center text-pink-400">{pP}</td><td className="px-3 py-2 text-center font-extrabold text-slate-800">{d.total}</td></tr>); })}
            <tr className="bg-amber-50/50 font-bold"><td className="px-3 py-2 text-amber-800">TOTAL</td><td className="px-3 py-2 text-center text-rose-600">{bumil}</td><td className="px-3 py-2 text-center text-violet-600">{busui}</td><td className="px-3 py-2 text-center text-cyan-600">{balita}</td><td className="px-3 py-2 text-center text-blue-600">{b3bL}</td><td className="px-3 py-2 text-center text-pink-500">{b3bP}</td><td className="px-3 py-2 text-center text-amber-800">{beneficiaries3b.length}</td></tr>
          </tbody>
        </table>
      </div>
    </div>
    )}
    </>)}
  </div>
  );
})() : null}

    {/* DESKTOP: TABLE VIEW (hidden on mobile) */}
            {pmMainTab !== 'Rekapitulasi' && <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
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
                        <th className="py-2.5 px-3 border-r border-slate-200">Nama {isBalitaTab() ? 'Anak' : 'Penerima'} / NIK</th>
                        <th className="py-2.5 px-3 text-center border-r border-slate-200">JK</th>
                        <th className="py-2.5 px-3 border-r border-slate-200">Tempat, Tgl Lahir</th>
                        <th className="py-2.5 px-3 text-center border-r border-slate-200 bg-blue-50/50 text-blue-800">Umur</th>
                        {isBalitaTab() ? (<>
                          <th className="py-2.5 px-3 text-center border-r border-slate-200 bg-amber-50/50 text-amber-800">Klasifikasi</th>
                          <th className="py-2.5 px-3 border-r border-slate-200">Nama Orang Tua</th>
                          <th className="py-2.5 px-3 border-r border-slate-200">Alamat</th>
                          <th className="py-2.5 px-3 text-center border-r border-slate-200">BB (kg)</th>
                          <th className="py-2.5 px-3 text-center border-r border-slate-200">TB (cm)</th>
                          <th className="py-2.5 px-3 text-center border-r border-slate-200">LK (cm)</th>
                          <th className="py-2.5 px-3 text-center border-r border-slate-200">LL (cm)</th>
                        </>) : (<>
                          <th className="py-2.5 px-3 border-r border-slate-200">Usia Kandungan</th>
                          <th className="py-2.5 px-3 border-r border-slate-200">Alamat</th>
                          <th className="py-2.5 px-3 text-center border-r border-slate-200">BB (kg)</th>
                          <th className="py-2.5 px-3 text-center border-r border-slate-200">TB (cm)</th>
                          <th className="py-2.5 px-3 text-center border-r border-slate-200">LK (cm)</th>
                          <th className="py-2.5 px-3 text-center border-r border-slate-200">LL (cm)</th>
                        </>)}
                        <th className="py-2.5 px-3 border-r border-slate-200">Posyandu</th>
                        <th className="py-2.5 px-3 border-r border-slate-200">Alergi</th>
                        <th className="py-2.5 px-3 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {filtered3b.length > 0 ? filtered3b.map((b, idx) => (
                        <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-2.5 px-3 text-center border-r border-slate-100 font-semibold text-slate-400">{idx+1}</td>
                          <td className="py-2.5 px-3 border-r border-slate-100"><p className="font-semibold text-slate-800">{b.fullName}</p><p className="text-slate-400 text-[11px]">NIK: {b.nik}</p></td>
                          <td className="py-2.5 px-3 text-center border-r border-slate-100 font-bold">{b.gender}</td>
                          <td className="py-2.5 px-3 border-r border-slate-100">{b.tempatLahir !== '-' ? b.tempatLahir + ', ' : ''}{b.birthDate}</td>
                          <td className="py-2.5 px-3 text-center border-r border-slate-100 font-bold text-blue-700">{calculateAge(b.birthDate)}</td>
                          {isBalitaTab() ? (<>
                            <td className="py-2.5 px-3 text-center border-r border-slate-100"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${classifyBalita(b.birthDate) === '6-12 Bln' ? 'bg-amber-50 text-amber-700' : classifyBalita(b.birthDate) === '12-59 Bln' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{classifyBalita(b.birthDate)}</span></td>
                            <td className="py-2.5 px-3 border-r border-slate-100 font-medium">{b.namaOrtu}</td>
                            <td className="py-2.5 px-3 border-r border-slate-100 max-w-[150px] truncate">{b.alamat}</td>
                            <td className="py-2.5 px-3 text-center border-r border-slate-100 font-semibold text-emerald-700">{b.beratBadan || '-'}</td>
                            <td className="py-2.5 px-3 text-center border-r border-slate-100 font-semibold text-blue-700">{b.tinggiBadan || '-'}</td>
                            <td className="py-2.5 px-3 text-center border-r border-slate-100 font-semibold text-violet-700">{b.lingkarKepala || '-'}</td>
                            <td className="py-2.5 px-3 text-center border-r border-slate-100 font-semibold text-amber-700">{b.lingkarLengan || '-'}</td>
                          </>) : (<>
                            <td className="py-2.5 px-3 border-r border-slate-100"><span className="px-2 py-0.5 bg-amber-50 text-amber-800 rounded font-semibold">{b.usiaKandungan}</span></td>
                            <td className="py-2.5 px-3 border-r border-slate-100 max-w-[150px] truncate">{b.alamat}</td>
                            <td className="py-2.5 px-3 text-center border-r border-slate-100 font-semibold text-emerald-700">{b.beratBadan || '-'}</td>
                            <td className="py-2.5 px-3 text-center border-r border-slate-100 font-semibold text-blue-700">{b.tinggiBadan || '-'}</td>
                            <td className="py-2.5 px-3 text-center border-r border-slate-100 font-semibold text-violet-700">{b.lingkarKepala || '-'}</td>
                            <td className="py-2.5 px-3 text-center border-r border-slate-100 font-semibold text-amber-700">{b.lingkarLengan || '-'}</td>
                          </>)}
                          <td className="py-2.5 px-3 border-r border-slate-100 font-medium text-slate-800">{b.posyanduName}</td>
                          <td className="py-2.5 px-3 border-r border-slate-100">{b.hasAllergy ? <span className="px-2 py-0.5 bg-rose-100 text-rose-700 rounded font-bold">{b.allergyType}</span> : <span className="px-2 py-0.5 bg-slate-100 text-slate-400 rounded">Aman</span>}</td>
                          <td className="py-2.5 px-3 text-center"><div className="flex items-center justify-center space-x-1"><button onClick={() => handleEdit('beneficiaries-3b', b)} className="text-blue-400 hover:text-blue-600 p-1" title="Edit"><Pencil className="w-3.5 h-3.5" /></button><button onClick={() => handleDelete('beneficiaries-3b', b.id)} className="text-slate-400 hover:text-rose-500 p-1" title="Hapus"><Trash2 className="w-3.5 h-3.5" /></button></div></td>
                        </tr>
                      )) : (<tr><td colSpan={15} className="py-8 text-center text-slate-400 italic">Data {pmSubTab} tidak ditemukan...</td></tr>)}
                    </tbody>
                  </table>
                )}
              </div>
            </div>}

            {/* MOBILE: CARD VIEW (hidden on desktop) */}
            {pmMainTab !== 'Rekapitulasi' && <div className="md:hidden space-y-3">
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
            </div>}
          </div>
        );

      case 'ASLAP':
        return <AslapModule />;

      case 'Manajemen User':
        return <UserModule />;

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
              {/* BANNER DETEKSI DATA GANDA */}
              {duplicateWarnings.length > 0 && !editingId && (
                <div className={`p-3 rounded-xl border space-y-1.5 ${duplicateWarnings.some(w => w.type === 'exact') ? 'bg-rose-50 border-rose-300' : 'bg-amber-50 border-amber-300'}`}>
                  <div className="flex items-center gap-2">
                    <AlertCircle className={`w-4 h-4 shrink-0 ${duplicateWarnings.some(w => w.type === 'exact') ? 'text-rose-500' : 'text-amber-500'}`} />
                    <span className={`text-xs font-bold ${duplicateWarnings.some(w => w.type === 'exact') ? 'text-rose-700' : 'text-amber-700'}`}>
                      {duplicateWarnings.some(w => w.type === 'exact') ? 'Data Ganda Terdeteksi - Penyimpanan Diblokir' : 'Data Mirip Ditemukan - Perhatian'}
                    </span>
                  </div>
                  {duplicateWarnings.map((w, i) => (
                    <div key={i} className={`flex items-start gap-1.5 text-[11px] ${w.type === 'exact' ? 'text-rose-600' : 'text-amber-600'}`}>
                      <span className="font-bold mt-px">{w.type === 'exact' ? '✕' : '⚠'}</span>
                      <span><b>{w.label}</b> ({w.field}): {w.detail}</span>
                    </div>
                  ))}
                  {duplicateWarnings.some(w => w.type === 'similar') && (
                    <p className="text-[10px] text-amber-500 italic">Data mirip masih bisa disimpan dengan konfirmasi.</p>
                  )}
                </div>
              )}
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
                    <div className="sm:col-span-2"><label className="block text-xs font-semibold text-slate-700 mb-1">Nama {isBalitaTab() ? 'Anak' : 'Penerima'} ({pmSubTab}) *</label><input type="text" required placeholder={isBalitaTab() ? 'Nama Anak Balita' : 'Nama Ibu'} value={form3B.fullName} onChange={(e) => setForm3B({...form3B, fullName: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" /></div>
                    <div><label className="block text-xs font-semibold text-slate-700 mb-1">NIK</label><input type="text" placeholder="610102..." value={form3B.nik} onChange={(e) => setForm3B({...form3B, nik: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" /></div>
                    <div><label className="block text-xs font-semibold text-slate-700 mb-1">Jenis Kelamin</label><select value={form3B.gender} onChange={(e) => setForm3B({...form3B, gender: e.target.value as 'L'|'P'})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"><option value="P">Perempuan (P)</option><option value="L">Laki-laki (L)</option></select></div>
                    <div><label className="block text-xs font-semibold text-slate-700 mb-1">Tempat Lahir</label><input type="text" placeholder="Kab. Buton" value={form3B.tempatLahir} onChange={(e) => setForm3B({...form3B, tempatLahir: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" /></div>
                    <div><label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal Lahir</label><input type="date" value={form3B.birthDate} onChange={(e) => setForm3B({...form3B, birthDate: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" />{form3B.birthDate && <p className="text-[11px] text-blue-600 font-semibold mt-1 flex items-center gap-1"><Calendar className="w-3 h-3" /><span>Umur: {calculateAge(form3B.birthDate)}</span></p>}</div>
                    {isBalitaTab() ? (
                      <>
                        <div className="sm:col-span-2"><label className="block text-xs font-semibold text-slate-700 mb-1">Nama Orang Tua *</label><input type="text" required placeholder="Nama Ibu / Ayah" value={form3B.namaOrtu} onChange={(e) => setForm3B({...form3B, namaOrtu: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" /></div>
                        <div className="sm:col-span-2"><label className="block text-xs font-semibold text-slate-700 mb-1">Alamat</label><input type="text" placeholder="Desa/Kelurahan, Kecamatan" value={form3B.alamat} onChange={(e) => setForm3B({...form3B, alamat: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" /></div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          <div><label className="block text-xs font-semibold text-slate-700 mb-1">BB (kg)</label><input type="number" step="0.1" placeholder="10.5" value={form3B.beratBadan} onChange={(e) => setForm3B({...form3B, beratBadan: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" /></div>
                          <div><label className="block text-xs font-semibold text-slate-700 mb-1">TB (cm)</label><input type="number" step="0.1" placeholder="85.0" value={form3B.tinggiBadan} onChange={(e) => setForm3B({...form3B, tinggiBadan: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" /></div>
                          <div><label className="block text-xs font-semibold text-slate-700 mb-1">LK (cm)</label><input type="number" step="0.1" placeholder="48.5" value={form3B.lingkarKepala} onChange={(e) => setForm3B({...form3B, lingkarKepala: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" /></div>
                          <div><label className="block text-xs font-semibold text-slate-700 mb-1">LL (cm)</label><input type="number" step="0.1" placeholder="14.5" value={form3B.lingkarLengan} onChange={(e) => setForm3B({...form3B, lingkarLengan: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" /></div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div><label className="block text-xs font-semibold text-slate-700 mb-1">Usia Kandungan</label><input type="text" placeholder="Contoh: 24 Minggu / 7 Bulan" value={form3B.usiaKandungan} onChange={(e) => setForm3B({...form3B, usiaKandungan: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" /></div>
                        <div className="sm:col-span-2"><label className="block text-xs font-semibold text-slate-700 mb-1">Alamat</label><input type="text" placeholder="Desa/Kelurahan, Kecamatan" value={form3B.alamat} onChange={(e) => setForm3B({...form3B, alamat: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" /></div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          <div><label className="block text-xs font-semibold text-slate-700 mb-1">BB (kg)</label><input type="number" step="0.1" placeholder="65.0" value={form3B.beratBadan} onChange={(e) => setForm3B({...form3B, beratBadan: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" /></div>
                          <div><label className="block text-xs font-semibold text-slate-700 mb-1">TB (cm)</label><input type="number" step="0.1" placeholder="158.0" value={form3B.tinggiBadan} onChange={(e) => setForm3B({...form3B, tinggiBadan: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" /></div>
                          <div><label className="block text-xs font-semibold text-slate-700 mb-1">LK (cm)</label><input type="number" step="0.1" placeholder="56.0" value={form3B.lingkarKepala} onChange={(e) => setForm3B({...form3B, lingkarKepala: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" /></div>
                          <div><label className="block text-xs font-semibold text-slate-700 mb-1">LL (cm)</label><input type="number" step="0.1" placeholder="24.0" value={form3B.lingkarLengan} onChange={(e) => setForm3B({...form3B, lingkarLengan: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" /></div>
                        </div>
                      </>
                    )}

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
      {/* === MODAL DETEKSI DUPLIKAT DATABASE === */}
      {dupModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center">
          <div className="bg-white w-full sm:max-w-2xl sm:rounded-2xl shadow-2xl border border-slate-100 overflow-hidden max-h-[95vh] sm:max-h-[90vh] flex flex-col rounded-t-2xl">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <div>
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2"><AlertCircle className="w-5 h-5 text-amber-500" />Hasil Deteksi Data Ganda</h3>
                <p className="text-xs text-slate-500 mt-0.5">{dupResults.length} pasang ditemukan &mdash; {dupExactCount} ganda pasti, {dupSimilarCount} mirip</p>
              </div>
              <button onClick={() => setDupModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-xl"><X className="w-5 h-5" /></button>
            </div>
            {/* Filter tabs */}
            <div className="flex items-center gap-1 p-3 bg-slate-50/50 border-b border-slate-100">
              {[['all','Semua'],['students','Siswa'],['teachers','Guru'],['3b','3B']].map(([k,l]) => (
                <button key={k} onClick={() => setDupFilter(k as any)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${dupFilter===k ? 'bg-amber-500 text-white shadow-sm' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}>{l}</button>
              ))}
              {dupResults.length > 0 && (
                <button onClick={handleDeleteAllDup} className="ml-auto flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-500 text-white hover:bg-rose-600 active:scale-95 transition-all"><Trash2 className="w-3.5 h-3.5" />Hapus Semua Duplikat</button>
              )}
            </div>
            {/* Results */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {filteredDup.length === 0 ? (
                <div className="text-center py-12"><AlertCircle className="w-12 h-12 text-emerald-300 mx-auto mb-3" /><p className="text-sm font-semibold text-slate-500">Tidak ada data ganda</p><p className="text-xs text-slate-400 mt-1">Semua data unik dan bersih</p></div>
              ) : filteredDup.map((g, gi) => (
                <div key={gi} className={`rounded-xl border p-3 space-y-2 ${g.severity === 'exact' ? 'bg-rose-50/70 border-rose-200' : 'bg-amber-50/70 border-amber-200'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${g.severity === 'exact' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>{g.severity === 'exact' ? 'GANDA PASTI' : 'MIRIP'}</span>
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">{g.type === 'students' ? 'Siswa' : g.type === 'teachers' ? 'Guru' : '3B'}</span>
                      <span className="text-xs text-slate-600 font-semibold">{g.reason}</span>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    {g.items.map((item, ii) => (
                      <div key={item.id} className={`flex items-center justify-between gap-2 p-2 rounded-lg ${ii === 0 ? 'bg-white border border-emerald-200' : 'bg-white border border-rose-200'}`}>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {ii === 0 && <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[9px] font-bold shrink-0">DIPEPERTAHANKAN</span>}
                            <span className="text-xs font-bold text-slate-800 truncate">{item.nama}</span>
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">{item.lokasi} &middot; {item.detail} {item.nik && item.nik !== '-' ? `&middot; NIK: ${item.nik}` : ''}</div>
                        </div>
                        {ii > 0 && (
                          <button onClick={() => handleDeleteDupItem(g.type, item.id)} className="shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-500 text-white text-[10px] font-bold hover:bg-rose-600 active:scale-95 transition-all"><Trash2 className="w-3 h-3" />Hapus</button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}