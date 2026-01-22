import { useState, useCallback, useEffect } from 'react'
import { message, notification, Modal } from 'antd'

export interface BookPageOptions<T> {
  fetchList: () => Promise<{ data: T[] }>
  deleteItem: (ids: any[]) => Promise<any>
  itemName?: string // e.g. "商品", "店舗"
  manualFetch?: boolean // If true, data is not fetched on mount automatically
}

export function useBookPage<T extends { id: any }>(options: BookPageOptions<T>) {
  const { fetchList, deleteItem, itemName = '項目', manualFetch = false } = options

  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedRows, setSelectedRows] = useState<T[]>([])

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isAdd, setIsAdd] = useState(true)
  const [editingRecord, setEditingRecord] = useState<T | null>(null)

  const fetchData = useCallback(() => {
    setLoading(true)
    return fetchList() // Return promise for chaining if needed
      .then((res) => {
        setData(res?.data || [])
      })
      .catch((error) => {
        console.error(error)
        notification.error({
          title: `${itemName}データ取得失敗`,
          description: error.message,
          placement: 'bottomRight',
          showProgress: true,
          pauseOnHover: true,
        })
      })
      .finally(() => {
        setLoading(false)
      })
  }, [fetchList, itemName])

  // Initial fetch
  useEffect(() => {
    if (!manualFetch) {
      fetchData()
    }
  }, [fetchData, manualFetch])

  // Selection Logic
  const toggleSelection = (record: T, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    const isSelected = selectedRows.find((r) => r.id === record.id)
    if (isSelected) {
      setSelectedRows(selectedRows.filter((r) => r.id !== record.id))
    } else {
      setSelectedRows([...selectedRows, record])
    }
  }

  // Modal Logic
  const showModal = (addMode: boolean, record?: T | null) => {
    setIsAdd(addMode)
    setEditingRecord(record || null)
    setIsModalOpen(true)
  }

  const handleCancel = () => {
    setIsModalOpen(false)
    setEditingRecord(null)
  }

  // Pass this to Modal onSuccess
  const handleSuccess = () => {
    fetchData()
  }

  // Batch Delete Logic
  const handleDelete = (ids: any[]) => {
    if (ids.length === 0) return

    const displayText = ids.length === 1 ? `ID: ${ids[0]}` : `${ids.length}件`

    setLoading(true)
    deleteItem(ids)
      .then(() => {
        message.success(`${itemName}${displayText}を削除しました`)
        return fetchList()
      })
      .then((res) => {
        setData(res?.data || [])
        setSelectedRows([]) // Clear selection
      })
      .catch((error) => {
        console.error(error)
        notification.error({
          title: `${itemName}削除失敗`,
          description: error.message,
          placement: 'bottomRight',
        })
      })
      .finally(() => {
        setLoading(false)
      })
  }

  const handleDeleteAction = (record?: T) => {
    if (record) {
      // Single delete confirmation usually handled by Popconfirm in UI
      // But if invoked directly:
      handleDelete([record.id])
    } else if (selectedRows.length) {
      // Batch delete
      Modal.confirm({
        title: '削除確認',
        content: `選択した${selectedRows.length}件の${itemName}を削除しますか？`,
        okText: '削除',
        okType: 'danger',
        cancelText: 'キャンセル',
        onOk: () => handleDelete(selectedRows.map((r) => r.id)),
      })
    } else {
      message.warning('削除する項目を選択してください')
    }
  }

  return {
    data,
    loading,
    selectedRows,
    setSelectedRows,
    toggleSelection,

    isModalOpen,
    isAdd,
    editingRecord,
    showModal,
    handleCancel,
    handleSuccess,

    handleDelete,
    handleDeleteAction,
    fetchData,
    setData,
  }
}
