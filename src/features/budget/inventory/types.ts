/**
 * 商品タイプ
 */
export type GoodsType = '0' | '1' | '2'

/**
 * 商品情報
 */
export interface Goods {
  id: number
  goodsName: string
  categoryId: number | null
  brandId: number | null
  goodsImage: string | null
  goodsType: GoodsType
  usageCount: number
  category?: {
    id: number
    jpName: string
  } | null
  brand?: {
    id: number
    name: string
  } | null
}

/**
 * 店舗情報
 */
export interface Store {
  id: number
  name: string
  storeType: string
  storeImage: string | null
}

/**
 * 在庫アイテム (バックエンドの実際のレスポンスに合わせた型)
 */
export interface InventoryItem {
  purchasementId: number // 購入記録ID
  goodsId: number
  goods: Goods | null
  storeId: number | null
  store: Store | null
  purchasedQuantity: number // 購入数量
  consumedQuantity: number // 使用数量
  availableQuantity: number // 利用可能な数量
  quantityUnit: string // 数量の単位
  purchaseDate: Date | null // 購入日
  lastConsumptionDate: Date | null // 最終使用日
}

/**
 * 在庫サマリー
 */
export interface InventorySummary {
  totalItems: number // 在庫アイテムの総数
  availableItems: number // 利用可能なアイテム数
  lowStockItems: number // 低在庫アイテムの数
  outOfStockItems: number // 在庫切れアイテムの数
  totalValue: number // 在庫の総額（概算）
}
