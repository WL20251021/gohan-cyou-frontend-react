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
  const panelRef = useRef<HTMLDivElement | null>(null)
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)

  useEffect(() => {
    function handleScroll() {
      if (!open || !triggerRef.current) return
      const rect = triggerRef.current.getBoundingClientRect()
      // initial position (fixed, viewport coords)
      setPos({ top: rect.bottom + 8, left: rect.left })
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

  // Adjust position after panel is measured to prevent viewport overflow
  useEffect(() => {
    if (!open || !triggerRef.current || !panelRef.current) return

    const adjustPosition = () => {
      const trigger = triggerRef.current
      const panel = panelRef.current
      if (!trigger || !panel) return

      const triggerRect = trigger.getBoundingClientRect()
      const panelRect = panel.getBoundingClientRect()

      const spaceBelow = window.innerHeight - triggerRect.bottom
      const spaceAbove = triggerRect.top

      let top: number
      if (spaceBelow < panelRect.height + 16 && spaceAbove > panelRect.height + 16) {
        // Not enough space below, place above
        top = triggerRect.top - panelRect.height - 8
      } else {
        // Place below
        top = triggerRect.bottom + 8
      }

      // Prevent horizontal overflow
      let left = triggerRect.left
      const overflowRight = left + panelRect.width - window.innerWidth
      if (overflowRight > 0) {
        left = Math.max(8, triggerRect.right - panelRect.width)
      }
      if (left < 8) left = 8

      // Clamp vertical position
      if (top < 8) top = 8
      if (top + panelRect.height > window.innerHeight - 8) {
        top = window.innerHeight - panelRect.height - 8
      }

      setPos({ top, left })
    }

    // Use RAF to ensure panel is rendered
    const raf = requestAnimationFrame(adjustPosition)
    return () => cancelAnimationFrame(raf)
  }, [open, pos])

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
                ref={panelRef}
                className="doodle-popconfirm-panel"
                style={{
                  position: 'fixed',
                  top: pos.top,
                  left: pos.left,
                  zIndex: 9999,
                  maxHeight: '80vh',
                  overflowY: 'auto',
                }}
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
