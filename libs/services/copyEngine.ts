import { sendOpenAi } from "@/libs/gpt";

interface CopyEngineParams {
  productName: string;
  specs: string;
  audience?: string;
  tone?: string;
  userId?: string;
  isPremium?: boolean;        // 👈 接收路由层下发的权限状态
  planType?: string;          // 👈 接收具体的套餐类型
  userApiKey?: string | null; // 👈 接收用户自带的 API Key
}

export async function generateMarketingCopy(params: CopyEngineParams) {
  const {
    productName,
    specs,
    audience = "General consumers",
    tone = "Professional and persuasive",
    userId = "system-engine",
    isPremium = false,
    userApiKey = null
  } = params;

  // ================= [ 解决过度承诺 1：动态裁剪生成范围 ] =================
  // 免费版仅生成基础框架，高级版生成全套矩阵（包含 FAQ 和 Reddit 帖子）
  const requiredStructure = isPremium
    ? `{
      "hook": "1 short, high-impact emotional hook / pain-point introduction. (50-80 words)",
      "bullets": [
        "🚀 **[KEYWORD 1]**: 1st high-converting, scenario-based bullet point description",
        "🛡️ **[KEYWORD 2]**: 2nd bullet point...",
        "⚡ **[KEYWORD 3]**: 3rd bullet point...",
        "💡 **[KEYWORD 4]**: 4th bullet point...",
        "💼 **[KEYWORD 5]**: 5th bullet point..."
      ],
      "faq": [
        {
          "question": "1st professional FAQ question here",
          "answer": "1st professional conversion-boosting answer here"
        }
      ],
      "socialPost": "A highly organic, natural-sounding review/recommendation post suitable for Reddit. (150-200 words)"
    }`
    : `{
      "hook": "1 short, high-impact emotional hook / pain-point introduction. (50-80 words)",
      "bullets": [
        "🚀 **[KEYWORD 1]**: 1st high-converting, scenario-based bullet point description",
        "🛡️ **[KEYWORD 2]**: 2nd bullet point...",
        "⚡ **[KEYWORD 3]**: 3rd bullet point..."
      ]
    }`;

  const systemPrompt = `
    You are an elite e-commerce copywriting expert with 10 years of experience writing high-converting listings for platforms like Amazon, Temu, and Shopify in the North American market.
    You specialize in translating cold, technical specifications into real-life consumer scenarios, pain points, and emotional value.
    
    Product Details:
    - Product Name: ${productName}
    - Technical Specs: ${specs}
    - Target Audience: ${audience}
    - Tone of Voice: ${tone}

    Instructions:
    1. Write in flawless, native, high-converting North American English. Avoid generic machine-translated phrasing or passive voice.
    2. Format the output as a strict JSON object. Do not wrap in markdown \`\`\`json blocks. Return ONLY the JSON.

    Required JSON Structure:
    ${requiredStructure}
    `;

  // ================= [ 解决过度承诺 2：物理模型隔离与资源分配 ] =================
  // 高级版享受 旗舰模型 和 3000 tokens 上限，免费版使用 基础模型 和 1000 tokens 上限
  const selectedModel = isPremium ? "gpt-4o" : "gpt-4o-mini";
  const maxTokens = isPremium ? 3000 : 1000;

  // 👈 核心修改：将选定的模型和用户的 Key 透传给底层请求器
  const aiResponse = await sendOpenAi(
    [
      { role: "system", content: "You are an expert e-commerce copywriter. You must always reply in strict, valid JSON format in English." },
      { role: "user", content: systemPrompt }
    ],
    userId,
    maxTokens,
    0.7,
    selectedModel, // 新增参数：动态模型
    userApiKey     // 新增参数：用户私有 API Key
  );

  if (!aiResponse) {
    throw new Error("Empty response from AI engine.");
  }

  // 终极 JSON 清洗逻辑
  let cleanJson = aiResponse.replace(/```json/gi, "").replace(/```/g, "").trim();
  const firstBrace = cleanJson.indexOf('{');
  const lastBrace = cleanJson.lastIndexOf('}');

  if (firstBrace !== -1 && lastBrace !== -1) {
    cleanJson = cleanJson.substring(firstBrace, lastBrace + 1);
  }

  return JSON.parse(cleanJson);
}