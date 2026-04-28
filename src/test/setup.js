import '@testing-library/jest-dom'

// Node.js 22+ expone un localStorage experimental sin .clear() — sobreescribimos
// con un mock en memoria para que todos los tests lo tengan disponible limpio.
const createStorageMock = () => {
  let store = {}
  return {
    getItem:    (k)    => Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null,
    setItem:    (k, v) => { store[k] = String(v) },
    removeItem: (k)    => { delete store[k] },
    clear:      ()     => { store = {} },
    get length ()      { return Object.keys(store).length },
    key:        (i)    => Object.keys(store)[i] ?? null,
  }
}

Object.defineProperty(globalThis, 'localStorage',  { value: createStorageMock(), writable: true, configurable: true })
Object.defineProperty(globalThis, 'sessionStorage', { value: createStorageMock(), writable: true, configurable: true })

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
})
