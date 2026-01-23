import { useState, useEffect } from 'react'
import { Card, Statistic, Row, Col, List, Spin, message, Tag, DatePicker } from 'antd'
import { ShoppingCartOutlined, RiseOutlined, FallOutlined } from '@ant-design/icons'
import dayjs, { Dayjs } from 'dayjs'
import { PurchasementColumn } from '../purchasement/columns'
import { IncomeColumn, JPIncomeCategory, type IncomeCategoryType } from '../income/columns'
import { ConsumptionColumn } from '../consumption/columns'
import {
  getTotalIncomeBetween,
  getTotalConsumptionBetween,
  getTotalPurchasementBetween,
} from './api'
import { useParams } from 'react-router'

interface Summary {
  totalIncome: number
  totalExpense: number
  totalConsumption: number
  balance: number
}

function getTypeDateRange(pageType: string = 'today', baseDate: Dayjs): any {
  const DATE_RANGES = {
    today: {
      dateFrom: baseDate,
      dateTo: baseDate,
    },
    weekly: {
      dateFrom: baseDate.startOf('week'),
      dateTo: baseDate.endOf('week'),
    },
    monthly: {
      dateFrom: baseDate.startOf('month'),
      dateTo: baseDate.endOf('month'),
    },
  }
  return DATE_RANGES[pageType as keyof typeof DATE_RANGES]
}

