import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    // ================= [ 基础信息 (NextAuth 依赖) ] =================
    name: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      private: true,
      required: true,
    },
    image: {
      type: String,
    },

    // ================= [ 核心业务：混合计费与额度系统 ] =================
    // 标记用户的套餐类型，区分白嫖、官网订阅、还是 AppSumo 终身买断
    planType: {
      type: String,
      enum: [
        "free",
        "stripe_monthly",
        "stripe_yearly",
        "appsumo_tier1",
        "appsumo_tier2",
        "appsumo_tier3",
        "lifetime"
      ],
      default: "free",
    },
    // 当前剩余可用生成额度
    credits: {
      type: Number,
      default: 3, // 设定诱饵：新注册的 Free 用户默认拥有 3 次体验机会
    },
    // 该套餐每月的额度上限 (用于每月重置周期到来时，将 credits 恢复到这个值)
    monthlyCreditLimit: {
      type: Number,
      default: 3,
    },
    // 下次额度重置的日期
    creditsResetDate: {
      type: Date,
      // 新用户注册时，重置日期默认设为 30 天后
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },

    // ================= [ Stripe 专用字段 (ShipFast 标准) ] =================
    customerId: {
      type: String,
      validate(value: string) {
        return value.includes("cus_");
      },
    },
    priceId: {
      type: String,
      validate(value: string) {
        return value.includes("price_");
      },
    },
    // 保留 ShipFast 原本的布尔值权限字段，做向下兼容
    hasAccess: {
      type: Boolean,
      default: false,
    },
    apiKey: {
      type: String,
      default: null
    }, // 存储用户的 OpenAI API Key
    useOwnApiKey: {
      type: Boolean,
      default: false
    }, // 用户是否选择使用自己的 Key
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// 避免 Next.js 开启热更新 (HMR) 时导致的模型重复编译错误
export default mongoose.models.User || mongoose.model("User", userSchema);