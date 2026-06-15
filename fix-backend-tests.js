const fs = require('fs');
const path = require('path');

const beTestsDir = path.join(__dirname, 'server', 'src', '__tests__', 'controllers');

const tests = {
  'authController.test.js': `
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { register, login } from '../../controllers/authController.js'

vi.mock('../../models/User.js', () => ({
  default: {
    findByEmail: vi.fn(),
    create: vi.fn().mockResolvedValue({ _id: '123' })
  }
}))
import User from '../../models/User.js'

describe('Auth Controller', () => {
  let mockReq, mockRes

  beforeEach(() => {
    vi.clearAllMocks()
    mockReq = { body: {} }
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    }
  })

  describe('register', () => {
    it('returns 400 if user already exists', async () => {
      mockReq.body = { name: 'Test', email: 'test@example.com', password: 'password' }
      User.findByEmail.mockResolvedValue({ id: '123' })
      await register(mockReq, mockRes)
      expect(mockRes.status).toHaveBeenCalledWith(400)
    })

    it('registers user', async () => {
      mockReq.body = { name: 'Test', email: 'test@example.com', password: 'password' }
      User.findByEmail.mockResolvedValue(null)
      await register(mockReq, mockRes)
      expect(mockRes.status).toHaveBeenCalledWith(201)
    })
  })
})
`,
  'dashboardController.test.js': `
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getOverview } from '../../controllers/dashboardController.js'

vi.mock('../../models/Review.js', () => ({
  default: {
    countDocuments: vi.fn(),
    find: vi.fn().mockReturnValue({
      sort: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue([{ id: 1 }])
      })
    })
  }
}))
import Review from '../../models/Review.js'

describe('Dashboard Controller', () => {
  let mockReq, mockRes
  beforeEach(() => {
    vi.clearAllMocks()
    mockReq = { user: { _id: '123456789012345678901234' }, query: {} }
    mockRes = { status: vi.fn().mockReturnThis(), json: vi.fn() }
  })

  describe('getOverview', () => {
    it('returns overview stats successfully', async () => {
      Review.countDocuments.mockResolvedValueOnce(100)
      Review.countDocuments.mockResolvedValueOnce(60)
      Review.countDocuments.mockResolvedValueOnce(30)
      await getOverview(mockReq, mockRes)
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }))
    })

    it('handles errors', async () => {
      Review.countDocuments.mockRejectedValue(new Error('DB Error'))
      await getOverview(mockReq, mockRes)
      expect(mockRes.status).toHaveBeenCalledWith(500)
    })
  })
})
`,
  'dataController.test.js': `
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getMetrics } from '../../controllers/dataController.js'

vi.mock('../../models/Review.js', () => ({
  default: {
    aggregate: vi.fn()
  }
}))
import Review from '../../models/Review.js'

describe('Data Controller', () => {
  let mockReq, mockRes
  beforeEach(() => {
    vi.clearAllMocks()
    mockReq = { user: { _id: '123456789012345678901234' }, query: {} }
    mockRes = { status: vi.fn().mockReturnThis(), json: vi.fn() }
  })

  describe('getMetrics', () => {
    it('returns metrics successfully', async () => {
      Review.aggregate.mockResolvedValueOnce([{ _id: 'Positive', count: 60 }, { _id: 'Negative', count: 40 }])
      Review.aggregate.mockResolvedValueOnce([{ brandsCount: 5, productsCount: 10 }])
      await getMetrics(mockReq, mockRes)
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }))
    })

    it('handles errors', async () => {
      Review.aggregate.mockRejectedValue(new Error('DB Error'))
      await getMetrics(mockReq, mockRes)
      expect(mockRes.status).toHaveBeenCalledWith(500)
    })
  })
})
`,
  'reviewController.test.js': `
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getReviews } from '../../controllers/reviewController.js'

vi.mock('../../models/Review.js', () => ({
  default: {
    countDocuments: vi.fn(),
    find: vi.fn().mockReturnValue({
      sort: vi.fn().mockReturnValue({
        skip: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([{ id: 1 }])
        })
      })
    })
  }
}))
import Review from '../../models/Review.js'

describe('Review Controller', () => {
  let mockReq, mockRes
  beforeEach(() => {
    vi.clearAllMocks()
    mockReq = { user: { _id: '123456789012345678901234' }, query: {} }
    mockRes = { status: vi.fn().mockReturnThis(), json: vi.fn() }
  })

  describe('getReviews', () => {
    it('returns reviews successfully', async () => {
      Review.countDocuments.mockResolvedValue(1)
      await getReviews(mockReq, mockRes)
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }))
    })
  })
})
`,
  'scheduleController.test.js': `
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getSchedules } from '../../controllers/scheduleController.js'

vi.mock('../../models/Schedule.js', () => ({
  default: {
    find: vi.fn()
  }
}))
import Schedule from '../../models/Schedule.js'

describe('Schedule Controller', () => {
  let mockReq, mockRes
  beforeEach(() => {
    vi.clearAllMocks()
    mockReq = { user: { _id: '123456789012345678901234' }, query: {} }
    mockRes = { status: vi.fn().mockReturnThis(), json: vi.fn() }
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

vi.mock('stripe', () => {
  return {
    default: class Stripe {
      checkout = {
        sessions: {
          create: vi.fn().mockResolvedValue({ id: '123', url: 'http://checkout.stripe.com' })
        }
      }
      customers = {
        create: vi.fn().mockResolvedValue({ id: 'cust_123' })
      }
    }
  }
})

vi.mock('../../models/User.js', () => ({
  default: {
    findById: vi.fn()
  }
}))
import User from '../../models/User.js'

describe('Stripe Controller', () => {
  let mockReq, mockRes
  beforeEach(() => {
    vi.clearAllMocks()
    mockReq = { user: { _id: '123456789012345678901234' }, body: { plan: 'pro' } }
    mockRes = { status: vi.fn().mockReturnThis(), json: vi.fn() }
  })

  describe('createCheckoutSession', () => {
    it('returns checkout url successfully', async () => {
      User.findById.mockResolvedValue({ email: 'test@test.com', _id: '123456789012345678901234', save: vi.fn(), toJSON: () => ({ email: 'test@test.com' }) })
      await createCheckoutSession(mockReq, mockRes)
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, data: { sessionId: '123', url: 'http://checkout.stripe.com' } }))
    })
  })
})
`,
  'agentController.test.js': `
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { smartClassifySingle } from '../../controllers/agentController.js'

vi.mock('../../services/geminiAgent.js', () => ({
  geminiAgent: {
    cleanSingleText: vi.fn().mockResolvedValue({ isValidReview: true, cleanedText: 'test' })
  }
}))

describe('Agent Controller', () => {
  let mockReq, mockRes
  beforeEach(() => {
    vi.clearAllMocks()
    mockReq = { user: { _id: '123456789012345678901234' }, body: { text: 'good product' } }
    mockRes = { status: vi.fn().mockReturnThis(), json: vi.fn() }
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ success: true, data: { label: 'positive', confidence: 0.9 } })
    })
  })

  describe('smartClassifySingle', () => {
    it('returns classification successfully', async () => {
      await smartClassifySingle(mockReq, mockRes)
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }))
    })
  })
})
`
};

for (const [filename, content] of Object.entries(tests)) {
  fs.writeFileSync(path.join(beTestsDir, filename), content.trim());
}
console.log('Backend api tests fixed.');
