import { useState, useEffect } from 'react'
import {
  Table,
  Button,
  Form,
  Input,
  InputNumber,
  Space,
  notification,
  Select,
  Divider,
  Card,
  Row,
  Col,
  Rate,
  message,
  Checkbox,
  Modal,
} from 'antd'
import BookModal from '../../components/BookModal'
import PageHeader from '../../components/PageHeader'
import DoodleCard, { DoodleCardRow } from '../../components/DoodleCard'
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import { RecipeColumn, JPNames } from './columns'
import { getRecipes, addRecipe, updateRecipe, deleteRecipe } from './api'
import { batchSaveIngredients, deleteIngredientsByRecipe } from './ingredient/api'
import type { RecipeIngredient } from './ingredient/columns'
import { batchSaveInstructions, deleteInstructionsByRecipe } from './instructions/api'
import type { instructions } from './instructions/columns'
import { getGoods } from '../budget/goods/api'

const { TextArea } = Input

// レシピ追加・編集モーダルコンポーネント
interface RecipeModalProps {
  open: boolean
  isEditMode?: boolean
  editingRecord?: RecipeColumn | null
  onCancel: () => void
  onSuccess?: () => void
}

function RecipeModal({
  open,
  isEditMode = false,
  editingRecord = null,
  onCancel,
  onSuccess,
}: RecipeModalProps) {
  const [form] = Form.useForm<RecipeColumn>()
  const [confirmLoading, setConfirmLoading] = useState(false)
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>([])
  const [instructions, setInstructions] = useState<instructions[]>([])
  const [goodsList, setGoodsList] = useState<any[]>([])

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
      .then(() => {
        message.success(isEditMode ? 'レシピを更新しました' : 'レシピを追加しました')
        form.resetFields()
        setIngredients([])
        setInstructions([])
        onSuccess?.()
        onCancel()
      })
      .catch((error) => {
        if (error.errorFields) {
          message.error('入力内容を確認してください')
        } else {
          console.error(error)
          notification.error({
            title: isEditMode ? 'レシピ更新失敗' : 'レシピ追加失敗',
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
      title={isEditMode ? 'レシピ編集' : '新規レシピ'}
      open={open}
      onOk={handleSave}
      onCancel={onCancel}
      confirmLoading={confirmLoading}
      // width={700}
      okText="保存"
      cancelText="キャンセル"
      // maskClosable={false}
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
          rules={[{ required: true, message: 'レシピ名を入力してください' }]}
        >
          <Input placeholder="例：カレーライス" />
        </Form.Item>
        <Form.Item
          name="description"
          label={JPNames.description}
        >
          <TextArea
            rows={2}
            placeholder="レシピの簡単な説明"
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

export default function Recipe() {
  const [data, setData] = useState<RecipeColumn[]>([])
  const [tableLoading, setTableLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<RecipeColumn | null>(null)
  const [selectedRows, setSelectedRows] = useState<RecipeColumn[]>([])

  const toggleSelection = (record: RecipeColumn, e: React.MouseEvent) => {
    e.stopPropagation()
    const isSelected = selectedRows.find((r) => r.id === record.id)
    if (isSelected) {
      setSelectedRows(selectedRows.filter((r) => r.id !== record.id))
    } else {
      setSelectedRows([...selectedRows, record])
    }
  }

  const columns = [
    {
      title: JPNames.id,
      dataIndex: 'id',
      key: 'id',
      width: 80,
      className: 'cell-id',
      onCell: () => ({ 'data-label': JPNames.id }),
    },
    {
      title: JPNames.recipeName,
      dataIndex: 'recipeName',
      key: 'recipeName',
      className: 'cell-title',
      onCell: () => ({ 'data-label': JPNames.recipeName }),
    },
    {
      title: JPNames.servings,
      dataIndex: 'servings',
      key: 'servings',
      width: 80,
      render: (servings: number) => `${servings}人分`,
      onCell: () => ({ 'data-label': JPNames.servings }),
    },
    {
      title: JPNames.preTime,
      dataIndex: 'preTime',
      key: 'preTime',
      width: 100,
      render: (time: number | null) => (time ? `${time}分` : '-'),
      onCell: () => ({ 'data-label': JPNames.preTime }),
    },
    {
      title: JPNames.cookTime,
      dataIndex: 'cookTime',
      key: 'cookTime',
      width: 100,
      render: (time: number | null) => (time ? `${time}分` : '-'),
      onCell: () => ({ 'data-label': JPNames.cookTime }),
    },
    {
      title: JPNames.totalTime,
      dataIndex: 'totalTime',
      key: 'totalTime',
      width: 100,
      render: (time: number | null) => (time ? `${time}分` : '-'),
      onCell: () => ({ 'data-label': JPNames.totalTime }),
    },
    {
      title: JPNames.difficulty,
      dataIndex: 'difficulty',
      key: 'difficulty',
      onCell: () => ({ 'data-label': JPNames.difficulty }),
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right' as const,
      width: 150,
      onCell: () => ({ 'data-label': '操作' }),
      render: (_: unknown, record: RecipeColumn) => (
        <Space size="middle">
          <a>
            <i className="i-material-symbols:edit-document-outline-rounded hover:material-symbols:edit-document-rounded"></i>
            編集
          </a>
          <a onClick={() => handleDelete(record)}>
            <i className="i-material-symbols:delete-outline-rounded hover:i-material-symbols:delete-rounded"></i>
            削除
          </a>
        </Space>
      ),
    },
  ]

  useEffect(() => {
    fetchRecipes()
  }, [])

  function fetchRecipes() {
    setTableLoading(true)
    getRecipes()
      .then((res) => {
        setData(res?.data || [])
      })
      .catch((error) => {
        console.error(error)
        notification.error({
          title: 'レシピデータ取得失敗',
          description: error.message,
          placement: 'bottomRight',
        })
      })
      .finally(() => {
        setTableLoading(false)
      })
  }

  /*************** レシピ追加/編集 ***************/
  // 新規追加モーダル表示
  const handleAdd = () => {
    setEditingRecord(null)
    setIsModalOpen(true)
  }

  // 編集モーダル表示
  const handleEdit = (record: RecipeColumn) => {
    setEditingRecord(record)
    setIsModalOpen(true)
  }

  // レシピ削除
  function handleDelete(record?: RecipeColumn) {
    const rows = record ? [record] : selectedRows
    if (rows.length === 0) {
      message.warning('削除するレシピを選択してください')
      return
    }

    Modal.confirm({
      title: 'レシピ削除確認',
      content: `レシピ「${
        rows.length === 1 ? rows[0].recipeName : `${rows.length}件`
      }」を削除してもよろしいですか？`,
      okText: '削除',
      okType: 'danger',
      cancelText: 'キャンセル',
      onOk() {
        return deleteRecipe(rows.map((r) => r.id))
          .then(() => {
            message.success('レシピを削除しました')
            setSelectedRows([])
            return fetchRecipes()
          })
          .catch((error) => {
            console.error(error)
            notification.error({
              title: 'レシピ削除失敗',
              description: error.response?.data?.message || error.message,
              placement: 'bottomRight',
            })
          })
      },
    })
  }

  const handleModalCancel = () => setIsModalOpen(false)
  const handleModalSuccess = () => fetchRecipes()

  return (
    <div>
      <PageHeader
        title="レシピ一覧"
        onAdd={handleAdd}
        onDelete={() => handleDelete()}
        deleteDisabled={selectedRows.length === 0}
      />

      <div className="doodle-card-grid mt-6">
        {data.map((record) => (
          <DoodleCard
            key={record.id}
            id={record.id}
            title={record.recipeName}
            selected={!!selectedRows.find((r) => r.id === record.id)}
            onToggleSelection={(e) => toggleSelection(record, e)}
            onEdit={(e) => {
              e.stopPropagation()
              handleEdit(record)
            }}
            onDelete={(e) => {
              e.stopPropagation()
              handleDelete(record)
            }}
          >
            <DoodleCardRow
              label={JPNames.servings}
              value={`${record.servings}人分`}
            />
            <DoodleCardRow
              label={JPNames.totalTime}
              value={`${record.totalTime}分`}
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
        ))}
      </div>

      {/* レシピ追加・編集モーダル */}
      <RecipeModal
        open={isModalOpen}
        isEditMode={!!editingRecord}
        editingRecord={editingRecord}
        onCancel={handleModalCancel}
        onSuccess={handleModalSuccess}
      />
    </div>
  )
}
