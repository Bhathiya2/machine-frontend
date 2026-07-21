import * as authApi from '@/api/auth/authApi'

class AuthService {
  login(email: string, password: string) {
    return authApi.login(email, password)
  }

  logout() {
    return authApi.logout()
  }

  me() {
    return authApi.fetchMe()
  }
}

export const authService = new AuthService()
export default authService
