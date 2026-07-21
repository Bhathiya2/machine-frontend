import { Navigate } from 'react-router'
import { useAuthContext } from '@/context'
import { Skeleton } from '@/components/ui/skeleton'

export default function GuestRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuthContext()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Skeleton className="h-10 w-48" />
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}
