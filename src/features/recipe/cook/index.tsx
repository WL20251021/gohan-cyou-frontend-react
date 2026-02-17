import { useState, useEffect, use } from 'react'
import {
  Button,
  Form,
  Input,
  InputNumber,
  Select,
  Divider,
  Card,
  Row,
  Col,
  message,
  DatePicker,
  Space,
} from 'antd'
import notification from '@/components/DoodleNotification'
import BookModal from '@/components/BookModal'
import BookDetailModal from '@/components/BookDetailModal'
import PageHeader from '@/components/PageHeader'
import DoodleCard, { DoodleCardRow } from '@/components/DoodleCard'
import PaginatedGrid from '@/components/PaginatedGrid'
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import { CookColumn, JPNames } from './columns'
import { getRecipes, addRecipe, updateRecipe, deleteRecipe } from './api'
import type { CookIngredient } from './cookIngredientColumns'
import { getRecipes as getRecipeList } from '../recipe/api'
import { getInStockItems } from '@/features/budget/inventory/api'

const { TextArea } = Input

// 料理記録追加・編集モーダルコンポーネント
interface CookModalProps {
  open: boolean
  isEditMode?: boolean
  editingRecord?: CookColumn | null
  onCancel: () => void
  onSuccess?: () => void
  PAGE_NAME?: string
}

