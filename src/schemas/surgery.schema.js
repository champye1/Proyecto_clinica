import { z } from 'zod'

// Los queries de cirugías usan distintos niveles de joins según el contexto:
// fetchSurgeriesByDateRange  → doctors(apellido), patients(nombre, apellido, rut)
// fetchSurgeriesByDay        → doctors, patients, operating_rooms, surgery_requests
// fetchSurgeriesForDoctor    → patients, operating_rooms, surgery_requests

const PatientRefSchema = z.object({
  nombre: z.string(),
  apellido: z.string(),
  rut: z.string().nullable().optional(),
}).nullable()

const DoctorRefSchema = z.object({
  nombre: z.string().optional(),
  apellido: z.string(),
  especialidad: z.string().nullable().optional(),
}).nullable()

const OperatingRoomRefSchema = z.object({
  nombre: z.string(),
}).nullable()

const SurgeryRequestRefSchema = z.object({
  codigo_operacion: z.string().nullable().optional(),
}).nullable()

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
  patients: PatientRefSchema.optional(),
  doctors: DoctorRefSchema.optional(),
  operating_rooms: OperatingRoomRefSchema.optional(),
  surgery_requests: SurgeryRequestRefSchema.optional(),
}).passthrough()

export const SurgeryListSchema = z.array(SurgerySchema)
