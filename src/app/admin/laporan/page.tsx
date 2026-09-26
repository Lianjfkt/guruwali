'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { AdminLayout } from '@/components/layouts';
import { getClassSummaries } from '@/lib/data';
import { ClassSummary } from '@/lib/types';

export default function AdminLaporanPage() {
  const { user } = useAuth();
  const [semester, setSemester] = useState('2026-ganjil');
  const [bulan, setBulan] = useState('09'); // September
  const [summaries, setSummaries] = useState<ClassSummary[]>([]);

  useEffect(() => {
    setSummaries(getClassSummaries());
  }, []);

  if (!user) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadCsv = () => {
    const header = 'Kelas,Guru Wali,Total Siswa,Siswa Terjangkau,Total Sesi,Persentase,Status\n';
    const rows = summaries.map(c => {
      const pct = c.total_siswa > 0 ? Math.round((c.siswa_terjangkau / c.total_siswa) * 100) : 0;
      return `"${c.kelas}","${c.guru_wali_nama}",${c.total_siswa},${c.siswa_terjangkau},${c.total_sesi},${pct}%,${c.status}`;
    }).join('\n');

    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `rekap-pendampingan-guru-wali-${semester}-bln-${bulan}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
        </div>

        {/* Tabel Ringkasan Rombel */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-sm text-[#191c1e]">Rekapitulasi Ketercapaian Rombel</h3>
            <span className="text-[11px] text-[#45464d]">TA 2026/2027</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f7f9fb] text-[#45464d] font-semibold border-b border-slate-100">
                <tr>
                  <th className="p-3">Kelas</th>
                  <th className="p-3">Guru Wali</th>
                  <th className="p-3 text-center">Siswa</th>
                  <th className="p-3 text-center">Terjangkau</th>
                  <th className="p-3 text-center">Sesi</th>
                  <th className="p-3 text-center">Capaian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {summaries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-[#76777d]">
                      Belum ada data rombel atau siswa terdaftar.
                    </td>
                  </tr>
                ) : (
                  summaries.map(c => {
                    const pct = c.total_siswa > 0 ? Math.round((c.siswa_terjangkau / c.total_siswa) * 100) : 0;
                    return (
                      <tr key={c.kelas} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 font-bold text-[#191c1e] whitespace-nowrap">{c.kelas}</td>
                        <td className="p-3 text-[#45464d] whitespace-nowrap">{c.guru_wali_nama}</td>
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
        </div>

        {/* Ringkasan Keseluruhan Sekolah */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-3">
          <h3 className="font-bold text-sm text-[#191c1e]">Ikhtisar Kepatuhan &amp; Integritas Data</h3>
          {(() => {
            const totalSiswa = summaries.reduce((acc, c) => acc + c.total_siswa, 0);
            const totalTerjangkau = summaries.reduce((acc, c) => acc + c.siswa_terjangkau, 0);
            const totalSesi = summaries.reduce((acc, c) => acc + c.total_sesi, 0);
            const overallPct = totalSiswa > 0 ? ((totalTerjangkau / totalSiswa) * 100).toFixed(1) : '0';
            const avgSesi = summaries.length > 0 ? (totalSesi / summaries.length).toFixed(1) : '0';
            return (
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-3 rounded-xl bg-[#f7f9fb] space-y-1">
                  <span className="text-[10px] text-[#45464d] uppercase font-bold">Tingkat Ketuntasan</span>
                  <p className="text-base font-bold text-[#0c9488]">{overallPct}% Tercakup</p>
                  <p className="text-[10px] text-[#45464d]">Target institusi: minimal 80% per triwulan</p>
                </div>
                <div className="p-3 rounded-xl bg-[#f7f9fb] space-y-1">
                  <span className="text-[10px] text-[#45464d] uppercase font-bold">Rata-rata Sesi / Rombel</span>
                  <p className="text-base font-bold text-[#0051d5]">{avgSesi} Sesi</p>
                  <p className="text-[10px] text-[#45464d]">Sesi terdokumentasi lengkap dengan tindak lanjut</p>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </AdminLayout>
  );
}
