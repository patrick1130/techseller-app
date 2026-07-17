// @ts-ignore
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/libs/next-auth";
import { redirect } from "next/navigation";
import connectMongo from "@/libs/mongoose";
import User from "@/models/User";

import ButtonAccount from "@/components/ButtonAccount";
import TechSellerTool from "@/components/TechSellerTool";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  // 1. 获取当前尝试访问页面的用户身份 (Session)
  const session = await getServerSession(authOptions);

  // 2. 如果根本没登录，踢回登录页或者首页
  if (!session) {
    redirect("/");
  }

  // 3. 连接数据库，去查这个人的“账本”
  await connectMongo();
  const user = await User.findById(session.user.id);

  // 4. 【核心闸门】如果数据库里他的 hasAccess 不为 true（没付钱或没解锁权限）
  // 强制把他踢回首页的价格表区域，让他去付钱！
  if (!user?.hasAccess) {
    redirect("/#pricing"); // 这里的路径根据你的定价页路由调整，通常是 /#pricing 或者 /pricing
  }

  // ==========================================
  // 如果代码能顺利走到这里，说明他绝对是尊贵的付费客户！
  // 下面正常向他展示高级功能工作台
  // ==========================================

  return (
    <main className="min-h-screen bg-base-200/50 p-4 md:p-8 pb-24">
      {/* 顶层容器限制宽度 */}
      <section className="max-w-7xl mx-auto space-y-6">

        {/* 顶部导航栏：左边标题，右边是原装的 ButtonAccount 头像菜单 */}
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

          {/* 原装核心组件，包含用户头像与下拉菜单 */}
          <ButtonAccount />
        </div>

        {/* 核心工作区组件 (只有付费用户才能看到) */}
        <TechSellerTool />

      </section>
    </main>
  );
}