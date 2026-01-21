import type { ReactNode, MouseEvent } from 'react'
import { Checkbox, Button, Space } from 'antd'

interface DoodleCardProps {
  id: string | number
  title: ReactNode
  selected?: boolean
  onToggleSelection?: (e: MouseEvent<HTMLElement>) => void
  onEdit?: (e: MouseEvent<HTMLElement>) => void
  onDelete?: (e: MouseEvent<HTMLElement>) => void
  onClick?: () => void
  children?: ReactNode
}

export function DoodleCardRow({
  label,
  value,
  truncate = false,
}: {
  label: ReactNode
  value: ReactNode
  truncate?: boolean
}) {
  return (
    <div className="doodle-card-row">
      <span className="doodle-card-label">{label}:</span>
      {truncate ? <span className="truncate">{value}</span> : <span>{value}</span>}
    </div>
  )
}

export default function DoodleCard({
  id,
  title,
  selected = false,
  onToggleSelection,
  onEdit,
  onDelete,
  onClick,
  children,
}: DoodleCardProps) {
  return (
    <div
      className={`doodle-card ${selected ? 'selected' : ''}`}
      onClick={onClick}
    >
      <div className="doodle-card-id">{id}</div>
      <div className="doodle-card-title">{title}</div>

      <div className="flex-1 flex flex-col gap-1 w-full">{children}</div>

      <div
        className="mt-4 flex justify-between items-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div onClick={(e) => e.stopPropagation()}>
          {onToggleSelection && (
            <Checkbox
              checked={selected}
              onClick={onToggleSelection}
            />
          )}
        </div>
        <Space onClick={(e) => e.stopPropagation()}>
          {onEdit && (
            <Button
              type="text"
              icon={
                <i className="i-material-symbols:edit-document-outline-rounded hover:material-symbols:edit-document-rounded text-xl"></i>
              }
              onClick={(e) => {
                e.stopPropagation()
                onEdit(e)
              }}
            />
          )}
          {onDelete && (
            <Button
              type="text"
              danger
              icon={
                <i className="i-material-symbols:delete-outline-rounded hover:i-material-symbols:delete-rounded text-xl"></i>
              }
              onClick={(e) => {
                e.stopPropagation()
                onDelete(e)
              }}
            />
          )}
        </Space>
      </div>
    </div>
  )
}
