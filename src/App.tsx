import { Toaster } from '@/components/ui/sonner'
import { AuthProvider } from '@/context'
import AppRoutes from '@/route'

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
      <Toaster />
    </AuthProvider>
  )
}
