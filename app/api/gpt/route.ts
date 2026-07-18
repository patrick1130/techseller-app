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

        // ================= [ 2. 核心：分流与额度逻辑 ] =================
        const useOwnKey = currentUser.useOwnApiKey && currentUser.apiKey;

        // 定义是否为高级用户 (非 free 套餐)
        const isPremium = currentUser.planType !== "free";

        if (!useOwnKey) {
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
        const { productName, specs, includeFaq, includeReddit } = body;

        if (!productName || !specs) {
            return NextResponse.json({ success: false, error: "Product Name and Specs are required!" }, { status: 400 });
        }

        // ================= [ 解决过度承诺 1：功能越权拦截 ] =================
        // 如果前端请求了高级模块（FAQ 或 Reddit），但用户是免费版，直接在 API 层拦截
        if (!isPremium && (includeFaq || includeReddit)) {
            return NextResponse.json(
                { success: false, error: "FAQ and Reddit generation are available for Pro users only. Please upgrade." },
                { status: 403 }
            );
        }
        // =================================================================

        // 4. 生成文案 (将权限状态下发给底层 Service)
        let parsedData;
        try {
            const engineParams = {
                ...body,
                userId: session.user.id,
                userApiKey: useOwnKey ? currentUser.apiKey : null,
                // 下发高级状态，用于底层引擎切换 Prompt 和 模型
                isPremium,
                planType: currentUser.planType
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

            const userHistoryCount = await HistoryModel.countDocuments({ userId: session.user.id });
            if (userHistoryCount > 30) {
                const oldestRecords = await HistoryModel.find({ userId: session.user.id })
                    .sort({ createdAt: 1 })
                    .limit(userHistoryCount - 30);
                const idsToDelete = oldestRecords.map((doc: any) => doc._id);
                await HistoryModel.deleteMany({ _id: { $in: idsToDelete } });
            }
        } catch (dbError) {
            console.error("💾 DB Save error:", dbError);
        }

        return NextResponse.json({ success: true, data: parsedData });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}