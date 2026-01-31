import { useState, useCallback, useEffect } from 'react'
import { useLocation } from 'react-router'
import { message, Modal } from 'antd'
import notification from '@/components/DoodleNotification'
import { useBook } from '@/context/BookContext'

import { PAGE_NAMES } from '@/layout'

export interface BookPageOptions<T> {
  fetchList: () => Promise<{ data: T[] }>
  deleteItem: (ids: any[]) => Promise<any>
  itemName?: string // e.g. "商品", "店舗"
  manualFetch?: boolean // If true, data is not fetched on mount automatically
}

export function useBookPage<T extends { id: any }>(options: BookPageOptions<T>) {
  // ページの名前を取得
  const location = useLocation()
  const PAGE_NAME: string = PAGE_NAMES[location.pathname] || '項目'

  const { fetchList, deleteItem, itemName = PAGE_NAME || '項目', manualFetch = false } = options
  const { setFlip } = useBook()

  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedRows, setSelectedRows] = useState<T[]>([])

  // Detail View State
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [detailRecord, setDetailRecord] = useState<T | null>(null)

  const showDetail = (record: T) => {
    setDetailRecord(record)
    setIsDetailOpen(true)
  }

  const closeDetail = () => {
    setIsDetailOpen(false)
    setDetailRecord(null)
  }

  const handleDetailEdit = () => {
    if (detailRecord) {
      closeDetail()
      showModal(false, detailRecord)
    }
  }

  const nextDetail = () => {
    if (!detailRecord) return
    const currentIndex = data.findIndex((r) => r.id === detailRecord.id)
    if (currentIndex !== -1 && currentIndex < data.length - 1) {
      setDetailRecord(data[currentIndex + 1])
    }
  }

  const prevDetail = () => {
    if (!detailRecord) return
    const currentIndex = data.findIndex((r) => r.id === detailRecord.id)
    if (currentIndex > 0) {
      setDetailRecord(data[currentIndex - 1])
    }
  }

  const hasNext = detailRecord
    ? data.findIndex((r) => r.id === detailRecord.id) < data.length - 1
    : false
  const hasPrev = detailRecord ? data.findIndex((r) => r.id === detailRecord.id) > 0 : false

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isAdd, setIsAdd] = useState(true)
  const [editingRecord, setEditingRecord] = useState<T | null>(null)

  // Sync Flip State
  useEffect(() => {
    setFlip(isModalOpen || isDetailOpen)
  }, [isModalOpen, isDetailOpen, setFlip])

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

    // TODO: オプションを追加してメッセージをカスタマイズできるようにする
    const displayText = ids.length === 1 ? `ID: ${ids[0]}` : `${ids.length}件`

    setLoading(true)
    deleteItem(ids)
      .then(() => {
        // message.success()
        message.open({
          type: 'success',
          content: `${itemName}${displayText}を削除しました`,
          duration: 10,
        })
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
    PAGE_NAME,
    data,
    loading,
    selectedRows,
    setSelectedRows,
    toggleSelection,

    isModalOpen,
    isAdd,
    editingRecord,
    showModal,

    // Detail View Logic
    isDetailOpen,
    detailRecord,
    showDetail,
    closeDetail,
    handleDetailEdit,
    nextDetail,
    prevDetail,
    hasNext,
    hasPrev,
    handleCancel,
    handleSuccess,

    handleDelete,
    handleDeleteAction,
    fetchData,
    setData,
  }
}
