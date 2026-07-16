import mongoose, { Schema, model, models } from "mongoose";

// 在开发环境下，强制删除旧的模型缓存，确保最新的 Schema（如 Mixed 类型）能够立即在内存中生效！
if (process.env.NODE_ENV === "development") {
    delete (mongoose.models as any).History;
}

const HistorySchema = new Schema(
    {
        userId: {
            type: String,
            required: true,
            index: true,
        },
        productName: { type: String, required: true },
        specs: { type: String, required: true },
        audience: { type: String, required: true },
        tone: { type: String, required: true },

        // 🛠️ 核心防御：Schema.Types.Mixed 允许保存任意格式的 JSON（无论是 String 还是嵌套的 Array/Object）
        result: {
            type: Schema.Types.Mixed,
            required: true,
        },
    },
    {
        timestamps: true, // 自动生成 createdAt 和 updatedAt
    }
);

const History = models.History || model("History", HistorySchema);

export default History as mongoose.Model<any>;