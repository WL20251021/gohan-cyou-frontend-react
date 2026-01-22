import { useState, useEffect, useMemo } from 'react'
import {
  Form,
  InputNumber,
  Select,
  Space,
  notification,
  message,
  DatePicker,
  Input,
  Statistic,
  Card,
} from 'antd'
import BookModal from '../../../components/BookModal'
import BookDetailModal from '../../../components/BookDetailModal'
import PageHeader from '../../../components/PageHeader'
import DoodleCard, { DoodleCardRow } from '../../../components/DoodleCard'
import PaginatedGrid from '../../../components/PaginatedGrid'
import { RiseOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { IncomeColumn, JPNames, INCOME_METHODS, AMOUNT_UNITS } from './columns'
import { getIncomes, addIncome, updateIncome, deleteIncome } from './api'
import { getCategories } from '../category/api'
import { useBookPage } from '../../../hooks/useBookPage'

export default function Income() {
  const {
    data,
    loading, // used by PaginatedGrid? No, it just takes data. But logical to have.
    selectedRows,
    // setSelectedRows,
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

  // テーブルデータとカラム定義
  // const [data, setData] = useState<Array<IncomeColumn>>([])
  // const [tableLoading, setTableLoading] = useState<boolean>(false)
  // const [totalIncome, setTotalIncome] = useState<number>(0)
  const [categories, setCategories] = useState<Array<any>>([])

  // 合計金額を計算 (derived state)
  const totalIncome = useMemo(() => {
    return (data as IncomeColumn[]).reduce(
      (sum: number, item: IncomeColumn) => sum + item.amount,
      0
    )
  }, [data])

  // データの取得 (Categories only - Incomes via hook)
  useEffect(() => {
    fetchCategories()
  }, [])

  // カテゴリデータ取得
  function fetchCategories() {
    getCategories()
      .then((res) => {
        setCategories(res?.data || [])
      })
      .catch((error) => {
        console.error(error)
      })
  }

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

      {/* 合計収入カード */}
      <Card
        style={{
          marginBottom: '24px',
          background: 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)',
        }}
      >
        <Statistic
          title={<span style={{ color: 'white', fontSize: '18px' }}>総収入</span>}
          value={totalIncome || 0}
          precision={0}
          prefix="¥"
          valueStyle={{ color: 'white', fontSize: '36px', fontWeight: 'bold' }}
          suffix={<RiseOutlined />}
        />
        <div style={{ marginTop: '8px', color: 'rgba(255, 255, 255, 0.9)' }}>
          {data.length}件の収入記録
        </div>
      </Card>

      <PaginatedGrid
        className="book-page-content"
        data={data as IncomeColumn[]}
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
              value={record.category?.categoryName || '-'}
            />
            <DoodleCardRow
              label={JPNames.amount}
              value={`${record.amount || 0} ${record.amountUnit || ''}`}
            />
            <DoodleCardRow
              label={JPNames.method}
              value={record.method || '-'}
            />
            <DoodleCardRow
              label={JPNames.note}
              value={record.note || '-'}
              truncate
            />
          </DoodleCard>
        )}
      />

      {/* 収入インフォーモーダル */}
      <BookModal
        manualFlip={true}
        title={isAdd ? '新規収入' : '収入編集'}
        // width="80%"
        // maskClosable={false}
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
            rules={[{ required: true, message: 'カテゴリを選択してください!' }]}
          >
            <DatePicker
              style={{ width: '100%' }}
              format="YYYY-MM-DD"
            />
          </Form.Item>
          <Form.Item
            label={JPNames.category}
            name="categoryId"
            rules={[{ required: true, message: 'カテゴリを選択してください!' }]}
          >
            <Select
              allowClear
              placeholder="カテゴリを選択"
              options={categories.map((item) => ({
                label: item.jpName,
                value: item.id,
              }))}
            />
          </Form.Item>
          <Form.Item
            label={JPNames.amount}
            required={true}
          >
            <Space.Compact style={{ width: '100%' }}>
              <Form.Item
                name="amount"
                noStyle
                rules={[{ required: true, message: '金額を入力してください!' }]}
              >
                <InputNumber
                  min={0}
                  step={1}
                  style={{ width: '70%' }}
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => Number(value?.replace(/,/g, '') || 0) as 0}
                />
              </Form.Item>
              <Form.Item
                name="amountUnit"
                noStyle
              >
                <Select
                  style={{ width: '30%' }}
                  options={Object.entries(AMOUNT_UNITS).map(([key, value]) => ({
                    label: value,
                    value: value,
                  }))}
                />
              </Form.Item>
            </Space.Compact>
          </Form.Item>
          <Form.Item
            label={JPNames.method}
            name="method"
          >
            <Select
              allowClear
              placeholder="受取方法を選択"
              options={Object.entries(INCOME_METHODS).map(([key, value]) => ({
                label: value,
                value: value,
              }))}
            />
          </Form.Item>
          <Form.Item
            label={JPNames.note}
            name="note"
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
        subtitle="Income Details"
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
              value={detailRecord.category?.categoryName || '-'}
            />
            <DoodleCardRow
              label={JPNames.amount}
              value={`${detailRecord.amount} ${detailRecord.amountUnit}`}
            />
            <DoodleCardRow
              label={JPNames.method}
              value={detailRecord.method || '-'}
            />
            <DoodleCardRow
              label={JPNames.note}
              value={detailRecord.note || '-'}
            />
          </div>
        )}
      </BookDetailModal>
    </div>
  )
}
