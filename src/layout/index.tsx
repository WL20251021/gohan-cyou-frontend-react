import 'virtual:uno.css'
import '@/style/reset.css'
import '@/style/book.css'
import '@/style/book_modal.css'
import { Outlet, useNavigate, useLocation } from 'react-router'
import { Menu, Avatar, Dropdown, Flex } from 'antd'
import {
  ShoppingOutlined,
  ShopOutlined,
  AppstoreOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  LogoutOutlined,
  BookOutlined,
  RiseOutlined,
  TagOutlined,
} from '@ant-design/icons'
import { useState, useEffect } from 'react'
import { BookProvider, useBook } from '@/context/BookContext'

function LayoutInner() {
  const navigate = useNavigate()
  const location = useLocation()
  const [selectedKey, setSelectedKey] = useState('')
  const { isPageFlipped } = useBook()

  // Intro Animation State
  const [splashVisible, setSplashVisible] = useState(true)
  const [isOpening, setIsOpening] = useState(false)

  const handleOpenBook = () => {
    setIsOpening(true)
    setTimeout(() => {
      setSplashVisible(false)
    }, 800)
  }

  useEffect(() => {
    setSelectedKey(location.pathname)

    // Auto-expand the correct menu based on URL (Accordion behavior)
    if (location.pathname.startsWith('/budget/summary')) {
      setOpenKeys(['budgetBook'])
    } else if (location.pathname.startsWith('/budget')) {
      setOpenKeys(['budgetManagement'])
    } else if (location.pathname.startsWith('/recipe')) {
      setOpenKeys(['recipe'])
    }
  }, [location.pathname])

  const menuItems = [
    {
      key: '/',
      icon: <BookOutlined />,
      label: 'ホーム',
    },
    {
      key: 'budgetBook',
      icon: <ShoppingOutlined />,
      label: '家計簿',
      children: [
        {
          key: '/budget/summary',
          icon: <ShoppingOutlined />,
          label: '集計',
        },
        {
          key: '/budget/summary/daily',
          icon: <ShoppingOutlined />,
          label: '家計記入',
        },
        {
          key: '/budget/summary/today',
          icon: <ShoppingOutlined />,
          label: '今日の集計',
        },
        {
          key: '/budget/summary/weekly',
          icon: <ShoppingOutlined />,
          label: '今週の集計',
        },
        {
          key: '/budget/summary/monthly',
          icon: <ShoppingOutlined />,
          label: '今月の集計',
        },
      ],
    },
    {
      key: 'budgetManagement',
      icon: <ShoppingOutlined />,
      label: '家計管理',
      children: [
        {
          key: '/budget/consumption',
          icon: <ShoppingOutlined />,
          label: '使用記録',
        },
        {
          key: '/budget/purchasement',
          icon: <ShoppingCartOutlined />,
          label: '買い物記録',
        },
        {
          key: '/budget/inventory',
          icon: <ShoppingOutlined />,
          label: '在庫管理',
        },
        {
          key: '/budget/income',
          icon: <RiseOutlined />,
          label: '収入管理',
        },
        {
          key: '/budget/goods',
          icon: <AppstoreOutlined />,
          label: '商品',
        },
        {
          key: '/budget/store',
          icon: <ShopOutlined />,
          label: '店舗',
        },
        {
          key: '/budget/category',
          icon: <AppstoreOutlined />,
          label: 'カテゴリ',
        },
        {
          key: '/budget/brand',
          icon: <TagOutlined />,
          label: 'ブランド',
        },
      ],
    },
    {
      key: 'recipe',
      icon: <BookOutlined />,
      label: 'レシピ',
      children: [
        {
          key: '/recipe',
          icon: <BookOutlined />,
          label: 'レシピ管理',
        },
      ],
    },
  ]

  const rootSubmenuKeys = ['budgetBook', 'budgetManagement', 'recipe']
  const [openKeys, setOpenKeys] = useState(['budgetBook'])

  const onOpenChange = (keys: string[]) => {
    const latestOpenKey = keys.find((key) => openKeys.indexOf(key) === -1)
    if (latestOpenKey && rootSubmenuKeys.indexOf(latestOpenKey) === -1) {
      setOpenKeys(keys)
    } else {
      setOpenKeys(latestOpenKey ? [latestOpenKey] : [])
    }
  }

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key)
  }

  return (
    <div className="book-desk">
      {/* === SPLASH SCREEN / CLOSED BOOK === */}
      {splashVisible && (
        <div className={`book-closed-wrapper ${isOpening ? 'fade-out' : ''}`}>
          <div
            className={`book-closed ${isOpening ? 'is-opening' : ''}`}
            onClick={handleOpenBook}
          >
            <div className="book-spine"></div>
            {/* <div className="book-thickness"></div> */}
            <div className="book-cover">
              <div className="book-cover-title-box">
                <h1 className="book-cover-title-text">食費ナビ</h1>
              </div>
              <div className="book-cover-subtitle">PI11B911-06 オウリナ</div>
            </div>
          </div>
        </div>
      )}

      {/* === MAIN LAYOUT / OPEN BOOK === */}
      <div
        className={`book-container ${!splashVisible ? 'open-animation' : ''}`}
        style={{ opacity: splashVisible ? 0 : undefined }}
      >
        {/* Middle Spine Decoration */}
        <div className="book-spine-divider" />

        {/* Bookmark Decoration */}
        <div className="book-bookmark" />

        {/* === Left Page: Navigation === */}
        <div className="book-page-left">
          {/* Logo */}
          <div
            className="book-logo-container"
            onClick={() => navigate('/')}
            style={{ cursor: 'pointer' }}
          >
            <div className="book-logo-text">食費ナビ</div>
          </div>

          {/* Menu */}
          <div className="book-menu">
            <Menu
              mode="inline"
              selectedKeys={[selectedKey]}
              openKeys={openKeys}
              onOpenChange={onOpenChange}
              items={menuItems}
              onClick={handleMenuClick}
            />
          </div>

          {/* User Profile */}
          <div className="book-user-profile">
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              onClick={() => navigate('/profile')}
            >
              <Avatar
                icon={<UserOutlined />}
                style={{
                  backgroundColor: 'var(--color-candy-pink)',
                  border: '2px solid var(--color-ink-black)',
                  color: '#fff',
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontWeight: 'bold',
                  fontSize: '1.1rem',
                  color: 'var(--color-ink-black)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                User
              </span>
            </div>
            <div
              className="i-uil:sign-out-alt text-xl"
              style={{ fontSize: '26px', marginTop: '3px' }}
              onClick={() => {
                localStorage.removeItem('access_token')
                navigate('/login')
              }}
            ></div>
          </div>
        </div>

        {/* === Right Page: Content === */}
        {/* REPLACED WITH 3D FLIPPER STRUCTURE */}
        <div className="book-page-right-wrapper">
          {/* The Flipper: Contains the Main Content (Front) and Back of Page */}
          <div className={`book-flipper ${isPageFlipped ? 'flipped' : ''}`}>
            <div className="book-page-front">
              <Outlet />
            </div>
            <div className="book-page-back">
              <div id="book-modal-left-target"></div>
            </div>
          </div>

          {/* The Modal Layer: Revealed when flipper turns */}
          <div className="book-page-modal-layer">
            {/* Old tab root removed */}
            <div
              id="book-modal-root"
              className="book-modal-content"
            ></div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Layout() {
  return (
    <BookProvider>
      <LayoutInner />
    </BookProvider>
  )
}
