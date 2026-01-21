// 収入方法の定義
export const INCOME_METHODS = {
  Cash: '現金',
  BankTransfer: '銀行振込',
  Credit: 'クレジットカード',
  Electronic: '電子マネー',
  Other: 'その他',
} as const

export type IncomeMethod = (typeof INCOME_METHODS)[keyof typeof INCOME_METHODS]

// 金額単位の定義
export const AMOUNT_UNITS = {
  Yen: '円',
  Dollar: '$',
  Euro: '€',
  Yuan: '元',
} as const

export type AmountUnit = (typeof AMOUNT_UNITS)[keyof typeof AMOUNT_UNITS]

// 日本語表示用の定義
export const JPNames = {
  id: 'ID',
  category: 'カテゴリ',
  categoryId: 'カテゴリID',
  amount: '金額',
  amountUnit: '金額単位',
  incomeDate: '収入日',
  method: '受取方法',
  note: 'メモ',
  createdAt: '作成日',
  updatedAt: '更新日',
}

// 収入データのカラム定義
export class IncomeColumn {
  id: number = 0
  categoryId: number | null = null
  category: { id: number; categoryName: string } | null = null
  amount: number = 0
  amountUnit: AmountUnit = AMOUNT_UNITS.Yen
  incomeDate: Date | null = null
  method: IncomeMethod | null = null
  note: string | null = null
  createdAt: Date = new Date()
  updatedAt: Date = new Date()
}
