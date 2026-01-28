import { useState, useEffect } from 'react'
import {
  Button,
  Form,
  Input,
  InputNumber,
  Space,
  Select,
  Divider,
  Card,
  Row,
  Col,
  Rate,
  message,
} from 'antd'
import notification from '@/components/DoodleNotification'
import BookModal from '@/components/BookModal'
import BookDetailModal from '@/components/BookDetailModal'
import PageHeader from '@/components/PageHeader'
import DoodleCard, { DoodleCardRow } from '@/components/DoodleCard'
import PaginatedGrid from '@/components/PaginatedGrid'
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import { RecipeColumn, JPNames } from './columns'
import { getRecipes, addRecipe, updateRecipe, deleteRecipe } from './api'
import type { RecipeIngredient } from '../ingredient/columns'
import type { instructions } from '../instructions/columns'
import { getGoods } from '@/features/budget/goods/api'

import { PAGE_NAMES } from '@/layout'
const currentPath = window.location.pathname
const PAGE_NAME = PAGE_NAMES[currentPath] || 'レシピ'

const { TextArea } = Input

// レシピ追加・編集モーダルコンポーネント
interface RecipeModalProps {
  open: boolean
  isEditMode?: boolean
  editingRecord?: RecipeColumn | null
  onCancel: () => void
  onSuccess?: (newRecipe?: RecipeColumn) => void
  zIndex?: number
}

