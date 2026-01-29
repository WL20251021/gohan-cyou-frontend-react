import { useState, useEffect } from 'react'
import {
  Card,
  Descriptions,
  Avatar,
  Button,
  Form,
  Input,
  Switch,
  Row,
  Col,
  Flex,
  Radio,
} from 'antd'
import notification from '@/components/DoodleNotification'
import BookModal from '@/components/BookModal'
import { UserOutlined, EditOutlined } from '@ant-design/icons'
import { getUser, updateUser, updatePassword } from './api'
import { UserColumn, JPNames, JPUserRoles } from './columns'
import PageHeader from '@/components/PageHeader'

export default function Profile() {
  const [user, setUser] = useState<UserColumn | null>(null)
  const [loading, setLoading] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  const [form] = Form.useForm()
  const [passwordForm] = Form.useForm()

  // ユーザー情報の取得（保存された user_id を利用）
  useEffect(() => {
    fetchUserData()
  }, [])

  const fetchUserData = () => {
    setLoading(true)
    const stored = localStorage.getItem('user_id')
    const userId = stored ? Number(stored) : null

    if (!userId) {
      setLoading(false)
      notification.error({
        title: 'ユーザー情報取得失敗',
        description: 'ログイン情報が見つかりません。再ログインしてください。',
        placement: 'bottomRight',
      })
      return
    }

    getUser(userId)
      .then((res) => {
        setUser(res?.data)
      })
      .catch((error) => {
        console.error(error)
        notification.error({
          title: 'ユーザー情報取得失敗',
          description: error.response?.data?.message || error.message,
          placement: 'bottomRight',
        })
      })
      .finally(() => {
        setLoading(false)
      })
  }

  const handleEdit = () => {
    if (user) {
      form.setFieldsValue(user)
      setIsEditModalOpen(true)
    }
  }

  const handleUpdateUser = () => {
    if (!user) return

    form
      .validateFields()
      .then((values) => {
        return updateUser(user.id, values)
      })
      .then((res) => {
        notification.success({
          title: 'ユーザー情報更新成功',
          placement: 'bottomRight',
        })
        setIsEditModalOpen(false)
        fetchUserData()
      })
      .catch((error) => {
        console.error(error)
        notification.error({
          title: 'ユーザー情報更新失敗',
          description: error.response?.data?.message || error.message,
          placement: 'bottomRight',
        })
      })
  }

  const handleUpdatePassword = () => {
    if (!user) return

    passwordForm
      .validateFields()
      .then((values) => {
        return updatePassword(user.id, { password: values.newPassword })
      })
      .then((res) => {
        notification.success({
          title: 'パスワード変更成功',
          placement: 'bottomRight',
        })
        setIsPasswordModalOpen(false)
        passwordForm.resetFields()
      })
      .catch((error) => {
        console.error(error)
        notification.error({
          title: 'パスワード変更失敗',
          description: error.response?.data?.message || error.message,
          placement: 'bottomRight',
        })
      })
  }

  const infos = Object.entries(JPNames)
    .filter(([key]) => !['avatar', 'id', 'createdAt', 'updatedAt', 'jpRole'].includes(key))
    .map(([key, label]) => {
      let value: React.ReactNode | string = ''
      switch (key) {
        case 'role':
          value = user ? JPUserRoles[user.role] : '-'
          break
        case 'active':
          value = user ? (
            user.active ? (
              <>
                <Radio
                  checked
                  disabled
                />
                有効
              </>
            ) : (
              <>
                <Radio disabled />
                無効
              </>
            )
          ) : (
            '-'
          )
          break
        default:
          value = user ? (user as any)[key] || '-' : '-'
      }

      return {
        label,
        value,
      }
    })

  return (
    <div>
      <PageHeader title="ユーザー情報" />
      <Row
        style={{
          position: 'relative',
          top: -40,
          right: 50,
          zIndex: 100,
          display: 'flex',
          justifyContent: 'end',
          height: 0,
        }}
        justify="start"
      >
        <Button
          icon={<EditOutlined />}
          onClick={handleEdit}
          style={{ marginRight: 8 }}
        >
          編集
        </Button>
        <Button onClick={() => setIsPasswordModalOpen(true)}>パスワード変更</Button>
      </Row>

      {/* ユーザー情報表示 */}
      <div style={{ margin: 48, position: 'relative' }}>
        <Flex
          justify="center"
          align="center"
          gap={16}
        >
          <div
            style={{
              fontSize: 130,
              opacity: 0.05,
              position: 'absolute',
              top: -10,
              color: 'var(--color-ink-black)',
            }}
          >
            {user?.nickname || user?.username}
          </div>
          <Avatar
            size={100}
            icon={<UserOutlined />}
            src={user?.avatar}
            style={{
              backgroundColor: 'var(--color-candy-pink)',
              border: '2px solid var(--color-ink-black)',
              color: '#fff',
              flexShrink: 0,
            }}
          />
        </Flex>

        {user && (
          <div
            style={{
              width: '400px',
              margin: '32px auto',
              lineHeight: 2.5,
            }}
          >
            {infos.map((info) => (
              <Row
                gutter={24}
                align="middle"
              >
                <Col
                  span={12}
                  style={{ color: 'var(--color-ink-black)' }}
                >
                  {info.label}
                </Col>
                <Col
                  span={12}
                  style={{
                    fontSize: 'larger',
                  }}
                >
                  {info.value}
                </Col>
              </Row>
            ))}
          </div>
        )}
      </div>

      {/* ユーザー情報編集モーダル */}
      <BookModal
        title="ユーザー情報編集"
        open={isEditModalOpen}
        onOk={handleUpdateUser}
        onCancel={() => setIsEditModalOpen(false)}
        okText="更新"
        cancelText="キャンセル"
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            name="username"
            label={JPNames.username}
            rules={[{ required: true, message: 'ユーザー名を入力してください' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="email"
            label={JPNames.email}
            rules={[
              { required: true, message: 'メールアドレスを入力してください' },
              { type: 'email', message: '有効なメールアドレスを入力してください' },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="nickname"
            label={JPNames.nickname}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="avatar"
            label={JPNames.avatar}
          >
            <Input placeholder="アバター画像のURL" />
          </Form.Item>
          <Form.Item
            name="active"
            label={JPNames.active}
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Form>
      </BookModal>

      {/* パスワード変更モーダル */}
      <BookModal
        title="パスワード変更"
        open={isPasswordModalOpen}
        onOk={handleUpdatePassword}
        onCancel={() => {
          setIsPasswordModalOpen(false)
          passwordForm.resetFields()
        }}
        okText="変更"
        cancelText="キャンセル"
      >
        <Form
          form={passwordForm}
          layout="vertical"
        >
          <Form.Item
            name="newPassword"
            label="新しいパスワード"
            rules={[
              { required: true, message: '新しいパスワードを入力してください' },
              { min: 6, message: 'パスワードは6文字以上である必要があります' },
            ]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            label="パスワード確認"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: 'パスワードを再入力してください' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve()
                  }
                  return Promise.reject(new Error('パスワードが一致しません'))
                },
              }),
            ]}
          >
            <Input.Password />
          </Form.Item>
        </Form>
      </BookModal>
    </div>
  )
}
