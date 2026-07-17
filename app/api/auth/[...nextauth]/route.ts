//import { handlers } from "@/libs/next-auth";

//export const { GET, POST } = handlers;


// app/api/auth/[...nextauth]/route.ts
import { handlers } from "@/libs/next-auth";

// 确保正确解构出 GET 和 POST 并导出
export const { GET, POST } = handlers;