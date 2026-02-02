import { GoodsColumn } from '../goods/columns'

// 課税区分の定義
export const TAX_CATEGORIES = {
  STANDARD: 'STANDARD',
  REDUCED: 'REDUCED',
  TAX_FREE: 'TAX_FREE',
  TAX_EXEMPT: 'TAX_EXEMPT',
  NO_TAX: 'NO_TAX',
} as const
export type TaxCategory = (typeof TAX_CATEGORIES)[keyof typeof TAX_CATEGORIES]

// 課税区分の日本語名
export const TAX_CATEGORY_NAMES = {
  STANDARD: '標準税率（10%）',
  REDUCED: '軽減税率（8%）',
  TAX_FREE: '非課税（0%）',
  TAX_EXEMPT: '免税（0%）',
  NO_TAX: '不課税（0%）',
} as const

// 数量単位の定義
export const QUANTITY_UNITS = {
  Piece: '個',
  Kilogram: 'kg',
  Gram: 'g',
  Liter: 'L',
  Milliliter: 'ml',
  Pack: 'パック',
  Bottle: '本',
  Box: '箱',
  Bag: '袋',
} as const
type QuantityUnit = (typeof QUANTITY_UNITS)[keyof typeof QUANTITY_UNITS]

// 価格単位の定義
export const PRICE_UNITS = {
  Yen: '円',
  Dollar: '$',
  Euro: '€',
  Yuan: '元',
} as const
type PriceUnit = (typeof PRICE_UNITS)[keyof typeof PRICE_UNITS]

// 支払い方法の定義
export const PAYMENT_METHODS = {
  Cash: '現金',
  Credit: 'クレジットカード',
  Debit: 'デビットカード',
  Electronic: '電子マネー',
  QRCode: 'QRコード決済',
  Other: 'その他',
} as const
type PaymentMethod = (typeof PAYMENT_METHODS)[keyof typeof PAYMENT_METHODS]

// 値引き種類の定義
export const DISCOUNT_TYPES = {
  PERCENTAGE: 'PERCENTAGE',
  FIXED: 'FIXED',
} as const
export type DiscountType = (typeof DISCOUNT_TYPES)[keyof typeof DISCOUNT_TYPES]

// 値引き種類の日本語名
export const DISCOUNT_TYPE_NAMES = {
  PERCENTAGE: '割引率(%)',
  FIXED: '固定額',
} as const

// 日本語表示用の定義
export const JPNames = {
  id: 'ID',
  goods: '商品',
  goodsId: '商品ID',
  store: '店舗',
  storeId: '店舗ID',
  quantity: '数量',
  quantityUnit: '数量単位',
  unitPrice: '単価',
  totalPrice: '合計金額',
  priceUnit: '価格単位',
  purchaseDate: '購入日',
  description: 'メモ',
  paymentMethod: '支払い方法',
  taxRate: '課税区分',
  taxAmount: '税額',
  isTaxIncluded: '税込/税抜',
  discountType: '値引き種類',
  discountRate: '値引き率',
  discountAmount: '値引き額',
  isInStock: '在庫に追加',

  createdAt: '作成日',
  updatedAt: '更新日',
}

// 支出記録データのカラム定義
export class PurchasementColumn {
  id: number = 0
  goodsId: number | null = null
  goods: GoodsColumn | null = null
  storeId: number | null = null
  store: { id: number; storeName: string } | null = null
  quantity: number = 0
  quantityUnit: QuantityUnit = QUANTITY_UNITS.Piece
  unitPrice: number = 0
  totalPrice: number = 0
  priceUnit: PriceUnit = PRICE_UNITS.Yen
  purchaseDate: Date | null = null
  description: string | null = null
  paymentMethod: PaymentMethod | null = null
  taxRate: TaxCategory | null = null
  taxAmount: number | null = null
  isTaxIncluded: boolean | null = null
  discountType: DiscountType | null = null
  discountRate: number | null = null
  discountAmount: number | null = null
  isInStock: boolean = true
  createdAt: Date = new Date()
  updatedAt: Date = new Date()
}
