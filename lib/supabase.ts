import { createBrowserClient } from '@supabase/ssr'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
)

export default supabase

export type Book = {
  id?: string;
  name: string;
  author: string;
  introduction: string;
  count: number;
};

// 增加一个新的书籍
export const createBook = async (book: Book) => {
  const { data, error } = await supabase.from('books').insert(book)
  if (error) {
    console.error(error)
    throw error
  }
  return data
}

// 获取所有书籍
export const getBooks = async () => {
  const { data: books, error } = await supabase.from('books').select()
  if (error) {
    console.error(error)
    throw error
  }
  return books
}

// 更新书籍信息
export const updateBook = async (book: Book) => {
  const { error } = await supabase.from('books').update(book).eq('id', book.id)
  if (error) {
    console.error(error)
    throw error
  }
  return book
}

// 删除书籍
export const deleteBook = async (id: string) => {
  const { error } = await supabase.from('books').delete().eq('id', id)
  if (error) {
    console.error(error)
    throw error
  }
  return id
}

// 文件上传
export const uploadFile = async (file: File) => {
  const { data, error } = await supabase.storage.from('books').upload('public/' + file.name, file)
  if (error) {
    console.error(error)
    throw error
  }
  return data
}

// 获取文件的公共 URL
export const getFileUrl = async (path: string) => {
  const { data } = await supabase.storage.from('books').getPublicUrl(path)
  return data.publicUrl
}