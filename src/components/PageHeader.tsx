import { Button, Flex, Empty } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { useLocation } from 'react-router'
import DeleteButton from './DeleteButton'

interface PageHeaderProps {
  title?: string
  onAdd: () => void
  onDelete: () => void
  deleteDisabled: boolean
  data?: any[]
}

const PATH_TO_TITLE: Record<string, string> = {
  '/budget/store': '店舗',
  '/budget/category': 'カテゴリ',
  '/budget/brand': 'ブランド',
  '/budget/goods': '商品',
  '/budget/purchasement': '買い物記録',
  '/budget/income': '収入管理',
  '/recipe': 'レシピ管理',
  '/budget/inventory': '在庫管理',
  '/budget/consumption': '使用記録',
}

/**
 * 管理画面の共通ヘッダーコンポーネント
 * - H2タイトル (指定がない場合はURLから自動判定)
 * - 新規追加ボタン
 * - 削除ボタン
 */
export default function PageHeader({
  title,
  onAdd,
  onDelete,
  deleteDisabled,
  data,
}: PageHeaderProps) {
  const location = useLocation()
  const displayTitle = title ?? PATH_TO_TITLE[location.pathname] ?? title

  return (
    <div style={{ marginBottom: '16px' }}>
      <h2 style={{ marginBottom: '16px' }}>{displayTitle}</h2>
      {data?.length ? (
        <Flex
          gap="small"
          align="start"
        >
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={onAdd}
          >
            新規
          </Button>
          <DeleteButton
            onClick={onDelete}
            disabled={deleteDisabled}
          />
        </Flex>
      ) : (
        <Empty description="データなし">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={onAdd}
          >
            新規
          </Button>
        </Empty>
      )}
    </div>
  )
}
