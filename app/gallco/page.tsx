import { redirect } from "next/navigation"

/** Redirige a la vista solo Gallco (dashboard con ?e=emp-2, una sola base). */
export default function GallcoPage() {
  redirect("/?e=emp-2")
}
