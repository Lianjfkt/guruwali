'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { AdminLayout } from '@/components/layouts';
import { MENTORING_AREAS } from '@/lib/data';
import { MentoringAreaId } from '@/lib/types';

export default function AdminPanduanPage() {
  const { user } = useAuth();
  const [activeArea, setActiveArea] = useState<MentoringAreaId>('akademik');

  if (!user) return null;

  const currentArea = MENTORING_AREAS.find(a => a.id === activeArea) || MENTORING_AREAS[0];

  return (
    <AdminLayout user={user}>
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-[#0051d5] uppercase tracking-wider">
                Kurikulum &amp; Standar
              </span>
              <h1 className="text-xl font-bold text-[#191c1e]">Standar Panduan Bimbingan</h1>
            </div>
            <span className="px-3 py-1 rounded-full bg-[#dbe1ff] text-[#003ea8] text-xs font-bold">
              4 Pilar Resmi
            </span>
          </div>
          <p className="text-xs text-[#45464d]">
            Standar operasional panduan pendampingan guru wali yang dirujuk oleh seluruh dewan guru.
          </p>

          {/* Area Selector Tabs */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar pt-2">
            {MENTORING_AREAS.map(a => (
              <button
                key={a.id}
                onClick={() => setActiveArea(a.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  activeArea === a.id
                    ? 'bg-[#191c1e] text-white shadow-sm'
                    : 'bg-[#eceef0] text-[#45464d] hover:bg-[#e0e3e5]'
                }`}
              >
                {a.nama_area}
              </button>
            ))}
          </div>
        </div>

        {/* Area Detail View */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <span className="text-xs font-bold text-[#0051d5] uppercase tracking-wider">
                Area: {currentArea.nama_area}
              </span>
              <h2 className="text-base font-bold text-[#191c1e] mt-0.5">
                Rincian Rubrik Pembinaan
              </h2>
            </div>
            <span className="text-xs text-[#0c9488] font-bold flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">verified</span>
              SK Kepala Sekolah
            </span>
          </div>

          <div className="bg-[#f7f9fb] rounded-xl p-3.5 space-y-1">
            <span className="text-[11px] font-bold text-[#45464d] uppercase">Tujuan Instruksional &amp; Karakter:</span>
            <p className="text-xs text-[#191c1e] leading-relaxed">{currentArea.tujuan}</p>
          </div>

          {/* Kegiatan Terstandar */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-[#45464d] uppercase tracking-wider">
              Daftar Kegiatan Terstandar ({currentArea.daftar_kegiatan.length}):
            </h3>
            <div className="space-y-2">
              {currentArea.daftar_kegiatan.map((k, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2.5 p-3 rounded-xl bg-[#f7f9fb] border border-slate-100 text-xs text-[#191c1e]"
                >
                  <span className="w-5 h-5 rounded-full bg-[#dbe1ff] text-[#003ea8] flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="font-medium">{k}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Opsi Tindak Lanjut */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <h3 className="text-xs font-bold text-[#45464d] uppercase tracking-wider">
              Opsi Tindak Lanjut Terdaftar ({currentArea.opsi_tindak_lanjut.length}):
            </h3>
            <div className="space-y-1.5">
              {currentArea.opsi_tindak_lanjut.map((tl, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-[#f7f9fb] border border-slate-100 text-xs text-[#191c1e]"
                >
                  <span className="material-symbols-outlined text-[#0c9488] text-[18px]">
                    check_circle
                  </span>
                  <span className="font-medium">{tl}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
