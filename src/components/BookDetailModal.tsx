import { useEffect, type ReactNode, useState } from 'react'
import { createPortal } from 'react-dom'
import { Button, Tooltip } from 'antd'
import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  EditOutlined,
  CloseOutlined,
} from '@ant-design/icons'
import { useBook } from '../context/BookContext'

interface BookDetailModalProps {
  open: boolean
  title?: ReactNode
  subtitle?: ReactNode
  id?: string | number
  onClose?: () => void
  onEdit?: () => void
  onNext?: () => void
  onPrev?: () => void
  hasNext?: boolean
  hasPrev?: boolean
  children?: ReactNode
  rowJustify?: 'start' | 'center' | 'end' | 'space-between' | 'space-around' | 'space-evenly'
}

export default function BookDetailModal({
  open,
  title,
  subtitle,
  id,
  onClose,
  onEdit,
  onNext,
  onPrev,
  hasNext,
  hasPrev,
  children,
  rowJustify,
}: BookDetailModalProps) {
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

  // Left Sidebar Content: Title + Info + Actions
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
      {/* 1. Content Info Area */}
      <div>
        {/* Module Title Card */}
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
              fontSize: '1.5rem',
              fontWeight: 800,
              color: 'var(--color-ink-black)',
              textAlign: 'center',
              lineHeight: 1.2,
            }}
          >
            {title}
          </div>
          {id && (
            <div
              style={{ textAlign: 'center', marginTop: '4px', color: '#666', fontWeight: 'bold' }}
            >
              ID: {id}
            </div>
          )}
        </div>

        {/* Subtitle / Extra Info */}
        {subtitle && (
          <div
            style={{
              fontSize: '1.2rem',
              fontWeight: 'bold',
              textAlign: 'center',
              marginTop: '12px',
            }}
          >
            {subtitle}
          </div>
        )}
      </div>

      {/* 2. Actions & Navigation */}
      <div
        style={{
          marginTop: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          paddingTop: '24px',
        }}
      >
        {/* Navigation Buttons */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <Tooltip title={hasPrev ? '前の項目' : '先頭です'}>
            <Button
              block
              disabled={!hasPrev}
              onClick={onPrev}
              icon={<ArrowLeftOutlined />}
            >
              Prev
            </Button>
          </Tooltip>
          <Tooltip title={hasNext ? '次の項目' : '末尾です'}>
            <Button
              block
              disabled={!hasNext}
              onClick={onNext}
              icon={<ArrowRightOutlined />}
              style={{ flexDirection: 'row-reverse' }} // Icon on right? No, AntD doesn't support easy flexDirection prop usually, but flex works.
            >
              Next
            </Button>
          </Tooltip>
        </div>

        {/* Main Actions */}
        <Button
          className="doodle-btn-primary"
          block
          icon={<EditOutlined />}
          onClick={onEdit}
          style={{
            height: '48px',
            fontSize: '1.1rem',
            fontWeight: 'bold',
            border: '2px solid var(--color-ink-black)',
            background: 'var(--color-candy-pink)',
            color: 'white',
          }}
        >
          編集する
        </Button>
        <Button
          block
          icon={<CloseOutlined />}
          onClick={onClose}
          style={{
            height: '48px',
            fontSize: '1.1rem',
            fontWeight: 'bold',
            border: '2px solid var(--color-ink-black)',
          }}
        >
          閉じる
        </Button>
      </div>
    </div>
  )

  // Right Side Content
  const content = (
    <div
      style={
        {
          height: '100%',
          padding: '48px',
          overflowY: 'auto',
          '--doodle-card-row-justify': rowJustify,
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  )

  return (
    <>
      {createPortal(sidebarContent, targetParams.tabElement)}
      {createPortal(content, targetParams.element)}
    </>
  )
}
