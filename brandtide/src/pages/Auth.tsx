import GlassCard from '@/components/ui/GlassCard'
import { useAuth } from '@/state/auth'

export default function Auth(){
  const { signInWithGoogle } = useAuth()
  return (
    <GlassCard className="max-w-md mx-auto">
      <h3 className="font-semibold mb-2 gradient-text gradient-glow">Sign in</h3>
      <p className="text-sm text-white/70 mb-3">OAuth (Google) placeholder — connects to your profile & activity history.</p>
      <button className="btn-primary" onClick={()=>signInWithGoogle()}>Continue with Google (mock)</button>
    </GlassCard>
  )
}
