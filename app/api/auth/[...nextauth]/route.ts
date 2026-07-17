import NextAuth from "next-auth";
import { authOptions } from "@/libs/next-auth";

// 同样使用 as any 绕过可能存在的类型定义版本冲突
const handler = NextAuth(authOptions as any);

export { handler as GET, handler as POST };