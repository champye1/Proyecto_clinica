import { z } from 'zod'

export const DoctorSchema = z.object({
  id: z.string().uuid(),
  nombre: z.string(),
  apellido: z.string(),
  especialidad: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  telefono: z.string().nullable().optional(),
  activo: z.boolean().optional(),
  created_at: z.string().optional(),
})

export const DoctorListSchema = z.array(DoctorSchema)
