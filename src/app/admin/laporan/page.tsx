'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { AdminLayout } from '@/components/layouts';
import { getClassSummaries, getGuruWaliSummaries } from '@/lib/db';
import { ClassSummary, GuruWaliSummary } from '@/lib/types';

export default function AdminLaporanPage() {
  const { user } = useAuth();
  const [semester, setSemester] = useState('2026-ganjil');
  const [bulan, setBulan] = useState('09'); // September
  const [activeTab, setActiveTab] = useState<'guru_wali' | 'kelas'>('guru_wali');
  const [guruWaliSummaries, setGuruWaliSummaries] = useState<GuruWaliSummary[]>([]);
  const [classSummariesList, setClassSummariesList] = useState<ClassSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    Promise.all([getGuruWaliSummaries(), getClassSummaries()])
      .then(([gwData, clsData]) => {
        if (!ignore) {
          setGuruWaliSummaries(gwData);
          setClassSummariesList(clsData);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (!ignore) setIsLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, []);

  if (!user) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadCsv = () => {
    if (activeTab === 'guru_wali') {
      const header = 'Guru Wali,Email,Siswa Binaan,Siswa Terjangkau,Belum Terjangkau,Total Sesi,Persentase,Status\n';
      const rows = guruWaliSummaries.map(g => {
        const pct = g.total_siswa > 0 ? Math.round((g.siswa_terjangkau / g.total_siswa) * 100) : 0;
        const belum = g.total_siswa - g.siswa_terjangkau;
        return `"${g.guru_wali_nama}","${g.email}",${g.total_siswa},${g.siswa_terjangkau},${belum},${g.total_sesi},${pct}%,${g.status}`;
      }).join('\n');

      const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `rekap-guru-wali-${semester}-bln-${bulan}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const header = 'Kelas,Total Siswa,Siswa Terjangkau,Total Sesi,Persentase,Status\n';
      const rows = classSummariesList.map(c => {
        const pct = c.total_siswa > 0 ? Math.round((c.siswa_terjangkau / c.total_siswa) * 100) : 0;
        return `"${c.kelas}",${c.total_siswa},${c.siswa_terjangkau},${c.total_sesi},${pct}%,${c.status}`;
      }).join('\n');

      const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `rekap-kelas-${semester}-bln-${bulan}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <AdminLayout user={user}>
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-[#0051d5] uppercase tracking-wider">
                Dokumentasi &amp; Audit
              </span>
              <h1 className="text-xl font-bold text-[#191c1e]">Laporan Rekapitulasi</h1>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#191c1e] text-white text-xs font-semibold hover:bg-[#131b2e] transition-colors shadow-sm"
              >
                <span className="material-symbols-outlined text-[16px]">print</span>
                <span>Cetak</span>
              </button>
              <button
                onClick={handleDownloadCsv}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#eceef0] text-[#191c1e] text-xs font-semibold hover:bg-[#e0e3e5] transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">download</span>
                <span>CSV</span>
              </button>
            </div>
          </div>
          <p className="text-xs text-[#45464d]">
            Laporan pertanggungjawaban program pembinaan perwalian siswa SMP Global Madani.
          </p>

          {/* Filter Periode */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            <div>
              <label className="text-[11px] font-bold text-[#45464d] block mb-1">Semester</label>
              <select
                value={semester}
                onChange={e => setSemester(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-[#f2f4f6] text-xs font-medium text-[#191c1e] border-none focus:ring-2 focus:ring-[#0051d5]/30"
              >
                <option value="2026-ganjil">Ganjil 2026/2027</option>
                <option value="2026-genap">Genap 2026/2027</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-bold text-[#45464d] block mb-1">Bulan</label>
              <select
                value={bulan}
                onChange={e => setBulan(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-[#f2f4f6] text-xs font-medium text-[#191c1e] border-none focus:ring-2 focus:ring-[#0051d5]/30"
              >
                <option value="07">Juli 2026</option>
                <option value="08">Agustus 2026</option>
                <option value="09">September 2026</option>
                <option value="10">Oktober 2026</option>
                <option value="11">November 2026</option>
                <option value="12">Desember 2026</option>
              </select>
            </div>
          </div>

          {/* Tab Selector */}
          <div className="flex bg-[#f2f4f6] p-1 rounded-xl mt-1">
            <button
              onClick={() => setActiveTab('guru_wali')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'guru_wali' ? 'bg-white text-[#191c1e] shadow-sm' : 'text-[#76777d]'
              }`}
            >
              Per Guru Wali ({guruWaliSummaries.length})
            </button>
            <button
              onClick={() => setActiveTab('kelas')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'kelas' ? 'bg-white text-[#191c1e] shadow-sm' : 'text-[#76777d]'
              }`}
            >
              Per Rombel / Kelas ({classSummariesList.length})
            </button>
          </div>
        </div>

        {/* Tabel Rekapitulasi */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-sm text-[#191c1e]">
              {activeTab === 'guru_wali' ? 'Rekapitulasi Ketercapaian Guru Wali' : 'Rekapitulasi Ketercapaian Rombel'}
            </h3>
            <span className="text-[11px] text-[#45464d]">TA 2026/2027</span>
          </div>

          {isLoading ? (
            <div className="p-8 text-center text-xs text-[#76777d]">Memuat data laporan...</div>
          ) : activeTab === 'guru_wali' ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#f7f9fb] text-[#45464d] font-semibold border-b border-slate-100">
                  <tr>
                    <th className="p-3">Guru Wali</th>
                    <th className="p-3 text-center">Binaan</th>
                    <th className="p-3 text-center">Terjangkau</th>
                    <th className="p-3 text-center">Belum</th>
                    <th className="p-3 text-center">Sesi</th>
                    <th className="p-3 text-center">Capaian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {guruWaliSummaries.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-[#76777d]">
                        Belum ada data guru wali terdaftar.
                      </td>
                    </tr>
                  ) : (
                    guruWaliSummaries.map(g => {
                      const pct = g.total_siswa > 0 ? Math.round((g.siswa_terjangkau / g.total_siswa) * 100) : 0;
                      return (
                        <tr key={g.guru_wali_id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3">
                            <p className="font-bold text-[#191c1e] whitespace-nowrap">{g.guru_wali_nama}</p>
                            <p className="text-[10px] text-[#76777d]">{g.email}</p>
                          </td>
                          <td className="p-3 text-center text-[#191c1e] font-semibold">{g.total_siswa}</td>
                          <td className="p-3 text-center text-[#0051d5] font-semibold">{g.siswa_terjangkau}</td>
                          <td className="p-3 text-center text-[#ba1a1a] font-semibold">{g.total_siswa - g.siswa_terjangkau}</td>
                          <td className="p-3 text-center text-[#191c1e] font-bold">{g.total_sesi}</td>
                          <td className="p-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                g.total_siswa === 0
                                  ? 'bg-[#eceef0] text-[#76777d]'
                                  : pct === 100
                                  ? 'bg-[#89f5e7]/40 text-[#0c9488]'
                                  : pct >= 80
                                  ? 'bg-[#dbe1ff] text-[#003ea8]'
                                  : 'bg-[#ffdad6] text-[#ba1a1a]'
                              }`}
                            >
                              {pct}%
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#f7f9fb] text-[#45464d] font-semibold border-b border-slate-100">
                  <tr>
                    <th className="p-3">Kelas</th>
                    <th className="p-3 text-center">Total Siswa</th>
                    <th className="p-3 text-center">Terjangkau</th>
                    <th className="p-3 text-center">Sesi</th>
                    <th className="p-3 text-center">Capaian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {classSummariesList.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-[#76777d]">
                        Belum ada data rombel atau siswa terdaftar.
                      </td>
                    </tr>
                  ) : (
                    classSummariesList.map(c => {
                      const pct = c.total_siswa > 0 ? Math.round((c.siswa_terjangkau / c.total_siswa) * 100) : 0;
                      return (
                        <tr key={c.kelas} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3 font-bold text-[#191c1e] whitespace-nowrap">Kelas {c.kelas}</td>
                          <td className="p-3 text-center text-[#191c1e] font-semibold">{c.total_siswa}</td>
                          <td className="p-3 text-center text-[#0051d5] font-semibold">{c.siswa_terjangkau}</td>
                          <td className="p-3 text-center text-[#191c1e] font-bold">{c.total_sesi}</td>
                          <td className="p-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                c.total_siswa === 0
                                  ? 'bg-[#eceef0] text-[#76777d]'
                                  : pct === 100
                                  ? 'bg-[#89f5e7]/40 text-[#0c9488]'
                                  : pct >= 80
                                  ? 'bg-[#dbe1ff] text-[#003ea8]'
                                  : 'bg-[#ffdad6] text-[#ba1a1a]'
                              }`}
                            >
                              {pct}%
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Ringkasan Keseluruhan Sekolah */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-3">
          <h3 className="font-bold text-sm text-[#191c1e]">Ikhtisar Kepatuhan &amp; Integritas Data</h3>
          {(() => {
            const totalSiswa = guruWaliSummaries.reduce((acc, g) => acc + g.total_siswa, 0);
            const totalTerjangkau = guruWaliSummaries.reduce((acc, g) => acc + g.siswa_terjangkau, 0);
            const totalSesi = guruWaliSummaries.reduce((acc, g) => acc + g.total_sesi, 0);
            const overallPct = totalSiswa > 0 ? ((totalTerjangkau / totalSiswa) * 100).toFixed(1) : '0';
            const avgSesi = guruWaliSummaries.length > 0 ? (totalSesi / guruWaliSummaries.length).toFixed(1) : '0';
            return (
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-3 rounded-xl bg-[#f7f9fb] space-y-1">
                  <span className="text-[10px] text-[#45464d] uppercase font-bold">Tingkat Ketuntasan</span>
                  <p className="text-base font-bold text-[#0c9488]">{overallPct}% Tercakup</p>
                  <p className="text-[10px] text-[#45464d]">Target institusi: minimal 80% per triwulan</p>
                </div>
                <div className="p-3 rounded-xl bg-[#f7f9fb] space-y-1">
                  <span className="text-[10px] text-[#45464d] uppercase font-bold">Rata-rata Sesi / Guru Wali</span>
                  <p className="text-base font-bold text-[#0051d5]">{avgSesi} Sesi</p>
                  <p className="text-[10px] text-[#45464d]">Sesi pendampingan perwalian terdokumentasi</p>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </AdminLayout>
  );
}
