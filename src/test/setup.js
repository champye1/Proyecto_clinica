import '@testing-library/jest-dom'

// jsdom proporciona localStorage nativo — solo lo limpiamos entre tests
beforeEach(() => {
  localStorage.clear()
})
