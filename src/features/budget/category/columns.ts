export class CategoryColumn {
  id: number = 0
  categoryName: string = ''
  icon: string = ''
  color: string = '000000'
  description: string = ''

  createdAt: Date = new Date()
  updatedAt: Date = new Date()

  disabled?: boolean
}

export const JPNames = {
  id: 'ID',
  categoryName: 'カテゴリー名',
  description: '説明',
  icon: 'アイコン',
  color: '色',
  createdAt: '作成日',
  updatedAt: '更新日',
  disabled: '無効',
}
