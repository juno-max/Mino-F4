import TopNav from '@/components/navigation/TopNav'
import LeftSidebar from '@/components/navigation/LeftSidebar'
import LayoutWrapper from '@/components/navigation/LayoutWrapper'
import { GlobalCSVDropZone } from '@/components/GlobalCSVDropZone'

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <GlobalCSVDropZone>
      {/* Navigation only for authenticated pages */}
      <TopNav />
      <LeftSidebar />

      {/* Main Content Area - Responsive to sidebar state */}
      <LayoutWrapper>
        {children}
      </LayoutWrapper>
    </GlobalCSVDropZone>
  )
}
