export const JPIncomeCategory = {
  SALARY: '給与',
  BONUS: '賞与',
  INVESTMENT: '投資',
  ALLOWANCE: 'お小遣い',
  OTHER: 'その他',
}
export const IncomeCategory = Object.fromEntries(
  Object.keys(JPIncomeCategory).map((key) => [key, key])
)
export type IncomeCategoryType = keyof typeof IncomeCategory

// 日本語表示用の定義
export const JPNames = {
  id: 'ID',
  category: 'カテゴリ',
  incomeDate: '収入日',
  amount: '金額',
  description: 'メモ',
  createdAt: '作成日',
  updatedAt: '更新日',
}

// 収入データのカラム定義
export class IncomeColumn {
  id: number = 0
  incomeDate: Date | null = null
  amount: number = 0
  category: IncomeCategoryType = IncomeCategory.SALARY
  description: string | null = null
  createdAt: Date = new Date()
  updatedAt: Date = new Date()
}
