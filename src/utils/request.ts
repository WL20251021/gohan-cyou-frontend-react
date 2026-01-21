import axios from 'axios'

const service = axios.create({
  baseURL: 'http://localhost:3000',
  timeout: 50000,
  headers: {
    'Content-Type': 'application/json;charset=utf-8',
    post: {
      'Access-Control-Allow-Origin': '*',
    },
  },
})

// 请求拦截器
service.interceptors.request.use(
  (config) => {
    // 在请求发送之前做一些处理，例如添加 token 等
    const token = document.cookie
      .split('; ')
      .find((row) => row.startsWith('jwt='))
      ?.split('=')[1]
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    } else if (config.url !== 'auth/login' && config.url !== 'auth/register') {
      Promise.reject(new Error('No token found'))
      window.location.href = '/login'
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  (response) => {
    // 在响应数据返回之前做一些处理

    return response
  },
  (error) => {
    console.error('response error:', error)
    if (error.code === 'ERR_NETWORK') error.message = 'ネットワークに接続できません'

    if (error.response.status === 401 || error.response.status === 403) {
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)
export default service
