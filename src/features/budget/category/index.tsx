import { useState, useEffect } from 'react'
import type { Color } from 'antd/es/color-picker'
import { Form, Input, notification, message, ColorPicker } from 'antd'
import BookModal from '../../../components/BookModal'
import BookDetailModal from '../../../components/BookDetailModal'
import PageHeader from '../../../components/PageHeader'
import DoodleCard, { DoodleCardRow } from '../../../components/DoodleCard'
import PaginatedGrid from '../../../components/PaginatedGrid'
import { CategoryColumn, JPNames } from './columns'
import { getCategories, addCategory, updateCategory, deleteCategory } from './api'
import { useBookPage } from '../../../hooks/useBookPage'

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
  } = useBookPage<CategoryColumn>({
    fetchList: getCategories,
    deleteItem: deleteCategory,
    itemName: 'カテゴリー',
  })

  return (
    <div className="book-page-container">
      <PageHeader
        title="カテゴリー一覧"
        onAdd={() => showModal(true)}
        onDelete={() => handleDelete(selectedRows.map((r) => r.id))}
        deleteDisabled={selectedRows.length === 0}
        data={data}
      />
      <PaginatedGrid
        className="book-page-content"
        data={data as CategoryColumn[]}
        renderItem={(record: CategoryColumn) => (
          <DoodleCard
            key={record.id}
            id={record.id}
            title={record.categoryName}
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
              label={JPNames.icon}
              value={<i className={record.icon}></i>}
            />
            <DoodleCardRow
              label={JPNames.color}
              value={
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      backgroundColor: `#${record.color}`,
                      border: '1px solid #ccc',
                    }}
                  />
                  <span>#{record.color}</span>
                </div>
              }
            />
            <DoodleCardRow
              label={JPNames.description}
              value={record.description || '-'}
            />
          </DoodleCard>
        )}
      />

      <CategoryModal
        open={isModalOpen}
        mode={isAdd ? 'add' : 'edit'}
        initialData={editingRecord as CategoryColumn | undefined}
        onCancel={handleCancel}
        onSuccess={handleSuccess}
      />

      <BookDetailModal
        open={isDetailOpen}
        title={detailRecord?.categoryName}
        subtitle="Category Details"
        id={detailRecord?.id}
        onClose={closeDetail}
        onEdit={handleDetailEdit}
        onNext={nextDetail}
        onPrev={prevDetail}
        hasNext={hasNext}
        hasPrev={hasPrev}
      >
        {detailRecord && (
          <div className="flex flex-col gap-4">
            <DoodleCardRow
              label={JPNames.categoryName}
              value={detailRecord.categoryName}
            />
            <DoodleCardRow
              label={JPNames.icon}
              value={
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i
                    className={detailRecord.icon}
                    style={{ fontSize: '1.2rem' }}
                  ></i>
                  <span>{detailRecord.icon}</span>
                </div>
              }
            />
            <DoodleCardRow
              label={JPNames.color}
              value={
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      backgroundColor: `#${detailRecord.color}`,
                      border: '2px solid var(--color-ink-black)',
                      borderRadius: '4px',
                    }}
                  />
                  <span>#{detailRecord.color}</span>
                </div>
              }
            />
          </div>
        )}
      </BookDetailModal>
    </div>
  )
}
