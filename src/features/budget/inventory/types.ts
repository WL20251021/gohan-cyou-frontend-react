import { GoodsColumn } from '../goods/columns.ts'

/**
 * 在庫アイテム (バックエンドの実際のレスポンスに合わせた型)
 */
export interface InventoryItem {
  id: number
  goodsId: number
  goods: GoodsColumn | null
  remainingQuantity: number
}

/**
 * 在庫サマリー
 */
export interface InventorySummary {
  totalItems: number // 在庫アイテムの総数
  availableItems: number // 利用可能なアイテム数
  outOfStockItems: number // 在庫切れアイテムの数
  totalValue: number // 在庫の総額（概算）
}
