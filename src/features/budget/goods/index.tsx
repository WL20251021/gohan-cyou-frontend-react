import { useState, useEffect } from 'react'
import {
  Flex,
  Button,
  Form,
  Input,
  Select,
  Space,
  notification,
  message,
  Upload,
  Image,
  Popconfirm,
} from 'antd'
import BookModal from '../../../components/BookModal'
import PageHeader from '../../../components/PageHeader'
import DoodleCard, { DoodleCardRow } from '../../../components/DoodleCard'
import type { UploadFile } from 'antd'
import { GoodsColumn, JPNames } from './columns'
import {
  getGoods,
  addGoods,
  updateGoods,
  deleteGoods,
  uploadGoodsImage,
  deleteGoodsImage,
} from './api'
import { getCategories } from '../category/api'
import { getBrands } from '../brand/api'
import { CategoryAddModal } from '../category/index'
import { BrandAddModal } from '../brand/index'
import { type FileType } from '@/utils/file'

// 商品追加・編集モーダルコンポーネント（他のコンポーネントから使用可能）
export function GoodsAddModal({
  open,
  isEditMode = false,
  editingRecord = null,
  onCancel,
  onSuccess,
}: {
  open: boolean
  isEditMode?: boolean
  editingRecord?: GoodsColumn | null
  onCancel: () => void
  onSuccess?: (newGoods?: GoodsColumn) => void
}) {
  const [form] = Form.useForm<GoodsColumn>()
  const [confirmLoading, setConfirmLoading] = useState(false)
  const [categories, setCategories] = useState<Array<any>>([])
  const [brands, setBrands] = useState<Array<any>>([])
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewImage, setPreviewImage] = useState<string>('')
  const [fileList, setFileList] = useState<UploadFile[]>([])

  const [categoryId, setCategoryId] = useState<number | null>(null)
  const [brandId, setBrandId] = useState<number | null>(null)

  // カテゴリ追加モーダルの状態
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  // ブランド追加モーダルの状態
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false)

  // モーダルが開いたときにフォームをリセットまたは設定とカテゴリー・ブランド取得
  useEffect(() => {
    if (open) {
      fetchCategories()
      fetchBrands()
      if (isEditMode && editingRecord) {
        form.setFieldsValue({
          ...editingRecord,
        })
        setCategoryId(editingRecord.category?.id || null)
        setBrandId(editingRecord.brand?.id || null)
        if (editingRecord.imageName) {
          setFileList([
            {
              uid: `goods_image_${editingRecord.id}`,
              name: `goods_image_${editingRecord.id}`,
              status: 'done',
              url: genImageUrl(editingRecord.imageName),
              response: { fileName: editingRecord.imageName },
            },
          ])
        } else {
          setFileList([])
        }
      } else {
        form.resetFields()
        setCategoryId(null)
        setBrandId(null)
        setFileList([])
      }
    }
  }, [open, isEditMode, editingRecord, form])

  // カテゴリーデータ取得
  function fetchCategories() {
    getCategories()
      .then((res) => {
        // ツリー構造をそのまま保持
        setCategories(res?.data || [])
      })
      .catch((error) => {
        console.error(error)
      })
  }

  // ブランドデータ取得
  function fetchBrands() {
    getBrands()
      .then((res) => {
        setBrands(res?.data || [])
      })
      .catch((error) => {
        console.error(error)
      })
  }

  // 商品保存（追加または更新）
  function handleSaveGoods() {
    setConfirmLoading(true)
    form
      .validateFields()
      .then((values) => {
        const formData = {
          ...values,
          imageName: fileList[0]?.response?.fileName || null,
          brandId: brandId,
          categoryId: categoryId,
        }
        if (isEditMode && editingRecord) {
          return updateGoods(editingRecord.id, formData)
        } else {
          return addGoods(formData)
        }
      })
      .then(() => {
        return getGoods()
      })
      .then((res) => {
        form.resetFields()
        setFileList([])
        message.success(isEditMode ? '商品を更新しました' : '商品を追加しました')
        setConfirmLoading(false)

        // 追加した商品（最後の商品）を返す
        if (onSuccess) {
          if (isEditMode) {
            onSuccess()
          } else if (res?.data?.length > 0) {
            const newGoods = res.data[res.data.length - 1]
            onSuccess(newGoods)
          }
        }

        onCancel()
      })
      .catch((error) => {
        setConfirmLoading(false)
        if (error.errorFields) {
          message.error('入力内容を確認してください')
        } else {
          console.error(error)
          notification.error({
            title: isEditMode ? '商品更新失敗' : '商品追加失敗',
            description: error.message,
            placement: 'bottomRight',
            showProgress: true,
            pauseOnHover: true,
          })
        }
      })
  }

  // カテゴリ追加モーダルを開く
  const handleAddCategory = () => {
    setIsCategoryModalOpen(true)
  }

  // カテゴリ追加モーダルをキャンセル
  const handleCategoryCancel = () => {
    setIsCategoryModalOpen(false)
  }

  // カテゴリ追加成功時
  const handleCategorySuccess = (newCategory: any) => {
    // カテゴリリストを再取得
    fetchCategories()
    // 追加したカテゴリを選択状態にする
    setCategoryId(newCategory.id)
  }

  // ブランド追加モーダルを開く
  const handleAddBrand = () => {
    setIsBrandModalOpen(true)
  }

  // ブランド追加モーダルをキャンセル
  const handleBrandCancel = () => {
    setIsBrandModalOpen(false)
  }

  // ブランド追加成功時
  const handleBrandSuccess = (newBrand: any) => {
    // ブランドリストを再取得
    fetchBrands()
    // 追加したブランドを選択状態にする
    setBrandId(newBrand.id)
  }

  // ファイルアップロードの設定
  const uploadProps = {
    fileList,
    action: '',
    pastable: true,
    listType: 'picture-card' as const,
    accept: 'image/*',
    beforeUpload: (file: FileType) => {
      const isLt1M = file.size / 1024 / 1024 < 1
      if (!isLt1M) {
        message.error('1MB以下の画像をアップロードしてください')
        setFileList([])
        return Upload.LIST_IGNORE
      }
      return true
    },
    onPreview: async (file: UploadFile) => {
      setPreviewImage(genImageUrl(file.response.fileName as string))
      setPreviewOpen(true)
    },
    onChange({ fileList: newFileList }: { fileList: UploadFile[] }) {
      setFileList(newFileList)
    },
    customRequest: (options: any) => {
      return uploadGoodsImage(options.file)
        .then((res) => {
          options.onSuccess && options.onSuccess(res.data)
        })
        .catch(() => {
          options.onError && options.onError(new Error('アップロード失敗'))
        })
    },
    onRemove: (file: UploadFile) => {
      deleteGoodsImage(file.response.fileName as string)
        .then(() => {
          message.success('画像を削除しました')
        })
        .catch((error) => {
          console.error('画像削除失敗:', error)
        })
      setFileList((prevList) => prevList.filter((item) => item.uid !== file.uid))
    },
    maxCount: 1,
  }

  return (
    <BookModal
      title={isEditMode ? '商品を編集' : '商品を追加'}
      // width="80%"
      // maskClosable={false}
      open={open}
      confirmLoading={confirmLoading}
      onOk={handleSaveGoods}
      onCancel={onCancel}
      okText="保存"
      cancelText="キャンセル"
    >
      <Form
        form={form}
        className="p-8"
        labelCol={{ span: 6 }}
        wrapperCol={{ span: 14 }}
        layout="horizontal"
      >
        {isEditMode && (
          <Form.Item
            label={JPNames.id}
            name="id"
          >
            <Input disabled />
          </Form.Item>
        )}
        <Form.Item
          label={JPNames.goodsName}
          name="goodsName"
          rules={[{ required: true, message: '商品名を入力してください!' }]}
        >
          <Input allowClear />
        </Form.Item>
        <Form.Item
          label={JPNames.category}
          name="categoryId"
        >
          <Space.Compact style={{ width: '100%' }}>
            <Select
              allowClear
              placeholder="カテゴリーを選択（任意）"
              style={{ width: 'calc(100% - 80px)' }}
              options={categories.map((category) => ({
                label: category.categoryName,
                value: category.id,
              }))}
              value={categoryId}
              onChange={(value) => setCategoryId(value)}
            />
            <Button
              type="primary"
              icon={<i className="i-material-symbols:add"></i>}
              onClick={handleAddCategory}
            >
              新規
            </Button>
          </Space.Compact>
        </Form.Item>
        <Form.Item label={JPNames.brand}>
          <Space.Compact style={{ width: '100%' }}>
            <Select
              allowClear
              placeholder="ブランドを選択（任意）"
              style={{ width: 'calc(100% - 80px)' }}
              options={brands.map((brand) => ({
                label: brand.brandName,
                value: brand.id,
              }))}
              value={brandId}
              onChange={(value) => setBrandId(value)}
            />
            <Button
              type="primary"
              icon={<i className="i-material-symbols:add"></i>}
              onClick={handleAddBrand}
            >
              新規
            </Button>
          </Space.Compact>
        </Form.Item>
        <Form.Item
          label={JPNames.memo}
          name="memo"
        >
          <Input.TextArea
            allowClear
            rows={4}
            placeholder="メモを入力（任意）"
          />
        </Form.Item>
        <Form.Item
          label={JPNames.imageName}
          name="imageName"
          rules={[]}
        >
          <Space direction="vertical">
            <Upload {...uploadProps}>
              {fileList.length >= 1 ? null : (
                <button
                  style={{ border: 0, background: 'none' }}
                  type="button"
                >
                  <i
                    className="i-material-symbols:add"
                    style={{ fontSize: 32 }}
                  ></i>
                  <div style={{ marginTop: 8 }}>Upload</div>
                </button>
              )}
            </Upload>
            {previewImage && (
              <Image
                styles={{ root: { display: 'none' } }}
                preview={{
                  open: previewOpen,
                  onOpenChange: (visible) => setPreviewOpen(visible),
                  afterOpenChange: (visible) => !visible && setPreviewImage(''),
                }}
                src={previewImage}
                alt={JPNames.imageName}
              />
            )}
          </Space>
        </Form.Item>
      </Form>

      {/* カテゴリ追加モーダル */}
      <CategoryAddModal
        open={isCategoryModalOpen}
        onCancel={handleCategoryCancel}
        onSuccess={handleCategorySuccess}
      />

      {/* ブランド追加モーダル */}
      <BrandAddModal
        open={isBrandModalOpen}
        onCancel={handleBrandCancel}
        onSuccess={handleBrandSuccess}
      />
    </BookModal>
  )
}

