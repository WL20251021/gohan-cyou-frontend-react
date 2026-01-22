import { useState, useEffect } from 'react'
import {
  Card,
  DatePicker,
  Button,
  Form,
  InputNumber,
  Select,
  Input,
  Space,
  List,
  Statistic,
  message,
  Row,
  Col,
  Tag,
  Modal,
  Popconfirm,
} from 'antd'
import BookModal from '../../components/BookModal'
import {
  DeleteOutlined,
  EditOutlined,
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
import { getIncomes, addIncome, updateIncome, deleteIncome } from './income/api'
import { IncomeColumn, INCOME_METHODS, AMOUNT_UNITS } from './income/columns'
import { getCategories } from './category/api'
import { getConsumptions, deleteConsumption } from './consumption/api'
import { ConsumptionColumn } from './consumption/columns'
import { ConsumptionModal } from './consumption/ConsumptionModal'

// 収入のデータ型はIncomeColumnを使用

export default function DailyPurchasementPage() {
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs())
  const [loading, setLoading] = useState(false)
  const [dailyPurchases, setDailyPurchases] = useState<PurchasementColumn[]>([])
  const [totalAmount, setTotalAmount] = useState(0)
  const [categories, setCategories] = useState<Array<any>>([])

  // 収入関連の状態
  const [dailyIncomes, setDailyIncomes] = useState<IncomeColumn[]>([])
  const [totalIncome, setTotalIncome] = useState(0)
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false)
  const [isIncomeEditMode, setIsIncomeEditMode] = useState(false)
  const [editingIncome, setEditingIncome] = useState<IncomeColumn | null>(null)
  const [incomeForm] = Form.useForm<IncomeColumn>()

  // 使用記録関連の状態
  const [dailyConsumptions, setDailyConsumptions] = useState<ConsumptionColumn[]>([])
  const [isConsumptionModalOpen, setIsConsumptionModalOpen] = useState(false)
  const [isConsumptionEditMode, setIsConsumptionEditMode] = useState(false)
  const [editingConsumption, setEditingConsumption] = useState<ConsumptionColumn | null>(null)

  // モーダル関連の状態
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingRecord, setEditingRecord] = useState<PurchasementColumn | null>(null)

  // 初期データ取得
  useEffect(() => {
    fetchCategories()
  }, [])

  // 日付が変更されたときにデータを取得
  useEffect(() => {
    fetchDailyPurchases(selectedDate)
    fetchDailyIncomes(selectedDate)
    fetchDailyConsumptions(selectedDate)
  }, [selectedDate])

  // カテゴリデータ取得
  const fetchCategories = async () => {
    try {
      const res = await getCategories()
      setCategories(res?.data || [])
    } catch (error) {
      console.error('カテゴリデータ取得失敗:', error)
    }
  }

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
      const response = await getConsumptions()
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
  // DEBUG: 編集ボタン押下時、ウェブページが固まる
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
  }

  // 収入追加モーダルを開く
  const handleAddIncome = () => {
    setIsIncomeEditMode(false)
    setEditingIncome(null)
    incomeForm.resetFields()
    incomeForm.setFieldsValue({
      incomeDate: selectedDate,
      amount: 0,
      amountUnit: '円',
    })
    setIsIncomeModalOpen(true)
  }

  // 収入編集モーダルを開く
  const handleEditIncome = (record: IncomeColumn) => {
    setIsIncomeEditMode(true)
    setEditingIncome(record)
    incomeForm.setFieldsValue({
      ...record,
      incomeDate: record.incomeDate ? dayjs(record.incomeDate) : selectedDate,
    })
    setIsIncomeModalOpen(true)
  }

  // 収入モーダルをキャンセル
  const handleIncomeCancel = () => {
    setIsIncomeModalOpen(false)
    incomeForm.resetFields()
    setEditingIncome(null)
  }

  // 収入を保存
  const handleSaveIncome = async () => {
    try {
      const values = await incomeForm.validateFields()
      const data = {
        ...values,
        incomeDate: values.incomeDate ? dayjs(values.incomeDate).format('YYYY-MM-DD') : null,
      }

      if (isIncomeEditMode && editingIncome) {
        await updateIncome(editingIncome.id, data as Partial<IncomeColumn>)
        message.success('収入を更新しました')
      } else {
        await addIncome(data as Partial<IncomeColumn>)
        message.success('収入を追加しました')
      }

      setIsIncomeModalOpen(false)
      incomeForm.resetFields()
      fetchDailyIncomes(selectedDate)
    } catch (error: any) {
      if (error.errorFields) {
        message.error('入力内容を確認してください')
      } else {
        message.error('保存に失敗しました')
        console.error('保存エラー:', error)
      }
    }
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
    <div style={{ padding: '1rem', backgroundColor: '#f0f2f5', minHeight: '100%' }}>
      <h1 style={{ marginBottom: '1rem', fontSize: '1.2rem', fontWeight: 'bold' }}>
        <BookOutlined style={{ marginRight: '8px' }} />
        1日の家計記入
      </h1>

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
            <div style={{ marginTop: '8px', color: 'rgba(255, 255, 255, 0.9)', fontSize: '14px' }}>
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
            <div style={{ marginTop: '8px', color: 'rgba(255, 255, 255, 0.9)', fontSize: '14px' }}>
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
            <div style={{ marginTop: '8px', color: 'rgba(255, 255, 255, 0.9)', fontSize: '14px' }}>
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
            <div style={{ marginTop: '8px', color: 'rgba(255, 255, 255, 0.9)', fontSize: '14px' }}>
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
                  <Popconfirm
                    title="削除確認"
                    description={`「${item.goods?.goodsName || '不明'}」の購入記録を削除しますか？`}
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
                  </Popconfirm>,
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
                  <Popconfirm
                    title="削除確認"
                    description={`「${item.category?.categoryName || '不明'}」の収入記録を削除しますか？`}
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
                  </Popconfirm>,
                ]}
              >
                <List.Item.Meta
                  title={
                    <div>
                      <span style={{ fontSize: '16px', fontWeight: 'bold' }}>
                        {item.category?.categoryName || '-'}
                      </span>
                      <Tag
                        color="green"
                        style={{ marginLeft: '8px' }}
                      >
                        収入
                      </Tag>
                      {item.method && (
                        <Tag
                          color="blue"
                          style={{ marginLeft: '4px' }}
                        >
                          {item.method}
                        </Tag>
                      )}
                    </div>
                  }
                  description={
                    item.note ? (
                      <div style={{ marginTop: '4px', color: '#666' }}>メモ: {item.note}</div>
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
                  +{item.amount.toLocaleString()} {item.amountUnit}
                </div>
              </List.Item>
            )}
          />
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
                  <Popconfirm
                    title="削除確認"
                    description={`「${item.purchasement?.goods?.goodsName || '不明'}」の使用記録を削除しますか？`}
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
                  </Popconfirm>,
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
                          {item.purchasement.store.name}
                        </Tag>
                      )}
                      {item.purchasement?.brand && (
                        <Tag
                          color="purple"
                          style={{ marginLeft: '4px' }}
                        >
                          {item.purchasement.brand.name}
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
                      {item.note && (
                        <div style={{ marginTop: '4px', color: '#666' }}>メモ: {item.note}</div>
                      )}
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Card>

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
      <BookModal
        title={isIncomeEditMode ? '収入を編集' : '収入を追加'}
        open={isIncomeModalOpen}
        onOk={handleSaveIncome}
        onCancel={handleIncomeCancel}
        // width={500}
        okText="保存"
        cancelText="キャンセル"
      >
        <Form
          form={incomeForm}
          layout="vertical"
          style={{ marginTop: '1rem' }}
        >
          <Form.Item
            label="収入日"
            name="incomeDate"
            rules={[{ required: true, message: '収入日を選択してください' }]}
          >
            <DatePicker
              style={{ width: '100%' }}
              format="YYYY年MM月DD日"
            />
          </Form.Item>

          <Form.Item
            label="カテゴリ"
            name="categoryId"
            rules={[{ required: true, message: 'カテゴリを選択してください' }]}
          >
            <Select
              allowClear
              placeholder="カテゴリを選択"
              showSearch
              optionFilterProp="label"
              options={categories.map((item) => ({
                label: item.jpName,
                value: item.id,
              }))}
            />
          </Form.Item>

          <Form.Item
            label="金額"
            required={true}
          >
            <Space.Compact style={{ width: '100%' }}>
              <Form.Item
                name="amount"
                noStyle
                rules={[{ required: true, message: '金額を入力してください' }]}
              >
                <InputNumber
                  min={0}
                  step={1}
                  style={{ width: '70%' }}
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => (Number(value?.replace(/,/g, '')) || 0) as 0}
                />
              </Form.Item>
              <Form.Item
                name="amountUnit"
                noStyle
              >
                <Select
                  style={{ width: '30%' }}
                  options={Object.entries(AMOUNT_UNITS).map(([_, value]) => ({
                    label: value,
                    value: value,
                  }))}
                />
              </Form.Item>
            </Space.Compact>
          </Form.Item>

          <Form.Item
            label="受取方法"
            name="method"
          >
            <Select
              allowClear
              placeholder="受取方法を選択（任意）"
              options={Object.entries(INCOME_METHODS).map(([_, value]) => ({
                label: value,
                value: value,
              }))}
            />
          </Form.Item>

          <Form.Item
            label="メモ"
            name="note"
          >
            <Input.TextArea
              rows={3}
              allowClear
              placeholder="メモを入力（任意）"
            />
          </Form.Item>
        </Form>
      </BookModal>

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
