import { useState, useEffect } from 'react'
import {
  Button,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  message,
  DatePicker,
  Row,
  Col,
  Radio,
} from 'antd'
import notification from '@/components/DoodleNotification'
import dayjs from 'dayjs'
import BookModal from '@/components/BookModal'
import BookDetailModal from '@/components/BookDetailModal'
import PageHeader from '@/components/PageHeader'
import DoodleCard, { DoodleCardRow } from '@/components/DoodleCard'
import PaginatedGrid from '@/components/PaginatedGrid'
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

// 支出記録追加・編集モーダルコンポーネント（他のコンポーネントから使用可能）
export function PurchasementModal({
  open,
  isEditMode = false,
  editingRecord = null,
  initialDate,
  onCancel,
  onSuccess,
  PAGE_NAME = '支出',
}: {
  open: boolean
  isEditMode?: boolean
  editingRecord?: PurchasementColumn | null
  initialDate?: any
  onCancel: () => void
  onSuccess?: () => void
  PAGE_NAME?: string
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

  // 支出記録を保存
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
        message.success(`${PAGE_NAME}記録を${isEditMode ? '更新' : '追加'}しました`)
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
            title: `${PAGE_NAME}記録${isEditMode ? '更新' : '追加'}失敗`,
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

  const TAX_RATES = {
    STANDARD: 10,
    REDUCED: 8,
    TAX_FREE: 0,
    TAX_EXEMPT: 0,
    NO_TAX: 0,
  }

  // 合計金額を計算
  function calculateTotalPrice({ taxRate }: { taxRate?: string } = {}) {
    const quantity = form.getFieldValue('quantity') || 0
    const unitPrice = form.getFieldValue('unitPrice') || 0
    let totalPrice = quantity * unitPrice
    // 税金
    const isTaxIncluded = form.getFieldValue('isTaxIncluded')
    const taxRateFloat = taxRate
      ? TAX_RATES[taxRate as keyof typeof TAX_RATES] / 100
      : taxRateDisplay / 100
    const taxAmount = isTaxIncluded
      ? (totalPrice * taxRateFloat) / (1 + taxRateFloat)
      : totalPrice * taxRateFloat
    totalPrice += isTaxIncluded ? 0 : taxAmount
    form.setFieldValue('taxAmount', taxAmount)
    // 値引き
    const discountType = form.getFieldValue('discountType')
    const discountRate = form.getFieldValue('discountRate') || 0
    const discount =
      discountType === DISCOUNT_TYPES.PERCENTAGE
        ? (totalPrice * discountRate) / 100
        : form.getFieldValue('discountAmount') || 0
    form.setFieldValue('discountAmount', discount)
    totalPrice -= discount
    // 最終合計金額
    form.setFieldValue('totalPrice', totalPrice)
  }

  // 税率変更時
  function handleTaxRateChange(value: any) {
    switch (value) {
      case TAX_CATEGORIES.STANDARD:
        setTaxRateDisplay(10) // 日本の標準税率は10%
        break
      case TAX_CATEGORIES.REDUCED:
        setTaxRateDisplay(8) // 日本の軽減税率は8%
        break
      default:
        setTaxRateDisplay(0) // 非課税・不課税・免税は税率0%
    }
    calculateTotalPrice({ taxRate: value })
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
        title={`${PAGE_NAME}記録を${isEditMode ? '編集' : '追加'}`}
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
          {/* quantity */}
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
                      onChange={() => calculateTotalPrice()}
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
                      onChange={() => calculateTotalPrice()}
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
                    onChange={() => calculateTotalPrice()}
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
                  onChange={() => calculateTotalPrice()}
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
                    onChange={() => calculateTotalPrice()}
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
                  onChange={() => calculateTotalPrice()}
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

import { useBookPage } from '@/hooks/useBookPage'

export default function Purchasement() {
  const {
    data,
    selectedRows,
    toggleSelection,
    isModalOpen,
    isAdd,
    editingRecord,
    showModal,
    handleCancel,
    handleSuccess,
    handleDelete,
    handleDeleteAction,
    isDetailOpen,
    detailRecord,
    showDetail,
    closeDetail,
    handleDetailEdit,
    nextDetail,
    prevDetail,
    hasNext,
    hasPrev,
    PAGE_NAME,
  } = useBookPage<PurchasementColumn>({
    fetchList: getPurchasements,
    deleteItem: deletePurchasement,
  })

  // テーブルデータとカラム定義 (Removed manual state)

  return (
    <div className="book-page-container">
      <PageHeader
        title={PAGE_NAME + '記録一覧'}
        onAdd={() => showModal(true)}
        onDelete={() => handleDelete(selectedRows.map((r) => r.id))}
        deleteDisabled={selectedRows.length === 0}
        data={data}
      />
      <PaginatedGrid
        className="book-page-content"
        data={data as PurchasementColumn[]}
        onAdd={() => showModal(true)}
        renderItem={(record: PurchasementColumn) => (
          <DoodleCard
            key={record.id}
            id={record.id}
            title={record.goods?.goodsName || '-'}
            selected={!!selectedRows.find((r) => r.id === record.id)}
            onToggleSelection={(e) => toggleSelection(record, e)}
            onClick={() => showDetail(record)}
            onEdit={(e) => {
              e.stopPropagation()
              showModal(false, record)
            }}
            onDelete={() => {
              handleDeleteAction(record)
            }}
          >
            <DoodleCardRow
              label={JPNames.purchaseDate}
              value={record.purchaseDate ? dayjs(record.purchaseDate).format('YYYY-MM-DD') : '-'}
            />
            <DoodleCardRow
              label={JPNames.store}
              value={record.store?.storeName || '-'}
            />
            <DoodleCardRow
              label={JPNames.quantity}
              value={`${record.quantity} ${record.quantityUnit}`}
            />
            {/* <DoodleCardRow
              label={JPNames.unitPrice}
              value={`${record.unitPrice} 円`}
            /> */}
            <DoodleCardRow
              label={JPNames.totalPrice}
              value={`${record.totalPrice} 円`}
            />
            {/* <DoodleCardRow
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
            /> */}
          </DoodleCard>
        )}
      />

      {/* 支出記録追加・編集モーダル */}
      <PurchasementModal
        open={isModalOpen}
        isEditMode={!isAdd}
        editingRecord={editingRecord as PurchasementColumn | null}
        onCancel={handleCancel}
        onSuccess={handleSuccess}
        PAGE_NAME={PAGE_NAME}
      />

      <BookDetailModal
        manualFlip={true}
        open={isDetailOpen}
        title={
          detailRecord?.purchaseDate
            ? dayjs(detailRecord.purchaseDate).format('YYYY-MM-DD')
            : `${PAGE_NAME}記録`
        }
        subtitle={`${PAGE_NAME}記録詳細`}
        id={detailRecord?.id}
        onClose={closeDetail}
        onEdit={handleDetailEdit}
        onNext={nextDetail}
        onPrev={prevDetail}
        hasNext={hasNext}
        hasPrev={hasPrev}
        rowJustify="start"
      >
        {detailRecord && (
          <div className="flex flex-col gap-4">
            <DoodleCardRow
              label={JPNames.purchaseDate}
              value={
                detailRecord.purchaseDate
                  ? dayjs(detailRecord.purchaseDate).format('YYYY-MM-DD')
                  : '-'
              }
            />
            <DoodleCardRow
              label="商品"
              value={detailRecord.goods?.goodsName || '-'}
            />
            <DoodleCardRow
              label="店舗"
              value={detailRecord.store?.storeName || '-'}
            />
            <DoodleCardRow
              label={JPNames.unitPrice}
              value={`${detailRecord.unitPrice} 円`}
            />
            <DoodleCardRow
              label={JPNames.quantity}
              value={`${detailRecord.quantity} ${detailRecord.quantityUnit}`}
            />
            <DoodleCardRow
              label={JPNames.paymentMethod}
              value={detailRecord.paymentMethod || '-'}
            />
            <DoodleCardRow
              label={JPNames.taxRate}
              value={
                detailRecord.taxRate
                  ? TAX_CATEGORY_NAMES[detailRecord.taxRate as keyof typeof TAX_CATEGORY_NAMES] +
                    (detailRecord.isTaxIncluded ? '税込み' : '税抜き')
                  : '-'
              }
            />
            <DoodleCardRow
              label={JPNames.taxAmount}
              value={`${detailRecord.taxAmount} 円`}
            />
            <DoodleCardRow
              label={JPNames.discountAmount}
              value={`${detailRecord.discountType === DISCOUNT_TYPES.FIXED ? '固定金額' : '割引' + detailRecord.discountRate + '%'} ${detailRecord.discountAmount} 円`}
            />
            <DoodleCardRow
              label={JPNames.totalPrice}
              value={`${detailRecord.totalPrice} 円`}
            />
            <DoodleCardRow
              label={JPNames.description}
              value={detailRecord.description || '-'}
            />
          </div>
        )}
      </BookDetailModal>
    </div>
  )
}
