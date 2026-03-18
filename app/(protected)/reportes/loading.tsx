import { LoadingMessage } from "@/components/loading-message"

export default function ReportesLoading() {
  return (
    <div className="pb-20 lg:pb-0">
      <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-7xl mx-auto">
        <LoadingMessage message="Cargando…" className="mb-6" />
      </div>
    </div>
  )
}
