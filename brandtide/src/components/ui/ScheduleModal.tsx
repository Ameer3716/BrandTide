import { useState } from 'react'
import { X, Calendar, Loader2, Clock } from 'lucide-react'
import { scheduleService } from '@/services/api'

export default function ScheduleModal() {
  const [open, setOpen] = useState(false)
  const [cadence, setCadence] = useState('weekly')
  const [email, setEmail] = useState('')
  const [customDate, setCustomDate] = useState('')
  const [customTime, setCustomTime] = useState('09:00')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Get minimum date (today)
  const getMinDate = () => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  }

  async function schedule() {
    if (!email) {
      setError('Please enter an email address')
      return
    }

    if (cadence === 'custom' && !customDate) {
      setError('Please select a date for custom schedule')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const scheduleData: any = { cadence, email }
      
      // If custom schedule, send date and time
      if (cadence === 'custom') {
        scheduleData.customDate = customDate
        scheduleData.customTime = customTime
      }
      
      const response = await scheduleService.createSchedule(
        scheduleData.cadence, 
        scheduleData.email,
        scheduleData.customDate,
        scheduleData.customTime
      )
      setSuccess('Schedule created successfully! Check your email for confirmation.')
      setTimeout(() => {
        setOpen(false)
        setSuccess('')
        setEmail('')
        setCustomDate('')
        setCustomTime('09:00')
      }, 2000)
    } catch (err: any) {
      setError(err.message || 'Failed to create schedule. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        className="btn-secondary flex items-center gap-2"
        onClick={() => setOpen(true)}
      >
        <Calendar size={16} />
        Schedule
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-elevated">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-content">Schedule Report</h3>
              <button
                onClick={() => setOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X size={18} className="text-content-muted" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
              
              {success && (
                <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                  <p className="text-sm text-green-600">{success}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-content mb-1.5">Schedule Type</label>
                <select
                  value={cadence}
                  onChange={e => setCadence(e.target.value)}
                  disabled={loading}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition disabled:opacity-50"
                >
                  <option value="daily">Daily - Every day at 9:00 AM</option>
                  <option value="weekly">Weekly - Every Monday at 9:00 AM</option>
                  <option value="monthly">Monthly - 1st of each month at 9:00 AM</option>
                  <option value="custom">Custom - Choose your own date & time</option>
                </select>
              </div>

              {/* Custom Date & Time Picker */}
              {cadence === 'custom' && (
                <div className="grid grid-cols-2 gap-3 bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div>
                    <label className="block text-sm font-medium text-content mb-1.5 flex items-center gap-1">
                      <Calendar size={14} />
                      Select Date
                    </label>
                    <input
                      type="date"
                      value={customDate}
                      onChange={e => setCustomDate(e.target.value)}
                      min={getMinDate()}
                      disabled={loading}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition disabled:opacity-50 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-content mb-1.5 flex items-center gap-1">
                      <Clock size={14} />
                      Select Time
                    </label>
                    <input
                      type="time"
                      value={customTime}
                      onChange={e => setCustomTime(e.target.value)}
                      disabled={loading}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition disabled:opacity-50 text-sm"
                    />
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-content-muted flex items-center gap-1">
                      <span>📅</span>
                      Report will be sent once on {customDate || 'selected date'} at {customTime || '09:00'}
                    </p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-content mb-1.5">Recipient Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  disabled={loading}
                  placeholder="name@example.com"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition disabled:opacity-50"
                />
                <p className="text-xs text-content-muted mt-1.5">
                  {cadence === 'custom' 
                    ? 'Report will be sent once to this email address'
                    : 'Reports will be sent automatically to this email address'}
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 justify-end p-5 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
              <button 
                className="btn-secondary" 
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                className="btn-primary flex items-center gap-2" 
                onClick={schedule}
                disabled={loading}
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                {loading ? 'Creating...' : 'Create Schedule'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
