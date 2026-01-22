import { useState, useEffect } from 'react'
import { Card, DatePicker, Button, Space, Statistic, message, Row, Col, Tag } from 'antd'
import {
  BookOutlined,
  DollarOutlined,
  RiseOutlined,
  FallOutlined,
  LeftOutlined,
  RightOutlined,
} from '@ant-design/icons'
import dayjs, { Dayjs } from 'dayjs'
import { getPurchasements, deletePurchasement } from './purchasement/api'
import { PurchasementModal } from './purchasement/index'
import { PurchasementColumn } from './purchasement/columns'
import { getIncomes, deleteIncome } from './income/api'
import { IncomeColumn, JPIncomeCategory } from './income/columns'
import IncomeModal from './income/IncomeModal'

import { getConsumption, deleteConsumption } from './consumption/api'
import { ConsumptionColumn } from './consumption/columns'
import { ConsumptionModal } from './consumption/ConsumptionModal'
import PageHeader from '../../components/PageHeader'
import DoodleCard, { DoodleCardRow } from '../../components/DoodleCard'

export default function DailyPurchasementPage() {
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs())
  const [loading, setLoading] = useState(false)
  const [dailyPurchases, setDailyPurchases] = useState<PurchasementColumn[]>([])
  const [totalAmount, setTotalAmount] = useState(0)

  // 収入関連の状態
  const [dailyIncomes, setDailyIncomes] = useState<IncomeColumn[]>([])
  const [totalIncome, setTotalIncome] = useState(0)
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false)
  const [isIncomeEditMode, setIsIncomeEditMode] = useState(false)
  const [editingIncome, setEditingIncome] = useState<IncomeColumn | null>(null)

  // 使用記録関連の状態
  const [dailyConsumptions, setDailyConsumptions] = useState<ConsumptionColumn[]>([])
  const [isConsumptionModalOpen, setIsConsumptionModalOpen] = useState(false)
  const [isConsumptionEditMode, setIsConsumptionEditMode] = useState(false)
  const [editingConsumption, setEditingConsumption] = useState<ConsumptionColumn | null>(null)

  // モーダル関連の状態
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingRecord, setEditingRecord] = useState<PurchasementColumn | null>(null)

  // 日付が変更されたときにデータを取得
  useEffect(() => {
    fetchDailyPurchases(selectedDate)
    fetchDailyIncomes(selectedDate)
    fetchDailyConsumptions(selectedDate)
  }, [selectedDate])

  // 指定日の購入記録を取得
  const fetchDailyPurchases = async (date: Dayjs) => {
    setLoading(true)
    try {
      const response = await getPurchasements()
      const allPurchases: PurchasementColumn[] = response.data || []

      // 選択された日付の購入記録のみフィルター
      const dailyData = allPurchases.filter((item) => {
        if (!item.purchaseDate) return false
        return dayjs(item.purchaseDate).isSame(date, 'day')
      })

      setDailyPurchases(dailyData)

      // 合計金額を計算
      const total = dailyData.reduce((sum, item) => sum + (item.totalPrice || 0), 0)
      setTotalAmount(total)
    } catch (error) {
      message.error('データの取得に失敗しました')
      console.error('購入記録取得失敗:', error)
    } finally {
      setLoading(false)
    }
  }

  // 収入データを取得（APIから）
  const fetchDailyIncomes = async (date: Dayjs) => {
    setLoading(true)
    try {
      const response = await getIncomes()
      const allIncomes: IncomeColumn[] = response.data || []

      // 選択された日付の収入記録のみフィルター
      const dailyData = allIncomes.filter((item) => {
        if (!item.incomeDate) return false
        return dayjs(item.incomeDate).isSame(date, 'day')
      })

      setDailyIncomes(dailyData)

      // 合計金額を計算
      const total = dailyData.reduce((sum, item) => sum + (item.amount || 0), 0)
      setTotalIncome(total)
    } catch (error) {
      message.error('収入データの取得に失敗しました')
      console.error('収入データ取得失敗:', error)
      setDailyIncomes([])
      setTotalIncome(0)
    } finally {
      setLoading(false)
    }
  }

  // 使用記録を取得
  const fetchDailyConsumptions = async (date: Dayjs) => {
    try {
      const response = await getConsumption()
      const allConsumptions: ConsumptionColumn[] = response.data || []

      // 選択された日付の使用記録のみフィルター
      const dailyData = allConsumptions.filter((item) => {
        if (!item.consumptionDate) return false
        return dayjs(item.consumptionDate).isSame(date, 'day')
      })

      setDailyConsumptions(dailyData)
    } catch (error) {
      message.error('使用記録の取得に失敗しました')
      console.error('使用記録取得失敗:', error)
      setDailyConsumptions([])
    }
  }

  // 日付変更ハンドラー
  const handleDateChange = (date: Dayjs | null) => {
    if (date) {
      setSelectedDate(date)
    }
  }

  // 前日へ移動
  const handlePreviousDay = () => {
    setSelectedDate(selectedDate.subtract(1, 'day'))
  }

  // 翌日へ移動
  const handleNextDay = () => {
    setSelectedDate(selectedDate.add(1, 'day'))
  }

  // 新規追加モーダルを開く
  const handleAddPurchasement = () => {
    setIsEditMode(false)
    setEditingRecord(null)
    setIsModalOpen(true)
  }

  // 編集モーダルを開く
  const handleEdit = (record: PurchasementColumn) => {
    setIsEditMode(true)
    setEditingRecord(record)
    setIsModalOpen(true)
  }

  // モーダルをキャンセル
  const handleCancel = () => {
    setIsModalOpen(false)
    setEditingRecord(null)
  }

  // 購入記録保存成功時
  const handleSaveSuccess = () => {
    fetchDailyPurchases(selectedDate)
    handleCancel()
  }

  // 収入追加モーダルを開く
  const handleAddIncome = () => {
    setIsIncomeEditMode(false)
    setEditingIncome(null)
    setIsIncomeModalOpen(true)
  }

  // 収入編集モーダルを開く
  const handleEditIncome = (record: IncomeColumn) => {
    setIsIncomeEditMode(true)
    setEditingIncome(record)
    setIsIncomeModalOpen(true)
  }

  // 収入モーダルをキャンセル
  const handleIncomeCancel = () => {
    setIsIncomeModalOpen(false)
    setEditingIncome(null)
  }

  // 収入保存成功
  const handleIncomeSuccess = () => {
    handleIncomeCancel()
    fetchDailyIncomes(selectedDate)
  }

  // 収入を削除
  const handleDeleteIncome = async (record: IncomeColumn) => {
    try {
      await deleteIncome([record.id])
      message.success('収入を削除しました')
      fetchDailyIncomes(selectedDate)
    } catch (error) {
      message.error('削除に失敗しました')
      console.error('削除エラー:', error)
    }
  }

  // 使用記録追加モーダルを開く
  const handleAddConsumption = () => {
    setIsConsumptionEditMode(false)
    setEditingConsumption(null)
    setIsConsumptionModalOpen(true)
  }

  // 使用記録編集モーダルを開く
  const handleEditConsumption = (record: ConsumptionColumn) => {
    setIsConsumptionEditMode(true)
    setEditingConsumption(record)
    setIsConsumptionModalOpen(true)
  }

  // 使用記録モーダルをキャンセル
  const handleConsumptionCancel = () => {
    setIsConsumptionModalOpen(false)
    setEditingConsumption(null)
  }

  // 使用記録保存成功時
  const handleConsumptionSuccess = () => {
    setIsConsumptionModalOpen(false)
    setEditingConsumption(null)
    fetchDailyConsumptions(selectedDate)
  }

  // 使用記録削除
  const handleDeleteConsumption = async (record: ConsumptionColumn) => {
    try {
      await deleteConsumption([record.id])
      message.success('使用記録を削除しました')
      fetchDailyConsumptions(selectedDate)
    } catch (error) {
      message.error('削除に失敗しました')
      console.error('削除エラー:', error)
    }
  }

  // 購入記録を削除
  const handleDelete = async (record: PurchasementColumn) => {
    try {
      await deletePurchasement([record.id])
      message.success('購入記録を削除しました')
      fetchDailyPurchases(selectedDate)
    } catch (error) {
      message.error('削除に失敗しました')
      console.error('削除エラー:', error)
    }
  }

  return (
    <div className="book-page-container">
      <PageHeader
        title="1日の家計記入"
        // onAdd is removed because we have multiple add buttons below
      />

      <div className="book-page-content">
        {/* 日付選択カード */}
        <Card style={{ marginBottom: '1rem' }}>
          <Row
            gutter={16}
            align="middle"
          >
            <Col
              flex="auto"
              style={{ display: 'flex', alignItems: 'center', gap: '16px' }}
            >
              <span style={{ fontWeight: 'bold', fontSize: '16px' }}>記入日:</span>
              <Button
                icon={<LeftOutlined />}
                onClick={handlePreviousDay}
                title="前日"
              />
              <DatePicker
                value={selectedDate}
                onChange={handleDateChange}
                format="YYYY年MM月DD日"
                style={{ width: '200px' }}
                allowClear={false}
              />
              <Button
                icon={<RightOutlined />}
                onClick={handleNextDay}
                title="翌日"
              />
            </Col>
            <Col>
              <Space>
                <Button
                  type="default"
                  variant="filled"
                  color="danger"
                  icon={<FallOutlined />}
                  onClick={handleAddPurchasement}
                >
                  支出を追加
                </Button>
                <Button
                  type="default"
                  variant="filled"
                  color="primary"
                  icon={<RiseOutlined />}
                  onClick={handleAddIncome}
                >
                  収入を追加
                </Button>
                <Button
                  type="default"
                  variant="filled"
                  color="purple"
                  icon={<BookOutlined />}
                  onClick={handleAddConsumption}
                >
                  使用記録を追加
                </Button>
              </Space>
            </Col>
          </Row>
        </Card>

        {/* 収支サマリーカード */}
        <Row
          gutter={16}
          style={{ marginBottom: '1rem' }}
        >
          {/* 支出 */}
          <Col
            xs={24}
            md={6}
          >
            <Card style={{ background: 'linear-gradient(135deg, #FD7979 0%, #FDACAC 100%)' }}>
              <Statistic
                title={<span style={{ color: 'white', fontSize: '16px' }}>支出</span>}
                value={totalAmount}
                precision={0}
                suffix="円"
                valueStyle={{ color: 'white', fontSize: '28px', fontWeight: 'bold' }}
                prefix={<FallOutlined />}
              />
              <div
                style={{ marginTop: '8px', color: 'rgba(255, 255, 255, 0.9)', fontSize: '14px' }}
              >
                {dailyPurchases.length}件
              </div>
            </Card>
          </Col>
          {/* 収入 */}
          <Col
            xs={24}
            md={6}
          >
            <Card style={{ background: 'linear-gradient(135deg, #5AB2FF 0%, #A0DEFF 100%)' }}>
              <Statistic
                title={<span style={{ color: 'white', fontSize: '16px' }}>収入</span>}
                value={totalIncome}
                precision={0}
                suffix="円"
                valueStyle={{ color: 'white', fontSize: '28px', fontWeight: 'bold' }}
                prefix={<RiseOutlined />}
              />
              <div
                style={{ marginTop: '8px', color: 'rgba(255, 255, 255, 0.9)', fontSize: '14px' }}
              >
                {dailyIncomes.length}件
              </div>
            </Card>
          </Col>
          {/* 使用 */}
          <Col
            xs={24}
            md={6}
          >
            <Card style={{ background: 'linear-gradient(135deg, #AA60C8 0%, #D69ADE 100%)' }}>
              <Statistic
                title={<span style={{ color: 'white', fontSize: '16px' }}>使用記録</span>}
                value={dailyConsumptions.length}
                precision={0}
                valueStyle={{ color: 'white', fontSize: '28px', fontWeight: 'bold' }}
                prefix={<BookOutlined />}
              />
              <div
                style={{ marginTop: '8px', color: 'rgba(255, 255, 255, 0.9)', fontSize: '14px' }}
              >
                {dailyConsumptions.length}件
              </div>
            </Card>
          </Col>
          {/* 収支 */}
          <Col
            xs={24}
            md={6}
          >
            <Card
              style={{
                background:
                  totalIncome - totalAmount === 0
                    ? 'linear-gradient(135deg, #4c4c53 0%, #828584 100%)'
                    : totalIncome - totalAmount > 0
                      ? 'linear-gradient(135deg, #5AB2FF 0%, #A0DEFF 100%)'
                      : 'linear-gradient(135deg, #FD8A6B 0%, #FDACAC 100%)',
              }}
            >
              <Statistic
                title={<span style={{ color: 'white', fontSize: '16px' }}>収支</span>}
                value={totalIncome - totalAmount}
                precision={0}
                suffix="円"
                valueStyle={{ color: 'white', fontSize: '28px', fontWeight: 'bold' }}
                prefix={<DollarOutlined />}
              />
              <div
                style={{ marginTop: '8px', color: 'rgba(255, 255, 255, 0.9)', fontSize: '14px' }}
              >
                {totalIncome - totalAmount >= 0 ? '黒字' : '赤字'}
              </div>
            </Card>
          </Col>
        </Row>

        {/* 支出記録リスト */}
        <Card
          title="支出記録一覧"
          loading={loading}
          style={{ marginBottom: '1rem' }}
          extra={
            <Button
              type="default"
              variant="filled"
              color="danger"
              icon={<FallOutlined />}
              onClick={handleAddPurchasement}
            >
              支出を追加
            </Button>
          }
        >
          {dailyPurchases.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 0', color: '#999' }}>
              <FallOutlined style={{ fontSize: '32px', marginBottom: '8 px' }} />
              <p>この日の購入記録はまだありません</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {dailyPurchases.map((item) => (
                <DoodleCard
                  key={item.id}
                  id={item.id}
                  title={item.goods?.goodsName || '商品未設定'}
                  onEdit={() => handleEdit(item)}
                  onDelete={() => handleDelete(item)}
                  clickable={false}
                >
                  <DoodleCardRow
                    label="店舗"
                    value={item.store?.storeName || '-'}
                  />
                  <DoodleCardRow
                    label="金額"
                    value={`¥${item.totalPrice.toLocaleString()}`}
                    valueStyle={{ color: '#cf1322', fontWeight: 'bold' }}
                  />
                  <DoodleCardRow
                    label="詳細"
                    value={`${item.quantity}${item.quantityUnit} @${item.unitPrice}${item.priceUnit}`}
                  />
                  {item.paymentMethod && (
                    <DoodleCardRow
                      label="支払"
                      value={item.paymentMethod}
                    />
                  )}
                  {item.description && (
                    <DoodleCardRow
                      label="メモ"
                      value={item.description}
                    />
                  )}
                </DoodleCard>
              ))}
            </div>
          )}
        </Card>

        {/* 収入記録リスト */}
        <Card
          title="収入記録一覧"
          style={{ marginBottom: '1rem' }}
          extra={
            <Button
              type="default"
              variant="filled"
              color="primary"
              icon={<RiseOutlined />}
              onClick={handleAddIncome}
            >
              収入を追加
            </Button>
          }
        >
          {dailyIncomes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 0', color: '#999' }}>
              <RiseOutlined style={{ fontSize: '32px', marginBottom: '8px' }} />
              <p>この日の収入記録はまだありません</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {dailyIncomes.map((item) => (
                <DoodleCard
                  key={item.id}
                  id={item.id}
                  title={JPIncomeCategory[item.category as keyof typeof JPIncomeCategory] || '収入'}
                  onEdit={() => handleEditIncome(item)}
                  onDelete={() => handleDeleteIncome(item)}
                  clickable={false}
                >
                  <DoodleCardRow
                    label="金額"
                    value={`+${item.amount.toLocaleString()} 円`}
                    valueStyle={{ color: '#52c41a', fontWeight: 'bold' }}
                  />
                  {item.description && (
                    <DoodleCardRow
                      label="メモ"
                      value={item.description}
                    />
                  )}
                </DoodleCard>
              ))}
            </div>
          )}
        </Card>

        {/* 使用記録リスト */}
        <Card
          title="使用記録一覧"
          extra={
            <Button
              type="default"
              variant="filled"
              color="purple"
              icon={<BookOutlined />}
              onClick={handleAddConsumption}
            >
              使用記録を追加
            </Button>
          }
        >
          {dailyConsumptions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 0', color: '#999' }}>
              <BookOutlined style={{ fontSize: '32px', marginBottom: '8px' }} />
              <p>この日の使用記録はまだありません</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {dailyConsumptions.map((item) => (
                <DoodleCard
                  key={item.id}
                  id={item.id}
                  title={item.purchasement?.goods?.goodsName || '商品未設定'}
                  onEdit={() => handleEditConsumption(item)}
                  onDelete={() => handleDeleteConsumption(item)}
                  clickable={false}
                >
                  <DoodleCardRow
                    label="店舗"
                    value={item.purchasement?.store?.name || '-'}
                  />
                  <DoodleCardRow
                    label="使用量"
                    value={`${item.quantity} ${item.quantityUnit}`}
                  />
                  {item.description && (
                    <DoodleCardRow
                      label="メモ"
                      value={item.description}
                    />
                  )}
                </DoodleCard>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* 購入記録追加・編集モーダル */}
      <PurchasementModal
        open={isModalOpen}
        isEditMode={isEditMode}
        editingRecord={editingRecord}
        initialDate={selectedDate}
        onCancel={handleCancel}
        onSuccess={handleSaveSuccess}
      />

      {/* 収入追加・編集モーダル */}
      <IncomeModal
        open={isIncomeModalOpen}
        isEditMode={isIncomeEditMode}
        editingRecord={editingIncome}
        initialDate={selectedDate}
        onCancel={handleIncomeCancel}
        onSuccess={handleIncomeSuccess}
      />

      {/* 使用記録追加・編集モーダル */}
      <ConsumptionModal
        open={isConsumptionModalOpen}
        isEditMode={isConsumptionEditMode}
        editingRecord={editingConsumption}
        initialDate={selectedDate}
        onCancel={handleConsumptionCancel}
        onSuccess={handleConsumptionSuccess}
      />
    </div>
  )
}
