import request from '@/utils/request'
import { ConsumptionColumn } from './columns'

export function getConsumptions() {
  return request({
    url: 'budget/consumption',
    method: 'get',
  })
}

export function addConsumption(data: Partial<ConsumptionColumn>) {
  return request({
    url: 'budget/consumption',
    method: 'post',
    data,
  })
}

export function updateConsumption(id: number, data: Partial<ConsumptionColumn>) {
  return request({
    url: `budget/consumption/${id}`,
    method: 'put',
    data,
  })
}

export function deleteConsumption(ids: number[]) {
  return request({
    url: 'budget/consumption',
    method: 'delete',
    data: ids,
  })
}

/* other */

export function getConsumptionStatistics() {
  return request({
    url: 'budget/consumption/statistics',
    method: 'get',
  })
}

export function getConsumptionsByPurchasement(purchasementId: number) {
  return request({
    url: `budget/consumption/purchasement/${purchasementId}`,
    method: 'get',
  })
}
