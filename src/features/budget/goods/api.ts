import request from '@/utils/request'
import type { GoodsColumn } from './columns'

export function getGoods() {
  return request({
    url: 'budget/goods',
    method: 'get',
  })
}

export function addGoods(data: Partial<GoodsColumn>) {
  return request({
    url: 'budget/goods',
    method: 'post',
    data,
  })
}

export function updateGoods(id: number, data: Partial<GoodsColumn>) {
  return request({
    url: `budget/goods/${id}`,
    method: 'put',
    data,
  })
}

export function deleteGoodsById(id: number) {
  return request({
    url: `budget/goods/${id}`,
    method: 'delete',
  })
}

export function deleteGoods(ids: number[]) {
  return request({
    url: `budget/goods`,
    method: 'delete',
    data: ids,
  })
}

export function uploadGoodsImage(file: File) {
  const formData = new FormData()
  formData.append('file', file)
  return request({
    url: 'budget/goods/image',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}

export function getGoodsImage(imageName: string) {
  return request({
    url: `images/${imageName}`,
    method: 'get',
    responseType: 'blob',
  })
}

export function deleteGoodsImage(imageName: string) {
  return request({
    url: `uploader/${imageName}`,
    method: 'delete',
  })
}
