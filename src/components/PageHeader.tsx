import { Button, Flex } from 'antd'
import DoodlePopconfirm from './DoodlePopconfirm'
import { PlusOutlined } from '@ant-design/icons'
import { useLocation } from 'react-router'

interface PageHeaderProps {
  title?: string
  onAdd?: () => void
  onDelete?: () => void
  deleteDisabled?: boolean
  data?: any[]
}

const PATH_TO_TITLE: Record<string, string> = {
  '/budget/store': '店舗',
  '/budget/category': 'カテゴリ',
  '/budget/brand': 'ブランド',
  '/budget/goods': '商品',
  '/budget/purchasement': '支出管理',
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
    <div
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 99, // Ensure it's above other content
        backgroundColor: 'var(--color-paper-white)', // Match page background
        padding: '32px 48px 10px', // Add breathing room when stuck
      }}
      className="book-page-header"
    >
      <h2 style={{ marginBottom: '16px', fontSize: '24px', fontWeight: 'bold' }}>{displayTitle}</h2>
      {data?.length || onAdd || onDelete ? (
        <Flex
          gap="small"
          align="start"
        >
          {onAdd && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={onAdd}
            >
              新規
            </Button>
          )}
          {onDelete && (
            <DoodlePopconfirm
              title="削除確認"
              description="本当に削除しますか？"
              onConfirm={onDelete}
              okText="削除"
              cancelText="キャンセル"
              okButtonProps={{ danger: true }}
              disabled={deleteDisabled}
            >
              <Button
                danger
                disabled={deleteDisabled}
                className="hover:!border-current"
              >
                削除
              </Button>
            </DoodlePopconfirm>
          )}
        </Flex>
      ) : (
        <></>
      )}
    </div>
  )
}
