import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function ReportesSkeleton() {
  return (
    <div className="px-4 py-6 lg:px-6 lg:py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <Skeleton className="h-8 w-48 lg:w-64 mb-2" />
          <Skeleton className="h-4 w-32 lg:w-48" />
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Skeleton className="h-10 w-full sm:w-[160px]" />
          <Skeleton className="h-10 w-full sm:w-[160px]" />
          <Skeleton className="h-10 w-full sm:w-[160px]" />
          <Skeleton className="h-10 w-full sm:w-32 sm:ml-auto" />
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2 lg:pb-3">
              <Skeleton className="h-3 w-24 mb-2" />
              <Skeleton className="h-8 w-16" />
            </CardHeader>
            <CardContent className="pb-3 lg:pb-4">
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-40 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[250px] w-full" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabla */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-48 mb-2" />
          <Skeleton className="h-3 w-40" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
