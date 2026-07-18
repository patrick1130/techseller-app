import { NextResponse } from "next/server";
import connectMongo from "@/libs/mongoose";
import History from "@/models/History";
import User from "@/models/User";
import { auth } from "@/libs/next-auth";
import { generateMarketingCopy } from "@/libs/services/copyEngine"; // 👈 引入剥离出的 Service

const HistoryModel = History as any;

export async function POST(req: Request) {
    try {
        // 1. 鉴权与权限拦截
        const session = await auth();
        if (!session) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        await connectMongo();
        const currentUser = await User.findById(session.user.id);
        if (!currentUser?.hasAccess) {
            return NextResponse.json({ success: false, error: "Upgrade required" }, { status: 403 });
        }

        // 2. 参数校验
        const body = await req.json();
        const { productName, specs, audience, tone } = body;

        if (!productName || !specs) {
            return NextResponse.json({ success: false, error: "Product Name and Specs are required!" }, { status: 400 });
        }

        console.log(`📡 Spawning TechSeller Engine for [${productName}]...`);

        // ================= [ 3. 核心业务：调用 Service 层 ] =================
        let parsedData;
        try {
            parsedData = await generateMarketingCopy(body);
        } catch (err) {
            console.error("🚨 AI Generation or Parsing Failed:", err);
            return NextResponse.json(
                { success: false, error: "AI processing failed. Please try again." },
                { status: 500 }
            );
        }

        // ================= [ 4. 数据持久化 ] =================
        try {
            const userId = session?.user?.id || session?.user?.email;
            if (userId) {
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
            }
        } catch (dbError) {
            console.error("💾 Database save failed (Safely Ignored):", dbError);
        }

        // 5. 响应客户端
        return NextResponse.json({ success: true, data: parsedData });

    } catch (error: any) {
        console.error("API Main Error:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}