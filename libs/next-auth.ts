import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import EmailProvider from "next-auth/providers/email";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import config from "@/config";
import connectMongo from "./mongo";

// 💡 调试防御措施 1：如果开发环境下没填 NEXTAUTH_SECRET，自动提供一个 fallback 避免崩溃
const secret = process.env.NEXTAUTH_SECRET || "fallback_secret_for_local_development_only";

// 💡 调试防御措施 2：只有当 GOOGLE_ID 和 GOOGLE_SECRET 存在时才加载 Google Provider 
const providers = [];

if (process.env.GOOGLE_ID && process.env.GOOGLE_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_ID,
      clientSecret: process.env.GOOGLE_SECRET,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.given_name ? profile.given_name : profile.name,
          email: profile.email,
          image: profile.picture,
          createdAt: new Date(),
        };
      },
    })
  );
} else {
  console.warn("⚠️ Warning: GOOGLE_ID or GOOGLE_SECRET is missing. Google Sign-In is disabled.");
}

// 💡 调试防御措施 3：只有在配置了 RESEND_API_KEY 并且 connectMongo 存在时才初始化 Email Provider
if (connectMongo && process.env.RESEND_API_KEY) {
  providers.push(
    EmailProvider({
      server: {
        host: "smtp.resend.com",
        port: 465,
        auth: {
          user: "resend",
          pass: process.env.RESEND_API_KEY,
        },
      },
      from: config.resend.fromNoReply,
    })
  );
} else {
  console.warn("⚠️ Warning: RESEND_API_KEY is missing or connectMongo is disabled. Email Sign-In is disabled.");
}

export const authOptions = {
  secret: secret,
  providers: providers,

  // 💡 调试防御措施 4：只有在 connectMongo 存在时才添加 MongoDB 适配器
  ...(connectMongo ? { adapter: MongoDBAdapter(connectMongo) } : {}),

  callbacks: {
    session: async ({ session, token }: any) => {
      if (session?.user) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt" as const,
  },
  theme: {
    brandColor: config.colors.main,
    logo: `https://${config.domainName}/logoAndName.png`,
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authOptions);