import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, addDoc } from "firebase/firestore";
import { db } from "./src/lib/firebase.js";
import { generateLandingSection } from "./server/generation/orchestrator.js";

const app = express();
const PORT = 3000;

// Elevate body size limits to comfortably transfer base64 images (mock uploads)
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Create local uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve uploaded assets statically
app.use("/uploads", express.static(uploadsDir));

// ====================================
// API ENDPOINTS
// ====================================

// 1. HEALTH CHECK
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// 2. CREATE PRODUCT (POST /api/products)
app.post("/api/products", async (req, res) => {
  try {
    const { id, userId, name, category, description, price, currency, offerPrice, oldPrice, title, subtitle, benefits, cta, images } = req.body;
    
    if (!id || !userId || !name || !category || !description) {
      return res.status(400).json({ error: "Missing required parameters: id, userId, name, category, description" });
    }

    const productDoc = {
      id,
      userId,
      name,
      category,
      description,
      price: Number(price) || 0,
      currency: currency || "USD",
      offerPrice: Number(offerPrice) || 0,
      oldPrice: Number(oldPrice) || 0,
      title: title || "",
      subtitle: subtitle || "",
      benefits: benefits || [],
      cta: cta || "Get Started",
      images: images || [],
      state: "draft",
      createdAt: new Date().toISOString()
    };

    await setDoc(doc(db, "products", id), productDoc);
    console.log(`[API] Created product ${id} for user ${userId}`);
    res.status(201).json(productDoc);
  } catch (err: any) {
    console.error("[API] Error creating product:", err);
    res.status(500).json({ error: err.message || "Internal Server Error" });
  }
});

// 3. GET PRODUCTS (GET /api/products)
app.get("/api/products", async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ error: "Missing userId query parameter" });
    }

    const productsRef = collection(db, "products");
    const q = query(productsRef, where("userId", "==", userId));
    const querySnap = await getDocs(q);

    const productsList: any[] = [];
    querySnap.forEach((doc) => {
      productsList.push(doc.data());
    });

    res.json(productsList);
  } catch (err: any) {
    console.error("[API] Error getting products:", err);
    res.status(500).json({ error: err.message || "Internal Server Error" });
  }
});

// 4. UPLOAD ASSET (POST /api/upload)
app.post("/api/upload", async (req, res) => {
  try {
    const { base64, filename } = req.body;
    if (!base64) {
      return res.status(400).json({ error: "Missing base64 file data" });
    }

    const cleanBase64 = base64.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(cleanBase64, "base64");
    
    const uniqueName = `upload_${Date.now()}_${filename || "image.png"}`;
    const filePath = path.join(uploadsDir, uniqueName);
    
    fs.writeFileSync(filePath, buffer);
    const fileUrl = `/uploads/${uniqueName}`;

    console.log(`[API] Saved local uploaded image asset to ${filePath}`);
    res.json({ url: fileUrl });
  } catch (err: any) {
    console.error("[API] Upload failed:", err);
    res.status(500).json({ error: err.message || "Upload failed" });
  }
});

// 5. TRIGGER GENERATION JOB (POST /api/generate-section)
app.post("/api/generate-section", async (req, res) => {
  try {
    const { productId, sectionType, options, productData } = req.body;
    if (!productId || !sectionType) {
      return res.status(400).json({ error: "Missing required parameters: productId, sectionType" });
    }

    const jobId = `job_${Date.now()}`;
    const jobData = {
      id: jobId,
      productId,
      sectionType,
      status: "QUEUED",
      progress: 10,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Create the record in Firestore first
    await setDoc(doc(db, "generation_jobs", jobId), jobData);

    // Run orchestrator asynchronously so we return jobId instantly!
    generateLandingSection(jobId, productId, sectionType, options, productData).catch((err) => {
      console.error(`[API] Orchestration failed in background for job ${jobId}:`, err);
    });

    res.status(202).json({ jobId, status: "QUEUED" });
  } catch (err: any) {
    console.error("[API] Error launching generation job:", err);
    res.status(500).json({ error: err.message || "Internal Server Error" });
  }
});

// 6. GET GENERATION STATUS (GET /api/generation/:id)
app.get("/api/generation/:id", async (req, res) => {
  try {
    const jobId = req.params.id;
    const jobSnap = await getDoc(doc(db, "generation_jobs", jobId));
    
    if (!jobSnap.exists()) {
      return res.status(404).json({ error: "Generation job not found" });
    }

    res.json(jobSnap.data());
  } catch (err: any) {
    console.error("[API] Error fetching generation status:", err);
    res.status(500).json({ error: err.message || "Internal Server Error" });
  }
});

// 7. SAVE OR UPDATE LANDING (POST /api/landing)
app.post("/api/landing", async (req, res) => {
  try {
    const { id, productId, userId, title, version, sections } = req.body;
    if (!id || !productId || !userId || !title) {
      return res.status(400).json({ error: "Missing required landing page parameters" });
    }

    const landingDoc = {
      id,
      productId,
      userId,
      title,
      version: Number(version) || 1,
      sections: sections || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Save landing
    await setDoc(doc(db, "landings", id), landingDoc);

    // Save historic version for rollback
    const versionId = `v_${landingDoc.version}_${Date.now()}`;
    await setDoc(doc(db, "landings", id, "versions", versionId), {
      id: versionId,
      landingId: id,
      versionNumber: landingDoc.version,
      sections: landingDoc.sections,
      createdAt: new Date().toISOString()
    });

    console.log(`[API] Saved landing ${id} and version ${landingDoc.version}`);
    res.json(landingDoc);
  } catch (err: any) {
    console.error("[API] Error saving landing:", err);
    res.status(500).json({ error: err.message || "Internal Server Error" });
  }
});

// 8. GET LANDING WITH SECTIONS & VERSIONS (GET /api/landing/:id)
app.get("/api/landing/:id", async (req, res) => {
  try {
    const landingId = req.params.id;
    const landingSnap = await getDoc(doc(db, "landings", landingId));

    if (!landingSnap.exists()) {
      return res.status(404).json({ error: "Landing page not found" });
    }

    const landingData = landingSnap.data();

    // Fetch versions
    const versionsRef = collection(db, "landings", landingId, "versions");
    const versionsSnap = await getDocs(versionsRef);
    const versions: any[] = [];
    versionsSnap.forEach((doc) => {
      versions.push(doc.data());
    });

    res.json({
      ...landingData,
      versions: versions.sort((a, b) => b.versionNumber - a.versionNumber)
    });
  } catch (err: any) {
    console.error("[API] Error loading landing page:", err);
    res.status(500).json({ error: err.message || "Internal Server Error" });
  }
});

// ====================================
// VITE DEV SERVER & FRONTEND SERVING
// ====================================

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Development mode
    console.log("[Vite] Integrating development server middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    // Production mode
    console.log("[Production] Serving build directory statically...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[System Lab] Server listening on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start System Lab server:", err);
});
