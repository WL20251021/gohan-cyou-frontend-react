import { useState, useEffect, useCallback, useMemo } from 'react'
import { Card, Space, Tag, Statistic, Row, Col, Select, Button, Input } from 'antd'
import { ReloadOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons'
import { getAllInventory, getInStockItems, getInventorySummary, getOutOfStockItems } from './api'
import PageHeader from '@/components/PageHeader'
import PaginatedGrid from '@/components/PaginatedGrid'
import DoodleCard, { DoodleCardRow } from '@/components/DoodleCard'
import BookDetailModal from '@/components/BookDetailModal'
import { useBookPage } from '@/hooks/useBookPage'
import {
  type InventoryColumn,
  type InventoryStats,
  type GoodsInventory,
  formatDate,
  STOCK_STATUS,
  STOCK_STATUS_NAMES,
  STOCK_STATUS_COLORS,
  JPNames,
} from './columns'
import { JPNames as JPPurchasement } from '../purchasement/columns'
import { JPNames as JPGoods } from '../goods/columns'

const { Search } = Input

/**
 * 在庫管理コンポーネント
 */
export default function Inventory() {
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [searchText, setSearchText] = useState('')

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
    toggleSelection,
    handleSuccess,
    isDetailOpen,
    detailRecord,
    showDetail,
    closeDetail,
    nextDetail,
    prevDetail,
    hasNext,
    hasPrev,
  } = useBookPage<InventoryColumn>({
    fetchList: fetchInventoryWithFilter,
    deleteItem: async () => {}, // No delete action
    itemName: '在庫',
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

  // Filter logic for Search Text (Client side)
  const filteredData = useMemo(() => {
    if (!searchText) return data
    const lower = searchText.toLowerCase()
    return data.filter((item) => {
      const goodsName = item.goods?.goodsName?.toLowerCase() || ''
      return goodsName.includes(lower)
    })
  }, [data, searchText])

  return (
    <div className="book-page-container">
      <PageHeader
        title="在庫管理"
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
                title="在庫アイテム総数"
                value={summary?.inStockCount || 0}
                suffix="品目"
              />
            </Card>
          </Col>
          <Col span={12}>
            <Card>
              <Statistic
                title="在庫切れアイテム"
                value={summary?.outOfStockCount || 0}
                suffix="品目"
                valueStyle={{ color: '#cf1322' }}
                prefix={<CloseCircleOutlined />}
              />
            </Card>
          </Col>
        </Row>

        {/* フィルターと検索 */}
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
          {/* <Search
              placeholder="商品名で検索"
              allowClear
              style={{ width: 300 }}
              onSearch={setSearchText}
              onChange={(e) => setSearchText(e.target.value)}
            /> */}
          <Button
            icon={<ReloadOutlined />}
            onClick={() => handleSuccess()}
          >
            更新
          </Button>
        </Space>

        {/* 在庫データグリッド */}
        <PaginatedGrid
          data={filteredData as InventoryColumn[]}
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
                title={record.goods?.goodsName || '-'}
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
                        // fallback
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
        subtitle="在庫詳細"
        onClose={closeDetail}
        hasNext={hasNext}
        hasPrev={hasPrev}
        onNext={nextDetail}
        onPrev={prevDetail}
        rowJustify="start"
      >
        {detailRecord && (
          <div className="flex flex-col gap-4">
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
                  // fallback
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
