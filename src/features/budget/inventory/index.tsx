import { useState, useEffect, useCallback } from 'react'
import { Card, Space, Tag, Statistic, Row, Col, Select, Image } from 'antd'
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons'
import { getAllInventory, getInStockItems, getInventorySummary, getOutOfStockItems } from './api'
import PageHeader from '@/components/PageHeader'
import PaginatedGrid from '@/components/PaginatedGrid'
import DoodleCard, { DoodleCardRow } from '@/components/DoodleCard'
import BookDetailModal from '@/components/BookDetailModal'
import { useBookPage } from '@/hooks/useBookPage'
import {
  type InventoryColumn,
  type InventoryStats,
  formatDate,
  STOCK_STATUS,
  STOCK_STATUS_NAMES,
  STOCK_STATUS_COLORS,
  JPNames,
} from './columns'
import { JPNames as JPPurchasement } from '../purchasement/columns'
import { JPNames as JPGoods } from '../goods/columns'
import { genImageUrl } from '@/utils/file'

/**
 * 在庫管理コンポーネント
 */
export default function Inventory() {
  const [filterStatus, setFilterStatus] = useState<string>('all')

  // Custom fetch function that handles status filtering
  const fetchInventoryWithFilter = useCallback(async () => {
    const getStockByStatus = {
      all: getAllInventory,
      [STOCK_STATUS.IN_STOCK]: getInStockItems,
      [STOCK_STATUS.OUT_OF_STOCK]: getOutOfStockItems,
    }
    const status =
      filterStatus === 'all' || !getStockByStatus[filterStatus as keyof typeof getStockByStatus]
        ? 'all'
        : filterStatus

    const res = await getStockByStatus[status as keyof typeof getStockByStatus]()
    return { data: res.data || [] }
  }, [filterStatus])

  const {
    data,
    selectedRows,
    isDetailOpen,
    detailRecord,
    showDetail,
    closeDetail,
    nextDetail,
    prevDetail,
    hasNext,
    hasPrev,
    PAGE_NAME,
  } = useBookPage<InventoryColumn>({
    fetchList: fetchInventoryWithFilter,
    deleteItem: async () => {}, // No delete action
  })

  // Summary State
  const [summary, setSummary] = useState<InventoryStats | null>(null)

  // Fetch Summary independent of list
  useEffect(() => {
    getInventorySummary()
      .then((res) => {
        setSummary(res?.data || null)
      })
      .catch(console.error)
  }, [])

  return (
    <div className="book-page-container">
      <PageHeader
        title={`${PAGE_NAME}一覧`}
        data={data as any[]}
      />

      <div className="book-page-content">
        {/* サマリーカード */}
        <Row
          gutter={16}
          style={{ marginBottom: 16 }}
        >
          <Col span={12}>
            <Card>
              <Statistic
                title={`${PAGE_NAME}アイテム総数`}
                value={summary?.inStockCount || 0}
                suffix="品目"
              />
            </Card>
          </Col>
          <Col span={12}>
            <Card>
              <Statistic
                title={`${PAGE_NAME}切れアイテム`}
                value={summary?.outOfStockCount || 0}
                suffix="品目"
                valueStyle={{ color: '#cf1322' }}
                prefix={<CloseCircleOutlined />}
              />
            </Card>
          </Col>
        </Row>

        {/* フィルター */}
        <Space
          size="middle"
          style={{ width: '100%' }}
        >
          <Select
            style={{ width: 150 }}
            value={filterStatus}
            onChange={(value) => setFilterStatus(value)}
            options={[
              { label: 'すべて', value: 'all' },
              {
                label: STOCK_STATUS_NAMES.in_stock,
                value: STOCK_STATUS.IN_STOCK,
              },
              {
                label: STOCK_STATUS_NAMES.out_of_stock,
                value: STOCK_STATUS.OUT_OF_STOCK,
              },
            ]}
          />
        </Space>

        {/* 在庫データグリッド */}
        <PaginatedGrid
          data={data as InventoryColumn[]}
          renderItem={(record: InventoryColumn) => {
            const status = record.remainingQuantity
              ? STOCK_STATUS.IN_STOCK
              : STOCK_STATUS.OUT_OF_STOCK

            const color = STOCK_STATUS_COLORS[status as keyof typeof STOCK_STATUS_COLORS]
            const name = STOCK_STATUS_NAMES[status as keyof typeof STOCK_STATUS_NAMES]
            let icon =
              status === STOCK_STATUS.OUT_OF_STOCK ? (
                <CloseCircleOutlined />
              ) : (
                <CheckCircleOutlined />
              )

            return (
              <DoodleCard
                key={record.purchasement.id}
                id={record.purchasement.id}
                title={
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {(record.goods as any)?.imageName && (
                      <div className="mb-2">
                        <Image
                          src={genImageUrl((record.goods as any)?.imageName)}
                          alt="商品画像"
                          width={50}
                          height={50}
                          style={{
                            objectFit: 'cover',
                            borderRadius: 'var(--radius-doodle-sm)',
                            boxShadow: '0px 4px 0px rgba(0,0,0,0.1)',
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    )}
                    {record.goods?.goodsName || '-'}
                  </div>
                }
                // inventory is read only
                selected={!!selectedRows.find((r) => r.purchasement.id === record.purchasement.id)}
                onClick={() => showDetail(record)}
              >
                <DoodleCardRow
                  label={JPGoods.goodsName}
                  value={record.goods?.goodsName || '-'}
                />

                <div className="my-2 border-t border-dashed border-gray-300 dark:border-gray-600"></div>

                <DoodleCardRow
                  label={JPNames.remainingQuantity}
                  value={`${record.remainingQuantity} ${record.quantityUnit}`}
                />
                <div className="mt-2">
                  <DoodleCardRow
                    label={JPNames.stockStatus}
                    value={
                      status ? (
                        <Tag
                          color={color}
                          icon={icon}
                        >
                          {name}
                        </Tag>
                      ) : (
                        '-'
                      )
                    }
                  />
                </div>

                <DoodleCardRow
                  label={JPPurchasement.purchaseDate}
                  value={formatDate(record.purchasement?.purchaseDate)}
                />
              </DoodleCard>
            )
          }}
        />
      </div>

      <BookDetailModal
        manualFlip={true}
        open={isDetailOpen}
        title={detailRecord?.goods?.goodsName || '詳細'}
        subtitle={`${PAGE_NAME}詳細`}
        onClose={closeDetail}
        hasNext={hasNext}
        hasPrev={hasPrev}
        onNext={nextDetail}
        onPrev={prevDetail}
        rowJustify="start"
      >
        {detailRecord && (
          <div
            className="flex flex-col gap-4"
            style={{
              position: 'relative',
            }}
          >
            {(detailRecord.goods as any)?.imageName && (
              <div
                style={{
                  position: 'absolute',
                  right: 20,
                  transform: 'rotate(2deg)',
                }}
              >
                <img
                  src={genImageUrl((detailRecord.goods as any)?.imageName || '')}
                  alt="商品画像"
                  width={250}
                  style={{
                    border: '2px solid var(--color-ink-black)',
                    borderRadius: 'var(--radius-doodle-sm)',
                    boxShadow: '4px 4px 0px rgba(0,0,0,0.1)',
                  }}
                />
              </div>
            )}
            <DoodleCardRow
              label={JPGoods.goodsName}
              value={detailRecord.goods?.goodsName || '-'}
            />
            <DoodleCardRow
              label={JPNames.remainingQuantity}
              value={`${detailRecord.remainingQuantity} ${detailRecord.quantityUnit}`}
            />
            <DoodleCardRow
              label={JPPurchasement.purchaseDate}
              value={formatDate(detailRecord.purchasement?.purchaseDate)}
            />
            <DoodleCardRow
              label={JPNames.stockStatus}
              value={
                (
                  detailRecord.remainingQuantity ? STOCK_STATUS.IN_STOCK : STOCK_STATUS.OUT_OF_STOCK
                ) ? (
                  <Tag
                    color={
                      STOCK_STATUS_COLORS[
                        (detailRecord.remainingQuantity
                          ? STOCK_STATUS.IN_STOCK
                          : STOCK_STATUS.OUT_OF_STOCK) as keyof typeof STOCK_STATUS_COLORS
                      ]
                    }
                    icon={
                      detailRecord.remainingQuantity ? (
                        <CheckCircleOutlined />
                      ) : (
                        <CloseCircleOutlined />
                      )
                    }
                  >
                    {
                      STOCK_STATUS_NAMES[
                        (detailRecord.remainingQuantity
                          ? STOCK_STATUS.IN_STOCK
                          : STOCK_STATUS.OUT_OF_STOCK) as keyof typeof STOCK_STATUS_NAMES
                      ]
                    }
                  </Tag>
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
