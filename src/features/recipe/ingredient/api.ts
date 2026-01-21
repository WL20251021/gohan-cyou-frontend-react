import request from '@/utils/request'
import type { RecipeIngredient } from './columns'

export function getIngredients() {
  return request({
    url: 'recipe/ingredients',
    method: 'get',
  })
}

export function batchSaveIngredients(data: RecipeIngredient[]) {
  return request({
    url: 'recipe/ingredients/batch',
    method: 'post',
    data,
  })
}

export function deleteIngredients(ids: number[]) {
  return request({
    url: 'recipe/ingredients',
    method: 'delete',
    data: ids,
  })
}

export function deleteIngredientsByRecipe(recipeId: number) {
  return request({
    url: `recipe/ingredients/recipe/${recipeId}`,
    method: 'delete',
  })
}
