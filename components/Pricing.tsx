import React from "react";

const pricingPlans = [
  {
    id: "free",
    name: "Free Tier",
    description: "体验版 - 适合偶尔上新的独立小卖家，零成本试错。",
    price: "0",
    priceSuffix: "/ forever",
    features: [
      "每月 5 次 AI 生成额度",
      "基础电商痛点文案生成",
      "基础 LLM 模型支持",
      "社区支持",
    ],
    ctaText: "免费体验",
    ctaLink: "/dashboard",
    isPopular: false,
  },
  {
    id: "pro",
    name: "Pro Plan",
    description: "专业版 - 适合频繁测品、大量上架的专业跨境卖家。",
    price: "29",
    priceSuffix: "/ month",
    features: [
      "每月 100 次高阶生成额度",
      "解锁 Amazon/Shopify 专属高转化模板",
      "一键 SEO 关键词优化嵌入",
      "优先 24/7 客户支持",
    ],
    ctaText: "升级专业版",
    ctaLink: "/api/stripe/checkout?plan=pro", // 预留给后续 Stripe 对接的路由
    isPopular: true,
  },
  {
    id: "brand",
    name: "Brand Plus",
    description: "企业版 - 适合有独立品牌心智构建需求的大型团队。",
    price: "99",
    priceSuffix: "/ month",
    features: [
      "无限量生成额度",
      "底层调度多模型 API (保障极高逻辑性)",
      "自定义品牌声调 (Brand Voice)",
      "多语言本地化深度映射",
    ],
    ctaText: "联系销售",
    ctaLink: "/contact",
    isPopular: false,
  },
];

const Pricing = () => {
  return (
    <section className="bg-base-200 py-24" id="pricing">
      <div className="max-w-7xl mx-auto px-8 text-center">
        {/* 标题区域 */}
        <div className="max-w-2xl mx-auto mb-16">
          <h2 className="text-base font-semibold tracking-wide uppercase text-primary mb-2">
            Pricing
          </h2>
          <h3 className="text-3xl font-extrabold tracking-tight text-base-content sm:text-4xl mb-4">
            Start transforming your conversions today
          </h3>
          <p className="text-lg text-base-content/70">
            选择最适合你当前业务阶段的引擎。随时可以升级或取消。
          </p>
        </div>

        {/* 定价卡片网格 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {pricingPlans.map((plan) => (
            <div
              key={plan.id}
              className={`relative flex flex-col p-8 rounded-3xl bg-base-100 border text-left ${plan.isPopular
                  ? "border-primary shadow-2xl ring-2 ring-primary scale-105 z-10 hidden lg:flex" // 桌面端放大高亮
                  : "border-base-300 shadow-sm"
                } ${plan.isPopular ? "lg:scale-105" : ""}`}
            >
              {/* 高亮徽章 */}
              {plan.isPopular && (
                <div className="absolute top-0 right-6 -translate-y-1/2">
                  <span className="bg-primary text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h4 className="text-2xl font-bold text-base-content">{plan.name}</h4>
                <p className="text-sm text-base-content/60 mt-2 min-h-[40px]">
                  {plan.description}
                </p>
              </div>

              <div className="mb-6">
                <span className="text-5xl font-extrabold text-base-content">${plan.price}</span>
                <span className="text-base text-base-content/60 font-medium ml-1">
                  {plan.priceSuffix}
                </span>
              </div>

              {/* 特权列表 */}
              <ul className="space-y-4 mb-8 flex-1">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <svg
                      className={`w-5 h-5 shrink-0 ${plan.isPopular ? "text-primary" : "text-base-content/50"}`}
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-base-content/80 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* 底部按钮 */}
              <a
                href={plan.ctaLink}
                className={`btn btn-block rounded-xl font-bold ${plan.isPopular
                    ? "btn-primary hover:scale-105 transition-transform"
                    : "btn-outline border-base-300 hover:bg-base-200 hover:border-base-300 hover:text-base-content"
                  }`}
              >
                {plan.ctaText}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;