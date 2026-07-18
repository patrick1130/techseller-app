import React from "react";
import config from "@/config";
import ButtonCheckout from "./ButtonCheckout";

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

        {/* Pricing Cards Grid - 改为三列布局以适应 config 中的三个套餐 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {config.stripe.plans.map((plan) => (
            <div
              key={plan.priceId || plan.name}
              className={`relative flex flex-col p-8 rounded-3xl bg-base-100 border text-left ${plan.isFeatured
                ? "border-primary shadow-2xl ring-2 ring-primary scale-105 z-10"
                : "border-base-300 shadow-sm"
                }`}
            >
              {/* Highlight Badge */}
              {plan.isFeatured && (
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

              <div className="mb-6 flex flex-col justify-center">
                <div className="flex items-baseline">
                  <span className="text-5xl font-extrabold text-base-content">${plan.price}</span>
                  <span className="text-base text-base-content/60 font-medium ml-1">
                    {plan.price === 0 ? "/ forever" : plan.name === "Lifetime Deal" ? "/ once" : "/ month"}
                  </span>
                </div>
                {/* 如果配置了原价 (priceAnchor)，则显示划线价格打折效果 */}
                {plan.priceAnchor && (
                  <div className="mt-1 text-sm text-base-content/40 line-through">
                    ${plan.priceAnchor}
                  </div>
                )}
              </div>

              {/* Features List */}
              <ul className="space-y-4 mb-8 flex-1">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <svg
                      className={`w-5 h-5 shrink-0 ${plan.isFeatured ? "text-primary" : "text-base-content/50"
                        }`}
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-base-content/80 text-sm">{feature.name}</span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <div className="mt-auto">
                {plan.price === 0 ? (
                  <a
                    href={config.auth.loginUrl}
                    className={`btn btn-block rounded-xl font-bold ${plan.isFeatured
                      ? "btn-primary hover:scale-105 transition-transform"
                      : "btn-outline border-base-300 hover:bg-base-200 hover:border-base-300 hover:text-base-content"
                      }`}
                  >
                    Start For Free
                  </a>
                ) : (
                  <ButtonCheckout
                    priceId={plan.priceId}
                    mode={plan.name === "Lifetime Deal" ? "payment" : "subscription"}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;