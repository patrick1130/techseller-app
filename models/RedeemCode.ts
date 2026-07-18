import mongoose from "mongoose";

const redeemCodeSchema = new mongoose.Schema(
    {
        code: {
            type: String,
            required: true,
            unique: true,
            index: true, // 建立索引，保证用户输入兑换码时能瞬间查询到
        },
        tier: {
            type: String,
            enum: ["appsumo_tier1", "appsumo_tier2", "appsumo_tier3"],
            default: "appsumo_tier1",
        },
        isUsed: {
            type: Boolean,
            default: false,
        },
        usedBy: {
            type: String, // 记录是哪个用户的 ID 核销了它
            default: null,
        },
        usedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.models.RedeemCode || mongoose.model("RedeemCode", redeemCodeSchema);