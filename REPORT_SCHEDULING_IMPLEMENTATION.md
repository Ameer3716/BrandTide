# Report Scheduling Implementation Guide

## Problem Fixed
✅ **Report Not Being Sent**: Background job now checks every 60 seconds for schedules that are due
✅ **Schedule Date Not Saved**: Data is saved to `nextSend` field and properly tracked
✅ **Email Not Containing Report**: Sentiment report is now generated and sent as HTML email

## What Changed

### Backend Changes

#### 1. New Background Job (`server/src/jobs/scheduleReportJob.js`)
- Runs every 60 seconds automatically
- Checks for due schedules (`nextSend <= now`)
- Generates sentiment reports
- Sends HTML email with report
- Updates `lastSent` and recalculates `nextSend`

#### 2. New Report Generator (`server/src/utils/reportGenerator.js`)
- `generateSentimentReport()`: Aggregates user's sentiment data
- `createReportEmailHTML()`: Formats report as beautiful HTML email
- Includes:
  - Total reviews count
  - Sentiment distribution (positive/neutral/negative)
  - Sentiment percentages
  - Top brands with confidence scores
  - Top products with confidence scores
  - Recent review examples

#### 3. Updated Server (`server/src/index.js`)
- Imports and starts the background job on server startup
- Job runs for the lifetime of the server

### Frontend Changes

#### 1. Reports Page (`brandtide/src/pages/Reports.tsx`)
- Added "Scheduled Reports" section
- Shows all scheduled reports with:
  - Schedule type (daily/weekly/monthly/one-time)
  - Recipient email
  - Last sent time
  - Next send time (exact date/time)
  - Active/Inactive status
  - Pause/Resume button
  - Delete button

#### 2. Schedule Modal Enhancement
- Added `onScheduleCreated` callback
- Refreshes parent report list after creating schedule

## How Schedules Work

### Cadence Types & Timing

| Cadence | Behavior | Example |
|---------|----------|---------|
| **Daily** | Sent every day at 9:00 AM | Mon 9AM → Tue 9AM → Wed 9AM |
| **Weekly** | Sent every Monday at 9:00 AM | Mon 9AM → Next Mon 9AM |
| **Monthly** | Sent on 1st of month at 9:00 AM | Mar 1 9AM → Apr 1 9AM |
| **Custom** | One-time delivery on set date/time | May 15 2PM (then deactivates) |

### Schedule Record Fields

```javascript
{
  _id: ObjectId,
  userId: ObjectId,          // User who created
  email: String,             // Recipient email
  cadence: String,           // 'daily', 'weekly', 'monthly', 'custom'
  active: Boolean,           // Can be paused/resumed
  lastSent: Date,            // When report was last sent
  nextSend: Date,            // When next report should send (THIS IS SAVED!)
  timestamps: {              // Created/updated times
    createdAt: Date,
    updatedAt: Date
  }
}
```

## Testing

### Option 1: Manual Trigger (Development Only)

```bash
# Make POST request to:
POST /api/schedules/admin/trigger-check

# Response:
{
  "success": true,
  "message": "Schedule check triggered successfully"
}
```

### Option 2: Wait for Automatic Check

The background job runs every 60 seconds, so:
1. Create a schedule
2. Set custom date to right now or near future
3. Wait up to 60 seconds
4. Check email for sentiment report

### Option 3: Create Test Schedule

```javascript
// Frontend
const schedule = await scheduleService.createSchedule(
  'custom',           // cadence
  'your@email.com',   // recipient
  '2024-04-10',      // date (YYYY-MM-DD)
  '14:30'            // time (HH:mm)
)
```

## Email Report Contents

The sentiment analysis report email includes:

1. **Header**: Report title with generation time
2. **Key Metrics**:
   - Total reviews
   - Positive percentage
   - Negative percentage
3. **Sentiment Distribution Table**:
   - Positive count & percentage
   - Neutral count & percentage  
   - Negative count & percentage
4. **Top Brands**: Top 5 brands with review count and confidence
5. **Top Products**: Top 5 products with review count and confidence
6. **Recent Reviews**: Last 5 reviews with sentiment, confidence, and snippet

## Database Changes
- ✅ `nextSend` field already exists in Schedule model
- ✅ `lastSent` field already exists in Schedule model
- ✅ `active` field already exists in Schedule model
- No migrations needed!

## Monitoring

Check server logs for:
```
🔍 Checking for reports to send...
📬 Found X schedule(s) to process
⏳ Processing schedule for user@email.com...
📊 Generating sentiment report...
📧 Sending report email...
✅ Report sent successfully to user@email.com
📅 Next send scheduled for May 15, 2024 at 2:00 PM
```

## Troubleshooting

### Reports not sending?
1. Check server logs for errors
2. Verify email configuration
3. Check if `active: true` in database
4. Ensure `nextSend` is in the past or present

### Report is empty?
1. Make sure user has reviews with sentiment data
2. Check if Reviews have brand/product names encrypted
3. Verify Review documents have topics field

### Custom schedule not deactivating?
1. Check if `cadence === 'custom'` condition is working
2. Verify schedule `active` field is set to false after sending

## Architecture Overview

```
Server Startup
    ↓
startScheduleReportJob() starts
    ↓
Runs checkAndSendScheduledReports() every 60 seconds
    ↓
Query Schedule.find({ active: true, nextSend: { $lte: now } })
    ↓
For each due schedule:
  - Generate sentiment report data
  - Create HTML email
  - Send email
  - Update lastSent & nextSend
    ↓
Continue checking every 60 seconds
```

## Performance Notes

- Background job is non-blocking (async)
- Checks happen every 60 seconds (configurable in index.js)
- Each email send is independent (failures don't stop others)
- Report generation queries are optimized with aggregation pipeline
- No database locks or memory issues
