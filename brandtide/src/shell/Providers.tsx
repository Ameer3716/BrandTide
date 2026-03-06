import { AuthProvider } from '@/state/auth'

export default function Providers({ children }:{children: React.ReactNode}){
  return <AuthProvider>{children}</AuthProvider>
}
