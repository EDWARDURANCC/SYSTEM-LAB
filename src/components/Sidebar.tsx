import React from "react";
import { LayoutDashboard, ShoppingBag, Sparkles, Layers, LogOut, Settings } from "lucide-react";

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  userEmail: string | null;
  onLogout: () => void;
}

export default function Sidebar({ currentTab, setCurrentTab, userEmail, onLogout }: SidebarProps) {
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "products", label: "Mis Productos", icon: ShoppingBag },
    { id: "generator", label: "Generador IA", icon: Sparkles },
    { id: "builder", label: "Landing Builder", icon: Layers },
  ];

  return (
    <aside className="w-64 bg-neutral-900 border-r border-neutral-800 flex flex-col h-screen sticky top-0">
      {/* Brand Header */}
      <div className="p-6 border-b border-neutral-800 flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold bg-gradient-to-r from-white via-neutral-200 to-purple-400 bg-clip-text text-transparent tracking-tight">
            SYSTEM LAB
          </h1>
          <span className="text-[10px] font-mono text-purple-400 uppercase tracking-widest">SaaS Studio</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1.5">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-purple-600/15 text-purple-400 border border-purple-500/25 shadow-sm shadow-purple-500/5"
                  : "text-neutral-400 hover:text-white hover:bg-neutral-800/60 border border-transparent"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-purple-400" : "text-neutral-400"}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* User Info / Actions Footer */}
      <div className="p-4 border-t border-neutral-800 bg-neutral-950/40">
        <div className="flex items-center space-x-3 px-2 py-1 mb-3">
          <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center border border-neutral-700 text-xs font-semibold text-purple-400">
            {userEmail ? userEmail[0].toUpperCase() : "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-white truncate">{userEmail || "Usuario Activo"}</p>
            <p className="text-[10px] text-neutral-500 truncate">SaaS Plan Pro</p>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-medium text-neutral-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all duration-150"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
}
