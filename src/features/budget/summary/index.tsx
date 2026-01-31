import { useState, useEffect } from 'react'
import { Card, Statistic, Row, Col, List, Spin, message, Tag, DatePicker } from 'antd'
import {
  ShoppingCartOutlined,
  RiseOutlined,
  FallOutlined,
  LineChartOutlined,
  PieChartOutlined,
  PayCircleOutlined,
} from '@ant-design/icons'
import dayjs, { Dayjs } from 'dayjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  TimeScale,
} from 'chart.js'
import { Line, Pie, Bar } from 'react-chartjs-2'
import 'chartjs-adapter-dayjs-4/dist/chartjs-adapter-dayjs-4.esm'
import { PurchasementColumn } from '../purchasement/columns'
import { IncomeColumn, JPIncomeCategory } from '../income/columns'
import { ConsumptionColumn } from '../consumption/columns'
import {
  getTotalIncomeBetween,
  getTotalConsumptionBetween,
  getTotalPurchasementBetween,
} from './api'
import { useParams } from 'react-router'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  TimeScale
)

// チャートで使うフォントをルートのCSS変数 --font-doodle から取得（実行時）
const CHART_FONT_FAMILY =
  typeof window !== 'undefined'
    ? (
        getComputedStyle(document.documentElement).getPropertyValue('--font-doodle') ||
        'Arial, sans-serif'
      ).trim()
    : 'Arial, sans-serif'
