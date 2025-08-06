import '@testing-library/jest-dom'

// Mock CSS modules
const mockCSSModule = new Proxy({}, {
  get: (target, prop) => {
    return prop.toString()
  }
})

// Mock all CSS module imports
vi.mock('*.module.css', () => ({
  default: mockCSSModule
}))