import { useState, useMemo } from 'react'
import { Form, InputNumber, Select, notification, message, DatePicker, Input } from 'antd'
import BookModal from '../../../components/BookModal'
import BookDetailModal from '../../../components/BookDetailModal'
import PageHeader from '../../../components/PageHeader'
import DoodleCard, { DoodleCardRow } from '../../../components/DoodleCard'
import PaginatedGrid from '../../../components/PaginatedGrid'
import dayjs from 'dayjs'
import { IncomeColumn, JPNames, JPIncomeCategory } from './columns'
import { getIncomes, addIncome, updateIncome, deleteIncome, getIncomeSummary } from './api'
import { useBookPage } from '../../../hooks/useBookPage'

export default function Income() {
  const {
    data,
    selectedRows,
    toggleSelection,
    isModalOpen,
    isAdd,
    editingRecord,
    showModal: _showModal,
    handleCancel: _handleCancel,
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
  } = useBookPage<IncomeColumn>({
    fetchList: getIncomes,
    deleteItem: deleteIncome,
    itemName: '収入',
  })

  // 合計金額取得
  const [incomeSummary, setIncomeSummary] = useState<{ totalMonthly: number; totalYearly: number }>(
    {
      totalMonthly: 0,
      totalYearly: 0,
    }
  )
  useMemo(() => {
    getIncomeSummary()
      .then((res) => {
        setIncomeSummary(res?.data || { totalMonthly: 0, totalYearly: 0 })
      })
      .catch((error) => {
        console.error('収入サマリーの取得に失敗しました:', error)
      })
  }, [])

  /*************** 新規収入を追加/収入を編集 ***************/
  const [form] = Form.useForm<IncomeColumn>()
  const [confirmLoading, setConfirmLoading] = useState(false)

  // モーダルの表示
  const showModal = (addMode: boolean, record?: IncomeColumn) => {
    _showModal(addMode, record)
    if (!addMode && record) {
      form.setFieldsValue({
        ...record,
        incomeDate: record.incomeDate ? dayjs(record.incomeDate) : null,
      })
    } else {
      form.resetFields()
    }
  }

  // モーダルのキャンセル
  const handleCancel = () => {
    _handleCancel()
    form.resetFields()
  }

  // 収入追加・編集の確定ハンドラー
  function handleConfirmIncome() {
    if (isAdd) {
      handleAddIncome()
    } else {
      handleEditIncome()
    }
  }

  // 収入追加の確定
  function handleAddIncome() {
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
        handleSuccess() // fetches list
        _handleCancel() // close modal
        setConfirmLoading(false)
        form.resetFields()

        message.success('収入を追加しました')
      })
      .catch((error) => {
        setConfirmLoading(false)
        console.error(error)
        notification.error({
          title: '収入追加失敗',
          description: error.message,
          placement: 'bottomRight',
        })
      })
  }

  // 収入編集の確定
  function handleEditIncome() {
    setConfirmLoading(true)
    form
      .validateFields()
      .then((values) => {
        const data = {
          ...values,
          incomeDate: values.incomeDate ? dayjs(values.incomeDate).format('YYYY-MM-DD') : null,
        }
        return updateIncome(values.id, data as Partial<IncomeColumn>)
      })
      .then(() => {
        handleSuccess()
        _handleCancel()
        setConfirmLoading(false)
        form.resetFields()

        message.success('収入を更新しました')
      })
      .catch((error) => {
        setConfirmLoading(false)
        console.error(error)
        notification.error({
          title: '収入更新失敗',
          description: error.message,
          placement: 'bottomRight',
        })
      })
  }

  return (
    <div className="book-page-container">
      <PageHeader
        title="収入管理"
        onAdd={() => showModal(true)}
        onDelete={() => handleDelete(selectedRows.map((r) => r.id))}
        deleteDisabled={selectedRows.length === 0}
        data={data}
      />

      {/* 合計収入カード (Design Updated) */}
      <div
        style={{
          margin: '10px 48px',
          padding: '16px',
          border: '2px solid var(--border-color)',
          borderRadius: 'var(--radius-doodle-sm)',
          backgroundColor: 'var(--color-primary-lightest)',
        }}
      >
        <p>今月の収入：{incomeSummary.totalMonthly} 円</p>
        <p>本年度の収入：{incomeSummary.totalYearly} 円</p>
      </div>

      <PaginatedGrid
        className="book-page-content"
        data={data as IncomeColumn[]}
        onAdd={() => showModal(true)}
        renderItem={(record: IncomeColumn) => (
          <DoodleCard
            key={record.id}
            id={record.id}
            title={record.incomeDate ? dayjs(record.incomeDate).format('YYYY-MM-DD') : '-'}
            selected={!!selectedRows.find((r) => r.id === record.id)}
            onToggleSelection={(e) => toggleSelection(record, e)}
            onClick={() => showDetail(record)}
            onEdit={(e) => {
              e.stopPropagation()
              showModal(false, record)
            }}
            onDelete={(e) => {
              e.stopPropagation()
              handleDeleteAction(record)
            }}
          >
            <DoodleCardRow
              label={JPNames.category}
              value={JPIncomeCategory[record.category as keyof typeof JPIncomeCategory] || '-'}
            />
            <DoodleCardRow
              label={JPNames.amount}
              value={`${record.amount || 0} 円`}
            />
            <DoodleCardRow
              label={JPNames.description}
              value={record.description || '-'}
              truncate
            />
          </DoodleCard>
        )}
      />

      {/* 収入インフォーモーダル */}
      <BookModal
        manualFlip={true}
        title={isAdd ? '新規収入' : '収入編集'}
        open={isModalOpen}
        confirmLoading={confirmLoading}
        onOk={handleConfirmIncome}
        onCancel={handleCancel}
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
            incomeDate: dayjs(),
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
            rules={[{ required: true, message: '収入日を選択してください!' }]}
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

      <BookDetailModal
        manualFlip={true}
        open={isDetailOpen}
        title={detailRecord?.incomeDate ? dayjs(detailRecord.incomeDate).format('YYYY-MM-DD') : '-'}
        subtitle="収入詳細"
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
              label={JPNames.category}
              value={
                JPIncomeCategory[detailRecord.category as keyof typeof JPIncomeCategory] || '-'
              }
            />
            <DoodleCardRow
              label={JPNames.amount}
              value={`${detailRecord.amount} 円`}
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
