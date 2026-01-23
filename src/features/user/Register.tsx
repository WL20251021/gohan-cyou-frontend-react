import { useState } from 'react'
import { Form, Input, Button, Card, Typography, Select } from 'antd'
import notification from '../../components/DoodleNotification'
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons'
import { register } from './api'
import { useNavigate } from 'react-router'

const { Title } = Typography

export default function Register() {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleRegister = () => {
    setLoading(true)
    form
      .validateFields()
      .then((values) => {
        return register(values)
      })
      .then((res) => {
        // if (res?.data?.access_token) {
        //   // トークンを保存
        //   window.document.cookie = `jwt=${res.data.access_token}; path=/; max-age=${res.data.max_age}`
        //   notification.success({
        //     title: '登録成功',
        //     description: 'ログインページにリダイレクトします',
        //     placement: 'bottomRight',
        //   })
        //   // ダッシュボードにリダイレクト
        //   navigate('/')
        // } else {
        //   throw new Error('トークンが取得できませんでした')
        // }
        notification.success({
          title: '登録成功',
          description: 'ログインページにリダイレクトします',
          placement: 'bottomRight',
        })
        navigate('/login')
      })
      .catch((error) => {
        console.error(error)
        notification.error({
          title: '登録失敗',
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
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: '#f0f2f5',
      }}
    >
      <Card style={{ width: 400 }}>
        <Title
          level={2}
          style={{ textAlign: 'center', marginBottom: 24 }}
        >
          ユーザー登録
        </Title>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleRegister}
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: 'ユーザー名を入力してください' }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="ユーザー名"
              size="large"
            />
          </Form.Item>
          <Form.Item
            name="email"
            rules={[
              { required: true, message: 'メールアドレスを入力してください' },
              { type: 'email', message: '有効なメールアドレスを入力してください' },
            ]}
          >
            <Input
              prefix={<MailOutlined />}
              placeholder="メールアドレス"
              size="large"
            />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[
              { required: true, message: 'パスワードを入力してください' },
              { min: 6, message: 'パスワードは6文字以上である必要があります' },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="パスワード"
              size="large"
            />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            dependencies={['password']}
            rules={[
              { required: true, message: 'パスワードを再入力してください' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve()
                  }
                  return Promise.reject(new Error('パスワードが一致しません'))
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="パスワード確認"
              size="large"
            />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              size="large"
              loading={loading}
            >
              登録
            </Button>
          </Form.Item>
          <div style={{ textAlign: 'center' }}>
            <a onClick={() => navigate('/login')}>既にアカウントをお持ちですか？ログイン</a>
          </div>
        </Form>
      </Card>
    </div>
  )
}
