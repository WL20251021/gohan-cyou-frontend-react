import { useState, useEffect } from 'react'
import { Card, Descriptions, Avatar, Button, Form, Input, Switch } from 'antd'
import notification from '../../components/DoodleNotification'
import BookModal from '../../components/BookModal'
import { UserOutlined, EditOutlined } from '@ant-design/icons'
import { getUser, updateUser, updatePassword } from './api'
import { UserColumn, JPNames, JPUserRoles } from './columns'

export default function Profile() {
  const [user, setUser] = useState<UserColumn | null>(null)
  const [loading, setLoading] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  const [form] = Form.useForm()
  const [passwordForm] = Form.useForm()

  // ユーザー情報の取得（仮のユーザーID=1）
  useEffect(() => {
    fetchUserData()
  }, [])

  const fetchUserData = () => {
    setLoading(true)
    // TODO: 実際のユーザーIDをトークンから取得
    const userId = 1
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

  return (
    <div style={{ padding: 24 }}>
      <Card
        title="ユーザー情報"
        loading={loading}
        extra={
          <>
            <Button
              icon={<EditOutlined />}
              onClick={handleEdit}
              style={{ marginRight: 8 }}
            >
              編集
            </Button>
            <Button onClick={() => setIsPasswordModalOpen(true)}>パスワード変更</Button>
          </>
        }
      >
        {user && (
          <>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <Avatar
                size={100}
                icon={<UserOutlined />}
                src={user.avatar}
              />
            </div>
            <Descriptions
              bordered
              column={1}
            >
              <Descriptions.Item label={JPNames.username}>{user.username}</Descriptions.Item>
              <Descriptions.Item label={JPNames.email}>{user.email}</Descriptions.Item>
              <Descriptions.Item label={JPNames.role}>
                {JPUserRoles[user.role as keyof typeof JPUserRoles]}
              </Descriptions.Item>
              <Descriptions.Item label={JPNames.nickname}>{user.nickname || '-'}</Descriptions.Item>
              <Descriptions.Item label={JPNames.isActive}>
                {user.isActive ? '有効' : '無効'}
              </Descriptions.Item>
            </Descriptions>
          </>
        )}
      </Card>

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
            name="isActive"
            label={JPNames.isActive}
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
