import React, { useState, useEffect } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, doc, getDoc, getDocs, query, where, setDoc } from "firebase/firestore";
import { auth, db, handleFirestoreError, OperationType } from "./lib/firebase.js";
import { Product, Landing, LandingSection, LandingVersion } from "./types";

// Import custom modular premium components
import LoginScreen from "./components/LoginScreen.js";
import Sidebar from "./components/Sidebar.js";
import DashboardView from "./components/DashboardView.js";
import ProductsView from "./components/ProductsView.js";
import GeneratorView from "./components/GeneratorView.js";
import LandingBuilderView from "./components/LandingBuilderView.js";

import { Sparkles, Layers } from "lucide-react";

export default function App() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // App tabs & View state
  const [currentTab, setCurrentTab] = useState("dashboard");
  const [openCreateProductInitial, setOpenCreateProductInitial] = useState(false);

  // Firestore DB States
  const [products, setProducts] = useState<Product[]>([]);
  const [landings, setLandings] = useState<Landing[]>([]);
  const [activeLanding, setActiveLanding] = useState<Landing | null>(null);
  const [aiUsageCount, setAiUsageCount] = useState(0);

  // 1. Monitor Firebase Authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && user.email) {
        setUserEmail(user.email);
        setUserId(user.uid);
        await handleLoginSuccessInit(user.email, user.uid);
      } else {
        setUserEmail(null);
        setUserId(null);
        setAuthLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLoginSuccessInit = async (email: string, uid: string) => {
    setUserEmail(email);
    setUserId(uid);
    setAuthLoading(true);

    try {
      // Setup or register user in Firestore users/ collection
      try {
        await setDoc(doc(db, "users", uid), {
          id: uid,
          email,
          createdAt: new Date().toISOString()
        }, { merge: true });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${uid}`);
      }

      await fetchUserAssets(uid);
    } catch (err) {
      console.error("Error setting up user profile in Firestore:", err);
    } finally {
      setAuthLoading(false);
    }
  };

  const fetchUserAssets = async (uid: string) => {
    try {
      // 1. Fetch products
      let loadedProducts: Product[] = [];
      try {
        const productsRef = collection(db, "products");
        const qProducts = query(productsRef, where("userId", "==", uid));
        const productsSnap = await getDocs(qProducts);
        productsSnap.forEach((doc) => {
          loadedProducts.push(doc.data() as Product);
        });
        setProducts(loadedProducts);
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, "products");
      }

      // 2. Fetch landings
      let loadedLandings: Landing[] = [];
      try {
        const landingsRef = collection(db, "landings");
        const qLandings = query(landingsRef, where("userId", "==", uid));
        const landingsSnap = await getDocs(qLandings);
        landingsSnap.forEach((doc) => {
          loadedLandings.push(doc.data() as Landing);
        });
        setLandings(loadedLandings);
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, "landings");
      }

      // Set active landing (take the first one, or setup a default mock)
      if (loadedLandings.length > 0) {
        // Fetch full landing with versions
        const landingId = loadedLandings[0].id;
        try {
          const res = await fetch(`/api/landing/${landingId}`);
          if (res.ok) {
            const fullLanding = await res.json();
            setActiveLanding(fullLanding);
          } else {
            setActiveLanding(loadedLandings[0]);
          }
        } catch (err) {
          console.warn("Could not load landing via API, using direct doc", err);
          setActiveLanding(loadedLandings[0]);
        }
      } else {
        // If no landing exists, setup a default landing page skeleton
        const defaultLandingId = `landing_${Date.now()}`;
        const defaultLanding: Landing = {
          id: defaultLandingId,
          productId: loadedProducts[0]?.id || "none",
          userId: uid,
          title: "Mi Primera Landing Page",
          version: 1,
          sections: [
            {
              id: `sec_initial_1`,
              landingId: defaultLandingId,
              type: "hero",
              title: "Construye Ofertas Persuasivas con Inteligencia Artificial",
              subtitle: "System Lab une redacción y diseño modular corporativo",
              description: "Completa el perfil de tu oferta, genera secciones en segundos utilizando el poder de Claude y Gemini, y exporta el código listo para lanzar.",
              ctaText: "Comenzar Generación IA",
              imageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80",
              order: 0,
              createdAt: new Date().toISOString()
            }
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        // Save default landing directly in Firestore
        try {
          await setDoc(doc(db, "landings", defaultLandingId), defaultLanding);
          
          // Also save initial version snapshot
          const versionId = `v_1_${Date.now()}`;
          await setDoc(doc(db, "landings", defaultLandingId, "versions", versionId), {
            id: versionId,
            landingId: defaultLandingId,
            versionNumber: 1,
            sections: defaultLanding.sections,
            createdAt: new Date().toISOString()
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `landings/${defaultLandingId}`);
        }

        setLandings([defaultLanding]);
        setActiveLanding(defaultLanding);
      }

      // 3. Load generations count (from generated_assets)
      try {
        const assetsRef = collection(db, "generated_assets");
        const assetsSnap = await getDocs(assetsRef);
        setAiUsageCount(assetsSnap.size);
      } catch (err) {
        console.warn("Could not fetch generated assets count", err);
      }

    } catch (err) {
      console.error("Failed to load user assets from Firestore:", err);
    }
  };

  const handleLogout = async () => {
    setAuthLoading(true);
    await signOut(auth);
    setUserEmail(null);
    setUserId(null);
    setProducts([]);
    setLandings([]);
    setActiveLanding(null);
    setAuthLoading(false);
  };

  // Create Product handler
  const handleCreateProduct = async (productData: Partial<Product>) => {
    if (!userId) return;

    const productId = `prod_${Date.now()}`;
    const payload: Product = {
      id: productId,
      userId,
      name: productData.name || "",
      category: productData.category || "Software / SaaS",
      description: productData.description || "",
      price: Number(productData.price) || 0,
      currency: productData.currency || "USD",
      offerPrice: Number(productData.offerPrice) || 0,
      oldPrice: Number(productData.oldPrice) || 0,
      title: productData.title || `${productData.name} - Solución Premium`,
      subtitle: productData.subtitle || `El mejor aliado en la categoría de ${productData.category}`,
      benefits: productData.benefits || ["Soporte Premium 24/7", "Garantía de Conversión"],
      cta: productData.cta || "Comenzar Ahora",
      images: productData.images || ["https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80"],
      state: "complete",
      createdAt: new Date().toISOString()
    };

    // Write directly to Firestore using client-side SDK
    try {
      await setDoc(doc(db, "products", productId), payload);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `products/${productId}`);
    }

    // Refresh assets
    await fetchUserAssets(userId);
    setOpenCreateProductInitial(false);
  };

  // Save/Update Landing & create rollback version
  const handleSaveLanding = async (title: string, sections: LandingSection[]) => {
    if (!userId || !activeLanding) return;

    const nextVersion = activeLanding.version + 1;
    const landingDoc = {
      id: activeLanding.id,
      productId: activeLanding.productId,
      userId,
      title,
      version: nextVersion,
      sections,
      createdAt: activeLanding.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      // Save landing directly
      await setDoc(doc(db, "landings", activeLanding.id), landingDoc);

      // Save historic version directly for rollback
      const versionId = `v_${nextVersion}_${Date.now()}`;
      await setDoc(doc(db, "landings", activeLanding.id, "versions", versionId), {
        id: versionId,
        landingId: activeLanding.id,
        versionNumber: nextVersion,
        sections,
        createdAt: new Date().toISOString()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `landings/${activeLanding.id}`);
    }

    // Refresh assets
    await fetchUserAssets(userId);
  };

  // Version rollback restore
  const handleRestoreVersion = (version: LandingVersion) => {
    if (!activeLanding) return;
    
    // Sync UI view state with previous snapshots
    setActiveLanding((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        sections: version.sections
      };
    });
  };

  // Connect freshly generated AI section to active builder
  const handleAddSectionToLanding = (newSectionData: Partial<LandingSection>) => {
    if (!activeLanding) return;

    const orderIndex = activeLanding.sections.length;
    const completeSection: LandingSection = {
      id: `sec_${Date.now()}`,
      landingId: activeLanding.id,
      type: newSectionData.type || "hero",
      title: newSectionData.title || "Nueva Sección",
      subtitle: newSectionData.subtitle || "",
      description: newSectionData.description || "",
      bullets: newSectionData.bullets || [],
      ctaText: newSectionData.ctaText || "Clic Aquí",
      imageUrl: newSectionData.imageUrl || "",
      order: orderIndex,
      createdAt: new Date().toISOString()
    };

    // Update state
    setActiveLanding((prev) => {
      if (!prev) return null;
      const updatedSections = [...prev.sections, completeSection];
      return {
        ...prev,
        sections: updatedSections
      };
    });

    // Increment AI Usage metrics
    setAiUsageCount((prev) => prev + 1);
  };

  // Navigation callbacks
  const handleNewProductClick = () => {
    setOpenCreateProductInitial(true);
    setCurrentTab("products");
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center space-y-4 text-white">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center animate-pulse">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <p className="text-xs text-neutral-400 font-mono tracking-widest uppercase">Iniciando Laboratorio...</p>
      </div>
    );
  }

  // Not Authenticated
  if (!userEmail || !userId) {
    return <LoginScreen onLoginSuccess={handleLoginSuccessInit} />;
  }

  return (
    <div className="min-h-screen bg-neutral-950 flex font-sans selection:bg-purple-600 selection:text-white">
      {/* Sidebar navigation */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={(tab) => {
          setCurrentTab(tab);
          setOpenCreateProductInitial(false);
        }}
        userEmail={userEmail}
        onLogout={handleLogout}
      />

      {/* Main viewport */}
      <main className="flex-1 p-8 md:p-12 overflow-y-auto h-screen relative">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[radial-gradient(circle_at_80%_10%,rgba(147,51,234,0.03),transparent_70%)] pointer-events-none" />
        
        <div className="max-w-6xl mx-auto space-y-8 relative z-10">
          {currentTab === "dashboard" && (
            <DashboardView
              products={products}
              landings={landings}
              aiUsageCount={aiUsageCount}
              onNavigate={setCurrentTab}
              onNewProductClick={handleNewProductClick}
            />
          )}

          {currentTab === "products" && (
            <ProductsView
              products={products}
              onCreateProduct={handleCreateProduct}
              onNavigateToGenerator={() => setCurrentTab("generator")}
              isCreateModeInitial={openCreateProductInitial}
            />
          )}

          {currentTab === "generator" && (
            <GeneratorView
              products={products}
              onAddSectionToLanding={handleAddSectionToLanding}
            />
          )}

          {currentTab === "builder" && (
            <LandingBuilderView
              products={products}
              landing={activeLanding}
              onSaveLanding={handleSaveLanding}
              onRestoreVersion={handleRestoreVersion}
            />
          )}
        </div>
      </main>
    </div>
  );
}
