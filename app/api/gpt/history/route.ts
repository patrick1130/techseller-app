import { NextResponse } from "next/server";
import connectMongo from "@/libs/mongoose";
import History from "@/models/History";
import { auth } from "@/libs/next-auth"; // 适配 ShipFast 的 NextAuth v5

export async function GET() {
    try {
        const session = await auth();
        const userId = session?.user?.id || session?.user?.email;

        if (!userId) {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        await connectMongo();

        // 强制转换为 any 绕过 ts 联合类型检测，拉取最近的 30 条历史记录
        const HistoryModel = History as any;
        const list = await HistoryModel.find({ userId }).sort({ createdAt: -1 }).limit(30);

        return NextResponse.json({
            success: true,
            data: list,
        });
    } catch (error: any) {
        console.error("GET History Error:", error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}