import { Outlet } from 'react-router-dom'
import { TopBar } from '@/components/TopBar'
import { Sidebar } from '@/components/Sidebar'

const Layout = () => {
  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-background">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 relative overflow-hidden bg-slate-50/50">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default Layout
