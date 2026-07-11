import React, { useState } from "react";
import { Plus, ShoppingBag, Calendar, Layers, Image as ImageIcon, Sparkles, ArrowLeft, Upload, Check, Trash2, ArrowRight } from "lucide-react";
import { Product } from "../types";

interface ProductsViewProps {
  products: Product[];
  onCreateProduct: (productData: Partial<Product>) => Promise<void>;
  onNavigateToGenerator: () => void;
  isCreateModeInitial?: boolean;
}

export default function ProductsView({
  products,
  onCreateProduct,
  onNavigateToGenerator,
  isCreateModeInitial = false
}: ProductsViewProps) {
  const [isCreating, setIsCreating] = useState(isCreateModeInitial);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Form State
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Software / SaaS");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [offerPrice, setOfferPrice] = useState("");
  const [oldPrice, setOldPrice] = useState("");
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [benefit1, setBenefit1] = useState("");
  const [benefit2, setBenefit2] = useState("");
  const [benefit3, setBenefit3] = useState("");
  const [benefit4, setBenefit4] = useState("");
  const [cta, setCta] = useState("Comenzar Ahora");
  const [images, setImages] = useState<string[]>([]);

  // Local File Uploads
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setErrorMsg("");

    try {
      // Read as Base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        
        // Post to server-side /api/upload
        const res = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            base64: base64String,
            filename: file.name
          })
        });

        const data = await res.json();
        if (res.ok && data.url) {
          setImages((prev) => [...prev, data.url].slice(0, 3));
        } else {
          throw new Error(data.error || "Error al subir la imagen");
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "No se pudo cargar la imagen.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAddImageUrl = () => {
    const url = prompt("Introduce la URL directa de la imagen:");
    if (url) {
      setImages((prev) => [...prev, url].slice(0, 3));
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    if (!name || !category || !description) {
      setErrorMsg("Los campos Nombre, Categoría y Descripción son obligatorios.");
      setLoading(false);
      return;
    }

    try {
      const benefitsArray = [benefit1, benefit2, benefit3, benefit4].filter(Boolean);
      
      const payload: Partial<Product> = {
        name,
        category,
        description,
        price: Number(price) || 0,
        currency,
        offerPrice: Number(offerPrice) || 0,
        oldPrice: Number(oldPrice) || 0,
        title: title || `${name} - Solución Premium`,
        subtitle: subtitle || `El mejor aliado en la categoría de ${category}`,
        benefits: benefitsArray.length > 0 ? benefitsArray : ["Soporte Premium 24/7", "Garantía de Conversión"],
        cta: cta || "Comenzar Ahora",
        images: images.length > 0 ? images : ["https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80"],
        state: "complete"
      };

      await onCreateProduct(payload);
      
      // Reset form
      setName("");
      setDescription("");
      setPrice("");
      setOfferPrice("");
      setOldPrice("");
      setTitle("");
      setSubtitle("");
      setBenefit1("");
      setBenefit2("");
      setBenefit3("");
      setBenefit4("");
      setImages([]);
      setIsCreating(false);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Error al guardar el producto.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-white animate-fadeIn">
      {/* View Header */}
      <div className="flex items-center justify-between border-b border-neutral-800 pb-5">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight">
            {isCreating ? "Registrar Nuevo Producto" : "Catálogo de Productos"}
          </h2>
          <p className="text-xs text-neutral-400">
            {isCreating 
              ? "Suministra las especificaciones comerciales para estructurar tus campañas." 
              : "Administra los activos digitales e información corporativa para entrenar a la IA."}
          </p>
        </div>

        {!isCreating && (
          <button
            onClick={() => setIsCreating(true)}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-xl text-xs font-semibold shadow-lg shadow-purple-500/10 flex items-center space-x-2 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Crear Producto</span>
          </button>
        )}
      </div>

      {isCreating ? (
        /* CREATE PRODUCT FORM */
        <div className="max-w-4xl bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6 md:p-8">
          <button
            onClick={() => setIsCreating(false)}
            className="mb-6 flex items-center space-x-2 text-xs text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver al Catálogo</span>
          </button>

          {errorMsg && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 mb-6">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* 1. INFORMACIÓN BÁSICA */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-purple-400 uppercase tracking-widest border-b border-neutral-800/80 pb-2">
                1. Información Básica del Producto
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                    Nombre del Producto <span className="text-purple-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej. System Lab Enterprise"
                    className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 focus:border-purple-600 rounded-xl text-sm outline-none transition-colors placeholder-neutral-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                    Categoría <span className="text-purple-500">*</span>
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 focus:border-purple-600 rounded-xl text-sm outline-none transition-colors text-white"
                  >
                    <option value="Software / SaaS">Software / SaaS</option>
                    <option value="E-commerce / Físico">E-commerce / Físico</option>
                    <option value="Infoproducto / Curso">Infoproducto / Curso</option>
                    <option value="Servicios Profesionales">Servicios Profesionales</option>
                    <option value="Salud y Bienestar">Salud y Bienestar</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                  Descripción Comercial <span className="text-purple-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe en detalle qué problema resuelve, cómo funciona y quién es tu cliente ideal..."
                  className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 focus:border-purple-600 rounded-xl text-sm outline-none transition-colors placeholder-neutral-600 resize-none"
                />
              </div>
            </div>

            {/* 2. PRICING */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-purple-400 uppercase tracking-widest border-b border-neutral-800/80 pb-2">
                2. Modelo de Precios y Moneda
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Moneda</label>
                  <input
                    type="text"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    placeholder="USD"
                    className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 focus:border-purple-600 rounded-xl text-sm outline-none transition-colors placeholder-neutral-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Precio Regular</label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="99.00"
                    className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 focus:border-purple-600 rounded-xl text-sm outline-none transition-colors placeholder-neutral-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Precio de Oferta</label>
                  <input
                    type="number"
                    value={offerPrice}
                    onChange={(e) => setOfferPrice(e.target.value)}
                    placeholder="49.00"
                    className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 focus:border-purple-600 rounded-xl text-sm outline-none transition-colors placeholder-neutral-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Precio Anterior</label>
                  <input
                    type="number"
                    value={oldPrice}
                    onChange={(e) => setOldPrice(e.target.value)}
                    placeholder="149.00"
                    className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 focus:border-purple-600 rounded-xl text-sm outline-none transition-colors placeholder-neutral-600"
                  />
                </div>
              </div>
            </div>

            {/* 3. COPYWRITING PREFERENCIAS / HOOKS */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-purple-400 uppercase tracking-widest border-b border-neutral-800/80 pb-2">
                3. Ganchos Creativos y Estructura Visual
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Título Principal (Hero Hook)</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ej. Duplica las ventas de tus landing pages con IA"
                    className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 focus:border-purple-600 rounded-xl text-sm outline-none transition-colors placeholder-neutral-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Subtítulo Descriptivo</label>
                  <input
                    type="text"
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    placeholder="Ej. Generación de copys y banners profesionales listos en segundos"
                    className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 focus:border-purple-600 rounded-xl text-sm outline-none transition-colors placeholder-neutral-600"
                  />
                </div>
              </div>

              {/* Beneficios */}
              <div className="space-y-3 pt-2">
                <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider">Beneficios Clave (Hasta 4)</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    value={benefit1}
                    onChange={(e) => setBenefit1(e.target.value)}
                    placeholder="Beneficio 1: Ej. Copys persuasivos sin redactores"
                    className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 focus:border-purple-600 rounded-xl text-sm outline-none transition-colors placeholder-neutral-600"
                  />
                  <input
                    type="text"
                    value={benefit2}
                    onChange={(e) => setBenefit2(e.target.value)}
                    placeholder="Beneficio 2: Ej. Banners de alta calidad listos para usar"
                    className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 focus:border-purple-600 rounded-xl text-sm outline-none transition-colors placeholder-neutral-600"
                  />
                  <input
                    type="text"
                    value={benefit3}
                    onChange={(e) => setBenefit3(e.target.value)}
                    placeholder="Beneficio 3: Ej. Integración completa en un constructor visual"
                    className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 focus:border-purple-600 rounded-xl text-sm outline-none transition-colors placeholder-neutral-600"
                  />
                  <input
                    type="text"
                    value={benefit4}
                    onChange={(e) => setBenefit4(e.target.value)}
                    placeholder="Beneficio 4: Ej. Exportación directa sin configurar servidores"
                    className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 focus:border-purple-600 rounded-xl text-sm outline-none transition-colors placeholder-neutral-600"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Texto del CTA (Llamada a la Acción)</label>
                <input
                  type="text"
                  value={cta}
                  onChange={(e) => setCta(e.target.value)}
                  placeholder="Ej. Probar System Lab Ahora"
                  className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 focus:border-purple-600 rounded-xl text-sm outline-none transition-colors placeholder-neutral-600"
                />
              </div>
            </div>

            {/* 4. CARGA DE IMÁGENES */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-purple-400 uppercase tracking-widest border-b border-neutral-800/80 pb-2">
                4. Imágenes del Producto (Máximo 3)
              </h3>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Estas imágenes serán utilizadas para que la IA comprenda visualmente tu producto y genere banners coherentes.
              </p>

              <div className="flex items-center space-x-3">
                <label className="px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 rounded-xl text-xs font-semibold text-white flex items-center space-x-2 transition-colors cursor-pointer border border-neutral-700">
                  <Upload className="w-4 h-4 text-purple-400" />
                  <span>{uploadingImage ? "Subiendo..." : "Subir Imagen Local"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={uploadingImage || images.length >= 3}
                  />
                </label>

                <button
                  type="button"
                  onClick={handleAddImageUrl}
                  disabled={images.length >= 3}
                  className="px-4 py-2.5 bg-neutral-950 hover:bg-neutral-900 border border-neutral-800 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white transition-colors cursor-pointer"
                >
                  Pegar URL de Imagen
                </button>
              </div>

              {/* Render loaded image previews */}
              {images.length > 0 && (
                <div className="grid grid-cols-3 gap-4 pt-2">
                  {images.map((img, index) => (
                    <div key={index} className="relative group aspect-video rounded-xl border border-neutral-800 overflow-hidden bg-neutral-950">
                      <img src={img} alt={`Producto ${index + 1}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 p-1.5 bg-red-500/80 hover:bg-red-600 rounded-lg text-white transition-colors cursor-pointer"
                        title="Eliminar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <span className="absolute bottom-2 left-2 px-2 py-0.5 bg-neutral-900/90 text-[9px] rounded font-mono text-purple-400 uppercase tracking-widest border border-neutral-800">
                        Img {index + 1}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ACTION SUBMIT BUTTON */}
            <div className="pt-6 border-t border-neutral-800/80 flex items-center justify-end space-x-4">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-5 py-3 bg-neutral-950 hover:bg-neutral-900 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white border border-neutral-800 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || uploadingImage}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-500 rounded-xl text-xs font-semibold text-white shadow-lg shadow-purple-500/10 flex items-center space-x-2 transition-all cursor-pointer"
              >
                {loading ? (
                  <span>Guardando...</span>
                ) : (
                  <>
                    <span>Guardar Producto</span>
                    <Check className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* LIST OF PRODUCTS GRID */
        <div>
          {products.length === 0 ? (
            <div className="bg-neutral-900/30 border border-neutral-800/80 rounded-2xl p-16 text-center max-w-2xl mx-auto space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-neutral-900 flex items-center justify-center mx-auto text-neutral-600 border border-neutral-800">
                <ShoppingBag className="w-8 h-8 text-neutral-500" />
              </div>
              <div className="space-y-1.5">
                <h4 className="text-base font-bold text-white">Catálogo Vacío</h4>
                <p className="text-xs text-neutral-400 leading-relaxed max-w-sm mx-auto">
                  Aún no has registrado ningún producto comercial en System Lab. Comienza ingresando tu primer activo.
                </p>
              </div>
              <div className="pt-2">
                <button
                  onClick={() => setIsCreating(true)}
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 rounded-xl text-xs font-semibold shadow-lg shadow-purple-500/15 flex items-center space-x-2 mx-auto transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Agregar Producto</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="bg-neutral-900/60 border border-neutral-800/80 rounded-2xl overflow-hidden hover:border-purple-500/30 transition-all duration-300 group flex flex-col justify-between shadow-sm"
                >
                  {/* Image banner */}
                  <div className="relative aspect-video bg-neutral-950 overflow-hidden">
                    {product.images?.[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-neutral-700 bg-neutral-950 font-semibold uppercase text-lg">
                        {product.name.slice(0, 2)}
                      </div>
                    )}
                    <span className="absolute top-3 left-3 px-2.5 py-1 bg-neutral-900/90 text-[10px] font-semibold text-purple-400 rounded-lg border border-neutral-800 uppercase tracking-widest">
                      {product.category}
                    </span>
                  </div>

                  {/* Body */}
                  <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-base font-bold text-white group-hover:text-purple-400 transition-colors truncate">
                          {product.name}
                        </h4>
                        <span className="text-xs font-bold text-neutral-300">
                          {product.offerPrice ? `${product.offerPrice} ${product.currency}` : `${product.price || 0} ${product.currency}`}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                        {product.description}
                      </p>
                    </div>

                    <div className="space-y-3 pt-3 border-t border-neutral-800/60">
                      {/* Meta information */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center space-x-2 text-[10px] text-neutral-500">
                          <Calendar className="w-3.5 h-3.5 shrink-0" />
                          <span>{new Date(product.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-[10px] text-neutral-500">
                          <Layers className="w-3.5 h-3.5 shrink-0" />
                          <span>{product.benefits?.length || 0} Beneficios</span>
                        </div>
                      </div>

                      {/* Action trigger to generator */}
                      <button
                        onClick={onNavigateToGenerator}
                        className="w-full py-2 bg-neutral-950 hover:bg-purple-600 hover:text-white rounded-xl text-[11px] font-semibold text-neutral-400 border border-neutral-800 hover:border-transparent flex items-center justify-center space-x-1.5 transition-all duration-200 cursor-pointer"
                      >
                        <span>Generar Landing IA</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
