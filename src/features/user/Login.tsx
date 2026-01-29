import { useState } from 'react'
import { Form, Input, Button, Card, Typography } from 'antd'
import notification from '@/components/DoodleNotification'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { login } from './api'
import { useNavigate } from 'react-router'
import { SETTINGS } from '@/settings/settings'

const { Title } = Typography

export default function Login() {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = () => {
    setLoading(true)
    form
      .validateFields()
      .then((values) => {
        return login(values)
      })
      .then((res) => {
        if (res?.data?.token) {
          // トークンを保存
          window.document.cookie = `jwt=${res.data.token}; path=/;`

          // 可能ならレスポンス／トークンからユーザーIDとユーザー名を抽出して localStorage に保存
          try {
            let userId: any =
              res?.data?.user?.id ?? res?.data?.userId ?? res?.data?.id ?? res?.data?.user_id
            let username: any =
              res?.data?.user?.username ??
              res?.data?.username ??
              res?.data?.userName ??
              res?.data?.name

            if (!userId && res.data.token) {
              const parts = res.data.token.split('.')
              if (parts.length >= 2) {
                const payload = JSON.parse(atob(parts[1]))
                userId = userId ?? payload.id ?? payload.userId ?? payload.sub ?? payload.uid
                username = username ?? payload.username ?? payload.name
              }
            }
          } catch (e) {
            // 上書きは行わない。デコードに失敗しても処理は続行
            console.warn('トークンからユーザー情報を抽出できませんでした', e)
          }

          notification.success({
            title: 'ログイン成功',
            description: 'ダッシュボードにリダイレクトします',
            placement: 'bottomRight',
          })
          // ダッシュボードにリダイレクト
          navigate('/')
        } else {
          throw new Error('トークンが取得できませんでした')
        }
      })
      .catch((error) => {
        console.error(error)
        notification.error({
          title: 'ログイン失敗',
          description: error.response?.data?.message || error.message,
          placement: 'bottomRight',
        })
      })
      .finally(() => {
        setLoading(false)
      })
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'var(--color-bg-primary)',
        backgroundImage: 'linear-gradient(var(--color-line-blue) 1px, transparent 1px)',
        backgroundSize: '100% 2rem',
      }}
    >
      <div
        style={{
          fontSize: 60,
          marginBottom: 40,
          fontWeight: 900,
          color: 'var(--color-primary)',
          fontFamily: 'var(--font-doodle)',
          textShadow: '3px 3px 0px rgba(0,0,0,0.1)',
          letterSpacing: '-0.04em',
          transform: 'rotate(-3deg)',
        }}
      >
        {SETTINGS.name}
      </div>

      <Card
        style={{
          width: 400,
          border: 'var(--border-doodle)',
          boxShadow: 'var(--shadow-floating)',
          borderRadius: 'var(--radius-doodle)',
          background: '#fff',
        }}
      >
        <Title
          level={2}
          style={{
            textAlign: 'center',
            marginBottom: 24,
            fontFamily: 'var(--font-doodle)',
            color: 'var(--color-ink-black)',
          }}
        >
          ログイン
        </Title>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleLogin}
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: 'ユーザー名を入力してください' }]}
          >
            <Input
              prefix={<UserOutlined style={{ color: 'var(--color-primary)' }} />}
              placeholder="ユーザー名"
              size="large"
              style={{
                border: 'var(--border-doodle)',
                borderRadius: '8px',
                background: '#fff',
                fontFamily: 'var(--font-doodle)',
              }}
            />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[{ required: true, message: 'パスワードを入力してください' }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: 'var(--color-primary)' }} />}
              placeholder="パスワード"
              size="large"
              style={{
                border: 'var(--border-doodle)',
                borderRadius: '8px',
                background: '#fff',
                fontFamily: 'var(--font-doodle)',
              }}
            />
          </Form.Item>
          <Form.Item>
            <Button
              htmlType="submit"
              block
              size="large"
              loading={loading}
              style={{
                background: 'var(--color-primary)',
                borderColor: 'var(--color-ink-black)',
                borderWidth: '2px',
                color: '#fff',
                fontSize: '20px',
                fontWeight: 'bold',
                height: '50px',
                boxShadow: 'var(--shadow-button)',
                borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px',
                fontFamily: 'var(--font-doodle)',
              }}
            >
              ログイン
            </Button>
          </Form.Item>
          <div style={{ textAlign: 'center' }}>
            <a
              onClick={() => navigate('/register')}
              style={{
                color: 'var(--color-text-secondary)',
                textDecoration: 'underline',
                fontFamily: 'var(--font-doodle)',
                fontSize: '16px',
              }}
            >
              アカウント登録
            </a>
          </div>
        </Form>
      </Card>
    </div>
  )
}
