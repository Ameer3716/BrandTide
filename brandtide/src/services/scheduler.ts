export function listSchedules(){
  return JSON.parse(localStorage.getItem('bt:schedules')||'[]')
}
