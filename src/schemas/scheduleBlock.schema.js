import { z } from 'zod'

// fetchBlocks usa: *, doctors:doctor_id(nombre, apellido), operating_rooms:operating_room_id(nombre)

const DoctorRefSchema = z.object({
  nombre: z.string(),
  apellido: z.string(),
}).nullable()

const OperatingRoomRefSchema = z.object({
  nombre: z.string(),
}).nullable()

export const ScheduleBlockSchema = z.object({
  id: z.string().uuid(),
  operating_room_id: z.string().uuid(),
  fecha: z.string(),
  hora_inicio: z.string(),
  hora_fin: z.string(),
  motivo: z.string().nullable().optional(),
  vigencia_hasta: z.string().nullable().optional(),
  created_at: z.string().optional(),
  doctors: DoctorRefSchema.optional(),
  operating_rooms: OperatingRoomRefSchema.optional(),
}).passthrough()

export const ScheduleBlockListSchema = z.array(ScheduleBlockSchema)
