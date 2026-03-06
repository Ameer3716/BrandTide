export default function TopicChip({ label, count, active, onClick }: { label: string; count: number; active?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${active
          ? 'bg-accent text-white border-accent'
          : 'bg-white text-content border-gray-200 hover:border-accent hover:text-accent'
        }`}
    >
      {label} <span className={active ? 'text-white/70' : 'text-content-muted'}>({count})</span>
    </button>
  )
}
