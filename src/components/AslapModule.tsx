'use client';

import { ClipboardCheck, FileText, MapPin, Calendar, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

export default function AslapModule() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 bg-emerald-500/20 rounded-xl">
            <ClipboardCheck className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold">ASLAP</h2>
            <p className="text-sm text-slate-400">Asisten Lapangan</p>
          </div>
        </div>
      </div>

      {/* Placeholder content */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
          <div className="p-4 bg-slate-100 rounded-2xl mb-4">
            <ClipboardCheck className="w-12 h-12 text-slate-300" />
          </div>
          <h3 className="text-lg font-semibold text-slate-600 mb-2">Modul ASLAP</h3>
          <p className="text-sm text-slate-400 text-center max-w-md">
            Modul Asisten Lapangan sedang dalam pengembangan. Fitur akan segera tersedia untuk mendukung aktivitas lapangan.
          </p>
        </div>
      </div>
    </div>
  );
}
