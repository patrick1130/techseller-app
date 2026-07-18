import { NextResponse } from "next/server";
import connectMongo from "@/libs/mongoose";
import User from "@/models/User";
import RedeemCode from "@/models/RedeemCode";
import { auth } from "@/libs/next-auth";

const UserModel = User as any;
const RedeemCodeModel = RedeemCode as any;

// 定义不同 Tier 对应的额度配置
const TIER_CONFIG = {
    appsumo_tier1: { credits: 100 },
    appsumo_tier2: { credits: 300 },
    appsumo_tier3: { credits: 1000 },
} as const;

export async function POST(req: Request) {
    try {
        // 1. 验证用户登录状态
        const session = await auth();
        if (!session || !session.user?.id) {
            return NextResponse.json({ success: false, error: "Unauthorized. Please log in first." }, { status: 401 });
        }

        const body = await req.json();
        const { code } = body;

        if (!code || typeof code !== 'string') {
            return NextResponse.json({ success: false, error: "Invalid redemption code." }, { status: 400 });
        }

        const formattedCode = code.trim().toUpperCase(); // 容错处理：去掉空格并转大写

        await connectMongo();

        // 2. 查找并校验兑换码
        const redeemRecord = await RedeemCodeModel.findOne({ code: formattedCode });

        if (!redeemRecord) {
            return NextResponse.json({ success: false, error: "Code not found." }, { status: 404 });
        }

        if (redeemRecord.isUsed) {
            return NextResponse.json({ success: false, error: "This code has already been used." }, { status: 403 });
        }

        // 3. 获取并更新当前用户
        const currentUser = await UserModel.findById(session.user.id);

        if (!currentUser) {
            return NextResponse.json({ success: false, error: "User not found in database." }, { status: 404 });
        }

        // 4. 核心核销逻辑：给用户充值并升级套餐
        const tier = redeemRecord.tier as keyof typeof TIER_CONFIG;
        const rewardCredits = TIER_CONFIG[tier].credits;

        currentUser.planType = tier;
        currentUser.credits = rewardCredits;
        currentUser.monthlyCreditLimit = rewardCredits;
        // 设置下次刷新时间为 30 天后
        currentUser.creditsResetDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

        await currentUser.save();

        // 5. 销毁/标记兑换码
        redeemRecord.isUsed = true;
        redeemRecord.usedBy = session.user.id;
        redeemRecord.usedAt = new Date();
        await redeemRecord.save();

        return NextResponse.json({
            success: true,
            message: "AppSumo Code Redeemed Successfully! 🌮",
            data: {
                plan: tier,
                credits: rewardCredits
            }
        });

    } catch (error: any) {
        console.error("Redeem API Error:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}