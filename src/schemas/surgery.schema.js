import { z } from 'zod'

export const SurgerySchema = z.object({
  id: z.string().uuid(),
  fecha: z.string(),
  hora_inicio: z.string(),
  hora_fin: z.string(),
  estado: z.enum(['programada', 'en_proceso', 'completada', 'cancelada']).optional(),
  operating_room_id: z.string().uuid().nullable().optional(),
  doctor_id: z.string().uuid().nullable().optional(),
  patient_id: z.string().uuid().nullable().optional(),
  created_at: z.string().optional(),
})

export const SurgeryListSchema = z.array(SurgerySchema)
