import request from '@/utils/request'

export function getRecipes() {
  return request({
    url: 'recipe/recipes',
    method: 'get',
  })
}

export function getRecipe(id: number) {
  return request({
    url: `recipe/recipes/${id}`,
    method: 'get',
  })
}

export function addRecipe(data: any) {
  return request({
    url: 'recipe/recipes',
    method: 'post',
    data,
  })
}

export function updateRecipe(id: number, data: any) {
  return request({
    url: `recipe/recipes/${id}`,
    method: 'put',
    data,
  })
}

export function deleteRecipe(ids: number[]) {
  return request({
    url: 'recipe/recipes',
    method: 'delete',
    data: ids,
  })
}
