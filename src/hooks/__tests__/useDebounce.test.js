import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDebounce } from '../useDebounce'

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('retorna el valor inicial inmediatamente', () => {
    const { result } = renderHook(() => useDebounce('valor inicial', 500))
    expect(result.current).toBe('valor inicial')
  })

  it('no actualiza el valor antes del delay', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 500),
      { initialProps: { value: 'inicial' } }
    )

    rerender({ value: 'cambiado' })
    vi.advanceTimersByTime(300)

    expect(result.current).toBe('inicial')
  })

  it('actualiza el valor después del delay', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 500),
      { initialProps: { value: 'inicial' } }
    )

    rerender({ value: 'cambiado' })

    act(() => {
      vi.advanceTimersByTime(500)
    })

    expect(result.current).toBe('cambiado')
  })

  it('cancela el timer si el valor cambia antes del delay', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 500),
      { initialProps: { value: 'inicial' } }
    )

    rerender({ value: 'primer cambio' })
    vi.advanceTimersByTime(300)
    rerender({ value: 'segundo cambio' })

    act(() => {
      vi.advanceTimersByTime(500)
    })

    expect(result.current).toBe('segundo cambio')
  })

  it('usa 500ms como delay por defecto', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value),
      { initialProps: { value: 'inicial' } }
    )

    rerender({ value: 'nuevo' })
    vi.advanceTimersByTime(499)
    expect(result.current).toBe('inicial')

    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(result.current).toBe('nuevo')
  })

  it('funciona con valores numéricos', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 0 } }
    )

    rerender({ value: 42 })

    act(() => {
      vi.advanceTimersByTime(300)
    })

    expect(result.current).toBe(42)
  })
})
