import { useState, useEffect } from 'react'
import { Form, Input, Select, message } from 'antd'
import notification from '@/components/DoodleNotification'
import BookModal from '@/components/BookModal'
import BookDetailModal from '@/components/BookDetailModal'
import PageHeader from '@/components/PageHeader'
import DoodleCard, { DoodleCardRow } from '@/components/DoodleCard'
import PaginatedGrid from '@/components/PaginatedGrid'
import {
  StoreColumn,
  JPNames,
  JPCountries,
  JPStoreTypes,
  STORES,
  type StoreType,
  COUNTRIES,
} from './columns'
import { getStores, addStore, updateStore, deleteStores } from './api'
import { useBookPage } from '@/hooks/useBookPage'

import { PAGE_NAMES } from '@/layout'
const currentPath = window.location.pathname
const PAGE_NAME = PAGE_NAMES[currentPath] || '店舗'

// 店舗追加・編集モーダルコンポーネント（他のコンポーネントから使用可能）
export function StoreAddModal({
  open,
  isEditMode = false,
  editingRecord = null,
  onCancel,
  onSuccess,
}: {
  open: boolean
  isEditMode?: boolean
  editingRecord?: StoreColumn | null
  onCancel: () => void
  onSuccess?: (newStore?: StoreColumn) => void
}) {
  const [form] = Form.useForm<StoreColumn>()
  const [confirmLoading, setConfirmLoading] = useState(false)
  const [showUrl, setShowUrl] = useState(false)

  // モーダルが開いたときにフォームをリセットまたは設定
  useEffect(() => {
    if (open) {
      if (isEditMode && editingRecord) {
        form.setFieldsValue(editingRecord)
        setShowUrl(editingRecord.storeType === STORES.Online)
      } else {
        form.resetFields()
        setShowUrl(false)
      }
    }
  }, [open, isEditMode, editingRecord, form])

  // 店舗タイプ変更時のハンドラー
  function onStoreTypeChange(value: StoreType) {
    setShowUrl(value === STORES.Online)
  }

  // 店舗保存
  function handleSaveStore() {
    setConfirmLoading(true)
    form
      .validateFields()
      .then((values) => {
        if (isEditMode && editingRecord) {
          return updateStore(editingRecord.id, values)
        } else {
          return addStore(values)
        }
      })
      .then(() => {
        return getStores()
      })
      .then((res) => {
        form.resetFields()
        message.success(`${PAGE_NAME}を${isEditMode ? '更新' : '追加'}しました`)
        setConfirmLoading(false)

        // 追加/更新した店舗を返す
        if (onSuccess) {
          if (isEditMode) {
            onSuccess()
          } else if (res?.data?.length > 0) {
            const newStore = res.data[res.data.length - 1]
            onSuccess(newStore)
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
      onOk={handleSaveStore}
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
        initialValues={{ storeType: STORES.Supermarket, country: COUNTRIES.Japan }}
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
          label={JPNames.storeName}
          name="storeName"
          rules={[{ required: true, message: `${PAGE_NAME}名を入力してください!` }]}
        >
          <Input placeholder={`${PAGE_NAME}名を入力`} />
        </Form.Item>
        <Form.Item
          label={JPNames.storeType}
          name="storeType"
        >
          <Select
            onChange={onStoreTypeChange}
            options={(Object.keys(JPStoreTypes) as Array<keyof typeof JPStoreTypes>).map((k) => ({
              label: JPStoreTypes[k],
              value: STORES[k],
            }))}
          />
        </Form.Item>
        {!showUrl ? (
          <>
            <Form.Item
              label={JPNames.country}
              name="country"
            >
              <Select
                options={(Object.keys(JPCountries) as Array<keyof typeof JPCountries>).map((k) => ({
                  label: JPCountries[k],
                  value: COUNTRIES[k],
                }))}
              />
            </Form.Item>
            <Form.Item
              label={JPNames.city}
              name="city"
            >
              <Input
                placeholder="市区町村を入力（任意）"
                allowClear
              />
            </Form.Item>
            <Form.Item
              label={JPNames.address}
              name="address"
            >
              <Input
                placeholder="所在地を入力（任意）"
                allowClear
              />
            </Form.Item>
          </>
        ) : (
          <Form.Item
            label={JPNames.url}
            name="url"
          >
            <Input
              placeholder="ウェブサイトURLを入力（任意）"
              allowClear
            />
          </Form.Item>
        )}
      </Form>
    </BookModal>
  )
}

export default function Store() {
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
  } = useBookPage<StoreColumn>({
    fetchList: getStores,
    deleteItem: deleteStores,
    itemName: `${PAGE_NAME}管理`,
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
        onAdd={() => showModal(true)}
        data={data as StoreColumn[]}
        renderItem={(record: StoreColumn) => (
          <DoodleCard
            key={record.id}
            id={record.id}
            title={record.storeName}
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
              label={JPNames.storeType}
              value={
                JPStoreTypes[
                  Object.keys(STORES).find(
                    (k) => STORES[k as keyof typeof STORES] === record.storeType
                  ) as keyof typeof JPStoreTypes
                ] || record.storeType
              }
            />
            <DoodleCardRow
              label={JPNames.country}
              value={JPCountries[record.country as keyof typeof JPCountries] || record.country}
            />
            <DoodleCardRow
              label={JPNames.city}
              value={record.city || '-'}
            />
            <DoodleCardRow
              label={JPNames.address}
              value={record.address || '-'}
            />
          </DoodleCard>
        )}
      />

      <StoreAddModal
        open={isModalOpen}
        isEditMode={!isAdd}
        editingRecord={editingRecord as StoreColumn | null}
        onCancel={handleCancel}
        onSuccess={handleSuccess}
      />

      <BookDetailModal
        manualFlip={true}
        open={isDetailOpen}
        title={detailRecord?.storeName}
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
              label={JPNames.storeName}
              value={detailRecord.storeName}
            />
            <DoodleCardRow
              label={JPNames.storeType}
              value={
                JPStoreTypes[
                  Object.keys(STORES).find(
                    (k) => STORES[k as keyof typeof STORES] === detailRecord.storeType
                  ) as keyof typeof JPStoreTypes
                ] || detailRecord.storeType
              }
            />
            <DoodleCardRow
              label={JPNames.country}
              value={
                JPCountries[detailRecord.country as keyof typeof JPCountries] ||
                detailRecord.country
              }
            />
            <DoodleCardRow
              label={JPNames.city}
              value={detailRecord.city || '-'}
            />
            <DoodleCardRow
              label={JPNames.address}
              value={detailRecord.address || '-'}
            />
            <DoodleCardRow
              label={JPNames.url}
              value={
                detailRecord.url ? (
                  <a
                    href={detailRecord.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {detailRecord.url}
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
