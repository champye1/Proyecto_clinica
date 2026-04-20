/**
 * Especialidades médicas reconocidas en Chile
 * Basado en el registro de la Superintendencia de Salud y MINSAL
 */
export const ESPECIALIDADES_CHILE = [
  // ── Cirugía ──────────────────────────────────────────────────
  { value: 'cirugia_general',         label: 'Cirugía General' },
  { value: 'cirugia_cardiovascular',  label: 'Cirugía Cardiovascular' },
  { value: 'cirugia_cabeza_cuello',   label: 'Cirugía de Cabeza, Cuello y Maxilofacial' },
  { value: 'cirugia_pediatrica',      label: 'Cirugía Pediátrica' },
  { value: 'cirugia_plastica',        label: 'Cirugía Plástica y Reparadora' },
  { value: 'cirugia_torax',           label: 'Cirugía de Tórax' },
  { value: 'cirugia_vascular',        label: 'Cirugía Vascular Periférica' },
  { value: 'neurocirugia',            label: 'Neurocirugía' },
  { value: 'cirugia_ortopedica',      label: 'Ortopedia y Traumatología' },
  { value: 'urologia',                label: 'Urología' },
  { value: 'ginecologia',             label: 'Ginecología y Obstetricia' },
  { value: 'cirugia_oncologica',      label: 'Cirugía Oncológica' },
  { value: 'coloproctologia',         label: 'Coloproctología' },
  { value: 'cirugia_laparoscopica',   label: 'Cirugía Laparoscópica y Endoscópica' },
  { value: 'trasplante',              label: 'Cirugía de Trasplante' },

  // ── Medicina Interna y subespecialidades ──────────────────────
  { value: 'medicina_interna',        label: 'Medicina Interna' },
  { value: 'cardiologia',             label: 'Cardiología' },
  { value: 'cardiologia_intervencionista', label: 'Cardiología Intervencionista' },
  { value: 'endocrinologia',          label: 'Endocrinología' },
  { value: 'gastroenterologia',       label: 'Gastroenterología' },
  { value: 'hepatologia',             label: 'Hepatología' },
  { value: 'hematologia',             label: 'Hematología' },
  { value: 'infectologia',            label: 'Infectología' },
  { value: 'nefrologia',              label: 'Nefrología' },
  { value: 'neumologia',              label: 'Neumología' },
  { value: 'reumatologia',            label: 'Reumatología' },
  { value: 'oncologia',               label: 'Oncología Médica' },
  { value: 'hematologia_oncologica',  label: 'Hematología Oncológica' },

  // ── Otras especialidades clínicas ────────────────────────────
  { value: 'anestesiologia',          label: 'Anestesiología' },
  { value: 'anatomia_patologica',     label: 'Anatomía Patológica' },
  { value: 'dermatologia',            label: 'Dermatología' },
  { value: 'geriatria',               label: 'Geriatría' },
  { value: 'medicina_urgencia',       label: 'Medicina de Urgencia' },
  { value: 'medicina_familiar',       label: 'Medicina Familiar' },
  { value: 'medicina_rehabilitacion', label: 'Medicina Física y Rehabilitación' },
  { value: 'neurologia',              label: 'Neurología' },
  { value: 'oftalmologia',            label: 'Oftalmología' },
  { value: 'otorrinolaringologia',    label: 'Otorrinolaringología' },
  { value: 'pediatria',               label: 'Pediatría' },
  { value: 'neonatologia',            label: 'Neonatología' },
  { value: 'psiquiatria',             label: 'Psiquiatría' },
  { value: 'psiquiatria_infanto',     label: 'Psiquiatría Infanto-Juvenil' },
  { value: 'radiologia',              label: 'Radiología' },
  { value: 'radioterapia',            label: 'Radioterapia Oncológica' },
  { value: 'medicina_nuclear',        label: 'Medicina Nuclear' },
  { value: 'inmunologia',             label: 'Inmunología Clínica' },
  { value: 'genetica',                label: 'Genética Clínica' },
  { value: 'medicina_intensiva',      label: 'Medicina Intensiva (UCI)' },
  { value: 'medicina_trabajo',        label: 'Medicina del Trabajo' },
  { value: 'medicina_legal',          label: 'Medicina Legal y Forense' },
  { value: 'alergologia',             label: 'Alergología e Inmunología' },
  { value: 'reumatologia_pediatrica', label: 'Reumatología Pediátrica' },
  { value: 'endocrinologia_pediatrica', label: 'Endocrinología Pediátrica' },
  { value: 'neurologia_pediatrica',   label: 'Neurología Pediátrica' },
]

/** Retorna el label dado un value, o el propio value si no se encuentra */
export function getLabelEspecialidad(value) {
  if (!value) return '—'
  return ESPECIALIDADES_CHILE.find(e => e.value === value)?.label ?? value
}
