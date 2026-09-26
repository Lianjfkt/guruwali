'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { GuruWaliLayout } from '@/components/layouts';
import { MENTORING_AREAS } from '@/lib/data';
import { MentoringAreaId } from '@/lib/types';

export default function PanduanPage() {
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<MentoringAreaId>('akademik');
  const [search, setSearch] = useState<string>('');

  const currentArea = useMemo(() => {
    return MENTORING_AREAS.find(a => a.id === activeTab) || MENTORING_AREAS[0];
  }, [activeTab]);

  // Search across all areas
  const searchResults = useMemo(() => {
    if (!search.trim()) return null;
    const q = search.toLowerCase();
    const results: { area: typeof MENTORING_AREAS[0]; matches: { type: 'kegiatan' | 'tindak_lanjut'; text: string }[] }[] = [];

    MENTORING_AREAS.forEach(area => {
      const matches: { type: 'kegiatan' | 'tindak_lanjut'; text: string }[] = [];
      area.daftar_kegiatan.forEach(k => {
        if (k.toLowerCase().includes(q)) matches.push({ type: 'kegiatan', text: k });
      });
      area.opsi_tindak_lanjut.forEach(tl => {
        if (tl.toLowerCase().includes(q)) matches.push({ type: 'tindak_lanjut', text: tl });
      });
      if (matches.length > 0) {
        results.push({ area, matches });
      }
    });

    return results;
  }, [search]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7f9fb]">
        <div className="w-8 h-8 border-3 border-[#0051d5] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const getTabColor = (id: MentoringAreaId) => {
    switch (id) {
      case 'akademik':
        return { activeBg: 'bg-[#0051d5] text-white', badgeBg: 'bg-[#dbe1ff] text-[#003ea8]', icon: 'menu_book' };
      case 'kompetensi':
        return { activeBg: 'bg-[#3f465c] text-white', badgeBg: 'bg-[#e0e3e5] text-[#3f465c]', icon: 'psychology' };
      case 'karakter':
        return { activeBg: 'bg-[#0c9488] text-white', badgeBg: 'bg-[#89f5e7]/40 text-[#0c9488]', icon: 'spa' };
      case 'kolaborasi':
        return { activeBg: 'bg-[#565e74] text-white', badgeBg: 'bg-[#eceef0] text-[#565e74]', icon: 'diversity_3' };
    }
  };

  return (
    <GuruWaliLayout user={user}>
      <div className="p-4 space-y-4">
        {/* Header Modul */}
        <section className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col gap-2">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#dbe1ff] text-[#003ea8]">
                  <span className="material-symbols-outlined text-[13px]">verified</span>
                </span>
                <span className="text-[11px] text-[#0051d5] font-bold uppercase tracking-wider">
                  Standar Mutu Pembinaan
                </span>
              </div>
              <h1 className="text-xl font-bold text-[#191c1e] tracking-tight">
                Panduan Referensi Pendampingan
              </h1>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#eceef0] flex items-center justify-center text-[#45464d] flex-shrink-0">
              <span className="material-symbols-outlined text-[20px]">auto_stories</span>
            </div>
          </div>
          <p className="text-xs text-[#45464d] leading-relaxed">
            Pedoman operasional bimbingan perwalian SMP Global Madani berbasis 4 pilar pembinaan siswa.
          </p>

          {/* Search Input */}
          <div className="relative mt-2">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[18px] text-[#76777d]">
              search
            </span>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari kegiatan atau opsi tindak lanjut..."
              className="w-full h-11 pl-10 pr-10 rounded-xl bg-[#f2f4f6] text-xs font-medium text-[#191c1e] placeholder-[#76777d] focus:outline-none focus:ring-2 focus:ring-[#0051d5]/30 focus:bg-white transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#76777d] hover:text-[#191c1e]"
              >
                <span className="material-symbols-outlined text-[18px]">cancel</span>
              </button>
            )}
          </div>
        </section>

        {/* Search Results Display */}
        {searchResults !== null ? (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#191c1e]">
                Hasil Pencarian: &ldquo;{search}&rdquo;
              </span>
              <button
                onClick={() => setSearch('')}
                className="text-xs text-[#0051d5] font-semibold hover:underline"
              >
                Tutup Pencarian
              </button>
            </div>

            {searchResults.length === 0 ? (
              <div className="bg-white rounded-2xl p-6 text-center border border-slate-100 shadow-sm">
                <span className="material-symbols-outlined text-3xl text-[#76777d]">search_off</span>
                <p className="text-xs font-bold text-[#191c1e] mt-1">Tidak ada hasil ditemukan</p>
                <p className="text-[11px] text-[#45464d]">Gunakan kata kunci umum seperti &quot;ujian&quot;, &quot;ekskul&quot;, &quot;adab&quot;, atau &quot;BK&quot;.</p>
              </div>
            ) : (
              searchResults.map(({ area, matches }) => {
                const color = getTabColor(area.id);
                return (
                  <div key={area.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${color.badgeBg}`}>
                      {area.nama_area}
                    </span>
                    <ul className="space-y-1.5 pt-1">
                      {matches.map((m, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs text-[#191c1e]">
                          <span className="material-symbols-outlined text-[15px] text-[#0051d5] mt-0.5">
                            {m.type === 'kegiatan' ? 'check_circle' : 'task_alt'}
                          </span>
                          <div>
                            <span className="text-[10px] text-[#76777d] block uppercase font-bold">
                              {m.type === 'kegiatan' ? 'Kegiatan Pendampingan' : 'Opsi Tindak Lanjut'}
                            </span>
                            <span>{m.text}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })
            )}
          </section>
        ) : (
          <>
            {/* Visual Photo Card */}
            <section className="relative w-full h-36 rounded-2xl overflow-hidden shadow-sm bg-[#131b2e]">
              <div className="absolute inset-0 bg-gradient-to-r from-[#0051d5]/80 to-[#0c9488]/80 mix-blend-multiply" />
              <div className="absolute inset-0 p-4 flex flex-col justify-end text-white">
                <span className="text-[11px] text-[#89f5e7] font-bold tracking-wide uppercase">
                  Pilar Keteladanan Pendidik
                </span>
                <h3 className="text-base font-bold leading-tight">
                  Membina Potensi, Mengukir Budi Pekerti Mulia
                </h3>
                <p className="text-[11px] text-white/80 mt-0.5">
                  SMP Global Madani • Insan Islami, Cerdas, dan Mandiri
                </p>
              </div>
            </section>

            {/* Segmented Tab Pill Navigation */}
            <section className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#45464d]">Pilih Pilar Area</span>
                <span className="text-xs font-semibold text-[#0051d5]">4 Pilar Tersedia</span>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                {MENTORING_AREAS.map((area, idx) => {
                  const isActive = activeTab === area.id;
                  const color = getTabColor(area.id);
                  return (
                    <button
                      key={area.id}
                      onClick={() => setActiveTab(area.id)}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                        isActive
                          ? `${color.activeBg} shadow-sm`
                          : 'bg-[#eceef0] text-[#45464d] hover:bg-[#e0e3e5]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">{color.icon}</span>
                      <span>{idx + 1}. {area.nama_area.split(' ')[0]}</span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Deep Reference Card */}
            <section className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${getTabColor(currentArea.id).badgeBg}`}>
                    Pilar {currentArea.nama_area}
                  </span>
                  <h2 className="text-lg font-bold text-[#191c1e] mt-1.5">
                    Standar Bimbingan {currentArea.nama_area}
                  </h2>
                </div>
                <div className="w-9 h-9 rounded-full bg-[#dbe1ff] flex items-center justify-center text-[#0051d5] flex-shrink-0">
                  <span className="material-symbols-outlined text-[20px]">verified</span>
                </div>
              </div>

              {/* Tujuan Pokok */}
              <div className="rounded-xl bg-[#f7f9fb] p-3.5 space-y-1 border border-slate-100">
                <div className="flex items-center gap-1.5 text-[#0051d5]">
                  <span className="material-symbols-outlined text-[16px]">flag</span>
                  <span className="text-xs font-bold tracking-wide">Tujuan Pokok Pembinaan</span>
                </div>
                <p className="text-xs text-[#191c1e] leading-relaxed">
                  {currentArea.tujuan}
                </p>
              </div>

              {/* Kegiatan Pendampingan Terstandar */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center gap-1.5 text-[#191c1e]">
                  <span className="material-symbols-outlined text-[18px] text-[#0051d5]">checklist</span>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#45464d]">
                    Kegiatan Pendampingan Terstandar:
                  </h3>
                </div>
                <div className="space-y-2">
                  {currentArea.daftar_kegiatan.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2.5 p-3 rounded-xl bg-[#f7f9fb] border border-slate-100"
                    >
                      <div className="w-5 h-5 rounded-full bg-[#dbe1ff] text-[#003ea8] flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">
                        {idx + 1}
                      </div>
                      <p className="text-xs text-[#191c1e] font-medium leading-relaxed">
                        {item}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Opsi Tindak Lanjut yang Direkomendasikan */}
              <div className="space-y-2 pt-1 border-t border-slate-100">
                <div className="flex items-center gap-1.5 text-[#191c1e]">
                  <span className="material-symbols-outlined text-[18px] text-[#0c9488]">arrow_forward</span>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#45464d]">
                    Opsi Rencana Tindak Lanjut:
                  </h3>
                </div>
                <div className="space-y-1.5">
                  {currentArea.opsi_tindak_lanjut.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#f7f9fb] border border-slate-100"
                    >
                      <span className="material-symbols-outlined text-[#0c9488] text-[18px]">
                        task_alt
                      </span>
                      <span className="text-xs text-[#191c1e] font-medium">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Action Button */}
              <div className="pt-2">
                <Link
                  href={`/dashboard/catat`}
                  className="w-full py-3 px-4 rounded-xl bg-[#191c1e] hover:bg-[#131b2e] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  <span className="material-symbols-outlined text-[18px]">edit_calendar</span>
                  <span>Gunakan Panduan Ini untuk Catat Sesi</span>
                </Link>
              </div>
            </section>
          </>
        )}
      </div>
    </GuruWaliLayout>
  );
}
