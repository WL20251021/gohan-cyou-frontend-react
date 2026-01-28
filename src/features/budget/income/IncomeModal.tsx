import { useState, useEffect } from 'react'
import { Form, InputNumber, Select, message, DatePicker, Input } from 'antd'
import notification from '@/components/DoodleNotification'
import BookModal from '@/components/BookModal'
import dayjs, { Dayjs } from 'dayjs'
import { IncomeColumn, JPNames, JPIncomeCategory } from './columns'
import { addIncome, updateIncome } from './api'

interface IncomeModalProps {
  open: boolean
  isAdd: boolean // true = add, false = edit
  initialDate?: Dayjs
  record?: IncomeColumn | null
  onCancel: () => void
  onSuccess: () => void
  PAGE_NAME?: string
}

export default function IncomeModal({
  open,
  isAdd,
  initialDate,
  record,
  onCancel,
  onSuccess,
  PAGE_NAME = '収入',
}: IncomeModalProps) {
  const [form] = Form.useForm<IncomeColumn>()
  const [confirmLoading, setConfirmLoading] = useState(false)

  // Initialize form values when modal opens or props change
  useEffect(() => {
    if (open) {
      if (isAdd) {
        form.resetFields()
        form.setFieldsValue({
          amount: 0,
          incomeDate: initialDate || dayjs(),
          // Default category can be set here if needed
        })
      } else if (record) {
        form.setFieldsValue({
          ...record,
          incomeDate: record.incomeDate ? dayjs(record.incomeDate) : null,
        })
      }
    }
  }, [open, isAdd, record, initialDate, form])

  const handleConfirm = () => {
    if (isAdd) {
      handleAdd()
    } else {
      handleEdit()
    }
  }

  const handleAdd = () => {
    setConfirmLoading(true)
    form
      .validateFields()
      .then((values) => {
        const data = {
          ...values,
          incomeDate: values.incomeDate ? dayjs(values.incomeDate).format('YYYY-MM-DD') : null,
        }
        return addIncome(data as Partial<IncomeColumn>)
      })
      .then(() => {
        setConfirmLoading(false)
        form.resetFields()
        message.success(`${PAGE_NAME}を追加しました`)
        onSuccess()
      })
      .catch((error) => {
        setConfirmLoading(false)
        console.error(error)
        // If it's a validation error, it might not have 'message' prop in the same way
        if (error.errorFields) {
          // Validation failed, do nothing (antd handles UI)
        } else {
          notification.error({
            title: `${PAGE_NAME}追加失敗`,
            description: error.message || '不明なエラーが発生しました',
            placement: 'bottomRight',
          })
        }
      })
  }

  const handleEdit = () => {
    // Should have an ID if editing
    if (!record?.id) return

    setConfirmLoading(true)
    form
      .validateFields()
      .then((values) => {
        const data = {
          ...values,
          incomeDate: values.incomeDate ? dayjs(values.incomeDate).format('YYYY-MM-DD') : null,
        }
        return updateIncome(record.id, data as Partial<IncomeColumn>)
      })
      .then(() => {
        setConfirmLoading(false)
        form.resetFields()
        message.success(`${PAGE_NAME}を更新しました`)
        onSuccess()
      })
      .catch((error) => {
        setConfirmLoading(false)
        console.error(error)
        if (error.errorFields) {
          // Validation failed
        } else {
          notification.error({
            title: `${PAGE_NAME}更新失敗`,
            description: error.message || '不明なエラーが発生しました',
            placement: 'bottomRight',
          })
        }
      })
  }

  const handleModalCancel = () => {
    form.resetFields()
    onCancel()
  }

  return (
    <BookModal
      title={isAdd ? `新規${PAGE_NAME}` : `${PAGE_NAME}編集`}
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
          amountUnit: '円',
          amount: 0,
        }}
      >
        {!isAdd && (
          <Form.Item
            label={JPNames.id}
            name="id"
          >
            <Input disabled />
          </Form.Item>
        )}
        <Form.Item
          label={JPNames.incomeDate}
          name="incomeDate"
          rules={[{ required: true, message: ` ${PAGE_NAME}日を選択してください!` }]}
        >
          <DatePicker
            style={{ width: '100%' }}
            format="YYYY-MM-DD"
          />
        </Form.Item>
        <Form.Item
          label={JPNames.category}
          name="category"
          rules={[{ required: true, message: 'カテゴリを選択してください!' }]}
        >
          <Select
            allowClear
            placeholder="カテゴリを選択"
            options={Object.entries(JPIncomeCategory).map(([key, item]) => ({
              label: item,
              value: key,
            }))}
          />
        </Form.Item>
        <Form.Item
          label={JPNames.amount}
          required={true}
        >
          <Form.Item
            name="amount"
            noStyle
            rules={[{ required: true, message: '金額を入力してください!' }]}
          >
            <InputNumber
              min={0}
              step={1}
              style={{ width: '70%' }}
              addonAfter="円"
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => Number(value?.replace(/,/g, '') || 0) as 0}
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
