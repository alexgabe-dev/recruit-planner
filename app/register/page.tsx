import { Suspense } from "react"
import { Loader2 } from "lucide-react"
import RegisterForm from "./register-form"

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <RegisterForm />
    </Suspense>
  )
}
