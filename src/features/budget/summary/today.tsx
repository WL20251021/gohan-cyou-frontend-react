import { useState, useEffect } from 'react'
import { Card, Statistic, Row, Col, Table, Spin, message, Tag } from 'antd'
import { ShoppingCartOutlined, DollarOutlined, RiseOutlined, FallOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { getPurchasements } from '../purchasement/api'
import { PurchasementColumn } from '../purchasement/columns'
import { getIncomes } from '../income/api'
import { IncomeColumn } from '../income/columns'
import { getConsumptions } from '../consumption/api'
import { ConsumptionColumn } from '../consumption/columns'

interface TodaySummary {
  totalIncome: number
  totalExpense: number
  balance: number
}

export default function TodaySummaryPage() {
  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState<TodaySummary>({
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
  })
  const [incomeDetails, setIncomeDetails] = useState<IncomeColumn[]>([])
  const [expenseDetails, setExpenseDetails] = useState<PurchasementColumn[]>([])
  const [consumptionDetails, setConsumptionDetails] = useState<ConsumptionColumn[]>([])

  const today = dayjs()

  // 今日の収支を取得
  const fetchTodaySummary = async () => {
    setLoading(true)
    try {
      // 収入データ取得
      const incomeResponse = await getIncomes()
      const incomeData: IncomeColumn[] = incomeResponse.data || []
      const todayIncomes = incomeData.filter((item) => {
        if (!item.incomeDate) return false
        return dayjs(item.incomeDate).isSame(today, 'day')
      })
      const totalIncome = todayIncomes.reduce((sum, item) => sum + (item.amount || 0), 0)
      setIncomeDetails(todayIncomes)

      // 支出データ取得
      const expenseResponse = await getPurchasements()
      const expenseData: PurchasementColumn[] = expenseResponse.data || []
      const todayExpenses = expenseData.filter((item) => {
        if (!item.purchaseDate) return false
        return dayjs(item.purchaseDate).isSame(today, 'day')
      })
      const totalExpense = todayExpenses.reduce((sum, item) => sum + (item.totalPrice || 0), 0)
      setExpenseDetails(todayExpenses)

      // 使用記録データ取得
      const consumptionResponse = await getConsumptions()
      const consumptionData: ConsumptionColumn[] = consumptionResponse.data || []
      const todayConsumptions = consumptionData.filter((item) => {
        if (!item.consumptionDate) return false
        return dayjs(item.consumptionDate).isSame(today, 'day')
      })
      setConsumptionDetails(todayConsumptions)

      // 収支計算
      setSummary({
        totalIncome,
        totalExpense,
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
    fetchTodaySummary()
  }, [])

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
      render: (category: any) => category?.categoryName || '-',
      width: 120,
    },
    {
      title: '金額',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number, record: IncomeColumn) =>
        `${amount.toLocaleString()} ${record.amountUnit}`,
      width: 120,
    },
    {
      title: '収入方法',
      dataIndex: 'incomeMethod',
      key: 'incomeMethod',
      render: (method: string | null) => method || '-',
      width: 120,
    },
    {
      title: 'メモ',
      dataIndex: 'remark',
      key: 'remark',
      render: (remark: string | null) => remark || '-',
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

  return (
    <div style={{ padding: '24px', backgroundColor: '#f0f2f5', minHeight: '100vh' }}>
      <h1 style={{ marginBottom: '24px', fontSize: '24px', fontWeight: 'bold' }}>
        <DollarOutlined style={{ marginRight: '8px' }} />
        今日の収支 ({today.format('YYYY年MM月DD日')})
      </h1>

      {/* 統計カード */}
      <Spin spinning={loading}>
        <Row
          gutter={[16, 16]}
          style={{ marginBottom: '24px' }}
        >
          <Col
            xs={24}
            sm={8}
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
            sm={8}
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
            sm={8}
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
  )
}
