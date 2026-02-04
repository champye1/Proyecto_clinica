// Opciones de hora en punto (sin minutos) para selects en doctor y pabellón
const HORAS = []
for (let i = 8; i <= 19; i++) {
  HORAS.push(`${i.toString().padStart(2, '0')}:00`)
}
export const HORAS_SELECT = HORAS
