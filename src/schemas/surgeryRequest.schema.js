import { z } from 'zod'

// Forma que retornan los joins en los queries:
// patients:patient_id(...)  → campo "patients" (nullable si FK es null)
// doctors:doctor_id(...)    → campo "doctors"  (nullable si FK es null)
// surgery_request_supplies(cantidad, supplies:supply_id(...)) → array

const PatientRefSchema = z.object({
  id: z.string().uuid().optional(),
  nombre: z.string(),
  apellido: z.string(),
  rut: z.string().nullable().optional(),
  fecha_nacimiento: z.string().nullable().optional(),
}).nullable()

const DoctorRefSchema = z.object({
  id: z.string().uuid().optional(),
  nombre: z.string().optional(),
  apellido: z.string(),
  especialidad: z.string().nullable().optional(),
  user_id: z.string().uuid().optional(),
  telefono: z.string().nullable().optional(),
}).nullable()

const SupplyRefSchema = z.object({
  nombre: z.string(),
  codigo: z.string(),
})

const SurgeryRequestSupplySchema = z.object({
  cantidad: z.number(),
  supplies: SupplyRefSchema.nullable().optional(),
})

const SurgeryNestedSchema = z.object({
  fecha: z.string(),
  hora_inicio: z.string(),
  hora_fin: z.string(),
  estado_hora: z.string().nullable().optional(),
  fecha_anterior: z.string().nullable().optional(),
  hora_inicio_anterior: z.string().nullable().optional(),
  hora_fin_anterior: z.string().nullable().optional(),
  operating_rooms: z.object({ nombre: z.string() }).nullable().optional(),
})

export const SurgeryRequestSchema = z.object({
  id: z.string().uuid(),
  estado: z.enum(['pendiente', 'aceptada', 'rechazada']),
  created_at: z.string(),
  codigo_operacion: z.string().nullable().optional(),
  notas: z.string().nullable().optional(),
  patients: PatientRefSchema.optional(),
  doctors: DoctorRefSchema.optional(),
  surgery_request_supplies: z.array(SurgeryRequestSupplySchema).optional(),
  surgeries: z.array(SurgeryNestedSchema).optional(),
}).passthrough()

export const SurgeryRequestListSchema = z.array(SurgeryRequestSchema)
