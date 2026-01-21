import { useState, useEffect } from 'react'
import {
  Flex,
  Table,
  Button,
  Form,
  Input,
  Select,
  Space,
  notification,
  message,
  Checkbox,
} from 'antd'
import BookModal from '../../../components/BookModal'
import PageHeader from '../../../components/PageHeader'
import DoodleCard, { DoodleCardRow } from '../../../components/DoodleCard'
import {
  StoreColumn,
  JPNames,
  JPCountries,
  JPStoreTypes,
  STORES,
  type StoreType,
  type CountryType,
  COUNTRIES,
} from './columns'
import { getStores, addStore, updateStore, deleteStores } from './api'

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
        message.success(isEditMode ? '店舗を更新しました' : '店舗を追加しました')
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
            title: isEditMode ? '店舗更新失敗' : '店舗追加失敗',
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
      title={isEditMode ? '店舗を編集' : '店舗を追加'}
      // width="80%" // Removed as BookModal handles width via layout
      // maskClosable={false}
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
          rules={[{ required: true, message: '店舗名を入力してください!' }]}
        >
          <Input placeholder="店舗名を入力" />
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
  // テーブルデータとカラム定義
  const [data, setData] = useState<Array<StoreColumn>>([])
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
      title: JPNames.storeName,
      dataIndex: 'storeName',
      key: 'storeName',
      className: 'cell-title',
      onCell: () => ({ 'data-label': JPNames.storeName }),
    },
    {
      title: JPNames.storeType,
      dataIndex: 'storeType',
      key: 'storeType',
      onCell: () => ({ 'data-label': JPNames.storeType }),
      render: (type: StoreType) => {
        const key = Object.keys(STORES).find(
          (k) => STORES[k as keyof typeof STORES] === type
        ) as keyof typeof JPStoreTypes
        return key ? JPStoreTypes[key] : type
      },
    },
    {
      title: JPNames.country,
      dataIndex: 'country',
      key: 'country',
      onCell: () => ({ 'data-label': JPNames.country }),
      render: (country: CountryType) => JPCountries[country as keyof typeof JPCountries] || country,
    },
    {
      title: JPNames.city,
      dataIndex: 'city',
      key: 'city',
      onCell: () => ({ 'data-label': JPNames.city }),
    },
    {
      title: JPNames.address,
      dataIndex: 'address',
      key: 'address',
      onCell: () => ({ 'data-label': JPNames.address }),
    },
    {
      title: JPNames.url,
      dataIndex: 'url',
      key: 'url',
      onCell: () => ({ 'data-label': JPNames.url }),
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
      render: (_: unknown, record: StoreColumn) => (
        <Space size="middle">
          <a>
            <i className="i-material-symbols:edit-document-outline-rounded hover:material-symbols:edit-document-rounded"></i>
            編集
          </a>
          <a onClick={() => handleDeleteSingle(record)}>
            <i className="i-material-symbols:delete-outline-rounded hover:i-material-symbols:delete-rounded"></i>
            削除
          </a>
        </Space>
      ),
    },
  ]

  // データの取得
  useEffect(() => {
    fetchStores()
  }, [])

  // 店舗データ取得
  function fetchStores() {
    setTableLoading(true)
    getStores()
      .then((res) => {
        setData(res?.data || [])
        setTableLoading(false)
      })
      .catch((error) => {
        console.error(error)
        setTableLoading(false)
        notification.error({
          title: '店舗データ取得失敗',
          description: error.message,
          placement: 'bottomRight',
          showProgress: true,
          pauseOnHover: true,
        })
      })
  }

  const toggleSelection = (record: StoreColumn, e: React.MouseEvent) => {
    e.stopPropagation()
    const isSelected = selectedRows.find((r) => r.id === record.id)
    if (isSelected) {
      setSelectedRows(selectedRows.filter((r) => r.id !== record.id))
    } else {
      setSelectedRows([...selectedRows, record])
    }
  }

  /*************** 新規店舗を追加/店舗を編集 ***************/
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<StoreColumn | null>(null)

  // 新規追加モーダル表示
  const handleAdd = () => {
    setEditingRecord(null)
    setIsModalOpen(true)
  }

  // 編集モーダル表示
  const handleEdit = (record: StoreColumn) => {
    setEditingRecord(record)
    setIsModalOpen(true)
  }

  // モーダルのキャンセル
  const handleModalCancel = () => {
    setIsModalOpen(false)
    setEditingRecord(null)
  }

  // 店舗保存成功時
  const handleModalSuccess = () => {
    fetchStores()
  }

  /*************** 店舗を削除 ***************/
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedRows, setSelectedRows] = useState<StoreColumn[]>([])
  const [deletingRows, setDeletingRows] = useState<StoreColumn[]>([])

  // テーブルの行選択時
  const handleRowSelectionChange = (_: unknown, rows: StoreColumn[]) => {
    setSelectedRows(rows)
  }

  // 単一行削除
  const handleDeleteSingle = (record: StoreColumn) => {
    setDeletingRows([record])
    setIsDeleteModalOpen(true)
  }

  // 複数行削除
  const handleDeleteMultiple = () => {
    if (selectedRows.length === 0) {
      message.warning('削除する店舗を選択してください')
      return
    }
    setDeletingRows(selectedRows)
    setIsDeleteModalOpen(true)
  }

  // 削除を確定
  const confirmDelete = () => {
    setTableLoading(true)
    const ids = deletingRows.map((row) => row.id)
    const count = deletingRows.length
    const displayText = count === 1 ? `ID: ${ids[0]}` : `${count}件`

    deleteStores(ids)
      .then(() => {
        message.success(`店舗${displayText}を削除しました`)
        return getStores()
      })
      .then((res) => {
        setData(res?.data || [])
        setSelectedRows([])
        setIsDeleteModalOpen(false)
      })
      .catch((error) => {
        console.error(error)
        notification.error({
          title: '店舗削除失敗',
          description: `店舗${displayText}の削除に失敗しました: ${error.message}`,
          placement: 'bottomRight',
          showProgress: true,
          pauseOnHover: true,
        })
      })
      .finally(() => {
        setTableLoading(false)
      })
  }

  // 削除をキャンセル
  const cancelDelete = () => {
    setIsDeleteModalOpen(false)
    setDeletingRows([])
  }

  return (
    <div className="h-[cal(100vh - 7rem)]">
      <PageHeader
        title="店舗一覧"
        onAdd={handleAdd}
        onDelete={handleDeleteMultiple}
        deleteDisabled={selectedRows.length === 0}
      />
      <div className="doodle-card-grid mt-6">
        {data.map((record) => {
          const storeTypeKey = Object.keys(STORES).find(
            (k) => STORES[k as keyof typeof STORES] === record.storeType
          ) as keyof typeof JPStoreTypes
          const storeTypeLabel = storeTypeKey ? JPStoreTypes[storeTypeKey] : record.storeType

          return (
            <DoodleCard
              key={record.id}
              id={record.id}
              title={record.storeName}
              selected={!!selectedRows.find((r) => r.id === record.id)}
              onToggleSelection={(e) => toggleSelection(record, e)}
              onEdit={(e) => {
                e.stopPropagation()
                handleEdit(record)
              }}
              onDelete={(e) => {
                e.stopPropagation()
                handleDeleteSingle(record)
              }}
            >
              <DoodleCardRow
                label={JPNames.storeType}
                value={storeTypeLabel}
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
              <DoodleCardRow
                label={JPNames.url}
                value={
                  record.url ? (
                    <a
                      href={record.url}
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
            </DoodleCard>
          )
        })}
      </div>
      {/* 削除確認モーダル */}
      <BookModal
        title="店舗削除"
        open={isDeleteModalOpen}
        onOk={confirmDelete}
        onCancel={cancelDelete}
        okText="削除"
        cancelText="キャンセル"
        // okButtonProps={{ danger: true }} // BookModal may need to support this or we ignore for now
        footer={
          <Space>
            <Button onClick={cancelDelete}>キャンセル</Button>
            <Button
              type="primary"
              danger
              onClick={confirmDelete}
              loading={tableLoading}
            >
              削除
            </Button>
          </Space>
        }
      >
        <p>
          店舗{deletingRows.length === 1 ? `ID: ${deletingRows[0].id}` : `${deletingRows.length}件`}
          を削除しますか？
        </p>
      </BookModal>
      {/* 店舗追加・編集モーダル */}
      <StoreAddModal
        open={isModalOpen}
        isEditMode={!!editingRecord}
        editingRecord={editingRecord}
        onCancel={handleModalCancel}
        onSuccess={handleModalSuccess}
      />
    </div>
  )
}
