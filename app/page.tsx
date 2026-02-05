import { Suspense } from "react"
import { DashboardContent } from "@/components/dashboard-content"
import { DashboardSkeleton } from "@/components/dashboard-skeleton"

export default function DashboardPage() {
  return (
    <div className="pb-20 lg:pb-0">
      <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground tracking-tight">Dashboard</h1>
          <p className="text-sm lg:text-base text-muted-foreground mt-1.5">Vista general de todos los Color Centers</p>
        </div>

        <Suspense fallback={<DashboardSkeleton />}>
          <DashboardContent />
        </Suspense>
      </div>
    </div>
  )
}
