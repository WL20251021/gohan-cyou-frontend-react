export const UserRole = {
  Admin: 'Admin',
  User: 'User',
  Guest: 'Guest',
} as const

export type UserRole = (typeof UserRole)[keyof typeof UserRole]

export const JPUserRoles = {
  Admin: '管理者',
  User: 'ユーザー',
  Guest: 'ゲスト',
}

export class UserColumn {
  id: number = 0
  username: string = ''
  email: string = ''
  role: UserRole = UserRole.User
  nickname: string = ''
  avatar: string = ''
  active: boolean = true
  createdAt: Date | string = ''
  updatedAt: Date | string = ''
}

export const JPNames = {
  id: 'ID',
  username: 'ユーザー名',
  email: 'メールアドレス',
  role: 'ロール',
  jpRole: 'ロール',
  nickname: 'ニックネーム',
  avatar: 'アバター',
  active: '有効状態',
  createdAt: '作成日時',
  updatedAt: '更新日時',
}
