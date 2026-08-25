'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  FileBarChart, School, Baby, Heart, Users, GraduationCap, UserCheck,
  PieChart, BarChart3, Activity, UtensilsCrossed, Loader2, Download, AlertCircle
} from 'lucide-react';
import * as ExcelJS from 'exceljs';

interface StudentBeneficiary {
  id: string; nama: string; schoolName: string; jk: 'L' | 'P'; kelas: string;
  beratBadan: number; tinggiBadan: number; hasAllergy: boolean; allergyType?: string;
}
interface TeacherBeneficiary {
  id: string; fullName: string; schoolName: string; jk: 'L' | 'P';
  hasAllergy: boolean; allergyType?: string;
}
interface Beneficiary3B {
  id: string; posyanduName: string; subCategory: 'Bumil' | 'Busui' | 'Balita';
  gender: 'L' | 'P'; birthDate: string;
}

const classifyBalita = (birthDateString: string): string => {
  if (!birthDateString || birthDateString === '-') return '-';
  const bd = new Date(birthDateString); const today = new Date();
  if (isNaN(bd.getTime())) return '-';
  let y = today.getFullYear() - bd.getFullYear(); let m = today.getMonth() - bd.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < bd.getDate())) { y--; m += 12; }
  const totalMonths = y * 12 + m;
  if (totalMonths < 6) return '< 6 Bln';
  if (totalMonths <= 12) return '6-12 Bln';
  if (totalMonths <= 59) return '12-59 Bln';
  return '>= 60 Bln';
};

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
  return roman[kelas.toUpperCase().trim()] ?? -1;
};
const getJenjangPriority = (name: string): number => {
  const u = name.toUpperCase().replace(/[^A-Z ]/g, '').trim();
  if (/^(TK|RA|RAUDHATUL)/.test(u)) return 1;
  if (/^(SD|MI|SDLB|MIN)/.test(u)) return 2;
  if (/^(SMP|MTS|SMPLB)/.test(u)) return 3;
  if (/^(SMA|SMK|MA|MAK)/.test(u)) return 4;
  return 5;
};

