import { useState, useEffect } from 'react'
import { Flex, Table, Button, Form, Input, Space, notification, message, Checkbox } from 'antd'
import BookModal from '../../../components/BookModal'
import PageHeader from '../../../components/PageHeader'
import DoodleCard, { DoodleCardRow } from '../../../components/DoodleCard'
import { BrandColumn, JPNames } from './columns'
import { getBrands, addBrand, updateBrand, deleteBrands } from './api'

// ブランド追加・編集モーダルコンポーネント（他のコンポーネントから使用可能）
export function BrandAddModal({
  open,
  isEditMode = false,
  editingRecord = null,
  onCancel,
  onSuccess,
}: {
  open: boolean
  isEditMode?: boolean
  editingRecord?: BrandColumn | null
  onCancel: () => void
  onSuccess?: (newBrand?: BrandColumn) => void
}) {
  const [form] = Form.useForm<BrandColumn>()
  const [confirmLoading, setConfirmLoading] = useState(false)

  // モーダルが開いたときにフォームをリセットまたは設定
  useEffect(() => {
    if (open) {
      if (isEditMode && editingRecord) {
        form.setFieldsValue(editingRecord)
      } else {
        form.resetFields()
      }
    }
  }, [open, isEditMode, editingRecord, form])

  // ブランド保存
  function handleSaveBrand() {
    setConfirmLoading(true)
    form
      .validateFields()
      .then((values) => {
        if (isEditMode && editingRecord) {
          return updateBrand(editingRecord.id, values)
        } else {
          return addBrand(values)
        }
      })
      .then(() => {
        return getBrands()
      })
      .then((res) => {
        form.resetFields()
        message.success(isEditMode ? 'ブランドを更新しました' : 'ブランドを追加しました')
        setConfirmLoading(false)

        // 追加/更新したブランドを返す
        if (onSuccess) {
          if (isEditMode) {
            onSuccess()
          } else if (res?.data?.length > 0) {
            const newBrand = res.data[res.data.length - 1]
            onSuccess(newBrand)
          }
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
            title: isEditMode ? 'ブランド更新失敗' : 'ブランド追加失敗',
            description: error.message,
            placement: 'bottomRight',
            showProgress: true,
            pauseOnHover: true,
          })
        }
      })
  }

  return (
    <BookModal
      title={isEditMode ? 'ブランドを編集' : 'ブランドを追加'}
      // width="80%"
      // maskClosable={false}
      open={open}
      confirmLoading={confirmLoading}
      onOk={handleSaveBrand}
      onCancel={onCancel}
      okText="保存"
      cancelText="キャンセル"
    >
      <Form
        form={form}
        className="p-8"
        labelCol={{ span: 6 }}
        wrapperCol={{ span: 14 }}
        layout="horizontal"
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
          label={JPNames.brandName}
          name="brandName"
          rules={[{ required: true, message: 'ブランド名を入力してください!' }]}
        >
          <Input placeholder="ブランド名を入力" />
        </Form.Item>
        <Form.Item
          label={JPNames.description}
          name="description"
        >
          <Input.TextArea
            rows={3}
            placeholder="説明を入力（任意）"
            allowClear
          />
        </Form.Item>
        <Form.Item
          label={JPNames.country}
          name="country"
        >
          <Input
            placeholder="国を入力（任意）"
            allowClear
          />
        </Form.Item>
        <Form.Item
          label={JPNames.website}
          name="website"
        >
          <Input
            placeholder="ウェブサイトURLを入力（任意）"
            allowClear
          />
        </Form.Item>
      </Form>
    </BookModal>
  )
}

