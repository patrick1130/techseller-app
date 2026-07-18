import { NextResponse } from "next/server";
import connectMongo from "@/libs/mongoose";
import User from "@/models/User";
import { auth } from "@/libs/next-auth";

const UserModel = User as any;

// 1. 获取当前设置 (GET)
export async function GET() {
    try {
        const session = await auth();
        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectMongo();
        const user = await UserModel.findById(session.user.id);

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // 安全处理：不要把完整的 API Key 传给前端，只传掩码 (例如 sk-...12ab)
        const maskedKey = user.apiKey
            ? `sk-...${user.apiKey.slice(-4)}`
            : "";

        return NextResponse.json({
            success: true,
            useOwnApiKey: user.useOwnApiKey || false,
            maskedApiKey: maskedKey,
            planType: user.planType || "free",
        });
    } catch (error: any) {
        console.error("Fetch API Key error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// 2. 保存新设置 (POST)
export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { apiKey, useOwnApiKey } = body;

        await connectMongo();
        const user = await UserModel.findById(session.user.id);

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // 更新开关状态
        if (useOwnApiKey !== undefined) {
            user.useOwnApiKey = useOwnApiKey;
        }

        // 只有当用户真的输入了新 Key，并且不是前端传来的掩码字符串时，才更新数据库
        if (apiKey && !apiKey.startsWith("sk-...")) {
            user.apiKey = apiKey.trim();
        }

        await user.save();

        return NextResponse.json({ success: true, message: "Settings saved successfully!" });
    } catch (error: any) {
        console.error("Save API Key error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}