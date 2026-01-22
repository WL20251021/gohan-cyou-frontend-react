import { useState, useEffect } from 'react'
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
  Popconfirm,
} from 'antd'
import BookModal from '../../../components/BookModal'
import PageHeader from '../../../components/PageHeader'
import DoodleCard, { DoodleCardRow } from '../../../components/DoodleCard'
import PaginatedGrid from '../../../components/PaginatedGrid'
import { RiseOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { IncomeColumn, JPNames, INCOME_METHODS, AMOUNT_UNITS } from './columns'
import { getIncomes, addIncome, updateIncome, deleteIncome } from './api'
import { getCategories } from '../category/api'

export default function Income() {
  // テーブルデータとカラム定義
  const [data, setData] = useState<Array<IncomeColumn>>([])
  const [tableLoading, setTableLoading] = useState<boolean>(false)
  const [totalIncome, setTotalIncome] = useState<number>(0)
  const [categories, setCategories] = useState<Array<any>>([])

  const columns: Array<any> = [
    {
      title: JPNames.id,
      dataIndex: 'id',
      key: 'id',
      width: 80,
      className: 'cell-id',
      onCell: () => ({ 'data-label': JPNames.id }),
    },
    {
      title: JPNames.incomeDate,
      dataIndex: 'incomeDate',
      key: 'incomeDate',
      render: (date: string | null) => (date ? dayjs(date).format('YYYY-MM-DD') : '-'),
      sorter: (a: IncomeColumn, b: IncomeColumn) => {
        const dateA = a.incomeDate ? new Date(a.incomeDate).getTime() : 0
        const dateB = b.incomeDate ? new Date(b.incomeDate).getTime() : 0
        return dateA - dateB
      },
      onCell: () => ({ 'data-label': JPNames.incomeDate }),
    },
    {
      title: JPNames.category,
      dataIndex: 'category',
      key: 'category',
      className: 'cell-title',
      onCell: () => ({ 'data-label': JPNames.category }),
      render: (category: any) => category?.categoryName || '-',
    },
    {
      title: JPNames.amount,
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number, record: IncomeColumn) => `${amount} ${record.amountUnit}`,
      sorter: (a: IncomeColumn, b: IncomeColumn) => a.amount - b.amount,
      onCell: () => ({ 'data-label': JPNames.amount }),
    },
    {
      title: JPNames.method,
      dataIndex: 'method',
      key: 'method',
      render: (method: string | null) => method || '-',
      onCell: () => ({ 'data-label': JPNames.method }),
    },
    {
      title: JPNames.note,
      dataIndex: 'note',
      key: 'note',
      render: (note: string | null) => note || '-',
      onCell: () => ({ 'data-label': JPNames.note }),
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right' as const,
      width: 150,
      onCell: () => ({ 'data-label': '操作' }),
      render: (_: any, record: IncomeColumn) => (
        <Space size="middle">
          <a>
            <i className="i-material-symbols:edit-document-outline-rounded hover:material-symbols:edit-document-rounded "></i>
            編集
          </a>
          <Popconfirm
            title="削除確認"
            description="本当に削除しますか？"
            onConfirm={() => handleDeleteIncome(record)}
            okText="削除"
            cancelText="キャンセル"
            okButtonProps={{ danger: true }}
          >
            <a>
              <i className="i-material-symbols:delete-outline-rounded hover:i-material-symbols:delete-rounded "></i>
              削除
            </a>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  // データの取得
  useEffect(() => {
    fetchIncomes()
    fetchCategories()
  }, [])

  // 収入データ取得
  function fetchIncomes() {
    getIncomes()
      .then((res) => {
        const incomeData = res?.data || []
        setData(incomeData)

        // 合計金額を計算
        const total = incomeData.reduce((sum: number, item: IncomeColumn) => sum + item.amount, 0)
        setTotalIncome(total)
      })
      .catch((error) => {
        console.error(error)
        notification.error({
          title: '収入データ取得失敗',
          description: error.message,
          placement: 'bottomRight',
        })
      })
  }

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

  const toggleSelection = (record: IncomeColumn, e: React.MouseEvent) => {
    e.stopPropagation()
    const isSelected = selectedRows.find((r) => r.id === record.id)
    if (isSelected) {
      setSelectedRows(selectedRows.filter((r) => r.id !== record.id))
    } else {
      setSelectedRows([...selectedRows, record])
    }
  }

  /*************** 新規収入を追加/収入を編集 ***************/
  const [isAdd, setIsAdd] = useState(true)
  const [form] = Form.useForm<IncomeColumn>()
  const [modalName, setModalName] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [confirmLoading, setConfirmLoading] = useState(false)

  // モーダルの表示
  const showModal = (isAdd: boolean, record?: IncomeColumn) => {
    setIsModalOpen(true)
    setIsAdd(isAdd)
    setModalName(isAdd ? '新規収入' : '収入編集')
    if (!isAdd && record) {
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
    setIsModalOpen(false)
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
        setTableLoading(true)
        return getIncomes()
      })
      .then((res) => {
        setIsModalOpen(false)
        setConfirmLoading(false)
        form.resetFields()

        message.success('収入を追加しました')
        const incomeData = res?.data || []
        setData(incomeData)

        const total = incomeData.reduce((sum: number, item: IncomeColumn) => sum + item.amount, 0)
        setTotalIncome(total)
        setTableLoading(false)
      })
      .catch((error) => {
        setConfirmLoading(false)
        setTableLoading(false)

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
        setTableLoading(true)
        return getIncomes()
      })
      .then((res) => {
        setIsModalOpen(false)
        setConfirmLoading(false)
        form.resetFields()

        message.success('収入を更新しました')
        const incomeData = res?.data || []
        setData(incomeData)

        const total = incomeData.reduce((sum: number, item: IncomeColumn) => sum + item.amount, 0)
        setTotalIncome(total)
        setTableLoading(false)
      })
      .catch((error) => {
        setConfirmLoading(false)
        setTableLoading(false)

        console.error(error)

        notification.error({
          title: '収入更新失敗',
          description: error.message,
          placement: 'bottomRight',
        })
      })
  }

  /*************** 収入を削除 ***************/
  const [selectedRows, setSelectedRows] = useState<IncomeColumn[]>([])

  // テーブルの行選択時
  function onRowSelectionChange(_selectedKeys: any, selectedRows: IncomeColumn[]) {
    setSelectedRows(selectedRows)
  }

  // 削除実行
  function executeDelete(rows: (IncomeColumn | null)[]) {
    const cleanRows = rows.filter((r) => r !== null) as IncomeColumn[]
    const deleteIds = cleanRows.map((row) => row.id)

    deleteIncome(deleteIds)
      .then(() => {
        message.success(
          `収入${cleanRows.length > 1 ? `${cleanRows.length}件` : `ID: ${cleanRows[0].id}`}を削除しました`
        )

        setTableLoading(true)
        return getIncomes()
      })
      .then((res) => {
        const incomeData = res?.data || []
        setData(incomeData)

        const total = incomeData.reduce((sum: number, item: IncomeColumn) => sum + item.amount, 0)
        setTotalIncome(total)
        setTableLoading(false)
        setSelectedRows([])
      })
      .catch((error) => {
        console.error(error)

        notification.error({
          title: '収入削除失敗',
          description: `収入${
            cleanRows.length > 1 ? `${cleanRows.length}件` : `ID: ${cleanRows[0].id}`
          }の削除に失敗しました: ${error.message}`,
          placement: 'bottomRight',
          showProgress: true,
          pauseOnHover: true,
        })
      })
  }

  // 削除ボタン押下時
  function handleDeleteIncome(record?: IncomeColumn) {
    if (record) {
      executeDelete([record])
    } else if (selectedRows.length) {
      executeDelete(selectedRows)
    } else {
      message.warning('削除する収入を選択してください')
    }
  }

  return (
    <div className="book-page-container">
      <PageHeader
        title="収入管理"
        onAdd={() => showModal(true)}
        onDelete={() => handleDeleteIncome()}
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
          value={totalIncome}
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
        data={data}
        renderItem={(record: IncomeColumn) => (
          <DoodleCard
            key={record.id}
            id={record.id}
            title={record.incomeDate ? dayjs(record.incomeDate).format('YYYY-MM-DD') : '-'}
            selected={!!selectedRows.find((r) => r.id === record.id)}
            onToggleSelection={(e) => toggleSelection(record, e)}
            onEdit={(e) => {
              e.stopPropagation()
              showModal(false, record)
            }}
            onDelete={(e) => {
              e.stopPropagation()
              handleDeleteIncome(record)
            }}
          >
            <DoodleCardRow
              label={JPNames.category}
              value={record.category?.categoryName || '-'}
            />
            <DoodleCardRow
              label={JPNames.amount}
              value={`${record.amount} ${record.amountUnit}`}
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
        title={modalName}
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
    </div>
  )
}
