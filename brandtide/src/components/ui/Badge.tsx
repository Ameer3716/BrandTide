export default function Badge({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">{children}</span>
}
