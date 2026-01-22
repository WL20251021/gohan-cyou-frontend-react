import request from '@/utils/request'
import { ConsumptionColumn } from './columns'

export function getConsumption() {
  return request({
    url: 'budget/consumption',
    method: 'get',
  })
}

export function getConsumptionByPage(page: number, pageSize: number) {
  return request({
    url: 'budget/consumption/page',
    method: 'get',
    params: { page, pageSize },
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
