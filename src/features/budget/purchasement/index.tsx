import { useState, useEffect } from 'react'
import {
  Flex,
  Table,
  Button,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  notification,
  message,
  DatePicker,
  Row,
  Col,
  Radio,
  Checkbox,
} from 'antd'
import dayjs from 'dayjs'
import BookModal from '../../../components/BookModal'
import PageHeader from '../../../components/PageHeader'
import DoodleCard, { DoodleCardRow } from '../../../components/DoodleCard'
import {
  PurchasementColumn,
  JPNames,
  QUANTITY_UNITS,
  PAYMENT_METHODS,
  TAX_CATEGORIES,
  TAX_CATEGORY_NAMES,
  type DiscountType,
  DISCOUNT_TYPES,
  DISCOUNT_TYPE_NAMES,
} from './columns'
import { getPurchasements, addPurchasement, updatePurchasement, deletePurchasement } from './api'
import { getGoods } from '../goods/api'
import { getStores } from '../store/api'
import { GoodsAddModal } from '../goods/index'
import { StoreAddModal } from '../store/index'

// 購入記録追加・編集モーダルコンポーネント（他のコンポーネントから使用可能）
export function PurchasementModal({
  open,
  isEditMode = false,
  editingRecord = null,
  initialDate,
  onCancel,
  onSuccess,
}: {
  open: boolean
  isEditMode?: boolean
  editingRecord?: PurchasementColumn | null
  initialDate?: any
  onCancel: () => void
  onSuccess?: () => void
}) {
  const [form] = Form.useForm<PurchasementColumn>()
  const [confirmLoading, setConfirmLoading] = useState(false)
  const [goods, setGoods] = useState<Array<any>>([])
  const [stores, setStores] = useState<Array<any>>([])
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false)
  const [isGoodsModalOpen, setIsGoodsModalOpen] = useState(false)
  // 税率表示用
  const [taxRateDisplay, setTaxRateDisplay] = useState<number>(10)
  // 値引き
  const [discountType, setDiscountType] = useState<DiscountType>(DISCOUNT_TYPES.FIXED)

  // モーダルが開いたときにデータを取得・設定
  useEffect(() => {
    if (open) {
      fetchGoods()
      fetchStores()
      if (isEditMode && editingRecord) {
        // 編集モード時は既存データをフォームに設定
        typeof editingRecord.taxAmount === 'string' &&
          (editingRecord.taxAmount = parseFloat(editingRecord.taxAmount))
        typeof editingRecord.discountAmount === 'string' &&
          (editingRecord.discountAmount = parseFloat(editingRecord.discountAmount))

        form.setFieldsValue({
          ...editingRecord,
          purchaseDate: editingRecord.purchaseDate ? dayjs(editingRecord.purchaseDate) : null,
          discountType: editingRecord.discountType || DISCOUNT_TYPES.FIXED,
          goodsId: editingRecord.goods?.id || null,
          storeId: editingRecord.store?.id || null,
        })
        setDiscountType(editingRecord.discountType || DISCOUNT_TYPES.FIXED)
      } else {
        form.resetFields()
        // 新規追加時は初期日付を設定
        if (initialDate) {
          form.setFieldsValue({
            purchaseDate: initialDate,
          })
        }
      }
    }
  }, [open, isEditMode, editingRecord, initialDate, form])

  // 商品データ取得
  function fetchGoods() {
    getGoods()
      .then((res) => {
        setGoods(res?.data || [])
      })
      .catch((error) => {
        console.error(error)
      })
  }

  // 店舗データ取得
  function fetchStores() {
    getStores()
      .then((res) => {
        setStores(res?.data || [])
      })
      .catch((error) => {
        console.error(error)
      })
  }

  // 購入記録を保存
  function handleSave() {
    setConfirmLoading(true)
    form
      .validateFields()
      .then((values) => {
        const data = {
          ...values,
          purchaseDate: values.purchaseDate
            ? dayjs(values.purchaseDate).format('YYYY-MM-DD')
            : null,
        }
        if (isEditMode && editingRecord) {
          return updatePurchasement(editingRecord.id, data as Partial<PurchasementColumn>)
        } else {
          return addPurchasement(data as Partial<PurchasementColumn>)
        }
      })
      .then(() => {
        form.resetFields()
        message.success(isEditMode ? '購入記録を更新しました' : '購入記録を追加しました')
        setConfirmLoading(false)
        if (onSuccess) {
          onSuccess()
        }
        onCancel()
      })
      .catch((error) => {
        setConfirmLoading(false)
        if (error.errorFields) {
          message.error('入力内容を確認してください')
        } else {
          console.error(error)
          notification.error({
            title: isEditMode ? '購入記録更新失敗' : '購入記録追加失敗',
            description: error.message,
            placement: 'bottomRight',
            showProgress: true,
            pauseOnHover: true,
          })
        }
      })
  }

  // 店舗追加モーダルを開く
  const handleAddStore = () => {
    setIsStoreModalOpen(true)
  }

  // 店舗追加モーダルをキャンセル
  const handleStoreCancel = () => {
    setIsStoreModalOpen(false)
  }

  // 店舗追加成功時
  const handleStoreSuccess = async (newStore: any) => {
    await fetchStores()
    form.setFieldValue('storeId', newStore.id)
  }

  // 商品追加モーダルを開く
  const handleAddGoods = () => {
    setIsGoodsModalOpen(true)
  }

  // 商品追加モーダルをキャンセル
  const handleGoodsCancel = () => {
    setIsGoodsModalOpen(false)
  }

  // 商品追加成功時
  const handleGoodsSuccess = async (newGoods: any) => {
    await fetchGoods()
    form.setFieldValue('goodsId', newGoods.id)
  }

  // 合計金額を計算
  function calculateTotalPrice() {
    const quantity = form.getFieldValue('quantity') || 0
    const unitPrice = form.getFieldValue('unitPrice') || 0
    let totalPrice = quantity * unitPrice
    // 税金
    const isTaxIncluded = form.getFieldValue('isTaxIncluded')
    const taxAmount = totalPrice * (taxRateDisplay / 100)
    totalPrice += isTaxIncluded ? 0 : taxAmount
    form.setFieldValue('taxAmount', taxAmount)
    // setTaxAmount(taxAmount)
    // 値引き
    const discountType = form.getFieldValue('discountType')
    const discountRate = form.getFieldValue('discountRate') || 0
    const discount =
      discountType === DISCOUNT_TYPES.PERCENTAGE
        ? (discountRate * totalPrice) / 100
        : form.getFieldValue('discountAmount') || 0
    // setDiscountAmount(discount)
    form.setFieldValue('discountAmount', discount)
    totalPrice -= discount
    // 最終合計金額
    form.setFieldValue('totalPrice', totalPrice)
    // setTotalPrice(totalPrice)
  }

  // 税率変更時
  function handleTaxRateChange() {
    switch (form.getFieldValue('taxRate')) {
      case TAX_CATEGORIES.STANDARD:
        setTaxRateDisplay(10) // 日本の標準税率は10%
        break
      case TAX_CATEGORIES.REDUCED:
        setTaxRateDisplay(8) // 日本の軽減税率は8%
        break
      default:
        setTaxRateDisplay(0) // 非課税・不課税・免税は税率0%
    }
    calculateTotalPrice()
  }

  // 値引き種類変更時
  function changeDiscountType() {
    setDiscountType(form.getFieldValue('discountType'))
    form.setFieldValue('discountAmount', 0)
    calculateTotalPrice()
  }

  return (
    <>
      <BookModal
        title={isEditMode ? '購入記録を編集' : '購入記録を追加'}
        // width="50%"
        // maskClosable={false}
        open={open}
        confirmLoading={confirmLoading}
        onOk={handleSave}
        onCancel={onCancel}
        okText="保存"
        cancelText="キャンセル"
      >
        <Form
          form={form}
          className="p-8"
          labelCol={{ span: 3 }}
          wrapperCol={{ span: 21 }}
          layout="horizontal"
          initialValues={{
            quantityUnit: '個',
            quantity: 1,
            unitPrice: 0,
            totalPrice: 0,
            purchaseDate: dayjs(),
            taxRate: TAX_CATEGORIES.STANDARD,
            taxAmount: 0,
            isTaxIncluded: true,
            paymentMethod: null,
            // 割引
            discountType: DISCOUNT_TYPES.FIXED,
            discountRate: 0,
            discountAmount: 0,
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label={JPNames.purchaseDate}
                name="purchaseDate"
                labelCol={{ span: 6 }}
                wrapperCol={{ span: 18 }}
              >
                <DatePicker
                  style={{ width: '100%' }}
                  format="YYYY年MM月DD日"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              {isEditMode && (
                <Form.Item
                  label={JPNames.id}
                  name="id"
                  labelCol={{ span: 6 }}
                  wrapperCol={{ span: 18 }}
                >
                  <Input disabled />
                </Form.Item>
              )}
            </Col>
          </Row>
          <Form.Item label={JPNames.goods}>
            <Space.Compact style={{ width: '100%' }}>
              <Form.Item
                name="goodsId"
                rules={[{ required: true, message: '商品を選択してください' }]}
                noStyle
              >
                <Select
                  allowClear
                  placeholder="商品を選択"
                  showSearch
                  optionFilterProp="label"
                  style={{ width: 'calc(100% - 80px)' }}
                  options={goods.map((item) => ({
                    label: item.goodsName,
                    value: item.id,
                  }))}
                />
              </Form.Item>
              <Button
                type="primary"
                icon={<i className="i-material-symbols:add"></i>}
                onClick={handleAddGoods}
              >
                新規
              </Button>
            </Space.Compact>
          </Form.Item>
          <Form.Item label={JPNames.store}>
            <Space.Compact style={{ width: '100%' }}>
              <Form.Item
                name="storeId"
                noStyle
              >
                <Select
                  allowClear
                  placeholder="店舗を選択（任意）"
                  showSearch
                  optionFilterProp="label"
                  style={{ width: 'calc(100% - 80px)' }}
                  options={stores.map((item) => ({
                    label: item.storeName,
                    value: item.id,
                  }))}
                />
              </Form.Item>
              <Button
                type="primary"
                icon={<i className="i-material-symbols:add"></i>}
                onClick={handleAddStore}
              >
                新規
              </Button>
            </Space.Compact>
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label={JPNames.quantity}
                labelCol={{ span: 6 }}
                wrapperCol={{ span: 18 }}
              >
                <Space.Compact style={{ width: '100%' }}>
                  <Form.Item
                    name="quantity"
                    noStyle
                    rules={[{ required: true, message: '数量を入力してください!' }]}
                  >
                    <InputNumber
                      min={0}
                      step={1}
                      style={{ width: '70%' }}
                      onChange={calculateTotalPrice}
                    />
                  </Form.Item>
                  <Form.Item
                    name="quantityUnit"
                    noStyle
                  >
                    <Select
                      style={{ width: '30%' }}
                      options={Object.entries(QUANTITY_UNITS).map(([key, value]) => ({
                        label: value,
                        value: value,
                      }))}
                    />
                  </Form.Item>
                </Space.Compact>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label={JPNames.unitPrice}
                labelCol={{ span: 6 }}
                wrapperCol={{ span: 18 }}
              >
                <Space.Compact style={{ width: '100%' }}>
                  <Form.Item
                    name="unitPrice"
                    noStyle
                    rules={[{ required: true, message: '単価を入力してください!' }]}
                  >
                    <InputNumber
                      min={0}
                      step={1}
                      style={{ width: '70%' }}
                      addonAfter="円"
                      onChange={calculateTotalPrice}
                    />
                  </Form.Item>
                </Space.Compact>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Row
                gutter={16}
                justify="space-around"
              >
                <Form.Item
                  name="isTaxIncluded"
                  labelCol={{ span: 0 }}
                  wrapperCol={{ span: 24 }}
                >
                  <Radio.Group
                    optionType="button"
                    buttonStyle="solid"
                    onChange={calculateTotalPrice}
                  >
                    <Radio value={true}>税込（内税）</Radio>
                    <Radio value={false}>税抜（外税）</Radio>
                  </Radio.Group>
                </Form.Item>
              </Row>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label={JPNames.taxRate}
                name="taxRate"
                labelCol={{ span: 6 }}
                wrapperCol={{ span: 18 }}
              >
                <Select
                  allowClear
                  placeholder="課税区分を選択（任意）"
                  options={Object.entries(TAX_CATEGORY_NAMES).map(([key, value]) => ({
                    label: value,
                    value: key,
                  }))}
                  onChange={handleTaxRateChange}
                />
              </Form.Item>
            </Col>
            <Col span={12}>税率：{taxRateDisplay}%</Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="taxAmount"
                label={JPNames.taxAmount}
                labelCol={{ span: 6 }}
                wrapperCol={{ span: 18 }}
              >
                <InputNumber
                  min={0}
                  step={1}
                  precision={2}
                  style={{ width: '100%' }}
                  placeholder="自動計算されます"
                  addonAfter="円"
                  disabled={true}
                />
              </Form.Item>
            </Col>
            <Col span={12}></Col>
          </Row>
          {/* 値引きや割引 */}
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label={JPNames.discountType}
                name="discountType"
                labelCol={{ span: 6 }}
                wrapperCol={{ span: 18 }}
              >
                <Radio.Group onChange={changeDiscountType}>
                  {Object.entries(DISCOUNT_TYPE_NAMES).map(([key, value]) => (
                    <Radio
                      key={key}
                      value={key}
                    >
                      {value}
                    </Radio>
                  ))}
                </Radio.Group>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label={JPNames.discountAmount}
                name="discountAmount"
                labelCol={{ span: 6 }}
                wrapperCol={{ span: 18 }}
              >
                {/* TODO: Readonlyのスタイルを調整 */}
                <InputNumber
                  min={0}
                  step={1}
                  precision={0}
                  style={{ width: '100%' }}
                  placeholder={
                    discountType === DISCOUNT_TYPES.PERCENTAGE
                      ? '自動計算されます'
                      : '値引き額を入力（任意）'
                  }
                  addonAfter="円"
                  onChange={calculateTotalPrice}
                  disabled={discountType === DISCOUNT_TYPES.PERCENTAGE}
                />
              </Form.Item>
            </Col>
          </Row>
          {discountType === DISCOUNT_TYPES.PERCENTAGE && (
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label={JPNames.discountRate}
                  name="discountRate"
                  labelCol={{ span: 6 }}
                  wrapperCol={{ span: 18 }}
                >
                  <InputNumber
                    min={0}
                    max={100}
                    step={1}
                    style={{ width: '100%' }}
                    placeholder="割引率を入力（任意）"
                    addonAfter="%"
                    onChange={calculateTotalPrice}
                  />
                </Form.Item>
              </Col>
              <Col span={12}></Col>
            </Row>
          )}
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="totalPrice"
                label={JPNames.totalPrice}
                labelCol={{ span: 6 }}
                wrapperCol={{ span: 18 }}
              >
                <InputNumber
                  min={0}
                  step={1}
                  precision={0}
                  style={{ width: '100%' }}
                  placeholder="自動計算されます"
                  addonAfter="円"
                  onChange={calculateTotalPrice}
                  disabled={true}
                />
              </Form.Item>
            </Col>
            <Col span={12}></Col>
          </Row>
          <Form.Item
            label={JPNames.paymentMethod}
            name="paymentMethod"
          >
            <Select
              allowClear
              placeholder="支払い方法を選択（任意）"
              options={Object.entries(PAYMENT_METHODS).map(([key, value]) => ({
                label: value,
                value: value,
              }))}
            />
          </Form.Item>
          <Form.Item
            label={JPNames.description}
            name="description"
          >
            <Input.TextArea
              rows={3}
              allowClear
              placeholder="メモを入力（任意）"
            />
          </Form.Item>
        </Form>
      </BookModal>

      {/* 店舗追加モーダル */}
      <StoreAddModal
        open={isStoreModalOpen}
        onCancel={handleStoreCancel}
        onSuccess={handleStoreSuccess}
      />

      {/* 商品追加モーダル */}
      <GoodsAddModal
        open={isGoodsModalOpen}
        onCancel={handleGoodsCancel}
        onSuccess={handleGoodsSuccess}
      />
    </>
  )
}

export default function Purchasement() {
  // テーブルデータとカラム定義
  const [data, setData] = useState<Array<PurchasementColumn>>([])
  const [tableLoading, setTableLoading] = useState<boolean>(false)
  const [goods, setGoods] = useState<Array<any>>([])
  const [stores, setStores] = useState<Array<any>>([])

  const columns: Array<any> = [
    {
      title: JPNames.id,
      dataIndex: 'id',
      key: 'id',
      width: 80,
      onCell: () => ({ 'data-label': JPNames.id }),
    },
    {
      title: JPNames.purchaseDate,
      dataIndex: 'purchaseDate',
      key: 'purchaseDate',
      render: (date: string | null) => (date ? dayjs(date).format('YYYY-MM-DD') : '-'),
      sorter: (a: PurchasementColumn, b: PurchasementColumn) => {
        const dateA = a.purchaseDate ? new Date(a.purchaseDate).getTime() : 0
        const dateB = b.purchaseDate ? new Date(b.purchaseDate).getTime() : 0
        return dateA - dateB
      },
      onCell: () => ({ 'data-label': JPNames.purchaseDate }),
    },
    {
      title: JPNames.goods,
      dataIndex: 'goods',
      key: 'goods',
      render: (goods: any) => goods?.goodsName || '-',
      onCell: () => ({ 'data-label': JPNames.goods }),
    },
    {
      title: JPNames.store,
      dataIndex: 'store',
      key: 'store',
      render: (store: any) => store?.storeName || '-',
      onCell: () => ({ 'data-label': JPNames.store }),
    },
    {
      title: JPNames.quantity,
      dataIndex: 'quantity',
      key: 'quantity',
      render: (quantity: number, record: PurchasementColumn) =>
        `${quantity} ${record.quantityUnit}`,
      onCell: () => ({ 'data-label': JPNames.quantity }),
    },
    {
      title: JPNames.unitPrice,
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      render: (price: number) => `${price} 円`,
      onCell: () => ({ 'data-label': JPNames.unitPrice }),
    },
    {
      title: JPNames.totalPrice,
      dataIndex: 'totalPrice',
      key: 'totalPrice',
      render: (price: number) => `${price} 円`,
      onCell: () => ({ 'data-label': JPNames.totalPrice }),
    },
    {
      title: JPNames.paymentMethod,
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
      render: (method: string | null) => method || '-',
      onCell: () => ({ 'data-label': JPNames.paymentMethod }),
    },
    {
      title: JPNames.taxRate,
      dataIndex: 'taxRate',
      key: 'taxRate',
      render: (category: string | null) =>
        category ? TAX_CATEGORY_NAMES[category as keyof typeof TAX_CATEGORY_NAMES] : '-',
      onCell: () => ({ 'data-label': JPNames.taxRate }),
    },
    {
      title: JPNames.taxAmount,
      dataIndex: 'taxAmount',
      key: 'taxAmount',
      render: (amount: number | null) => (amount !== null ? `${amount}円` : '-'),
      onCell: () => ({ 'data-label': JPNames.taxAmount }),
    },
    {
      title: JPNames.isTaxIncluded,
      dataIndex: 'isTaxIncluded',
      key: 'isTaxIncluded',
      render: (isTaxIncluded: boolean | null) => {
        if (isTaxIncluded === null) return '-'
        return isTaxIncluded ? '税込（内税）' : '税抜（外税）'
      },
      onCell: () => ({ 'data-label': JPNames.isTaxIncluded }),
    },
    {
      title: JPNames.discountType,
      dataIndex: 'discountType',
      key: 'discountType',
      render: (type: string | null) =>
        type ? DISCOUNT_TYPE_NAMES[type as keyof typeof DISCOUNT_TYPE_NAMES] : '-',
      onCell: () => ({ 'data-label': JPNames.discountType }),
    },
    {
      title: JPNames.discountRate,
      dataIndex: 'discountRate',
      key: 'discountRate',
      render: (rate: number | null) => (rate !== null ? `${rate}%` : '-'),
      onCell: () => ({ 'data-label': JPNames.discountRate }),
    },
    {
      title: JPNames.discountAmount,
      dataIndex: 'discountAmount',
      key: 'discountAmount',
      render: (amount: number | null) => (amount !== null ? `${amount}円` : '-'),
      onCell: () => ({ 'data-label': JPNames.discountAmount }),
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right' as const,
      width: 150,
      render: (_: any, record: PurchasementColumn) => (
        <Space size="middle">
          <a>
            <i className="i-material-symbols:edit-document-outline-rounded hover:material-symbols:edit-document-rounded "></i>
            編集
          </a>
          <a onClick={() => handleDeletePurchasement(record)}>
            <i className="i-material-symbols:delete-outline-rounded hover:i-material-symbols:delete-rounded "></i>
            削除
          </a>
        </Space>
      ),
    },
  ]

  // データの取得
  useEffect(() => {
    fetchPurchasements()
    fetchGoods()
    fetchStores()
  }, [])

  // 購入記録データ取得
  function fetchPurchasements() {
    getPurchasements()
      .then((res) => {
        setData(res?.data || [])
      })
      .catch((error) => {
        console.error(error)
        notification.error({
          title: '購入記録データ取得失敗',
          description: error.message,
          placement: 'bottomRight',
          showProgress: true,
          pauseOnHover: true,
        })
      })
  }

  // 商品データ取得
  function fetchGoods() {
    getGoods()
      .then((res) => {
        setGoods(res?.data || [])
      })
      .catch((error) => {
        console.error(error)
      })
  }

  // 店舗データ取得
  function fetchStores() {
    getStores()
      .then((res) => {
        setStores(res?.data || [])
      })
      .catch((error) => {
        console.error(error)
      })
  }

  const toggleSelection = (record: PurchasementColumn, e: React.MouseEvent) => {
    e.stopPropagation()
    const isSelected = selectedRows.find((r) => r.id === record.id)
    if (isSelected) {
      setSelectedRows(selectedRows.filter((r) => r.id !== record.id))
    } else {
      setSelectedRows([...selectedRows, record])
    }
  }

  /*************** 新規購入記録を追加/購入記録を編集 ***************/
  const [isAdd, setIsAdd] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<PurchasementColumn | null>(null)

  // モーダルの表示
  const showModal = (isAdd: boolean, record?: PurchasementColumn) => {
    setIsModalOpen(true)
    setIsAdd(isAdd)
    setEditingRecord(record || null)
  }

  // モーダルのキャンセル
  const handleCancel = () => {
    setIsModalOpen(false)
    setEditingRecord(null)
  }

  // 購入記録保存成功時
  const handleSuccess = () => {
    setTableLoading(true)
    fetchPurchasements()
    setTableLoading(false)
  }

  /*************** 購入記録を削除 ***************/
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedRows, setSelectedRows] = useState<PurchasementColumn[]>([])
  const [actionRow, setActionRow] = useState<PurchasementColumn | null>(null)
  const [isDeleteOne, setIsDeleteOne] = useState<boolean>(false)

  // テーブルの行選択時
  function onRowSelectionChange(_selectedKeys: any, selectedRows: PurchasementColumn[]) {
    setSelectedRows(selectedRows)
  }

  // 削除ボタン押下時
  function handleDeletePurchasement(record?: PurchasementColumn) {
    setIsDeleteOne(!!record)
    if (record) {
      setActionRow(record)
      setIsDeleteModalOpen(true)
    } else if (selectedRows.length) {
      setIsDeleteModalOpen(true)
    } else {
      message.warning('削除する購入記録を選択してください')
    }
  }

  // 確認モーダルで削除を確定
  function confirmDeletePurchasement() {
    const rows = isDeleteOne ? [actionRow] : selectedRows
    deletePurchasement(rows.map((row) => row!.id))
      .then(() => {
        setIsDeleteModalOpen(false)
        message.success(
          `購入記録${rows.length > 1 ? `${rows.length}件` : `ID: ${rows[0]!.id}`}を削除しました`
        )

        setTableLoading(true)
        return getPurchasements()
      })
      .then((res) => {
        setData(res?.data || [])
        setTableLoading(false)
        setSelectedRows([])
      })
      .catch((error) => {
        console.error(error)

        notification.error({
          title: '購入記録削除失敗',
          description: `購入記録${
            rows.length > 1 ? `${rows.length}件` : `ID: ${rows[0]!.id}`
          }の削除に失敗しました: ${error.message}`,
          placement: 'bottomRight',
          showProgress: true,
          pauseOnHover: true,
        })
      })
  }

  // 確認モーダルで削除をキャンセル
  function cancelDeletePurchasement() {
    setIsDeleteModalOpen(false)
  }

  return (
    <div className="h-[cal(100vh - 7rem)]">
      <PageHeader
        title="購入記録一覧"
        onAdd={() => showModal(true)}
        onDelete={() => handleDeletePurchasement()}
        deleteDisabled={selectedRows.length === 0}
        data={data}
      />
      <div className="doodle-card-grid mt-6">
        {data.map((record) => (
          <DoodleCard
            key={record.id}
            id={record.id}
            title={record.purchaseDate ? dayjs(record.purchaseDate).format('YYYY-MM-DD') : '-'}
            selected={!!selectedRows.find((r) => r.id === record.id)}
            onToggleSelection={(e) => toggleSelection(record, e)}
            onEdit={(e) => {
              e.stopPropagation()
              showModal(false, record)
            }}
            onDelete={(e) => {
              e.stopPropagation()
              handleDeletePurchasement(record)
            }}
          >
            <DoodleCardRow
              label={JPNames.goods}
              value={record.goods?.goodsName || '-'}
            />
            <DoodleCardRow
              label={JPNames.store}
              value={record.store?.storeName || '-'}
            />
            <DoodleCardRow
              label={JPNames.quantity}
              value={`${record.quantity} ${record.quantityUnit}`}
            />
            <DoodleCardRow
              label={JPNames.unitPrice}
              value={`${record.unitPrice} 円`}
            />
            <DoodleCardRow
              label={JPNames.totalPrice}
              value={`${record.totalPrice} 円`}
            />
            <DoodleCardRow
              label={JPNames.paymentMethod}
              value={record.paymentMethod || '-'}
            />
            <DoodleCardRow
              label={JPNames.taxRate}
              value={
                record.taxRate
                  ? TAX_CATEGORY_NAMES[record.taxRate as keyof typeof TAX_CATEGORY_NAMES]
                  : '-'
              }
            />
            <DoodleCardRow
              label={JPNames.discountType}
              value={
                record.discountType
                  ? DISCOUNT_TYPE_NAMES[record.discountType as keyof typeof DISCOUNT_TYPE_NAMES]
                  : '-'
              }
            />
          </DoodleCard>
        ))}
      </div>
      {/* 削除確認モーダル */}
      <BookModal
        title="購入記録削除"
        // closable={true}
        open={isDeleteModalOpen}
        onOk={confirmDeletePurchasement}
        onCancel={cancelDeletePurchasement}
        okText="削除"
        cancelText="キャンセル"
        footer={
          <Space>
            <Button onClick={cancelDeletePurchasement}>キャンセル</Button>
            <Button
              type="primary"
              danger
              onClick={confirmDeletePurchasement}
            >
              削除
            </Button>
          </Space>
        }
      >
        <p>
          購入記録
          {isDeleteOne || selectedRows.length === 1
            ? `ID: ${isDeleteOne ? actionRow!.id : selectedRows[0].id}`
            : `${selectedRows.length}件`}
          を削除しますか？
        </p>
      </BookModal>
      {/* 購入記録追加・編集モーダル */}
      <PurchasementModal
        open={isModalOpen}
        isEditMode={!isAdd}
        editingRecord={editingRecord}
        onCancel={handleCancel}
        onSuccess={handleSuccess}
      />
    </div>
  )
}
