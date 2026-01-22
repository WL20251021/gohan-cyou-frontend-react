import request from '@/utils/request'
import { CategoryColumn } from './columns'

export function getCategories() {
  return request({
    url: 'budget/categories',
    method: 'get',
  })
}

export function getCategoriesByPage(page: number, pageSize: number) {
  return request({
    url: 'budget/categories/page',
    method: 'get',
    params: { page, pageSize },
  })
}

export function getCategoryParent(id: number, type: string) {
  return request({
    url: `budget/categories/parent/${id}`,
    method: 'get',
    params: { type },
  })
}

export function getCategoryOfType(type: string) {
  return request({
    url: `budget/categories/type/${type}`,
    method: 'get',
  })
}

export function addCategory(data: Partial<CategoryColumn>) {
  return request({
    url: 'budget/categories',
    method: 'post',
    data,
  })
}

export function updateCategory(id: number, data: Partial<CategoryColumn>) {
  return request({
    url: `budget/categories/${id}`,
    method: 'put',
    data,
  })
}

export function deleteCategory(ids: number[]) {
  return request({
    url: 'budget/categories',
    method: 'delete',
    data: ids,
  })
}
