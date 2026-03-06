export default function DataTable<T>({ columns, records }: { columns: { key: keyof T; label: string }[]; records: T[] }) {
  return (
    <div className="overflow-auto rounded-xl border-2 border-gray-200 bg-white shadow-lg">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            {columns.map(c => (
              <th key={String(c.key)} className="text-left px-4 py-3 font-semibold text-content-muted text-xs uppercase tracking-wide">
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {records.map((r, i) => (
            <tr key={i} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
              {columns.map(c => (
                <td key={String(c.key)} className="px-4 py-3 text-content whitespace-nowrap">
                  {String(r[c.key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
