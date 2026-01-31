import { useState, useEffect } from 'react'
import { Card, DatePicker, Button, Space, Statistic, message, Row, Col, Tag, List } from 'antd'
import DoodlePopconfirm from '@/components/DoodlePopconfirm'
import {
  BookOutlined,
  DollarOutlined,
  RiseOutlined,
  FallOutlined,
  LeftOutlined,
  RightOutlined,
  DeleteOutlined,
  EditOutlined,
  ShoppingCartOutlined,
  PayCircleOutlined,
} from '@ant-design/icons'
import dayjs, { Dayjs } from 'dayjs'
import { deletePurchasement } from '../purchasement/api'
import {
  getTotalIncomeBetween,
  getTotalConsumptionBetween,
  getTotalPurchasementBetween,
} from './api'
import { PurchasementModal } from '../purchasement/index'
import { PurchasementColumn } from '../purchasement/columns'
import { deleteIncome } from '../income/api'
import { IncomeColumn, JPIncomeCategory } from '../income/columns'
import IncomeModal from '../income/IncomeModal'

import { deleteConsumption } from '../consumption/api'
import { ConsumptionColumn } from '../consumption/columns'
import { ConsumptionModal } from '../consumption/ConsumptionModal'
import PageHeader from '@/components/PageHeader'

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

  // 消費記録関連の状態
  const [totalConsumption, setTotalConsumption] = useState(0)
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

  // 指定日の支出記録を取得
  const fetchDailyPurchases = async (date: Dayjs) => {
    setLoading(true)
    try {
      const response = await getTotalPurchasementBetween({
        dateFrom: date.format('YYYY-MM-DD'),
        dateTo: date.format('YYYY-MM-DD'),
      })
      const dailyData: PurchasementColumn[] = response.data || []

      setDailyPurchases(dailyData)

      // 合計金額を計算
      const total = dailyData.reduce((sum, item) => sum + (item.totalPrice || 0), 0)
      setTotalAmount(total)
    } catch (error) {
      message.error('データの取得に失敗しました')
      console.error('支出記録取得失敗:', error)
    } finally {
      setLoading(false)
    }
  }

  // 収入データを取得（APIから）
  const fetchDailyIncomes = async (date: Dayjs) => {
    setLoading(true)
    try {
      const response = await getTotalIncomeBetween({
        dateFrom: date.format('YYYY-MM-DD'),
        dateTo: date.format('YYYY-MM-DD'),
      })
      const dailyData: IncomeColumn[] = response.data || []

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

  // 消費記録を取得
  const fetchDailyConsumptions = async (date: Dayjs) => {
    try {
      const response = await getTotalConsumptionBetween({
        dateFrom: date.format('YYYY-MM-DD'),
        dateTo: date.format('YYYY-MM-DD'),
      })
      const dailyData: ConsumptionColumn[] = response.data || []
      setDailyConsumptions(dailyData)

      // 合計金額を計算
      const total = dailyData.reduce(
        (sum, item) => sum + (item.quantity * item?.purchasement.totalPrice || 0),
        0
      )
      setTotalConsumption(total)
    } catch (error) {
      message.error('消費記録の取得に失敗しました')
      console.error('消費記録取得失敗:', error)
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

  /* 支出 */
  // 支出追加モーダルを開く
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

  // 支出記録保存成功時
  const handleSaveSuccess = () => {
    fetchDailyPurchases(selectedDate)
    handleCancel()
  }

  /* 収入 */
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

  /* 消費記録 */
  // 消費記録追加モーダルを開く
  const handleAddConsumption = () => {
    setIsConsumptionEditMode(false)
    setEditingConsumption(null)
    setIsConsumptionModalOpen(true)
  }

  // 消費記録編集モーダルを開く
  const handleEditConsumption = (record: ConsumptionColumn) => {
    setIsConsumptionEditMode(true)
    setEditingConsumption(record)
    setIsConsumptionModalOpen(true)
  }

  // 消費記録モーダルをキャンセル
  const handleConsumptionCancel = () => {
    setIsConsumptionModalOpen(false)
    setEditingConsumption(null)
  }

  // 消費記録保存成功時
  const handleConsumptionSuccess = () => {
    setIsConsumptionModalOpen(false)
    setEditingConsumption(null)
    fetchDailyConsumptions(selectedDate)
  }

  // 消費記録削除
  const handleDeleteConsumption = async (record: ConsumptionColumn) => {
    try {
      await deleteConsumption([record.id])
      message.success('消費記録を削除しました')
      fetchDailyConsumptions(selectedDate)
    } catch (error) {
      message.error('削除に失敗しました')
      console.error('削除エラー:', error)
    }
  }

  // 支出記録を削除
  const handleDelete = async (record: PurchasementColumn) => {
    try {
      await deletePurchasement([record.id])
      message.success('支出記録を削除しました')
      fetchDailyPurchases(selectedDate)
    } catch (error) {
      message.error('削除に失敗しました')
      console.error('削除エラー:', error)
    }
  }

  return (
    <div
      className="book-page-container"
      style={{
        display: 'flex',
      }}
    >
      <PageHeader title="1日の家計記入" />

      <div style={{ padding: '0 60px 50px', flex: 1, overflowY: 'auto' }}>
        {/* 日付選択カード */}
        <Row
          gutter={16}
          align="middle"
          style={{ margin: '20px 0' }}
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
                icon={<ShoppingCartOutlined />}
                onClick={handleAddConsumption}
              >
                消費記録を追加
              </Button>
            </Space>
          </Col>
        </Row>

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
                title={
                  <span style={{ color: 'white', fontSize: '16px' }}>
                    <FallOutlined style={{ marginRight: '4px' }} />
                    支出
                  </span>
                }
                value={totalAmount}
                precision={0}
                suffix="円"
                valueStyle={{ color: 'white', fontSize: '28px', fontWeight: 'bold' }}
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
                title={
                  <span style={{ color: 'white', fontSize: '16px' }}>
                    <RiseOutlined style={{ marginRight: '4px' }} />
                    収入
                  </span>
                }
                value={totalIncome}
                precision={0}
                suffix="円"
                valueStyle={{ color: 'white', fontSize: '28px', fontWeight: 'bold' }}
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
                title={
                  <span style={{ color: 'white', fontSize: '16px' }}>
                    <ShoppingCartOutlined style={{ marginRight: '4px' }} />
                    消費記録
                  </span>
                }
                value={totalAmount}
                precision={0}
                suffix="円"
                valueStyle={{ color: 'white', fontSize: '28px', fontWeight: 'bold' }}
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
                title={
                  <span style={{ color: 'white', fontSize: '16px' }}>
                    <PayCircleOutlined style={{ marginRight: '4px' }} />
                    収支
                  </span>
                }
                value={totalIncome - totalAmount}
                precision={0}
                suffix="円"
                valueStyle={{ color: 'white', fontSize: '28px', fontWeight: 'bold' }}
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
              <p>この日の支出記録はまだありません</p>
            </div>
          ) : (
            <List
              itemLayout="horizontal"
              dataSource={dailyPurchases}
              renderItem={(item) => (
                <List.Item
                  actions={[
                    <Button
                      type="link"
                      icon={<EditOutlined />}
                      onClick={() => handleEdit(item)}
                    >
                      編集
                    </Button>,
                    <DoodlePopconfirm
                      title="削除確認"
                      description={`「${item.goods?.goodsName || '不明'}」の支出記録を削除しますか？`}
                      onConfirm={() => handleDelete(item)}
                      okText="削除"
                      cancelText="キャンセル"
                      okButtonProps={{ danger: true }}
                    >
                      <Button
                        type="link"
                        danger
                        icon={<DeleteOutlined />}
                      >
                        削除
                      </Button>
                    </DoodlePopconfirm>,
                  ]}
                >
                  <List.Item.Meta
                    title={
                      <div>
                        <span style={{ fontSize: '16px', fontWeight: 'bold' }}>
                          {item.goods?.goodsName || '商品未設定'}
                        </span>
                        {item.store && (
                          <Tag
                            color="blue"
                            style={{ marginLeft: '8px' }}
                          >
                            {item.store.storeName}
                          </Tag>
                        )}
                        {item.paymentMethod && (
                          <Tag
                            color="green"
                            style={{ marginLeft: '4px' }}
                          >
                            {item.paymentMethod}
                          </Tag>
                        )}
                      </div>
                    }
                    description={
                      <div style={{ marginTop: '8px' }}>
                        <div>
                          数量: {item.quantity} {item.quantityUnit} × 単価: {item.unitPrice}{' '}
                          {item.priceUnit}
                        </div>
                        {item.description && (
                          <div style={{ marginTop: '4px', color: '#666' }}>
                            メモ: {item.description}
                          </div>
                        )}
                      </div>
                    }
                  />
                  <div
                    style={{
                      fontSize: '20px',
                      fontWeight: 'bold',
                      color: '#cf1322',
                      minWidth: '120px',
                      textAlign: 'right',
                    }}
                  >
                    ¥{item.totalPrice.toLocaleString()}
                  </div>
                </List.Item>
              )}
            />
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
            <List
              itemLayout="horizontal"
              dataSource={dailyIncomes}
              renderItem={(item) => (
                <List.Item
                  actions={[
                    <Button
                      type="link"
                      icon={<EditOutlined />}
                      onClick={() => handleEditIncome(item)}
                    >
                      編集
                    </Button>,
                    <DoodlePopconfirm
                      title="削除確認"
                      description={`「${JPIncomeCategory[item.category as keyof typeof JPIncomeCategory] || '不明'}」の収入記録を削除しますか？`}
                      onConfirm={() => handleDeleteIncome(item)}
                      okText="削除"
                      cancelText="キャンセル"
                      okButtonProps={{ danger: true }}
                    >
                      <Button
                        type="link"
                        danger
                        icon={<DeleteOutlined />}
                      >
                        削除
                      </Button>
                    </DoodlePopconfirm>,
                  ]}
                >
                  <List.Item.Meta
                    title={
                      <div>
                        <span style={{ fontSize: '16px', fontWeight: 'bold' }}>
                          {JPIncomeCategory[item.category as keyof typeof JPIncomeCategory] || '-'}
                        </span>
                        <Tag
                          color="green"
                          style={{ marginLeft: '8px' }}
                        >
                          収入
                        </Tag>
                      </div>
                    }
                    description={
                      item.description ? (
                        <div style={{ marginTop: '4px', color: '#666' }}>
                          メモ: {item.description}
                        </div>
                      ) : null
                    }
                  />
                  <div
                    style={{
                      fontSize: '20px',
                      fontWeight: 'bold',
                      color: '#52c41a',
                      minWidth: '120px',
                      textAlign: 'right',
                    }}
                  >
                    +{item.amount.toLocaleString()} 円
                  </div>
                </List.Item>
              )}
            />
          )}
        </Card>

        {/* 消費記録リスト */}
        <Card
          title="消費記録一覧"
          extra={
            <Button
              type="default"
              variant="filled"
              color="purple"
              icon={<ShoppingCartOutlined />}
              onClick={handleAddConsumption}
            >
              消費記録を追加
            </Button>
          }
        >
          {dailyConsumptions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 0', color: '#999' }}>
              <ShoppingCartOutlined style={{ fontSize: '32px', marginBottom: '8px' }} />
              <p>この日の消費記録はまだありません</p>
            </div>
          ) : (
            <List
              itemLayout="horizontal"
              dataSource={dailyConsumptions}
              renderItem={(item) => (
                <List.Item
                  actions={[
                    <Button
                      type="link"
                      icon={<EditOutlined />}
                      onClick={() => handleEditConsumption(item)}
                    >
                      編集
                    </Button>,
                    <DoodlePopconfirm
                      title="削除確認"
                      description={`「${item.purchasement?.goods?.goodsName || '不明'}」の消費記録を削除しますか？`}
                      onConfirm={() => handleDeleteConsumption(item)}
                      okText="削除"
                      cancelText="キャンセル"
                      okButtonProps={{ danger: true }}
                    >
                      <Button
                        type="link"
                        danger
                        icon={<DeleteOutlined />}
                      >
                        削除
                      </Button>
                    </DoodlePopconfirm>,
                  ]}
                >
                  <List.Item.Meta
                    title={
                      <div>
                        <span style={{ fontSize: '16px', fontWeight: 'bold' }}>
                          {item.purchasement?.goods?.goodsName || '商品未設定'}
                        </span>
                        {item.purchasement?.store && (
                          <Tag
                            color="blue"
                            style={{ marginLeft: '8px' }}
                          >
                            {item.purchasement.store.storeName}
                          </Tag>
                        )}
                        {item.purchasement?.goods?.brand && (
                          <Tag
                            color="purple"
                            style={{ marginLeft: '4px' }}
                          >
                            {item.purchasement.goods.brand.brandName}
                          </Tag>
                        )}
                      </div>
                    }
                    description={
                      <div style={{ marginTop: '8px' }}>
                        <div>
                          使用量: {item.quantity} {item.quantityUnit}
                        </div>
                        <div style={{ color: '#666', marginTop: '4px' }}>
                          購入日: {dayjs(item.purchasement?.purchaseDate).format('YYYY年MM月DD日')}
                        </div>
                        {item.description && (
                          <div style={{ marginTop: '4px', color: '#666' }}>
                            メモ: {item.description}
                          </div>
                        )}
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          )}
        </Card>
      </div>

      {/* 支出記録追加・編集モーダル */}
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
        isAdd={!isIncomeEditMode}
        record={editingIncome}
        initialDate={selectedDate}
        onCancel={handleIncomeCancel}
        onSuccess={handleIncomeSuccess}
      />

      {/* 消費記録追加・編集モーダル */}
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
