import { NextResponse } from "next/server";
import { auth } from "@/libs/next-auth"; // 适配 ShipFast 的 NextAuth v5 标准
import connectMongo from "@/libs/mongoose"; // 👈 核心修复：这里绝对不能写 @/libs/mongo！必须走 mongoose
import History from "@/models/History";

const HistoryModel = History as any;

export async function GET() {
    try {
        const session = await auth();
        const userId = session?.user?.id || session?.user?.email;

        if (!userId) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        await connectMongo(); // 建立 Mongoose 业务连接
        const data = await HistoryModel.find({ userId }).sort({ createdAt: -1 }).limit(30);
        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        console.error("GET History Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await auth();
        const userId = session?.user?.id || session?.user?.email;

        if (!userId) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        await connectMongo(); // 建立 Mongoose 业务连接
        const body = await req.json();

        const newHistory = await HistoryModel.create({
            userId,
            productName: body.productName,
            specs: body.specs,
            audience: body.audience,
            tone: body.tone,
            result: body.result, // 保存完整的生成 JSON 结构
        });

        return NextResponse.json({ success: true, data: newHistory });
    } catch (error: any) {
        console.error("POST Save History Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}