import { useState, useEffect } from 'react'
import { Card, Statistic, Row, Col, Table, Spin, message, Tag, DatePicker } from 'antd'
import {
  ShoppingCartOutlined,
  DollarOutlined,
  RiseOutlined,
  FallOutlined,
  CalendarOutlined,
} from '@ant-design/icons'
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
    <div style={{ minHeight: '100vh' }}>
      <h1
        style={{
          marginBottom: '24px',
          fontSize: '24px',
          fontWeight: 'bold',
          backgroundColor: 'var(--color-paper-white)', // Match page background
          padding: '32px 48px',
        }}
      >
        <DollarOutlined style={{ marginRight: '8px' }} />
        {selectedDate.format('YYYY-MM-DD') == dayjs().format('YYYY-MM-DD') ? '今日' : '一日'}の収支
        ({selectedDate.format('YYYY年MM月DD日')})
      </h1>

      <div style={{ padding: '0 48px' }}>
        {/* 日付選択 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            flexWrap: 'wrap',
          }}
        >
          <CalendarOutlined style={{ fontSize: '20px' }} />
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
              <Card>
                <Statistic
                  title={
                    <span>
                      <RiseOutlined style={{ marginRight: '4px' }} />
                      収入
                    </span>
                  }
                  value={summary.totalIncome}
                  precision={0}
                  suffix="円"
                  valueStyle={{ color: '#52c41a' }}
                />
                <div style={{ marginTop: '8px', color: '#666' }}>{incomeDetails.length}件</div>
              </Card>
            </Col>
            <Col
              xs={24}
              sm={6}
            >
              <Card>
                <Statistic
                  title={
                    <span>
                      <FallOutlined style={{ marginRight: '4px' }} />
                      支出
                    </span>
                  }
                  value={summary.totalExpense}
                  precision={0}
                  suffix="円"
                  valueStyle={{ color: '#ff4d4f' }}
                />
                <div style={{ marginTop: '8px', color: '#666' }}>{expenseDetails.length}件</div>
              </Card>
            </Col>
            <Col
              xs={24}
              sm={6}
            >
              <Card>
                <Statistic
                  title="消費"
                  value={summary.totalConsumption}
                  precision={0}
                  suffix="円"
                  valueStyle={{ color: summary.totalConsumption >= 0 ? '#3f8600' : '#cf1322' }}
                  prefix={summary.totalConsumption >= 0 ? '+' : ''}
                />
                <div style={{ marginTop: '8px', color: '#666' }}>{consumptionDetails.length}件</div>
              </Card>
            </Col>
            <Col
              xs={24}
              sm={6}
            >
              <Card>
                <Statistic
                  title="収支"
                  value={summary.balance}
                  precision={0}
                  suffix="円"
                  valueStyle={{ color: summary.balance >= 0 ? '#3f8600' : '#cf1322' }}
                  prefix={summary.balance >= 0 ? '+' : ''}
                />
                <div style={{ marginTop: '8px' }}>
                  {summary.balance >= 0 ? (
                    <Tag color="success">黒字</Tag>
                  ) : (
                    <Tag color="error">赤字</Tag>
                  )}
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
            <Table
              columns={incomeColumns}
              dataSource={incomeDetails}
              rowKey="id"
              pagination={{ pageSize: 10, size: 'small' }}
              scroll={{ x: 800 }}
              size="small"
              locale={{ emptyText: '今日の収入データはありません' }}
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
            <Table
              columns={expenseColumns}
              dataSource={expenseDetails}
              rowKey="id"
              pagination={{ pageSize: 10, size: 'small' }}
              scroll={{ x: 800 }}
              size="small"
              locale={{ emptyText: '今日の支出データはありません' }}
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
            <Table
              columns={consumptionColumns}
              dataSource={consumptionDetails}
              rowKey="id"
              pagination={{ pageSize: 10, size: 'small' }}
              scroll={{ x: 800 }}
              size="small"
              locale={{ emptyText: '今日の使用記録データはありません' }}
            />
          </Card>
        </Spin>
      </div>
    </div>
  )
}
