// 日本語表示用の定義
export const JPNames = {
  id: 'ID',
  brandName: 'ブランド名',
  description: '説明',
  country: '国',
  website: 'ウェブサイト',
}

// ブランドデータのカラム定義
export class BrandColumn {
  id: number = 0
  brandName: string = ''
  description: string = ''
  country: string = ''
  website: string = ''
}
