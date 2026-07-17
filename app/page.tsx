import Link from "next/link";
import ButtonSignin from "@/components/ButtonSignin";
import Pricing from "@/components/Pricing";

export default function Page() {
  return (
    <>
      {/* 顶部导航区域 */}
      <header className="p-4 flex justify-end max-w-7xl mx-auto w-full">
        <ButtonSignin text="Login" />
      </header>

      <main>
        {/* 英雄区域 (Hero Section) */}
        <section className="flex flex-col items-center justify-center text-center gap-12 px-8 py-24 min-h-[70vh]">
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight">
            10x Your E-commerce Conversions ⚡️
          </h1>

          <p className="text-lg md:text-xl opacity-80 max-w-2xl">
            Transform cold technical specs into highly persuasive Amazon, Shopify, and Reddit marketing copy in seconds using our GaN-powered AI engine.
          </p>

          <Link href="/dashboard" className="btn btn-primary btn-wide shadow-lg hover:scale-105 transition-transform">
            Try TechSeller Free
          </Link>
        </section>

        {/* 🚀 收银台/定价表区域 */}
        <section id="pricing" className="scroll-mt-16">
          <Pricing />
        </section>
      </main>
    </>
  );
}