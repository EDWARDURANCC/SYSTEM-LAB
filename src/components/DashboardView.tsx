import React from "react";
import { ShoppingBag, Sparkles, Layers, CreditCard, Plus, ArrowRight, CheckCircle, RefreshCw } from "lucide-react";
import { Product, Landing } from "../types";

interface DashboardViewProps {
  products: Product[];
  landings: Landing[];
  aiUsageCount: number;
  onNavigate: (tab: string) => void;
  onNewProductClick: () => void;
}

export default function DashboardView({
  products,
  landings,
  aiUsageCount,
  onNavigate,
  onNewProductClick
}: DashboardViewProps) {
  // Starter credits setup
  const startingCredits = 500;
  const creditsPerGen = 15;
  const creditsUsed = aiUsageCount * creditsPerGen;
  const creditsRemaining = Math.max(0, startingCredits - creditsUsed);

  return (
    <div className="space-y-8 animate-fadeIn text-white">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-neutral-900 via-neutral-900 to-purple-950/40 p-8 rounded-3xl border border-neutral-800/80 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[radial-gradient(circle_at_80%_20%,rgba(147,51,234,0.1),transparent_50%)]" />
        <div className="max-w-2xl relative z-10 space-y-2">
          <span className="text-xs font-mono font-bold tracking-widest text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full uppercase">
            Laboratorio Activo
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Bienvenido a <span className="bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">System Lab Studio</span>
          </h2>
          <p className="text-sm text-neutral-400 leading-relaxed">
            Comienza creando un producto para entrenar el motor de IA. Luego genera secciones persuasivas de landing page con banners personalizados y exporta el builder definitivo.
          </p>
          <div className="pt-3">
            <button
              onClick={onNewProductClick}
              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 rounded-xl text-xs font-semibold shadow-lg shadow-purple-500/15 flex items-center space-x-2 transition-all duration-150 hover:translate-x-0.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Nuevo Producto</span>
            </button>
          </div>
        </div>
      </div>

      {/* Analytics Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          {
            title: "Productos Creados",
            value: products.length,
            desc: "Registrados en Firestore",
            icon: ShoppingBag,
            color: "text-purple-400 bg-purple-500/10 border-purple-500/20"
          },
          {
            title: "Landings Diseñadas",
            value: landings.length,
            desc: "Estructuras activas",
            icon: Layers,
            color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20"
          },
          {
            title: "Generaciones IA",
            value: aiUsageCount,
            desc: "Copys y Banners creados",
            icon: Sparkles,
            color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
          },
          {
            title: "Créditos IA Restantes",
            value: `${creditsRemaining} / ${startingCredits}`,
            desc: "Starter Pack Pro",
            icon: CreditCard,
            color: "text-amber-400 bg-amber-500/10 border-amber-500/20"
          }
        ].map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={i}
              className="bg-neutral-900/60 border border-neutral-800/80 p-6 rounded-2xl flex items-center justify-between shadow-sm"
            >
              <div className="space-y-1">
                <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">{card.title}</p>
                <h4 className="text-2xl font-extrabold tracking-tight">{card.value}</h4>
                <p className="text-[10px] text-neutral-500">{card.desc}</p>
              </div>
              <div className={`p-3.5 rounded-xl border ${card.color}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Body Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Products List */}
        <div className="lg:col-span-2 bg-neutral-900/60 border border-neutral-800/80 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-white">Productos Recientes</h3>
              <p className="text-xs text-neutral-400">Tus ofertas comerciales de entrenamiento</p>
            </div>
            <button
              onClick={() => onNavigate("products")}
              className="text-xs text-purple-400 hover:text-purple-300 font-semibold flex items-center space-x-1.5 transition-colors"
            >
              <span>Ver todos</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {products.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center mx-auto text-neutral-600">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <p className="text-xs text-neutral-500">Aún no has registrado ningún producto.</p>
              <button
                onClick={onNewProductClick}
                className="text-xs text-purple-400 hover:underline font-semibold"
              >
                Crear mi primer producto
              </button>
            </div>
          ) : (
            <div className="divide-y divide-neutral-800/60">
              {products.slice(0, 4).map((product) => (
                <div key={product.id} className="py-3.5 flex items-center justify-between first:pt-0 last:pb-0">
                  <div className="flex items-center space-x-4 min-w-0">
                    <div className="w-11 h-11 rounded-lg bg-neutral-800 border border-neutral-700 overflow-hidden shrink-0">
                      {product.images?.[0] ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full bg-purple-950/20 flex items-center justify-center text-[10px] text-purple-400 font-semibold uppercase">
                          {product.name.slice(0, 2)}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{product.name}</p>
                      <p className="text-[10px] text-neutral-500 truncate">{product.category}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border ${
                        product.state === "complete"
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                          : product.state === "generating"
                          ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                          : "bg-neutral-800 border-neutral-700 text-neutral-400"
                      }`}
                    >
                      {product.state === "complete" ? "Completo" : product.state === "generating" ? "Generando" : "Draft"}
                    </span>
                    <button
                      onClick={() => onNavigate("generator")}
                      className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-purple-400 transition-colors"
                      title="Generar Landing"
                    >
                      <Sparkles className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Launchpad Action Cards */}
        <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-2xl p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-base font-bold text-white">Laboratorio Creativo</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Descubre las herramientas inteligentes para maximizar el retorno de conversión de tus productos.
            </p>

            <div className="space-y-3 pt-2">
              <div className="p-3 bg-neutral-950/40 rounded-xl border border-neutral-800/60 flex items-start space-x-3">
                <Sparkles className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="text-xs font-semibold text-white">Generar Banners IA</p>
                  <p className="text-[10px] text-neutral-500">Diseño adaptado a ratios 1:1, 16:9 y resoluciones 1K/2K.</p>
                </div>
              </div>

              <div className="p-3 bg-neutral-950/40 rounded-xl border border-neutral-800/60 flex items-start space-x-3">
                <Layers className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="text-xs font-semibold text-white">Versiones e Historial</p>
                  <p className="text-[10px] text-neutral-500">Restaura versiones previas de tus landers fácilmente.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-neutral-800 mt-6">
            <button
              onClick={() => onNavigate("generator")}
              className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold rounded-xl text-xs flex items-center justify-center space-x-2 shadow-lg shadow-purple-500/10 cursor-pointer"
            >
              <span>Abrir Generador IA</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
