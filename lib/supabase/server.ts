import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Especially important if using Fluid compute: Don't put this client in a
 * global variable. Always create a new client within each function when using
 * it.
 * 提示：不要把客户端放在全局变量里；每次请求/函数都应创建新的客户端（避免共享不同请求的会话）。
 */

// createClient() 创建的是服务器端 Supabase 客户端，它通过 next/headers 的 cookieStore 读取浏览器发送的会话 cookie
// 《 Supabase 如何在这个项目用 cookie + JWT 》
// 1. 服务器端建库读取 cookie：客户端通过 next/headers 的 cookies() 读取请求携带的 cookie，然后把这些 cookie 传给 Supabase 的 server client
// 2. 之后 Supabase 就可以存 token 到 cookie: Supabase 的 auth 会把 session（含 access token / refresh token）以 cookie 形式写回浏览器（通常是 HTTP-only cookie），然后后续请求自动带上这些 cookie
// 3. 服务端校验: 当页面在服务端运行（如 UserDetails()），createClient() 会把 cookie 传给 Supabase，调用 supabase.auth.getClaims() 时，Supabase 根据 cookie 中的 token 验证用户并返回 claims。若无 token 或无效，返回空或 error，代码就会 redirect("/auth/login")
// 注：HTTP-only cookie: token 存在 HTTP-only cookie 中，前端脚本无法通过 document.cookie 读取，降低 XSS 泄露风险

// 导出一个异步函数 createClient，供页面或 API 在服务器端创建 Supabase 客户端并把当前请求的 cookie 传入。
// 作用：在每次服务器端渲染或 API 调用时，创建一个 Supabase 客户端，并把当前请求的 cookie（包含 Supabase 的 session token）交给 SDK，让 SDK 能基于这些 cookie 验证用户、读取/刷新会话
export async function createClient() {
  // 调用 Next.js 的 cookies() 获取当前请求/响应上下文的 cookie 存取对象（可以读取该请求携带的所有 cookie）。
  // 即获取【当前这一个请求】的专属 Cookie
  const cookieStore = await cookies();

  // 返回由 @supabase/ssr 提供的服务器端 Supabase 客户端，下面传入配置。
  // 相当于实例化一个可以代表当前登录用户的 Supabase 代理对象
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!, // 把 Supabase 项目的 URL（来自环境变量）传给客户端。! 表示在 TypeScript 上断言该值存在
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, // 把 Supabase 的 publishable 公开 key 传入（用于与浏览器/前端交互的 key）。同样断言存在
    {
      cookies: { // 告诉 createServerClient 使用自定义的 cookie 接口（由 Next 提供的 cookieStore 实现）
        getAll() { // 定义 getAll 方法，Supabase SDK 调用它来读取所有 cookie
          // 实际实现是调用 Next 的 cookieStore.getAll()，返回当前请求的全部 cookie（数组）
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) { // 定义 setAll 方法，Supabase SDK 在需要更新/设置 cookie（比如刷新会话时）会调用它。
          // 尝试用 Next 的接口写回 cookie（比如当 Supabase 刷新 token 后需要更新 cookie）。cookieStore.set() 是 Next 提供的接口，用于设置 cookie。
          try {
            // 遍历要设置的 cookie 列表
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have proxy refreshing
            // user sessions.
          }
        },
      },
    },
  );
}
