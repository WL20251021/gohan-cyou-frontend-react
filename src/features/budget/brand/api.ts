import request from '@/utils/request'
import { BrandColumn } from './columns'

export function getBrands() {
  return request({
    url: 'budget/brands',
    method: 'get',
  })
}

export function addBrand(data: Partial<BrandColumn>) {
  return request({
    url: 'budget/brands',
    method: 'post',
    data,
  })
}

export function updateBrand(id: number, data: Partial<BrandColumn>) {
  return request({
    url: `budget/brands/${id}`,
    method: 'put',
    data,
  })
}

export function deleteBrands(ids: number[]) {
  return request({
    url: `budget/brands`,
    method: 'delete',
    data: ids,
  })
}
