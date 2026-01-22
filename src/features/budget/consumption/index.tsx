import { useState, useEffect } from 'react'
import {
  Flex,
  Table,
  Button,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  notification,
  message,
  DatePicker,
  Card,
  Statistic,
  Row,
  Col,
  Alert,
  Tag,
  Popconfirm,
} from 'antd'
import dayjs from 'dayjs'
import BookModal from '../../../components/BookModal'
import { ConsumptionColumn, JPNames, QUANTITY_UNITS } from './columns'
import {
  getConsumptions,
  addConsumption,
  updateConsumption,
  deleteConsumption,
  getConsumptionStatistics,
} from './api'
import { getPurchasements } from '../purchasement/api'
import { getAllInventory } from '../inventory/api'
import { useBookPage } from '../../../hooks/useBookPage'

export default function Consumption() {
  const {
    data,
    loading,
    selectedRows,
    setSelectedRows,
    isModalOpen,
    isAdd,
    editingRecord,
    showModal: _showModal,
    handleCancel: _handleCancel,
    handleSuccess,
    handleDeleteAction,
  } = useBookPage({
    fetchList: getConsumptions,
    deleteItem: deleteConsumption,
    itemName: '使用記録',
  })

  // テーブルデータとカラム定義
  const [filteredData, setFilteredData] = useState<Array<ConsumptionColumn>>([])
  const [purchasements, setPurchasements] = useState<Array<any>>([])
  const [availablePurchasements, setAvailablePurchasements] = useState<Array<any>>([])
  const [statistics, setStatistics] = useState<any>(null)
  const [lowStockWarning, setLowStockWarning] = useState<string[]>([])
  const [selectedPurchasementFilter, setSelectedPurchasementFilter] = useState<number | null>(null)

  const columns: Array<any> = [
    { title: JPNames.id, dataIndex: 'id', key: 'id', width: 80 },
    {
      title: JPNames.consumptionDate,
      dataIndex: 'consumptionDate',
      key: 'consumptionDate',
      render: (date: string | null) => (date ? dayjs(date).format('YYYY-MM-DD') : '-'),
      sorter: (a: ConsumptionColumn, b: ConsumptionColumn) => {
        const dateA = a.consumptionDate ? new Date(a.consumptionDate).getTime() : 0
        const dateB = b.consumptionDate ? new Date(b.consumptionDate).getTime() : 0
        return dateA - dateB
      },
    },
    {
      title: JPNames.purchasement,
      dataIndex: 'purchasement',
      key: 'purchasement',
      render: (purchasement: any) => {
        if (!purchasement) return '-'
        const goodsName = purchasement.goods?.goodsName || '商品不明'
        const storeName = purchasement.store?.name || ''
        const purchaseDate = purchasement.purchaseDate
          ? dayjs(purchasement.purchaseDate).format('YYYY-MM-DD')
          : ''
        return (
          <div>
            <div>{storeName ? `${goodsName} (${storeName})` : goodsName}</div>
            {purchaseDate && (
              <div style={{ fontSize: '12px', color: '#999' }}>購入日: {purchaseDate}</div>
            )}
          </div>
        )
      },
    },
    {
      title: JPNames.quantity,
      dataIndex: 'quantity',
      key: 'quantity',
      render: (quantity: number, record: ConsumptionColumn) => `${quantity} ${record.quantityUnit}`,
    },
    {
      title: 'メモ',
      dataIndex: 'note',
      key: 'note',
      render: (note: string | null) => note || '-',
      ellipsis: true,
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right' as const,
      width: 150,
      render: (_: any, record: ConsumptionColumn) => (
        <Space size="middle">
          <a>
            <i
              className="i-material-symbols:edit-document-outline-rounded hover:material-symbols:edit-document-rounded "
              onClick={() => showModal(false, record)}
            ></i>
            編集
          </a>
          <Popconfirm
            title="削除確認"
            description="本当に削除しますか？"
            onConfirm={() => handleDeleteAction(record)}
            okText="削除"
            cancelText="キャンセル"
            okButtonProps={{ danger: true }}
          >
            <a>
              <i className="i-material-symbols:delete-outline-rounded hover:i-material-symbols:delete-rounded "></i>
              削除
            </a>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  // データの取得
  useEffect(() => {
    fetchPurchasements()
  }, [])

  // データ更新時に統計と在庫も更新
  useEffect(() => {
    fetchStatistics()
    checkInventoryStatus()
  }, [data])

  // フィルタリング処理
  useEffect(() => {
    const list = data as ConsumptionColumn[]
    if (selectedPurchasementFilter) {
      setFilteredData(list.filter((item) => item.purchasementId === selectedPurchasementFilter))
    } else {
      setFilteredData(list)
    }
  }, [data, selectedPurchasementFilter])

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
        const available: any[] = []

        inventory.forEach((item: any) => {
          if (item.availableQuantity > 0) {
            available.push(item)
          }
          if (item.availableQuantity <= 10 && item.availableQuantity > 0) {
            const goodsName = item.goods?.goodsName || '商品不明'
            warnings.push(`${goodsName}: 残り ${item.availableQuantity} ${item.quantityUnit}`)
          }
        })

        setLowStockWarning(warnings)
        // 在庫のある購入記録のみを表示用に設定
        setAvailablePurchasements(
          available.map((inv: any) => ({
            id: inv.purchasementId,
            goods: inv.goods,
            store: inv.store,
            purchaseDate: inv.purchaseDate,
            availableQuantity: inv.availableQuantity,
            quantityUnit: inv.quantityUnit,
          }))
        )
      })
      .catch((error) => {
        console.error('在庫状況取得失敗:', error)
      })
  }

  /*************** 新規使用記録を追加/使用記録を編集 ***************/
  const [form] = Form.useForm<ConsumptionColumn>()
  const [confirmLoading, setConfirmLoading] = useState(false)
  const [selectedInventory, setSelectedInventory] = useState<any>(null)
  const [maxQuantity, setMaxQuantity] = useState<number>(0)

  // モーダルの表示
  const showModal = (addMode: boolean, record?: ConsumptionColumn) => {
    _showModal(addMode, record)

    if (!addMode && record) {
      form.setFieldsValue({
        ...record,
        consumptionDate: record.consumptionDate ? dayjs(record.consumptionDate) : null,
      })
      // 編集時は既存の在庫情報を取得
      const inventory = availablePurchasements.find((p) => p.id === record.purchasementId)
      if (inventory) {
        setSelectedInventory(inventory)
        // 編集時は現在の使用量を戻して計算
        setMaxQuantity(inventory.availableQuantity + record.quantity)
      } else {
        // 在庫がなくても履歴表示のためにrecordから情報を復元（必要なら）
        setSelectedInventory(null)
        setMaxQuantity(record.quantity) // 最低限現状維持
      }
    } else {
      form.resetFields()
      setSelectedInventory(null)
      setMaxQuantity(0)
    }
  }

  // 購入記録選択時のハンドラー
  const handlePurchasementChange = (purchasementId: number) => {
    const inventory = availablePurchasements.find((p) => p.id === purchasementId)
    if (inventory) {
      setSelectedInventory(inventory)
      setMaxQuantity(inventory.availableQuantity)
      // 数量単位を自動設定
      form.setFieldValue('quantityUnit', inventory.quantityUnit)
    } else {
      setSelectedInventory(null)
      setMaxQuantity(0)
    }
  }

  // モーダルのキャンセル
  const handleCancel = () => {
    _handleCancel()
    form.resetFields()
  }

  // 使用記録追加・編集の確定ハンドラー
  function handleConfirmConsumption() {
    if (isAdd) {
      handleAddConsumption()
    } else {
      handleEditConsumption()
    }
  }

  // 使用記録追加の確定
  function handleAddConsumption() {
    setConfirmLoading(true)
    form
      .validateFields()
      .then((values) => {
        const data = {
          ...values,
          consumptionDate: values.consumptionDate
            ? dayjs(values.consumptionDate).format('YYYY-MM-DD')
            : null,
        }
        return addConsumption(data as Partial<ConsumptionColumn>)
      })
      .then(() => {
        handleSuccess() // hooks: fetchList
        _handleCancel() // Close modal
        setConfirmLoading(false)
        form.resetFields()

        message.success('使用記録を追加しました')
      })
      .catch((error) => {
        setConfirmLoading(false)
        console.error(error)
        notification.error({
          title: '使用記録追加失敗',
          description: error.message,
          placement: 'bottomRight',
          showProgress: true,
          pauseOnHover: true,
        })
      })
  }

  // 使用記録編集の確定
  function handleEditConsumption() {
    setConfirmLoading(true)
    form
      .validateFields()
      .then((values) => {
        const data = {
          ...values,
          consumptionDate: values.consumptionDate
            ? dayjs(values.consumptionDate).format('YYYY-MM-DD')
            : null,
        }
        return updateConsumption(values.id, data as Partial<ConsumptionColumn>)
      })
      .then(() => {
        handleSuccess()
        _handleCancel()
        setConfirmLoading(false)
        form.resetFields()

        message.success('使用記録を更新しました')
      })
      .catch((error) => {
        setConfirmLoading(false)
        console.error(error)
        notification.error({
          title: '使用記録更新失敗',
          description: error.message,
          placement: 'bottomRight',
          showProgress: true,
          pauseOnHover: true,
        })
      })
  }

  // テーブルの行選択時
  function onRowSelectionChange(_selectedKeys: any, selectedRows: ConsumptionColumn[]) {
    setSelectedRows(selectedRows)
  }

  return (
    <div className="book-page-container">
      <h2>使用記録一覧</h2>

      {/* 統計情報カード */}
      {statistics && (
        <>
          <Row
            gutter={16}
            className="mb-4"
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
          {/* よく使う商品トップ5 */}
          {statistics.topGoods && statistics.topGoods.length > 0 && (
            <Card
              title="よく使う商品 トップ5"
              className="mb-4"
            >
              <Row gutter={[16, 16]}>
                {statistics.topGoods.map((item: any, index: number) => (
                  <Col
                    span={24}
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
        </>
      )}

      {/* 低在庫警告 */}
      {lowStockWarning.length > 0 && (
        <Alert
          message="低在庫警告"
          description={
            <div>
              以下の商品の在庫が少なくなっています:
              <ul>
                {lowStockWarning.slice(0, 5).map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
                {lowStockWarning.length > 5 && <li>他 {lowStockWarning.length - 5} 件...</li>}
              </ul>
            </div>
          }
          type="warning"
          showIcon
          closable
          className="mb-4"
        />
      )}

      <Flex
        gap="small"
        align="start"
        className="mb-4"
      >
        <Button
          type="primary"
          onClick={() => showModal(true)}
        >
          新規使用記録
        </Button>
        <Button
          danger
          onClick={() => handleDeleteAction()}
        >
          削除
        </Button>
        <Select
          allowClear
          placeholder="購入記録でフィルター"
          style={{ width: 300 }}
          value={selectedPurchasementFilter}
          onChange={setSelectedPurchasementFilter}
          options={[
            ...purchasements.map((item) => ({
              label: `${item.goods?.goodsName || '商品不明'} - ${item.store?.name || '店舗不明'}`,
              value: item.id,
            })),
          ]}
        />
        {selectedPurchasementFilter && (
          <Tag
            closable
            onClose={() => setSelectedPurchasementFilter(null)}
          >
            フィルター中
          </Tag>
        )}
      </Flex>

      <Table
        dataSource={filteredData}
        columns={columns}
        loading={loading}
        rowKey="id"
        rowSelection={{
          type: 'checkbox',
          onChange: onRowSelectionChange,
        }}
        className="book-page-content"
        scroll={{ x: 'max-content' }}
      />

      {/* 使用記録インフォーモーダル */}
      <BookModal
        title={isAdd ? '新規使用記録' : '使用記録編集'}
        // width="80%"
        // maskClosable={false}
        open={isModalOpen}
        confirmLoading={confirmLoading}
        onOk={handleConfirmConsumption}
        onCancel={handleCancel}
        okText="保存"
        cancelText="キャンセル"
      >
        <Form
          form={form}
          className="p-8"
          labelCol={{ span: 6 }}
          wrapperCol={{ span: 14 }}
          layout="horizontal"
          initialValues={{
            quantityUnit: '個',
            quantity: 0,
            consumptionDate: dayjs(),
          }}
        >
          {!isAdd && (
            <Form.Item
              label={JPNames.id}
              name="id"
            >
              <Input disabled />
            </Form.Item>
          )}
          <Form.Item
            label={JPNames.consumptionDate}
            name="consumptionDate"
          >
            <DatePicker
              style={{ width: '100%' }}
              format="YYYY-MM-DD"
            />
          </Form.Item>
          <Form.Item
            label={JPNames.purchasement}
            name="purchasementId"
            rules={[{ required: true, message: '購入記録を選択してください!' }]}
          >
            <Select
              allowClear
              placeholder="購入記録を選択（在庫あり）"
              showSearch
              optionFilterProp="label"
              onChange={handlePurchasementChange}
              options={availablePurchasements.map((item) => ({
                label: `${item.goods?.goodsName || '商品不明'} - ${
                  item.store?.name || '店舗不明'
                } (在庫: ${item.availableQuantity} ${item.quantityUnit}) - ${
                  item.purchaseDate ? dayjs(item.purchaseDate).format('YYYY-MM-DD') : '日付不明'
                }`,
                value: item.id,
              }))}
            />
          </Form.Item>
          {selectedInventory && (
            <Alert
              message="在庫情報"
              description={
                <div>
                  <div>商品: {selectedInventory.goods?.goodsName || '不明'}</div>
                  <div>店舗: {selectedInventory.store?.name || '不明'}</div>
                  <div style={{ fontWeight: 'bold', color: '#1890ff' }}>
                    利用可能数量: {maxQuantity.toFixed(2)} {selectedInventory.quantityUnit}
                  </div>
                </div>
              }
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}
          <Form.Item label={JPNames.quantity}>
            <Space.Compact style={{ width: '100%' }}>
              <Form.Item
                name="quantity"
                noStyle
                rules={[
                  { required: true, message: '数量を入力してください!' },
                  {
                    validator: (_, value) => {
                      if (value && maxQuantity > 0 && value > maxQuantity) {
                        return Promise.reject(
                          new Error(`在庫不足: 最大 ${maxQuantity.toFixed(2)} まで入力可能です`)
                        )
                      }
                      return Promise.resolve()
                    },
                  },
                ]}
              >
                <InputNumber
                  min={0}
                  max={maxQuantity > 0 ? maxQuantity : undefined}
                  step={0.01}
                  style={{ width: '70%' }}
                  placeholder={
                    maxQuantity > 0
                      ? `最大: ${maxQuantity.toFixed(2)}`
                      : '購入記録を選択してください'
                  }
                />
              </Form.Item>
              <Form.Item
                name="quantityUnit"
                noStyle
              >
                <Select
                  style={{ width: '30%' }}
                  options={Object.entries(QUANTITY_UNITS).map(([key, value]) => ({
                    label: value,
                    value: value,
                  }))}
                />
              </Form.Item>
            </Space.Compact>
          </Form.Item>
          <Form.Item
            label={JPNames.note}
            name="note"
          >
            <Input.TextArea
              rows={3}
              allowClear
              placeholder="メモを入力"
            />
          </Form.Item>
        </Form>
      </BookModal>
    </div>
  )
}
