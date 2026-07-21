import axiosInstance from '@/libs/axios'

export const permissionApi = {
  list: () => axiosInstance.get('/permissions'),
}

export default permissionApi
