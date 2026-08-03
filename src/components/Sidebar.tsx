'use client';

import { useState } from 'react';
import Image from 'next/image';
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
  ChevronRight,
  X,
  Menu
} from 'lucide-react';

interface SidebarProps {
  activeMenu: string;
  setActiveMenu: (menu: string) => void;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

const menuItems = [
  { name: 'Dashboard', icon: LayoutDashboard },
  { name: 'Penerima Manfaat', icon: Users2 },
  { name: 'Gudang & Stok', icon: Boxes },
  { name: 'Ahli Gizi & Menu', icon: UtensilsCrossed },
  { name: 'Akuntan & Keuangan', icon: Receipt },
  { name: 'Distribusi Lapangan', icon: Truck },
  { name: 'Relawan', icon: HeartHandshake },
  { name: 'Manajemen User', icon: Users },
  { name: 'Laporan Ringkas', icon: FileBarChart },
];

const MenuNav = ({ activeMenu, setActiveMenu, isOpen, onNavigate }: {
  activeMenu: string;
  setActiveMenu: (menu: string) => void;
  isOpen: boolean;
  onNavigate?: () => void;
}) => (
  <nav className="space-y-1.5">
    {menuItems.map((item) => {
      const Icon = item.icon;
      const isActive = activeMenu === item.name;
      return (
        <button
          key={item.name}
          onClick={() => { setActiveMenu(item.name); onNavigate?.(); }}
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
);

export default function Sidebar({ activeMenu, setActiveMenu, isMobileOpen = false, onMobileClose }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Mobile Sidebar Drawer */}
      <aside 
        className={`fixed top-0 left-0 h-full z-50 bg-slate-900 text-white w-72 transform transition-transform duration-300 ease-in-out lg:hidden ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 flex items-center justify-between border-b border-slate-700/50">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 shrink-0 flex items-center justify-center rounded-lg overflow-hidden">
              <Image src="/bgn.png" alt="Logo BGN" width={40} height={40} className="object-contain" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-wide text-emerald-400">Dapur SPPG Sangia Wambulu</h1>
              <p className="text-[10px] text-slate-400">Sistem Operasional</p>
            </div>
          </div>
          <button onClick={onMobileClose} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-3 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 140px)' }}>
          <MenuNav activeMenu={activeMenu} setActiveMenu={setActiveMenu} isOpen={true} onNavigate={onMobileClose} />
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <div className="p-3 bg-slate-800/40 border border-slate-800 rounded-xl flex items-center space-x-3 text-xs text-slate-300">
            <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-full shrink-0">
              <UserCheck className="w-4 h-4" />
            </div>
            <div className="overflow-hidden">
              <p className="text-[10px] text-slate-400 uppercase font-semibold whitespace-nowrap">Role Terhubung</p>
              <p className="font-semibold text-white whitespace-nowrap">Asisten Lapangan</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Desktop Sidebar */}
      <aside 
        className={`hidden lg:flex relative bg-slate-900 text-white min-h-screen p-4 flex-col justify-between shadow-xl transition-all duration-300 ${
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
          <div className={`mb-8 p-2.5 bg-slate-800/60 rounded-xl border border-slate-700/50 flex items-center ${
            isOpen ? 'justify-between space-x-2' : 'justify-center'
          }`}>
            <div className="w-10 h-10 shrink-0 flex items-center justify-center rounded-lg overflow-hidden">
              <Image src="/bgn.png" alt="Logo BGN" width={40} height={40} className="object-contain" />
            </div>
            {isOpen && (
              <div className="text-center overflow-hidden transition-all duration-200">
                <h1 className="text-sm font-bold tracking-wide text-emerald-400 leading-tight whitespace-nowrap">Dapur SPPG Sangia Wambulu</h1>
                <p className="text-[10px] text-slate-400 whitespace-nowrap">Sistem Operasional</p>
              </div>
            )}
          </div>
          <MenuNav activeMenu={activeMenu} setActiveMenu={setActiveMenu} isOpen={isOpen} />
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
    </>
  );
}