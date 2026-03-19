import { LoadingMessage } from "@/components/loading-message"

export default function PublicLoading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <LoadingMessage message="Cargando inicio de sesión…" className="mb-6" />
    </div>
  )
}

