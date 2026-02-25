"use client"

export function EquipoFotoImage({
  src,
  alt,
  className = "w-full h-full object-cover",
}: {
  src: string
  alt: string
  className?: string
}) {
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={(e) => {
        (e.target as HTMLImageElement).style.display = "none"
      }}
    />
  )
}
