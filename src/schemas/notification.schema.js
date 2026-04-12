import { z } from 'zod'

export const NotificationSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  titulo: z.string(),
  mensaje: z.string().nullable().optional(),
  tipo: z.string().nullable().optional(),
  vista: z.boolean(),
  relacionado_con: z.string().nullable().optional(),
  created_at: z.string(),
})

export const NotificationListSchema = z.array(NotificationSchema)
