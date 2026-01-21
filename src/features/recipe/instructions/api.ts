import request from '@/utils/request'
import type { instructions } from './columns'

export function getInstructions() {
  return request({
    url: 'recipe/instructions',
    method: 'get',
  })
}

export function batchSaveInstructions(data: instructions[]) {
  return request({
    url: 'recipe/instructions/batch',
    method: 'post',
    data,
  })
}

export function deleteInstructions(ids: number[]) {
  return request({
    url: 'recipe/instructions',
    method: 'delete',
    data: ids,
  })
}

export function deleteInstructionsByRecipe(recipeId: number) {
  return request({
    url: `recipe/instructions/recipe/${recipeId}`,
    method: 'delete',
  })
}
