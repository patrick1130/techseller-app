"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function AppSumoRedeem() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [code, setCode] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [feedback, setFeedback] = useState<{ type: "success" | "error" | null; message: string }>({
        type: null,
        message: "",
    });

    const handleRedeem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!code.trim()) return;

        // 未登录拦截
        if (status === "unauthenticated") {
            setFeedback({ type: "error", message: "Please log in first to redeem your code." });
            // 延迟跳转到登录页 (假设你的登录页是 /login 或 api/auth/signin)
            setTimeout(() => router.push("/api/auth/signin?callbackUrl=/appsumo"), 2000);
            return;
        }

        setIsLoading(true);
        setFeedback({ type: null, message: "" });

        try {
            const res = await fetch("/api/redeem", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code }),
            });

            const data = await res.json();

            if (data.success) {
                setFeedback({
                    type: "success",
                    message: `🎉 Success! Upgraded to ${data.data.plan.replace('_', ' ').toUpperCase()} with ${data.data.credits} credits/month.`
                });
                setCode("");
                // 成功后自动跳转到核心工具页 (假设路径为 /dashboard 或 /)
                setTimeout(() => router.push("/"), 3000);
            } else {
                setFeedback({ type: "error", message: data.error || "Failed to redeem code." });
            }
        } catch (error) {
            setFeedback({ type: "error", message: "Network error. Please try again." });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 tracking-tight">
                    Redeem Lifetime Deal
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    Welcome AppSumo Sumo-lings! 🌮 Enter your code below.
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow-xl shadow-gray-200/50 sm:rounded-2xl sm:px-10 border border-gray-100">
                    <form className="space-y-6" onSubmit={handleRedeem}>
                        <div>
                            <label htmlFor="code" className="block text-sm font-medium text-gray-700">
                                Redemption Code
                            </label>
                            <div className="mt-2 relative rounded-md shadow-sm">
                                <input
                                    id="code"
                                    name="code"
                                    type="text"
                                    required
                                    value={code}
                                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                                    placeholder="e.g. TECH-SUMO-XXXX"
                                    className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 uppercase"
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        {feedback.message && (
                            <div
                                className={`p-4 rounded-xl text-sm font-medium ${feedback.type === "success"
                                    ? "bg-green-50 text-green-800 border border-green-200"
                                    : "bg-red-50 text-red-800 border border-red-200"
                                    }`}
                            >
                                {feedback.message}
                            </div>
                        )}

                        <div>
                            <button
                                type="submit"
                                disabled={isLoading || !code.trim()}
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                            >
                                {isLoading ? (
                                    <span className="flex items-center gap-2">
                                        <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Verifying...
                                    </span>
                                ) : (
                                    "Redeem Code"
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}