export function RecipeModal({
  open,
  isEditMode = false,
  editingRecord = null,
  onCancel,
  onSuccess,
  zIndex,
}: RecipeModalProps) {
  const [form] = Form.useForm<RecipeColumn>()
  const [confirmLoading, setConfirmLoading] = useState(false)
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>([])
  const [instructions, setInstructions] = useState<instructions[]>([])
  const [goodsList, setGoodsList] = useState<any[]>([])
  const [isGoodsModalOpen, setIsGoodsModalOpen] = useState<boolean[]>([])

  // 商品追加モーダルを開く
  const handleAddGoods = (index: number) => {
    const newIsGoodsModalOpen = [...isGoodsModalOpen]
    newIsGoodsModalOpen[index] = true
    setIsGoodsModalOpen(newIsGoodsModalOpen)
  }

  // 商品追加モーダルをキャンセル
  const handleGoodsCancel = (index: number) => {
    const open = [...isGoodsModalOpen]
    open[index] = false
    setIsGoodsModalOpen(open)
  }

  // 商品追加成功時
  const handleGoodsSuccess = (index: number, newGoods: any) => {
    // 商品リストを再取得
    fetchGoods()
    // 追加した商品を選択状態にする
    const ings = [...ingredients]
    ings[index].goodsId = newGoods.id
    setIngredients(ings)
  }

  useEffect(() => {
    if (open) {
      fetchGoods()
      if (isEditMode && editingRecord) {
        form.setFieldsValue({
          recipeName: editingRecord.recipeName,
          description: editingRecord.description,
          servings: editingRecord.servings,
          preTime: editingRecord.preTime,
          cookTime: editingRecord.cookTime,
          totalTime: editingRecord.totalTime,
          difficulty: editingRecord.difficulty,
        })
        setIngredients(
          (editingRecord.ingredients.map((v) => {
            v.goodsId = v.goods?.id || v.goodsId
            return v
          }) || []) as RecipeIngredient[]
        )
        setInstructions((editingRecord.instructions || []) as instructions[])
      } else {
        form.resetFields()
        setIngredients([])
        setInstructions([])
      }
    }
  }, [open, isEditMode, editingRecord, form])

  // preTimeとcookTimeからtotalTimeを計算
  const calculateTotalTime = () => {
    const prep = form.getFieldValue('preTime') || 0
    const cook = form.getFieldValue('cookTime') || 0
    form.setFieldValue('totalTime', prep + cook)
  }

  function fetchGoods() {
    getGoods()
      .then((res) => {
        setGoodsList(res?.data || [])
      })
      .catch((error) => {
        console.error(error)
      })
  }

  function addIngredient() {
    setIngredients([
      ...ingredients,
      {
        goodsId: null as unknown as number,
        quantity: 1,
        unit: '個',
        description: '',
      },
    ])
  }

  function removeIngredient(index: number) {
    setIngredients(ingredients.filter((_, i) => i !== index))
  }

  function updateIngredient(index: number, field: keyof RecipeIngredient, value: any) {
    const newIngredients = [...ingredients]
    newIngredients[index] = {
      ...newIngredients[index],
      [field]: value,
    }
    setIngredients(newIngredients)
  }

  function addInstruction() {
    setInstructions([
      ...instructions,
      {
        stepNumber: instructions.length + 1,
        description: '',
        imageName: '',
      },
    ])
  }

  function removeInstruction(index: number) {
    const newInstructions = instructions.filter((_, i) => i !== index)
    // ステップ番号を再採番
    newInstructions.forEach((inst, i) => {
      inst.stepNumber = i + 1
    })
    setInstructions(newInstructions)
  }

  function updateInstruction(index: number, field: keyof instructions, value: any) {
    const newInstructions = [...instructions]
    newInstructions[index] = {
      ...newInstructions[index],
      [field]: value,
    }
    setInstructions(newInstructions)
  }

  function handleSave() {
    setConfirmLoading(true)
    form
      .validateFields()
      .then((values) => {
        const data: any = {}
        data.recipeName = values.recipeName || ''
        data.description = values.description || ''
        data.instructions = instructions.map((inst) => {
          const instData: any = {}
          if (inst.id) instData.id = inst.id
          instData.stepNumber = inst.stepNumber
          instData.description = inst.description
          instData.imageName = inst.imageName
          return instData
        })
        data.ingredients = ingredients.map((ing) => {
          const ingData: any = {}
          if (ing.id) ingData.id = ing.id
          ingData.goodsId = ing.goodsId
          ingData.quantity = ing.quantity
          ingData.unit = ing.unit
          ingData.description = ing.description
          return ingData
        })
        data.servings = values.servings || 1
        data.preTime = values.preTime
        data.cookTime = values.cookTime
        data.totalTime = values.totalTime
        data.difficulty = values.difficulty
        if (isEditMode && editingRecord) {
          return updateRecipe(editingRecord.id, data).then(() => editingRecord.id)
        } else {
          return addRecipe(data).then((res) => res.data.id)
        }
      })
      .then((res) => {
        message.success(`${PAGE_NAME}を${isEditMode ? '更新' : '追加'}しました`)
        form.resetFields()
        setIngredients([])
        setInstructions([])
        // 追加したレシピ（最後のレシピ）を返す
        if (onSuccess) {
          if (isEditMode) {
            onSuccess()
          } else if (res?.data?.length > 0) {
            const newRecipe = res.data[res.data.length - 1]
            onSuccess(newRecipe)
          }
        }
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
      zIndex={zIndex}
    >
      <Form
        form={form}
        layout="vertical"
      >
        <Form.Item
          name="id"
          hidden
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="recipeName"
          label={JPNames.recipeName}
          rules={[{ required: true, message: `${PAGE_NAME}名を入力してください` }]}
        >
          <Input placeholder="例：カレーライス" />
        </Form.Item>
        <Form.Item
          name="description"
          label={JPNames.description}
        >
          <TextArea
            rows={2}
            placeholder={`${PAGE_NAME}の簡単な説明`}
          />
        </Form.Item>

        <Divider orientation="horizontal">原材料</Divider>
        <Card
          size="small"
          style={{ marginBottom: 16 }}
        >
          {ingredients.map((ingredient, index) => (
            <Row
              key={index}
              gutter={8}
              style={{ marginBottom: 8 }}
            >
              <Col span={10}>
                <Space.Compact style={{ width: '100%' }}>
                  <Select
                    placeholder="商品を選択"
                    value={ingredient.goodsId || undefined}
                    onChange={(value) => updateIngredient(index, 'goodsId', value)}
                    style={{ width: '100%' }}
                    showSearch
                    optionFilterProp="children"
                    filterOption={(input, option) =>
                      (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                    options={goodsList.map((goods) => ({
                      label: goods.goodsName,
                      value: goods.id,
                    }))}
                  />
                  <Button
                    type="primary"
                    onClick={() => handleAddGoods(index)}
                    icon={<PlusOutlined />}
                  ></Button>
                </Space.Compact>

                <GoodsAddModal
                  open={isGoodsModalOpen[index]}
                  onCancel={() => handleGoodsCancel(index)}
                  onSuccess={(item) => handleGoodsSuccess(index, item)}
                />
              </Col>
              <Col span={4}>
                <InputNumber
                  placeholder="数量"
                  value={ingredient.quantity}
                  onChange={(value) => updateIngredient(index, 'quantity', value || 1)}
                  style={{ width: '100%' }}
                  min={0}
                />
              </Col>
              <Col span={4}>
                <Input
                  placeholder="単位"
                  value={ingredient.unit}
                  onChange={(e) => updateIngredient(index, 'unit', e.target.value || '個')}
                />
              </Col>
              <Col span={4}>
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
            原材料を追加
          </Button>
        </Card>

        <Divider orientation="horizontal">作り方（手順）</Divider>
        <Card
          size="small"
          style={{ marginBottom: 16 }}
        >
          {instructions.map((instruction, index) => (
            <Row
              key={index}
              gutter={8}
              style={{ marginBottom: 8 }}
            >
              <Col span={2}>
                <InputNumber
                  value={instruction.stepNumber}
                  disabled
                  style={{ width: '100%' }}
                />
              </Col>
              <Col span={20}>
                <TextArea
                  placeholder="手順の説明"
                  value={instruction.description}
                  onChange={(e) => updateInstruction(index, 'description', e.target.value)}
                  rows={2}
                />
              </Col>
              <Col span={2}>
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => removeInstruction(index)}
                />
              </Col>
            </Row>
          ))}
          <Button
            type="dashed"
            onClick={addInstruction}
            icon={<PlusOutlined />}
            style={{ width: '100%' }}
          >
            手順を追加
          </Button>
        </Card>
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
        <Form.Item
          name="difficulty"
          label={JPNames.difficulty}
        >
          <Rate />
        </Form.Item>
      </Form>
    </BookModal>
  )
}

import { useBookPage } from '@/hooks/useBookPage'
import { GoodsAddModal } from '@/features/budget/goods'

// (Keep RecipeModal definition and interfaces as is...)

export default function Recipe() {
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
  } = useBookPage<RecipeColumn>({
    fetchList: getRecipes,
    deleteItem: deleteRecipe,
    itemName: `${PAGE_NAME}管理`,
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
        data={data as RecipeColumn[]}
        renderItem={(record: RecipeColumn) => (
          <DoodleCard
            key={record.id}
            id={record.id}
            title={record.recipeName}
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
            <DoodleCardRow
              label={JPNames.difficulty}
              value={
                <Rate
                  disabled
                  defaultValue={record.difficulty || 0}
                  style={{ fontSize: 14 }}
                />
              }
            />
          </DoodleCard>
        )}
      />

      {/* レシピ追加・編集モーダル */}
      <RecipeModal
        open={isModalOpen}
        isEditMode={!isAdd}
        editingRecord={editingRecord as RecipeColumn | null}
        onCancel={handleCancel}
        onSuccess={handleSuccess}
      />

      <BookDetailModal
        manualFlip={true}
        open={isDetailOpen}
        title={detailRecord?.recipeName}
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
              label={JPNames.recipeName}
              value={detailRecord.recipeName}
            />
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
            <DoodleCardRow
              label={JPNames.difficulty}
              value={
                <Rate
                  disabled
                  value={detailRecord.difficulty || 0}
                  style={{ fontSize: 16 }}
                />
              }
            />
            {detailRecord.ingredients &&
              detailRecord.ingredients.length > 0 &&
              detailRecord.ingredients.map((ri: RecipeIngredient) => (
                <DoodleCardRow
                  label={JPNames.ingredients}
                  html={
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      {ri.goods?.imageName && (
                        <img
                          src={ri.goods.imageName}
                          alt={ri.goods.goodsName}
                          style={{ width: 24, height: 24, objectFit: 'cover', borderRadius: 4 }}
                        />
                      )}
                      <span style={{ marginLeft: 8 }}>
                        {ri.goods?.goodsName || '不明な商品'}: {ri.quantity}
                        {ri.unit} {ri.description && `(${ri.description})`}
                      </span>
                    </div>
                  }
                  truncate={true}
                />
              ))}
            {detailRecord.instructions &&
              detailRecord.instructions.length > 0 &&
              detailRecord.instructions.map((ri) => (
                <DoodleCardRow
                  label={JPNames.instructions}
                  labelPosition="top"
                  value={`ステップ ${ri.stepNumber}: ${ri.description}`}
                  truncate={true}
                />
              ))}
          </div>
        )}
      </BookDetailModal>
    </div>
  )
}
