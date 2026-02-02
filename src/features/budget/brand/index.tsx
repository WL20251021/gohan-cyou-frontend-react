import { useState, useEffect } from 'react'
import { Form, Input, message } from 'antd'
import notification from '@/components/DoodleNotification'
import BookModal from '@/components/BookModal'
import BookDetailModal from '@/components/BookDetailModal'
import PageHeader from '@/components/PageHeader'
import DoodleCard, { DoodleCardRow } from '@/components/DoodleCard'
import PaginatedGrid from '@/components/PaginatedGrid'
import { BrandColumn, JPNames } from './columns'
import { getBrands, addBrand, updateBrand, deleteBrands } from './api'

import { useBookPage } from '@/hooks/useBookPage'

// ブランド追加・編集モーダルコンポーネント（他のコンポーネントから使用可能）
export function BrandAddModal({
  open,
  isEditMode = false,
  editingRecord = null,
  onCancel,
  onSuccess,
  zIndex,
  PAGE_NAME = 'ブランド',
}: {
  open: boolean
  isEditMode?: boolean
  editingRecord?: BrandColumn | null
  onCancel: () => void
  onSuccess?: (newBrand?: BrandColumn) => void
  zIndex?: number
  PAGE_NAME?: string
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
        message.success(`${PAGE_NAME}を${isEditMode ? '更新' : '追加'}しました`)
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
            title: `${PAGE_NAME}${isEditMode ? '更新' : '追加'}失敗`,
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
      manualFlip={true}
      title={`${PAGE_NAME}を${isEditMode ? '編集' : '追加'}`}
      open={open}
      confirmLoading={confirmLoading}
      onOk={handleSaveBrand}
      onCancel={onCancel}
      okText="保存"
      cancelText="キャンセル"
      zIndex={zIndex}
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
          rules={[{ required: true, message: `${PAGE_NAME}名を入力してください!` }]}
        >
          <Input placeholder={`${PAGE_NAME}名を入力`} />
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
  } = useBookPage<BrandColumn>({
    fetchList: getBrands,
    deleteItem: deleteBrands,
  })

  return (
    <div className="book-page-container">
      <PageHeader
        title={`${PAGE_NAME}一覧`}
        onAdd={() => showModal(true)}
        onDelete={() => handleDelete(selectedRows.map((r) => r.id))}
        deleteDisabled={selectedRows.length === 0}
        data={data}
      />

      <PaginatedGrid
        className="book-page-content"
        data={data as BrandColumn[]}
        onAdd={() => showModal(true)}
        renderItem={(record: BrandColumn) => (
          <DoodleCard
            key={record.id}
            id={record.id}
            title={record.brandName}
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
                    style={{ color: 'var(--color-primary)' }}
                  >
                    {record.brandName}
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
        )}
      />

      <BrandAddModal
        open={isModalOpen}
        isEditMode={!isAdd}
        editingRecord={editingRecord as BrandColumn | null}
        onCancel={handleCancel}
        onSuccess={handleSuccess}
        PAGE_NAME={PAGE_NAME}
      />

      <BookDetailModal
        manualFlip={true}
        open={isDetailOpen}
        title={detailRecord?.brandName}
        subtitle={`${PAGE_NAME}詳細`}
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
              label={JPNames.brandName}
              value={detailRecord.brandName}
            />
            <DoodleCardRow
              label={JPNames.description}
              value={detailRecord.description || '-'}
            />
            <DoodleCardRow
              label={JPNames.country}
              value={detailRecord.country || '-'}
            />
            <DoodleCardRow
              label={JPNames.website}
              value={
                detailRecord.website ? (
                  <a
                    href={detailRecord.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'var(--color-primary)' }}
                  >
                    {detailRecord.brandName}
                  </a>
                ) : (
                  '-'
                )
              }
            />
          </div>
        )}
      </BookDetailModal>
    </div>
  )
}
