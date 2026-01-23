import { useState, useEffect } from 'react'
import { Form, Input, InputNumber, Select, Space, DatePicker, Alert, message } from 'antd'
import BookModal from '@/components/BookModal'
import dayjs, { Dayjs } from 'dayjs'
import { ConsumptionColumn, JPNames, QUANTITY_UNITS } from './columns'
import { addConsumption, updateConsumption } from './api'
import { getInStockItems } from '../inventory/api'

interface ConsumptionModalProps {
  open: boolean
  isEditMode: boolean
  editingRecord: ConsumptionColumn | null
  initialDate?: Dayjs
  onCancel: () => void
  onSuccess: () => void
}

export function ConsumptionModal({
  open,
  isEditMode,
  editingRecord,
  initialDate,
  onCancel,
  onSuccess,
}: ConsumptionModalProps) {
  const [form] = Form.useForm<ConsumptionColumn>()
  const [confirmLoading, setConfirmLoading] = useState(false)
  const [availablePurchasements, setAvailablePurchasements] = useState<Array<any>>([])
  const [selectedInventory, setSelectedInventory] = useState<any>(null)
  const [maxQuantity, setMaxQuantity] = useState<number>(0)

  // 在庫状況取得
  useEffect(() => {
    if (open) {
      checkInventoryStatus()
    }
  }, [open])

  // 編集モードの場合、フォームに値をセット
  useEffect(() => {
    if (open && isEditMode && editingRecord) {
      form.setFieldsValue({
        ...editingRecord,
        consumptionDate: editingRecord.consumptionDate
          ? dayjs(editingRecord.consumptionDate)
          : null,
      })
      // 編集時は既存の在庫情報を取得
      const inventory = availablePurchasements.find((p) => p.id === editingRecord.purchasementId)
      if (inventory) {
        setSelectedInventory(inventory)
        // 編集時は現在の使用量を戻して計算
        setMaxQuantity(inventory.availableQuantity + editingRecord.quantity)
      }
    } else if (open && !isEditMode) {
      form.resetFields()
      form.setFieldsValue({
        consumptionDate: initialDate || dayjs(),
        quantity: 1,
        quantityUnit: 'g',
      })
      setSelectedInventory(null)
      setMaxQuantity(0)
    }
  }, [open, isEditMode, editingRecord, initialDate, availablePurchasements])

  // 在庫状況チェック
  const checkInventoryStatus = async () => {
    try {
      const response = await getInStockItems()
      const available = response?.data || []
      setAvailablePurchasements(
        available.map((inv: any) => ({
          id: inv.id,
          goods: inv.purchasement.goods,
          store: inv.purchasement.store,
          purchasement: inv.purchasement,
          remainingQuantity: inv.remainingQuantity,
          quantityUnit: inv.quantityUnit,
        }))
      )
    } catch (error) {
      console.error('在庫状況取得失敗:', error)
    }
  }

  // 購入記録選択時のハンドラー
  const handlePurchasementChange = (purchasementId: number) => {
    const inventory = availablePurchasements.find((p) => p.id === purchasementId)
    if (inventory) {
      setSelectedInventory(inventory)
      setMaxQuantity(inventory.remainingQuantity)
      // 数量単位を自動設定
      form.setFieldValue('quantityUnit', inventory.quantityUnit)
    } else {
      setSelectedInventory(null)
      setMaxQuantity(0)
    }
  }

  // 使用記録追加・編集の確定ハンドラー
  const handleConfirm = async () => {
    try {
      setConfirmLoading(true)
      const values = await form.validateFields()
      const data = {
        ...values,
        consumptionDate: values.consumptionDate
          ? dayjs(values.consumptionDate).format('YYYY-MM-DD')
          : null,
        quantityUnit: selectedInventory?.quantityUnit || QUANTITY_UNITS.Piece,
      }

      if (isEditMode && editingRecord) {
        await updateConsumption(editingRecord.id, data as any)
        message.success('使用記録を更新しました')
      } else {
        await addConsumption(data as any)
        message.success('使用記録を追加しました')
      }

      form.resetFields()
      setSelectedInventory(null)
      setMaxQuantity(0)
      onSuccess()
    } catch (error: any) {
      if (error.errorFields) {
        message.error('入力内容を確認してください')
      } else {
        message.error('保存に失敗しました')
        console.error('保存エラー:', error)
      }
    } finally {
      setConfirmLoading(false)
    }
  }

  const handleModalCancel = () => {
    form.resetFields()
    setSelectedInventory(null)
    setMaxQuantity(0)
    onCancel()
  }

  return (
    <BookModal
      title={isEditMode ? '使用記録を編集' : '使用記録を追加'}
      // width="80%"
      // maskClosable={false}
      open={open}
      confirmLoading={confirmLoading}
      onOk={handleConfirm}
      onCancel={handleModalCancel}
      okText="保存"
      cancelText="キャンセル"
    >
      <Form
        form={form}
        className="p-8"
        labelCol={{ span: 6 }}
        wrapperCol={{ span: 14 }}
        layout="horizontal"
        initialValues={{
          quantityUnit: '個',
          quantity: 0,
          consumptionDate: dayjs(),
        }}
      >
        {isEditMode && (
          <Form.Item
            label={JPNames.id}
            name="id"
          >
            <Input disabled />
          </Form.Item>
        )}
        <Form.Item
          label={JPNames.consumptionDate}
          name="consumptionDate"
        >
          <DatePicker
            style={{ width: '100%' }}
            format="YYYY-MM-DD"
          />
        </Form.Item>
        <Form.Item
          label={JPNames.purchasement}
          name="purchasementId"
          rules={[{ required: true, message: '購入記録を選択してください!' }]}
        >
          <Select
            allowClear
            placeholder="購入記録を選択（在庫あり）"
            showSearch
            optionFilterProp="label"
            onChange={handlePurchasementChange}
            options={availablePurchasements.map((item) => ({
              label: `${item.goods?.goodsName || '商品不明'} - ${
                item.store?.storeName || '店舗不明'
              } (在庫: ${item.remainingQuantity} ${item.quantityUnit}) - ${
                item.purchasement.purchaseDate
                  ? dayjs(item.purchasement.purchaseDate).format('YYYY-MM-DD')
                  : '日付不明'
              }`,
              value: item.id,
            }))}
          />
        </Form.Item>
        {selectedInventory && (
          <Alert
            message="在庫情報"
            description={
              <div>
                <div>商品: {selectedInventory.goods?.goodsName || '不明'}</div>
                <div>店舗: {selectedInventory.store?.storeName || '不明'}</div>
                <div style={{ fontWeight: 'bold', color: '#1890ff' }}>
                  利用可能数量: {maxQuantity.toFixed(2)} {selectedInventory?.quantityUnit}
                </div>
              </div>
            }
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}
        <Form.Item label={JPNames.quantity}>
          <Form.Item
            name="quantity"
            noStyle
            rules={[
              { required: true, message: '数量を入力してください!' },
              {
                validator: (_, value) => {
                  if (value && maxQuantity > 0 && value > maxQuantity) {
                    return Promise.reject(
                      new Error(`在庫不足: 最大 ${maxQuantity.toFixed(2)} まで入力可能です`)
                    )
                  }
                  return Promise.resolve()
                },
              },
            ]}
          >
            <InputNumber
              min={0}
              max={maxQuantity > 0 ? maxQuantity : undefined}
              step={0.01}
              style={{ width: '70%' }}
              addonAfter={selectedInventory ? selectedInventory.quantityUnit : QUANTITY_UNITS.Piece}
              placeholder={
                maxQuantity > 0 ? `最大: ${maxQuantity.toFixed(2)}` : '購入記録を選択してください'
              }
            />
          </Form.Item>
        </Form.Item>
        <Form.Item
          label={JPNames.description}
          name="description"
        >
          <Input.TextArea
            rows={3}
            allowClear
            placeholder="メモを入力"
          />
        </Form.Item>
      </Form>
    </BookModal>
  )
}
