export function saveReportMeta(meta:any){
  const key = 'bt:reports'
  const arr = JSON.parse(localStorage.getItem(key)||'[]')
  arr.push({ id: 'r_'+Math.random().toString(36).slice(2), ...meta, createdAt: Date.now() })
  localStorage.setItem(key, JSON.stringify(arr))
}

export function listReports(){
  return JSON.parse(localStorage.getItem('bt:reports')||'[]')
}
