'use client';

import { useState } from 'react';
import { 
  LayoutDashboard, 
  Boxes, 
  UtensilsCrossed, 
  Receipt, 
  Truck, 
  FileBarChart,
  UserCheck,
  HeartHandshake,
  Users,
  Users2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface SidebarProps {
  activeMenu: string;
  setActiveMenu: (menu: string) => void;
}

export default function Sidebar({ activeMenu, setActiveMenu }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(true);

  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard },
    { name: 'Penerima Manfaat', icon: Users2 },
    { name: 'Gudang & Stok', icon: Boxes },
    { name: 'Ahli Gizi & Menu', icon: UtensilsCrossed },
    { name: 'Akuntan & Keuangan', icon: Receipt },
    { name: 'Distribusi Lapangan', icon: Truck },
    { name: 'Relawan', icon: HeartHandshake },
    { name: 'Users', icon: Users },
    { name: 'Laporan Ringkas', icon: FileBarChart },
  ];

  return (
    <aside 
      className={`relative bg-slate-900 text-white min-h-screen p-4 flex flex-col justify-between shadow-xl transition-all duration-300 ${
        isOpen ? 'w-64' : 'w-20'
      }`}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="absolute -right-3 top-8 bg-emerald-500 hover:bg-emerald-600 text-white p-1.5 rounded-full shadow-lg transition-transform active:scale-90 z-50"
        title={isOpen ? 'Sembunyikan Sidebar' : 'Tampilkan Sidebar'}
      >
        {isOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>

      <div>
        {/* Header Logo */}
        <div className={`mb-8 p-2.5 bg-slate-800/60 rounded-xl border border-slate-700/50 flex items-center ${
          isOpen ? 'justify-between space-x-2' : 'justify-center'
        }`}>
          {isOpen && (
            <div className="w-7 h-7 shrink-0 flex items-center justify-center bg-emerald-500/20 rounded-lg">
              <UtensilsCrossed className="w-4 h-4 text-emerald-400" />
            </div>
          )}

          {isOpen && (
            <div className="text-center overflow-hidden transition-all duration-200">
              <h1 className="text-sm font-bold tracking-wide text-emerald-400 leading-tight whitespace-nowrap">
                Dapur SPPG
              </h1>
              <p className="text-[10px] text-slate-400 whitespace-nowrap">
                Sistem Operasional
              </p>
            </div>
          )}

          <div className="w-7 h-7 shrink-0 flex items-center justify-center bg-blue-500/20 rounded-lg">
            <span className="text-[10px] font-bold text-blue-400">BGN</span>
          </div>
        </div>

        {/* Menu Navigasi */}
        <nav className="space-y-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeMenu === item.name;

            return (
              <button
                key={item.name}
                onClick={() => setActiveMenu(item.name)}
                title={!isOpen ? item.name : ''}
                className={`w-full flex items-center px-3.5 py-3 rounded-xl text-sm font-medium transition-all duration-200 active:scale-95 ${
                  isOpen ? 'space-x-3 justify-start' : 'justify-center'
                } ${
                  isActive
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 font-semibold'
                    : 'text-slate-400 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                {isOpen && <span className="whitespace-nowrap overflow-hidden">{item.name}</span>}
              </button>
            );
          })}
        </nav>
      </div>

      <div className={`p-3 bg-slate-800/40 border border-slate-800 rounded-xl flex items-center ${isOpen ? 'space-x-3' : 'justify-center'} text-xs text-slate-300`}>
        <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-full shrink-0">
          <UserCheck className="w-4 h-4" />
        </div>
        {isOpen && (
          <div className="overflow-hidden">
            <p className="text-[10px] text-slate-400 uppercase font-semibold whitespace-nowrap">Role Terhubung</p>
            <p className="font-semibold text-white whitespace-nowrap">Asisten Lapangan</p>
          </div>
        )}
      </div>
    </aside>
  );
}