import { useState, useEffect } from 'react'
import { Card, Space, Tag, Statistic, Row, Col, Select, Button, Input, message } from 'antd'
import {
  ReloadOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { getAllInventory, getInventorySummary, getLowStockItems, getOutOfStockItems } from './api'
import type { InventoryItem, InventorySummary, GoodsType } from './types'
import DoodleCard, { DoodleCardRow } from '../../../components/DoodleCard'
import {
  type InventoryColumn,
  formatInventoryList,
  getStockStatus,
  formatDate,
  STOCK_STATUS,
  STOCK_STATUS_NAMES,
  STOCK_STATUS_COLORS,
  JPNames,
} from './columns'

// 商品タイプの日本語名を定義
const GOODS_TYPE_NAMES: Record<GoodsType, string> = {
  '0': '使い切り商品',
  '1': '消耗品・半耐久財',
  '2': '耐久消費財',
}

const { Search } = Input

/**
 * 在庫管理コンポーネント
 */
export default function Inventory() {
  const [loading, setLoading] = useState(false)
  const [inventory, setInventory] = useState<InventoryColumn[]>([])
  const [summary, setSummary] = useState<InventorySummary | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [searchText, setSearchText] = useState('')

  useEffect(() => {
    fetchInventoryData()
  }, [])

  /**
   * 在庫データを取得
   */
  function fetchInventoryData(stockStatus?: string) {
    setLoading(true)

    const currentStatus = stockStatus || filterStatus
    const getStockByStatus = {
      all: getAllInventory,
      [STOCK_STATUS.IN_STOCK]: getAllInventory,
      [STOCK_STATUS.LOW_STOCK]: getLowStockItems,
      [STOCK_STATUS.OUT_OF_STOCK]: getOutOfStockItems,
    }
    const status = currentStatus as keyof typeof getStockByStatus

    Promise.all([getStockByStatus[status](), getInventorySummary()])
      .then(([inventoryRes, summaryRes]) => {
        const inventoryData = inventoryRes?.data || []
        setInventory(formatInventoryList(inventoryData))
        setSummary(summaryRes?.data || null)
      })
      .catch((error) => {
        console.error(error)
        message.error('在庫データの取得に失敗しました')
      })
      .finally(() => {
        setLoading(false)
      })
  }

  /**
   * フィルター処理（検索のみ、状態フィルターはAPIで処理）
   */
  const filteredInventory = inventory.filter((item) => {
    // 検索フィルター
    if (searchText) {
      const searchLower = searchText.toLowerCase()
      const goodsName = item.goods?.goodsName?.toLowerCase() || ''
      const storeName = item.store?.name?.toLowerCase() || ''
      return goodsName.includes(searchLower) || storeName.includes(searchLower)
    }

    return true
  })

  /**
   * テーブルのカラム定義
   */
  const columns: ColumnsType<InventoryColumn> = [
    {
      title: JPNames.purchasementId,
      dataIndex: 'purchasementId',
      key: 'purchasementId',
      width: 100,
      sorter: (a, b) => a.purchasementId - b.purchasementId,
      className: 'cell-id',
      onCell: () => ({ 'data-label': JPNames.purchasementId }) as any,
    },
    {
      title: JPNames.goodsName,
      dataIndex: ['goods', 'goodsName'],
      key: 'goodsName',
      width: 200,
      fixed: 'left',
      render: (text) => text || '-',
      className: 'cell-title',
      onCell: () => ({ 'data-label': JPNames.goodsName }) as any,
    },
    {
      title: 'カテゴリー',
      dataIndex: ['goods', 'category', 'jpName'],
      key: 'category',
      width: 120,
      render: (text) => text || '-',
      onCell: () => ({ 'data-label': 'カテゴリー' }) as any,
    },
    {
      title: 'ブランド',
      dataIndex: ['goods', 'brand', 'name'],
      key: 'brand',
      width: 120,
      render: (text) => text || '-',
      onCell: () => ({ 'data-label': 'ブランド' }) as any,
    },
    {
      title: '商品タイプ',
      dataIndex: ['goods', 'goodsType'],
      key: 'goodsType',
      width: 140,
      render: (type: GoodsType) => (type ? GOODS_TYPE_NAMES[type] : '-'),
      onCell: () => ({ 'data-label': '商品タイプ' }) as any,
    },
    {
      title: JPNames.storeName,
      dataIndex: ['store', 'name'],
      key: 'storeName',
      width: 150,
      render: (text) => text || '-',
      onCell: () => ({ 'data-label': JPNames.storeName }) as any,
    },
    {
      title: JPNames.availableQuantity,
      dataIndex: 'availableQuantity',
      key: 'availableQuantity',
      width: 120,
      align: 'right',
      render: (value, record) => (
        <span>
          {value.toFixed(2)} {record.quantityUnit}
        </span>
      ),
      sorter: (a, b) => a.availableQuantity - b.availableQuantity,
      onCell: () => ({ 'data-label': JPNames.availableQuantity }) as any,
    },
    {
      title: JPNames.purchasedQuantity,
      dataIndex: 'purchasedQuantity',
      key: 'purchasedQuantity',
      width: 120,
      align: 'right',
      render: (value, record) => (
        <span>
          {value.toFixed(2)} {record.quantityUnit}
        </span>
      ),
      onCell: () => ({ 'data-label': JPNames.purchasedQuantity }) as any,
    },
    {
      title: JPNames.consumedQuantity,
      dataIndex: 'consumedQuantity',
      key: 'consumedQuantity',
      width: 120,
      align: 'right',
      render: (value, record) => (
        <span>
          {value.toFixed(2)} {record.quantityUnit}
        </span>
      ),
      onCell: () => ({ 'data-label': JPNames.consumedQuantity }) as any,
    },
    {
      title: JPNames.stockStatus,
      dataIndex: 'stockStatus',
      key: 'stockStatus',
      width: 120,
      align: 'center',
      onCell: () => ({ 'data-label': JPNames.stockStatus }) as any,
      render: (status) => {
        if (!status) return '-'
        const color = STOCK_STATUS_COLORS[status as keyof typeof STOCK_STATUS_COLORS]
        const name = STOCK_STATUS_NAMES[status as keyof typeof STOCK_STATUS_NAMES]
        let icon = <CheckCircleOutlined />
        if (status === STOCK_STATUS.LOW_STOCK) icon = <WarningOutlined />
        if (status === STOCK_STATUS.OUT_OF_STOCK) icon = <CloseCircleOutlined />

        return (
          <Tag
            color={color}
            icon={icon}
          >
            {name}
          </Tag>
        )
      },
      filters: [
        { text: STOCK_STATUS_NAMES.in_stock, value: STOCK_STATUS.IN_STOCK },
        { text: STOCK_STATUS_NAMES.low_stock, value: STOCK_STATUS.LOW_STOCK },
        {
          text: STOCK_STATUS_NAMES.out_of_stock,
          value: STOCK_STATUS.OUT_OF_STOCK,
        },
      ],
      onFilter: (value, record) => record.stockStatus === value,
    },
    {
      title: JPNames.purchaseDate,
      dataIndex: 'purchaseDate',
      key: 'purchaseDate',
      width: 120,
      render: (date) => formatDate(date),
      sorter: (a, b) =>
        new Date(a.purchaseDate || 0).getTime() - new Date(b.purchaseDate || 0).getTime(),
      onCell: () => ({ 'data-label': JPNames.purchaseDate }) as any,
    },
    {
      title: JPNames.lastConsumptionDate,
      dataIndex: 'lastConsumptionDate',
      key: 'lastConsumptionDate',
      width: 120,
      render: (date) => formatDate(date),
      sorter: (a, b) =>
        new Date(a.lastConsumptionDate || 0).getTime() -
        new Date(b.lastConsumptionDate || 0).getTime(),
      onCell: () => ({ 'data-label': JPNames.lastConsumptionDate }) as any,
    },
  ]

  return (
    <div style={{ padding: '24px' }}>
      {/* サマリーカード */}
      <Row
        gutter={16}
        style={{ marginBottom: 16 }}
      >
        <Col span={6}>
          <Card>
            <Statistic
              title="在庫アイテム総数"
              value={summary?.totalItems || 0}
              suffix="品目"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="利用可能アイテム"
              value={summary?.availableItems || 0}
              suffix="品目"
              valueStyle={{ color: '#3f8600' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="低在庫アイテム"
              value={summary?.lowStockItems || 0}
              suffix="品目"
              valueStyle={{ color: '#faad14' }}
              prefix={<WarningOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="在庫切れアイテム"
              value={summary?.outOfStockItems || 0}
              suffix="品目"
              valueStyle={{ color: '#cf1322' }}
              prefix={<CloseCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* フィルターと検索 */}
      <Card style={{ marginBottom: 16 }}>
        <Space
          size="middle"
          style={{ width: '100%' }}
        >
          <Select
            style={{ width: 150 }}
            value={filterStatus}
            onChange={(value) => {
              setFilterStatus(value)
              fetchInventoryData(value)
            }}
            options={[
              { label: 'すべて', value: 'all' },
              {
                label: STOCK_STATUS_NAMES.in_stock,
                value: STOCK_STATUS.IN_STOCK,
              },
              {
                label: STOCK_STATUS_NAMES.low_stock,
                value: STOCK_STATUS.LOW_STOCK,
              },
              {
                label: STOCK_STATUS_NAMES.out_of_stock,
                value: STOCK_STATUS.OUT_OF_STOCK,
              },
            ]}
          />
          <Search
            placeholder="商品名・店舗名で検索"
            allowClear
            style={{ width: 300 }}
            onSearch={setSearchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <Button
            icon={<ReloadOutlined />}
            onClick={() => fetchInventoryData(filterStatus)}
            loading={loading}
          >
            更新
          </Button>
        </Space>
      </Card>

      {/* 在庫テーブル */}
      <h2 className="mb-4">在庫一覧</h2>
      <div className="doodle-card-grid mt-6">
        {filteredInventory.map((record) => {
          // Status render logic
          const status = record.stockStatus
          const color = STOCK_STATUS_COLORS[status as keyof typeof STOCK_STATUS_COLORS]
          const name = STOCK_STATUS_NAMES[status as keyof typeof STOCK_STATUS_NAMES]
          let icon = <CheckCircleOutlined />
          if (status === STOCK_STATUS.LOW_STOCK) icon = <WarningOutlined />
          if (status === STOCK_STATUS.OUT_OF_STOCK) icon = <CloseCircleOutlined />

          return (
            <DoodleCard
              key={record.purchasementId}
              id={record.purchasementId}
              title={record.goods?.goodsName || '-'}
            >
              <DoodleCardRow
                label="カテゴリー"
                value={record.goods?.category?.jpName || '-'}
              />
              <DoodleCardRow
                label="ブランド"
                value={record.goods?.brand?.name || '-'}
              />
              <DoodleCardRow
                label="商品タイプ"
                value={record.goods?.goodsType ? GOODS_TYPE_NAMES[record.goods.goodsType] : '-'}
              />
              <DoodleCardRow
                label={JPNames.storeName}
                value={record.store?.name || '-'}
              />

              <div className="my-2 border-t border-dashed border-gray-300 dark:border-gray-600"></div>

              <DoodleCardRow
                label={JPNames.availableQuantity}
                value={`${record.availableQuantity.toFixed(2)} ${record.quantityUnit}`}
              />
              <DoodleCardRow
                label={JPNames.purchasedQuantity}
                value={`${record.purchasedQuantity.toFixed(2)} ${record.quantityUnit}`}
              />
              <DoodleCardRow
                label={JPNames.consumedQuantity}
                value={`${record.consumedQuantity.toFixed(2)} ${record.quantityUnit}`}
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
                label={JPNames.purchaseDate}
                value={formatDate(record.purchaseDate)}
              />
              <DoodleCardRow
                label={JPNames.lastConsumptionDate}
                value={formatDate(record.lastConsumptionDate)}
              />
            </DoodleCard>
          )
        })}
      </div>
      {/* <Table
        columns={columns}
        dataSource={filteredInventory}
        rowKey="purchasementId"
        loading={loading}
        pagination={{
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `全 ${total} 件`,
          defaultPageSize: 20,
          pageSizeOptions: ['10', '20', '50', '100'],
        }}
      /> */}
    </div>
  )
}