export default function Brand() {
  // テーブルデータとカラム定義
  const [data, setData] = useState<Array<BrandColumn>>([])
  const [tableLoading, setTableLoading] = useState<boolean>(false)

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
      title: JPNames.brandName,
      dataIndex: 'brandName',
      key: 'brandName',
      className: 'cell-title',
      onCell: () => ({ 'data-label': JPNames.brandName }),
    },
    {
      title: JPNames.description,
      dataIndex: 'description',
      key: 'description',
      onCell: () => ({ 'data-label': JPNames.description }),
    },
    {
      title: JPNames.country,
      dataIndex: 'country',
      key: 'country',
      onCell: () => ({ 'data-label': JPNames.country }),
    },
    {
      title: JPNames.website,
      dataIndex: 'website',
      key: 'website',
      onCell: () => ({ 'data-label': JPNames.website }),
      render: (url: string) =>
        url ? (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
          >
            {url}
          </a>
        ) : (
          '-'
        ),
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right' as const,
      width: 150,
      onCell: () => ({ 'data-label': '操作' }),
      render: (_: any, record: BrandColumn) => (
        <Space size="middle">
          <a>
            <i className="i-material-symbols:edit-document-outline-rounded hover:material-symbols:edit-document-rounded"></i>
            編集
          </a>
          <a onClick={() => handleDeleteBrand(record)}>
            <i className="i-material-symbols:delete-outline-rounded hover:i-material-symbols:delete-rounded"></i>
            削除
          </a>
        </Space>
      ),
    },
  ]

  // データの取得
  useEffect(() => {
    fetchBrands()
  }, [])

  // ブランドデータ取得
  function fetchBrands() {
    setTableLoading(true)
    getBrands()
      .then((res) => {
        setData(res?.data || [])
        setTableLoading(false)
      })
      .catch((error) => {
        console.error(error)
        setTableLoading(false)
        notification.error({
          title: 'ブランドデータ取得失敗',
          description: error.message,
          placement: 'bottomRight',
          showProgress: true,
          pauseOnHover: true,
        })
      })
  }

  const toggleSelection = (record: BrandColumn, e: React.MouseEvent) => {
    e.stopPropagation()
    const isSelected = selectedRows.find((r) => r.id === record.id)
    if (isSelected) {
      setSelectedRows(selectedRows.filter((r) => r.id !== record.id))
    } else {
      setSelectedRows([...selectedRows, record])
    }
  }

  /*************** 新規ブランドを追加/ブランドを編集 ***************/
  const [isAdd, setIsAdd] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<BrandColumn | null>(null)

  // モーダルの表示
  const showModal = (isAdd: boolean, record?: BrandColumn) => {
    setIsModalOpen(true)
    setIsAdd(isAdd)
    setEditingRecord(record || null)
  }

  // モーダルのキャンセル
  const handleCancel = () => {
    setIsModalOpen(false)
    setEditingRecord(null)
  }

  // ブランド保存成功時
  const handleSuccess = () => {
    fetchBrands()
  }

  /*************** ブランドを削除 ***************/
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedRows, setSelectedRows] = useState<BrandColumn[]>([])
  const [actionRow, setActionRow] = useState<BrandColumn | null>(null)
  const [isDeleteOne, setIsDeleteOne] = useState<boolean>(false)

  // テーブルの行選択時
  function onRowSelectionChange(_selectedKeys: any, selectedRows: BrandColumn[]) {
    setSelectedRows(selectedRows)
  }

  // 削除ボタン押下時
  function handleDeleteBrand(record?: BrandColumn) {
    setIsDeleteOne(!!record)
    if (record) {
      setActionRow(record)
      setIsDeleteModalOpen(true)
    } else if (selectedRows.length) {
      setIsDeleteModalOpen(true)
    } else {
      message.warning('削除するブランドを選択してください')
    }
  }

  // 確認モーダルで削除を確定
  function confirmDeleteBrand() {
    const rows = isDeleteOne ? [actionRow] : selectedRows
    setTableLoading(true)
    deleteBrands(rows.map((row) => row!.id))
      .then(() => {
        setIsDeleteModalOpen(false)
        message.success(
          `ブランド${rows.length > 1 ? `${rows.length}件` : `ID: ${rows[0]!.id}`}を削除しました`
        )

        return getBrands()
      })
      .then((res) => {
        setData(res?.data || [])
        setTableLoading(false)
        setSelectedRows([])
      })
      .catch((error) => {
        console.error(error)
        setTableLoading(false)

        notification.error({
          title: 'ブランド削除失敗',
          description: `ブランド${
            rows.length > 1 ? `${rows.length}件` : `ID: ${rows[0]!.id}`
          }の削除に失敗しました: ${error.message}`,
          placement: 'bottomRight',
          showProgress: true,
          pauseOnHover: true,
        })
      })
  }

  // 確認モーダルで削除をキャンセル
  function cancelDeleteBrand() {
    setIsDeleteModalOpen(false)
  }

  return (
    <div className="h-[cal(100vh - 7rem)]">
      <PageHeader
        title="ブランド一覧"
        onAdd={() => showModal(true)}
        onDelete={() => handleDeleteBrand()}
        deleteDisabled={selectedRows.length === 0}
      />

      <div className="doodle-card-grid mt-6">
        {data.map((record) => (
          <DoodleCard
            key={record.id}
            id={record.id}
            title={record.brandName}
            selected={!!selectedRows.find((r) => r.id === record.id)}
            onToggleSelection={(e) => toggleSelection(record, e)}
            onEdit={(e) => {
              e.stopPropagation()
              showModal(false, record)
            }}
            onDelete={(e) => {
              e.stopPropagation()
              handleDeleteBrand(record)
            }}
          >
            <DoodleCardRow
              label={JPNames.country}
              value={record.country || '-'}
            />
            <DoodleCardRow
              label={JPNames.website}
              value={
                record.website ? (
                  <a
                    href={record.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    リンク
                  </a>
                ) : (
                  '-'
                )
              }
            />
            <DoodleCardRow
              label={JPNames.description}
              value={record.description || '-'}
            />
          </DoodleCard>
        ))}
      </div>
      {/* <Table
        dataSource={data}
        columns={columns}
        loading={tableLoading}
        rowKey="id"
        onRow={(record) => ({
          onClick: () => showModal(false, record),
        })}
        rowSelection={{
          type: 'checkbox',
          onChange: onRowSelectionChange,
        }}
        className="mt-6"
        scroll={{ x: 'max-content' }}
      /> */}
      {/* 削除確認モーダル */}
      <BookModal
        title="ブランド削除"
        // closable={true}
        open={isDeleteModalOpen}
        onOk={confirmDeleteBrand}
        onCancel={cancelDeleteBrand}
        okText="削除"
        cancelText="キャンセル"
        footer={
          <Space>
            <Button onClick={cancelDeleteBrand}>キャンセル</Button>
            <Button
              type="primary"
              danger
              onClick={confirmDeleteBrand}
            >
              削除
            </Button>
          </Space>
        }
      >
        <p>
          ブランド
          {isDeleteOne || selectedRows.length === 1
            ? `ID: ${isDeleteOne ? actionRow!.id : selectedRows[0].id}`
            : `${selectedRows.length}件`}
          を削除しますか？
        </p>
      </BookModal>
      {/* ブランド追加・編集モーダル */}
      <BrandAddModal
        open={isModalOpen}
        isEditMode={!isAdd}
        editingRecord={editingRecord}
        onCancel={handleCancel}
        onSuccess={handleSuccess}
      />
    </div>
  )
}
