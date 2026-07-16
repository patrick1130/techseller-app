import Link from "next/link";
import ButtonSignin from "@/components/ButtonSignin";
import Pricing from "@/components/Pricing"; // 👈 新增：导入 Pricing 组件

export default function Page() {
  return (
    <>
      <header className="p-4 flex justify-end max-w-7xl mx-auto">
        <ButtonSignin text="Login" />
      </header>
      <main>
        {/* 英雄区域 (Hero Section) */}
        <section className="flex flex-col items-center justify-center text-center gap-12 px-8 py-24">
          <h1 className="text-5xl font-extrabold tracking-tight">
            10x Your E-commerce Conversions ⚡️
          </h1>

          <p className="text-lg opacity-80 max-w-xl">
            Transform cold technical specs into highly persuasive Amazon, Shopify, and Reddit marketing copy in seconds using our GaN-powered AI engine.
          </p>

          <Link href="/dashboard" className="btn btn-primary btn-wide shadow-lg">
            Try TechSeller Free
          </Link>
        </section>

        {/* 🚀 新增：收银台区域 */}
        <section id="pricing">
          <Pricing />
        </section>
      </main>
    </>
  );
}