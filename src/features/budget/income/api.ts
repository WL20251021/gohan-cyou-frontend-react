import request from '@/utils/request'
import { IncomeColumn } from './columns'

export function getIncomes() {
  return request({
    url: 'budget/income/',
    method: 'get',
  })
}

export function addIncome(data: Partial<IncomeColumn>) {
  return request({
    url: 'budget/income/',
    method: 'post',
    data,
  })
}

export function updateIncome(id: number, data: Partial<IncomeColumn>) {
  return request({
    url: `budget/income/${id}`,
    method: 'put',
    data,
  })
}

export function deleteIncome(ids: number[]) {
  return request({
    url: 'budget/income/',
    method: 'delete',
    data: ids,
  })
}
