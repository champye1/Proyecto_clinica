/**
 * Servicio de insumos médicos.
 * Centraliza todas las operaciones sobre la tabla supplies.
 */
import { supabase } from '../config/supabase'
import { logger } from '../utils/logger'

/**
 * Obtiene insumos con paginación y filtros opcionales.
 * @param {object} opts - { page?, pageSize?, search?, tipo? }
 * @returns {Promise<{data: object[], count: number, error: object|null}>}
 */
export async function fetchSupplies({ page = 1, pageSize = 20, search = '', tipo = '' } = {}) {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('supplies')
    .select('*', { count: 'exact' })
    .eq('activo', true)
    .is('deleted_at', null)
    .order('nombre', { ascending: true })
    .range(from, to)

  if (search) {
    query = query.or(`nombre.ilike.%${search}%,codigo.ilike.%${search}%`)
  }
  if (tipo) {
    query = query.eq('tipo', tipo)
  }

  const { data, count, error } = await query

  if (error) {
    logger.errorWithContext('supplyService.fetchSupplies', error)
    return { data: [], count: 0, error }
  }
  return { data: data ?? [], count: count ?? 0, error: null }
}

/**
 * Verifica si un código de insumo ya existe.
 * @param {string} codigo
 * @param {string|null} excludeId - excluir este ID (para edición)
 * @returns {Promise<{exists: boolean, error: object|null}>}
 */
export async function checkCodeExists(codigo, excludeId = null) {
  let query = supabase
    .from('supplies')
    .select('id')
    .eq('codigo', codigo)
    .eq('activo', true)

  if (excludeId) {
    query = query.neq('id', excludeId)
  }

  const { data, error } = await query

  if (error) {
    logger.errorWithContext('supplyService.checkCodeExists', error)
    return { exists: false, error }
  }
  return { exists: data && data.length > 0, error: null }
}

/**
 * Crea un nuevo insumo.
 * @param {object} supplyData - { nombre, codigo, tipo, descripcion?, precio? }
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function createSupply(supplyData) {
  const { data, error } = await supabase
    .from('supplies')
    .insert({
      ...supplyData,
      activo: true,
      created_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    logger.errorWithContext('supplyService.createSupply', error)
    return { data: null, error }
  }
  return { data, error: null }
}

/**
 * Actualiza un insumo existente.
 * @param {string} id
 * @param {object} updates
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function updateSupply(id, updates) {
  const { data, error } = await supabase
    .from('supplies')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    logger.errorWithContext('supplyService.updateSupply', error, { id })
    return { data: null, error }
  }
  return { data, error: null }
}

/**
 * Elimina un insumo (soft delete).
 * @param {string} id
 * @returns {Promise<{error: object|null}>}
 */
export async function deleteSupply(id) {
  const { error } = await supabase
    .from('supplies')
    .update({
      deleted_at: new Date().toISOString(),
      activo: false,
    })
    .eq('id', id)

  if (error) {
    logger.errorWithContext('supplyService.deleteSupply', error, { id })
  }
  return { error }
}
