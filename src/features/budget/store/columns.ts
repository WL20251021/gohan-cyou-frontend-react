export const STORES = {
  Supermarket: 'SUPERMARKET', // スーパーマーケット 超市
  Convenience: 'CONVENIENCE_STORE', // コンビニ 便利店
  Online: 'ONLINE', // オンライン 线上
  DepartmentStore: 'DEPARTMENT_STORE', // デパート 百货公司
  Electronics: 'ELECTRONICS', // 電気屋 电子产品店
  Restaurant: 'RESTAURANT', // レストラン 餐厅
  DiscountStore: 'DISCOUNT_STORE', // 百円ショップ 折扣店
  Other: 'OTHER', // その他 其他
} as const

export type StoreType = (typeof STORES)[keyof typeof STORES]

export const COUNTRIES = {
  Japan: 'Japan', // 日本
  China: 'China', // 中国
  Other: 'Other', // 其他国家
} as const

export type CountryType = (typeof COUNTRIES)[keyof typeof COUNTRIES]

// 日本語表示用のクラス

export const JPNames = {
  id: 'ID',
  storeName: '店舗名',
  storeType: '店舗タイプ',
  jpStoreType: '店舗タイプ',
  address: '所在地',
  city: '市区町村',
  country: '国',
  jpCountry: '国',
  url: 'ウェブサイト',
  createdAt: '作成日',
  updatedAt: '更新日',
}

export const JPStoreTypes = {
  Supermarket: 'スーパーマーケット',
  Convenience: 'コンビニ',
  Online: 'オンライン',
  DepartmentStore: 'デパート',
  Electronics: '電気屋',
  DiscountStore: '百円ショップ',
  Restaurant: 'レストラン',
  Other: 'その他',
} as const
export type JPStoreType = (typeof JPStoreTypes)[keyof typeof JPStoreTypes]

export const JPCountries = {
  Japan: '日本',
  China: '中国',
  Other: 'その他',
} as const
export type JPCountryType = (typeof JPCountries)[keyof typeof JPCountries]

// 店舗データのカラム定義
export class StoreColumn {
  id: number = 0
  storeName: string = ''
  storeType: StoreType = STORES.Supermarket
  country: CountryType = COUNTRIES.Japan
  city: string = ''
  address: string = ''
  url: string = ''
  createdAt: Date = new Date()
  updatedAt: Date = new Date()
}
