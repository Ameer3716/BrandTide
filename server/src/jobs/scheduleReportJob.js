import Schedule from '../models/Schedule.js'
import User from '../models/User.js'
import dayjs from 'dayjs'
import { sendEmail } from '../utils/email.js'
import { generateSentimentReport, createReportEmailHTML } from '../utils/reportGenerator.js'
import mongoose from 'mongoose'

/**
 * Check and send scheduled reports
 * This function should be called periodically (e.g., every minute or every hour)
 */
export const checkAndSendScheduledReports = async () => {
  try {
    console.log('🔍 Checking for reports to send...')

    // Find all active schedules where nextSend is now or in the past
    const now = new Date()
    const schedules = await Schedule.find({
      active: true,
      nextSend: { $lte: now }
    }).populate('userId')

    if (schedules.length === 0) {
      console.log('✅ No scheduled reports to send at this time')
      return
    }

    console.log(`📬 Found ${schedules.length} schedule(s) to process`)

    for (const schedule of schedules) {
      try {
        console.log(`\n⏳ Processing schedule for ${schedule.email}...`)

        // Generate sentiment report
        console.log('📊 Generating sentiment report...')
        const report = await generateSentimentReport(schedule.userId._id)

        // Create HTML email
        const reportHTML = createReportEmailHTML(report)

        // Send email with report
        console.log('📧 Sending report email...')
        await sendEmail({
          email: schedule.email,
          subject: 'BrandTide - Your Sentiment Analysis Report',
          message: `Your scheduled sentiment analysis report is ready. Please see the HTML version for details.`,
          html: reportHTML
        })

        console.log(`✅ Report sent successfully to ${schedule.email}`)

        // Update schedule: set lastSent and calculate nextSend based on cadence
        let nextSendDate
        const scheduleTime = dayjs(schedule.nextSend).format('HH:mm')
        
        switch (schedule.cadence) {
          case 'daily':
            nextSendDate = dayjs()
              .add(1, 'day')
              .hour(parseInt(scheduleTime.split(':')[0]))
              .minute(parseInt(scheduleTime.split(':')[1]))
              .second(0)
              .toDate()
            break
          case 'weekly':
            nextSendDate = dayjs()
              .add(1, 'week')
              .day(dayjs(schedule.nextSend).day()) // Keep same day of week
              .hour(parseInt(scheduleTime.split(':')[0]))
              .minute(parseInt(scheduleTime.split(':')[1]))
              .second(0)
              .toDate()
            break
          case 'monthly':
            nextSendDate = dayjs()
              .add(1, 'month')
              .date(dayjs(schedule.nextSend).date()) // Keep same day of month
              .hour(parseInt(scheduleTime.split(':')[0]))
              .minute(parseInt(scheduleTime.split(':')[1]))
              .second(0)
              .toDate()
            break
          case 'custom':
            // For custom one-time schedules, deactivate after sending
            schedule.active = false
            await schedule.save()
            console.log(`🔔 Custom schedule deactivated (one-time delivery complete)`)
            continue
          default:
            nextSendDate = dayjs().add(1, 'day').toDate()
        }

        // Update schedule record
        schedule.lastSent = new Date()
        schedule.nextSend = nextSendDate
        await schedule.save()

        console.log(`📅 Next send scheduled for ${dayjs(nextSendDate).format('MMMM D, YYYY [at] h:mm A')}`)
      } catch (scheduleError) {
        console.error(`❌ Error processing schedule for ${schedule.email}:`, scheduleError.message)
        // Continue processing other schedules instead of stopping
      }
    }

    console.log('\n✅ Schedule check completed')
  } catch (error) {
    console.error('❌ Critical error in checkAndSendScheduledReports:', error)
  }
}

/**
 * Start the background job
 * Can be called with different intervals based on your needs
 */
export const startScheduleReportJob = (intervalMs = 60000) => {
  console.log(`⏱️  Starting scheduled report job (checks every ${intervalMs}ms = ${intervalMs/1000}s)`)
  
  // Run once immediately on startup
  checkAndSendScheduledReports()
  
  // Then run periodically
  setInterval(() => {
    checkAndSendScheduledReports()
  }, intervalMs)

  console.log('✅ Scheduled report job started')
}

export default startScheduleReportJob
