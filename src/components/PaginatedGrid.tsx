import React, { useState, useEffect } from 'react'
import { UpOutlined, DownOutlined } from '@ant-design/icons'

interface PaginatedGridProps<T> {
  data: T[]
  renderItem: (item: T, index: number) => React.ReactNode
  pageSize?: number
  className?: string
}

export default function PaginatedGrid<T>({
  data,
  renderItem,
  pageSize = 6,
  className = '',
}: PaginatedGridProps<T>) {
  const [current, setCurrent] = useState(1)

  // Reset to page 1 when data changes (e.g. filtering)
  useEffect(() => {
    setCurrent(1)
  }, [data.length])

  const totalPages = Math.ceil(data.length / pageSize)

  // Ensure current page is valid
  useEffect(() => {
    if (current > totalPages && totalPages > 0) {
      setCurrent(totalPages)
    }
  }, [totalPages, current])

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrent(page)
    }
  }

  const startIndex = (current - 1) * pageSize
  const endIndex = startIndex + pageSize
  const currentData = data.slice(startIndex, endIndex)

  return (
    <div
      style={{ position: 'relative' }}
      className={className}
    >
      <div className={`doodle-card-grid`}>
        {currentData.map((item, index) => renderItem(item, startIndex + index))}
      </div>

      {totalPages > 1 && (
        <div
          style={{
            position: 'fixed',
            right: '0',
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
            padding: '8px', // Touch area
          }}
        >
          {/* Previous Button */}
          <button
            onClick={() => handlePageChange(current - 1)}
            disabled={current === 1}
            style={{
              background: 'var(--color-paper-white)',
              border: '2px solid var(--color-ink-black)',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              cursor: current === 1 ? 'not-allowed' : 'pointer',
              opacity: current === 1 ? 0.3 : 1,
              fontSize: '16px',
              color: 'var(--color-ink-black)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '3px 3px 0px rgba(0,0,0,0.1)',
              transition: 'transform 0.1s',
              outline: 'none',
            }}
            onMouseDown={(e) => (e.currentTarget.style.transform = 'translate(1px, 1px)')}
            onMouseUp={(e) => (e.currentTarget.style.transform = 'translate(0, 0)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translate(0, 0)')}
          >
            <UpOutlined />
          </button>

          {/* Dots Container */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              alignItems: 'center',
              maxHeight: '60vh',
              overflowY: 'auto',
              padding: '6px',
              scrollbarWidth: 'none',
            }}
          >
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
              const isActive = page === current
              return (
                <div
                  key={page}
                  onClick={() => handlePageChange(page)}
                  style={{
                    width: isActive ? '32px' : '12px',
                    height: isActive ? '32px' : '12px',
                    borderRadius: '50%',
                    background: isActive
                      ? 'var(--color-active-yellow)'
                      : 'var(--color-pencil-gray)',
                    border: isActive ? '2px solid var(--color-ink-black)' : '1px solid transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: '800',
                    fontFamily: 'var(--font-doodle)',
                    color: 'var(--color-ink-black)',
                    transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    boxShadow: isActive ? '3px 3px 0px rgba(0,0,0,0.15)' : 'none',
                    flexShrink: 0,
                  }}
                >
                  {isActive ? page : ''}
                </div>
              )
            })}
          </div>

          {/* Next Button */}
          <button
            onClick={() => handlePageChange(current + 1)}
            disabled={current === totalPages}
            style={{
              background: 'var(--color-paper-white)',
              border: '2px solid var(--color-ink-black)',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              cursor: current === totalPages ? 'not-allowed' : 'pointer',
              opacity: current === totalPages ? 0.3 : 1,
              fontSize: '16px',
              color: 'var(--color-ink-black)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '3px 3px 0px rgba(0,0,0,0.1)',
              transition: 'transform 0.1s',
              outline: 'none',
            }}
            onMouseDown={(e) => (e.currentTarget.style.transform = 'translate(1px, 1px)')}
            onMouseUp={(e) => (e.currentTarget.style.transform = 'translate(0, 0)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translate(0, 0)')}
          >
            <DownOutlined />
          </button>
        </div>
      )}
    </div>
  )
}
