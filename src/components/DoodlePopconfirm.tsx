import React, { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Button } from 'antd'

interface DoodlePopconfirmProps {
  children: ReactNode
  title?: ReactNode
  description?: ReactNode
  onConfirm?: (...args: any[]) => void
  okText?: string
  cancelText?: string
  okButtonProps?: any
  disabled?: boolean
}

export default function DoodlePopconfirm({
  children,
  title,
  description,
  onConfirm,
  okText = '削除',
  cancelText = 'キャンセル',
  okButtonProps,
  disabled,
}: DoodlePopconfirmProps) {
  const triggerRef = useRef<HTMLDivElement | null>(null)
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)

  useEffect(() => {
    function handleScroll() {
      if (!open || !triggerRef.current) return
      const rect = triggerRef.current.getBoundingClientRect()
      setPos({ top: rect.bottom + window.scrollY + 8, left: rect.left + window.scrollX })
    }
    if (open) {
      handleScroll()
      window.addEventListener('scroll', handleScroll, true)
      window.addEventListener('resize', handleScroll)
    }
    return () => {
      window.removeEventListener('scroll', handleScroll, true)
      window.removeEventListener('resize', handleScroll)
    }
  }, [open])

  const handleTriggerClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (disabled) return
    setOpen((v) => !v)
  }

  const handleConfirm = () => {
    setOpen(false)
    onConfirm && onConfirm()
  }

  return (
    <>
      <div
        ref={triggerRef}
        onClick={handleTriggerClick}
        className="doodle-popconfirm-trigger"
      >
        {children}
      </div>

      {open && pos
        ? createPortal(
            <div
              className="doodle-popconfirm-portal-overlay"
              onClick={() => setOpen(false)}
            >
              <div
                className="doodle-popconfirm-panel"
                style={{ position: 'absolute', top: pos.top, left: pos.left }}
                onClick={(e) => e.stopPropagation()}
              >
                {title && <div className="doodle-popconfirm-title">{title}</div>}
                {description && <div className="doodle-popconfirm-desc">{description}</div>}
                <div className="doodle-popconfirm-actions">
                  <Button onClick={() => setOpen(false)}>{cancelText}</Button>
                  <Button
                    danger
                    {...okButtonProps}
                    onClick={handleConfirm}
                  >
                    {okText}
                  </Button>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  )
}
