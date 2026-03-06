import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import { useState } from 'react'
import DataTable from './DataTable'
import { Upload, CheckCircle, AlertCircle, Play, FileSpreadsheet } from 'lucide-react'

type Row = Record<string, any>

const ACCEPTED_EXTENSIONS = '.csv,.tsv,.xlsx,.xls,.json,.txt'
const FORMAT_LABELS = 'CSV, Excel (.xlsx/.xls), TSV, JSON, TXT'

/** Convert any supported file into Row[] with headers */
function parseFile(file: File): Promise<Row[]> {
  const ext = file.name.split('.').pop()?.toLowerCase() || ''

  // Excel formats
  if (ext === 'xlsx' || ext === 'xls') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer)
          const workbook = XLSX.read(data, { type: 'array' })
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
          const rows = XLSX.utils.sheet_to_json<Row>(firstSheet, { defval: '' })
          resolve(rows.filter(r => Object.values(r).some(v => v !== '')).slice(0, 500))
        } catch {
          reject(new Error('Failed to parse Excel file. Make sure it is a valid .xlsx or .xls file.'))
        }
      }
      reader.onerror = () => reject(new Error('Could not read file'))
      reader.readAsArrayBuffer(file)
    })
  }

  // JSON
  if (ext === 'json') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const parsed = JSON.parse(e.target?.result as string)
          const arr: Row[] = Array.isArray(parsed) ? parsed : [parsed]
          resolve(arr.filter(Boolean).slice(0, 500))
        } catch {
          reject(new Error('Failed to parse JSON file. Make sure it contains a valid JSON array of objects.'))
        }
      }
      reader.onerror = () => reject(new Error('Could not read file'))
      reader.readAsText(file)
    })
  }

  // CSV, TSV, TXT — all parsed by PapaParse (auto-detects delimiter)
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        if (res.errors.length && !res.data.length) {
          reject(new Error('Failed to parse file: ' + res.errors[0]?.message))
          return
        }
        const data = (res.data as Row[]).filter(r => r && Object.values(r).some(v => v !== '')).slice(0, 500)
        resolve(data)
      },
      error: (err: any) => reject(new Error('Parse error: ' + err.message)),
    })
  })
}

