import request from '@/utils/request'
import { PurchasementColumn } from './columns'

export function getPurchasements() {
  return request({
    url: 'budget/purchasement',
    method: 'get',
  })
}

export function getPurchasementsByPage(page: number, pageSize: number) {
  return request({
    url: 'budget/purchasement/page',
    method: 'get',
    params: { page, pageSize },
  })
}

export function addPurchasement(data: Partial<PurchasementColumn>) {
  return request({
    url: 'budget/purchasement',
    method: 'post',
    data,
  })
}

export function updatePurchasement(id: number, data: Partial<PurchasementColumn>) {
  return request({
    url: `budget/purchasement/${id}`,
    method: 'put',
    data,
  })
}

export function deletePurchasement(ids: number[]) {
  return request({
    url: 'budget/purchasement',
    method: 'delete',
    data: ids,
  })
}
