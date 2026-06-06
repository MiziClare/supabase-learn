'use client'

import { getFileUrl, uploadFile } from '@/lib/supabase'
import React, { useState } from 'react'


function Page() {
  const [file, setFile] = useState<File | null>(null) // 存储本地文件二进制句柄
  const [uploadedPath, setUploadedPath] = useState<string | null>(null) // 存储云端存储路径。文件上传成功后，Supabase 会返回一个路径字符串（例如 public/photo.jpg）
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null) // 存储最终的可访问 URL。用于给浏览器下载

  // 选择文件
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]) // 捕获本地文件对象。从浏览器的 DOM 事件树（e.target.files）中拿到第 0 个文件（即用户选中的那个文件），把它塞进内存变量 file 暂存
    }
  }

  // 上传文件到云端
  const handleUpload = async () => {
    if (!file) return
    const result = await uploadFile(file) // 调用 lib/supabase.ts 中封装的 uploadFile 函数，传入本地文件对象，上传到 Supabase 的云端存储空间。这个函数会返回一个包含文件路径的对象（例如 { path: 'public/photo.jpg' }）
    if (!result) {
      console.error('上传失败',result)
      return
    }
    if (result && result.path) {
      setUploadedPath(result.path) // 记录云端路径，暂存到 uploadedPath 变量
      setDownloadUrl(null) // 每次上传新文件时，重置下载链接，直到用户点击下载按钮才生成新的下载链接
    }
  }

  // 获取下载链接
  const handleDownload = async () => {
    if (!uploadedPath) return
    console.log('uploadedPath', uploadedPath)
    const url = await getFileUrl(uploadedPath) // 调用 lib/supabase.ts 中封装的 getFileUrl 函数，传入云端路径，获取这个文件的公共访问 URL（例如 https://ffymxajwtwgihaovcbsa.supabase.co/storage/v1/object/public/books/public/rainworld.giflic/photo.jpg）。这个 URL 是公开可访问的，可以直接在浏览器打开或下载
    console.log('url', url)
    setDownloadUrl(url) // 把获取到的下载链接暂存到 downloadUrl 变量
  }

  return (
    <div style={{ maxWidth: 400, margin: '40px auto', padding: 24, border: '1px solid #eee', borderRadius: 8 }}>
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleUpload} disabled={!file} style={{ marginLeft: 8 }}>上传</button>
      {uploadedPath && (
        <div style={{ marginTop: 16 }}>
          <div>文件名: {file?.name}</div>
          <button onClick={handleDownload} style={{ marginTop: 8 }}>下载</button>
        </div>
      )}
      {downloadUrl && (
        <div style={{ marginTop: 16 }}>
          <a href={downloadUrl} target="_blank" rel="noopener noreferrer">点击下载</a>
        </div>
      )}
    </div>
  )
}

export default Page