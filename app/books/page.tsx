'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SubmitButton } from '@/components/submit-button'
import { useEffect, useState } from 'react'
import supabase, { Book, createBook, getBooks, updateBook, deleteBook } from '@/lib/supabase'

export default function Page() {
    const [books, setBooks] = useState<Book[]>([])
    const [newBook, setNewBook] = useState<Book>({
        name: '', author: '', introduction: '', count: 0
    })

    const fetchBooks = async () => {
        const data = await getBooks()
        setBooks(data || [])
    }

    // 正确的生命周期管理：将副作用和事件订阅全部收拢到 useEffect 中
    useEffect(() => {
        // 1. 页面挂载时先拉取一次初始数据
        fetchBooks()

        // 2. 建立实时长连接通道（仅在组件挂载时执行一次）
        const channelA = supabase
            .channel('schema-db-changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'books' },
                (payload) => {
                    console.log('数据库发生实时变动:', payload)
                    // 只要数据库变了（别人改了或自己改了），就自动刷新列表
                    fetchBooks() 
                }
            )
            .subscribe()

        // 3. 返回析构清理函数：当页面销毁或重载时，切断 WebSocket 连接，释放内存
        return () => {
            supabase.removeChannel(channelA)
        }
    }, []) // 空数组代表仅在组件 Mount 和 Unmount 时执行

    return (
        <div className="p-6">
            {/* 顶部的输入表单 */}
            <div className="mb-8 flex items-end gap-4 max-w-3xl">
                <div className="flex flex-col w-1/4 gap-2 min-w-32">
                    <Label htmlFor="name">书名</Label>
                    <Input name="name" id="name" required value={newBook.name} onChange={(e) => setNewBook({ ...newBook, name: e.target.value })} />
                </div>
                <div className="flex flex-col w-1/4 gap-2 min-w-32">
                    <Label htmlFor="author">作者</Label>
                    <Input name="author" id="author" required value={newBook.author} onChange={(e) => setNewBook({ ...newBook, author: e.target.value })} />
                </div>
                <div className="flex flex-col w-2/4 gap-2 min-w-40">
                    <Label htmlFor="introduction">简介</Label>
                    <Input name="introduction" id="introduction" required value={newBook.introduction} onChange={(e) => setNewBook({ ...newBook, introduction: e.target.value })} />
                </div>
                <div className="flex flex-col w-1/4 gap-2 min-w-32">
                    <Label htmlFor="count">数量</Label>
                    <Input name="count" id="count" type="number" required value={newBook.count} onChange={(e) => setNewBook({ ...newBook, count: parseInt(e.target.value) || 0 })} />
                </div>
                <SubmitButton
                    pendingText="创建中..."
                    type="submit"
                    onClick={async () => {
                        await createBook(newBook)
                        setNewBook({ name: '', author: '', introduction: '', count: 0 })
                    }}>
                    创建书籍
                </SubmitButton>
            </div>

            {/* 列表渲染 */}
            {books?.map((book) => (
                <BookItem key={book.id} book={book} />
            ))}
        </div>
    )
}

// 子组件抽离：全面靠长连接自动同步，不需要再向下传递 fetchBooks
function BookItem({ book }: { book: Book }) {
    return (
        <div className="rounded-xl border border-zinc-200 bg-white dark:bg-zinc-900 p-4 mb-3 shadow-sm">
            <div className="flex items-center gap-6">
                <div className="w-[8em] truncate font-bold">{book.name}</div>
                <div className="w-[6em] truncate">{book.author}</div>
                <div className="flex-1 truncate">{book.introduction}</div>
                <div className="w-[6em]">{book.count}</div>
                <button
                    className="px-3 py-1 text-xs rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                    onClick={() => updateBook({ ...book, count: Math.max(0, book.count - 1) })}
                >借阅</button>
                <button
                    className="px-3 py-1 text-xs rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                    onClick={() => deleteBook(book.id!)}
                >删除</button>
            </div>
        </div>
    )
}