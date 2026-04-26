import { supabase } from '@/config/supabase'
import { logger } from '@/utils/logger'

export async function fetchSupplies({ search = '', searchBy = 'nombre' } = {}) {
  let query = supabase
    .from('supplies')
    .select('*')
    .eq('activo', true)
    .is('deleted_at', null)
    .order('nombre', { ascending: true })

  const term = search.trim()
  if (term) {
    query = query.ilike(searchBy === 'codigo' ? 'codigo' : 'nombre', `%${term}%`)
  }

  const { data, error } = await query
  if (error) { logger.errorWithContext('supplyService.fetchSupplies', error); return { data: [], error } }
  return { data: data ?? [], error: null }
}

export async function fetchActiveSupplies() {
  const { data, error } = await supabase
    .from('supplies')
    .select('id, nombre, codigo, grupo_prestacion, grupos_fonasa')
    .eq('activo', true)
    .is('deleted_at', null)
    .order('nombre', { ascending: true })

  if (error) { logger.errorWithContext('supplyService.fetchActiveSupplies', error); return { data: [], error } }
  return { data: data ?? [], error: null }
}

export async function checkCodeExists(codigo, excludeId = null) {
  let query = supabase.from('supplies').select('id').eq('codigo', codigo.trim()).is('deleted_at', null)
  if (excludeId) query = query.neq('id', excludeId)
  const { data, error } = await query.maybeSingle()
  if (error) return { exists: false, error }
  return { exists: !!data, error: null }
}

export async function createSupply(payload) {
  const { data, error } = await supabase.from('supplies').insert(payload).select().single()
  if (error) { logger.errorWithContext('supplyService.createSupply', error); return { data: null, error } }
  return { data, error: null }
}

export async function updateSupply(id, payload) {
  const { data, error } = await supabase.from('supplies').update(payload).eq('id', id).select().single()
  if (error) { logger.errorWithContext('supplyService.updateSupply', error, { id }); return { data: null, error } }
  return { data, error: null }
}

export async function deleteSupply(id) {
  const { error } = await supabase
    .from('supplies')
    .update({ deleted_at: new Date().toISOString(), activo: false })
    .eq('id', id)
  if (error) logger.errorWithContext('supplyService.deleteSupply', error, { id })
  return { error: error ?? null }
}

export async function fetchOperationPacks(codigoOperacion) {
  const { data, error } = await supabase
    .from('operation_supply_packs')
    .select('supply_id, cantidad, supplies(id, nombre, codigo)')
    .eq('codigo_operacion', codigoOperacion)
  if (error) { logger.errorWithContext('supplyService.fetchOperationPacks', error); return { data: [], error } }
  return { data: data ?? [], error: null }
}
