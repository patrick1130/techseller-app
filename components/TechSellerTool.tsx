"use client";

import React, { useState, useEffect } from "react";
import apiClient from "@/libs/api"; // 👈 引入我们配置好的超级客户端

export default function TechSellerTool() {
    const [formData, setFormData] = useState({
        productName: "",
        specs: "",
        audience: "Office Workers & Commuters",
        tone: "Professional & Persuasive",
    });

    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [historyList, setHistoryList] = useState<any[]>([]);

    // 1. 初始化拉取历史记录 (使用 apiClient 重构)
    const fetchHistory = async () => {
        try {
            // apiClient 会自动解析 JSON，并处理掉所有的 401/500 错误
            const data = (await apiClient.get("/history")) as any;
            if (data.success) {
                setHistoryList(data.data);
            }
        } catch (err) {
            // 错误已经在 apiClient 拦截器里用 toast 报过了，这里只需静默处理或记录日志
            console.error("Failed to load history:", err);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, []);

    // 2. 生成文案 (使用 apiClient 重构)
    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.productName.trim() || !formData.specs.trim()) {
            alert("Please fill in both Product Name and Core Specs!");
            return;
        }

        setIsLoading(true);
        setResult(null);

        try {
            // apiClient 自动设置 Content-Type，自动 stringify body，代码极简！
            const data = (await apiClient.post("/gpt", formData)) as any;;

            if (data.success) {
                setResult(data.data);
                // 生成成功后，重新拉取最新历史记录
                fetchHistory();
            }
        } catch (err) {
            // 不需要再写 alert，apiClient 已经用漂亮地 Toast 弹出错误了！
            console.error("Generation logic failed", err);
        } finally {
            setIsLoading(false);
        }
    };


    // 点击历史记录卡片：加载历史文案到画布中
    const loadHistoryItem = (item: any) => {
        setFormData({
            productName: item.productName,
            specs: item.specs,
            audience: item.audience,
            tone: item.tone,
        });
        setResult(item.result);
    };

    const renderContent = (content: any) => {
        if (!content) return null;

        if (typeof content === "string") {
            return <p className="text-sm text-base-content/90 whitespace-pre-wrap leading-relaxed">{content}</p>;
        }

        if (Array.isArray(content)) {
            return (
                <ul className="space-y-3">
                    {content.map((item: any, index: number) => (
                        <li key={index} className="text-sm text-base-content/90 leading-relaxed">
                            {typeof item === "string" ? (
                                item
                            ) : (
                                <div className="bg-base-100 p-3 rounded-lg border border-base-300">
                                    <span className="mr-2">{item.emoji || "✨"}</span>
                                    <strong className="text-primary">{item.title || item.question || ""}</strong>
                                    <p className="mt-1 text-base-content/80 text-xs">{item.description || item.answer || JSON.stringify(item)}</p>
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            );
        }

        if (typeof content === "object") {
            return (
                <div className="bg-base-100 p-3 rounded-lg border border-base-300">
                    <span className="mr-2">{content.emoji || "✨"}</span>
                    <strong className="text-primary">{content.title || content.question || ""}</strong>
                    <p className="mt-1 text-base-content/80 text-xs">{content.description || content.answer || JSON.stringify(content)}</p>
                </div>
            );
        }

        return <p>{JSON.stringify(content)}</p>;
    };

    const copyToClipboard = (content: any) => {
        let textToCopy = "";
        if (typeof content === "string") {
            textToCopy = content;
        } else if (Array.isArray(content)) {
            textToCopy = content
                .map((item) => {
                    if (typeof item === "string") return item;
                    return `${item.emoji || "✨"} ${item.title || item.question || ""}\n${item.description || item.answer || ""}`;
                })
                .join("\n\n");
        } else {
            textToCopy = JSON.stringify(content, null, 2);
        }

        navigator.clipboard.writeText(textToCopy);
        alert("Copied to clipboard! 📋");
    };

    return (
        <div className="space-y-8 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* 👈 Left Panel: Input Form */}
                <div className="lg:col-span-5 bg-base-100 p-6 rounded-2xl border border-base-300 shadow-sm h-fit">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-base-content">
                        🛠️ Product Spec Input
                    </h2>
                    <form onSubmit={handleGenerate} className="space-y-5">
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text font-semibold text-base-content/80">Product Name</span>
                            </label>
                            <input
                                type="text"
                                placeholder="e.g. VoltaCharge 140W GaN Charger"
                                className="input input-bordered w-full focus:input-primary"
                                value={formData.productName}
                                onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                            />
                        </div>

                        <div className="form-control">
                            <label className="label">
                                <span className="label-text font-semibold text-base-content/80">Technical Specifications</span>
                            </label>
                            <textarea
                                className="textarea textarea-bordered h-28 focus:textarea-primary"
                                placeholder="e.g. - 140W Max Output&#10;- 2 x USB-C + 1 x USB-A&#10;- 30% smaller than standard charger"
                                value={formData.specs}
                                onChange={(e) => setFormData({ ...formData, specs: e.target.value })}
                            ></textarea>
                        </div>

                        <div className="form-control">
                            <label className="label">
                                <span className="label-text font-semibold text-base-content/80">Target Audience</span>
                            </label>
                            <select
                                className="select select-bordered focus:select-primary"
                                value={formData.audience}
                                onChange={(e) => setFormData({ ...formData, audience: e.target.value })}
                            >
                                <option>Office Workers & Commuters</option>
                                <option>Outdoor Travelers & Campers</option>
                                <option>Hardcore Mobile/PC Gamers</option>
                                <option>Audiophiles & Tech Enthusiasts</option>
                            </select>
                        </div>

                        <div className="form-control">
                            <label className="label">
                                <span className="label-text font-semibold text-base-content/80">Brand Tone of Voice</span>
                            </label>
                            <select
                                className="select select-bordered focus:select-primary"
                                value={formData.tone}
                                onChange={(e) => setFormData({ ...formData, tone: e.target.value })}
                            >
                                <option>Professional & Persuasive (Amazon/Temu Listing Style)</option>
                                <option>Hyped & High-Converting (TikTok/Social Ad Style)</option>
                                <option>Minimalist & Premium (Apple-like Style)</option>
                                <option>Natural & Conversational (Reddit/Forum Review Style)</option>
                            </select>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary w-full shadow-md text-white font-bold"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <span className="loading loading-spinner loading-sm"></span>
                            ) : (
                                "Generate Marketing Assets 🚀"
                            )}
                        </button>
                    </form>
                </div>

                {/* 👉 Right Panel: Output Canvas */}
                <div className="lg:col-span-7 bg-base-100 p-6 rounded-2xl border border-base-300 shadow-sm min-h-[500px] flex flex-col">
                    <h2 className="text-xl font-bold mb-6 text-base-content flex items-center gap-2">
                        ✨ Marketing Asset Board
                    </h2>

                    {!isLoading && !result && (
                        <div className="flex-1 flex flex-col items-center justify-center text-base-content/40 py-12">
                            <svg className="w-16 h-16 mb-4 opacity-30 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                            </svg>
                            <p className="text-sm">Enter specs on the left to activate the 10-year tech selection engine.</p>
                        </div>
                    )}

                    {isLoading && (
                        <div className="flex-1 flex flex-col items-center justify-center py-12 space-y-4">
                            <span className="loading loading-ring loading-lg text-primary"></span>
                            <p className="text-primary font-medium animate-pulse text-sm">Decoding hardware specs & converting...</p>
                        </div>
                    )}

                    {result && !isLoading && (
                        <div className="space-y-6 animate-fadeIn">
                            {/* 1. Hook */}
                            <div className="bg-base-200/50 p-5 rounded-xl border border-base-300 relative group">
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="font-bold text-sm text-primary">📍 Pain-Point Intro (Hook)</h3>
                                    <button onClick={() => copyToClipboard(result.hook)} className="btn btn-xs btn-outline btn-primary opacity-80 lg:opacity-0 group-hover:opacity-100 transition-opacity">Copy</button>
                                </div>
                                {renderContent(result.hook)}
                            </div>

                            {/* 2. Bullets */}
                            <div className="bg-base-200/50 p-5 rounded-xl border border-base-300 relative group">
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="font-bold text-sm text-primary">🎯 Amazon / Temu Listing Style (Bullet Points)</h3>
                                    <button onClick={() => copyToClipboard(result.bullets)} className="btn btn-xs btn-outline btn-primary opacity-80 lg:opacity-0 group-hover:opacity-100 transition-opacity">Copy</button>
                                </div>
                                {renderContent(result.bullets)}
                            </div>

                            {/* 3. FAQ */}
                            <div className="bg-base-200/50 p-5 rounded-xl border border-base-300 relative group">
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="font-bold text-sm text-primary">💬 Conversion-Boosting FAQs</h3>
                                    <button onClick={() => copyToClipboard(result.faq)} className="btn btn-xs btn-outline btn-primary opacity-80 lg:opacity-0 group-hover:opacity-100 transition-opacity">Copy</button>
                                </div>
                                {renderContent(result.faq)}
                            </div>

                            {/* 4. Reddit */}
                            <div className="bg-base-200/50 p-5 rounded-xl border border-base-300 relative group">
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="font-bold text-sm text-primary">🔥 Reddit / Forum Seed Copy (Social Post)</h3>
                                    <button onClick={() => copyToClipboard(result.socialPost)} className="btn btn-xs btn-outline btn-primary opacity-80 lg:opacity-0 group-hover:opacity-100 transition-opacity">Copy</button>
                                </div>
                                {renderContent(result.socialPost)}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* 👇 Bottom Panel: History Records */}
            <div className="bg-base-100 p-6 rounded-2xl border border-base-300 shadow-sm w-full">
                <h2 className="text-xl font-bold mb-4 text-base-content flex items-center gap-2">
                    🕒 History Records ({historyList.length}/30)
                </h2>
                {historyList.length === 0 ? (
                    <p className="text-sm text-base-content/40">No records found. Generated assets will appear here.</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {historyList.map((item) => (
                            <div
                                key={item._id}
                                onClick={() => loadHistoryItem(item)}
                                className="bg-base-200/40 p-4 rounded-xl border border-base-300 hover:border-primary cursor-pointer hover:shadow-sm transition-all group flex flex-col justify-between"
                            >
                                <div>
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-bold text-sm text-base-content line-clamp-1 group-hover:text-primary transition-colors">
                                            {item.productName}
                                        </h3>
                                    </div>
                                    <p className="text-xs text-base-content/60 line-clamp-2 mb-3">
                                        {item.specs}
                                    </p>
                                </div>
                                <div className="flex justify-between items-center text-[10px] text-base-content/40 pt-2 border-t border-base-300/50">
                                    <span>Audience: {item.audience}</span>
                                    <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}