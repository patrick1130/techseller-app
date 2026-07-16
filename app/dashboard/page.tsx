import ButtonAccount from "@/components/ButtonAccount";
import TechSellerTool from "@/components/TechSellerTool"; // 🎯 引入我们的 3C 客户端工作台

export const dynamic = "force-dynamic";

export default async function Dashboard() {
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

        {/* 核心工作区组件 */}
        <TechSellerTool />

      </section>
    </main>
  );
}