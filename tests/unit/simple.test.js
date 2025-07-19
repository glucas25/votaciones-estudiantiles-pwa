import { describe, it, expect } from 'vitest'

describe('Simple Test', () => {
  it('should verify testing framework works', () => {
    expect(1 + 1).toBe(2)
  })

  it('should verify mocking works', () => {
    const mockFn = vi.fn()
    mockFn('test')
    expect(mockFn).toHaveBeenCalledWith('test')
  })
})