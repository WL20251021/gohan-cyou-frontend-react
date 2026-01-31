import 'virtual:uno.css'
import '@/style/reset.css'
import '@/style/book.css'
import '@/style/book_modal.css'
import { Outlet, useNavigate, useLocation } from 'react-router'
import { Menu, Avatar } from 'antd'
import {
  ShoppingOutlined,
  ShopOutlined,
  AppstoreOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  BookOutlined,
  RiseOutlined,
  TagOutlined,
  AccountBookOutlined,
  HomeOutlined,
  GiftOutlined,
  FallOutlined,
  DatabaseOutlined,
  CalendarOutlined,
} from '@ant-design/icons'
import { useState, useEffect } from 'react'
import { BookProvider, useBook } from '@/context/BookContext'
import { UserProvider, useUser } from '@/context/UserContext'
import { SETTINGS } from '@/settings/settings'
import { getMe } from '@/features/user/api'

// 画像URL生成
function genImageUrl(imageName: string) {
  return `http://${import.meta.env.VITE_HOST}:${import.meta.env.VITE_PORT}/images/${imageName}`
}

export const PAGE_NAMES: { [key: string]: string } = {
  '/': 'ホーム',
  '/budget/summary': '家計記入',
  '/budget/summary/today': '今日の集計',
  '/budget/summary/weekly': '今週の集計',
  '/budget/summary/monthly': '今月の集計',
  '/budget/purchasement': '支出',
  '/budget/consumption': '消費',
  '/budget/inventory': '在庫',
  '/budget/income': '収入',
  '/budget/goods': '商品',
  '/budget/store': '店舗',
  '/budget/category': 'カテゴリ',
  '/budget/brand': 'ブランド',
  '/recipe': 'レシピ',
  '/recipe/cook': '調理',
}

function LayoutInner() {
  const navigate = useNavigate()
  const location = useLocation()
  const [selectedKey, setSelectedKey] = useState('')
  const { isPageFlipped } = useBook()
  const { user } = useUser()
  const nickname = user?.nickname || 'User'
  const avatarUrl = user?.avatar ? genImageUrl(user.avatar) : null

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

  // user is provided by UserProvider

  const menuItems = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: PAGE_NAMES['/'],
    },
    {
      key: 'budgetBook',
      icon: <AccountBookOutlined />,
      label: '家計簿',
      children: [
        {
          key: '/budget/summary',
          icon: <AccountBookOutlined />,
          label: PAGE_NAMES['/budget/summary'],
        },
        {
          key: '/budget/summary/today',
          icon: <CalendarOutlined />,
          label: PAGE_NAMES['/budget/summary/today'],
        },
        {
          key: '/budget/summary/weekly',
          icon: <CalendarOutlined />,
          label: PAGE_NAMES['/budget/summary/weekly'],
        },
        {
          key: '/budget/summary/monthly',
          icon: <CalendarOutlined />,
          label: PAGE_NAMES['/budget/summary/monthly'],
        },
      ],
    },
    {
      key: 'budgetManagement',
      icon: <AccountBookOutlined />,
      label: '家計管理',
      children: [
        {
          key: '/budget/income',
          icon: <RiseOutlined />,
          label: PAGE_NAMES['/budget/income'] + '管理',
        },
        {
          key: '/budget/purchasement',
          icon: <FallOutlined />,
          label: PAGE_NAMES['/budget/purchasement'] + '管理',
        },
        {
          key: '/budget/consumption',
          icon: <ShoppingCartOutlined />,
          label: PAGE_NAMES['/budget/consumption'] + '管理',
        },
        {
          key: '/budget/inventory',
          icon: <DatabaseOutlined />,
          label: PAGE_NAMES['/budget/inventory'] + '管理',
        },
        {
          key: '/budget/goods',
          icon: <GiftOutlined />,
          label: PAGE_NAMES['/budget/goods'] + '管理',
        },
        {
          key: '/budget/store',
          icon: <ShopOutlined />,
          label: PAGE_NAMES['/budget/store'] + '管理',
        },
        {
          key: '/budget/category',
          icon: <AppstoreOutlined />,
          label: PAGE_NAMES['/budget/category'] + '管理',
        },
        {
          key: '/budget/brand',
          icon: <TagOutlined />,
          label: PAGE_NAMES['/budget/brand'] + '管理',
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
          label: PAGE_NAMES['/recipe'] + '管理',
        },
        {
          key: '/recipe/cook',
          icon: <BookOutlined />,
          label: PAGE_NAMES['/recipe/cook'] + '管理',
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
            <div className="book-cover">
              <div className="book-cover-title-box">
                <h1 className="book-cover-title-text">{SETTINGS.name}</h1>
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
            <div
              className="book-logo-text"
              style={{ display: 'flex', alignItems: 'center' }}
            >
              {/* <div style={{ marginRight: 20, position: 'relative' }}>
                <img
                  src="/static/logo.png"
                  alt="Logo"
                  width={80}
                  height={80}
                  style={{
                    position: 'absolute',
                    maxWidth: 'none',
                    right: -10,
                    bottom: -20,
                    transform: 'rotate(-9deg)',
                  }}
                />
              </div> */}
              {SETTINGS.name}
            </div>
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
                src={avatarUrl}
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
                {nickname}
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
      <UserProvider>
        <LayoutInner />
      </UserProvider>
    </BookProvider>
  )
}
