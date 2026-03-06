export default function ReviewSnippet({ snippet, meta }: { snippet: string; meta: string }) {
  return (
    <div className="p-4 bg-white border border-gray-200 rounded-xl hover:shadow-card-hover transition-shadow">
      <p className="text-sm text-content leading-relaxed">"{snippet}"</p>
      <p className="text-xs text-content-muted mt-2">{meta}</p>
    </div>
  )
}
