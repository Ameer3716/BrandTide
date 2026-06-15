import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getSchedules, createSchedule, toggleSchedule, deleteSchedule } from '../../controllers/scheduleController.js'

vi.mock('../../models/Schedule.js', () => {
  const chainable = {
    sort: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    skip: vi.fn().mockReturnThis(),
    populate: vi.fn().mockReturnThis(),
    then: function(resolve) { resolve([{ id: 1 }]); }
  };
  return {
    default: {
      find: vi.fn().mockReturnValue(chainable),
      create: vi.fn(),
      findOne: vi.fn(),
      findOneAndDelete: vi.fn()
    }
  }
})
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
      await getSchedules(mockReq, mockRes)
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ schedules: expect.any(Array) }))
    })
  })

  describe('createSchedule', () => {
    it('creates schedule successfully', async () => {
      mockReq.body = { cadence: 'daily', email: 'test@example.com' }
      Schedule.create.mockResolvedValue({ _id: '123' })
      await createSchedule(mockReq, mockRes)
      expect(mockRes.status).toHaveBeenCalledWith(201)
    })
  })

  describe('toggleSchedule', () => {
    it('toggles schedule successfully', async () => {
      mockReq.params = { id: '123' }
      const mockSchedule = { active: true, save: vi.fn().mockResolvedValue() }
      Schedule.findOne.mockResolvedValue(mockSchedule)
      await toggleSchedule(mockReq, mockRes)
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ schedule: expect.any(Object) }))
    })
  })

  describe('deleteSchedule', () => {
    it('deletes schedule successfully', async () => {
      mockReq.params = { id: '123' }
      Schedule.findOneAndDelete.mockResolvedValue({ _id: '123' })
      await deleteSchedule(mockReq, mockRes)
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Schedule deleted successfully' }))
    })
  })
})