// @ts-ignore
import { getServerSession } from "next-auth"; // 👈 关键点：去掉后面的 /next
import { authOptions } from "@/libs/next-auth";
import { redirect } from "next/navigation";
import connectMongo from "@/libs/mongoose";
import User from "@/models/User";

import ButtonAccount from "@/components/ButtonAccount";
import TechSellerTool from "@/components/TechSellerTool";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  // 1. 获取 Session
  const session = await getServerSession(authOptions as any);

  // 2. 如果根本没登录，踢回首页
  if (!session) {
    redirect("/");
  }

  // 3. 连接数据库查账
  await connectMongo();

  // 【修改这里】先断言 session 为 any，再读取 user.id
  const userId = (session as any).user.id;
  const user = await User.findById(userId);

  // 4. 【核心闸门】如果没有权限，踢回价格页交钱
  if (!user?.hasAccess) {
    redirect("/#pricing");
  }

  // ==========================================
  // 下面正常向他展示高级功能工作台
  // ==========================================

  return (
    <main className="min-h-screen bg-base-200/50 p-4 md:p-8 pb-24">
      {/* 顶层容器限制宽度 */}
      <section className="max-w-7xl mx-auto space-y-6">

        {/* 顶部导航栏 */}
        <div className="flex justify-between items-center bg-base-100 p-4 rounded-2xl border border-base-300 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white font-bold text-xl shadow-md">
              ⚡️
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-black text-base-content leading-none">
                TechSeller AI
              </h1>
              <span className="text-xs text-base-content/50 font-medium">High-converting marketing engine for 3C electronics</span>
            </div>
          </div>

          <ButtonAccount />
        </div>

        {/* 核心工作区组件 */}
        <TechSellerTool />

      </section>
    </main>
  );
}