// 画像URL生成
function genImageUrl(imageName: string) {
  return `http://${import.meta.env.VITE_HOST}:${import.meta.env.VITE_PORT}/images/${imageName}`
}

export default function Goods() {
  // テーブルデータとカラム定義
  const [data, setData] = useState<Array<GoodsColumn>>([])
  const [tableLoading, setTableLoading] = useState<boolean>(false)
  const [categories, setCategories] = useState<Array<any>>([])
  const [brands, setBrands] = useState<Array<any>>([])

  const columns: Array<any> = [
    {
      title: JPNames.id,
      dataIndex: 'id',
      key: 'id',
      width: 80,
      className: 'cell-id',
      onCell: () => ({ 'data-label': JPNames.id }),
    },
    {
      title: JPNames.goodsName,
      dataIndex: 'goodsName',
      key: 'goodsName',
      className: 'cell-title',
      onCell: () => ({ 'data-label': JPNames.goodsName }),
    },
    {
      title: JPNames.category,
      dataIndex: 'category',
      key: 'category',
      onCell: () => ({ 'data-label': JPNames.category }),
      render: (category: any) => category?.categoryName || '-',
    },
    {
      title: JPNames.brand,
      dataIndex: 'brand',
      key: 'brand',
      onCell: () => ({ 'data-label': JPNames.brand }),
      render: (brand: any) => brand?.brandName || '-',
    },
    {
      title: JPNames.memo,
      dataIndex: 'memo',
      key: 'memo',
      onCell: () => ({ 'data-label': JPNames.memo }),
      render: (memo: string | null) => memo || '-',
    },
    {
      title: JPNames.imageName,
      dataIndex: 'imageName',
      key: 'imageName',
      onCell: () => ({ 'data-label': JPNames.imageName }),
      render: (imageName: string | null) =>
        imageName ? (
          // Only VITE_SOME_KEY will be exposed as import.meta.env.VITE_SOME_KEY to your client source code, but DB_PASSWORD will not.
          <Image
            src={genImageUrl(imageName)}
            alt={JPNames.imageName}
            width={50}
            height={50}
            style={{ objectFit: 'cover' }}
          />
        ) : (
          '-'
        ),
    },
    {
      title: '操作',
      key: 'action',
      onCell: () => ({ 'data-label': '操作' }),
      render: (_: any, record: GoodsColumn) => (
        <Space size="middle">
          <a>
            <i className="i-material-symbols:edit-document-outline-rounded hover:material-symbols:edit-document-rounded "></i>
            編集
          </a>
          <Popconfirm
            title="削除確認"
            description="本当に削除しますか？"
            onConfirm={() => handleDeleteGoods(record)}
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
    fetchGoods()
    fetchCategories()
    fetchBrands()
  }, [])

  // 商品データ取得
  function fetchGoods() {
    getGoods()
      .then((res) => {
        setData(res?.data || [])
      })
      .catch((error) => {
        console.error(error)
        notification.error({
          title: '商品データ取得失敗',
          description: error.message,
          placement: 'bottomRight',
          showProgress: true,
          pauseOnHover: true,
        })
      })
  }

  const toggleSelection = (record: GoodsColumn, e: React.MouseEvent) => {
    e.stopPropagation()
    const isSelected = selectedRows.find((r) => r.id === record.id)
    if (isSelected) {
      setSelectedRows(selectedRows.filter((r) => r.id !== record.id))
    } else {
      setSelectedRows([...selectedRows, record])
    }
  }

  // カテゴリーデータ取得
  function fetchCategories() {
    getCategories()
      .then((res) => {
        // ツリー構造をフラット化
        const flatCategories = flattenTree(res?.data || [])
        setCategories(flatCategories)
      })
      .catch((error) => {
        console.error(error)
      })
  }

  // ブランドデータ取得
  function fetchBrands() {
    getBrands()
      .then((res) => {
        setBrands(res?.data || [])
      })
      .catch((error) => {
        console.error(error)
      })
  }

  // ツリー構造をフラット化
  function flattenTree(tree: any[]): any[] {
    const result: any[] = []
    function traverse(nodes: any[]) {
      nodes.forEach((node) => {
        result.push(node)
        if (node.children && node.children.length > 0) {
          traverse(node.children)
        }
      })
    }
    traverse(tree)
    return result
  }

  /*************** 新規商品を追加/商品を編集 ***************/
  const [isAdd, setIsAdd] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<GoodsColumn | null>(null)

  // モーダルの表示
  const showModal = (isAdd: boolean, record?: GoodsColumn) => {
    setIsModalOpen(true)
    setIsAdd(isAdd)
    setEditingRecord(record || null)
  }

  // モーダルのキャンセル
  const handleCancel = () => {
    setIsModalOpen(false)
    setEditingRecord(null)
  }

  // 商品保存成功時
  const handleSuccess = () => {
    fetchGoods()
  }

  /*************** 商品を削除 ***************/
  const [selectedRows, setSelectedRows] = useState<GoodsColumn[]>([])

  // テーブルの行選択時
  function onRowSelectionChange(_selectedKeys: any, selectedRows: GoodsColumn[]) {
    setSelectedRows(selectedRows)
  }

  // 削除実行
  function executeDelete(rows: (GoodsColumn | null)[]) {
    const cleanRows = rows.filter((r) => r !== null) as GoodsColumn[]
    const deletePromises = cleanRows.map((row) => deleteGoods([row.id]))

    Promise.all(deletePromises)
      .then(() => {
        message.success(
          `商品${
            cleanRows.length > 1
              ? `${cleanRows.map((v) => v.goodsName).join('、')}など${cleanRows.length}件の商品`
              : cleanRows[0].goodsName
          }を削除しました`
        )

        setTableLoading(true)
        return getGoods()
      })
      .then((res) => {
        setData(res?.data || [])
        setTableLoading(false)
        setSelectedRows([])
      })
      .catch((error) => {
        console.error(error)

        notification.error({
          title: '商品削除失敗',
          description: `商品削除に失敗しました: ${error.message}`,
          placement: 'bottomRight',
          showProgress: true,
          pauseOnHover: true,
        })
      })
  }

  // 削除ボタン押下時
  function handleDeleteGoods(record?: GoodsColumn) {
    if (record) {
      executeDelete([record])
    } else if (selectedRows.length) {
      executeDelete(selectedRows)
    } else {
      message.warning('削除する商品を選択してください')
    }
  }

  return (
    <div className="h-[cal(100vh - 7rem)]">
      <PageHeader
        title="商品一覧"
        onAdd={() => showModal(true)}
        onDelete={() => handleDeleteGoods()}
        deleteDisabled={selectedRows.length === 0}
        data={data}
      />
      <div className="doodle-card-grid mt-6">
        {data.map((record) => (
          <DoodleCard
            key={record.id}
            id={record.id}
            title={record.goodsName}
            selected={!!selectedRows.find((r) => r.id === record.id)}
            onToggleSelection={(e) => toggleSelection(record, e)}
            onEdit={(e) => {
              e.stopPropagation()
              showModal(false, record)
            }}
            onDelete={(e) => {
              e.stopPropagation()
              handleDeleteGoods(record)
            }}
          >
            {record.imageName && (
              <div className="mb-2">
                <Image
                  src={genImageUrl(record.imageName)}
                  alt={JPNames.imageName}
                  width={50}
                  height={50}
                  style={{ objectFit: 'cover' }}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}
            <DoodleCardRow
              label={JPNames.category}
              value={record.category?.categoryName || '-'}
            />
            <DoodleCardRow
              label={JPNames.brand}
              value={record.brand?.brandName || '-'}
            />
            <DoodleCardRow
              label={JPNames.memo}
              value={record.memo || '-'}
              truncate
            />
          </DoodleCard>
        ))}
      </div>

      {/* 商品追加・編集モーダル */}
      <GoodsAddModal
        open={isModalOpen}
        isEditMode={!isAdd}
        editingRecord={editingRecord}
        onCancel={handleCancel}
        onSuccess={handleSuccess}
      />
    </div>
  )
}
