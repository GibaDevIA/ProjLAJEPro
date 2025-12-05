import { Outlet } from 'react-router-dom'
import { DrawingProvider } from '@/context/DrawingContext'
import { Toaster } from '@/components/ui/sonner'
import { TopBar } from '@/components/TopBar'

export default function Layout() {
  // TopBar is rendered here but we also need it in specific pages if the layout varies
  // However, usually Layout wraps everything.
  // Given the context of the app structure, and that Index page might want control over Sidebar and Canvas,
  // we will just provide the context here.
  // The actual UI composition (TopBar, Sidebar, etc) might be done in the Page components or here.
  // Based on the App.tsx, Layout wraps /project.
  // Let's include DrawingProvider here so it's available to all routes under Layout.

  return (
    <DrawingProvider>
      <div className="flex flex-col min-h-screen bg-background">
        {/* We render TopBar here so it persists across project routes */}
        <TopBar />
        <main className="flex-1 flex overflow-hidden">
          <Outlet />
        </main>
      </div>
      <Toaster />
    </DrawingProvider>
  )
}
