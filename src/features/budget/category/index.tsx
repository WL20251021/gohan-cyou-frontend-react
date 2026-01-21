import { useState, useEffect } from 'react'
import type { Color } from 'antd/es/color-picker'
import {
  Flex,
  Table,
  Button,
  Form,
  Input,
  Space,
  notification,
  message,
  ColorPicker,
  Checkbox,
} from 'antd'
import BookModal from '../../../components/BookModal'
import PageHeader from '../../../components/PageHeader'
import DoodleCard, { DoodleCardRow } from '../../../components/DoodleCard'
import { CategoryColumn, JPNames } from './columns'
import { getCategories, addCategory, updateCategory, deleteCategory } from './api'

// カテゴリモーダルコンポーネント（追加・編集両方に対応、他のコンポーネントから使用可能）
export function CategoryModal({
  open,
  mode = 'add',
  initialData,
  onCancel,
  onSuccess,
}: {
  open: boolean
  mode?: 'add' | 'edit'
  initialData?: CategoryColumn
  onCancel: () => void
  onSuccess?: (category: CategoryColumn) => void
}) {
  const [form] = Form.useForm<CategoryColumn>()
  const [confirmLoading, setConfirmLoading] = useState(false)
  const [colorHex, setColorHex] = useState('000000')

  // モーダルが開いたときにフォームを初期化
  useEffect(() => {
    if (open) {
      if (mode === 'edit' && initialData) {
        form.setFieldsValue(initialData)
        setColorHex(initialData.color)
      } else {
        form.resetFields()
        setColorHex('000000')
      }
    }
  }, [open, mode, initialData, form])

  // カラーピッカー変更時
  const onColorChange = (color: Color) => {
    const hex = color.toHex().toUpperCase()
    setColorHex(hex)
    form.setFieldValue('color', hex)
  }

  // カテゴリー保存の確定
  const handleSaveCategory = async () => {
    try {
      setConfirmLoading(true)
      const values = await form.validateFields()

      if (mode === 'add') {
        await addCategory({ ...values, color: colorHex })
        message.success('カテゴリーを追加しました')
      } else {
        await updateCategory(values.id, { ...values, color: colorHex })
        message.success('カテゴリーを更新しました')
      }

      const res = await getCategories()
      form.resetFields()
      setColorHex('000000')

      // 保存したカテゴリーを返す
      if (onSuccess && res?.data?.length > 0) {
        const savedCategory =
          mode === 'add'
            ? res.data[res.data.length - 1] // 追加時は最後の要素
            : res.data.find((cat: any) => cat.id === values.id) || res.data[res.data.length - 1] // 編集時はIDで検索
        onSuccess(savedCategory)
      }

      onCancel()
    } catch (error: any) {
      console.error(error)
      notification.error({
        title: mode === 'add' ? 'カテゴリー追加失敗' : 'カテゴリー更新失敗',
        description: error.message,
        placement: 'bottomRight',
        showProgress: true,
        pauseOnHover: true,
      })
    } finally {
      setConfirmLoading(false)
    }
  }

  return (
    <BookModal
      title={mode === 'add' ? 'カテゴリーを追加' : 'カテゴリーを編集'}
      // width="80%"
      // maskClosable={false}
      open={open}
      confirmLoading={confirmLoading}
      onOk={handleSaveCategory}
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
        {mode === 'edit' && (
          <Form.Item
            label={JPNames.id}
            name="id"
          >
            <Input disabled />
          </Form.Item>
        )}
        <Form.Item
          label={JPNames.categoryName}
          name="categoryName"
          rules={[{ required: true, message: '日本語名を入力してください!' }]}
        >
          <Input allowClear />
        </Form.Item>
        <Form.Item
          label={JPNames.description}
          name="description"
        >
          <Input.TextArea
            allowClear
            autoSize={{ minRows: 2, maxRows: 6 }}
          />
        </Form.Item>
        <Form.Item
          label={JPNames.icon}
          name="icon"
        >
          <Input
            allowClear
            placeholder="例: i-material-symbols:category"
          />
        </Form.Item>
        <Form.Item
          label={JPNames.color}
          name="color"
        >
          <ColorPicker
            format="hex"
            value={`#${colorHex}`}
            onChange={onColorChange}
            showText
          />
        </Form.Item>
      </Form>
    </BookModal>
  )
}

