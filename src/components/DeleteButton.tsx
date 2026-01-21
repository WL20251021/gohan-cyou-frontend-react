import { Button } from 'antd'

interface DeleteButtonProps {
  onClick: () => void
  disabled: boolean
  loading?: boolean
  className?: string
}

/**
 * 統一された削除ボタンコンポーネント
 * - 未選択時はグレーアウト（disabled）
 * - 選択時は有効化
 * - ホバー時に赤枠（danger属性で対応 + クラスで微調整）
 */
export default function DeleteButton({
  onClick,
  disabled,
  loading = false,
  className = '',
}: DeleteButtonProps) {
  return (
    <Button
      danger
      onClick={onClick}
      disabled={disabled}
      loading={loading}
      className={`${className} hover:!border-current`}
    >
      削除
    </Button>
  )
}
