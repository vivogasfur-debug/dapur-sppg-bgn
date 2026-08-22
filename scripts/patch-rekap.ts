import * as fs from 'fs';

const filePath = '/home/z/my-project/src/components/MainApp.tsx';
let code = fs.readFileSync(filePath, 'utf-8');

// 1. Wrap sub-tabs + action buttons with pmMainTab !== 'Rekapitulasi'
// Find the closing of the toolbar div and the start of DESKTOP TABLE
const actionBtnsEnd = `              </div>
            </div>

            {/* DESKTOP: TABLE VIEW`;
const actionBtnsWrapped = `              </div>
            </div>

            {/* REKAPITULASI CONTENT */}
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
              const alergiTotal = [...students.filter(s=>s.hasAllergy), ...teachers.filter(t=>t.hasAllergy), ...beneficiaries3b.filter(b=>b.hasAllergy)].length;
              const schoolMap: Record<string,number> = {};
              students.forEach(s => { schoolMap[s.schoolName] = (schoolMap[s.schoolName] || 0) + 1; });
              const topSchools = Object.entries(schoolMap).sort((a,b) => b[1]-a[1]);
              const kelasMap: Record<string,number> = {};
              students.forEach(s => { const k = s.kelas && s.kelas !== '-' ? s.kelas : '-'; kelasMap[k] = (kelasMap[k] || 0) + 1; });
              const kelasEntries = Object.entries(kelasMap).sort((a,b) => a[0].localeCompare(b[0], undefined, {numeric:true}));
              const posyanduMap: Record<string, {total:number;bumil:number;busui:number;balita:number}> = {};
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
              const fmt = (n: number) => new Intl.NumberFormat('id-ID').format(n);
              return (
              <div className="space-y-3">
                {/* Summary Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-3 rounded-2xl shadow-lg text-white">
                    <div className="text-[10px] font-bold uppercase opacity-80">Total Penerima</div>
                    <h3 className="text-2xl font-extrabold mt-1">{totalPenerima}</h3>
                    <p className="text-[10px] opacity-75">Siswa + Guru + 3B</p>
                  </div>
                  <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Sekolah</div>
                    <h3 className="text-2xl font-extrabold text-slate-800 mt-1">{students.length + teachers.length}</h3>
                    <p className="text-[10px] text-slate-400">Siswa: {students.length} | Guru: {teachers.length}</p>
                  </div>
                  <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Penerima 3B</div>
                    <h3 className="text-2xl font-extrabold text-slate-800 mt-1">{beneficiaries3b.length}</h3>
                    <p className="text-[10px] text-slate-400">B:{bumil} BU:{busui} Ba:{balita}</p>
                  </div>
                  <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Alergi</div>
                    <h3 className="text-2xl font-extrabold text-rose-600 mt-1">{alergiTotal}</h3>
                    <p className="text-[10px] text-slate-400">{totalPenerima > 0 ? ((alergiTotal/totalPenerima)*100).toFixed(1) : 0}% dari total</p>
                  </div>
                </div>

                {/* Gender Ratio */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                  <div className="flex items-center gap-2 mb-3"><PieChart className="w-4 h-4 text-indigo-500" /><h4 className="text-xs font-bold text-slate-700">Distribusi Jenis Kelamin</h4></div>
                  <div className="space-y-2">
                    <div>
                      <div className="flex justify-between mb-1"><span className="text-[10px] font-semibold text-slate-500">Seluruh Penerima</span><span className="text-[10px] text-slate-400">{totalL} L | {totalP} P</span></div>
                      <div className="flex h-4 rounded-full overflow-hidden bg-slate-100">
                        {totalL+totalP > 0 && <><div className="bg-blue-500" style={{width:`${(totalL/(totalL+totalP))*100}%`}} /><div className="bg-pink-400" style={{width:`${(totalP/(totalL+totalP))*100}%`}} /></>}
                      </div>
                      <div className="flex justify-between mt-0.5"><span className="text-[9px] text-blue-500 font-semibold">Laki-laki {totalL+totalP>0?((totalL/(totalL+totalP))*100).toFixed(0):0}%</span><span className="text-[9px] text-pink-400 font-semibold">Perempuan {totalL+totalP>0?((totalP/(totalL+totalP))*100).toFixed(0):0}%</span></div>
                    </div>
                    <div><div className="flex justify-between mb-0.5"><span className="text-[10px] text-emerald-600 font-semibold">Siswa</span><span className="text-[10px] text-slate-400">{siswaL} L | {siswaP} P</span></div><div className="flex h-2.5 rounded-full overflow-hidden bg-slate-100">{siswaL+siswaP>0&&<><div className="bg-blue-400" style={{width:`${(siswaL/(siswaL+siswaP))*100}%`}}/><div className="bg-pink-300" style={{width:`${(siswaP/(siswaL+siswaP))*100}%`}}/></>}</div></div>
                    <div><div className="flex justify-between mb-0.5"><span className="text-[10px] text-blue-600 font-semibold">Guru/Tendik</span><span className="text-[10px] text-slate-400">{guruL} L | {guruP} P</span></div><div className="flex h-2.5 rounded-full overflow-hidden bg-slate-100">{guruL+guruP>0&&<><div className="bg-blue-400" style={{width:`${(guruL/(guruL+guruP))*100}%`}}/><div className="bg-pink-300" style={{width:`${(guruP/(guruL+guruP))*100}%`}}/></>}</div></div>
                    <div><div className="flex justify-between mb-0.5"><span className="text-[10px] text-amber-600 font-semibold">Penerima 3B</span><span className="text-[10px] text-slate-400">{b3bL} L | {b3bP} P</span></div><div className="flex h-2.5 rounded-full overflow-hidden bg-slate-100">{b3bL+b3bP>0&&<><div className="bg-blue-400" style={{width:`${(b3bL/(b3bL+b3bP))*100}%`}}/><div className="bg-pink-300" style={{width:`${(b3bP/(b3bL+b3bP))*100}%`}}/></>}</div></div>
                  </div>
                </div>

                {/* Rekap Per Sekolah */}
                {topSchools.length > 0 && (
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                  <div className="flex items-center gap-2 mb-3"><School className="w-4 h-4 text-emerald-500" /><h4 className="text-xs font-bold text-slate-700">Rekapitulasi Per Sekolah</h4></div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs border-collapse">
                      <thead><tr className="bg-emerald-50 text-emerald-700"><th className="px-3 py-2 text-left font-semibold border-b border-emerald-200/60">Sekolah</th><th className="px-3 py-2 text-center font-semibold border-b border-emerald-200/60">Siswa</th><th className="px-3 py-2 text-center font-semibold border-b border-emerald-200/60">L</th><th className="px-3 py-2 text-center font-semibold border-b border-emerald-200/60">P</th></tr></thead>
                      <tbody>
                        {topSchools.map(([name, count]) => {
                          const sL = students.filter(s => s.schoolName === name && s.jk === 'L').length;
                          const sP = students.filter(s => s.schoolName === name && s.jk === 'P').length;
                          return (<tr key={name} className="border-b border-slate-100 hover:bg-slate-50/50"><td className="px-3 py-2 font-medium text-slate-700">{name}</td><td className="px-3 py-2 text-center font-bold">{count}</td><td className="px-3 py-2 text-center text-blue-500">{sL}</td><td className="px-3 py-2 text-center text-pink-400">{sP}</td></tr>);
                        })}
                        <tr className="bg-emerald-50/50 font-bold"><td className="px-3 py-2 text-emerald-800">TOTAL</td><td className="px-3 py-2 text-center">{students.length}</td><td className="px-3 py-2 text-center text-blue-600">{siswaL}</td><td className="px-3 py-2 text-center text-pink-500">{siswaP}</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                )}

                {/* Rekap Per Kelas */}
                {kelasEntries.length > 0 && (
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                  <div className="flex items-center gap-2 mb-3"><BarChart3 className="w-4 h-4 text-blue-500" /><h4 className="text-xs font-bold text-slate-700">Rekapitulasi Per Kelas</h4></div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs border-collapse">
                      <thead><tr className="bg-blue-50 text-blue-700"><th className="px-3 py-2 text-center font-semibold border-b border-blue-200/60">Kelas</th><th className="px-3 py-2 text-center font-semibold border-b border-blue-200/60">Jumlah</th><th className="px-3 py-2 text-center font-semibold border-b border-blue-200/60">L</th><th className="px-3 py-2 text-center font-semibold border-b border-blue-200/60">P</th></tr></thead>
                      <tbody>
                        {kelasEntries.map(([k, c]) => {
                          const kL = students.filter(s => { const kk = s.kelas && s.kelas !== '-' ? s.kelas : '-'; return kk === k && s.jk === 'L'; }).length;
                          const kP = students.filter(s => { const kk = s.kelas && s.kelas !== '-' ? s.kelas : '-'; return kk === k && s.jk === 'P'; }).length;
                          return (<tr key={k} className="border-b border-slate-100 hover:bg-slate-50/50"><td className="px-3 py-2 text-center font-bold">{k === '-' ? 'Lainnya' : k}</td><td className="px-3 py-2 text-center font-bold">{c}</td><td className="px-3 py-2 text-center text-blue-500">{kL}</td><td className="px-3 py-2 text-center text-pink-400">{kP}</td></tr>);
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
                )}

                {/* Rekap 3B Per Posyandu */}
                {topPosyandu.length > 0 && (
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                  <div className="flex items-center gap-2 mb-3"><Heart className="w-4 h-4 text-rose-500" /><h4 className="text-xs font-bold text-slate-700">Rekapitulasi Penerima 3B Per Posyandu</h4></div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs border-collapse">
                      <thead><tr className="bg-amber-50 text-amber-700"><th className="px-3 py-2 text-left font-semibold border-b border-amber-200/60">Posyandu</th><th className="px-3 py-2 text-center font-semibold border-b border-amber-200/60">Bumil</th><th className="px-3 py-2 text-center font-semibold border-b border-amber-200/60">Busui</th><th className="px-3 py-2 text-center font-semibold border-b border-amber-200/60">Balita</th><th className="px-3 py-2 text-center font-semibold border-b border-amber-200/60">Total</th></tr></thead>
                      <tbody>
                        {topPosyandu.map(([name, d]) => (<tr key={name} className="border-b border-slate-100 hover:bg-slate-50/50"><td className="px-3 py-2 font-medium text-slate-700">{name}</td><td className="px-3 py-2 text-center"><span className="inline-block px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 font-bold text-[10px]">{d.bumil}</span></td><td className="px-3 py-2 text-center"><span className="inline-block px-2 py-0.5 rounded-full bg-violet-50 text-violet-600 font-bold text-[10px]">{d.busui}</span></td><td className="px-3 py-2 text-center"><span className="inline-block px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-600 font-bold text-[10px]">{d.balita}</span></td><td className="px-3 py-2 text-center font-extrabold text-slate-800">{d.total}</td></tr>))}
                        <tr className="bg-amber-50/50 font-bold"><td className="px-3 py-2 text-amber-800">TOTAL</td><td className="px-3 py-2 text-center text-rose-600">{bumil}</td><td className="px-3 py-2 text-center text-violet-600">{busui}</td><td className="px-3 py-2 text-center text-cyan-600">{balita}</td><td className="px-3 py-2 text-center text-amber-800">{beneficiaries3b.length}</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                )}

                {/* Status Gizi */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                  <div className="flex items-center gap-2 mb-3"><Activity className="w-4 h-4 text-teal-500" /><h4 className="text-xs font-bold text-slate-700">Rekapitulasi Status Gizi Siswa (BMI)</h4></div>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                    <div className="bg-orange-50 border border-orange-200/60 rounded-xl p-3 text-center"><div className="text-xl font-extrabold text-orange-600">{giziC.kurang}</div><div className="text-[10px] font-semibold text-orange-500">Kurus {'<'} 18.5</div><div className="mt-1.5 h-1.5 bg-orange-200 rounded-full overflow-hidden"><div className="h-full bg-orange-500 rounded-full" style={{width:`${students.length>0?(giziC.kurang/students.length)*100:0}%`}}/></div></div>
                    <div className="bg-emerald-50 border border-emerald-200/60 rounded-xl p-3 text-center"><div className="text-xl font-extrabold text-emerald-600">{giziC.normal}</div><div className="text-[10px] font-semibold text-emerald-500">Normal 18.5-25</div><div className="mt-1.5 h-1.5 bg-emerald-200 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 rounded-full" style={{width:`${students.length>0?(giziC.normal/students.length)*100:0}%`}}/></div></div>
                    <div className="bg-rose-50 border border-rose-200/60 rounded-xl p-3 text-center"><div className="text-xl font-extrabold text-rose-600">{giziC.lebih}</div><div className="text-[10px] font-semibold text-rose-500">Gemuk {'>'} 25</div><div className="mt-1.5 h-1.5 bg-rose-200 rounded-full overflow-hidden"><div className="h-full bg-rose-500 rounded-full" style={{width:`${students.length>0?(giziC.lebih/students.length)*100:0}%`}}/></div></div>
                    <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-3 text-center"><div className="text-xl font-extrabold text-slate-400">{giziC.noData}</div><div className="text-[10px] font-semibold text-slate-400">Belum Ada Data BB/TB</div><div className="mt-1.5 h-1.5 bg-slate-200 rounded-full overflow-hidden"><div className="h-full bg-slate-400 rounded-full" style={{width:`${students.length>0?(giziC.noData/students.length)*100:0}%`}}/></div></div>
                  </div>
                </div>
              </div>
              );
            })() : null}

            {/* DESKTOP: TABLE VIEW`;

code = code.replace(actionBtnsEnd, actionBtnsWrapped);

// 2. Wrap desktop table with pmMainTab !== 'Rekapitulasi'
code = code.replace(
  `<div className="hidden md:block bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">`,
  `{pmMainTab !== 'Rekapitulasi' && <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">`
);

// 3. Wrap mobile cards with pmMainTab !== 'Rekapitulasi'
code = code.replace(
  `<div className="md:hidden space-y-3">`,
  `{pmMainTab !== 'Rekapitulasi' && <div className="md:hidden space-y-3">`
);

fs.writeFileSync(filePath, code, 'utf-8');
console.log('OK - Rekapitulasi tab content added');
