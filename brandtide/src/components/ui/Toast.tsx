import { create } from 'zustand'
import { useEffect } from 'react'
import { X, CheckCircle } from 'lucide-react'

type Toast = { id: string; message: string }
type Store = {
  list: Toast[]
  push: (m: string) => void
  remove: (id: string) => void
}
export const useToastStore = create<Store>((set) => ({
  list: [],
  push: (m) => set(s => ({ list: [...s.list, { id: Math.random().toString(36).slice(2), message: m }] })),
  remove: (id) => set(s => ({ list: s.list.filter(x => x.id !== id) }))
}))

export function Toasts() {
  const { list, remove } = useToastStore()
  useEffect(() => {
    const timers = list.map(t => setTimeout(() => remove(t.id), 3000))
    return () => { timers.forEach(clearTimeout) }
  }, [list])
  return (
    <div className="fixed bottom-4 right-4 space-y-2 z-50">
      {list.map(t => (
        <div
          key={t.id}
          className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white border border-gray-200 shadow-elevated text-content text-sm"
        >
          <CheckCircle size={18} className="text-accent flex-shrink-0" />
          <span className="flex-1">{t.message}</span>
          <button onClick={() => remove(t.id)} className="p-1 hover:bg-gray-100 rounded-lg transition">
            <X size={14} className="text-content-muted" />
          </button>
        </div>
      ))}
    </div>
  )
}
