export interface User {
  id: string;
  email: string;
  displayName?: string;
  createdAt: string;
}

export interface Product {
  id: string;
  userId: string;
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
  images: string[];
  state: "draft" | "generating" | "complete";
  createdAt: string;
}

export interface LandingSection {
  id: string;
  landingId: string;
  type: "hero" | "benefits" | "features" | "offer" | "problem_solution" | "comparative" | "testimonials" | "faq" | "cta";
  title: string;
  subtitle?: string;
  description?: string;
  bullets?: string[];
  ctaText?: string;
  imageUrl?: string;
  order: number;
  createdAt: string;
}

export interface LandingVersion {
  id: string;
  landingId: string;
  versionNumber: number;
  sections: LandingSection[];
  createdAt: string;
}

export interface Landing {
  id: string;
  productId: string;
  userId: string;
  title: string;
  version: number;
  sections: LandingSection[];
  versions?: LandingVersion[];
  createdAt: string;
  updatedAt: string;
}

export interface GenerationJob {
  id: string;
  productId: string;
  sectionType: string;
  status: "QUEUED" | "PROCESSING_COPY" | "GENERATING_IMAGE" | "COMPLETED" | "FAILED";
  progress: number;
  result?: {
    creative_direction?: string;
    layout_plan?: string;
    copy?: {
      title: string;
      subtitle?: string;
      description?: string;
      bullets?: string[];
      ctaText?: string;
    };
    imageUrl?: string;
  };
  error?: string;
  createdAt: string;
  updatedAt: string;
}
