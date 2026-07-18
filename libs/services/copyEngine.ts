import { sendOpenAi } from "@/libs/gpt";

interface CopyEngineParams {
    productName: string;
    specs: string;
    audience: string;
    tone: string;
}

export async function generateMarketingCopy(params: CopyEngineParams) {
    const { productName, specs, audience, tone } = params;

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
    {
      "hook": "1 short, high-impact emotional hook / pain-point introduction. (50-80 words)",
      "bullets": "5 high-converting, scenario-based Bullet Points. Format: '[Emoji] [BOLD CAPITAL KEYWORD]: Description'.",
      "faq": [
        {
          "question": "1st professional FAQ question here",
          "answer": "1st professional conversion-boosting answer here"
        }
      ],
      "socialPost": "A highly organic, natural-sounding review/recommendation post suitable for Reddit. (150-200 words)"
    }
    `;

    // 调用底层 GPT 封装
    const aiResponse = await sendOpenAi(
        [
            { role: "system", content: "You are an expert e-commerce copywriter. You must always reply in strict, valid JSON format in English." },
            { role: "user", content: systemPrompt }
        ],
        "system-engine", // userId 占位
        1500,
        0.7
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