import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { hasEnvVars } from "../utils";

/**
 * Next.js 的中间件（Middleware）层代码。它的核心职责是拦截每一个进入服务器的 HTTP 请求，完成两件事：
 * 1. 安全校验（鉴权）：检查用户是否登录，没登录就重定向到登录页。
 * 2. Session 刷新：在请求生命周期的最早阶段，自动刷新即将过期的 Token，并无缝同步给请求对象和响应对象。
 */

// request: 传入的 HTTP 请求对象，包含了浏览器发来的 Headers、Cookies、URL 等
export async function updateSession(request: NextRequest) {

  // 初始化一个“放行”的响应对象。这意味着“如果没有特殊情况，服务器将正常处理该请求并返回页面”
  let supabaseResponse = NextResponse.next({
    request,
  });

  // If the env vars are not set, skip proxy check. You can remove this
  // once you setup the project.
  // 前置守卫。如果检测到没有配置 Supabase 的环境变量，直接放行请求，不进行后续的鉴权和会话刷新逻辑（因为没有 Supabase 客户端可用）。这主要是为了开发阶段的便利，避免环境变量未配置时导致错误。
  if (!hasEnvVars) {
    return supabaseResponse;
  }

  // With Fluid compute, don't put this client in a global environment
  // variable. Always create a new one on each request.
  // 双向 Cookie 同步：创建一个新的 Supabase 客户端实例。介于浏览器和真实服务器路由之间。
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // 同步给当前请求，让后续的服务器业务代码有有效的 Token
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          // 重建响应对象：带着已经更新了 Cookie 的新 request 重建响应管道
          supabaseResponse = NextResponse.next({
            request,
          });
          // 同步给浏览器响应，更新它本地持久化存储的 Cookie，确保用户下一次点击刷新时带过来的是新 Token
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Do not run code between createServerClient and
  // supabase.auth.getClaims(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: If you remove getClaims() and you use server-side rendering
  // with the Supabase client, your users may be randomly logged out.
  const { data } = await supabase.auth.getClaims(); 
  const user = data?.claims;

  if (
    request.nextUrl.pathname !== "/" && // 不是首页
    !user && // 用户未登录
    !request.nextUrl.pathname.startsWith("/login") && // 当前不在登录页
    !request.nextUrl.pathname.startsWith("/auth")  // 当前不在认证回调路由 
  ) {
    // no user, potentially respond by redirecting the user to the login page
    const url = request.nextUrl.clone(); // 克隆当前请求的 URL 对象，以便修改路径
    url.pathname = "/auth/login"; // 修改路径为登录页
    return NextResponse.redirect(url); // 返回一个重定向响应，浏览器会导航到登录页
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse;
}
