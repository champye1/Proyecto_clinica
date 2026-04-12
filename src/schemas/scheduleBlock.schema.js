import { z } from 'zod'

export const ScheduleBlockSchema = z.object({
  id: z.string().uuid(),
  operating_room_id: z.string().uuid(),
  fecha: z.string(),
  hora_inicio: z.string(),
  hora_fin: z.string(),
  motivo: z.string().nullable().optional(),
  vigencia_hasta: z.string().nullable().optional(),
  created_at: z.string().optional(),
})

export const ScheduleBlockListSchema = z.array(ScheduleBlockSchema)
