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
