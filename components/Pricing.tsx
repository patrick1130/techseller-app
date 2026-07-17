import React from "react";

const pricingPlans = [
  {
    id: "free",
    name: "Basic Plan",
    description: "Perfect for independent sellers testing the waters with new products.",
    price: "0",
    priceSuffix: "/ forever",
    features: [
      "5 AI generations per month",
      "Standard e-commerce marketing copy",
      "Base LLM engine access",
      "Community support",
    ],
    ctaText: "Start for Free",
    ctaLink: "/dashboard",
    isPopular: false,
  },
  {
    id: "enterprise",
    name: "Enterprise Plan",
    description: "Built for scaling teams requiring deep brand identity and high-volume operations.",
    price: "99",
    priceSuffix: "/ month",
    features: [
      "Unlimited AI generations",
      "Multi-model API orchestration (DeepSeek & Gemini)",
      "Custom brand voice mapping",
      "Advanced Generative Engine Optimization (GEO)",
    ],
    ctaText: "Upgrade to Enterprise",
    ctaLink: "/api/stripe/checkout?plan=enterprise", // 预留的 Stripe 支付接口
    isPopular: true,
  },
];

const Pricing = () => {
  return (
    <section className="bg-base-200 py-24" id="pricing">
      <div className="max-w-7xl mx-auto px-8 text-center">
        {/* Header */}
        <div className="max-w-2xl mx-auto mb-16">
          <h2 className="text-base font-semibold tracking-wide uppercase text-primary mb-2">
            Pricing
          </h2>
          <h3 className="text-3xl font-extrabold tracking-tight text-base-content sm:text-4xl mb-4">
            Simple, transparent pricing
          </h3>
          <p className="text-lg text-base-content/70">
            Choose the engine that fits your current business stage. No hidden fees.
          </p>
        </div>

        {/* Pricing Cards Grid - 改为两列布局适应双版本 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {pricingPlans.map((plan) => (
            <div
              key={plan.id}
              className={`relative flex flex-col p-8 rounded-3xl bg-base-100 border text-left ${plan.isPopular
                  ? "border-primary shadow-2xl ring-2 ring-primary scale-105 z-10"
                  : "border-base-300 shadow-sm"
                }`}
            >
              {/* Highlight Badge */}
              {plan.isPopular && (
                <div className="absolute top-0 right-6 -translate-y-1/2">
                  <span className="bg-primary text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                    Recommended
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h4 className="text-2xl font-bold text-base-content">{plan.name}</h4>
                <p className="text-sm text-base-content/60 mt-2 min-h-[40px]">
                  {plan.description}
                </p>
              </div>

              <div className="mb-6 flex items-baseline">
                <span className="text-5xl font-extrabold text-base-content">${plan.price}</span>
                <span className="text-base text-base-content/60 font-medium ml-1">
                  {plan.priceSuffix}
                </span>
              </div>

              {/* Features List */}
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

              {/* CTA Button */}
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