import axios from 'axios'

export function getLoginErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return 'Cannot reach API. Start backend with serve.bat and make sure XAMPP MySQL is running.'
    }
    if (error.response.status === 401) {
      return 'Invalid email or password. Run setup.bat in the backend folder, then use superadmin@example.com / password'
    }
    return (error.response.data as { message?: string })?.message ?? 'Login failed'
  }
  return 'Login failed'
}
