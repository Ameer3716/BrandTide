import Schedule from '../models/Schedule.js'
import { sendEmail } from '../utils/email.js'
import dayjs from 'dayjs'

// @desc    Create a new schedule
// @route   POST /api/schedules
// @access  Private
export const createSchedule = async (req, res) => {
  try {
    const { cadence, email, customDate, customTime, timezoneOffset } = req.body
    const userId = req.user._id

    // Validate input
    if (!cadence || !email) {
      return res.status(400).json({ message: 'Cadence and email are required' })
    }

    if (!['daily', 'weekly', 'monthly', 'custom'].includes(cadence)) {
      return res.status(400).json({ message: 'Invalid cadence. Must be daily, weekly, monthly, or custom' })
    }

    // Validate custom date/time if cadence is custom
    if (cadence === 'custom' && !customDate) {
      return res.status(400).json({ message: 'Custom date is required for custom schedule' })
    }

    // Calculate next send date based on cadence
    let nextSend
    switch (cadence) {
      case 'daily':
        nextSend = dayjs().add(1, 'day').hour(9).minute(0).second(0).toDate()
        break
      case 'weekly':
        nextSend = dayjs().add(1, 'week').day(1).hour(9).minute(0).second(0).toDate() // Next Monday at 9 AM
        break
      case 'monthly':
        nextSend = dayjs().add(1, 'month').date(1).hour(9).minute(0).second(0).toDate() // First day of next month at 9 AM
        break
      case 'custom':
        // Parse custom date and time - these come from HTML input which are in LOCAL timezone
        const [hours, minutes] = (customTime || '09:00').split(':').map(Number)
        
        // Create calendar date - interpret input as local time
        const localDateString = `${customDate}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`
        let scheduleDateTime = dayjs(localDateString)
        
        // If timezone offset is provided, adjust to UTC
        // JavaScript getTimezoneOffset() returns positive minutes for zones west of UTC
        // So EST (UTC-5) returns +300. We need to SUBTRACT this to get UTC time
        if (timezoneOffset !== undefined && timezoneOffset !== null) {
          scheduleDateTime = scheduleDateTime.subtract(timezoneOffset, 'minute')
        }
        
        nextSend = scheduleDateTime.toDate()
        
        // Validate that custom date is in the future
        if (dayjs(nextSend).isBefore(dayjs())) {
          return res.status(400).json({ message: 'Custom date and time must be in the future' })
        }
        break
    }

    // Create schedule
    const schedule = await Schedule.create({
      userId,
      email,
      cadence,
      nextSend
    })

    // Send confirmation email
    try {
      const frequencyText = cadence === 'custom' 
        ? `One-time on ${dayjs(nextSend).format('MMMM D, YYYY [at] h:mm A')}`
        : cadence.charAt(0).toUpperCase() + cadence.slice(1)
      
      await sendEmail({
        email: email,
        subject: 'BrandTide - Report Schedule Confirmed',
        message: `Your ${cadence === 'custom' ? 'custom' : cadence} sentiment analysis report has been scheduled successfully.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #10B981;">Report Schedule Confirmed</h2>
            <p>Your sentiment analysis report has been scheduled successfully.</p>
            <p><strong>Details:</strong></p>
            <ul>
              <li>Schedule: ${frequencyText}</li>
              <li>Recipient: ${email}</li>
              <li>${cadence === 'custom' ? 'Scheduled for' : 'Next Report'}: ${dayjs(nextSend).format('MMMM D, YYYY [at] h:mm A')}</li>
            </ul>
            <p>You will receive ${cadence === 'custom' ? 'your' : 'comprehensive'} sentiment analysis report${cadence === 'custom' ? '' : 's'} directly to your inbox.</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
            <p style="color: #6b7280; font-size: 12px;">You can manage your schedules from the BrandTide dashboard.</p>
          </div>
        `
      })
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError)
      // Don't fail the request if email fails
    }

    res.status(201).json({
      message: 'Schedule created successfully',
      schedule: {
        id: schedule._id,
        cadence: schedule.cadence,
        email: schedule.email,
        nextSend: schedule.nextSend,
        active: schedule.active
      }
    })
  } catch (error) {
    console.error('Error creating schedule:', error)
    res.status(500).json({ message: 'Failed to create schedule' })
  }
}

// @desc    Get all schedules for the user
// @route   GET /api/schedules
// @access  Private
export const getSchedules = async (req, res) => {
  try {
    const userId = req.user._id

    const schedules = await Schedule.find({ userId }).sort({ createdAt: -1 })

    res.json({
      schedules: schedules.map(s => ({
        id: s._id,
        cadence: s.cadence,
        email: s.email,
        active: s.active,
        lastSent: s.lastSent,
        nextSend: s.nextSend,
        createdAt: s.createdAt
      }))
    })
  } catch (error) {
    console.error('Error fetching schedules:', error)
    res.status(500).json({ message: 'Failed to fetch schedules' })
  }
}

// @desc    Delete a schedule
// @route   DELETE /api/schedules/:id
// @access  Private
export const deleteSchedule = async (req, res) => {
  try {
    const userId = req.user._id
    const scheduleId = req.params.id

    const schedule = await Schedule.findOneAndDelete({
      _id: scheduleId,
      userId
    })

    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' })
    }

    res.json({ message: 'Schedule deleted successfully' })
  } catch (error) {
    console.error('Error deleting schedule:', error)
    res.status(500).json({ message: 'Failed to delete schedule' })
  }
}

// @desc    Toggle schedule active status
// @route   PATCH /api/schedules/:id/toggle
// @access  Private
export const toggleSchedule = async (req, res) => {
  try {
    const userId = req.user._id
    const scheduleId = req.params.id

    const schedule = await Schedule.findOne({
      _id: scheduleId,
      userId
    })

    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' })
    }

    schedule.active = !schedule.active
    await schedule.save()

    res.json({
      message: `Schedule ${schedule.active ? 'activated' : 'deactivated'} successfully`,
      schedule: {
        id: schedule._id,
        active: schedule.active
      }
    })
  } catch (error) {
    console.error('Error toggling schedule:', error)
    res.status(500).json({ message: 'Failed to toggle schedule' })
  }
}
