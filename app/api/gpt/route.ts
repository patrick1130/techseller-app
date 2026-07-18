import { NextResponse } from "next/server";
import connectMongo from "@/libs/mongoose";
import History from "@/models/History";
import User from "@/models/User";
import { auth } from "@/libs/next-auth";
import { generateMarketingCopy } from "@/libs/services/copyEngine";

const HistoryModel = History as any;
const UserModel = User as any; // 👈 核心修复：绕过 Next.js HMR 导致的联合类型推导错误

export async function POST(req: Request) {
    try {
        // 1. 鉴权与获取用户信息
        const session = await auth();
        if (!session || !session.user?.id) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        await connectMongo();
        // 👈 使用 UserModel 替代直接调用 User
        const currentUser = await UserModel.findById(session.user.id);

        if (!currentUser) {
            return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
        }

        // ================= [ 2. 核心：额度周期刷新与验证逻辑 ] =================
        const now = new Date();
        let needSaveUser = false;

        // 触发自动刷新：如果当前时间超过了上次规划的重置日期
        if (currentUser.creditsResetDate && now > currentUser.creditsResetDate) {
            currentUser.credits = currentUser.monthlyCreditLimit;
            // 将下一次重置日期推迟 30 天
            currentUser.creditsResetDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
            needSaveUser = true;
        }

        // 额度耗尽拦截
        if (currentUser.credits <= 0) {
            // 如果刚刚碰巧执行了刷新（异常边缘情况），仍然把日期变更存入库
            if (needSaveUser) await currentUser.save();
            return NextResponse.json(
                { success: false, error: "Insufficient credits. Please upgrade your plan." },
                { status: 403 }
            );
        }

        // 3. 参数校验
        const body = await req.json();
        const { productName, specs, audience, tone } = body;

        if (!productName || !specs) {
            return NextResponse.json({ success: false, error: "Product Name and Specs are required!" }, { status: 400 });
        }

        console.log(`📡 Spawning TechSeller Engine for [${productName}]...`);

        // ================= [ 4. 调用业务 Service 生成文案 ] =================
        let parsedData;
        try {
            const engineParams = {
                ...body,
                userId: session.user.id
            };
            parsedData = await generateMarketingCopy(engineParams);
        } catch (err) {
            console.error("🚨 AI Generation or Parsing Failed:", err);
            return NextResponse.json(
                { success: false, error: "AI processing failed. Please try again." },
                { status: 500 }
            );
        }

        // ================= [ 5. 扣除额度并持久化用户信息 ] =================
        // 只有当 AI 成功生成，才真正扣减额度
        currentUser.credits -= 1;
        await currentUser.save();

        // ================= [ 6. 数据持久化 (生成历史) ] =================
        try {
            const userId = session.user.id;
            await HistoryModel.create({
                userId, productName, specs, audience, tone, result: parsedData,
            });

            // 容量控制 (Limit: 30)
            const userHistoryCount = await HistoryModel.countDocuments({ userId });
            if (userHistoryCount > 30) {
                const oldestRecords = await HistoryModel.find({ userId })
                    .sort({ createdAt: 1 })
                    .limit(userHistoryCount - 30);
                const idsToDelete = oldestRecords.map((doc: any) => doc._id);
                await HistoryModel.deleteMany({ _id: { $in: idsToDelete } });
            }
        } catch (dbError) {
            console.error("💾 Database save failed (Safely Ignored):", dbError);
        }

        // 7. 响应客户端
        return NextResponse.json({ success: true, data: parsedData });

    } catch (error: any) {
        console.error("API Main Error:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}