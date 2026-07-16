import { NextResponse } from "next/server";
import { sendOpenAi } from "@/libs/gpt";
import connectMongo from "@/libs/mongoose";
import History from "@/models/History";
import User from "@/models/User"; // 👈 新增：引入 User 模型
import { auth } from "@/libs/next-auth";

const HistoryModel = History as any;

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        await connectMongo();

        // 🚀 新增：商业变现拦截逻辑
        // 查询当前登录用户的完整信息
        const currentUser = await User.findById(session.user.id);

        // ShipFast 默认使用 hasAccess (布尔值) 来标记是否付费。
        // 如果你打算做点数扣费，可以改成判断 currentUser.credits > 0
        if (!currentUser?.hasAccess) {
            return NextResponse.json(
                { success: false, error: "Upgrade required" },
                { status: 403 } // 返回 403，触发 apiClient 的拦截器
            );
        }

        // --- 扣除点数逻辑 (可选，如果你做的是按次收费) ---
        // if (currentUser.credits <= 0) return 403...
        // currentUser.credits -= 1;
        // await currentUser.save();

        const { productName, specs, audience, tone } = await req.json();

        if (!productName || !specs) {
            return NextResponse.json(
                { success: false, error: "Product Name and Specs are required!" },
                { status: 400 }
            );
        }


        console.log(`📡 Spawning TechSeller Engine for [${productName}]...`);

        // ================= [ 1. AI 核心生成 ] =================
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
      "faq": "3 highly professional, conversion-boosting FAQs in Q&A format.",
      "socialPost": "A highly organic, natural-sounding review/recommendation post suitable for Reddit. (150-200 words)"
    }
    `;

        const aiResponse = await sendOpenAi(
            [
                { role: "system", content: "You are an expert e-commerce copywriter. You must always reply in strict, valid JSON format in English." },
                { role: "user", content: systemPrompt }
            ],
            1,
            1500,
            0.7
        );

        if (!aiResponse) {
            throw new Error("Empty response from AI.");
        }

        let parsedData;
        try {
            const cleanJson = aiResponse.replace(/```json/g, "").replace(/```/g, "").trim();
            parsedData = JSON.parse(cleanJson);
        } catch (_err) {
            return NextResponse.json(
                { success: false, error: "AI response format was invalid. Please try again." },
                { status: 500 }
            );
        }

        // ================= [ 2. 隔离保存历史记录 ] =================
        try {
            // 获取当前登录用户 Session
            const session = await auth();
            const userId = session?.user?.id || session?.user?.email;

            if (userId) {
                await connectMongo();
                await HistoryModel.create({
                    userId,
                    productName,
                    specs,
                    audience,
                    tone,
                    result: parsedData,
                });

                // 限制最多 30 条
                const userHistoryCount = await HistoryModel.countDocuments({ userId });
                if (userHistoryCount > 30) {
                    const oldestRecords = await HistoryModel.find({ userId })
                        .sort({ createdAt: 1 })
                        .limit(userHistoryCount - 30);

                    // 🛠️ 修复 4：为 doc 显式赋予 any 类型以过严格模式编译
                    const idsToDelete = oldestRecords.map((doc: any) => doc._id);
                    await HistoryModel.deleteMany({ _id: { $in: idsToDelete } });
                }
                console.log("💾 History saved successfully.");
            } else {
                console.log("⚠️ No active session found. Skipped history saving.");
            }
        } catch (dbError) {
            console.error("💾 Database or Auth save failed (Safely Ignored):", dbError);
        }

        // 返回生成的文案给前端
        return NextResponse.json({
            success: true,
            data: parsedData
        });

    } catch (error: any) {
        console.error("API Main Error:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}