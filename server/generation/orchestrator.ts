import { doc, updateDoc, setDoc, getDoc } from "firebase/firestore";
import { db } from "../../src/lib/firebase.js";
import { analyzeProductAndStructureSection } from "../ai/claude.js";
import { generateBanner } from "../ai/gemini.js";

/**
 * Main orchestration entrypoint to generate a landing page section with sequential progress tracking.
 */
export async function generateLandingSection(
  jobId: string,
  productId: string,
  sectionType: string,
  options: {
    referenceImage?: string;
    aspectRatio?: string;
    imageSize?: string;
    visualStyle?: string;
    model?: string;
  } = {},
  passedProductData?: any
) {
  const jobRef = doc(db, "generation_jobs", jobId);

  try {
    // 1. Initial State: Already QUEUED. Advance to PROCESSING_COPY (Analizando producto 20%)
    console.log(`[Job ${jobId}] Starting generation. Fetching product ${productId}...`);
    await updateDoc(jobRef, {
      status: "PROCESSING_COPY",
      progress: 20,
      updatedAt: new Date().toISOString()
    });

    let productData = passedProductData;
    if (!productData) {
      console.log(`[Job ${jobId}] No passed product data found. Fetching from database fallback...`);
      const productRef = doc(db, "products", productId);
      const productSnap = await getDoc(productRef);
      if (!productSnap.exists()) {
        throw new Error(`Product ${productId} not found in database.`);
      }
      productData = productSnap.data();
    }

    // 2. Strategy Planning: (Creando estrategia 40%)
    await updateDoc(jobRef, {
      progress: 40,
      updatedAt: new Date().toISOString()
    });

    const referenceInstructions = options.visualStyle 
      ? `Visual mood selected: ${options.visualStyle}. ${options.referenceImage ? "Adjust elements with reference guidance." : ""}`
      : "Ensure high-converting SaaS alignment.";

    console.log(`[Job ${jobId}] Invoking copywriting analysis (Claude) for ${sectionType}...`);
    const analysis = await analyzeProductAndStructureSection(
      productData as any,
      sectionType,
      referenceInstructions
    );

    // 3. Image Generation: (Generando imagen 70%)
    await updateDoc(jobRef, {
      status: "GENERATING_IMAGE",
      progress: 70,
      updatedAt: new Date().toISOString()
    });

    console.log(`[Job ${jobId}] Invoking image generation (Gemini) with prompt: "${analysis.image_prompt}"`);
    let bannerUrl = "";
    try {
      bannerUrl = await generateBanner(analysis.image_prompt, {
        aspectRatio: options.aspectRatio,
        imageSize: options.imageSize,
        model: options.model,
        referenceImage: options.referenceImage,
        productImage: productData?.images?.[0]
      });
    } catch (imgError: any) {
      console.warn(`[Job ${jobId}] Image generation failed, fallback default background asset used.`, imgError);
      // Fallback beautiful purple vector placeholder so the process never breaks
      bannerUrl = `https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80`;
    }

    // 4. Finalizing: (Completo 100%)
    const result = {
      creative_direction: analysis.creative_direction,
      layout_plan: analysis.layout_plan,
      copy: {
        title: analysis.copy.title,
        subtitle: analysis.copy.subtitle,
        description: analysis.copy.description,
        bullets: analysis.copy.bullets,
        ctaText: analysis.copy.ctaText
      },
      imageUrl: bannerUrl
    };

    console.log(`[Job ${jobId}] Generation complete. Saving results...`);
    await updateDoc(jobRef, {
      status: "COMPLETED",
      progress: 100,
      result: result,
      updatedAt: new Date().toISOString()
    });

    // Also register in generated_assets collection for full history log
    const assetId = `asset_${Date.now()}`;
    await setDoc(doc(db, "generated_assets", assetId), {
      id: assetId,
      jobId,
      productId,
      sectionType,
      copy: result.copy,
      imageUrl: result.imageUrl,
      layout: result.layout_plan,
      createdAt: new Date().toISOString()
    });

    return result;
  } catch (error: any) {
    console.error(`[Job ${jobId}] Orchestrator failed:`, error);
    await updateDoc(jobRef, {
      status: "FAILED",
      error: error.message || String(error),
      updatedAt: new Date().toISOString()
    });
    throw error;
  }
}