export default function UploaderStepper({ onDone }: { onDone: (rows: Row[]) => void }) {
  const [step, setStep] = useState(0)
  const [rows, setRows] = useState<Row[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const [warnings, setWarnings] = useState<string[]>([])
  const [fileName, setFileName] = useState('')
  const [parseError, setParseError] = useState('')

  function validateAndNext(data: Row[]) {
    const errs: string[] = []
    const warns: string[] = []

    if (!data.length || !data[0]) {
      errs.push('File is empty or could not be parsed.')
      setErrors(errs)
      setWarnings([])
      setStep(2)
      return
    }

    const cols = Object.keys(data[0])

    // Must have a text column (accept: text, review_text, review, comment)
    const textCol = cols.find(c => ['text', 'review_text', 'review', 'comment'].includes(c.toLowerCase().trim()))
    if (!textCol) {
      errs.push('Missing a text column. File must have one of: text, review_text, review, or comment')
    }

    // Optional but nice-to-have columns
    const hasBrand = cols.some(c => c.toLowerCase().trim() === 'brand')
    const hasProduct = cols.some(c => ['product_id', 'product_name', 'product'].includes(c.toLowerCase().trim()))
    if (!hasBrand) warns.push('No "brand" column found — classification will still work')
    if (!hasProduct) warns.push('No "product_id" or "product_name" column found — classification will still work')

    // Check that text column isn't all empty
    if (textCol) {
      const nonEmpty = data.filter(r => {
        const val = r[textCol]
        return val && String(val).trim().length > 0
      })
      if (nonEmpty.length === 0) {
        errs.push(`The "${textCol}" column is empty in all rows`)
      }
    }

    setErrors(errs)
    setWarnings(warns)
    setStep(2) // Always move to step 2 to show errors or success
  }

  async function handleFile(file: File) {
    setParseError('')
    setFileName(file.name)
    try {
      const data = await parseFile(file)
      setRows(data)
      setStep(1)
    } catch (err: any) {
      setParseError(err.message || 'Failed to parse file')
    }
  }

  return (
    <div className="space-y-4">
      {/* Stepper indicator */}
      <div className="flex items-center gap-2 mb-6">
        {[1, 2, 3].map((n) => (
          <div key={n} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= n - 1 ? 'bg-accent text-white' : 'bg-gray-100 text-content-muted'
              }`}>
              {step > n - 1 ? <CheckCircle size={16} /> : n}
            </div>
            {n < 3 && <div className={`w-12 h-0.5 ${step >= n ? 'bg-accent' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>

      {step === 0 && (
        <div className="space-y-4">
          <label className="block w-full border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-accent hover:bg-accent/5 transition-all">
            <FileSpreadsheet size={32} className="mx-auto text-content-muted mb-3" />
            <span className="text-sm font-medium text-content">Click to upload file</span>
            <span className="block text-xs text-content-muted mt-1">Supports {FORMAT_LABELS}</span>
            <input
              type="file"
              accept={ACCEPTED_EXTENSIONS}
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]; if (!f) return
                handleFile(f)
              }}
            />
          </label>
          {parseError && (
            <div className="p-3 border border-red-200 rounded-xl bg-red-50 flex items-start gap-2">
              <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600">{parseError}</p>
            </div>
          )}
          <p className="text-sm text-content-muted">
            Required column: <code className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">text</code> (or <code className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">review_text</code>).
            Optional: <code className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">brand</code>, <code className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">product_name</code>
          </p>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-content-muted">
            <FileSpreadsheet size={14} />
            <span className="font-medium">{fileName}</span>
            <span>— {rows.length} rows loaded</span>
          </div>
          <p className="text-sm font-medium text-content">Preview (first 50 rows):</p>
          <DataTable columns={Object.keys(rows[0] || {}).slice(0, 6).map(k => ({ key: k as any, label: k }))} records={rows.slice(0, 50) as any} />
          <div className="flex gap-3">
            <button className="btn-primary flex items-center gap-2" onClick={() => validateAndNext(rows)}>
              <CheckCircle size={16} />
              Validate
            </button>
            <button className="btn-secondary" onClick={() => { setStep(0); setRows([]); setErrors([]); setWarnings([]); setParseError(''); }}>Back</button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          {errors.length > 0 ? (
            <>
              <div className="p-4 border border-red-200 rounded-xl bg-red-50">
                <div className="flex items-start gap-3">
                  <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-700 mb-1">Validation Errors</p>
                    <ul className="list-disc ml-5 text-sm text-red-600">
                      {errors.map((e, i) => (<li key={i}>{e}</li>))}
                    </ul>
                  </div>
                </div>
              </div>
              <button className="btn-secondary" onClick={() => { setStep(0); setRows([]); setErrors([]); setWarnings([]); }}>
                Upload a different file
              </button>
            </>
          ) : (
            <>
              {warnings.length > 0 && (
                <div className="p-3 border border-yellow-200 rounded-xl bg-yellow-50">
                  <ul className="text-xs text-yellow-700 space-y-1">
                    {warnings.map((w, i) => (<li key={i}>ℹ️ {w}</li>))}
                  </ul>
                </div>
              )}
              <div className="p-4 border border-accent-100 rounded-xl bg-accent-50">
                <div className="flex items-center gap-3">
                  <CheckCircle size={20} className="text-accent" />
                  <div>
                    <p className="font-medium text-accent-700">Validation Passed — {rows.length} reviews ready</p>
                    <p className="text-sm text-accent-600">Click below to run sentiment classification using XLM-RoBERTa</p>
                  </div>
                </div>
                <button
                  className="btn-primary flex items-center gap-2 mt-4"
                  onClick={() => { onDone(rows); }}
                >
                  <Play size={16} />
                  Run Classification
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
