import type { InventoryItem } from './types'

/**
 * 在庫状況の判定
 */
export const STOCK_STATUS = {
  OUT_OF_STOCK: 'out_of_stock', // 在庫切れ
  LOW_STOCK: 'low_stock', // 低在庫
  IN_STOCK: 'in_stock', // 在庫あり
} as const
export type StockStatus = (typeof STOCK_STATUS)[keyof typeof STOCK_STATUS]

/**
 * 在庫状況の日本語名
 */
export const STOCK_STATUS_NAMES = {
  out_of_stock: '在庫切れ',
  low_stock: '低在庫',
  in_stock: '在庫あり',
} as const

/**
 * 在庫状況の色
 */
export const STOCK_STATUS_COLORS = {
  out_of_stock: 'error', // 赤
  low_stock: 'warning', // 黄色
  in_stock: 'success', // 緑
} as const

/**
 * 在庫状況を判定する関数
 * @param availableQuantity 利用可能な数量
 * @param threshold 低在庫のしきい値（デフォルト: 10）
 */
export function getStockStatus(availableQuantity: number, threshold = 10): StockStatus {
  if (availableQuantity <= 0) return STOCK_STATUS.OUT_OF_STOCK
  if (availableQuantity < threshold) return STOCK_STATUS.LOW_STOCK
  return STOCK_STATUS.IN_STOCK
}

/**
 * 日付をフォーマットする関数
 */
export function formatDate(date: Date | null): string {
  if (!date) return '-'
  const d = new Date(date)
  return d.toLocaleDateString('ja-JP')
}

/**
 * 在庫テーブルのカラム定義
 */
export interface InventoryColumn extends InventoryItem {
  stockStatus?: StockStatus
}

/**
 * 日本語表示用の定義
 */
export const JPNames = {
  purchasementId: '購入記録ID',
  goodsId: '商品ID',
  goodsName: '商品名',
  goodsType: '商品タイプ',
  category: 'カテゴリー',
  brand: 'ブランド',
  storeId: '店舗ID',
  storeName: '店舗名',
  purchasedQuantity: '購入数量',
  consumedQuantity: '使用数量',
  availableQuantity: '利用可能数',
  quantityUnit: '単位',
  purchaseDate: '購入日',
  lastConsumptionDate: '最終使用日',
  stockStatus: '在庫状況',
  usageCount: '使用可能回数',
} as const

/**
 * テーブルに表示するデータを整形する関数
 */
export function formatInventoryForTable(item: InventoryItem): InventoryColumn {
  return {
    ...item,
    stockStatus: getStockStatus(item.availableQuantity),
  }
}

/**
 * 在庫データをテーブル用にフォーマットする
 */
export function formatInventoryList(items: InventoryItem[]): InventoryColumn[] {
  return items.map(formatInventoryForTable)
}