function CookModal({
  open,
  isEditMode = false,
  editingRecord = null,
  onCancel,
  onSuccess,
  PAGE_NAME = '調理',
}: CookModalProps) {
  const [form] = Form.useForm<CookColumn>()
  const [confirmLoading, setConfirmLoading] = useState(false)
  const [useIngredients, setUseIngredients] = useState<CookIngredient[]>([])
  // サーバーから取得した全在庫リスト（マスター）
  const [allInventoryList, setAllInventoryList] = useState<any[]>([])
  const [recipeList, setRecipeList] = useState<any[]>([])
  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false)
  // const [recipeId, setRecipeId] = useState<number | null>(null)

  // レシピ追加モーダルを開く
  const handleAddRecipe = () => {
    setIsRecipeModalOpen(true)
  }

  // レシピ追加モーダルをキャンセル
  const handleRecipeCancel = () => {
    setIsRecipeModalOpen(false)
  }

  // レシピ追加成功時
  const handleRecipeSuccess = (newRecipe: any) => {
    // レシピリストを再取得
    fetchRecipes()
    // 追加したレシピを選択状態にする
    form.setFieldValue('recipeId', newRecipe.id)
    fetchRecipes()
  }

  useEffect(() => {
    if (open) {
      fetchInventory()
      fetchRecipes()
      if (!isEditMode) {
        form.resetFields()
        form.setFieldsValue({
          cookDate: dayjs(),
          servings: 1,
        })
        setUseIngredients([])
      } else if (editingRecord) {
        form.setFieldsValue({
          cookName: editingRecord.cookName,
          cookDate: editingRecord.cookDate ? dayjs(editingRecord.cookDate) : null,
          recipeId: editingRecord.recipeId,
          description: editingRecord.description,
          servings: editingRecord.servings,
          preTime: editingRecord.preTime,
          cookTime: editingRecord.cookTime,
          totalTime: editingRecord.totalTime,
        })
        setUseIngredients(
          (editingRecord.useIngredients.map((v) => {
            v.inventoryId = v.inventory?.id || v.inventoryId
            return v
          }) || []) as CookIngredient[]
        )
      } else {
        setUseIngredients([])
      }
    }
  }, [open, isEditMode, editingRecord, form])

  // preTimeとcookTimeからtotalTimeを計算
  const calculateTotalTime = () => {
    const prep = form.getFieldValue('preTime') || 0
    const cook = form.getFieldValue('cookTime') || 0
    form.setFieldValue('totalTime', prep + cook)
  }

  function fetchInventory() {
    getInStockItems()
      .then((res) => {
        setAllInventoryList(res?.data || [])
      })
      .catch((error) => {
        console.error(error)
      })
  }

  function fetchRecipes() {
    getRecipeList()
      .then((res) => {
        setRecipeList(res?.data || [])
      })
      .catch((error) => {
        console.error(error)
      })
  }

  function addIngredient() {
    setUseIngredients([
      ...useIngredients,
      {
        inventoryId: null as unknown as number,
        quantity: 1,
        unit: '個',
        description: '',
      },
    ])
  }

  function removeIngredient(index: number) {
    setUseIngredients(useIngredients.filter((_, i) => i !== index))
  }

  // 指定行に対して他行で選択済みの在庫を除外した選択肢を返す
  // また、ラベルと disabled フラグに残量を反映する
  function getAvailableInventoryOptions(rowIndex: number) {
    return allInventoryList.map((inventory) => {
      const remaining = inventory.remainingQuantity.toFixed(2) as unknown as number
      return {
        label: `${inventory.goods.goodsName}(${remaining}${inventory.quantityUnit})`,
        value: inventory.id,
        // 選択した在庫を他行で再選択できないようにする
        disabled:
          useIngredients.filter((ing, i) => i !== rowIndex && ing.inventoryId === inventory.id)
            .length > 0,
      }
    })
  }

  // ヘルパー: 指定行の選択に基づく最大入力可能数量を計算する
  function getAvailableQuantityFor(
    ingredients: CookIngredient[],
    rowIndex: number
  ): number | undefined {
    const invId = ingredients[rowIndex]?.inventoryId
    if (!invId) return undefined
    const inv = allInventoryList.find((i) => i.id === invId)
    const usedByOthers = ingredients
      .map((ing, i) =>
        i !== rowIndex && ing.inventoryId === invId ? Number(ing.quantity) || 0 : 0
      )
      .reduce((a, b) => a + b, 0)
    const available = (inv?.remainingQuantity || 0) - usedByOthers
    return Math.max(0, available)
  }

  function updateIngredient(index: number, field: keyof CookIngredient, value: any) {
    const newIngredients = [...useIngredients]
    if (!newIngredients[index]) {
      newIngredients[index] = {
        inventoryId: null as unknown as number,
        quantity: 1,
        unit: '個',
        description: '',
      } as CookIngredient
    }

    if (field === 'inventoryId') {
      // 在庫変更時は新しい在庫に合わせて数量をクランプ
      newIngredients[index] = {
        ...newIngredients[index],
        inventoryId: value,
      }
      const avail = getAvailableQuantityFor(newIngredients, index)
      if (avail !== undefined && (Number(newIngredients[index].quantity) || 0) > avail) {
        newIngredients[index].quantity = avail
      }
    } else {
      newIngredients[index] = {
        ...newIngredients[index],
        [field]: value,
      }
    }

    setUseIngredients(newIngredients)
  }

  function handleSave() {
    setConfirmLoading(true)
    form
      .validateFields()
      .then((values) => {
        const data: any = {}
        data.cookName = values.cookName || ''
        data.recipeId = values.recipeId || null
        data.description = values.description || ''
        data.useIngredients = useIngredients.map((ing) => {
          const ingData: any = {}
          if (ing.id) ingData.id = ing.id
          ingData.inventoryId = ing.inventoryId
          ingData.quantity = ing.quantity
          ingData.unit = ing.unit
          ingData.description = ing.description
          return ingData
        })
        data.servings = values.servings || 1
        data.preTime = values.preTime
        data.cookTime = values.cookTime
        data.totalTime = values.totalTime
        if (isEditMode && editingRecord) {
          return updateRecipe(editingRecord.id, data).then(() => editingRecord.id)
        } else {
          return addRecipe(data).then((res) => res.data.id)
        }
      })
      .then(() => {
        message.success(`${PAGE_NAME}を${isEditMode ? '更新' : '追加'}しました`)
        form.resetFields()
        setUseIngredients([])
        onSuccess?.()
        onCancel()
      })
      .catch((error) => {
        if (error.errorFields) {
          message.error('入力内容を確認してください')
        } else {
          console.error(error)
          notification.error({
            title: `${PAGE_NAME}${isEditMode ? '更新' : '追加'}失敗`,
            description: error.response?.data?.message || error.message,
            placement: 'bottomRight',
          })
        }
      })
      .finally(() => {
        setConfirmLoading(false)
      })
  }

  return (
    <BookModal
      manualFlip={true}
      title={`${PAGE_NAME}を${isEditMode ? '編集' : '追加'}`}
      open={open}
      onOk={handleSave}
      onCancel={onCancel}
      confirmLoading={confirmLoading}
      okText="保存"
      cancelText="キャンセル"
    >
      <Form
        form={form}
        layout="vertical"
      >
        {/* ID */}
        <Form.Item
          name="id"
          hidden
        >
          <Input />
        </Form.Item>

        {/* タイトル */}
        <Form.Item
          name="cookName"
          label={JPNames.cookName}
          rules={[{ required: true, message: `${PAGE_NAME}名を入力してください` }]}
        >
          <Input placeholder="例：今日のカレーライス" />
        </Form.Item>

        <Row gutter={24}>
          {/* 調理日 */}
          <Col span={12}>
            <Form.Item
              name="cookDate"
              label={JPNames.cookDate}
              rules={[{ required: true, message: `${JPNames.cookDate}を選択してください` }]}
            >
              <DatePicker
                format="YYYY-MM-DD"
                style={{ width: '100%' }}
                allowClear={false}
              />
            </Form.Item>
          </Col>

          {/* レシピ */}
          <Col span={12}>
            <Form.Item
              name="recipeId"
              label={JPNames.recipeId}
              rules={[{ required: true, message: `${JPNames.recipeId}を選択してください` }]}
            >
              <Space.Compact style={{ width: '100%' }}>
                <Select
                  placeholder="レシピを選択（任意）"
                  allowClear
                  showSearch
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                  options={recipeList.map((recipe) => ({
                    label: recipe.recipeName,
                    value: recipe.id,
                  }))}
                  onChange={(value) => form.setFieldValue('recipeId', value)}
                />
                <Button
                  type="primary"
                  icon={<i className="i-material-symbols:add"></i>}
                  onClick={handleAddRecipe}
                >
                  新規
                </Button>
              </Space.Compact>
            </Form.Item>
          </Col>
        </Row>

        {/* 説明 */}
        <Form.Item
          name="description"
          label={JPNames.description}
        >
          <TextArea
            rows={2}
            placeholder={`${PAGE_NAME}の簡単な説明やメモ`}
          />
        </Form.Item>

        {/* 使用材料 */}
        <Divider orientation="horizontal">使用材料</Divider>
        <Card
          size="small"
          style={{ marginBottom: 16 }}
        >
          {useIngredients.map((ingredient, index) => (
            <Row
              key={index}
              gutter={8}
              style={{ marginBottom: 8 }}
              align="middle"
            >
              <Col span={10}>
                <Select
                  placeholder="在庫を選択"
                  value={ingredient.inventoryId || undefined}
                  onChange={(value) => updateIngredient(index, 'inventoryId', value)}
                  style={{ width: '100%' }}
                  showSearch
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                  options={getAvailableInventoryOptions(index)}
                  allowClear
                />
              </Col>
              <Col
                span={4}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <InputNumber
                  placeholder="数量"
                  value={ingredient.quantity}
                  onChange={(value) => updateIngredient(index, 'quantity', value || 0)}
                  min={0}
                  max={getAvailableQuantityFor(useIngredients, index)}
                  step={0.1}
                  precision={2}
                />
                <span style={{ marginLeft: 10 }}>{ingredient.unit || '個'}</span>
              </Col>
              <Col span={8}>
                <Input
                  placeholder="メモ"
                  value={ingredient.description || ''}
                  onChange={(e) => updateIngredient(index, 'description', e.target.value)}
                />
              </Col>
              <Col span={2}>
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => removeIngredient(index)}
                />
              </Col>
            </Row>
          ))}
          <Button
            type="dashed"
            onClick={addIngredient}
            icon={<PlusOutlined />}
            style={{ width: '100%' }}
          >
            使用材料を追加
          </Button>
        </Card>

        {/* 分量 */}
        <Form.Item
          name="servings"
          label={JPNames.servings}
          initialValue={1}
        >
          <InputNumber
            min={1}
            max={100}
            addonAfter="人分"
            style={{ width: 150 }}
          />
        </Form.Item>

        {/* 調理時間 */}
        <Row gutter={24}>
          <Col span={8}>
            <Form.Item
              name="preTime"
              label={JPNames.preTime}
            >
              <InputNumber
                min={0}
                addonAfter="分"
                style={{ width: 150 }}
                onChange={calculateTotalTime}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="cookTime"
              label={JPNames.cookTime}
            >
              <InputNumber
                min={0}
                addonAfter="分"
                style={{ width: 150 }}
                onChange={calculateTotalTime}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="totalTime"
              label={JPNames.totalTime}
            >
              <InputNumber
                disabled
                min={0}
                addonAfter="分"
                style={{ width: 150 }}
              />
            </Form.Item>
          </Col>
        </Row>
      </Form>

      {/* レシピ追加モーダル */}
      <RecipeModal
        open={isRecipeModalOpen}
        onCancel={handleRecipeCancel}
        onSuccess={handleRecipeSuccess}
      />
    </BookModal>
  )
}

