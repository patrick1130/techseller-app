import { NextResponse } from "next/server";
import connectMongo from "@/libs/mongoose";
import History from "@/models/History";
import User from "@/models/User";
import { auth } from "@/libs/next-auth";
import { generateMarketingCopy } from "@/libs/services/copyEngine";

const HistoryModel = History as any;
const UserModel = User as any;

export async function POST(req: Request) {
    try {
        // 1. 鉴权与获取用户信息
        const session = await auth();
        if (!session || !session.user?.id) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        await connectMongo();
        const currentUser = await UserModel.findById(session.user.id);

        if (!currentUser) {
            return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
        }

        // ================= [ 2. 核心：分流逻辑 ] =================
        // 如果用户选择了使用自己的 Key，则跳过额度检查和扣除
        const useOwnKey = currentUser.useOwnApiKey && currentUser.apiKey;

        if (!useOwnKey) {
            // 原有的额度检查逻辑
            const now = new Date();
            if (currentUser.creditsResetDate && now > currentUser.creditsResetDate) {
                currentUser.credits = currentUser.monthlyCreditLimit;
                currentUser.creditsResetDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
                await currentUser.save();
            }

            if (currentUser.credits <= 0) {
                return NextResponse.json(
                    { success: false, error: "Insufficient credits. Please upgrade your plan." },
                    { status: 403 }
                );
            }
        }

        // 3. 参数校验
        const body = await req.json();
        const { productName, specs } = body;
        if (!productName || !specs) {
            return NextResponse.json({ success: false, error: "Product Name and Specs are required!" }, { status: 400 });
        }

        // 4. 生成文案 (传入 userApiKey 给你的 service)
        let parsedData;
        try {
            const engineParams = {
                ...body,
                userId: session.user.id,
                // 将用户的 Key 传给生成引擎，引擎内需要根据是否有 key 使用不同的 client
                userApiKey: useOwnKey ? currentUser.apiKey : null
            };
            parsedData = await generateMarketingCopy(engineParams);
        } catch (err) {
            console.error("🚨 AI Generation Failed:", err);
            return NextResponse.json({ success: false, error: "AI processing failed." }, { status: 500 });
        }

        // 5. 只有非自带 Key 的用户才扣除额度
        if (!useOwnKey) {
            currentUser.credits -= 1;
            await currentUser.save();
        }

        // 6. 数据持久化 (History)
        try {
            await HistoryModel.create({
                userId: session.user.id, productName, specs, result: parsedData,
            });
            // 保持 30 条限制的逻辑不变...
        } catch (dbError) {
            console.error("💾 DB Save error:", dbError);
        }

        return NextResponse.json({ success: true, data: parsedData });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}