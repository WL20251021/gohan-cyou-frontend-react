import type { instructions } from '../instructions/columns'
import type { RecipeIngredient } from '../ingredient/columns'

export class RecipeColumn {
  id: number = 0
  recipeName: string = ''
  description: string | null = null
  ingredients: RecipeIngredient[] = []
  instructions: instructions[] | null = null
  servings: number = 1
  preTime: number | null = null
  cookTime: number | null = null
  totalTime: number | null = null
  difficulty: number | null = null

  createdAt: Date | string = ''
  updatedAt: Date | string = ''
}

export const JPNames = {
  id: 'ID',
  recipeName: 'レシピ名',
  description: '説明',
  ingredients: '材料',
  instructions: '作り方',
  servings: '人数',
  preTime: '準備時間',
  cookTime: '調理時間',
  totalTime: '合計時間',
  difficulty: '難易度',

  createdAt: '作成日時',
  updatedAt: '更新日時',
}