// 後方互換性のためのエイリアス
export const CategoryAddModal = CategoryModal

export default function Category() {
  // ========== テーブル関連の状態 ==========
  const [data, setData] = useState<CategoryColumn[]>([])
  const [tableLoading, setTableLoading] = useState(false)
  const [selectedRows, setSelectedRows] = useState<CategoryColumn[]>([])

  // テーブルのカラム定義
  const columns = [
    {
      title: JPNames.id,
      dataIndex: 'id',
      key: 'id',
      className: 'cell-id',
      onCell: () => ({ 'data-label': JPNames.id }) as any,
    },
    {
      title: JPNames.categoryName,
      dataIndex: 'categoryName',
      key: 'categoryName',
      className: 'cell-title',
      onCell: () => ({ 'data-label': JPNames.categoryName }) as any,
    },
    {
      title: JPNames.icon,
      dataIndex: 'icon',
      key: 'icon',
      onCell: () => ({ 'data-label': JPNames.icon }) as any,
      render: (icon: string) => <i className={icon}></i>,
    },
    {
      title: JPNames.color,
      dataIndex: 'color',
      key: 'color',
      onCell: () => ({ 'data-label': JPNames.color }) as any,
      render: (color: string) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '20px',
              height: '20px',
              backgroundColor: `#${color}`,
              border: '1px solid #ccc',
            }}
          ></div>
          <span>#{color}</span>
        </div>
      ),
    },
    {
      title: '操作',
      key: 'action',
      onCell: () => ({ 'data-label': '操作' }) as any,
      render: (_: any, record: CategoryColumn) => (
        <Space size="middle">
          <a>
            <i className="i-material-symbols:edit-document-outline-rounded hover:material-symbols:edit-document-rounded "></i>
            編集
          </a>
          <a onClick={() => handleDeleteCategory(record)}>
            <i className="i-material-symbols:delete-outline-rounded hover:i-material-symbols:delete-rounded "></i>
            削除
          </a>
        </Space>
      ),
    },
  ]
  // 初回レンダリング時にデータを取得
  useEffect(() => {
    fetchCategories()
  }, [])

  const toggleSelection = (record: CategoryColumn, e: React.MouseEvent) => {
    e.stopPropagation()
    const isSelected = selectedRows.find((r) => r.id === record.id)
    if (isSelected) {
      setSelectedRows(selectedRows.filter((r) => r.id !== record.id))
    } else {
      setSelectedRows([...selectedRows, record])
    }
  }

  // カテゴリーデータを取得する共通関数
  const fetchCategories = async () => {
    try {
      setTableLoading(true)
      const res = await getCategories()
      setData(res?.data || [])
    } catch (error) {
      console.error(error)
    } finally {
      setTableLoading(false)
    }
  }

  // ========== カテゴリー追加/編集モーダル関連の状態 ==========
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<CategoryColumn | undefined>()

  // モーダルの表示
  const showModal = (mode: 'add' | 'edit', record?: CategoryColumn) => {
    setModalMode(mode)
    setEditingCategory(record)
    setIsModalOpen(true)
  }

  // モーダルのキャンセル
  const handleModalCancel = () => {
    setIsModalOpen(false)
    setEditingCategory(undefined)
  }

  // モーダル保存成功時
  const handleModalSuccess = () => {
    fetchCategories()
  }

  // ========== カテゴリー削除関連の状態 ==========
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [actionRow, setActionRow] = useState<CategoryColumn | null>(null)
  const [isDeleteOne, setIsDeleteOne] = useState(false)

  // テーブルの行選択時
  const onRowSelectionChange = (_selectedKeys: React.Key[], selectedRows: CategoryColumn[]) => {
    setSelectedRows(selectedRows)
  }

  // 削除ボタン押下時
  const handleDeleteCategory = (record?: CategoryColumn) => {
    setIsDeleteOne(!!record)

    if (record) {
      // 行の操作から削除
      setActionRow(record)
      setIsDeleteModalOpen(true)
    } else if (selectedRows.length) {
      // 選択された行を削除
      setIsDeleteModalOpen(true)
    } else {
      message.warning('削除するカテゴリーを選択してください')
    }
  }

  // 確認モーダルで削除を確定
  const confirmDeleteCategory = async () => {
    const rows = isDeleteOne ? [actionRow] : selectedRows
    const categoryNames =
      rows.length > 1
        ? `${rows.map((v) => v!.categoryName).join('、')}など${rows.length}件のカテゴリー`
        : rows[0]!.categoryName

    try {
      await deleteCategory(rows.map((row) => row!.id))
      setIsDeleteModalOpen(false)
      message.success(`カテゴリー${categoryNames}を削除しました`)

      await fetchCategories()
    } catch (error: any) {
      console.error(error)
      notification.error({
        title: 'カテゴリー削除失敗',
        description: `カテゴリー${categoryNames}の削除に失敗しました: ${error.message}`,
        placement: 'bottomRight',
        showProgress: true,
        pauseOnHover: true,
      })
    }
  }

  // 確認モーダルで削除をキャンセル
  const cancelDeleteCategory = () => {
    setIsDeleteModalOpen(false)
  }

  return (
    <div className="h-[cal(100vh - 7rem)]">
      <PageHeader
        title="カテゴリー一覧"
        onAdd={() => showModal('add')}
        onDelete={() => handleDeleteCategory()}
        deleteDisabled={selectedRows.length === 0}
      />
      <div className="doodle-card-grid mt-6">
        {data.map((record) => (
          <DoodleCard
            key={record.id}
            id={record.id}
            title={record.categoryName}
            selected={!!selectedRows.find((r) => r.id === record.id)}
            onToggleSelection={(e) => toggleSelection(record, e)}
            onEdit={(e) => {
              e.stopPropagation()
              showModal('edit', record)
            }}
            onDelete={(e) => {
              e.stopPropagation()
              handleDeleteCategory(record)
            }}
          >
            <DoodleCardRow
              label={JPNames.icon}
              value={
                <span>
                  <i className={record.icon}></i>
                </span>
              }
            />
            <DoodleCardRow
              label={JPNames.color}
              value={
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div
                    style={{
                      width: '20px',
                      height: '20px',
                      backgroundColor: `#${record.color}`,
                      border: '1px solid #ccc',
                    }}
                  ></div>
                  <span>#{record.color}</span>
                </div>
              }
            />
            <DoodleCardRow
              label={JPNames.description}
              value={record.description || '-'}
            />
          </DoodleCard>
        ))}
      </div>
      {/* 削除確認モーダル */}
      <BookModal
        title="カテゴリー削除"
        open={isDeleteModalOpen}
        onOk={confirmDeleteCategory}
        onCancel={cancelDeleteCategory}
        okText="削除"
        cancelText="キャンセル"
        footer={
          <Space>
            <Button onClick={cancelDeleteCategory}>キャンセル</Button>
            <Button
              type="primary"
              danger
              onClick={confirmDeleteCategory}
            >
              削除
            </Button>
          </Space>
        }
      >
        <p>
          カテゴリー
          {isDeleteOne || selectedRows.length === 1
            ? `${isDeleteOne ? actionRow!.categoryName : selectedRows[0].categoryName}`
            : `${selectedRows.map((v) => v.categoryName).join('、')}など${
                selectedRows.length
              }件のカテゴリー`}
          を削除しますか？
        </p>
      </BookModal>
      {/* カテゴリー追加/編集モーダル */}
      <CategoryModal
        open={isModalOpen}
        mode={modalMode}
        initialData={editingCategory}
        onCancel={handleModalCancel}
        onSuccess={handleModalSuccess}
      />
    </div>
  )
}
