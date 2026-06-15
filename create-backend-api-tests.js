const fs = require('fs');
const path = require('path');

const beTestsDir = path.join(__dirname, 'server', 'src', '__tests__', 'controllers');

const tests = {
  'reviewController.test.js': `
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getReviews } from '../../controllers/reviewController.js'
import Review from '../../models/Review.js'

vi.mock('../../models/Review.js')

describe('Review Controller', () => {
  let mockReq, mockRes

  beforeEach(() => {
    vi.clearAllMocks()
    mockReq = {
      user: { _id: '123456789012345678901234' },
      query: {}
    }
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    }
  })

  describe('getReviews', () => {
    it('returns reviews successfully', async () => {
      Review.countDocuments.mockResolvedValue(1)
      Review.find = vi.fn().mockReturnValue({
        sort: vi.fn().mockReturnValue({
          skip: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ id: 1 }])
          })
        })
      })

      await getReviews(mockReq, mockRes)
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }))
    })
  })
})
`,
  'scheduleController.test.js': `
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getSchedules } from '../../controllers/scheduleController.js'
import Schedule from '../../models/Schedule.js'

vi.mock('../../models/Schedule.js')

describe('Schedule Controller', () => {
  let mockReq, mockRes

  beforeEach(() => {
    vi.clearAllMocks()
    mockReq = { user: { _id: '123456789012345678901234' } }
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    }
  })

  describe('getSchedules', () => {
    it('returns schedules successfully', async () => {
      Schedule.find.mockResolvedValue([{ id: 1 }])
      await getSchedules(mockReq, mockRes)
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }))
    })
  })
})
`,
  'stripeController.test.js': `
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createCheckoutSession } from '../../controllers/stripeController.js'
import User from '../../models/User.js'

vi.mock('../../models/User.js')
vi.mock('stripe', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      checkout: {
        sessions: {
          create: vi.fn().mockResolvedValue({ id: 'session_123', url: 'http://checkout.stripe.com' })
        }
      }
    }))
  }
})

describe('Stripe Controller', () => {
  let mockReq, mockRes

  beforeEach(() => {
    vi.clearAllMocks()
    mockReq = {
      user: { _id: '123456789012345678901234' },
      body: { priceId: 'price_123' }
    }
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    }
  })

  describe('createCheckoutSession', () => {
    it('returns checkout url successfully', async () => {
      User.findById.mockResolvedValue({ email: 'test@test.com' })
      await createCheckoutSession(mockReq, mockRes)
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, url: 'http://checkout.stripe.com' }))
    })
  })
})
`,
  'agentController.test.js': `
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getAgentConfig } from '../../controllers/agentController.js'
import AgentConfig from '../../models/AgentConfig.js'

vi.mock('../../models/AgentConfig.js')

describe('Agent Controller', () => {
  let mockReq, mockRes

  beforeEach(() => {
    vi.clearAllMocks()
    mockReq = { user: { _id: '123456789012345678901234' } }
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    }
  })

  describe('getAgentConfig', () => {
    it('returns config successfully', async () => {
      AgentConfig.findOne.mockResolvedValue({ agentName: 'Test' })
      await getAgentConfig(mockReq, mockRes)
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }))
    })
  })
})
`
};

for (const [filename, content] of Object.entries(tests)) {
  fs.writeFileSync(path.join(beTestsDir, filename), content.trim());
}
console.log('Backend api tests created.');
