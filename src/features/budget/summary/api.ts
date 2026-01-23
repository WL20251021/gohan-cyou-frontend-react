import request from '@/utils/request'

export function getTotalPurchasementBetween({
  dateFrom,
  dateTo,
}: {
  dateFrom: string
  dateTo: string
}) {
  return request({
    url: 'budget/purchasement/date-between',
    method: 'get',
    params: { dateFrom, dateTo },
  })
}

export function getTotalIncomeBetween({ dateFrom, dateTo }: { dateFrom: string; dateTo: string }) {
  return request({
    url: 'budget/income/date-between',
    method: 'get',
    params: { dateFrom, dateTo },
  })
}

export function getTotalConsumptionBetween({
  dateFrom,
  dateTo,
}: {
  dateFrom: string
  dateTo: string
}) {
  return request({
    url: 'budget/consumption/date-between',
    method: 'get',
    params: { dateFrom, dateTo },
  })
}
