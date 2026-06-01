import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { InfoIcon } from "lucide-react";
import { FetchDataSteps } from "@/components/tutorial/fetch-data-steps";
import { Suspense } from "react";

// 这是定义一个异步函数，名字叫 UserDetails。因为里面要去请求 Supabase，所以需要等网络结果回来，因此要用 async
async function UserDetails() {
  // 创建一个 Supabase 客户端。这个客户端会自动从环境变量中读取 Supabase 的 URL 和匿名密钥
  // await 的意思是“等它创建完成再往下走”（先拿到一个可以跟 Supabase 说话的工具）
  const supabase = await createClient();
  // 向 Supabase 查询当前用户的 claims 信息。这个信息里会包含用户的 ID、邮箱等数据。如果查询失败了（比如用户没有登录），就会有一个 error 对象
  const { data, error } = await supabase.auth.getClaims();

  // 如果有错误，或者 data 不存在或 data 里面没有 claims（为空或未定义）
  if (error || !data?.claims) {
    redirect("/auth/login"); // 就把用户重定向到登录页面，让他们先登录
  }

  // 如果没有错误，并且 data.claims 存在，就把 claims 对象转换成一个格式化的 JSON 字符串，显示在页面上。
  // 后面的 null, 2 是格式化参数，表示缩进 2 个空格，让输出更易读。
  return JSON.stringify(data.claims, null, 2);
}

export default function ProtectedPage() {
  return (
    <div className="flex-1 w-full flex flex-col gap-12">
      <div className="w-full">
        <div className="bg-accent text-sm p-3 px-5 rounded-md text-foreground flex gap-3 items-center">
          <InfoIcon size="16" strokeWidth={2} />
          This is a protected page that you can only see as an authenticated
          user
        </div>
      </div>
      <div className="flex flex-col gap-2 items-start">
        <h2 className="font-bold text-2xl mb-4">Your user details</h2>
        <pre className="text-xs font-mono p-3 rounded border max-h-32 overflow-auto">
          <Suspense>
            <UserDetails />
          </Suspense>
        </pre>
      </div>
      <div>
        <h2 className="font-bold text-2xl mb-4">Next steps</h2>
        <FetchDataSteps />
      </div>
    </div>
  );
}