export default function SummaryPage() {
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs())

  // URLからページのパラメータを取得
  const { range: pageType } = useParams()

  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState<Summary>({
    totalIncome: 0,
    totalExpense: 0,
    totalConsumption: 0,
    balance: 0,
  })
  const [incomeDetails, setIncomeDetails] = useState<IncomeColumn[]>([])
  const [expenseDetails, setExpenseDetails] = useState<PurchasementColumn[]>([])
  const [consumptionDetails, setConsumptionDetails] = useState<ConsumptionColumn[]>([])

  // 今日の収支を取得
  const fetchSummary = async (selectedDate: Dayjs) => {
    setLoading(true)
    try {
      const dateParams = getTypeDateRange(pageType || 'today', selectedDate)
      dateParams.dateFrom = dateParams.dateFrom.format('YYYY-MM-DD')
      dateParams.dateTo = dateParams.dateTo.format('YYYY-MM-DD')

      // 収入データ取得
      const incomeResponse = await getTotalIncomeBetween(dateParams)
      const todayIncomes: IncomeColumn[] = incomeResponse.data || []
      const totalIncome = todayIncomes.reduce((sum, item) => sum + (item.amount || 0), 0)
      setIncomeDetails(todayIncomes)

      // 支出データ取得
      const expenseResponse = await getTotalPurchasementBetween(dateParams)
      const todayExpenses: PurchasementColumn[] = expenseResponse.data || []
      const totalExpense = todayExpenses.reduce((sum, item) => sum + (item.totalPrice || 0), 0)
      setExpenseDetails(todayExpenses)

      // 使用記録データ取得
      const consumptionResponse = await getTotalConsumptionBetween(dateParams)
      const todayConsumptions: ConsumptionColumn[] = consumptionResponse.data || []
      const totalConsumption = todayConsumptions.reduce(
        (sum, item) => sum + (item.quantity * item?.purchasement.totalPrice || 0),
        0
      )
      setConsumptionDetails(todayConsumptions)

      // 収支計算
      setSummary({
        totalIncome,
        totalExpense,
        totalConsumption,
        balance: totalIncome - totalExpense,
      })
    } catch (error) {
      message.error('データの取得に失敗しました')
      console.error('Failed to fetch today summary:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSummary(selectedDate)
  }, [selectedDate])

  // 収入テーブルのカラム
  const incomeColumns = [
    {
      title: '日付',
      dataIndex: 'incomeDate',
      key: 'incomeDate',
      render: (date: string | null) => (date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '-'),
      width: 150,
    },
    {
      title: 'カテゴリ',
      dataIndex: 'category',
      key: 'category',
      render: (category: IncomeCategoryType) =>
        JPIncomeCategory[category as keyof typeof JPIncomeCategory] || '-',
      width: 120,
    },
    {
      title: '金額',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => `${amount.toLocaleString()} 円`,
      width: 120,
    },
    {
      title: 'メモ',
      dataIndex: 'description',
      key: 'description',
      render: (description: string | null) => description || '-',
    },
  ]

  // 支出テーブルのカラム
  const expenseColumns = [
    {
      title: '購入日',
      dataIndex: 'purchaseDate',
      key: 'purchaseDate',
      render: (date: string | null) => (date ? dayjs(date).format('YYYY-MM-DD') : '-'),
      width: 120,
    },
    {
      title: '商品',
      dataIndex: 'goods',
      key: 'goods',
      render: (goods: any) => goods?.goodsName || '-',
    },
    {
      title: '店舗',
      dataIndex: 'store',
      key: 'store',
      render: (store: any) => store?.name || '-',
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity',
      render: (quantity: number, record: PurchasementColumn) =>
        `${quantity} ${record.quantityUnit}`,
      width: 100,
    },
    {
      title: '単価',
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      render: (price: number, record: PurchasementColumn) => `${price} ${record.priceUnit}`,
      width: 100,
    },
    {
      title: '合計金額',
      dataIndex: 'totalPrice',
      key: 'totalPrice',
      render: (price: number, record: PurchasementColumn) =>
        `${price.toLocaleString()} ${record.priceUnit}`,
      width: 120,
    },
    {
      title: '支払い方法',
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
      render: (method: string | null) => method || '-',
      width: 140,
    },
  ]

  // 使用記録テーブルのカラム
  const consumptionColumns = [
    {
      title: '使用日',
      dataIndex: 'consumptionDate',
      key: 'consumptionDate',
      render: (date: string | null) => (date ? dayjs(date).format('YYYY-MM-DD') : '-'),
      width: 120,
    },
    {
      title: '商品',
      dataIndex: 'purchasement',
      key: 'goods',
      render: (purchasement: any) => purchasement?.goods?.goodsName || '-',
    },
    {
      title: '店舗',
      dataIndex: 'purchasement',
      key: 'store',
      render: (purchasement: any) => purchasement?.store?.name || '-',
    },
    {
      title: '使用数量',
      dataIndex: 'quantity',
      key: 'quantity',
      render: (quantity: number, record: ConsumptionColumn) => `${quantity} ${record.quantityUnit}`,
      width: 120,
    },
    {
      title: 'メモ',
      dataIndex: 'note',
      key: 'note',
      render: (note: string | null) => note || '-',
    },
  ]

  // 日付選択ハンドラー
  const handleDateChange = (date: Dayjs | null) => {
    if (date) {
      setSelectedDate(date)
    }
  }

  return (
    <div
      className="book-page-container"
      style={{
        display: 'flex',
      }}
    >
      <h1
        style={{
          marginBottom: '24px',
          fontSize: '24px',
          fontWeight: 'bold',
          backgroundColor: 'var(--color-paper-white)', // Match page background
          padding: '32px 48px',
        }}
      >
        {selectedDate.format('YYYY-MM-DD') == dayjs().format('YYYY-MM-DD') ? '今日' : '一日'}の収支
        ({selectedDate.format('YYYY年MM月DD日')})
      </h1>

      <div style={{ padding: '0 60px 50px', flex: 1, overflowY: 'scroll' }}>
        {/* 日付選択 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            flexWrap: 'wrap',
            marginBottom: '24px',
          }}
        >
          <span style={{ fontWeight: 'bold' }}>基準日:</span>
          <DatePicker
            value={selectedDate}
            onChange={handleDateChange}
            format="YYYY-MM-DD"
            style={{ width: '200px' }}
            allowClear={false}
          />
          <Tag color="blue">
            {getTypeDateRange(pageType, selectedDate).dateFrom.format('YYYY年MM月DD日')}
            {pageType !== 'today' && ' ～ '}
            {pageType !== 'today' &&
              getTypeDateRange(pageType, selectedDate).dateTo.format('YYYY年MM月DD日')}
          </Tag>
        </div>

        {/* 統計カード */}
        <Spin spinning={loading}>
          <Row
            gutter={[16, 16]}
            style={{ marginBottom: '24px' }}
          >
            <Col
              xs={24}
              sm={6}
            >
              <Card style={{ background: 'linear-gradient(135deg, #5AB2FF 0%, #A0DEFF 100%)' }}>
                <Statistic
                  title={
                    <span style={{ color: 'white', fontSize: '16px' }}>
                      <RiseOutlined style={{ marginRight: '4px' }} />
                      収入
                    </span>
                  }
                  value={summary.totalIncome}
                  precision={0}
                  suffix="円"
                  valueStyle={{ color: 'white', fontSize: '28px', fontWeight: 'bold' }}
                />
                <div
                  style={{ marginTop: '8px', color: 'rgba(255, 255, 255, 0.9)', fontSize: '14px' }}
                >
                  {incomeDetails.length}件
                </div>
              </Card>
            </Col>
            <Col
              xs={24}
              sm={6}
            >
              <Card style={{ background: 'linear-gradient(135deg, #FD7979 0%, #FDACAC 100%)' }}>
                <Statistic
                  title={
                    <span style={{ color: 'white', fontSize: '16px' }}>
                      <FallOutlined style={{ marginRight: '4px' }} />
                      支出
                    </span>
                  }
                  value={summary.totalExpense}
                  precision={0}
                  suffix="円"
                  valueStyle={{ color: 'white', fontSize: '28px', fontWeight: 'bold' }}
                />
                <div
                  style={{ marginTop: '8px', color: 'rgba(255, 255, 255, 0.9)', fontSize: '14px' }}
                >
                  {expenseDetails.length}件
                </div>
              </Card>
            </Col>
            <Col
              xs={24}
              sm={6}
            >
              <Card style={{ background: 'linear-gradient(135deg, #AA60C8 0%, #D69ADE 100%)' }}>
                <Statistic
                  title={<span style={{ color: 'white', fontSize: '16px' }}>消費</span>}
                  value={summary.totalConsumption}
                  precision={0}
                  suffix="円"
                  valueStyle={{ color: 'white', fontSize: '28px', fontWeight: 'bold' }}
                />
                <div
                  style={{ marginTop: '8px', color: 'rgba(255, 255, 255, 0.9)', fontSize: '14px' }}
                >
                  {consumptionDetails.length}件
                </div>
              </Card>
            </Col>
            <Col
              xs={24}
              sm={6}
            >
              <Card
                style={{
                  background:
                    summary.balance === 0
                      ? 'linear-gradient(135deg, #4c4c53 0%, #828584 100%)'
                      : summary.balance > 0
                        ? 'linear-gradient(135deg, #5AB2FF 0%, #A0DEFF 100%)'
                        : 'linear-gradient(135deg, #FD8A6B 0%, #FDACAC 100%)',
                }}
              >
                <Statistic
                  title={<span style={{ color: 'white', fontSize: '16px' }}>収支</span>}
                  value={summary.balance}
                  precision={0}
                  suffix="円"
                  valueStyle={{ color: 'white', fontSize: '28px', fontWeight: 'bold' }}
                />
                <div
                  style={{ marginTop: '8px', color: 'rgba(255, 255, 255, 0.9)', fontSize: '14px' }}
                >
                  {summary.balance >= 0 ? '黒字' : '赤字'}
                </div>
              </Card>
            </Col>
          </Row>

          {/* 収入詳細 */}
          <Card
            title={
              <span>
                <RiseOutlined style={{ marginRight: '8px', color: '#52c41a' }} />
                収入詳細
              </span>
            }
            style={{ marginBottom: '16px' }}
          >
            <List
              itemLayout="horizontal"
              dataSource={incomeDetails}
              locale={{ emptyText: '収入データはありません' }}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    title={
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 'bold' }}>
                          {JPIncomeCategory[item.category as keyof typeof JPIncomeCategory] || '-'}
                        </span>
                        <span style={{ color: '#666' }}>
                          {item.incomeDate
                            ? dayjs(item.incomeDate).format('YYYY-MM-DD HH:mm')
                            : '-'}
                        </span>
                      </div>
                    }
                    description={item.description || '-'}
                  />
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#52c41a' }}>
                    +{(item.amount || 0).toLocaleString()} 円
                  </div>
                </List.Item>
              )}
            />
          </Card>

          {/* 支出詳細 */}
          <Card
            title={
              <span>
                <FallOutlined style={{ marginRight: '8px', color: '#ff4d4f' }} />
                支出詳細
              </span>
            }
            style={{ marginBottom: '16px' }}
          >
            <List
              itemLayout="horizontal"
              dataSource={expenseDetails}
              locale={{ emptyText: '支出データはありません' }}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    title={
                      <div>
                        <span style={{ fontSize: '16px', fontWeight: 'bold' }}>
                          {item.goods?.goodsName || '商品未設定'}
                        </span>
                        {item.store && (
                          <Tag
                            color="blue"
                            style={{ marginLeft: 8 }}
                          >
                            {item.store.storeName}
                          </Tag>
                        )}
                      </div>
                    }
                    description={
                      <div style={{ marginTop: 8 }}>
                        <div>
                          数量: {item.quantity} {item.quantityUnit} × 単価: {item.unitPrice}{' '}
                          {item.priceUnit}
                        </div>
                        {item.description && (
                          <div style={{ marginTop: 4, color: '#666' }}>
                            メモ: {item.description}
                          </div>
                        )}
                      </div>
                    }
                  />
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#cf1322' }}>
                    ¥{(item.totalPrice || 0).toLocaleString()}
                  </div>
                </List.Item>
              )}
            />
          </Card>

          {/* 使用記録詳細 */}
          <Card
            title={
              <span>
                <ShoppingCartOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
                使用記録詳細
              </span>
            }
          >
            <List
              itemLayout="horizontal"
              dataSource={consumptionDetails}
              locale={{ emptyText: '使用記録データはありません' }}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    title={
                      <div>
                        <span style={{ fontSize: '16px', fontWeight: 'bold' }}>
                          {item.purchasement?.goods?.goodsName || '商品未設定'}
                        </span>
                        {item.purchasement?.store && (
                          <Tag
                            color="blue"
                            style={{ marginLeft: 8 }}
                          >
                            {item.purchasement.store.storeName}
                          </Tag>
                        )}
                        {item.purchasement?.goods?.brand && (
                          <Tag
                            color="purple"
                            style={{ marginLeft: 4 }}
                          >
                            {item.purchasement.goods.brand.brandName}
                          </Tag>
                        )}
                      </div>
                    }
                    description={
                      <div style={{ marginTop: 8 }}>
                        <div>
                          使用量: {item.quantity} {item.quantityUnit}
                        </div>
                        <div style={{ color: '#666', marginTop: 4 }}>
                          購入日:{' '}
                          {item.purchasement?.purchaseDate
                            ? dayjs(item.purchasement.purchaseDate).format('YYYY年MM月DD日')
                            : '日付不明'}
                        </div>
                        {item.description && (
                          <div style={{ marginTop: 4, color: '#666' }}>
                            メモ: {item.description}
                          </div>
                        )}
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Spin>
      </div>
    </div>
  )
}
