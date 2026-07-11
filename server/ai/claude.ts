import { getGeminiClient } from "./gemini.js";
import { Type } from "@google/genai";

interface GenerationResult {
  creative_direction: string;
  copy: {
    title: string;
    subtitle: string;
    description: string;
    bullets: string[];
    ctaText: string;
  };
  layout_plan: string;
  image_prompt: string;
}

/**
 * Acts as the advanced creative copy and structure planner (Claude's role).
 * Uses Gemini 3.5 Flash with custom structured schemas to guarantee standard JSON output.
 */
export async function analyzeProductAndStructureSection(
  productData: {
    name: string;
    category: string;
    description: string;
    price?: number;
    currency?: string;
    offerPrice?: number;
    oldPrice?: number;
    title?: string;
    subtitle?: string;
    benefits?: string[];
    cta?: string;
  },
  sectionType: string,
  referenceImageInstructions?: string
): Promise<GenerationResult> {
  const ai = getGeminiClient();

  const prompt = `
    You are an Elite SaaS conversion copywriting and Landing Page design specialist (role: Claude AI architect).
    Analyze the following product details and draft high-converting copy and structural elements for a landing page section of type: "${sectionType}".

    Product Information:
    - Name: ${productData.name}
    - Category: ${productData.category}
    - Description: ${productData.description}
    - Pricing: ${productData.offerPrice || productData.price || "N/A"} ${productData.currency || "USD"} (Original Price: ${productData.oldPrice || "N/A"})
    - Primary Focus Hook: ${productData.title || ""}
    - Subtitle/Value Prop: ${productData.subtitle || ""}
    - Key Benefits Provided: ${productData.benefits?.join(", ") || "N/A"}
    - Action CTA Goal: ${productData.cta || "Get Started"}

    Reference Instructions / Style constraints:
    ${referenceImageInstructions || "None specified. Craft the ultimate modern look."}

    Generate high-impact content for the landing section:
    1. A creative direction specifying a visual style compatible with dark-themed elite dashboards, modern spacing, and purplish/indigo accents.
    2. Conversion copywriting specifically optimized for a "${sectionType}" block:
       - 'title': punchy, short, bold heading.
       - 'subtitle': supplementary value statement.
       - 'description': highly readable core body.
       - 'bullets': 3 to 5 persuasive bulleted points.
       - 'ctaText': strong, action-oriented button text.
    3. 'layout_plan': exact, modular instructions on how to place text, images, and visual cards.
    4. 'image_prompt': a highly detailed, descriptive text-to-image prompt to generate a stunning corporate vector, background tech abstract, or illustrative SaaS banner graphic that represents this section's core value. No text or logo in the image.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            creative_direction: {
              type: Type.STRING,
              description: "Visual guidelines, theme pairing, and accent recommendations."
            },
            copy: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                subtitle: { type: Type.STRING },
                description: { type: Type.STRING },
                bullets: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                ctaText: { type: Type.STRING }
              },
              required: ["title", "subtitle", "description", "bullets", "ctaText"]
            },
            layout_plan: {
              type: Type.STRING,
              description: "Instructions on element alignment, column splits, or grid setups."
            },
            image_prompt: {
              type: Type.STRING,
              description: "Detailed, high-quality prompt for generating the section illustration banner."
            }
          },
          required: ["creative_direction", "copy", "layout_plan", "image_prompt"]
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("No output generated from structural model.");
    }

    return JSON.parse(text) as GenerationResult;
  } catch (error: any) {
    console.error("Analytical Coprwriting Generation Error:", error);
    throw error;
  }
}
