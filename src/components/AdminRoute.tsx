import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useEffect } from 'react'

export const AdminRoute = () => {
  const { session, loading, isAdmin } = useAuth()

  useEffect(() => {
    if (!loading && session && !isAdmin) {
      toast.error('Acesso negado. Área restrita para administradores.')
    }
  }, [loading, session, isAdmin])

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
