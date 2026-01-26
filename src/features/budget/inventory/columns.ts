import { PurchasementColumn } from '../purchasement/columns'
import { GoodsColumn } from '../goods/columns'

export class InventoryColumn {
  id: number | null = null
  goods!: GoodsColumn
  purchasement!: PurchasementColumn
  remainingQuantity: number = 0
  quantityUnit: string = ''

  createdAt: Date = new Date()
  updatedAt: Date = new Date()
}

export interface GoodsInventory {
  goods: GoodsColumn
  inventories: InventoryColumn[]
}

export interface InventoryStats {
  inStockCount: number
  outOfStockCount: number
}

/**
 * 在庫状況の判定
 */
export const STOCK_STATUS = {
  OUT_OF_STOCK: 'out_of_stock', // 在庫切れ
  IN_STOCK: 'in_stock', // 在庫あり
} as const
export type StockStatus = (typeof STOCK_STATUS)[keyof typeof STOCK_STATUS]

/**
 * 在庫状況の日本語名
 */
export const STOCK_STATUS_NAMES = {
  out_of_stock: '在庫切れ',
  in_stock: '在庫あり',
} as const

/**
 * 在庫状況の色
 */
export const STOCK_STATUS_COLORS = {
  out_of_stock: 'error', // 赤
  in_stock: 'success', // 緑
} as const

/**
 * 在庫状況を判定する関数
 * @param availableQuantity 利用可能な数量
 * @param threshold 低在庫のしきい値（デフォルト: 10）
 */
export function getStockStatus(availableQuantity: number): StockStatus {
  if (availableQuantity <= 0) return STOCK_STATUS.OUT_OF_STOCK
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
 * 日本語表示用の定義
 */
export const JPNames = {
  purchasementId: '支出記録ID',
  goodsId: '商品ID',
  remainingQuantity: '利用可能数',
  quantityUnit: '単位',
  stockStatus: '在庫状況',
} as const
