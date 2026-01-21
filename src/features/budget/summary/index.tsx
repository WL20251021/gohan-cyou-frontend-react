import { useState, useEffect } from 'react'
import { Card, DatePicker, Statistic, Row, Col, Table, Spin, message } from 'antd'
import { ShoppingCartOutlined, CalendarOutlined } from '@ant-design/icons'
import dayjs, { Dayjs } from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import { getPurchasements } from '../purchasement/api'
import { PurchasementColumn } from '../purchasement/columns'
import { getConsumptions } from '../consumption/api'
import { ConsumptionColumn } from '../consumption/columns'

dayjs.extend(isoWeek)
dayjs.extend(isSameOrAfter)
dayjs.extend(isSameOrBefore)

interface SummaryData {
  daily: number
  weekly: number
  monthly: number
}

export default function PurchasementSummaryPage() {
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs())
  const [loading, setLoading] = useState(false)
  const [summaryData, setSummaryData] = useState<SummaryData>({
    daily: 0,
    weekly: 0,
    monthly: 0,
  })
  const [dailyDetails, setDailyDetails] = useState<PurchasementColumn[]>([])
  const [weeklyDetails, setWeeklyDetails] = useState<PurchasementColumn[]>([])
  const [monthlyDetails, setMonthlyDetails] = useState<PurchasementColumn[]>([])
  const [dailyConsumptions, setDailyConsumptions] = useState<ConsumptionColumn[]>([])
  const [weeklyConsumptions, setWeeklyConsumptions] = useState<ConsumptionColumn[]>([])
  const [monthlyConsumptions, setMonthlyConsumptions] = useState<ConsumptionColumn[]>([])

  // データを取得して集計
  const fetchAndCalculateSummary = async (date: Dayjs) => {
    setLoading(true)
    try {
      const response = await getPurchasements()
      const data: PurchasementColumn[] = response.data || []

      // 使用記録データも取得
      const consumptionResponse = await getConsumptions()
      const consumptionData: ConsumptionColumn[] = consumptionResponse.data || []

      // 選択された日付の範囲を計算
      const selectedDayStart = date.startOf('day')
      const selectedDayEnd = date.endOf('day')
      const weekStart = date.startOf('isoWeek')
      const weekEnd = date.endOf('isoWeek')
      const monthStart = date.startOf('month')
      const monthEnd = date.endOf('month')

      // 1日の支出
      const dailyPurchases = data.filter((item) => {
        if (!item.purchaseDate) return false
        const purchaseDate = dayjs(item.purchaseDate)
        return purchaseDate.isSame(date, 'day')
      })
      const dailyTotal = dailyPurchases.reduce((sum, item) => sum + (item.totalPrice || 0), 0)
      setDailyDetails(dailyPurchases)

      // 1週間の支出
      const weeklyPurchases = data.filter((item) => {
        if (!item.purchaseDate) return false
        const purchaseDate = dayjs(item.purchaseDate)
        return (
          purchaseDate.isSameOrAfter(weekStart, 'day') &&
          purchaseDate.isSameOrBefore(weekEnd, 'day')
        )
      })
      const weeklyTotal = weeklyPurchases.reduce((sum, item) => sum + (item.totalPrice || 0), 0)
      setWeeklyDetails(weeklyPurchases)

      // 1ヶ月の支出
      const monthlyPurchases = data.filter((item) => {
        if (!item.purchaseDate) return false
        const purchaseDate = dayjs(item.purchaseDate)
        return purchaseDate.isSame(date, 'month')
      })
      const monthlyTotal = monthlyPurchases.reduce((sum, item) => sum + (item.totalPrice || 0), 0)
      setMonthlyDetails(monthlyPurchases)

      // 使用記録のフィルター
      const dailyConsumptionsList = consumptionData.filter((item) => {
        if (!item.consumptionDate) return false
        const consumptionDate = dayjs(item.consumptionDate)
        return consumptionDate.isSame(date, 'day')
      })
      setDailyConsumptions(dailyConsumptionsList)

      const weeklyConsumptionsList = consumptionData.filter((item) => {
        if (!item.consumptionDate) return false
        const consumptionDate = dayjs(item.consumptionDate)
        return (
          consumptionDate.isSameOrAfter(weekStart, 'day') &&
          consumptionDate.isSameOrBefore(weekEnd, 'day')
        )
      })
      setWeeklyConsumptions(weeklyConsumptionsList)

      const monthlyConsumptionsList = consumptionData.filter((item) => {
        if (!item.consumptionDate) return false
        const consumptionDate = dayjs(item.consumptionDate)
        return consumptionDate.isSame(date, 'month')
      })
      setMonthlyConsumptions(monthlyConsumptionsList)

      setSummaryData({
        daily: dailyTotal,
        weekly: weeklyTotal,
        monthly: monthlyTotal,
      })
    } catch (error) {
      message.error('データの取得に失敗しました')
      console.error('Failed to fetch purchasements:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAndCalculateSummary(selectedDate)
  }, [selectedDate])

  // 日付選択ハンドラー
  const handleDateChange = (date: Dayjs | null) => {
    if (date) {
      setSelectedDate(date)
    }
  }

  // 週と月の範囲を計算
  const weekStart = selectedDate.startOf('isoWeek')
  const weekEnd = selectedDate.endOf('isoWeek')
  const monthStart = selectedDate.startOf('month')

  // テーブルのカラム定義
  const columns = [
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
      render: (price: number, record: PurchasementColumn) => `${price} ${record.priceUnit}`,
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

  // 使用記録テーブルのカラム定義
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
        <ShoppingCartOutlined style={{ marginRight: '8px' }} />
        支出合計
      </h1>

      {/* 日付選択 */}
      <Card style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <CalendarOutlined style={{ fontSize: '20px' }} />
          <span style={{ fontWeight: 'bold' }}>基準日:</span>
          <DatePicker
            value={selectedDate}
            onChange={handleDateChange}
            format="YYYY-MM-DD"
            style={{ width: '200px' }}
            allowClear={false}
          />
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
                title={`1日の支出 (${selectedDate.format('YYYY-MM-DD')})`}
                value={summaryData.daily}
                precision={0}
                suffix="円"
                valueStyle={{ color: '#3f8600' }}
              />
              <div style={{ marginTop: '8px', color: '#666' }}>{dailyDetails.length}件の購入</div>
            </Card>
          </Col>
          <Col
            xs={24}
            sm={8}
          >
            <Card>
              <Statistic
                title={`1週間の支出 (${weekStart.format('MM/DD')} - ${weekEnd.format('MM/DD')})`}
                value={summaryData.weekly}
                precision={0}
                suffix="円"
                valueStyle={{ color: '#1890ff' }}
              />
              <div style={{ marginTop: '8px', color: '#666' }}>{weeklyDetails.length}件の購入</div>
            </Card>
          </Col>
          <Col
            xs={24}
            sm={8}
          >
            <Card>
              <Statistic
                title={`1ヶ月の支出 (${monthStart.format('YYYY-MM')})`}
                value={summaryData.monthly}
                precision={0}
                suffix="円"
                valueStyle={{ color: '#cf1322' }}
              />
              <div style={{ marginTop: '8px', color: '#666' }}>{monthlyDetails.length}件の購入</div>
            </Card>
          </Col>
        </Row>

        {/* 詳細テーブル */}
        <Card
          title="1日の支出詳細"
          style={{ marginBottom: '16px' }}
        >
          <Table
            columns={columns}
            dataSource={dailyDetails}
            rowKey="id"
            pagination={{ pageSize: 5, size: 'small' }}
            scroll={{ x: 800 }}
            size="small"
          />
        </Card>

        <Card
          title="1日の使用記録詳細"
          style={{ marginBottom: '16px' }}
        >
          <Table
            columns={consumptionColumns}
            dataSource={dailyConsumptions}
            rowKey="id"
            pagination={{ pageSize: 5, size: 'small' }}
            scroll={{ x: 800 }}
            size="small"
          />
        </Card>

        <Card
          title="1週間の支出詳細"
          style={{ marginBottom: '16px' }}
        >
          <Table
            columns={columns}
            dataSource={weeklyDetails}
            rowKey="id"
            pagination={{ pageSize: 10, size: 'small' }}
            scroll={{ x: 800 }}
            size="small"
          />
        </Card>

        <Card
          title="1週間の使用記録詳細"
          style={{ marginBottom: '16px' }}
        >
          <Table
            columns={consumptionColumns}
            dataSource={weeklyConsumptions}
            rowKey="id"
            pagination={{ pageSize: 10, size: 'small' }}
            scroll={{ x: 800 }}
            size="small"
          />
        </Card>

        <Card
          title="1ヶ月の支出詳細"
          style={{ marginBottom: '16px' }}
        >
          <Table
            columns={columns}
            dataSource={monthlyDetails}
            rowKey="id"
            pagination={{ pageSize: 10, size: 'small' }}
            scroll={{ x: 800 }}
            size="small"
          />
        </Card>

        <Card title="1ヶ月の使用記録詳細">
          <Table
            columns={consumptionColumns}
            dataSource={monthlyConsumptions}
            rowKey="id"
            pagination={{ pageSize: 10, size: 'small' }}
            scroll={{ x: 800 }}
            size="small"
          />
        </Card>
      </Spin>
    </div>
  )
}
