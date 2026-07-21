import axiosInstance, { setAuthToken } from '@/libs/axios'
import type { User } from '@/interfaces/all/user'

export interface LoginResponse {
  token: string
  user: User
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const { data } = await axiosInstance.post<LoginResponse>('/login', { email, password })
  setAuthToken(data.token)
  return data
}

export async function logout(): Promise<void> {
  try {
    await axiosInstance.post('/logout')
  } finally {
    setAuthToken(null)
  }
}

export async function fetchMe(): Promise<User> {
  const { data } = await axiosInstance.get<User>('/user')
  return data
}
