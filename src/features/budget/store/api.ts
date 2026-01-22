import request from '@/utils/request'
import { StoreColumn } from './columns'

export function getStores() {
  return request({
    url: 'budget/stores',
    method: 'get',
  })
}

export function getStoresByPage(page: number, pageSize: number) {
  return request({
    url: 'budget/stores/page',
    method: 'get',
    params: { page, pageSize },
  })
}

export function addStore(data: Partial<StoreColumn>) {
  return request({
    url: 'budget/stores',
    method: 'post',
    data,
  })
}

export function updateStore(id: number, data: Partial<StoreColumn>) {
  return request({
    url: `budget/stores/${id}`,
    method: 'put',
    data,
  })
}

export function deleteStores(ids: number[]) {
  return request({
    url: 'budget/stores',
    method: 'delete',
    data: ids,
  })
}
