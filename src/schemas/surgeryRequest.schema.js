import { z } from 'zod'

const DoctorRefSchema = z.object({
  id: z.string().uuid(),
  nombre: z.string(),
  apellido: z.string(),
}).nullable()

const PatientRefSchema = z.object({
  id: z.string().uuid(),
  nombre: z.string(),
  apellido: z.string(),
  rut: z.string().nullable().optional(),
  fecha_nacimiento: z.string().nullable().optional(),
}).nullable()

const SupplyRefSchema = z.object({
  id: z.string().uuid(),
  nombre: z.string(),
  codigo: z.string(),
  tipo: z.string().nullable().optional(),
})

const SurgeryRequestSupplySchema = z.object({
  id: z.string().uuid(),
  cantidad: z.number(),
  supply: SupplyRefSchema.nullable().optional(),
})

export const SurgeryRequestSchema = z.object({
  id: z.string().uuid(),
  estado: z.enum(['pendiente', 'aceptada', 'rechazada']),
  created_at: z.string(),
  operation_code: z.string().nullable().optional(),
  notas: z.string().nullable().optional(),
  doctor: DoctorRefSchema.optional(),
  patient: PatientRefSchema.optional(),
  supplies: z.array(SurgeryRequestSupplySchema).optional(),
})

export const SurgeryRequestListSchema = z.array(SurgeryRequestSchema)
