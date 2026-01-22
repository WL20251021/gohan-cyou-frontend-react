import { useState, useEffect, useMemo } from 'react'
import { Card, Statistic, Row, Col, Alert, Tag, Select } from 'antd'
import dayjs from 'dayjs'
import { ConsumptionModal } from './ConsumptionModal'
import BookDetailModal from '../../../components/BookDetailModal'
import PageHeader from '../../../components/PageHeader'
import PaginatedGrid from '../../../components/PaginatedGrid'
import DoodleCard, { DoodleCardRow } from '../../../components/DoodleCard'
import { ConsumptionColumn, JPNames } from './columns'
import { getConsumption, deleteConsumption, getConsumptionStatistics } from './api'
import { getPurchasements } from '../purchasement/api'
import { getAllInventory } from '../inventory/api'
import { useBookPage } from '../../../hooks/useBookPage'

export default function Consumption() {
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
  } = useBookPage<ConsumptionColumn>({
    fetchList: getConsumption,
    deleteItem: deleteConsumption,
    itemName: '使用記録',
  })

  // 拡張データ取得用
  const [purchasements, setPurchasements] = useState<Array<any>>([])
  const [statistics, setStatistics] = useState<any>(null)

  // データの取得
  useEffect(() => {
    fetchPurchasements()
  }, [])

  // データ更新時に統計と在庫も更新
  useEffect(() => {
    fetchStatistics()
    checkInventoryStatus()
  }, [data]) // data changes on fetchSuccess

  // 購入記録データ取得
  function fetchPurchasements() {
    getPurchasements()
      .then((res) => {
        setPurchasements(res?.data || [])
      })
      .catch((error) => {
        console.error(error)
      })
  }

  // 統計情報取得
  function fetchStatistics() {
    getConsumptionStatistics()
      .then((res) => {
        setStatistics(res?.data || null)
      })
      .catch((error) => {
        console.error('統計情報取得失敗:', error)
      })
  }

  // 在庫状況チェック
  function checkInventoryStatus() {
    getAllInventory()
      .then((res) => {
        const inventory = res?.data || []
        const warnings: string[] = []

        inventory.forEach((item: any) => {
          if (item.availableQuantity <= 10 && item.availableQuantity > 0) {
            const goodsName = item.goods?.goodsName || '商品不明'
            warnings.push(`${goodsName}: 残り ${item.availableQuantity} ${item.quantityUnit}`)
          }
        })
      })
      .catch((error) => {
        console.error('在庫状況取得失敗:', error)
      })
  }

  const handleModalSuccess = () => {
    handleSuccess()
    handleCancel()
  }

  return (
    <div className="book-page-container">
      <PageHeader
        title="使用記録管理"
        onAdd={() => showModal(true)}
        onDelete={() => handleDelete(selectedRows.map((r) => r.id))}
        deleteDisabled={selectedRows.length === 0}
        data={data}
      />

      <div className="book-page-content">
        {/* 統計情報カード */}
        {statistics && (
          <Row
            gutter={16}
            style={{ marginBottom: 16 }}
          >
            <Col span={6}>
              <Card>
                <Statistic
                  title="総使用記録数"
                  value={statistics.totalConsumptions}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="総使用数量"
                  value={statistics.totalQuantity}
                  precision={2}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="今月の使用記録"
                  value={statistics.thisMonthConsumptions}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="今月の使用数量"
                  value={statistics.thisMonthQuantity}
                  precision={2}
                />
              </Card>
            </Col>
          </Row>
        )}

        {/* よく使う商品トップ5 */}
        {statistics?.topGoods && statistics.topGoods.length > 0 && (
          <Card
            title="よく使う商品 トップ5"
            style={{ marginBottom: 16 }}
          >
            <Row gutter={[16, 16]}>
              {statistics.topGoods.map((item: any, index: number) => (
                <Col
                  span={24}
                  md={12}
                  key={item.goods.id}
                >
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <Tag color={index === 0 ? 'gold' : index === 1 ? 'silver' : 'default'}>
                      {index + 1}位
                    </Tag>
                    <span style={{ flex: 1, marginLeft: 8 }}>{item.goods.goodsName}</span>
                    <span style={{ fontWeight: 'bold' }}>使用量: {item.quantity.toFixed(2)}</span>
                  </div>
                </Col>
              ))}
            </Row>
          </Card>
        )}

        {/* データグリッド */}
        <PaginatedGrid
          data={data}
          onAdd={() => showModal(true)}
          renderItem={(record) => (
            <DoodleCard
              key={record.id}
              id={record.id}
              title={record.purchasement?.goods?.goodsName || '商品不明'}
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
                label={JPNames.purchasement}
                value={`${record.purchasement?.goods?.goodsName || '-'} (${record.purchasement?.store?.name || '-'})`}
              />
              <DoodleCardRow
                label={JPNames.quantity}
                value={`${record.quantity} ${record.quantityUnit}`}
              />
              <DoodleCardRow
                label={JPNames.consumptionDate}
                value={
                  record.consumptionDate ? dayjs(record.consumptionDate).format('YYYY-MM-DD') : '-'
                }
              />
              <DoodleCardRow
                label={JPNames.description}
                value={record.description || '-'}
              />
            </DoodleCard>
          )}
        />
      </div>

      <ConsumptionModal
        open={isModalOpen}
        isEditMode={!isAdd}
        editingRecord={editingRecord}
        onCancel={handleCancel}
        onSuccess={handleModalSuccess}
      />

      <BookDetailModal
        open={isDetailOpen}
        title={detailRecord?.purchasement?.goods?.goodsName || '詳細'}
        subtitle="使用記録詳細"
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
              label={JPNames.id}
              value={detailRecord.id}
            />
            <DoodleCardRow
              label={JPNames.quantity}
              value={`${detailRecord.quantity} ${detailRecord.quantityUnit}`}
            />
            <DoodleCardRow
              label={JPNames.consumptionDate}
              value={
                detailRecord.consumptionDate
                  ? dayjs(detailRecord.consumptionDate).format('YYYY-MM-DD')
                  : '-'
              }
            />
            <DoodleCardRow
              label="購入"
              value={`${detailRecord.purchasement?.goods?.goodsName || '-'} (${detailRecord.purchasement?.store?.name || '-'}) / 購入日: ${detailRecord.purchasement?.purchaseDate ? dayjs(detailRecord.purchasement.purchaseDate).format('YYYY-MM-DD') : '-'}`}
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
