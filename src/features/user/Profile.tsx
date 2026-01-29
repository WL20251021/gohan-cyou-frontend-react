import { useState, useEffect } from 'react'
import { useUser } from '@/context/UserContext'
import {
  Avatar,
  Button,
  Form,
  Input,
  Row,
  Col,
  Flex,
  Radio,
  Upload,
  message,
  Space,
  Image,
} from 'antd'
import notification from '@/components/DoodleNotification'
import BookModal from '@/components/BookModal'
import { UserOutlined, EditOutlined } from '@ant-design/icons'
import { updateUser, updatePassword } from './api'
import { JPNames, JPUserRoles } from './columns'
import PageHeader from '@/components/PageHeader'
import { type FileType } from '@/utils/file'
import type { UploadFile } from 'antd'
import { uploadAvatar } from './api'
import ImgCrop from 'antd-img-crop'

export default function Profile() {
  const { user, setUser, refreshUser } = useUser()
  const [loading, setLoading] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  const [form] = Form.useForm()
  const [passwordForm] = Form.useForm()

  const [fileList, setFileList] = useState<any[]>([])
  const [previewImage, setPreviewImage] = useState('')
  const [previewOpen, setPreviewOpen] = useState(false)

  // 画像URL生成
  function genImageUrl(imageName: string) {
    return `http://${import.meta.env.VITE_HOST}:${import.meta.env.VITE_PORT}/images/${imageName}`
  }

  // ファイルアップロードの設定
  const uploadProps = {
    fileList,
    action: '',
    pastable: true,
    listType: 'picture-circle' as const,
    accept: 'image/*',
    beforeUpload: (file: FileType) => {
      const isLt1M = file.size / 1024 / 1024 < 1
      if (!isLt1M) {
        message.error('1MB以下の画像をアップロードしてください')
        setFileList([])
        return Upload.LIST_IGNORE
      }
      return true
    },
    onPreview: async (file: UploadFile) => {
      setPreviewImage(genImageUrl(file.response.fileName as string))
      setPreviewOpen(true)
    },
    onChange({ fileList: newFileList }: { fileList: UploadFile[] }) {
      setFileList(newFileList)
    },
    customRequest: (options: any) => {
      return uploadAvatar(options.file)
        .then((res) => {
          options.onSuccess && options.onSuccess(res.data)
        })
        .catch(() => {
          options.onError && options.onError(new Error('アップロード失敗'))
        })
    },
    onRemove: (file: UploadFile) => {
      setFileList((prevList) => prevList.filter((item) => item.uid !== file.uid))
    },
    maxCount: 1,
  }

  // ユーザー情報は UserContext 経由で提供される
  useEffect(() => {
    // ensure loading state while refreshing user
    setLoading(true)
    refreshUser()
      .catch((error) => {
        console.error(error)
      })
      .finally(() => setLoading(false))
  }, [])

  const handleEdit = () => {
    if (user) {
      form.setFieldsValue(user)

      if (user.avatar) {
        setFileList([
          {
            uid: `user_avatar_${user.id}`,
            name: `user_avatar_${user.id}`,
            status: 'done',
            url: genImageUrl(user.avatar),
            response: { fileName: user.avatar },
          },
        ])
      } else {
        setFileList([])
      }
      setIsEditModalOpen(true)
    }
  }

  const handleUpdateUser = () => {
    if (!user) return

    form
      .validateFields()
      .then((values) => {
        values.avatar = fileList[0]?.response?.fileName || null
        return updateUser(user.id, values)
      })
      .then(() => {
        notification.success({
          title: 'ユーザー情報更新成功',
          placement: 'bottomRight',
        })
        setIsEditModalOpen(false)
        // refresh global user after successful update
        refreshUser()
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
          value = user ? JPUserRoles[user.role as keyof typeof JPUserRoles] : '-'
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
            src={user?.avatar ? genImageUrl(user.avatar) : undefined}
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
          style={{
            margin: '48px auto',
            maxWidth: 600,
          }}
        >
          <Form.Item
            label={JPNames.avatar}
            name="avatar"
            rules={[]}
            style={{ height: 150 }}
          >
            <Space direction="vertical">
              <ImgCrop
                rotationSlider
                modalTitle="画像を編集"
                modalCancel="キャンセル"
                modalOk="完了"
                fillColor="#000"
              >
                <Upload {...uploadProps}>
                  {fileList.length >= 1 ? null : (
                    <button
                      style={{ border: 0, background: 'none' }}
                      type="button"
                    >
                      <i
                        className="i-material-symbols:add"
                        style={{ fontSize: 32 }}
                      ></i>
                      <div style={{ marginTop: 8 }}>Upload</div>
                    </button>
                  )}
                </Upload>
              </ImgCrop>
              {previewImage && (
                <Image
                  styles={{ root: { display: 'none' } }}
                  preview={{
                    open: previewOpen,
                    onOpenChange: (visible) => setPreviewOpen(visible),
                    afterOpenChange: (visible) => !visible && setPreviewImage(''),
                  }}
                  src={previewImage}
                  alt={JPNames.avatar}
                />
              )}
            </Space>
          </Form.Item>

          <Form.Item
            name="username"
            label={JPNames.username}
            rules={[{ required: true, message: 'ユーザー名を入力してください' }]}
          >
            <Input disabled />
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
            name="active"
            label={JPNames.active}
          >
            <Radio.Group>
              <Radio value={true}>有効</Radio>
              <Radio value={false}>無効</Radio>
            </Radio.Group>
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
