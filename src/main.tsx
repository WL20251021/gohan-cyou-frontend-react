import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'
import { ConfigProvider } from 'antd'
import router from './router'

import '@unocss/reset/normalize.css'
import './style/index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#3498db',
          fontFamily: "'Patrick Hand', 'Yomogi', cursive, sans-serif",
          colorBgBase: '#fffdf0',
          colorTextBase: '#2c3e50',
          colorBorder: '#2c3e50',
          borderRadius: 6 /* We override this with wiggle in CSS usually, but this is base */,
          fontSize: 16,
        },
        components: {
          Button: {
            defaultBorderColor: '#2c3e50',
            defaultColor: '#2c3e50',
            colorPrimary: '#3498db',
            primaryColor: '#fff',
            fontWeight: 700,
            borderRadius: 8,
          },
          Card: {
            headerFontSize: 20,
            boxShadowTertiary: '3px 3px 0px rgba(44, 62, 80, 0.1)',
          },
          Menu: {
            itemSelectedColor: '#3498db',
            itemHoverColor: '#3498db',
            horizontalItemSelectedColor: '#3498db',
            fontSize: 16,
          },
          Input: {
            activeBorderColor: '#3498db',
            hoverBorderColor: '#3498db',
          },
          Typography: {
            fontFamily: "'Patrick Hand', 'Yomogi', cursive, sans-serif",
          },
        },
      }}
    >
      <RouterProvider router={router} />
    </ConfigProvider>
  </StrictMode>
)
