import { Suspense } from "react"
import { ReportesContent } from "@/components/reportes-content"
import { ReportesSkeleton } from "@/components/reportes-skeleton"

export default function ReportesPage() {
  return (
    <div className="pb-20 lg:pb-0">
      <Suspense fallback={<ReportesSkeleton />}>
        <ReportesContent />
      </Suspense>
    </div>
  )
}
