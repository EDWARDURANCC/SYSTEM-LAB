import React, { useState, useEffect } from "react";
import { Sparkles, Sliders, Image as ImageIcon, Layout, RefreshCw, Check, ArrowRight, Upload, Layers, AlertCircle } from "lucide-react";
import { Product, GenerationJob, LandingSection } from "../types";

interface GeneratorViewProps {
  products: Product[];
  onAddSectionToLanding: (section: Partial<LandingSection>) => void;
}

export default function GeneratorView({ products, onAddSectionToLanding }: GeneratorViewProps) {
  const [selectedProductId, setSelectedProductId] = useState("");
  const [sectionType, setSectionType] = useState("hero");
  const [visualStyle, setVisualStyle] = useState("Inspiración visual");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [imageSize, setImageSize] = useState("1K");

  // Custom editable product copywriting inputs ("las cajitas")
  const [customTitle, setCustomTitle] = useState("");
  const [customSubtitle, setCustomSubtitle] = useState("");
  const [customBenefits, setCustomBenefits] = useState("");
  const [customPrice, setCustomPrice] = useState<number>(0);
  const [customOfferPrice, setCustomOfferPrice] = useState<number>(0);
  const [customOldPrice, setCustomOldPrice] = useState<number>(0);
  const [selectedModel, setSelectedModel] = useState("nano-banana-pro");

  // File uploading/URL reference
  const [referenceImageUrl, setReferenceImageUrl] = useState("");
  const [uploadingRef, setUploadingRef] = useState(false);

  // Active generation tracking
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [job, setJob] = useState<GenerationJob | null>(null);
  const [polling, setPolling] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  // Set first product as default if available
  useEffect(() => {
    if (products.length > 0 && !selectedProductId) {
      setSelectedProductId(products[0].id);
    }
  }, [products]);

  // Synchronize custom inputs whenever the selected product changes
  useEffect(() => {
    if (selectedProduct) {
      setCustomTitle(selectedProduct.title || `${selectedProduct.name} - Solución Premium`);
      setCustomSubtitle(selectedProduct.subtitle || `El mejor aliado en la categoría de ${selectedProduct.category}`);
      setCustomBenefits(selectedProduct.benefits?.join("\n") || "Soporte Premium 24/7\nGarantía de Conversión");
      setCustomPrice(selectedProduct.price || 0);
      setCustomOfferPrice(selectedProduct.offerPrice || 0);
      setCustomOldPrice(selectedProduct.oldPrice || 0);
    }
  }, [selectedProduct]);

  // Polling mechanism
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeJobId && polling) {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/generation/${activeJobId}`);
          if (res.ok) {
            const data: GenerationJob = await res.json();
            setJob(data);

            if (data.status === "COMPLETED") {
              setPolling(false);
              setActiveJobId(null);
            } else if (data.status === "FAILED") {
              setPolling(false);
              setActiveJobId(null);
            }
          }
        } catch (err) {
          console.error("Error polling generation job status:", err);
        }
      }, 2500);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeJobId, polling]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingRef(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        
        const res = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ base64: base64String, filename: file.name })
        });

        const data = await res.json();
        if (res.ok && data.url) {
          setReferenceImageUrl(data.url);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
    } finally {
      setUploadingRef(false);
    }
  };

  const handleGenerate = async () => {
    if (!selectedProductId) return;

    setSuccessMsg("");
    setJob(null);
    setJob({
      id: "loading",
      productId: selectedProductId,
      sectionType,
      status: "QUEUED",
      progress: 10,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    try {
      const res = await fetch("/api/generate-section", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: selectedProductId,
          sectionType,
          productData: {
            ...selectedProduct,
            title: customTitle,
            subtitle: customSubtitle,
            benefits: customBenefits.split("\n").map(b => b.trim()).filter(Boolean),
            price: Number(customPrice) || 0,
            offerPrice: Number(customOfferPrice) || 0,
            oldPrice: Number(customOldPrice) || 0,
          },
          options: {
            referenceImage: referenceImageUrl,
            aspectRatio,
            imageSize,
            visualStyle,
            model: selectedModel
          }
        })
      });

      const data = await res.json();
      if (res.ok && data.jobId) {
        setActiveJobId(data.jobId);
        setPolling(true);
      } else {
        throw new Error(data.error || "Fallo en el servicio de generación");
      }
    } catch (err: any) {
      console.error(err);
      setJob({
        id: "error",
        productId: selectedProductId,
        sectionType,
        status: "FAILED",
        progress: 0,
        error: err.message || "Error al iniciar el proceso de generación",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
  };

  const handleSaveToBuilder = () => {
    if (!job || !job.result || !job.result.copy) return;

    const newSection: Partial<LandingSection> = {
      type: sectionType as any,
      title: job.result.copy.title,
      subtitle: job.result.copy.subtitle || "",
      description: job.result.copy.description || "",
      bullets: job.result.copy.bullets || [],
      ctaText: job.result.copy.ctaText || "Comenzar Ahora",
      imageUrl: job.result.imageUrl || "",
    };

    onAddSectionToLanding(newSection);
    setSuccessMsg("¡Sección agregada con éxito al Landing Builder! Dirígete a la pestaña de Builder para organizarla.");
  };

  return (
    <div className="space-y-6 text-white animate-fadeIn">
      {/* View Header */}
      <div className="border-b border-neutral-800 pb-5">
        <h2 className="text-xl font-extrabold tracking-tight">Generador Inteligente de Secciones</h2>
        <p className="text-xs text-neutral-400">
          Usa nuestro orquestador avanzado que une Claude para estructuración semántica y Gemini para adaptación visual.
        </p>
      </div>

      {products.length === 0 ? (
        <div className="p-16 text-center max-w-xl mx-auto bg-neutral-900/40 border border-neutral-800 rounded-2xl space-y-4">
          <AlertCircle className="w-12 h-12 text-purple-400 mx-auto" />
          <h3 className="text-base font-bold text-white">Falta registrar un producto</h3>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Para poder activar el motor creativo de IA, primero debes registrar al menos un producto en la pestaña "Mis Productos".
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT PANEL: PRODUCT PROFILE & EDITABLE COPIES (5 col) */}
          <div className="lg:col-span-5 bg-neutral-900/60 border border-neutral-800 rounded-2xl p-5 space-y-5 flex flex-col">
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-purple-400 uppercase tracking-widest border-b border-neutral-800 pb-2">
                Paso 1: Datos y Copy del Producto
              </h3>

              {/* Product Selector */}
              <div>
                <label className="block text-[10px] font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">Selecciona Producto Activo</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 focus:border-purple-600 rounded-xl text-xs outline-none text-white transition-colors"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedProduct && (
                <div className="space-y-4 pt-1">
                  {/* Custom Title Input */}
                  <div>
                    <label className="block text-[10px] font-semibold text-neutral-400 uppercase tracking-wider mb-1">Título principal / Gancho Comercial</label>
                    <input
                      type="text"
                      value={customTitle}
                      onChange={(e) => setCustomTitle(e.target.value)}
                      placeholder="Escribe el título llamativo del producto"
                      className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 focus:border-purple-600 rounded-xl text-xs outline-none text-white transition-colors"
                    />
                  </div>

                  {/* Custom Subtitle Input */}
                  <div>
                    <label className="block text-[10px] font-semibold text-neutral-400 uppercase tracking-wider mb-1">Subtítulo / Propuesta de Valor</label>
                    <input
                      type="text"
                      value={customSubtitle}
                      onChange={(e) => setCustomSubtitle(e.target.value)}
                      placeholder="Escribe el subtítulo o beneficio secundario"
                      className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 focus:border-purple-600 rounded-xl text-xs outline-none text-white transition-colors"
                    />
                  </div>

                  {/* Custom Benefits Input (Textarea line separated) */}
                  <div>
                    <label className="block text-[10px] font-semibold text-neutral-400 uppercase tracking-wider mb-1">Beneficios del Producto (uno por línea)</label>
                    <textarea
                      value={customBenefits}
                      onChange={(e) => setCustomBenefits(e.target.value)}
                      rows={3}
                      placeholder="Escribe cada beneficio en una nueva línea..."
                      className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 focus:border-purple-600 rounded-xl text-xs outline-none text-white transition-colors resize-none font-sans"
                    />
                  </div>

                  {/* Custom Prices Input (Grid of 3) */}
                  <div className="bg-neutral-950/40 p-3.5 border border-neutral-800 rounded-xl space-y-2.5">
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Configuración de Precios para Comparativa</p>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[9px] font-medium text-neutral-500 uppercase mb-1">P. Normal</label>
                        <input
                          type="number"
                          value={customPrice}
                          onChange={(e) => setCustomPrice(Number(e.target.value))}
                          className="w-full px-2 py-1.5 bg-neutral-900 border border-neutral-800 focus:border-purple-600 rounded-lg text-xs outline-none text-white transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-medium text-neutral-500 uppercase mb-1">P. Oferta</label>
                        <input
                          type="number"
                          value={customOfferPrice}
                          onChange={(e) => setCustomOfferPrice(Number(e.target.value))}
                          className="w-full px-2 py-1.5 bg-neutral-900 border border-neutral-800 focus:border-purple-600 rounded-lg text-xs outline-none text-white transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-medium text-neutral-500 uppercase mb-1">P. Anterior</label>
                        <input
                          type="number"
                          value={customOldPrice}
                          onChange={(e) => setCustomOldPrice(Number(e.target.value))}
                          className="w-full px-2 py-1.5 bg-neutral-900 border border-neutral-800 focus:border-purple-600 rounded-lg text-xs outline-none text-white transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Active Product Image Reference Preview */}
                  <div>
                    <label className="block text-[10px] font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">Imagen de tu Producto (Se usará como referencia)</label>
                    <div className="aspect-video rounded-xl overflow-hidden border border-neutral-800 bg-neutral-950 relative group">
                      {selectedProduct.images?.[0] ? (
                        <img src={selectedProduct.images[0]} alt={selectedProduct.name} className="w-full h-full object-cover transition-transform group-hover:scale-105" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-full h-full bg-purple-950/20 flex items-center justify-center text-[10px] text-purple-400 uppercase tracking-wider font-semibold">
                          Sin imagen de producto
                        </div>
                      )}
                      <div className="absolute top-2 right-2 bg-purple-600/90 text-[9px] text-white font-mono px-2 py-0.5 rounded shadow">
                        Activa
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-neutral-800/80">
              <span className="text-[9px] font-mono text-neutral-500 leading-relaxed block">
                * Las modificaciones que realices en estas cajitas no afectarán al producto original en base de datos, pero guiarán el copy de la landing y entrenarán a la IA para el banner promocional.
              </span>
            </div>
          </div>

          {/* RIGHT PANEL: GENERATION PARAMETERS & RESULTS (7 col) */}
          <div className="lg:col-span-7 space-y-6 flex flex-col justify-between">
            {/* Input Options Card */}
            <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6 space-y-5">
              <h3 className="text-xs font-bold text-purple-400 uppercase tracking-widest border-b border-neutral-800 pb-2">
                Paso 2: Parámetros del Generador IA
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Tipo de Sección */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Tipo de Sección</label>
                  <select
                    value={sectionType}
                    onChange={(e) => setSectionType(e.target.value)}
                    className="w-full px-3 py-2.5 bg-neutral-950 border border-neutral-800 focus:border-purple-600 rounded-xl text-xs outline-none text-white transition-colors"
                  >
                    <option value="hero">Hero (Sección Principal)</option>
                    <option value="benefits">Beneficios Clave</option>
                    <option value="features">Características Técnicas</option>
                    <option value="offer">Oferta / Lanzamiento</option>
                    <option value="problem_solution">Problema - Solución</option>
                    <option value="comparative">Comparativa Comercial</option>
                    <option value="testimonials">Prueba Social (Testimonios)</option>
                    <option value="faq">Preguntas Frecuentes (FAQ)</option>
                    <option value="cta">Llamada a la Acción (CTA)</option>
                  </select>
                </div>

                {/* 2. Inspiración Visual */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Enfoque Artístico</label>
                  <select
                    value={visualStyle}
                    onChange={(e) => setVisualStyle(e.target.value)}
                    className="w-full px-3 py-2.5 bg-neutral-950 border border-neutral-800 focus:border-purple-600 rounded-xl text-xs outline-none text-white transition-colors"
                  >
                    <option value="Inspiración visual">Inspiración visual (Sutil)</option>
                    <option value="Alta fidelidad">Alta fidelidad (Corporate SaaS)</option>
                    <option value="Nueva interpretación">Nueva interpretación (Modernist art)</option>
                  </select>
                </div>
              </div>

              {/* AI Selector & Image Parameters */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                {/* 3. Selección de Motor de IA */}
                <div className="md:col-span-2 bg-purple-950/20 p-4 border border-purple-900/30 rounded-xl">
                  <label className="block text-xs font-bold text-purple-300 uppercase tracking-wider mb-2">Motor de Inteligencia Artificial (IA)</label>
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-neutral-950 border border-purple-800 focus:border-purple-500 rounded-xl text-xs outline-none text-purple-200 transition-colors font-bold tracking-wide"
                  >
                    <option value="nano-banana-pro">🍌 Nano Banana Pro (Recomendado - Ultra Calidad)</option>
                    <option value="gemini-3.1-flash-image">🎨 Gemini Pro Visual Studio (Estilo Ilustración)</option>
                    <option value="gemini-3.5-flash">⚡ Gemini 3.5 Flash Core (Rápido y Minimalista)</option>
                  </select>
                  <p className="text-[10px] text-purple-400 mt-2">
                    * El motor <b>Nano Banana Pro</b> aplica un modelado avanzado para renderizar banners de estudio profesional, integrando la silueta e identidad de la imagen de tu producto.
                  </p>
                </div>

                {/* Format / Aspect Ratio */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Formato de Imagen</label>
                  <select
                    value={aspectRatio}
                    onChange={(e) => setAspectRatio(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 focus:border-purple-600 rounded-xl text-xs outline-none text-white transition-colors"
                  >
                    <option value="16:9">16:9 (Horizontal)</option>
                    <option value="1:1">1:1 (Cuadrado)</option>
                    <option value="4:5">4:5 (Vertical)</option>
                    <option value="9:16">9:16 (Móvil)</option>
                  </select>
                </div>

                {/* Resolution */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Resolución</label>
                  <select
                    value={imageSize}
                    onChange={(e) => setImageSize(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 focus:border-purple-600 rounded-xl text-xs outline-none text-white transition-colors"
                  >
                    <option value="1K">1K (Económico)</option>
                    <option value="2K">2K (Standard HD)</option>
                    <option value="4K">4K (Ultra Premium)</option>
                  </select>
                </div>

                {/* Upload Referent Image */}
                <div className="md:col-span-2 pt-1">
                  <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Banner o Composición de Referencia (Opcional)</label>
                  <label className="w-full py-2.5 px-3 bg-neutral-950 border border-neutral-800 hover:border-purple-600 rounded-xl text-xs flex items-center justify-center space-x-2 text-neutral-400 hover:text-white cursor-pointer transition-all">
                    <Upload className="w-4 h-4 text-purple-400" />
                    <span>{uploadingRef ? "Cargando..." : referenceImageUrl ? "¡Imagen de Referencia Cargada con Éxito!" : "Subir Imagen de Referencia de Diseño / Banner"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                      disabled={uploadingRef}
                    />
                  </label>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-4 border-t border-neutral-800/60 text-right">
                <button
                  onClick={handleGenerate}
                  disabled={!!activeJobId || uploadingRef}
                  className="px-6 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-xl text-xs font-bold text-white shadow-lg shadow-purple-500/15 flex items-center space-x-2 ml-auto cursor-pointer transition-all"
                >
                  <Sparkles className="w-4 h-4 text-yellow-300 animate-pulse" />
                  <span>GENERAR CON {selectedModel === "nano-banana-pro" ? "NANO BANANA PRO" : "IA SELECCIONADA"}</span>
                </button>
              </div>
            </div>

            {/* AI PROGRESS MONITORING & RESULTS SECTION */}
            {job && (
              <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6 space-y-6">
                
                {/* 1. Job Status Active Loader */}
                {(job.status === "QUEUED" || job.status === "PROCESSING_COPY" || job.status === "GENERATING_IMAGE") && (
                  <div className="space-y-4 py-8 text-center max-w-md mx-auto">
                    <div className="relative w-16 h-16 mx-auto">
                      <div className="absolute top-0 left-0 w-full h-full border-4 border-purple-900/40 rounded-full" />
                      <div className="absolute top-0 left-0 w-full h-full border-4 border-t-purple-500 border-r-indigo-500 rounded-full animate-spin" />
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-white">
                        {job.status === "QUEUED" && "Analizando producto... (10%)"}
                        {job.status === "PROCESSING_COPY" && job.progress === 20 && "Analizando producto... (20%)"}
                        {job.status === "PROCESSING_COPY" && job.progress === 40 && "Creando estrategia y redacción persuasiva... (40%)"}
                        {job.status === "GENERATING_IMAGE" && "Generando banner premium con Gemini... (70%)"}
                      </p>
                      
                      {/* Beautiful Progress Bar */}
                      <div className="w-full h-2 bg-neutral-950 rounded-full overflow-hidden border border-neutral-800">
                        <div
                          className="h-full bg-gradient-to-r from-purple-600 to-indigo-600 transition-all duration-500"
                          style={{ width: `${job.progress}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-neutral-500">Por favor, espera unos instantes. Se están calculando copys y layouts...</p>
                    </div>
                  </div>
                )}

                {/* 2. Job Failed State */}
                {job.status === "FAILED" && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400">
                    <p className="font-bold">Error en la generación:</p>
                    <p className="mt-1">{job.error || "Fallo inesperado del servidor."}</p>
                  </div>
                )}

                {/* 3. Completed Generation Result Display */}
                {job.status === "COMPLETED" && job.result && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                      <div>
                        <h4 className="text-sm font-bold text-white uppercase tracking-wider">Resultado Generado por IA</h4>
                        <span className="text-[10px] text-neutral-400">Section: {sectionType.toUpperCase()}</span>
                      </div>
                      <span className="px-2 py-0.5 bg-emerald-500/15 border border-emerald-500/20 rounded text-[9px] text-emerald-400 font-mono font-bold uppercase tracking-widest">
                        Ready
                      </span>
                    </div>

                    {successMsg && (
                      <div className="p-3.5 bg-green-500/10 border border-green-500/20 rounded-xl text-xs text-green-400">
                        {successMsg}
                      </div>
                    )}

                    {/* Layout & Content Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {/* Copy Results */}
                      <div className="space-y-4 bg-neutral-950/40 border border-neutral-800/40 p-4 rounded-xl text-xs leading-relaxed">
                        <div>
                          <p className="text-[10px] font-bold text-purple-400 uppercase mb-1">Título principal</p>
                          <p className="text-sm font-extrabold text-white">{job.result.copy?.title}</p>
                        </div>

                        {job.result.copy?.subtitle && (
                          <div>
                            <p className="text-[10px] font-bold text-neutral-500 uppercase mb-1">Subtítulo</p>
                            <p className="text-neutral-300">{job.result.copy.subtitle}</p>
                          </div>
                        )}

                        <div>
                          <p className="text-[10px] font-bold text-neutral-500 uppercase mb-1">Descripción de conversión</p>
                          <p className="text-neutral-300">{job.result.copy?.description}</p>
                        </div>

                        {job.result.copy?.bullets && job.result.copy.bullets.length > 0 && (
                          <div>
                            <p className="text-[10px] font-bold text-neutral-500 uppercase mb-1">Puntos de Persuasión</p>
                            <ul className="space-y-1">
                              {job.result.copy.bullets.map((bullet, i) => (
                                <li key={i} className="text-neutral-400 flex items-start space-x-2">
                                  <span className="text-purple-400 mt-0.5 shrink-0">•</span>
                                  <span>{bullet}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div>
                          <p className="text-[10px] font-bold text-neutral-500 uppercase mb-1">CTA Botón</p>
                          <span className="px-3 py-1 bg-purple-600 text-white font-semibold rounded text-[10px]">
                            {job.result.copy?.ctaText}
                          </span>
                        </div>
                      </div>

                      {/* Image Preview & Layout Instructions */}
                      <div className="space-y-4">
                        <div>
                          <p className="text-[10px] font-bold text-purple-400 uppercase mb-1">Banner Generado</p>
                          <div className="aspect-video rounded-xl overflow-hidden border border-neutral-800 bg-neutral-950">
                            {job.result.imageUrl ? (
                              <img src={job.result.imageUrl} alt="AI Generated Banner" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xs text-neutral-600">
                                Sin imagen
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="bg-neutral-950/40 p-4 rounded-xl border border-neutral-800/40 text-xs">
                          <p className="text-[10px] font-bold text-neutral-500 uppercase mb-1">Estructura y Dirección Creativa</p>
                          <p className="text-neutral-400 leading-relaxed font-mono text-[10px] mt-1">{job.result.layout_plan}</p>
                        </div>
                      </div>
                    </div>

                    {/* Action Panel */}
                    <div className="pt-4 border-t border-neutral-800/60 flex items-center justify-end space-x-3">
                      <button
                        onClick={handleGenerate}
                        className="px-4 py-2.5 bg-neutral-950 hover:bg-neutral-900 border border-neutral-800 rounded-xl text-xs font-semibold text-neutral-300 hover:text-white transition-colors cursor-pointer"
                      >
                        Regenerar
                      </button>
                      <button
                        onClick={handleSaveToBuilder}
                        className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 rounded-xl text-xs font-semibold text-white shadow-lg flex items-center space-x-2 transition-colors cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                        <span>Agregar al Landing Builder</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