import { useBookPage } from '@/hooks/useBookPage'
import { RecipeModal } from '../recipe'
import dayjs from 'dayjs'

export default function Cook() {
  const {
    data,
    loading,
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
    PAGE_NAME,
  } = useBookPage<CookColumn>({
    fetchList: getRecipes,
    deleteItem: deleteRecipe,
  })

  return (
    <div>
      <PageHeader
        title={`${PAGE_NAME}一覧`}
        onAdd={() => showModal(true)}
        onDelete={() => handleDelete(selectedRows.map((r) => r.id))}
        deleteDisabled={selectedRows.length === 0}
        data={data}
      />

      <PaginatedGrid
        className="book-page-content"
        data={data as CookColumn[]}
        onAdd={() => showModal(true)}
        renderItem={(record: CookColumn) => (
          <DoodleCard
            key={record.id}
            id={record.id}
            title={record.cookName}
            selected={!!selectedRows.find((r) => r.id === record.id)}
            onToggleSelection={(e) => toggleSelection(record, e)}
            onClick={() => showDetail(record)}
            onEdit={(e) => {
              e.stopPropagation()
              showModal(false, record)
            }}
            onDelete={() => {
              handleDeleteAction(record)
            }}
          >
            <DoodleCardRow
              label={JPNames.servings}
              value={`${record.servings}人分`}
            />
            <DoodleCardRow
              label={JPNames.totalTime}
              value={`${record.totalTime || 0}分`}
            />
            {record.recipe && (
              <DoodleCardRow
                label={JPNames.recipe}
                value={record.recipe.recipeName}
              />
            )}
          </DoodleCard>
        )}
      />

      {/* 料理記録追加・編集モーダル */}
      <CookModal
        open={isModalOpen}
        isEditMode={!isAdd}
        editingRecord={editingRecord as CookColumn | null}
        onCancel={handleCancel}
        onSuccess={handleSuccess}
        PAGE_NAME={PAGE_NAME}
      />

      <BookDetailModal
        manualFlip={true}
        open={isDetailOpen}
        title={detailRecord?.cookName}
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
              label={JPNames.cookName}
              value={detailRecord.cookName}
            />
            {detailRecord.recipe && (
              <DoodleCardRow
                label={JPNames.recipe}
                value={detailRecord.recipe.recipeName}
              />
            )}
            <DoodleCardRow
              label={JPNames.description}
              value={detailRecord.description || '-'}
            />
            <DoodleCardRow
              label={JPNames.servings}
              value={`${detailRecord.servings || 0} 人分`}
            />
            <DoodleCardRow
              label={JPNames.totalTime}
              value={`${detailRecord.totalTime || 0} 分`}
            />
            {detailRecord.useIngredients && detailRecord.useIngredients.length > 0 && (
              <DoodleCardRow
                label={JPNames.useIngredients}
                value={
                  <div>
                    {detailRecord.useIngredients.map((ing, idx) => (
                      <div key={idx}>
                        {ing.inventory?.goods?.goodsName || '不明'} - {ing.quantity}
                        {ing.unit}
                        {ing.description && ` (${ing.description})`}
                      </div>
                    ))}
                  </div>
                }
              />
            )}
          </div>
        )}
      </BookDetailModal>
    </div>
  )
}
