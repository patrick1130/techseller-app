"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation"; // 👈 新增引入路由
import apiClient from "@/libs/api";

export default function TechSellerTool() {
    const router = useRouter(); // 👈 初始化 router

    const [formData, setFormData] = useState({
        productName: "",
        specs: "",
        audience: "Office Workers & Commuters",
        tone: "Professional & Persuasive",
    });

    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [historyList, setHistoryList] = useState<any[]>([]);

    // ================= [ 💡 新增：额度状态 ] =================
    const [credits, setCredits] = useState<number | null>(null);
    const [planType, setPlanType] = useState<string>("free");

    const canvasRef = useRef<HTMLDivElement>(null);

    // 1. 初始化拉取历史记录 
    const fetchHistory = async () => {
        try {
            const data = (await apiClient.get("/history")) as any;
            if (data.success) {
                setHistoryList(data.data);
            }
        } catch (err) {
            console.error("Failed to load history:", err);
        }
    };

    // ================= [ 💡 新增：拉取当前用户的额度 ] =================
    const fetchCredits = async () => {
        try {
            const res = await fetch("/api/user/credits");
            const data = await res.json();
            if (data.success) {
                setCredits(data.credits);
                setPlanType(data.planType);
            }
        } catch (e) {
            console.error("Failed to fetch credits", e);
        }
    };

    useEffect(() => {
        fetchHistory();
        fetchCredits(); // 页面加载时拉取额度
    }, []);

    // 监听 result 变化，自动平滑滚动到结果面板
    useEffect(() => {
        if (result && canvasRef.current) {
            setTimeout(() => {
                canvasRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
            }, 100);
        }
    }, [result]);

    // 2. 生成文案 
    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();

        if (isLoading) return;

        if (!formData.productName.trim() || !formData.specs.trim()) {
            alert("Please fill in both Product Name and Core Specs!");
            return;
        }

        setIsLoading(true);
        setResult(null);

        try {
            const data = (await apiClient.post("/gpt", formData)) as any;

            if (data.success) {
                setResult(data.data);
                fetchHistory();
                // ================= [ 💡 新增：生成成功后，前端数字自动扣减，体验极致顺滑 ] =================
                setCredits((prev) => (prev !== null ? prev - 1 : null));
            } else {
                // 如果后端返回额度不足等错误，直接弹出警告
                alert(data.error || "Generation failed.");
            }
        } catch (err) {
            console.error("Generation logic failed", err);
        } finally {
            setIsLoading(false);
        }
    };

    // 3. 点击历史记录卡片：加载历史文案到画布中
    const loadHistoryItem = (item: any) => {
        setFormData({
            productName: item.productName,
            specs: item.specs,
            audience: item.audience,
            tone: item.tone,
        });
        setResult(item.result);

        if (canvasRef.current) {
            canvasRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    };

    // 4. 删除单条历史记录
    const handleDeleteHistory = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();

        const isConfirmed = window.confirm("Are you sure you want to delete this record?");
        if (!isConfirmed) return;

        try {
            const data = (await apiClient.delete(`/history?id=${id}`)) as any;
            if (data?.success) {
                setHistoryList((prev) => prev.filter((item) => item._id !== id));
            }
        } catch (err) {
            console.error("Failed to delete history:", err);
        }
    };

    const renderContent = (content: any) => {
        if (!content) return null;

        if (typeof content === "string") {
            return <p className="text-sm text-base-content/90 whitespace-pre-wrap leading-relaxed">{content}</p>;
        }

        const extractTitleAndDesc = (obj: any) => {
            let title = obj.title || obj.question || obj.Q || obj.q || obj.header || obj.ask || "";
            let desc = obj.description || obj.answer || obj.A || obj.a || obj.body || obj.reply || "";

            if (!title && !desc) {
                const values = Object.values(obj);
                if (values.length >= 2) {
                    title = String(values[0]);
                    desc = String(values[1]);
                } else if (values.length === 1) {
                    desc = String(values[0]);
                }
            }
            return { title, desc, emoji: obj.emoji || "✨" };
        };

        if (Array.isArray(content)) {
            return (
                <ul className="space-y-3">
                    {content.map((item: any, index: number) => {
                        if (typeof item === "string") {
                            return <li key={index} className="text-sm text-base-content/90 leading-relaxed">{item}</li>;
                        }

                        const { title, desc, emoji } = extractTitleAndDesc(item);

                        return (
                            <li key={index} className="text-sm text-base-content/90 leading-relaxed">
                                <div className="bg-base-100 p-4 rounded-xl border border-base-200/60 shadow-sm">
                                    <span className="mr-2">{emoji}</span>
                                    {title && <strong className="text-primary">{title}</strong>}
                                    <p className="mt-2 text-base-content/80 text-xs leading-relaxed">
                                        {desc || JSON.stringify(item)}
                                    </p>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            );
        }

        if (typeof content === "object") {
            const { title, desc, emoji } = extractTitleAndDesc(content);
            return (
                <div className="bg-base-100 p-4 rounded-xl border border-base-200/60 shadow-sm">
                    <span className="mr-2">{emoji}</span>
                    {title && <strong className="text-primary">{title}</strong>}
                    <p className="mt-2 text-base-content/80 text-xs leading-relaxed">{desc || JSON.stringify(content)}</p>
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
                <div className="lg:col-span-5 bg-base-100 p-8 rounded-[24px] border border-base-200/60 shadow-sm hover:shadow-md transition-shadow duration-300 h-fit">
                    <h2 className="text-2xl font-extrabold mb-8 flex items-center gap-3 text-base-content tracking-tight">
                        <span className="bg-primary/10 p-2 rounded-xl text-primary">🛠️</span>
                        Product Spec Input
                    </h2>
                    <form onSubmit={handleGenerate} className="space-y-6">
                        <div className="form-control">
                            <label className="label mb-1 p-0">
                                <span className="label-text font-medium text-base-content/70 tracking-wide text-xs uppercase">Product Name</span>
                            </label>
                            <input
                                type="text"
                                placeholder="e.g. VoltaCharge 140W GaN Charger"
                                className="input input-bordered w-full bg-base-100 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-200"
                                value={formData.productName}
                                onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                            />
                        </div>

                        <div className="form-control">
                            <label className="label mb-1 p-0">
                                <span className="label-text font-medium text-base-content/70 tracking-wide text-xs uppercase">Technical Specifications</span>
                            </label>
                            <textarea
                                className="textarea textarea-bordered h-32 w-full bg-base-100 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-200 leading-relaxed"
                                placeholder="e.g. - 140W Max Output&#10;- 2 x USB-C + 1 x USB-A&#10;- 30% smaller than standard charger"
                                value={formData.specs}
                                onChange={(e) => setFormData({ ...formData, specs: e.target.value })}
                            ></textarea>
                        </div>

                        <div className="form-control">
                            <label className="label mb-1 p-0">
                                <span className="label-text font-medium text-base-content/70 tracking-wide text-xs uppercase">Target Audience</span>
                            </label>
                            <select
                                className="select select-bordered w-full bg-base-100 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-200"
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
                            <label className="label mb-1 p-0">
                                <span className="label-text font-medium text-base-content/70 tracking-wide text-xs uppercase">Brand Tone of Voice</span>
                            </label>
                            <select
                                className="select select-bordered w-full bg-base-100 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-200"
                                value={formData.tone}
                                onChange={(e) => setFormData({ ...formData, tone: e.target.value })}
                            >
                                <option>Professional & Persuasive (Amazon/Temu Listing Style)</option>
                                <option>Hyped & High-Converting (TikTok/Social Ad Style)</option>
                                <option>Minimalist & Premium (Apple-like Style)</option>
                                <option>Natural & Conversational (Reddit/Forum Review Style)</option>
                            </select>
                        </div>

                        {/* ================= [ 💡 新增：额度指示器 UI ] ================= */}
                        {credits !== null && (
                            <div className="mt-4 flex items-center justify-between bg-base-100 border border-base-300 rounded-xl p-3 shadow-sm">
                                <div className="flex items-center gap-2">
                                    <span className="text-xl">⚡️</span>
                                    <span className="text-sm font-medium text-base-content">
                                        Credits: <strong className={credits <= 1 ? "text-error" : "text-base-content"}>{credits}</strong>
                                    </span>
                                    {planType === "free" && (
                                        <span className="ml-2 text-xs bg-base-200 text-base-content/70 px-2 py-0.5 rounded-full font-semibold">Free</span>
                                    )}
                                </div>

                                {(credits <= 1 || planType === "free") && (
                                    <button
                                        type="button"
                                        onClick={() => router.push("/#pricing")}
                                        className="text-sm font-bold text-primary hover:text-primary-focus transition-colors"
                                    >
                                        Upgrade 🚀
                                    </button>
                                )}
                            </div>
                        )}
                        {/* ========================================================= */}

                        <button
                            type="submit"
                            // 💡 新增防呆：如果没有额度了，强行禁用按钮，防止白白发起请求
                            disabled={isLoading || (credits !== null && credits <= 0)}
                            className="btn btn-primary w-full mt-2 rounded-xl border-none shadow-[0_4px_12px_transparent] hover:shadow-primary/40 hover:-translate-y-0.5 transition-all duration-300 text-white font-bold text-lg h-14 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <span className="loading loading-spinner loading-md"></span>
                            ) : credits !== null && credits <= 0 ? (
                                "No Credits Left 🚫"
                            ) : (
                                "Generate Marketing Assets 🚀"
                            )}
                        </button>
                    </form>
                </div>

                {/* 👉 Right Panel: Output Canvas */}
                <div
                    ref={canvasRef}
                    className="scroll-mt-8 lg:col-span-7 bg-base-100 p-8 rounded-[24px] border border-base-200/60 shadow-sm hover:shadow-md transition-shadow duration-300 min-h-[500px] flex flex-col"
                >
                    <h2 className="text-2xl font-extrabold mb-8 text-base-content tracking-tight flex items-center gap-3">
                        <span className="bg-primary/10 p-2 rounded-xl text-primary">✨</span>
                        Marketing Asset Board
                    </h2>

                    {!isLoading && !result && (
                        <div className="flex-1 flex flex-col items-center justify-center text-base-content/40 py-12">
                            <svg className="w-16 h-16 mb-4 opacity-30 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                            </svg>
                            <p className="text-sm">Enter specs on the left to activate the tech selection engine.</p>
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
                            <div className="bg-base-200/50 p-6 rounded-xl border border-base-200/60 relative group transition-colors hover:border-base-300">
                                <div className="flex justify-between items-center mb-3">
                                    <h3 className="font-bold text-sm tracking-tight text-primary">📍 Pain-Point Intro (Hook)</h3>
                                    <button onClick={() => copyToClipboard(result.hook)} className="btn btn-xs btn-outline btn-primary opacity-80 lg:opacity-0 group-hover:opacity-100 transition-opacity">Copy</button>
                                </div>
                                {renderContent(result.hook)}
                            </div>

                            {/* 2. Bullets */}
                            <div className="bg-base-200/50 p-6 rounded-xl border border-base-200/60 relative group transition-colors hover:border-base-300">
                                <div className="flex justify-between items-center mb-3">
                                    <h3 className="font-bold text-sm tracking-tight text-primary">🎯 Amazon / Temu Listing Style (Bullet Points)</h3>
                                    <button onClick={() => copyToClipboard(result.bullets)} className="btn btn-xs btn-outline btn-primary opacity-80 lg:opacity-0 group-hover:opacity-100 transition-opacity">Copy</button>
                                </div>
                                {renderContent(result.bullets)}
                            </div>

                            {/* 3. FAQ */}
                            <div className="bg-base-200/50 p-6 rounded-xl border border-base-200/60 relative group transition-colors hover:border-base-300">
                                <div className="flex justify-between items-center mb-3">
                                    <h3 className="font-bold text-sm tracking-tight text-primary">💬 Conversion-Boosting FAQs</h3>
                                    <button onClick={() => copyToClipboard(result.faq)} className="btn btn-xs btn-outline btn-primary opacity-80 lg:opacity-0 group-hover:opacity-100 transition-opacity">Copy</button>
                                </div>
                                {renderContent(result.faq)}
                            </div>

                            {/* 4. Reddit */}
                            <div className="bg-base-200/50 p-6 rounded-xl border border-base-200/60 relative group transition-colors hover:border-base-300">
                                <div className="flex justify-between items-center mb-3">
                                    <h3 className="font-bold text-sm tracking-tight text-primary">🔥 Reddit / Forum Seed Copy (Social Post)</h3>
                                    <button onClick={() => copyToClipboard(result.socialPost)} className="btn btn-xs btn-outline btn-primary opacity-80 lg:opacity-0 group-hover:opacity-100 transition-opacity">Copy</button>
                                </div>
                                {renderContent(result.socialPost)}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* 👇 Bottom Panel: History Records */}
            <div className="bg-base-100 p-8 rounded-[24px] border border-base-200/60 shadow-sm hover:shadow-md transition-shadow duration-300 w-full">
                <h2 className="text-2xl font-extrabold mb-6 text-base-content tracking-tight flex items-center gap-3">
                    <span className="bg-primary/10 p-2 rounded-xl text-primary">🕒</span>
                    History Records ({historyList.length}/30)
                </h2>
                {historyList.length === 0 ? (
                    <p className="text-sm text-base-content/40">No records found. Generated assets will appear here.</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {historyList.map((item) => (
                            <div
                                key={item._id}
                                onClick={() => loadHistoryItem(item)}
                                className="bg-base-200/40 p-5 rounded-xl border border-base-200/60 hover:border-primary/50 cursor-pointer hover:bg-base-200/80 hover:shadow-sm transition-all duration-300 group flex flex-col justify-between"
                            >
                                <div>
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-bold text-sm text-base-content line-clamp-1 group-hover:text-primary transition-colors pr-2">
                                            {item.productName}
                                        </h3>
                                        <button
                                            onClick={(e) => handleDeleteHistory(e, item._id)}
                                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-base-content/30 hover:text-error hover:bg-error/10 rounded-lg shrink-0"
                                            title="Delete record"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                    <p className="text-xs text-base-content/60 line-clamp-2 mb-4 leading-relaxed">
                                        {item.specs}
                                    </p>
                                </div>
                                <div className="flex justify-between items-center text-[10px] text-base-content/40 pt-3 border-t border-base-200/80">
                                    <span className="truncate mr-2">Audience: {item.audience}</span>
                                    <span className="whitespace-nowrap">{new Date(item.createdAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}