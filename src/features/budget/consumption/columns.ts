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

// 日本語表示用の定義
export const JPNames = {
  id: 'ID',
  purchasement: '購入記録',
  purchasementId: '購入記録ID',
  quantity: '数量',
  quantityUnit: '数量単位',
  consumptionDate: '使用日',
  note: 'メモ',
  createdAt: '作成日',
  updatedAt: '更新日',
}

// 使用記録データのカラム定義
export class ConsumptionColumn {
  id: number = 0
  purchasementId: number | null = null
  purchasement: any | null = null
  quantity: number = 0
  quantityUnit: QuantityUnit = QUANTITY_UNITS.Piece
  consumptionDate: Date | null = null
  note: string | null = null
  createdAt: Date = new Date()
  updatedAt: Date = new Date()
}
