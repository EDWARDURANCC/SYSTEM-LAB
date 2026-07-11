import { GoogleGenAI } from "@google/genai";

let aiClient: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required on the server.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

/**
 * Converts a remote URL to base64 format for safe inline Gemini processing
 */
async function urlToBase64(url: string): Promise<{ data: string; mimeType: string } | null> {
  try {
    // If the url is already base64, return it directly
    if (url.startsWith("data:")) {
      const parts = url.split(",");
      const mime = parts[0].match(/:(.*?);/)?.[1] || "image/png";
      const data = parts[1];
      return { data, mimeType: mime };
    }

    // Absolute path on our server
    let fetchUrl = url;
    if (url.startsWith("/")) {
      fetchUrl = `http://localhost:3000${url}`;
    }

    console.log(`[urlToBase64] Fetching remote asset to convert: ${fetchUrl}`);
    const response = await fetch(fetchUrl);
    if (!response.ok) {
      console.warn(`[urlToBase64] Failed to fetch URL: ${fetchUrl}, status: ${response.status}`);
      return null;
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mimeType = response.headers.get("content-type") || "image/png";
    return {
      data: buffer.toString("base64"),
      mimeType,
    };
  } catch (error) {
    console.error("[urlToBase64] Error converting image URL to base64:", error);
    return null;
  }
}

/**
 * Generates an image using Gemini Image Models.
 * Default is gemini-3.1-flash-lite-image, unless 1K/2K resolution is specified.
 */
export async function generateBanner(
  prompt: string,
  options: {
    aspectRatio?: string;
    imageSize?: string;
    model?: string;
    productImage?: string;
    referenceImage?: string;
  } = {}
) {
  const ai = getGeminiClient();
  const aspectRatio = options.aspectRatio || "16:9";
  const imageSize = options.imageSize || "1K";
  const selectedModel = options.model || "nano-banana-pro";

  // Use the high quality image generation model when resolution or custom aspect ratios are requested.
  const model = "gemini-3.1-flash-image";

  console.log(`Generating banner with model ${model} (Engine: ${selectedModel}), prompt: "${prompt}", aspectRatio: ${aspectRatio}`);

  // Base prompt with high-fidelity professional requirements
  let finalPrompt = prompt;

  if (selectedModel === "nano-banana-pro") {
    finalPrompt = `[Nano Banana Pro Elite Engine] Create an absolute masterpiece of high-fidelity commercial design. ${prompt}. 
    Style requirements: high-end commercial studio product photography, dramatic high-contrast professional lighting, sophisticated tech/SaaS backdrop, gorgeous soft purple and deep slate modern color palette, clean glassmorphism panels, extremely professional and luxurious aesthetic. Integrate the provided product flawlessly. NO text, labels, or letters of any kind inside the generated image.`;
  } else {
    finalPrompt = `${prompt}. Create a clean, ultra-modern professional corporate landing page banner illustration, high fidelity SaaS design accent, with dark background aesthetic. No text or lettering inside the image.`;
  }

  const parts: any[] = [];

  // If a product image is supplied, convert and append it as a direct source model reference
  if (options.productImage) {
    const productBase64 = await urlToBase64(options.productImage);
    if (productBase64) {
      console.log(`[Gemini Image Gen] Including product image as visual source reference.`);
      parts.push({
        inlineData: {
          data: productBase64.data,
          mimeType: productBase64.mimeType
        }
      });
      // Add instruction to place product in center
      finalPrompt = `Based on the product in the provided image: ${finalPrompt}. Render a modern professional scene where this product is showcased inside a premium commercial setting.`;
    }
  }

  // If a reference style/banner is uploaded, append it as a style guideline reference
  if (options.referenceImage) {
    const refBase64 = await urlToBase64(options.referenceImage);
    if (refBase64) {
      console.log(`[Gemini Image Gen] Including uploaded reference image for style and layout guidance.`);
      parts.push({
        inlineData: {
          data: refBase64.data,
          mimeType: refBase64.mimeType
        }
      });
      finalPrompt = `${finalPrompt}. Adopt the layout structure, tone, and visual mood matching this reference image, maintaining perfect brand harmony.`;
    }
  }

  // Final text prompt part
  parts.push({ text: finalPrompt });

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: parts
      },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio as any,
          imageSize: imageSize as any
        }
      }
    });

    if (!response.candidates?.[0]?.content?.parts) {
      throw new Error("Failed to generate image from Gemini model candidates.");
    }

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }

    throw new Error("No image data found in generation response.");
  } catch (error: any) {
    console.error("Gemini Image Generation Error:", error);
    throw error;
  }
}

/**
 * Generates variations or edits an existing image with instructions
 */
export async function editImage(base64Image: string, prompt: string, options: { aspectRatio?: string } = {}) {
  const ai = getGeminiClient();
  const aspectRatio = options.aspectRatio || "16:9";

  console.log(`Editing image with prompt: "${prompt}"`);

  // Strip prefix from data URL if present
  const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite-image",
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: "image/png"
            }
          },
          {
            text: `${prompt}. Adjust formatting, adapt style to fit professional marketing landing page banner. Keep elements recognizable but highly premium. No text inside the image.`
          }
        ]
      },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio as any
        }
      }
    });

    if (!response.candidates?.[0]?.content?.parts) {
      throw new Error("Failed to edit image from Gemini.");
    }

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }

    throw new Error("No edited image data returned.");
  } catch (error: any) {
    console.error("Gemini Image Edit Error:", error);
    throw error;
  }
}
