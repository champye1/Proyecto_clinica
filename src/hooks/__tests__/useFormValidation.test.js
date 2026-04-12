import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useFormValidation } from '../useFormValidation'

const rules = {
  nombre: { required: true, requiredMessage: 'El nombre es requerido' },
  email: { required: true, email: true, emailMessage: 'Email inválido' },
  clave: { required: true, minLength: 6, minLengthMessage: 'Mínimo 6 caracteres' },
  descripcion: { maxLength: 10, maxLengthMessage: 'Máximo 10 caracteres' },
}

describe('useFormValidation', () => {
  it('inicializa con los valores dados', () => {
    const { result } = renderHook(() =>
      useFormValidation({ nombre: 'Juan', email: '' }, rules)
    )
    expect(result.current.values.nombre).toBe('Juan')
    expect(result.current.values.email).toBe('')
  })

  it('inicia sin errores ni campos tocados', () => {
    const { result } = renderHook(() =>
      useFormValidation({ nombre: '' }, rules)
    )
    expect(result.current.errors).toEqual({})
    expect(result.current.touched).toEqual({})
  })

  it('handleChange actualiza el valor', () => {
    const { result } = renderHook(() =>
      useFormValidation({ nombre: '' }, rules)
    )
    act(() => result.current.handleChange('nombre', 'María'))
    expect(result.current.values.nombre).toBe('María')
  })

  it('handleBlur marca el campo como tocado y valida', () => {
    const { result } = renderHook(() =>
      useFormValidation({ nombre: '' }, rules)
    )
    act(() => result.current.handleBlur('nombre'))
    expect(result.current.touched.nombre).toBe(true)
    expect(result.current.errors.nombre).toBe('El nombre es requerido')
  })

  it('no muestra error si el campo no fue tocado', () => {
    const { result } = renderHook(() =>
      useFormValidation({ nombre: '' }, rules)
    )
    expect(result.current.errors.nombre).toBeUndefined()
  })

  it('valida email inválido', () => {
    const { result } = renderHook(() =>
      useFormValidation({ email: 'noesemail' }, rules)
    )
    act(() => result.current.handleBlur('email'))
    expect(result.current.errors.email).toBe('Email inválido')
  })

  it('valida minLength', () => {
    const { result } = renderHook(() =>
      useFormValidation({ clave: '123' }, rules)
    )
    act(() => result.current.handleBlur('clave'))
    expect(result.current.errors.clave).toBe('Mínimo 6 caracteres')
  })

  it('no muestra error de minLength si está vacío (required toma precedencia)', () => {
    const { result } = renderHook(() =>
      useFormValidation({ clave: '' }, rules)
    )
    act(() => result.current.handleBlur('clave'))
    // required falla primero
    expect(result.current.errors.clave).toBeTruthy()
  })

  it('valida maxLength', () => {
    const { result } = renderHook(() =>
      useFormValidation({ descripcion: 'texto muy largo' }, rules)
    )
    act(() => result.current.handleBlur('descripcion'))
    expect(result.current.errors.descripcion).toBe('Máximo 10 caracteres')
  })

  it('validateForm retorna false si hay campos inválidos', () => {
    const { result } = renderHook(() =>
      useFormValidation({ nombre: '', email: '' }, rules)
    )
    let isValid
    act(() => {
      isValid = result.current.validateForm()
    })
    expect(isValid).toBe(false)
    expect(result.current.errors.nombre).toBeTruthy()
    expect(result.current.errors.email).toBeTruthy()
  })

  it('validateForm retorna true si todos los campos son válidos', () => {
    const { result } = renderHook(() =>
      useFormValidation(
        { nombre: 'Juan', email: 'juan@test.com', clave: 'segura1' },
        { nombre: rules.nombre, email: rules.email, clave: rules.clave }
      )
    )
    let isValid
    act(() => {
      isValid = result.current.validateForm()
    })
    expect(isValid).toBe(true)
  })

  it('validateForm marca todos los campos como tocados', () => {
    const { result } = renderHook(() =>
      useFormValidation({ nombre: '', email: '' }, { nombre: rules.nombre, email: rules.email })
    )
    act(() => result.current.validateForm())
    expect(result.current.touched.nombre).toBe(true)
    expect(result.current.touched.email).toBe(true)
  })

  it('resetForm vuelve al estado inicial', () => {
    const { result } = renderHook(() =>
      useFormValidation({ nombre: '' }, rules)
    )
    act(() => result.current.handleChange('nombre', 'Carlos'))
    act(() => result.current.handleBlur('nombre'))
    act(() => result.current.resetForm())

    expect(result.current.values.nombre).toBe('')
    expect(result.current.errors).toEqual({})
    expect(result.current.touched).toEqual({})
  })

  it('soporta regla de validación personalizada', () => {
    const customRules = {
      codigo: {
        validate: (v) => (v !== 'ABC' ? 'Debe ser ABC' : ''),
      },
    }
    const { result } = renderHook(() =>
      useFormValidation({ codigo: 'XYZ' }, customRules)
    )
    act(() => result.current.handleBlur('codigo'))
    expect(result.current.errors.codigo).toBe('Debe ser ABC')
  })
})
