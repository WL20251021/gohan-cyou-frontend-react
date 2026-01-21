import { useEffect, type ReactNode, useState } from 'react'
import { createPortal } from 'react-dom'
import { Button, Space } from 'antd'
import { useBook } from '../context/BookContext'

interface BookModalProps {
  open: boolean
  title?: ReactNode
  onCancel?: () => void
  onOk?: () => void
  confirmLoading?: boolean
  okText?: string
  cancelText?: string
  footer?: ReactNode | null
  children?: ReactNode
  width?: string | number
  maskClosable?: boolean
}

export default function BookModal({
  open,
  title,
  onCancel,
  onOk,
  confirmLoading = false,
  okText = 'OK',
  cancelText = 'Cancel',
  footer,
  children,
}: BookModalProps) {
  const { setFlip } = useBook()
  const [targetParams, setTargetParams] = useState<{
    element: HTMLElement
    tabElement: HTMLElement
  } | null>(null)

  useEffect(() => {
    // Find portal targets on mount
    const root = document.getElementById('book-modal-root')
    const tabRoot = document.getElementById('book-modal-left-target')
    if (root && tabRoot) {
      setTargetParams({ element: root, tabElement: tabRoot })
    }
  }, [])

  useEffect(() => {
    setFlip(open)
  }, [open, setFlip])

  if (!open || !targetParams) return null

  // Left Sidebar Content: Title + Footer Actions
  const sidebarContent = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        padding: '32px 24px',
        justifyContent: 'space-between',
      }}
    >
      {/* 1. Title Area (Big, Bold, Boxed) */}
      <div
        style={{
          background: 'var(--color-active-yellow)',
          border: '2px solid var(--color-ink-black)',
          borderRadius: 'var(--radius-doodle-sm)',
          padding: '16px',
          boxShadow: '4px 4px 0px rgba(0,0,0,0.1)',
          marginBottom: '24px',
          transform: 'rotate(-2deg)',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.8rem',
            fontWeight: 800,
            color: 'var(--color-ink-black)',
            textAlign: 'center',
            lineHeight: 1.2,
          }}
        >
          {title}
        </div>
      </div>

      {/* 2. Footer Actions (Fixed on Left) */}
      <div
        style={{
          marginTop: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          paddingTop: '24px',
        }}
      >
        {footer !== null &&
          (footer ? (
            footer
          ) : (
            <Space
              direction="vertical"
              style={{ width: '100%' }}
              size="middle"
            >
              <Button
                type="primary"
                onClick={onOk}
                loading={confirmLoading}
                block
                size="large"
                style={{ height: '50px', fontSize: '1.2rem' }}
              >
                {okText}
              </Button>
              <Button
                onClick={onCancel}
                block
                size="large"
                style={{ height: '44px' }}
              >
                {cancelText}
              </Button>
            </Space>
          ))}
      </div>
    </div>
  )

  // Right Content: Scrolling Form
  const content = (
    <div
      style={{
        height: '100%',
        overflowY: 'auto',
        padding: '32px 40px',
        /* Ensure form content has some breathing room */
      }}
    >
      {children}
    </div>
  )

  // Title & Footer -> Left (tabElement)
  // Form Content -> Right (element)
  return (
    <>
      {createPortal(content, targetParams.element)}
      {createPortal(sidebarContent, targetParams.tabElement)}
    </>
  )
}
