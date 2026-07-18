import { NextResponse } from "next/server";
import connectMongo from "@/libs/mongoose";
import RedeemCode from "@/models/RedeemCode";
import crypto from "crypto";

const RedeemCodeModel = RedeemCode as any;

export async function GET(req: Request) {
    // 🔐 安全锁：防止在线上环境被恶意调用生成无数兑换码
    const { searchParams } = new URL(req.url);
    const secret = searchParams.get("secret");

    if (secret !== "super-secret-seed-key") {
        return NextResponse.json({ success: false, error: "Unauthorized request" }, { status: 401 });
    }

    try {
        await connectMongo();

        // 🛡️ 防呆设计：如果数据库已经有码了，拒绝重复执行
        const existingCount = await RedeemCodeModel.countDocuments();
        if (existingCount > 0) {
            return NextResponse.json({
                success: false,
                message: `Database already contains ${existingCount} codes. Clear the collection first if you want to re-seed.`
            });
        }

        console.log("🚀 Starting AppSumo codes generation...");

        const codesToInsert = [];

        // 阶梯分配策略
        const TIER_1_COUNT = 4000;
        const TIER_2_COUNT = 800;
        const TIER_3_COUNT = 200;

        // 生成高强度随机码的辅助函数 (例如: TECH-A1B2C3D4)
        const generateCode = (tierStr: string) => {
            const randomPart = crypto.randomBytes(4).toString('hex').toUpperCase();
            return `TECH-${tierStr}-${randomPart}`;
        };

        // 准备 Tier 1 数据
        for (let i = 0; i < TIER_1_COUNT; i++) {
            codesToInsert.push({ code: generateCode('T1'), tier: "appsumo_tier1" });
        }

        // 准备 Tier 2 数据
        for (let i = 0; i < TIER_2_COUNT; i++) {
            codesToInsert.push({ code: generateCode('T2'), tier: "appsumo_tier2" });
        }

        // 准备 Tier 3 数据
        for (let i = 0; i < TIER_3_COUNT; i++) {
            codesToInsert.push({ code: generateCode('T3'), tier: "appsumo_tier3" });
        }

        console.log(`📦 Prepared ${codesToInsert.length} codes. Writing to MongoDB...`);

        // ⚡ 核心性能优化：使用 insertMany 批量插入，5000条数据瞬间完成
        await RedeemCodeModel.insertMany(codesToInsert);

        return NextResponse.json({
            success: true,
            message: "Successfully generated and inserted 5000 AppSumo codes! 🌮",
            distribution: {
                tier1: TIER_1_COUNT,
                tier2: TIER_2_COUNT,
                tier3: TIER_3_COUNT
            }
        });

    } catch (error: any) {
        console.error("Seed API Error:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}