ChartJS.defaults.font.family = CHART_FONT_FAMILY

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

  // チャート用トレンドデータ（週・月のみ）
  const [trendData, setTrendData] = useState<{
    dates: string[]
    purchases: number[]
    incomes: number[]
    consumptions: number[]
    balance: number[]
  }>({ dates: [], purchases: [], incomes: [], consumptions: [], balance: [] })

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

      // 消費記録データ取得
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

      // 週・月の場合はトレンドデータも生成
      if (pageType === 'weekly' || pageType === 'monthly') {
        generateTrendData(todayIncomes, todayExpenses, todayConsumptions, selectedDate, pageType)
      }
    } catch (error) {
      message.error('データの取得に失敗しました')
      console.error('Failed to fetch today summary:', error)
    } finally {
      setLoading(false)
    }
  }

  // トレンドデータを生成
  const generateTrendData = (
    incomes: IncomeColumn[],
    expenses: PurchasementColumn[],
    consumptions: ConsumptionColumn[],
    baseDate: Dayjs,
    type: string
  ) => {
    const range = getTypeDateRange(type, baseDate)
    const startDate = range.dateFrom
    const endDate = range.dateTo
    const days = endDate.diff(startDate, 'day') + 1

    // 日付ごとに集計
    const dateMap = new Map<string, { purchase: number; income: number; consumption: number }>()

    for (let i = 0; i < days; i++) {
      const date = startDate.add(i, 'day').format('YYYY-MM-DD')
      dateMap.set(date, { purchase: 0, income: 0, consumption: 0 })
    }

    expenses.forEach((p) => {
      const date = dayjs(p.purchaseDate).format('YYYY-MM-DD')
      if (dateMap.has(date)) {
        const current = dateMap.get(date)!
        current.purchase += p.totalPrice || 0
      }
    })

    incomes.forEach((i) => {
      const date = dayjs(i.incomeDate).format('YYYY-MM-DD')
      if (dateMap.has(date)) {
        const current = dateMap.get(date)!
        current.income += i.amount || 0
      }
    })

    consumptions.forEach((c) => {
      const date = dayjs(c.consumptionDate).format('YYYY-MM-DD')
      if (dateMap.has(date)) {
        const current = dateMap.get(date)!
        current.consumption += c.quantity * (c.purchasement?.totalPrice || 0)
      }
    })

    const dates: string[] = []
    const purchaseAmounts: number[] = []
    const incomeAmounts: number[] = []
    const consumptionAmounts: number[] = []
    const balances: number[] = []

    Array.from(dateMap.entries())
      .sort()
      .forEach(([date, data]) => {
        dates.push(date)
        purchaseAmounts.push(data.purchase)
        incomeAmounts.push(data.income)
        consumptionAmounts.push(data.consumption)
        balances.push(data.income - data.purchase)
      })

    setTrendData({
      dates,
      purchases: purchaseAmounts,
      incomes: incomeAmounts,
      consumptions: consumptionAmounts,
      balance: balances,
    })
  }

  useEffect(() => {
    fetchSummary(selectedDate)
  }, [selectedDate, pageType])

  // 日付選択ハンドラー
  const handleDateChange = (date: Dayjs | null) => {
    if (date) {
      setSelectedDate(date)
    }
  }

  // トレンドチャート設定
  const trendChartData: any = {
    labels: trendData.dates,
    datasets: [
      {
        type: 'bar' as const,
        label: '支出',
        data: trendData.purchases,
        backgroundColor: 'rgba(253, 121, 121, 0.4)',
        borderColor: 'rgb(253, 121, 121)',
        borderWidth: 1,
      },
      {
        type: 'bar' as const,
        label: '収入',
        data: trendData.incomes,
        backgroundColor: 'rgba(90, 178, 255, 0.4)',
        borderColor: 'rgb(90, 178, 255)',
        borderWidth: 1,
      },
      {
        type: 'bar' as const,
        label: '消費記録',
        data: trendData.consumptions,
        backgroundColor: 'rgba(170, 96, 200, 0.4)',
        borderColor: 'rgb(170, 96, 200)',
        borderWidth: 1,
      },
      {
        type: 'line' as const,
        label: '収支',
        data: trendData.balance,
        borderColor: 'rgb(82, 196, 26)',
        backgroundColor: 'rgba(82, 196, 26, 0.1)',
        tension: 0.3,
        yAxisID: 'y',
      },
    ],
  }

  const trendChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: { font: { family: CHART_FONT_FAMILY } },
      },
      title: {
        display: false,
        font: { family: CHART_FONT_FAMILY },
      },
    },
    scales: {
      x: {
        type: 'time' as const,
        time: {
          unit: 'day' as const,
          displayFormats: {
            day: 'DD',
          },
        },
        ticks: { font: { family: CHART_FONT_FAMILY } },
      },
      y: {
        beginAtZero: true,
        ticks: { font: { family: CHART_FONT_FAMILY } },
      },
    },
  }

  // カテゴリ別グラフで共通に使うカラーパレット
  const CATEGORY_COLORS = [
    'rgba(255, 99, 132, 0.4)',
    'rgba(54, 162, 235, 0.4)',
    'rgba(255, 206, 86, 0.4)',
    'rgba(75, 192, 192, 0.4)',
    'rgba(153, 102, 255, 0.4)',
    'rgba(255, 159, 64, 0.4)',
    'rgba(170, 96, 200, 0.4)',
    'rgba(217, 154, 222, 0.4)',
    'rgba(201, 129, 236, 0.4)',
    'rgba(155, 81, 224, 0.4)',
    'rgba(123, 63, 228, 0.4)',
    'rgba(98, 54, 255, 0.4)',
  ]

  // カテゴリ別支出円グラフ
  const categoryPurchaseData = () => {
    const categoryMap = new Map<string, number>()
    expenseDetails.forEach((p) => {
      const category = p.goods?.category?.categoryName || '未分類'
      categoryMap.set(category, (categoryMap.get(category) || 0) + (p.totalPrice || 0))
    })

    return {
      labels: Array.from(categoryMap.keys()),
      datasets: [
        {
          data: Array.from(categoryMap.values()),
          backgroundColor: CATEGORY_COLORS.slice(0, Array.from(categoryMap.keys()).length),
        },
      ],
    }
  }

  // カテゴリ別消費円グラフ
  const categoryConsumptionData = () => {
    const categoryMap = new Map<string, number>()
    consumptionDetails.forEach((c) => {
      const category = c.purchasement?.goods?.category?.categoryName || '未分類'
      const amount = c.quantity * (c.purchasement?.totalPrice || 0)
      categoryMap.set(category, (categoryMap.get(category) || 0) + amount)
    })

    return {
      labels: Array.from(categoryMap.keys()),
      datasets: [
        {
          data: Array.from(categoryMap.values()),
          backgroundColor: CATEGORY_COLORS.slice(0, Array.from(categoryMap.keys()).length),
        },
      ],
    }
  }

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: { font: { family: CHART_FONT_FAMILY } },
      },
    },
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
        {pageType === 'today' ? (
          <>
            {selectedDate.format('YYYY-MM-DD') == dayjs().format('YYYY-MM-DD') ? '今日' : '一日'}
            の収支 ({selectedDate.format('YYYY年MM月DD日')})
          </>
        ) : pageType === 'weekly' ? (
          <>
            {selectedDate.startOf('week').format('YYYY-MM-DD') ==
            dayjs().startOf('week').format('YYYY-MM-DD')
              ? '今週'
              : '週'}{' '}
            の収支 ({selectedDate.startOf('week').format('YYYY年MM月DD日')} 〜{' '}
            {selectedDate.endOf('week').format('YYYY年MM月DD日')})
          </>
        ) : (
          <>
            {selectedDate.startOf('month').format('YYYY-MM-DD') ==
            dayjs().startOf('month').format('YYYY-MM-DD')
              ? '今月'
              : '月'}{' '}
            の収支 ({selectedDate.startOf('month').format('YYYY年MM月DD日')} 〜{' '}
            {selectedDate.endOf('month').format('YYYY年MM月DD日')})
          </>
        )}
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
            {/* 支出 */}
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
            {/* 収入 */}
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
            {/* 消費 */}
            <Col
              xs={24}
              sm={6}
            >
              <Card style={{ background: 'linear-gradient(135deg, #AA60C8 0%, #D69ADE 100%)' }}>
                <Statistic
                  title={
                    <span style={{ color: 'white', fontSize: '16px' }}>
                      <ShoppingCartOutlined style={{ marginRight: '4px' }} />
                      消費
                    </span>
                  }
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
            {/* 収支 */}
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
                  title={
                    <span style={{ color: 'white', fontSize: '16px' }}>
                      <PayCircleOutlined style={{ marginRight: '4px' }} />
                      収支
                    </span>
                  }
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

          {/* チャート表示（週・月のみ） */}
          {(pageType === 'weekly' || pageType === 'monthly') && (
            <>
              {/* トレンドチャート */}
              <Card
                title={
                  <span>
                    <LineChartOutlined style={{ marginRight: '8px' }} />
                    {pageType === 'weekly' ? '週' : `${selectedDate.format('MM')}月`}収支トレンド
                  </span>
                }
                style={{ marginBottom: '16px' }}
              >
                <div style={{ height: '300px' }}>
                  <Bar
                    data={trendChartData}
                    options={trendChartOptions}
                  />
                </div>
              </Card>
            </>
          )}
          {/* 円グラフ */}
          <Row
            gutter={16}
            style={{ marginBottom: '16px' }}
          >
            <Col
              xs={24}
              md={12}
            >
              <Card
                title={
                  <span>
                    <PieChartOutlined style={{ marginRight: '8px' }} />
                    カテゴリ別支出
                  </span>
                }
              >
                <div style={{ height: '300px' }}>
                  {expenseDetails.length > 0 ? (
                    <Pie
                      data={categoryPurchaseData()}
                      options={pieChartOptions}
                    />
                  ) : (
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: '100%',
                        color: '#999',
                      }}
                    >
                      データがありません
                    </div>
                  )}
                </div>
              </Card>
            </Col>
            <Col
              xs={24}
              md={12}
            >
              <Card
                title={
                  <span>
                    <PieChartOutlined style={{ marginRight: '8px' }} />
                    カテゴリ別消費記録
                  </span>
                }
              >
                <div style={{ height: '300px' }}>
                  {consumptionDetails.length > 0 ? (
                    <Pie
                      data={categoryConsumptionData()}
                      options={pieChartOptions}
                    />
                  ) : (
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: '100%',
                        color: '#999',
                      }}
                    >
                      データがありません
                    </div>
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

          {/* 消費記録詳細 */}
          <Card
            title={
              <span>
                <ShoppingCartOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
                消費記録詳細
              </span>
            }
          >
            <List
              itemLayout="horizontal"
              dataSource={consumptionDetails}
              locale={{ emptyText: '消費記録データはありません' }}
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
