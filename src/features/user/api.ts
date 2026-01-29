import request from '@/utils/request'
import { UserColumn } from './columns'
import { type FileType } from '@/utils/file'

// ログイン
export function login(data: { username: string; password: string }) {
  return request({
    url: '/auth/login',
    method: 'post',
    data,
  })
}

// ユーザー登録
export function register(data: Partial<UserColumn> & { password: string }) {
  return request({
    url: '/auth/register',
    method: 'post',
    data,
  })
}

// ユーザー一覧取得
export function getUsers() {
  return request({
    url: '/users',
    method: 'get',
  })
}

// ユーザー情報取得
export function getUser(id: number) {
  return request({
    url: `/users/${id}`,
    method: 'get',
  })
}

// 自分のユーザー情報取得
export function getMe() {
  return request({
    url: `/users/me`,
    method: 'get',
  })
}

// ユーザー情報更新
export function updateUser(id: number, data: Partial<UserColumn>) {
  return request({
    url: `/users/${id}`,
    method: 'put',
    data,
  })
}

// ユーザー削除
export function deleteUser(ids: number[]) {
  return request({
    url: `/users`,
    method: 'delete',
    data: ids,
  })
}

// パスワード変更
export function updatePassword(userId: number, data: { password: string }) {
  return request({
    url: `/users/password`,
    method: 'put',
    data: { id: userId, newPassword: data.password },
  })
}

// アバターアップロード
export function uploadAvatar(file: FileType) {
  const formData = new FormData()
  formData.append('file', file)
  return request({
    url: '/uploader/image',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}
