import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGetUser = vi.fn()
const mockGetSession = vi.fn()
const mockSignInWithPassword = vi.fn()
const mockSignOut = vi.fn()
const mockUpdateUser = vi.fn()
const mockResetPasswordForEmail = vi.fn()
const mockOnAuthStateChange = vi.fn()
const mockFrom = vi.fn()

vi.mock('@/config/supabase', () => ({
  supabase: {
    auth: {
      getUser: () => mockGetUser(),
      getSession: () => mockGetSession(),
      signInWithPassword: (args) => mockSignInWithPassword(args),
      signOut: () => mockSignOut(),
      updateUser: (args) => mockUpdateUser(args),
      resetPasswordForEmail: (email, opts) => mockResetPasswordForEmail(email, opts),
      onAuthStateChange: (cb) => mockOnAuthStateChange(cb),
    },
    from: (table) => mockFrom(table),
  },
}))

import { getCurrentUser, getCurrentSession, signIn, signOut, getUserRole, updatePassword, sendPasswordResetEmail } from '../authService'

describe('getCurrentUser', () => {
  beforeEach(() => mockGetUser.mockReset())

  it('retorna el usuario cuando la sesión es válida', async () => {
    const fakeUser = { id: 'abc123', email: 'test@test.com' }
    mockGetUser.mockResolvedValue({ data: { user: fakeUser }, error: null })
    const result = await getCurrentUser()
    expect(result.user).toEqual(fakeUser)
    expect(result.error).toBeNull()
  })

  it('retorna null cuando no hay sesión', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null })
    const result = await getCurrentUser()
    expect(result.user).toBeNull()
  })

  it('retorna error cuando Supabase falla', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'JWT expired' } })
    const result = await getCurrentUser()
    expect(result.error).toBeDefined()
  })
})

describe('getCurrentSession', () => {
  beforeEach(() => mockGetSession.mockReset())

  it('retorna la sesión activa', async () => {
    const fakeSession = { access_token: 'token123', user: { id: 'abc' } }
    mockGetSession.mockResolvedValue({ data: { session: fakeSession }, error: null })
    const result = await getCurrentSession()
    expect(result.session).toEqual(fakeSession)
  })

  it('retorna null si no hay sesión', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null }, error: null })
    const result = await getCurrentSession()
    expect(result.session).toBeNull()
  })
})

describe('signIn', () => {
  beforeEach(() => mockSignInWithPassword.mockReset())

  it('llama a signInWithPassword con email y password', async () => {
    mockSignInWithPassword.mockResolvedValue({ data: { user: { id: '1' } }, error: null })
    await signIn('user@test.com', 'password123')
    expect(mockSignInWithPassword).toHaveBeenCalledWith({ email: 'user@test.com', password: 'password123' })
  })

  it('retorna error en credenciales inválidas', async () => {
    mockSignInWithPassword.mockResolvedValue({ data: null, error: { message: 'Invalid credentials' } })
    const result = await signIn('bad@test.com', 'wrong')
    expect(result.error).toBeDefined()
  })
})

describe('signOut', () => {
  beforeEach(() => mockSignOut.mockReset())

  it('llama a auth.signOut', async () => {
    mockSignOut.mockResolvedValue({ error: null })
    await signOut()
    expect(mockSignOut).toHaveBeenCalled()
  })
})

describe('updatePassword', () => {
  beforeEach(() => mockUpdateUser.mockReset())

  it('llama a updateUser con la nueva contraseña', async () => {
    mockUpdateUser.mockResolvedValue({ data: {}, error: null })
    await updatePassword('nuevaClave123')
    expect(mockUpdateUser).toHaveBeenCalledWith({ password: 'nuevaClave123' })
  })

  it('retorna error si la contraseña es inválida', async () => {
    mockUpdateUser.mockResolvedValue({ data: null, error: { message: 'Password too short' } })
    const result = await updatePassword('x')
    expect(result.error).toBeDefined()
  })
})

describe('sendPasswordResetEmail', () => {
  beforeEach(() => mockResetPasswordForEmail.mockReset())

  it('llama con el email y un redirectTo que incluye restablecer-contrasena', async () => {
    mockResetPasswordForEmail.mockResolvedValue({ error: null })
    await sendPasswordResetEmail('user@test.com')
    expect(mockResetPasswordForEmail).toHaveBeenCalledWith(
      'user@test.com',
      expect.objectContaining({ redirectTo: expect.stringContaining('restablecer-contrasena') })
    )
  })

  it('retorna error si Supabase falla', async () => {
    mockResetPasswordForEmail.mockResolvedValue({ error: { message: 'Rate limit' } })
    const result = await sendPasswordResetEmail('user@test.com')
    expect(result.error).toBeDefined()
  })
})
