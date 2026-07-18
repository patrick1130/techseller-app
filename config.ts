import { ConfigProps } from "./types/config";

// DaisyUI v5 no longer exports themes directly, using fallback color
const themes = {
  light: {
    primary: "#3b82f6", // blue-500
  }
};

const config = {
  appName: "TechSeller AI",
  appDescription:
    "High-converting marketing engine for 3C electronics using GaN-powered AI.",
  domainName: "techseller.pritihk.tech",
  crisp: {
    id: "",
    onlyShowOnRoutes: ["/"],
  },
  stripe: {
    plans: [
      {
        priceId: "", // Free plan, no priceId needed
        name: "Free Starter",
        description: "Perfect to test the waters",
        price: 0,
        priceAnchor: 19,
        features: [
          { name: "3 Generations per month" },
          { name: "Basic Hook & Bullet points" },
          { name: "Standard processing speed" },
        ],
      },
      {
        priceId:
          process.env.NODE_ENV === "development"
            ? "price_1TttW6FzQjhWVsGOgZKTgNNj"
            : "price_填入你的_线上真实ID",
        isFeatured: true,
        name: "Pro Monthly",
        description: "For e-commerce sellers & marketers",
        price: 19,
        priceAnchor: 29,
        features: [
          { name: "250 Generations per month" },
          { name: "Full 3C Asset Generation (Hooks, Bullets, FAQ, Reddit)" },
          { name: "High-converting GaN AI engine" },
          { name: "Priority fast processing" },
        ],
      },
      {
        priceId:
          process.env.NODE_ENV === "development"
            ? "price_1TuToqFzQjhWVsGONYQ8V4Ob"
            : "price_填入你的_线上真实ID",
        name: "Lifetime Deal",
        description: "Pay once. Unlimited usage with your own API Key.",
        price: 59,
        priceAnchor: 199,
        isOwnKeyAllowed: true, // 👈 核心修改：允许使用自带 Key
        features: [
          { name: "Unlimited generations (Own API Key)" },
          { name: "Everything in Pro Monthly" },
          { name: "Pay once, forever access" },
          { name: "24/7 Priority support" },
        ],
      },
    ],
  },
  aws: {
    bucket: "bucket-name",
    bucketUrl: `https://bucket-name.s3.amazonaws.com/`,
    cdn: "https://cdn-id.cloudfront.net/",
  },
  resend: {
    fromNoReply: `"TechSeller AI" <onboarding@resend.dev>`,
    fromAdmin: `"Admin at TechSeller" <onboarding@resend.dev>`,
    supportEmail: "marc.louvion@gmail.com",
  },
  colors: {
    theme: "light",
    main: themes["light"]["primary"],
  },
  auth: {
    loginUrl: "/api/auth/signin",
    callbackUrl: "/dashboard",
  },
} as ConfigProps;

export default config;