import React, { useState } from "react";
import { Layers, ArrowUp, ArrowDown, Edit, Trash2, History, Globe, Code, X, Check, ArrowRight, Sparkles, HelpCircle } from "lucide-react";
import { Landing, LandingSection, LandingVersion, Product } from "../types";

interface LandingBuilderViewProps {
  products: Product[];
  landing: Landing | null;
  onSaveLanding: (title: string, sections: LandingSection[]) => Promise<void>;
  onRestoreVersion: (version: LandingVersion) => void;
}

export default function LandingBuilderView({
  products,
  landing,
  onSaveLanding,
  onRestoreVersion
}: LandingBuilderViewProps) {
  const [title, setTitle] = useState(landing?.title || "Mi Gran Landing Page");
  const [sections, setSections] = useState<LandingSection[]>(landing?.sections || []);

  // Sync state if landing loads
  React.useEffect(() => {
    if (landing) {
      setTitle(landing.title);
      setSections(landing.sections);
    }
  }, [landing]);

  // Modals & Popups state
  const [editingSection, setEditingSection] = useState<LandingSection | null>(null);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Edit fields state
  const [editTitle, setEditTitle] = useState("");
  const [editSubtitle, setEditSubtitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editCta, setEditCta] = useState("");
  const [editImageUrl, setEditImageUrl] = useState("");

  // Reorder Sections
  const moveSection = (index: number, direction: "up" | "down") => {
    const updated = [...sections];
    const targetIndex = direction === "up" ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= sections.length) return;

    // Swap
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    // Update order key
    const reordered = updated.map((sec, idx) => ({
      ...sec,
      order: idx
    }));

    setSections(reordered);
    setSuccessMsg("Orden modificado. Recuerda hacer clic en 'Guardar Cambios' para asegurar la versión.");
  };

  const deleteSection = (id: string) => {
    const filtered = sections.filter((s) => s.id !== id).map((sec, idx) => ({
      ...sec,
      order: idx
    }));
    setSections(filtered);
    setSuccessMsg("Módulo eliminado del borrador.");
  };

  const openEditModal = (sec: LandingSection) => {
    setEditingSection(sec);
    setEditTitle(sec.title || "");
    setEditSubtitle(sec.subtitle || "");
    setEditDesc(sec.description || "");
    setEditCta(sec.ctaText || "");
    setEditImageUrl(sec.imageUrl || "");
  };

  const handleSaveSectionEdit = () => {
    if (!editingSection) return;

    const updated = sections.map((sec) => {
      if (sec.id === editingSection.id) {
        return {
          ...sec,
          title: editTitle,
          subtitle: editSubtitle,
          description: editDesc,
          ctaText: editCta,
          imageUrl: editImageUrl
        };
      }
      return sec;
    });

    setSections(updated);
    setEditingSection(null);
    setSuccessMsg("Módulo editado con éxito. Haz clic en 'Guardar Cambios' para crear la nueva versión.");
  };

  const handleSaveLandingState = async () => {
    try {
      setSuccessMsg("");
      await onSaveLanding(title, sections);
      setSuccessMsg(`¡Versión v${(landing?.version || 0) + 1} guardada con éxito en Firestore!`);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePublish = () => {
    setIsPublishing(true);
    setPublishedUrl("");
    setTimeout(() => {
      setIsPublishing(false);
      setPublishedUrl(`https://systemlab.ai/p/${landing?.id || "demo-landing"}`);
    }, 2000);
  };

  // Generate complete standalone clean HTML code
  const getHTMLCode = () => {
    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap');
    body { font-family: 'Inter', sans-serif; background-color: #0a0a0a; color: #f5f5f5; }
  </style>
</head>
<body>
  <!-- Landing page generada con System Lab -->
  <main class="space-y-24 max-w-7xl mx-auto px-6 py-12">
    ${sections
      .map(
        (sec) => `
    <!-- SECCIÓN: ${sec.type.toUpperCase()} -->
    <section class="grid grid-cols-1 md:grid-cols-2 gap-12 items-center border border-neutral-800/40 bg-neutral-900/40 p-8 md:p-12 rounded-3xl">
      <div class="space-y-6">
        <h2 class="text-3xl font-extrabold text-white tracking-tight leading-tight">${sec.title}</h2>
        ${sec.subtitle ? `<p class="text-lg font-semibold text-purple-400">${sec.subtitle}</p>` : ""}
        ${sec.description ? `<p class="text-neutral-400 leading-relaxed text-sm">${sec.description}</p>` : ""}
        ${
          sec.bullets && sec.bullets.length > 0
            ? `<ul class="space-y-2 text-neutral-300 text-sm">
          ${sec.bullets.map((b) => `<li>• ${b}</li>`).join("\n          ")}
        </ul>`
            : ""
        }
        <button class="px-6 py-3 bg-purple-600 hover:bg-purple-500 rounded-xl font-bold text-white transition-colors">
          ${sec.ctaText || "Comenzar Ahora"}
        </button>
      </div>
      <div class="rounded-2xl overflow-hidden aspect-video bg-neutral-950 border border-neutral-800">
        <img src="${sec.imageUrl || ""}" alt="Illustration" class="w-full h-full object-cover">
      </div>
    </section>
    `
      )
      .join("\n")}
  </main>
</body>
</html>`;
  };

  return (
    <div className="space-y-6 text-white animate-fadeIn">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-neutral-800 pb-5 gap-4">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight">Landing Page Builder</h2>
          <p className="text-xs text-neutral-400">
            Organiza, edita e instala los bloques generados. Guarda tu trabajo y publícalo en un hosting optimizado.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setExportModalOpen(true)}
            className="px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-xl text-xs font-semibold text-neutral-300 transition-colors cursor-pointer flex items-center space-x-1.5"
          >
            <Code className="w-4 h-4 text-purple-400" />
            <span>Exportar Código</span>
          </button>

          <button
            onClick={handleSaveLandingState}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-xl text-xs font-semibold shadow-lg shadow-purple-500/10 flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Guardar Cambios</span>
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-3.5 bg-green-500/10 border border-green-500/20 rounded-xl text-xs text-green-400">
          {successMsg}
        </div>
      )}

      {/* Main Structure Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COMPONENT: STAGE OR SECTIONS EDITOR (8 col) */}
        <div className="lg:col-span-8 space-y-5">
          {/* Landing Title field */}
          <div className="bg-neutral-900/40 p-4 border border-neutral-800 rounded-2xl flex items-center space-x-4">
            <div className="flex-1">
              <label className="block text-[10px] font-semibold text-neutral-500 uppercase mb-1">Nombre de la Landing</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej. Campaña System Lab Pro"
                className="w-full bg-transparent border-none text-base font-extrabold text-white outline-none focus:text-purple-400"
              />
            </div>
            <span className="px-2.5 py-1 bg-purple-600/10 border border-purple-500/20 rounded text-[10px] text-purple-400 font-mono uppercase tracking-wider font-semibold">
              Versión v{landing?.version || 1}
            </span>
          </div>

          {/* List of active sections */}
          {sections.length === 0 ? (
            <div className="p-16 text-center border-2 border-dashed border-neutral-800 rounded-3xl space-y-4">
              <div className="w-12 h-12 bg-neutral-900 rounded-full flex items-center justify-center mx-auto text-neutral-600">
                <Layers className="w-5 h-5 text-neutral-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Lienzo Vacío</p>
                <p className="text-xs text-neutral-400 mt-1 max-w-xs mx-auto">
                  Aún no has agregado secciones generadas por IA. Dirígete a la pestaña "Generador IA" para redactar tu primera oferta.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {sections.map((sec, idx) => (
                <div
                  key={sec.id || idx}
                  className="bg-neutral-900/60 border border-neutral-800/80 rounded-2xl overflow-hidden hover:border-neutral-700 transition-all p-5 flex flex-col md:flex-row md:items-start justify-between gap-5 relative"
                >
                  {/* Left content block */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center space-x-2.5">
                      <span className="px-2 py-0.5 bg-purple-500/10 border border-purple-500/20 rounded text-[9px] text-purple-400 font-mono font-bold uppercase tracking-wider">
                        {sec.type}
                      </span>
                      <span className="text-[10px] text-neutral-500 font-mono">Bloque #{idx + 1}</span>
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-sm font-extrabold text-white leading-snug">{sec.title}</h4>
                      {sec.subtitle && <p className="text-xs font-semibold text-purple-400/80">{sec.subtitle}</p>}
                      {sec.description && <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">{sec.description}</p>}
                    </div>

                    {/* Button trigger list */}
                    {sec.ctaText && (
                      <span className="inline-block px-3 py-1 bg-neutral-950 border border-neutral-800 rounded text-[10px] text-neutral-400">
                        Botón: <strong className="text-white">{sec.ctaText}</strong>
                      </span>
                    )}
                  </div>

                  {/* Image and quick controller tools */}
                  <div className="flex items-stretch space-x-4">
                    <div className="w-24 md:w-32 aspect-video rounded-xl overflow-hidden border border-neutral-800 bg-neutral-950 shrink-0">
                      {sec.imageUrl ? (
                        <img src={sec.imageUrl} alt="Module banner" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-neutral-700 bg-neutral-950 text-[10px]">
                          Ilustración
                        </div>
                      )}
                    </div>

                    {/* Sorting & control console */}
                    <div className="flex flex-col justify-between shrink-0 space-y-1">
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => moveSection(idx, "up")}
                          disabled={idx === 0}
                          className="p-1.5 bg-neutral-950 border border-neutral-800/80 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white disabled:opacity-30 transition-colors cursor-pointer"
                          title="Subir Bloque"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => moveSection(idx, "down")}
                          disabled={idx === sections.length - 1}
                          className="p-1.5 bg-neutral-950 border border-neutral-800/80 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white disabled:opacity-30 transition-colors cursor-pointer"
                          title="Bajar Bloque"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => openEditModal(sec)}
                          className="p-1.5 bg-neutral-950 border border-neutral-800/80 hover:bg-purple-600 rounded-lg text-neutral-400 hover:text-white transition-colors cursor-pointer"
                          title="Editar Bloque"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteSection(sec.id)}
                          className="p-1.5 bg-neutral-950 border border-neutral-800/80 hover:bg-red-600 rounded-lg text-neutral-400 hover:text-white transition-colors cursor-pointer"
                          title="Eliminar"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT SIDEBAR: AUDITING VERSION SNAPSHOTS (4 col) */}
        <div className="lg:col-span-4 bg-neutral-900/60 border border-neutral-800 rounded-2xl p-5 space-y-5">
          <div className="flex items-center space-x-2 border-b border-neutral-800 pb-3">
            <History className="w-4 h-4 text-purple-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-widest">
              Control de Versiones
            </h3>
          </div>

          {landing?.versions && landing.versions.length > 0 ? (
            <div className="space-y-3">
              {landing.versions.map((ver) => (
                <div
                  key={ver.id}
                  className="p-3 bg-neutral-950/40 hover:bg-neutral-950 rounded-xl border border-neutral-800/40 hover:border-purple-500/20 transition-all flex items-center justify-between"
                >
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-white">Campaña v{ver.versionNumber}</p>
                    <p className="text-[10px] text-neutral-500">{new Date(ver.createdAt).toLocaleDateString()} a las {new Date(ver.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    <span className="text-[9px] text-purple-400 font-semibold">{ver.sections?.length || 0} Bloques</span>
                  </div>

                  <button
                    onClick={() => {
                      onRestoreVersion(ver);
                      setSuccessMsg(`Se ha restaurado el borrador visual a la versión v${ver.versionNumber}. Recuerda guardar los cambios para fijarla.`);
                    }}
                    className="px-2.5 py-1.5 bg-neutral-900 hover:bg-purple-600 rounded-lg text-[10px] font-semibold text-neutral-300 hover:text-white transition-colors cursor-pointer border border-neutral-800 hover:border-transparent"
                  >
                    Restaurar
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-6 text-center text-neutral-500 space-y-2">
              <History className="w-8 h-8 mx-auto text-neutral-700" />
              <p className="text-[10px]">Aún no has guardado versiones de respaldo para esta landing.</p>
            </div>
          )}

          {/* Quick Publish Control */}
          <div className="pt-4 border-t border-neutral-800/80 space-y-3">
            <div className="flex items-center space-x-2">
              <Globe className="w-4 h-4 text-indigo-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-widest">Hosting de Landing</h3>
            </div>
            
            <p className="text-[10px] text-neutral-500 leading-relaxed">
              Publica instantáneamente en un CDN de velocidad ultra-rápida provisto de forma nativa por System Lab.
            </p>

            <button
              onClick={handlePublish}
              disabled={isPublishing || sections.length === 0}
              className="w-full py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-xl text-xs font-semibold text-white shadow-lg shadow-purple-500/5 transition-all cursor-pointer disabled:opacity-50"
            >
              {isPublishing ? "Publicando..." : "Publicar Landing Page"}
            </button>

            {publishedUrl && (
              <div className="p-3 bg-indigo-950/20 border border-indigo-500/20 rounded-xl space-y-1.5">
                <p className="text-[10px] font-bold text-indigo-400 uppercase">¡Live URL Activo!</p>
                <a
                  href={publishedUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-white hover:underline truncate block"
                >
                  {publishedUrl}
                </a>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* MODAL 1: EDIT SECTION COMPONENT */}
      {editingSection && (
        <div className="fixed inset-0 z-50 bg-neutral-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-neutral-800 flex items-center justify-between">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">Editar Contenidos de Sección</h4>
              <button
                onClick={() => setEditingSection(null)}
                className="p-1 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[400px] overflow-y-auto">
              <div>
                <label className="block text-[10px] font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">Título del Bloque</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 focus:border-purple-600 rounded-lg text-xs outline-none text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">Subtítulo / Antetítulo</label>
                <input
                  type="text"
                  value={editSubtitle}
                  onChange={(e) => setEditSubtitle(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 focus:border-purple-600 rounded-lg text-xs outline-none text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">Cuerpo de Texto</label>
                <textarea
                  rows={4}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 focus:border-purple-600 rounded-lg text-xs outline-none text-white resize-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">Llamada a la Acción (CTA)</label>
                <input
                  type="text"
                  value={editCta}
                  onChange={(e) => setEditCta(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 focus:border-purple-600 rounded-lg text-xs outline-none text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">URL del Banner/Ilustración</label>
                <input
                  type="text"
                  value={editImageUrl}
                  onChange={(e) => setEditImageUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 focus:border-purple-600 rounded-lg text-xs outline-none text-white"
                />
              </div>
            </div>

            <div className="p-5 border-t border-neutral-800 bg-neutral-950/40 flex items-center justify-end space-x-3">
              <button
                onClick={() => setEditingSection(null)}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveSectionEdit}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Aplicar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: STANDALONE HTML/TAILWIND EXPORT */}
      {exportModalOpen && (
        <div className="fixed inset-0 z-50 bg-neutral-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-neutral-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Code className="w-4 h-4 text-purple-400" />
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">Exportar Código Standalone</h4>
              </div>
              <button
                onClick={() => setExportModalOpen(false)}
                className="p-1 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1">
              <p className="text-xs text-neutral-400 mb-4">
                Usa este código HTML5 completo con soporte nativo de Tailwind CSS para implementar tu landing page en tu hosting preferido.
              </p>
              <pre className="p-4 bg-neutral-950 text-neutral-300 rounded-xl text-[11px] font-mono overflow-x-auto whitespace-pre border border-neutral-800 select-all max-h-[350px]">
                {getHTMLCode()}
              </pre>
            </div>

            <div className="p-5 border-t border-neutral-800 bg-neutral-950/40 text-right">
              <button
                onClick={() => setExportModalOpen(false)}
                className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 rounded-xl text-xs font-semibold text-white cursor-pointer"
              >
                Listo
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
