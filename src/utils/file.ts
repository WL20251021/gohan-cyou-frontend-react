import type { GetProp, UploadProps } from 'antd'

export type FileType = Parameters<GetProp<UploadProps, 'beforeUpload'>>[0]

export function getBase64(file: FileType): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = (error) => reject(error)
  })
}

export function bufferToImage(file: { data: ArrayBuffer }, imageType: string = 'jpeg'): string {
  const blob = new Blob([new Uint8Array(file.data)], { type: 'image/' + imageType })
  return URL.createObjectURL(blob)
}

// 画像URL生成
export function genImageUrl(imageName: string) {
  return `http://${import.meta.env.VITE_HOST}:${import.meta.env.VITE_PORT}/images/${imageName}`
}
