import TopNav from '@/components/navigation/TopNav'
import LeftSidebar from '@/components/navigation/LeftSidebar'
import LayoutWrapper from '@/components/navigation/LayoutWrapper'

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {/* Navigation only for authenticated pages */}
      <TopNav />
      <LeftSidebar />

      {/* Main Content Area - Responsive to sidebar state */}
      <LayoutWrapper>
        {children}
      </LayoutWrapper>
    </>
  )
}
