import { Suspense } from "react"
import { ColorCenterDetail } from "@/components/color-center-detail"
import { ColorCenterDetailSkeleton } from "@/components/color-center-detail-skeleton"

export default async function ColorCenterDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  // ColorCenterDetail component handles data fetching with mock fallback
  return (
    <div className="pb-20 lg:pb-0">
      <Suspense fallback={<ColorCenterDetailSkeleton />}>
        <ColorCenterDetail id={id} />
      </Suspense>
    </div>
  )
}
