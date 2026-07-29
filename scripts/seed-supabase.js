const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const sb = createClient(
  'https://zwbspstsbpzsnphdohko.supabase.co',
  'sb_publishable_IBx9PYkqJPg77OZmISs_Rg_NWDtJDLw'
);

async function seed() {
  console.log('Seeding data ke Supabase...');

  // 1. Seed Users
  const hashedPw = await bcrypt.hash('password123', 10);
  const { data: existingUsers } = await sb.from('users').select('id');
  if (!existingUsers || existingUsers.length === 0) {
    const { error } = await sb.from('users').insert([
      { name: 'Admin BGN', email: 'admin@dashboard.id', password: hashedPw, role: 'admin' },
      { name: 'Budi Santoso', email: 'budi@dashboard.id', password: hashedPw, role: 'manajer' },
      { name: 'Siti Rahmawati', email: 'siti@dashboard.id', password: hashedPw, role: 'staff' },
      { name: 'Ahmad Fauzi', email: 'ahmad@dashboard.id', password: hashedPw, role: 'relawan' },
    ]);
    console.log('Users:', error ? 'ERR: ' + error.message : '4 users seeded');
  } else {
    console.log('Users: already exist (' + existingUsers.length + ')');
  }

  // 2. Seed Students
  const { data: existingStudents } = await sb.from('students').select('id');
  if (!existingStudents || existingStudents.length === 0) {
    const { error } = await sb.from('students').insert([
      {
        nama: 'Ahmad Rizky Pratama', school_name: 'SDN 01 Sambas', nipd: '21221001',
        jk: 'L', nisn: '0012345678', tempat_lahir: 'Sambas', tanggal_lahir: '2015-05-12',
        nik: '6101021205150001', agama: 'Islam', alamat: 'Jl. Merdeka No. 12, Sambas',
        kelas: '4B', berat_badan: 28, tinggi_badan: 132,
        nama_ayah: 'Hendra', nama_ibu: 'Siti Sarah',
        has_allergy: true, allergy_type: 'Udang & Telur'
      },
      {
        nama: 'Siti Aisyah Nurhaliza', school_name: 'SDN 02 Pemangkat', nipd: '21221002',
        jk: 'P', nisn: '0012345679', tempat_lahir: 'Sambas', tanggal_lahir: '2016-02-10',
        nik: '6101025002160002', agama: 'Islam', alamat: 'Desa Pemangkat Kota',
        kelas: '3A', berat_badan: 24, tinggi_badan: 125,
        nama_ayah: 'Rahmat', nama_ibu: 'Mariana',
        has_allergy: false, allergy_type: null
      },
      {
        nama: 'Muhammad Fadillah', school_name: 'SDN 03 Sambas', nipd: '21221003',
        jk: 'L', nisn: '0012345680', tempat_lahir: 'Sambas', tanggal_lahir: '2015-11-20',
        nik: '6101022011150003', agama: 'Islam', alamat: 'Jl. Pemuda No. 5',
        kelas: '4A', berat_badan: 26, tinggi_badan: 128,
        nama_ayah: 'Yusuf', nama_ibu: 'Nurhalimah',
        has_allergy: true, allergy_type: 'Kacang'
      },
      {
        nama: 'Dewi Lestari', school_name: 'SDN 01 Pemangkat', nipd: '21221004',
        jk: 'P', nisn: '0012345681', tempat_lahir: 'Pemangkat', tanggal_lahir: '2016-07-05',
        nik: '6101030507160004', agama: 'Islam', alamat: 'Jl. Kenanga No. 8',
        kelas: '3B', berat_badan: 22, tinggi_badan: 120,
        nama_ayah: 'Darmawan', nama_ibu: 'Ratna Sari',
        has_allergy: false, allergy_type: null
      },
    ]);
    console.log('Students:', error ? 'ERR: ' + error.message : '4 students seeded');
  } else {
    console.log('Students: already exist (' + existingStudents.length + ')');
  }

  // 3. Seed Teachers
  const { data: existingTeachers } = await sb.from('teachers').select('id');
  if (!existingTeachers || existingTeachers.length === 0) {
    const { error } = await sb.from('teachers').insert([
      {
        full_name: 'Bpk. Supardi, S.Pd', school_name: 'SDN 01 Sambas',
        nuptk: '1234567890123456', nip: '198801012015011001',
        jk: 'L', tempat_lahir: 'Sambas', tanggal_lahir: '1988-01-01',
        nik: '610102198801010001', jenis_tendik: 'Guru',
        alamat: 'Jl. Pemuda No. 05, Sambas',
        has_allergy: false, allergy_type: null, status: 'Aktif'
      },
      {
        full_name: 'Ibu Hartini, S.Pd', school_name: 'SDN 02 Pemangkat',
        nuptk: '2345678901234567', nip: '199001012020012002',
        jk: 'P', tempat_lahir: 'Pemangkat', tanggal_lahir: '1990-01-01',
        nik: '610103199001010002', jenis_tendik: 'Kepala Sekolah',
        alamat: 'Jl. Merdeka No. 10, Pemangkat',
        has_allergy: true, allergy_type: 'Seafood', status: 'Aktif'
      },
    ]);
    console.log('Teachers:', error ? 'ERR: ' + error.message : '2 teachers seeded');
  } else {
    console.log('Teachers: already exist (' + existingTeachers.length + ')');
  }

  // 4. Seed Beneficiaries 3B
  const { data: existing3B } = await sb.from('beneficiaries_3b').select('id');
  if (!existing3B || existing3B.length === 0) {
    const { error } = await sb.from('beneficiaries_3b').insert([
      {
        sppg_code: 'SPPG-SMB-01', posyandu_name: 'Posyandu Melati 01',
        sub_category: 'Bumil', nik: '6101025508920003', full_name: 'Ibu Rahmawati',
        gender: 'P', birth_date: '1992-08-15', detail_info: 'Usia Hamil: 24 Minggu',
        pic_name: 'Ibu Dewi (Kader)', phone: '085211223344',
        has_allergy: true, allergy_type: 'Ikan Laut', status: 'Aktif'
      },
      {
        sppg_code: 'SPPG-SMB-02', posyandu_name: 'Posyandu Mawar 03',
        sub_category: 'Busui', nik: '6101024510950004', full_name: 'Ibu Nurjanah',
        gender: 'P', birth_date: '1995-10-15', detail_info: 'Menyusui: Bayi 8 Bulan',
        pic_name: 'Ibu Sari (Kader)', phone: '081234567890',
        has_allergy: false, allergy_type: null, status: 'Aktif'
      },
      {
        sppg_code: 'SPPG-SMB-03', posyandu_name: 'Posyandu Dahlia 02',
        sub_category: 'Balita', nik: '6101022503230001', full_name: 'Rizal Ananda',
        gender: 'L', birth_date: '2023-03-25', detail_info: 'BB: 10.5 kg, TB: 75 cm',
        pic_name: 'Ibu Ani (Kader)', phone: '085678901234',
        has_allergy: false, allergy_type: null, status: 'Aktif'
      },
    ]);
    console.log('Beneficiaries 3B:', error ? 'ERR: ' + error.message : '3 seeded');
  } else {
    console.log('Beneficiaries 3B: already exist (' + existing3B.length + ')');
  }

  console.log('\nSeed complete!');
}

seed().catch(console.error);
