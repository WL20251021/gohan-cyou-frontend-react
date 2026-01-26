import { useState, useMemo } from 'react'
import IncomeModal from './IncomeModal'
import BookDetailModal from '@/components/BookDetailModal'
import PageHeader from '@/components/PageHeader'
import DoodleCard, { DoodleCardRow } from '@/components/DoodleCard'
import PaginatedGrid from '@/components/PaginatedGrid'
import dayjs from 'dayjs'
import { IncomeColumn, JPNames, JPIncomeCategory } from './columns'
import { getIncomes, deleteIncome, getIncomeSummary } from './api'
import { useBookPage } from '@/hooks/useBookPage'

import { PAGE_NAMES } from '@/layout'
const currentPath = window.location.pathname
const PAGE_NAME = PAGE_NAMES[currentPath] || '収入'

export default function Income() {
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
  } = useBookPage<IncomeColumn>({
    fetchList: getIncomes,
    deleteItem: deleteIncome,
    itemName: `${PAGE_NAME}管理`,
  })

  // 合計金額取得
  const [incomeSummary, setIncomeSummary] = useState<{ thisMonth: number; thisYear: number }>({
    thisMonth: 0,
    thisYear: 0,
  })
  function fetchIncomeSummary() {
    getIncomeSummary()
      .then((res) => {
        setIncomeSummary(res?.data || { thisMonth: 0, thisYear: 0 })
      })
      .catch((error) => {
        console.error('収入サマリーの取得に失敗しました:', error)
      })
  }
  useMemo(() => {
    fetchIncomeSummary()
  }, [])

  const handleModalSuccess = () => {
    handleSuccess()
    handleCancel()
    fetchIncomeSummary()
  }

  return (
    <div className="book-page-container">
      <PageHeader
        title={`${PAGE_NAME}記録一覧`}
        onAdd={() => showModal(true)}
        onDelete={() => handleDelete(selectedRows.map((r) => r.id))}
        deleteDisabled={selectedRows.length === 0}
        data={data}
      />

      {/* 合計収入カード*/}
      <div
        style={{
          margin: '10px 48px',
          padding: '16px',
          border: '2px solid var(--border-color)',
          borderRadius: 'var(--radius-doodle-sm)',
          backgroundColor: 'var(--color-primary-lightest)',
        }}
      >
        <p>
          今月の{PAGE_NAME}：{incomeSummary.thisMonth} 円
        </p>
        <p>
          本年度の{PAGE_NAME}：{incomeSummary.thisYear} 円
        </p>
      </div>

      <PaginatedGrid
        className="book-page-content"
        data={data as IncomeColumn[]}
        onAdd={() => showModal(true)}
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
              value={JPIncomeCategory[record.category as keyof typeof JPIncomeCategory] || '-'}
            />
            <DoodleCardRow
              label={JPNames.amount}
              value={`${record.amount || 0} 円`}
            />
            <DoodleCardRow
              label={JPNames.description}
              value={record.description || '-'}
              truncate
            />
          </DoodleCard>
        )}
      />

      {/* 収入編集/追加モーダル */}
      <IncomeModal
        open={isModalOpen}
        isAdd={isAdd}
        record={editingRecord as IncomeColumn}
        onCancel={handleCancel}
        onSuccess={handleModalSuccess}
      />

      <BookDetailModal
        manualFlip={true}
        open={isDetailOpen}
        title={detailRecord?.incomeDate ? dayjs(detailRecord.incomeDate).format('YYYY-MM-DD') : '-'}
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
              label={JPNames.category}
              value={
                JPIncomeCategory[detailRecord.category as keyof typeof JPIncomeCategory] || '-'
              }
            />
            <DoodleCardRow
              label={JPNames.amount}
              value={`${detailRecord.amount} 円`}
            />
            <DoodleCardRow
              label={JPNames.description}
              value={detailRecord.description || '-'}
            />
          </div>
        )}
      </BookDetailModal>
    </div>
  )
}
