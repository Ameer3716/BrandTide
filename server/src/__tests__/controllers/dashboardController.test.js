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