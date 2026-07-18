import mongoose from "mongoose";

const historySchema = new mongoose.Schema(
    {
        userId: {
            type: String,
            required: true,
            index: true, // 💡 核心优化：为 userId 建立索引，极大地提升用户历史记录的查询速度
        },
        productName: {
            type: String,
            required: true,
        },
        specs: {
            type: String,
            required: true,
        },
        audience: {
            type: String,
            required: true,
        },
        tone: {
            type: String,
            required: true,
        },
        result: {
            type: mongoose.Schema.Types.Mixed, // 允许存储任意层级结构的 JSON 对象
            required: true,
        },
        // 👇 新增扩展字段：为后续的高级功能打下基础
        isFavorite: {
            type: Boolean,
            default: false,
            index: true, // 💡 建立索引：为日后开发“我的收藏”夹功能提供极速查询支持
        },
        tags: {
            type: [String],
            default: [],
            index: true, // 💡 建立多键索引：方便日后实现“按产品线分类”或“按营销场景筛选”的功能
        },
    },
    {
        timestamps: true, // Mongoose 会自动接管并维护 createdAt 和 updatedAt 字段
    }
);

// 防止在 Next.js 热更新 (HMR) 过程中重复编译模型导致报错
export default mongoose.models.History || mongoose.model("History", historySchema);