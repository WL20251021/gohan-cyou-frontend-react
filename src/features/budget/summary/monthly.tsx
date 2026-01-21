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
import { getPurchasements } from '../purchasement/api'
import { PurchasementColumn } from '../purchasement/columns'
import { getIncomes } from '../income/api'
import { IncomeColumn } from '../income/columns'
import { getConsumptions } from '../consumption/api'
import { ConsumptionColumn } from '../consumption/columns'

interface MonthlySummary {
  totalIncome: number
  totalExpense: number
  balance: number
}

export default function MonthlySummaryPage() {
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs())
  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState<MonthlySummary>({
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
  })
  const [incomeDetails, setIncomeDetails] = useState<IncomeColumn[]>([])
  const [expenseDetails, setExpenseDetails] = useState<PurchasementColumn[]>([])
  const [consumptionDetails, setConsumptionDetails] = useState<ConsumptionColumn[]>([])

  // 今月の範囲を計算
  const monthStart = selectedDate.startOf('month')
  const monthEnd = selectedDate.endOf('month')

  // 今月の収支を取得
  const fetchMonthlySummary = async (date: Dayjs) => {
    setLoading(true)
    try {
      // 収入データ取得
      const incomeResponse = await getIncomes()
      const incomeData: IncomeColumn[] = incomeResponse.data || []
      const monthlyIncomes = incomeData.filter((item) => {
        if (!item.incomeDate) return false
        const incomeDate = dayjs(item.incomeDate)
        return incomeDate.isSame(date, 'month')
      })
      const totalIncome = monthlyIncomes.reduce((sum, item) => sum + (item.amount || 0), 0)
      setIncomeDetails(monthlyIncomes)

      // 支出データ取得
      const expenseResponse = await getPurchasements()
      const expenseData: PurchasementColumn[] = expenseResponse.data || []
      const monthlyExpenses = expenseData.filter((item) => {
        if (!item.purchaseDate) return false
        const purchaseDate = dayjs(item.purchaseDate)
        return purchaseDate.isSame(date, 'month')
      })
      const totalExpense = monthlyExpenses.reduce((sum, item) => sum + (item.totalPrice || 0), 0)
      setExpenseDetails(monthlyExpenses)

      // 使用記録データ取得
      const consumptionResponse = await getConsumptions()
      const consumptionData: ConsumptionColumn[] = consumptionResponse.data || []
      const monthlyConsumptions = consumptionData.filter((item) => {
        if (!item.consumptionDate) return false
        const consumptionDate = dayjs(item.consumptionDate)
        return consumptionDate.isSame(date, 'month')
      })
      setConsumptionDetails(monthlyConsumptions)

      // 収支計算
      setSummary({
        totalIncome,
        totalExpense,
        balance: totalIncome - totalExpense,
      })
    } catch (error) {
      message.error('データの取得に失敗しました')
      console.error('Failed to fetch monthly summary:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMonthlySummary(selectedDate)
  }, [selectedDate])

  // 日付選択ハンドラー
  const handleDateChange = (date: Dayjs | null) => {
    if (date) {
      setSelectedDate(date)
    }
  }

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

  return (
    <div style={{ padding: '24px', backgroundColor: '#f0f2f5', minHeight: '100vh' }}>
      <h1 style={{ marginBottom: '24px', fontSize: '24px', fontWeight: 'bold' }}>
        <DollarOutlined style={{ marginRight: '8px' }} />
        今月の収支
      </h1>

      {/* 日付選択 */}
      <Card style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <CalendarOutlined style={{ fontSize: '20px' }} />
          <span style={{ fontWeight: 'bold' }}>対象月:</span>
          <DatePicker
            value={selectedDate}
            onChange={handleDateChange}
            picker="month"
            format="YYYY年MM月"
            style={{ width: '200px' }}
            allowClear={false}
          />
          <Tag color="blue">
            {monthStart.format('YYYY年MM月DD日')} ~ {monthEnd.format('YYYY年MM月DD日')}
          </Tag>
        </div>
      </Card>

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
            locale={{ emptyText: '今月の収入データはありません' }}
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
            locale={{ emptyText: '今月の支出データはありません' }}
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
            columns={[
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
                render: (quantity: number, record: ConsumptionColumn) =>
                  `${quantity} ${record.quantityUnit}`,
                width: 120,
              },
              {
                title: 'メモ',
                dataIndex: 'note',
                key: 'note',
                render: (note: string | null) => note || '-',
              },
            ]}
            dataSource={consumptionDetails}
            rowKey="id"
            pagination={{ pageSize: 10, size: 'small' }}
            scroll={{ x: 800 }}
            size="small"
            locale={{ emptyText: '今月の使用記録データはありません' }}
          />
        </Card>
      </Spin>
    </div>
  )
}