export default function RekapitulasiPmModule() {
  const [students, setStudents] = useState<StudentBeneficiary[]>([]);
  const [teachers, setTeachers] = useState<TeacherBeneficiary[]>([]);
  const [beneficiaries3b, setBeneficiaries3b] = useState<Beneficiary3B[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'Sekolah' | '3B'>('Sekolah');
  const [exporting, setExporting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [sRes, tRes, bRes] = await Promise.all([
        fetch('/api/students').then(r => r.json()),
        fetch('/api/teachers').then(r => r.json()),
        fetch('/api/beneficiaries-3b').then(r => r.json()),
      ]);
      setStudents(Array.isArray(sRes) ? sRes : []);
      setTeachers(Array.isArray(tRes) ? tRes : []);
      setBeneficiaries3b(Array.isArray(bRes) ? bRes : []);
    } catch { /* silent */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // === COMPUTED VALUES ===
  const siswaTKRA = students.filter(s => getJenjang(s.schoolName) === 'TK').length;
  const siswaSDKelas123 = students.filter(s => { const j = getJenjang(s.schoolName); if (j !== 'SD' && j !== 'Lainnya') return false; const k = extractKelasNum(s.kelas); return k >= 1 && k <= 3; }).length;
  const siswaSDKelas456 = students.filter(s => { const j = getJenjang(s.schoolName); if (j !== 'SD' && j !== 'Lainnya') return false; const k = extractKelasNum(s.kelas); return k >= 4 && k <= 6; }).length;
  const siswaSMP = students.filter(s => getJenjang(s.schoolName) === 'SMP').length;
  const siswaSMA = students.filter(s => getJenjang(s.schoolName) === 'SMA').length;
  const bumil = beneficiaries3b.filter(b => b.subCategory === 'Bumil').length;
  const busui = beneficiaries3b.filter(b => b.subCategory === 'Busui').length;
  const balita0_6 = beneficiaries3b.filter(b => b.subCategory === 'Balita' && classifyBalita(b.birthDate) === '< 6 Bln').length;
  const balita6_59 = beneficiaries3b.filter(b => b.subCategory === 'Balita' && (classifyBalita(b.birthDate) === '6-12 Bln' || classifyBalita(b.birthDate) === '12-59 Bln')).length;
  const balita60plus = beneficiaries3b.filter(b => b.subCategory === 'Balita' && classifyBalita(b.birthDate) === '>= 60 Bln').length;
  const balitaNoDate = beneficiaries3b.filter(b => b.subCategory === 'Balita' && classifyBalita(b.birthDate) === '-').length;
  const porsiKecil = siswaTKRA + siswaSDKelas123 + balita0_6 + balita6_59;
  const porsiBesar = teachers.length + siswaSDKelas456 + siswaSMP + siswaSMA + bumil + busui;
  const totalPorsi = porsiKecil + porsiBesar;
  const totalPenerimaAll = students.length + teachers.length + beneficiaries3b.length;
  const tidakKategori = totalPenerimaAll - totalPorsi;

  // Gender
  const siswaL = students.filter(s => s.jk === 'L').length;
  const siswaP = students.filter(s => s.jk === 'P').length;
  const guruL = teachers.filter(t => t.jk === 'L').length;
  const guruP = teachers.filter(t => t.jk === 'P').length;
  const b3bL = beneficiaries3b.filter(b => b.gender === 'L').length;
  const b3bP = beneficiaries3b.filter(b => b.gender === 'P').length;

  // Alergi
  const alergiSekolah = [...students.filter(s=>s.hasAllergy), ...teachers.filter(t=>t.hasAllergy)].length;
  const alergi3b = beneficiaries3b.filter(b=>b.hasAllergy).length;
  const alergiTotal = alergiSekolah + alergi3b;

  // School maps
  const schoolMap: Record<string,number> = {};
  students.forEach(s => { schoolMap[s.schoolName] = (schoolMap[s.schoolName] || 0) + 1; });
  const topSchools = Object.entries(schoolMap).sort((a, b) => {
    const pa = getJenjangPriority(a[0]); const pb = getJenjangPriority(b[0]);
    if (pa !== pb) return pa - pb; return a[0].localeCompare(b[0]);
  });
  const guruSchoolMap: Record<string,number> = {};
  teachers.forEach(t => { guruSchoolMap[t.schoolName] = (guruSchoolMap[t.schoolName] || 0) + 1; });

  // Kelas
  const kelasMap: Record<string,number> = {};
  students.forEach(s => { const k = s.kelas && s.kelas !== '-' ? s.kelas : '-'; kelasMap[k] = (kelasMap[k] || 0) + 1; });
  const kelasEntries = Object.entries(kelasMap).sort((a,b) => a[0].localeCompare(b[0], undefined, {numeric:true}));

  // Gizi BMI
  const giziC = { kurang: 0, normal: 0, lebih: 0, noData: 0 };
  students.forEach(s => {
    if (s.beratBadan > 0 && s.tinggiBadan > 0) {
      const tbm = s.tinggiBadan / 100;
      if (tbm > 0) { const bmi = s.beratBadan / (tbm*tbm); if (bmi < 18.5) giziC.kurang++; else if (bmi > 25) giziC.lebih++; else giziC.normal++; }
    } else giziC.noData++;
  });

  // Posyandu
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
  const balita = beneficiaries3b.filter(b => b.subCategory === 'Balita').length;

  // Export
  const handleExport = async () => {
    setExporting(true);
    try {
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('Rekapitulasi PM');
      ws.columns = [
        {header:'Kategori',key:'kat',width:20},{header:'Sub Kategori',key:'sub',width:25},
        {header:'Jumlah',key:'jml',width:12},{header:'L',key:'l',width:8},{header:'P',key:'p',width:8},
      ];
      const rows: any[] = [];
      rows.push({kat:'PORSI KECIL',sub:'TK/RA',jml:siswaTKRA,l:'-',p:'-'});
      rows.push({kat:'PORSI KECIL',sub:'SD Kelas 1-3',jml:siswaSDKelas123,l:'-',p:'-'});
      rows.push({kat:'PORSI KECIL',sub:'Balita 0-6 Bln',jml:balita0_6,l:'-',p:'-'});
      rows.push({kat:'PORSI KECIL',sub:'Balita 6-59 Bln',jml:balita6_59,l:'-',p:'-'});
      rows.push({kat:'TOTAL PORSI KECIL',sub:'',jml:porsiKecil,l:siswaL,p:siswaP});
      rows.push({kat:'PORSI BESAR',sub:'Guru/Tendik',jml:teachers.length,l:guruL,p:guruP});
      rows.push({kat:'PORSI BESAR',sub:'SD Kelas 4-6',jml:siswaSDKelas456,l:'-',p:'-'});
      rows.push({kat:'PORSI BESAR',sub:'SMP',jml:siswaSMP,l:'-',p:'-'});
      rows.push({kat:'PORSI BESAR',sub:'SMA/SMK',jml:siswaSMA,l:'-',p:'-'});
      rows.push({kat:'PORSI BESAR',sub:'Bumil',jml:bumil,l:'-',p:'-'});
      rows.push({kat:'PORSI BESAR',sub:'Busui',jml:busui,l:'-',p:'-'});
      rows.push({kat:'TOTAL PORSI BESAR',sub:'',jml:porsiBesar,l:'-',p:'-'});
      rows.push({kat:'GRAND TOTAL',sub:'Porsi Kecil + Besar',jml:totalPorsi,l:'-',p:'-'});
      rows.push({kat:'',sub:'',jml:'',l:'',p:''});
      rows.push({kat:'TIDAK DIKATEGORIKAN',sub:'Balita >= 60 Bln',jml:balita60plus,l:'-',p:'-'});
      rows.push({kat:'TIDAK DIKATEGORIKAN',sub:'Tanpa Tanggal Lahir',jml:balitaNoDate,l:'-',p:'-'});
      rows.push({kat:'TOTAL DATA',sub:'Seluruh Penerima',jml:totalPenerimaAll,l:'-',p:'-'});
      ws.addRows(rows);
      const buf = await wb.xlsx.writeBuffer();
      const blob = new Blob([buf], {type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'Rekapitulasi_PM.xlsx'; a.click(); URL.revokeObjectURL(url);
    } catch { /* silent */ } finally { setExporting(false); }
  };

  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-5 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 rounded-xl"><FileBarChart className="w-6 h-6 text-emerald-400" /></div>
            <div>
              <h2 className="text-lg font-bold">Rekapitulasi PM</h2>
              <p className="text-xs text-slate-400">Rekapitulasi Penerima Manfaat</p>
            </div>
          </div>
          <button onClick={handleExport} disabled={exporting} className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95 disabled:opacity-50">
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Export Excel
          </button>
        </div>
      </div>

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
          <span className="font-bold text-white">Total Porsi: {totalPorsi} | Total Data: {totalPenerimaAll}</span>
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
        <button onClick={() => setTab('Sekolah')} className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all flex-1 justify-center ${tab === 'Sekolah' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
          <School className="w-3.5 h-3.5" /><span>Rekap Sekolah</span>
        </button>
        <button onClick={() => setTab('3B')} className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all flex-1 justify-center ${tab === '3B' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
          <Heart className="w-3.5 h-3.5" /><span>Rekap 3B</span>
        </button>
      </div>

      {tab === 'Sekolah' ? (<>
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

        {/* Gender bars */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 mb-3"><PieChart className="w-4 h-4 text-indigo-500" /><h4 className="text-xs font-bold text-slate-700">Distribusi Jenis Kelamin - Sekolah</h4></div>
          <div className="space-y-2">
            <div>
              <div className="flex justify-between mb-1"><span className="text-[10px] font-semibold text-emerald-600">Siswa</span><span className="text-[10px] text-slate-400">{siswaL} L | {siswaP} P</span></div>
              <div className="flex h-3 rounded-full overflow-hidden bg-slate-100">{siswaL+siswaP>0&&<><div className="bg-blue-400" style={{width:`${(siswaL/(siswaL+siswaP))*100}%`}}/><div className="bg-pink-300" style={{width:`${(siswaP/(siswaL+siswaP))*100}%`}}/></>}</div>
              <div className="flex justify-between mt-0.5"><span className="text-[9px] text-blue-500 font-semibold">L {siswaL+siswaP>0?((siswaL/(siswaL+siswaP))*100).toFixed(0):0}%</span><span className="text-[9px] text-pink-400 font-semibold">P {siswaL+siswaP>0?((siswaP/(siswaL+siswaP))*100).toFixed(0):0}%</span></div>
            </div>
            <div>
              <div className="flex justify-between mb-1"><span className="text-[10px] font-semibold text-violet-600">Guru/Tendik</span><span className="text-[10px] text-slate-400">{guruL} L | {guruP} P</span></div>
              <div className="flex h-3 rounded-full overflow-hidden bg-slate-100">{guruL+guruP>0&&<><div className="bg-blue-400" style={{width:`${(guruL/(guruL+guruP))*100}%`}}/><div className="bg-pink-300" style={{width:`${(guruP/(guruL+guruP))*100}%`}}/></>}</div>
              <div className="flex justify-between mt-0.5"><span className="text-[9px] text-blue-500 font-semibold">L {guruL+guruP>0?((guruL/(guruL+guruP))*100).toFixed(0):0}%</span><span className="text-[9px] text-pink-400 font-semibold">P {guruL+guruP>0?((guruP/(guruL+guruP))*100).toFixed(0):0}%</span></div>
            </div>
          </div>
        </div>

        {/* Per Sekolah */}
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

        {/* Per Kelas */}
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

        {/* BMI Gizi */}
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
          </div>
          <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-1.5 mb-1"><div className="w-2 h-2 rounded-full bg-violet-400" /><span className="text-[10px] font-bold text-violet-500 uppercase">Busui</span></div>
            <h3 className="text-2xl font-extrabold text-slate-800">{busui}</h3>
          </div>
          <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-1.5 mb-1"><div className="w-2 h-2 rounded-full bg-cyan-400" /><span className="text-[10px] font-bold text-cyan-500 uppercase">Balita</span></div>
            <h3 className="text-2xl font-extrabold text-slate-800">{balita}</h3>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200">
            <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Jenis Kelamin</div>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex-1 text-center p-2 bg-blue-50 rounded-xl"><div className="text-lg font-extrabold text-blue-600">{b3bL}</div><div className="text-[10px] text-blue-500 font-semibold">Laki-laki</div></div>
              <div className="flex-1 text-center p-2 bg-pink-50 rounded-xl"><div className="text-lg font-extrabold text-pink-500">{b3bP}</div><div className="text-[10px] text-pink-400 font-semibold">Perempuan</div></div>
            </div>
            <div className="flex h-2.5 rounded-full overflow-hidden bg-slate-100 mt-2">{b3bL+b3bP>0&&<><div className="bg-blue-400" style={{width:`${(b3bL/(b3bL+b3bP))*100}%`}}/><div className="bg-pink-300" style={{width:`${(b3bP/(b3bL+b3bP))*100}%`}}/></>}</div>
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
}
