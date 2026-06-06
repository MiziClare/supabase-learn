"use client"; // Next.js 的特殊指令。它告诉编译器，这个组件需要在浏览器端（客户端）执行，因为人类的交互（点击）和浏览器的状态（useFormStatus）只能在客户端处理。

import { Button } from "@/components/ui/button"; // 导入了一个基础的按钮 UI 组件
import { type ComponentProps } from "react"; // 从 React 的类型定义中导入 ComponentProps，这个工具类型可以帮助我们提取 Button 组件的所有属性类型，以便我们在定义 SubmitButton 的 Props 时能够继承 Button 的所有属性，同时还可以添加我们自己的属性（比如 pendingText）。这样做的好处是，SubmitButton 可以完全兼容 Button 的所有功能和样式，同时还增加了一个新的功能。
import { useFormStatus } from "react-dom"; // 从 react-dom 导入 useFormStatus 这个 Hook，它可以让我们知道当前表单的提交状态（pending）。当用户点击 SubmitButton 时，表单会进入提交状态，这时 pending 会变为 true，我们就可以根据这个状态来改变按钮的显示文字和禁用状态。只要这个组件被嵌套在某个 <form> 标签内部，它就能自动读取到该表单的提交状态。

// 通过反射机制，获取基础 Button 组件接收的所有属性类型，并在此基础上添加一个可选的 pendingText 属性，这样 SubmitButton 就可以接受 Button 的所有属性，同时还可以接受一个新的属性来定制提交时的显示文字。
type Props = ComponentProps<typeof Button> & {
  pendingText?: string; // 交叉类型（Intersection Types），相当于类型继承。Props 添加了一个新的可选属性 pendingText
};

export function SubmitButton({
  children, // React 的内置属性，代表夹在组件标签中间的内容（例如 <SubmitButton>保存</SubmitButton>
  pendingText = "Submitting...", // 给可选属性赋默认值。
  ...props // 剩余参数（Rest Parameters），把其余所有传进来的属性（如样式、高度等）打包收集到一个叫 props 的对象里。
}: Props) {
  // 解构出表单的挂起状态。pending 是一个布尔值：true表示表单正在提交中（后端的 Action 函数正在异步执行）
  const { pending } = useFormStatus();

  // 返回一个 Button 组件，类型为 submit，这样当用户点击这个按钮时，所在的表单就会被提交。按钮的 disabled 状态由 pending 决定：如果 pending 是 true，按钮就会被禁用（aria-disabled），并且显示 pendingText；如果 pending 是 false，按钮就会正常显示 children（即用户定义的按钮文本）。
  return (
    <Button type="submit" aria-disabled={pending} {...props}>
      {pending ? pendingText : children}
    </Button>
  );
}