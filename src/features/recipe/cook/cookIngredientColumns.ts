import type { InventoryColumn } from '@/features/budget/inventory/columns'

export interface CookIngredient {
  id?: number
  inventory?: InventoryColumn
  inventoryId: number
  quantity: number
  unit: string
  description: string
}
