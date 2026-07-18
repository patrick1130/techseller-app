"use client";

import React, { useState, useEffect } from "react";

export default function SettingsPage() {
    const [useOwnApiKey, setUseOwnApiKey] = useState(false);
    const [apiKey, setApiKey] = useState("");
    const [planType, setPlanType] = useState("free");
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [toast, setToast] = useState({ show: false, message: "", type: "" });

    // 页面加载时拉取现有设置
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch("/api/user/api-key");
                const data = await res.json();

                if (data.success) {
                    setUseOwnApiKey(data.useOwnApiKey);
                    setApiKey(data.maskedApiKey); // 这里展示的是掩码，如 sk-...12ab
                    setPlanType(data.planType);
                }
            } catch (error) {
                console.error("Failed to load settings:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSettings();
    }, []);

    const showToast = (message: string, type: "success" | "error") => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            const res = await fetch("/api/user/api-key", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ apiKey, useOwnApiKey }),
            });

            const data = await res.json();

            if (res.ok && data.success) {
                showToast("Settings saved successfully! 🚀", "success");
            } else {
                showToast(data.error || "Failed to save settings.", "error");
            }
        } catch (error) {
            showToast("Network error. Please try again.", "error");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <span className="loading loading-spinner loading-lg text-primary"></span>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-base-200/50 p-4 md:p-8 pb-24">
            <section className="max-w-3xl mx-auto space-y-6">

                {/* 标题区 */}
                <div className="mb-8">
                    <h1 className="text-3xl font-extrabold text-base-content tracking-tight">
                        Advanced Settings ⚙️
                    </h1>
                    <p className="text-base-content/60 mt-2">
                        Manage your account limits and API keys.
                    </p>
                </div>

                {/* 个人 API Key 卡片 */}
                <div className="bg-base-100 p-8 rounded-[24px] border border-base-200/60 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-xl font-bold text-base-content flex items-center gap-2">
                                Bring Your Own Key (BYOK)
                                {planType === "lifetime" && (
                                    <span className="badge badge-primary badge-sm">LTD Unlocked</span>
                                )}
                            </h2>
                            <p className="text-sm text-base-content/60 mt-1 max-w-lg">
                                Bypass all monthly generation limits by using your own OpenAI API key. Your key is stored securely and never shared.
                            </p>
                        </div>
                        <div className="bg-primary/10 p-3 rounded-2xl text-primary text-2xl">
                            🔑
                        </div>
                    </div>

                    <form onSubmit={handleSave} className="space-y-6">

                        {/* 开关 Toggle */}
                        <div className="form-control">
                            <label className="label cursor-pointer justify-start gap-4 p-0">
                                <input
                                    type="checkbox"
                                    className="toggle toggle-primary"
                                    checked={useOwnApiKey}
                                    onChange={(e) => setUseOwnApiKey(e.target.checked)}
                                />
                                <span className="label-text font-medium text-base-content">
                                    Enable Unlimited Mode (Use my own Key)
                                </span>
                            </label>
                        </div>

                        {/* 输入框 */}
                        <div className={`transition-all duration-300 overflow-hidden ${useOwnApiKey ? 'max-h-32 opacity-100' : 'max-h-0 opacity-0'}`}>
                            <div className="form-control">
                                <label className="label mb-1 p-0">
                                    <span className="label-text font-medium text-base-content/70 tracking-wide text-xs uppercase">
                                        OpenAI API Key
                                    </span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="sk-..."
                                    className="input input-bordered w-full bg-base-100 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-200"
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                    required={useOwnApiKey}
                                />
                                <label className="label p-0 mt-1">
                                    <span className="label-text-alt text-base-content/40">
                                        Get your API key from the <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" className="underline hover:text-primary">OpenAI Dashboard</a>.
                                    </span>
                                </label>
                            </div>
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="btn btn-primary px-8 rounded-xl border-none shadow-[0_4px_12px_transparent] hover:shadow-primary/40 hover:-translate-y-0.5 transition-all duration-300 text-white font-bold"
                            >
                                {isSaving ? (
                                    <span className="loading loading-spinner loading-sm"></span>
                                ) : (
                                    "Save Settings"
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </section>

            {/* Toast 提示通知 */}
            {toast.show && (
                <div className="toast toast-top toast-center mt-4 z-50 animate-fadeIn">
                    <div className={`alert ${toast.type === "success" ? "alert-success text-white" : "alert-error text-white"} shadow-lg rounded-xl`}>
                        <span>{toast.message}</span>
                    </div>
                </div>
            )}
        </main>
    );
}