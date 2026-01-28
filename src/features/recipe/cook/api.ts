import request from '@/utils/request'

export function getRecipes() {
  return request({
    url: 'recipe/cooks',
    method: 'get',
  })
}

export function getRecipesByPage(page: number, pageSize: number) {
  return request({
    url: 'recipe/cooks/page',
    method: 'get',
    params: { page, pageSize },
  })
}

export function getRecipe(id: number) {
  return request({
    url: `recipe/cooks/${id}`,
    method: 'get',
  })
}

export function addRecipe(data: any) {
  return request({
    url: 'recipe/cooks',
    method: 'post',
    data,
  })
}

export function updateRecipe(id: number, data: any) {
  return request({
    url: `recipe/cooks/${id}`,
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
