import request from '@/utils/request'
import type { InventoryColumn, GoodsInventory, InventoryStats } from './columns.ts'

/**
 * すべての在庫を取得
 */
export function getAllInventory() {
  return request<InventoryColumn[]>({
    url: 'budget/inventories',
    method: 'get',
  })
}

export function getAllInventoryByPage(page: number, pageSize: number) {
  return request<{ data: InventoryColumn[]; total: number }>({
    url: 'budget/inventories/page',
    method: 'get',
    params: { page, pageSize },
  })
}

/**
 * 在庫サマリーを取得
 */
export function getInventorySummary() {
  return request<InventoryStats>({
    url: 'budget/inventories/stats',
    method: 'get',
  })
}

/**
 * 在庫ありアイテムを取得
 */
export function getInStockItems() {
  return request<InventoryColumn[]>({
    url: 'budget/inventories/in-stock',
    method: 'get',
  })
}
/**
 * 在庫切れアイテムを取得
 */
export function getOutOfStockItems() {
  return request<InventoryColumn[]>({
    url: 'budget/inventories/out-of-stock',
    method: 'get',
  })
}

/**
 * 特定の商品の在庫を取得
 * @param goodsId 商品ID
 */
export function getInventoryByGoods(goodsId: number) {
  return request<GoodsInventory | null>({
    url: `budget/inventories/goods/${goodsId}`,
    method: 'get',
  })
}
