import type { RecipeColumn } from '../recipe/columns'
import type { CookIngredient } from './cookIngredientColumns'

export class CookColumn {
  id: number = 0
  cookName: string = ''
  cookDate: Date | string = ''
  recipeId: number | null = null
  recipe: RecipeColumn | null = null

  preTime: number = 0
  cookTime: number = 0
  totalTime: number = 0
  servings: number = 1

  useIngredients: CookIngredient[] = []
  photoNames: string[] = []

  description: string | null = null

  createdAt: Date | string = ''
  updatedAt: Date | string = ''
}

export const JPNames = {
  id: 'ID',
  cookName: 'タイトル',
  cookDate: '調理日',
  recipeId: 'レシピ',
  recipe: 'レシピ',

  preTime: '準備時間（分）',
  cookTime: '調理時間（分）',
  totalTime: '合計時間（分）',
  servings: '分量（人前）',

  useIngredients: '使用材料',
  photoNames: '写真ファイル名',

  description: '説明',

  createdAt: '作成日時',
  updatedAt: '更新日時',
}
