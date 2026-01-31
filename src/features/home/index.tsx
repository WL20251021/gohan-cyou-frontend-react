import { useState, useEffect } from 'react'
import { Card, Row, Col, Spin, message, Button } from 'antd'
import {
  RiseOutlined,
  FallOutlined,
  ShoppingCartOutlined,
  CalendarOutlined,
  AccountBookOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router'
import dayjs from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import { getPurchasements } from '../budget/purchasement/api'
import { PurchasementColumn } from '../budget/purchasement/columns'
import { getIncomes } from '../budget/income/api'
import { IncomeColumn } from '../budget/income/columns'

dayjs.extend(isoWeek)
dayjs.extend(isSameOrAfter)
dayjs.extend(isSameOrBefore)

interface Summary {
  income: number
  expense: number
  balance: number
  count: number
}

interface DashboardData {
  today: Summary
  week: Summary
  month: Summary
}

interface CategoryData {
  categoryName: string
  amount: number
  count: number
  percentage: number
  color: string
}

export default function HomePage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    today: { income: 0, expense: 0, balance: 0, count: 0 },
    week: { income: 0, expense: 0, balance: 0, count: 0 },
    month: { income: 0, expense: 0, balance: 0, count: 0 },
  })
  const [expenseByCategory, setExpenseByCategory] = useState<CategoryData[]>([])
  const [incomeByCategory, setIncomeByCategory] = useState<CategoryData[]>([])

  const today = dayjs()
  const weekStart = today.startOf('isoWeek')
  const weekEnd = today.endOf('isoWeek')
  const monthStart = today.startOf('month')
  const monthEnd = today.endOf('month')

  // ダッシュボードデータを取得
  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      // 収入データ取得
      const incomeResponse = await getIncomes()
      const incomeData: IncomeColumn[] = incomeResponse.data || []

      // 支出データ取得
      const expenseResponse = await getPurchasements()
      const expenseData: PurchasementColumn[] = expenseResponse.data || []

      // 今日の集計
      const todayIncomes = incomeData.filter((item) => {
        if (!item.incomeDate) return false
        return dayjs(item.incomeDate).isSame(today, 'day')
      })
      const todayExpenses = expenseData.filter((item) => {
        if (!item.purchaseDate) return false
        return dayjs(item.purchaseDate).isSame(today, 'day')
      })
      const todayIncome = todayIncomes.reduce((sum, item) => sum + (item.amount || 0), 0)
      const todayExpense = todayExpenses.reduce((sum, item) => sum + (item.totalPrice || 0), 0)

      // 今週の集計
      const weekIncomes = incomeData.filter((item) => {
        if (!item.incomeDate) return false
        const date = dayjs(item.incomeDate)
        return date.isSameOrAfter(weekStart, 'day') && date.isSameOrBefore(weekEnd, 'day')
      })
      const weekExpenses = expenseData.filter((item) => {
        if (!item.purchaseDate) return false
        const date = dayjs(item.purchaseDate)
        return date.isSameOrAfter(weekStart, 'day') && date.isSameOrBefore(weekEnd, 'day')
      })
      const weekIncome = weekIncomes.reduce((sum, item) => sum + (item.amount || 0), 0)
      const weekExpense = weekExpenses.reduce((sum, item) => sum + (item.totalPrice || 0), 0)

      // 今月の集計
      const monthIncomes = incomeData.filter((item) => {
        if (!item.incomeDate) return false
        return dayjs(item.incomeDate).isSame(today, 'month')
      })
      const monthExpenses = expenseData.filter((item) => {
        if (!item.purchaseDate) return false
        return dayjs(item.purchaseDate).isSame(today, 'month')
      })
      const monthIncome = monthIncomes.reduce((sum, item) => sum + (item.amount || 0), 0)
      const monthExpense = monthExpenses.reduce((sum, item) => sum + (item.totalPrice || 0), 0)

      // カテゴリ別の支出を集計（今月）
      const expenseCategoryMap = new Map<string, { amount: number; count: number }>()
      monthExpenses.forEach((item) => {
        const categoryName = (item as any).category?.categoryName || '未分類'
        const current = expenseCategoryMap.get(categoryName) || { amount: 0, count: 0 }
        expenseCategoryMap.set(categoryName, {
          amount: current.amount + (item.totalPrice || 0),
          count: current.count + 1,
        })
      })

      const colors = ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#13c2c2', '#eb2f96']
      const expenseCategories: CategoryData[] = Array.from(expenseCategoryMap.entries())
        .map(([categoryName, data], index) => ({
          categoryName,
          amount: data.amount,
          count: data.count,
          percentage: monthExpense > 0 ? (data.amount / monthExpense) * 100 : 0,
          color: colors[index % colors.length],
        }))
        .sort((a, b) => b.amount - a.amount)
      setExpenseByCategory(expenseCategories)

      // カテゴリ別の収入を集計（今月）
      const incomeCategoryMap = new Map<string, { amount: number; count: number }>()
      monthIncomes.forEach((item) => {
        const categoryName = (item as any).category?.categoryName || '未分類'
        const current = incomeCategoryMap.get(categoryName) || { amount: 0, count: 0 }
        incomeCategoryMap.set(categoryName, {
          amount: current.amount + (item.amount || 0),
          count: current.count + 1,
        })
      })

      const incomeCategories: CategoryData[] = Array.from(incomeCategoryMap.entries())
        .map(([categoryName, data], index) => ({
          categoryName,
          amount: data.amount,
          count: data.count,
          percentage: monthIncome > 0 ? (data.amount / monthIncome) * 100 : 0,
          color: colors[index % colors.length],
        }))
        .sort((a, b) => b.amount - a.amount)
      setIncomeByCategory(incomeCategories)

      setDashboardData({
        today: {
          income: todayIncome,
          expense: todayExpense,
          balance: todayIncome - todayExpense,
          count: todayIncomes.length + todayExpenses.length,
        },
        week: {
          income: weekIncome,
          expense: weekExpense,
          balance: weekIncome - weekExpense,
          count: weekIncomes.length + weekExpenses.length,
        },
        month: {
          income: monthIncome,
          expense: monthExpense,
          balance: monthIncome - monthExpense,
          count: monthIncomes.length + monthExpenses.length,
        },
      })
    } catch (error) {
      message.error('データの取得に失敗しました')
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const SummaryCard = ({
    title,
    data,
    period,
    icon,
    color,
    onClick,
  }: {
    title: string
    data: Summary
    period: string
    icon: React.ReactNode
    color: string
    onClick?: () => void
  }) => (
    <Card
      hoverable={!!onClick}
      onClick={onClick}
      style={{
        cursor: onClick ? 'pointer' : 'default',
        border: 'var(--border-doodle)',
        boxShadow: 'var(--shadow-doodle)',
        borderRadius: 'var(--radius-doodle)',
        background: '#fff',
        transform: 'rotate(' + (Math.random() * 2 - 1) + 'deg)',
      }}
      bodyStyle={{ padding: '20px' }}
    >
      <div
        style={{
          marginBottom: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: '20px',
            color: 'var(--color-ink-black)',
            fontFamily: 'var(--font-doodle)',
          }}
        >
          {icon} <span style={{ marginLeft: '8px' }}>{title}</span>
        </h3>
        <div
          style={{
            fontSize: '14px',
            color: 'var(--color-ink-black)',
            background: 'var(--color-active-yellow)',
            padding: '2px 8px',
            borderRadius: '15px 2px',
            border: 'var(--border-doodle)',
            fontWeight: 'bold',
          }}
        >
          {period}
        </div>
      </div>

      <Row gutter={[12, 12]}>
        <Col span={12}>
          <div
            style={{
              textAlign: 'center',
              padding: '12px',
              background: 'var(--color-sky-blue)',
              borderRadius: 'var(--radius-doodle-sm)',
              border: 'var(--border-doodle)',
            }}
          >
            <div
              style={{ fontSize: '14px', color: '#fff', marginBottom: '4px', fontWeight: 'bold' }}
            >
              <RiseOutlined /> 収入
            </div>
            <div
              style={{
                fontSize: '18px',
                fontWeight: 'bold',
                color: '#fff',
                fontFamily: 'var(--font-doodle)',
              }}
            >
              {data.income.toLocaleString()}円
            </div>
          </div>
        </Col>
        <Col span={12}>
          <div
            style={{
              textAlign: 'center',
              padding: '12px',
              background: 'var(--color-candy-pink)',
              borderRadius: 'var(--radius-doodle-sm)',
              border: 'var(--border-doodle)',
            }}
          >
            <div
              style={{ fontSize: '14px', color: '#fff', marginBottom: '4px', fontWeight: 'bold' }}
            >
              <FallOutlined /> 支出
            </div>
            <div
              style={{
                fontSize: '18px',
                fontWeight: 'bold',
                color: '#fff',
                fontFamily: 'var(--font-doodle)',
              }}
            >
              {data.expense.toLocaleString()}円
            </div>
          </div>
        </Col>
      </Row>

      <div
        style={{
          marginTop: '16px',
          padding: '12px',
          background:
            data.balance === 0
              ? 'var(--color-pencil-gray)'
              : data.balance > 0
                ? 'var(--color-grass-green)'
                : 'var(--color-sunset-orange)',
          borderRadius: 'var(--radius-doodle)',
          textAlign: 'center',
          border: 'var(--border-doodle)',
          boxShadow: 'inset 2px 2px 0px rgba(0,0,0,0.1)',
        }}
      >
        <div style={{ fontSize: '16px', color: '#fff', marginBottom: '4px', fontWeight: 800 }}>
          収支
        </div>
        <div
          style={{
            fontSize: '28px',
            fontWeight: 800,
            color: '#fff',
            textShadow: '2px 2px 0px rgba(0,0,0,0.2)',
            fontFamily: 'var(--font-doodle)',
          }}
        >
          {data.balance >= 0 ? '+' : ''}
          {data.balance.toLocaleString()}円
        </div>
        <div style={{ marginTop: '4px', color: '#fff', fontSize: '14px', fontWeight: 'bold' }}>
          <span>
            {data.balance >= 0 ? '黒字' : '赤字'} {data.count}件
          </span>
        </div>
      </div>
    </Card>
  )

  return (
    <div style={{ padding: '24px', backgroundColor: 'transparent' }}>
      {/* ヘッダー */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h1
            style={{
              fontSize: '48px',
              fontWeight: '900',
              margin: 0,
              fontFamily: 'var(--font-doodle)',
              color: 'var(--color-ink-black)',
              textShadow: '3px 3px 0px rgba(0,0,0,0.1)',
              transform: 'rotate(-2deg)',
            }}
          >
            <AccountBookOutlined style={{ marginRight: '12px', color: 'var(--color-sky-blue)' }} />
            家計簿ダッシュボード
          </h1>
          <Button
            size="large"
            style={{
              marginTop: '40px',
              border: 'var(--border-doodle)',
              boxShadow: 'var(--shadow-button)',
              fontWeight: 'bold',
              borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px',
              background: '#fff',
              transform: 'rotate(3deg)',
            }}
            onClick={() => navigate('/budget/summary')}
          >
            今日の家計を記入しよう
          </Button>
        </div>
        <p
          style={{
            color: 'var(--color-text-secondary)',
            marginTop: '8px',
            fontSize: '18px',
            fontFamily: 'var(--font-doodle)',
            fontWeight: 'bold',
          }}
        >
          {today.format('YYYY年MM月DD日')} のデータ
        </p>
      </div>

      <Spin spinning={loading}>
        {/* サマリーカード */}
        <Row
          gutter={[16, 16]}
          style={{ marginBottom: '24px' }}
        >
          <Col
            xs={24}
            md={8}
          >
            <SummaryCard
              title="今日"
              data={dashboardData.today}
              period={today.format('MM月DD日')}
              icon={<CalendarOutlined />}
              color="#1890ff"
              onClick={() => navigate('/budget/summary/today')}
            />
          </Col>
          <Col
            xs={24}
            md={8}
          >
            <SummaryCard
              title="今週"
              data={dashboardData.week}
              period={`${weekStart.format('MM/DD')} - ${weekEnd.format('MM/DD')}`}
              icon={<CalendarOutlined />}
              color="#52c41a"
              onClick={() => navigate('/budget/summary/weekly')}
            />
          </Col>
          <Col
            xs={24}
            md={8}
          >
            <SummaryCard
              title="今月"
              data={dashboardData.month}
              period={today.format('YYYY年MM月')}
              icon={<CalendarOutlined />}
              color="#faad14"
              onClick={() => navigate('/budget/summary/monthly')}
            />
          </Col>
        </Row>

        {/* クイックアクション */}
        <Card
          title={
            <span
              style={{
                fontFamily: 'var(--font-doodle)',
                fontSize: '22px',
                fontWeight: 'bold',
                color: 'var(--color-ink-black)',
              }}
            >
              クイックアクション
            </span>
          }
          style={{
            border: 'var(--border-doodle)',
            boxShadow: 'var(--shadow-doodle)',
            borderRadius: 'var(--radius-doodle)',
            background: '#fff',
            transform: 'rotate(0.5deg)',
          }}
          headStyle={{ borderBottom: 'var(--border-doodle)' }}
        >
          <Row gutter={[16, 16]}>
            <Col
              xs={24}
              sm={12}
              md={6}
            >
              <Button
                size="large"
                block
                icon={<AccountBookOutlined />}
                onClick={() => navigate('/budget/summary')}
                style={{
                  border: 'var(--border-doodle)',
                  height: '50px',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  background: '#fff',
                  color: 'var(--color-ink-black)',
                  boxShadow: 'var(--shadow-button)',
                  fontFamily: 'var(--font-doodle)',
                  borderRadius: '15px 225px 15px 255px / 255px 15px 225px 15px',
                }}
              >
                家計記入
              </Button>
            </Col>
            <Col
              xs={24}
              sm={12}
              md={6}
            >
              <Button
                size="large"
                block
                icon={<RiseOutlined />}
                onClick={() => navigate('/budget/income')}
                style={{
                  border: 'var(--border-doodle)',
                  height: '50px',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  background: 'var(--color-sky-blue)',
                  color: '#fff',
                  boxShadow: 'var(--shadow-button)',
                  fontFamily: 'var(--font-doodle)',
                  borderRadius: '15px 255px 15px 225px / 225px 15px 255px 15px',
                }}
              >
                収入管理
              </Button>
            </Col>
            <Col
              xs={24}
              sm={12}
              md={6}
            >
              <Button
                size="large"
                block
                icon={<FallOutlined />}
                onClick={() => navigate('/budget/purchasement')}
                style={{
                  border: 'var(--border-doodle)',
                  height: '50px',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  background: 'var(--color-candy-pink)',
                  color: '#fff',
                  boxShadow: 'var(--shadow-button)',
                  fontFamily: 'var(--font-doodle)',
                  borderRadius: '225px 15px 255px 15px / 15px 225px 15px 255px',
                }}
              >
                支出管理
              </Button>
            </Col>
            <Col
              xs={24}
              sm={12}
              md={6}
            >
              <Button
                size="large"
                block
                icon={<ShoppingCartOutlined />}
                onClick={() => navigate('/budget/consumption')}
                style={{
                  border: 'var(--border-doodle)',
                  height: '50px',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  background: 'var(--color-spring-green)',
                  backgroundColor: '#9b59b6' /* Amethyst */,
                  color: '#fff',
                  boxShadow: 'var(--shadow-button)',
                  fontFamily: 'var(--font-doodle)',
                  borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px',
                }}
              >
                消費管理
              </Button>
            </Col>
          </Row>
        </Card>
      </Spin>
    </div>
  )
}
