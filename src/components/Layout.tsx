import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from '@/components/Sidebar'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { DrawingProvider } from '@/context/DrawingContext'

export default function Layout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <DrawingProvider>
      <div className="flex h-screen w-full overflow-hidden bg-background">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-[250px] h-full border-r z-10">
          <Sidebar />
        </aside>

        {/* Mobile Header & Drawer */}
        <div className="lg:hidden fixed top-0 left-0 right-0 h-14 border-b bg-white z-20 flex items-center px-4 justify-between">
          <div className="flex items-center gap-2">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-[80%] max-w-[300px]">
                <Sidebar />
              </SheetContent>
            </Sheet>
            <h1 className="font-semibold text-lg">Desenho CAD</h1>
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 h-full relative pt-14 lg:pt-0">
          <Outlet />
        </main>
      </div>
    </DrawingProvider>
  )
}
