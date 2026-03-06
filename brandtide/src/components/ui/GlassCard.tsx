import { clsx } from 'clsx'

export default function GlassCard({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={clsx('bg-white rounded-xl shadow-lg border-2 border-gray-200 p-5', className)}>
      {children}
    </div>
  )
}
