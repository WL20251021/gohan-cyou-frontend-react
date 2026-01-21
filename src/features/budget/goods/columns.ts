import { CategoryColumn } from '../category/columns'
import { BrandColumn } from '../brand/columns'

// 日本語表示用の定義
export const JPNames = {
  id: 'ID',
  goodsName: '商品名',
  category: 'カテゴリー',
  categoryId: 'カテゴリーID',
  brand: 'ブランド',
  brandId: 'ブランドID',
  imageName: '商品画像',
  memo: 'メモ',
}

// 商品データのカラム定義
export class GoodsColumn {
  id: number = 0
  goodsName: string = ''
  categoryId: number | null = null
  category: CategoryColumn | null = null
  brandId: number | null = null
  brand: BrandColumn | null = null
  imageName: string | null = null
  memo: string | null = null
}
