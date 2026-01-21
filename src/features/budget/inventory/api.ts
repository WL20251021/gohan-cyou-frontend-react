import request from '@/utils/request'
import type { InventoryItem, InventorySummary } from './types.ts'

/**
 * すべての在庫を取得
 */
export function getAllInventory() {
  return request<InventoryItem[]>({
    url: 'budget/inventory',
    method: 'get',
  })
}

/**
 * 在庫サマリーを取得
 */
export function getInventorySummary() {
  return request<InventorySummary>({
    url: 'budget/inventory/summary',
    method: 'get',
  })
}

/**
 * 低在庫アイテムを取得
 * @param threshold 低在庫のしきい値（デフォルト: 10）
 */
export function getLowStockItems(threshold?: number) {
  return request<InventoryItem[]>({
    url: 'budget/inventory/low-stock',
    method: 'get',
    params: { threshold },
  })
}

/**
 * 在庫切れアイテムを取得
 */
export function getOutOfStockItems() {
  return request<InventoryItem[]>({
    url: 'budget/inventory/out-of-stock',
    method: 'get',
  })
}

/**
 * 特定の商品の在庫を取得
 * @param goodsId 商品ID
 */
export function getInventoryByGoods(goodsId: number) {
  return request<InventoryItem | null>({
    url: `budget/inventory/goods/${goodsId}`,
    method: 'get',
  })
}

/**
 * 特定の店舗の在庫を取得
 * @param storeId 店舗ID
 */
export function getInventoryByStore(storeId: number) {
  return request<InventoryItem[]>({
    url: `budget/inventory/store/${storeId}`,
    method: 'get',
  })
}
