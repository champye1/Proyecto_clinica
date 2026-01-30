// Códigos de operaciones quirúrgicas comunes en clínicas privadas de Chile
// Basados en procedimientos quirúrgicos frecuentes y códigos CIE-10
// grupoFonasa: los 2 primeros dígitos del código Fonasa (ej. 1801155 → 18). Sirve para filtrar insumos por tipo de cirugía.

export const codigosOperaciones = [
  // Cirugía General (grupo 18 - ej. hernias 1801155)
  { codigo: '001', nombre: 'Colecistectomía laparoscópica', descripcion: 'Extirpación de vesícula biliar por laparoscopia', grupoFonasa: '18' },
  { codigo: '002', nombre: 'Colecistectomía abierta', descripcion: 'Extirpación de vesícula biliar por cirugía abierta', grupoFonasa: '18' },
  { codigo: '003', nombre: 'Apendicectomía laparoscópica', descripcion: 'Extirpación de apéndice por laparoscopia', grupoFonasa: '18' },
  { codigo: '004', nombre: 'Apendicectomía abierta', descripcion: 'Extirpación de apéndice por cirugía abierta', grupoFonasa: '18' },
  { codigo: '005', nombre: 'Hernia inguinal laparoscópica', descripcion: 'Reparación de hernia inguinal por laparoscopia', grupoFonasa: '18' },
  { codigo: '006', nombre: 'Hernia inguinal abierta', descripcion: 'Reparación de hernia inguinal por cirugía abierta', grupoFonasa: '18' },
  { codigo: '007', nombre: 'Hernia umbilical', descripcion: 'Reparación de hernia umbilical', grupoFonasa: '18' },
  { codigo: '008', nombre: 'Hernia hiatal', descripcion: 'Reparación de hernia hiatal', grupoFonasa: '18' },
  { codigo: '009', nombre: 'Nodulectomía mamaria', descripcion: 'Extirpación de nódulo mamario', grupoFonasa: '18' },
  { codigo: '010', nombre: 'Mastectomía parcial', descripcion: 'Extirpación parcial de mama', grupoFonasa: '18' },
  
  // Cirugía Ortopédica
  { codigo: '101', nombre: 'Artroscopia de rodilla', descripcion: 'Cirugía artroscópica de rodilla', grupoFonasa: '11' },
  { codigo: '102', nombre: 'Meniscectomía artroscópica', descripcion: 'Extirpación de menisco por artroscopia', grupoFonasa: '11' },
  { codigo: '103', nombre: 'Reconstrucción de LCA', descripcion: 'Reconstrucción de ligamento cruzado anterior', grupoFonasa: '11' },
  { codigo: '104', nombre: 'Artroplastia de cadera', descripcion: 'Reemplazo de cadera', grupoFonasa: '11' },
  { codigo: '105', nombre: 'Artroplastia de rodilla', descripcion: 'Reemplazo de rodilla', grupoFonasa: '11' },
  { codigo: '106', nombre: 'Osteosíntesis de fémur', descripcion: 'Fijación de fractura de fémur', grupoFonasa: '11' },
  { codigo: '107', nombre: 'Osteosíntesis de tibia', descripcion: 'Fijación de fractura de tibia', grupoFonasa: '11' },
  { codigo: '108', nombre: 'Osteosíntesis de húmero', descripcion: 'Fijación de fractura de húmero', grupoFonasa: '11' },
  { codigo: '109', nombre: 'Osteosíntesis de radio', descripcion: 'Fijación de fractura de radio', grupoFonasa: '11' },
  { codigo: '110', nombre: 'Cirugía de túnel carpiano', descripcion: 'Liberación del túnel carpiano', grupoFonasa: '11' },
  
  // Cirugía Plástica y Reconstructiva
  { codigo: '201', nombre: 'Rinoplastia', descripcion: 'Cirugía estética de nariz', grupoFonasa: '20' },
  { codigo: '202', nombre: 'Blefaroplastia superior', descripcion: 'Cirugía de párpados superiores', grupoFonasa: '20' },
  { codigo: '203', nombre: 'Blefaroplastia inferior', descripcion: 'Cirugía de párpados inferiores', grupoFonasa: '20' },
  { codigo: '204', nombre: 'Abdominoplastia', descripcion: 'Cirugía estética de abdomen', grupoFonasa: '20' },
  { codigo: '205', nombre: 'Mamoplastia de aumento', descripcion: 'Aumento mamario', grupoFonasa: '20' },
  { codigo: '206', nombre: 'Mamoplastia de reducción', descripcion: 'Reducción mamaria', grupoFonasa: '20' },
  { codigo: '207', nombre: 'Lifting facial', descripcion: 'Estiramiento facial', grupoFonasa: '20' },
  { codigo: '208', nombre: 'Liposucción', descripcion: 'Extracción de grasa corporal', grupoFonasa: '20' },
  { codigo: '209', nombre: 'Otoplastia', descripcion: 'Cirugía estética de orejas', grupoFonasa: '20' },
  { codigo: '210', nombre: 'Reconstrucción mamaria', descripcion: 'Reconstrucción de mama post mastectomía', grupoFonasa: '20' },
  
  // Cirugía Oftalmológica
  { codigo: '301', nombre: 'Facoemulsificación de cataratas', descripcion: 'Cirugía de cataratas con facoemulsificación', grupoFonasa: '30' },
  { codigo: '302', nombre: 'Cirugía de cataratas extracapsular', descripcion: 'Cirugía de cataratas extracapsular', grupoFonasa: '30' },
  { codigo: '303', nombre: 'Vitrectomía', descripcion: 'Extracción del humor vítreo', grupoFonasa: '30' },
  { codigo: '304', nombre: 'Cirugía de desprendimiento de retina', descripcion: 'Reparación de desprendimiento de retina', grupoFonasa: '30' },
  { codigo: '305', nombre: 'Cirugía de glaucoma', descripcion: 'Cirugía para tratamiento de glaucoma', grupoFonasa: '30' },
  { codigo: '306', nombre: 'Cirugía de estrabismo', descripcion: 'Corrección de estrabismo', grupoFonasa: '30' },
  { codigo: '307', nombre: 'Cirugía de pterigión', descripcion: 'Extirpación de pterigión', grupoFonasa: '30' },
  { codigo: '308', nombre: 'LASIK', descripcion: 'Cirugía refractiva LASIK', grupoFonasa: '30' },
  { codigo: '309', nombre: 'PRK', descripcion: 'Cirugía refractiva PRK', grupoFonasa: '30' },
  { codigo: '310', nombre: 'Transplante de córnea', descripcion: 'Queratoplastia', grupoFonasa: '30' },
  
  // Cirugía Otorrinolaringológica
  { codigo: '401', nombre: 'Adenoidectomía', descripcion: 'Extirpación de adenoides', grupoFonasa: '40' },
  { codigo: '402', nombre: 'Amigdalectomía', descripcion: 'Extirpación de amígdalas', grupoFonasa: '40' },
  { codigo: '403', nombre: 'Adenoamigdalectomía', descripcion: 'Extirpación de adenoides y amígdalas', grupoFonasa: '40' },
  { codigo: '404', nombre: 'Septoplastia', descripcion: 'Corrección de desviación de tabique nasal', grupoFonasa: '40' },
  { codigo: '405', nombre: 'Turbinoplastia', descripcion: 'Reducción de cornetes nasales', grupoFonasa: '40' },
  { codigo: '406', nombre: 'Cirugía de senos paranasales', descripcion: 'Cirugía endoscópica de senos paranasales', grupoFonasa: '40' },
  { codigo: '407', nombre: 'Miringotomía', descripcion: 'Incisión en tímpano', grupoFonasa: '40' },
  { codigo: '408', nombre: 'Timpanoplastia', descripcion: 'Reparación del tímpano', grupoFonasa: '40' },
  { codigo: '409', nombre: 'Mastoidectomía', descripcion: 'Extirpación de mastoides', grupoFonasa: '40' },
  { codigo: '410', nombre: 'Estapedectomía', descripcion: 'Cirugía del estribo para otosclerosis', grupoFonasa: '40' },
  
  // Cirugía Urológica
  { codigo: '501', nombre: 'Nefrectomía laparoscópica', descripcion: 'Extirpación de riñón por laparoscopia', grupoFonasa: '50' },
  { codigo: '502', nombre: 'Nefrectomía abierta', descripcion: 'Extirpación de riñón por cirugía abierta', grupoFonasa: '50' },
  { codigo: '503', nombre: 'Prostatectomía radical', descripcion: 'Extirpación completa de próstata', grupoFonasa: '50' },
  { codigo: '504', nombre: 'Resección transuretral de próstata', descripcion: 'RTUP - Resección de próstata por uretra', grupoFonasa: '50' },
  { codigo: '505', nombre: 'Cistectomía', descripcion: 'Extirpación de vejiga', grupoFonasa: '50' },
  { codigo: '506', nombre: 'Litotricia extracorpórea', descripcion: 'Fragmentación de cálculos renales', grupoFonasa: '50' },
  { codigo: '507', nombre: 'Ureteroscopia', descripcion: 'Extracción de cálculos por ureteroscopia', grupoFonasa: '50' },
  { codigo: '508', nombre: 'Orquiectomía', descripcion: 'Extirpación de testículo', grupoFonasa: '50' },
  { codigo: '509', nombre: 'Varicocelectomía', descripcion: 'Reparación de varicocele', grupoFonasa: '50' },
  { codigo: '510', nombre: 'Cirugía de hidrocele', descripcion: 'Reparación de hidrocele', grupoFonasa: '50' },
  
  // Cirugía Ginecológica
  { codigo: '601', nombre: 'Histerectomía total laparoscópica', descripcion: 'Extirpación de útero por laparoscopia', grupoFonasa: '60' },
  { codigo: '602', nombre: 'Histerectomía total abierta', descripcion: 'Extirpación de útero por cirugía abierta', grupoFonasa: '60' },
  { codigo: '603', nombre: 'Ooforectomía laparoscópica', descripcion: 'Extirpación de ovario por laparoscopia', grupoFonasa: '60' },
  { codigo: '604', nombre: 'Salpingectomía', descripcion: 'Extirpación de trompa de Falopio', grupoFonasa: '60' },
  { codigo: '605', nombre: 'Miomectomía', descripcion: 'Extirpación de miomas uterinos', grupoFonasa: '60' },
  { codigo: '606', nombre: 'Laparoscopia ginecológica diagnóstica', descripcion: 'Exploración laparoscópica ginecológica', grupoFonasa: '60' },
  { codigo: '607', nombre: 'Cirugía de endometriosis', descripcion: 'Resección de endometriosis', grupoFonasa: '60' },
  { codigo: '608', nombre: 'Conización cervical', descripcion: 'Biopsia en cono del cuello uterino', grupoFonasa: '60' },
  { codigo: '609', nombre: 'Cirugía de prolapso', descripcion: 'Reparación de prolapso uterino/vaginal', grupoFonasa: '60' },
  { codigo: '610', nombre: 'Ligadura de trompas', descripcion: 'Esterilización quirúrgica femenina', grupoFonasa: '60' },
  
  // Cirugía Cardiovascular
  { codigo: '701', nombre: 'Bypass coronario', descripcion: 'Cirugía de revascularización coronaria', grupoFonasa: '70' },
  { codigo: '702', nombre: 'Reemplazo valvular aórtico', descripcion: 'Reemplazo de válvula aórtica', grupoFonasa: '70' },
  { codigo: '703', nombre: 'Reemplazo valvular mitral', descripcion: 'Reemplazo de válvula mitral', grupoFonasa: '70' },
  { codigo: '704', nombre: 'Reparación valvular', descripcion: 'Reparación de válvula cardíaca', grupoFonasa: '70' },
  { codigo: '705', nombre: 'Cirugía de aneurisma aórtico', descripcion: 'Reparación de aneurisma aórtico', grupoFonasa: '70' },
  { codigo: '706', nombre: 'Maze procedure', descripcion: 'Cirugía para fibrilación auricular', grupoFonasa: '70' },
  { codigo: '707', nombre: 'Cirugía de cardiopatía congénita', descripcion: 'Reparación de defecto cardíaco congénito', grupoFonasa: '70' },
  { codigo: '708', nombre: 'Instalación de marcapasos', descripcion: 'Implantación de marcapasos', grupoFonasa: '70' },
  { codigo: '709', nombre: 'Instalación de desfibrilador', descripcion: 'Implantación de desfibrilador automático', grupoFonasa: '70' },
  { codigo: '710', nombre: 'Angioplastia coronaria', descripcion: 'Intervención coronaria percutánea', grupoFonasa: '70' },
  
  // Cirugía Neurológica (grupo 80 - cerebro, no mallas de hernia)
  { codigo: '801', nombre: 'Craneotomía', descripcion: 'Apertura del cráneo', grupoFonasa: '80' },
  { codigo: '802', nombre: 'Resección de tumor cerebral', descripcion: 'Extirpación de tumor cerebral', grupoFonasa: '80' },
  { codigo: '803', nombre: 'Cirugía de hernia discal', descripcion: 'Discectomía lumbar/cervical', grupoFonasa: '80' },
  { codigo: '804', nombre: 'Laminectomía', descripcion: 'Extirpación de lámina vertebral', grupoFonasa: '80' },
  { codigo: '805', nombre: 'Fusión vertebral', descripcion: 'Artrodesis vertebral', grupoFonasa: '80' },
  { codigo: '806', nombre: 'Cirugía de aneurisma cerebral', descripcion: 'Clipping de aneurisma cerebral', grupoFonasa: '80' },
  { codigo: '807', nombre: 'Cirugía de malformación arteriovenosa', descripcion: 'Resección de MAV', grupoFonasa: '80' },
  { codigo: '808', nombre: 'Cirugía de epilepsia', descripcion: 'Resección de foco epiléptico', grupoFonasa: '80' },
  { codigo: '809', nombre: 'Cirugía de hidrocefalia', descripcion: 'Instalación de derivación ventriculoperitoneal', grupoFonasa: '80' },
  { codigo: '810', nombre: 'Descompresión microvascular', descripcion: 'Cirugía para neuralgia del trigémino', grupoFonasa: '80' },
  
  // Cirugía Digestiva
  { codigo: '901', nombre: 'Gastrectomía parcial', descripcion: 'Extirpación parcial de estómago', grupoFonasa: '90' },
  { codigo: '902', nombre: 'Gastrectomía total', descripcion: 'Extirpación completa de estómago', grupoFonasa: '90' },
  { codigo: '903', nombre: 'Resección intestinal', descripcion: 'Extirpación de segmento intestinal', grupoFonasa: '90' },
  { codigo: '904', nombre: 'Colectomía parcial', descripcion: 'Extirpación parcial de colon', grupoFonasa: '90' },
  { codigo: '905', nombre: 'Colectomía total', descripcion: 'Extirpación completa de colon', grupoFonasa: '90' },
  { codigo: '906', nombre: 'Cirugía de hemorroides', descripcion: 'Hemorroidectomía', grupoFonasa: '90' },
  { codigo: '907', nombre: 'Esplenectomía', descripcion: 'Extirpación de bazo', grupoFonasa: '90' },
  { codigo: '908', nombre: 'Pancreatectomía parcial', descripcion: 'Extirpación parcial de páncreas', grupoFonasa: '90' },
  { codigo: '909', nombre: 'Cirugía de reflujo gastroesofágico', descripcion: 'Funduplicatura de Nissen', grupoFonasa: '90' },
  { codigo: '910', nombre: 'Bypass gástrico', descripcion: 'Cirugía bariátrica - bypass gástrico', grupoFonasa: '90' },
  
  // Cirugía Torácica
  { codigo: '1001', nombre: 'Lobectomía pulmonar', descripcion: 'Extirpación de lóbulo pulmonar', grupoFonasa: '10' },
  { codigo: '1002', nombre: 'Neumonectomía', descripcion: 'Extirpación completa de pulmón', grupoFonasa: '10' },
  { codigo: '1003', nombre: 'Cirugía de neumotórax', descripcion: 'Reparación de neumotórax', grupoFonasa: '10' },
  { codigo: '1004', nombre: 'Timoctomía', descripcion: 'Extirpación de timo', grupoFonasa: '10' },
  { codigo: '1005', nombre: 'Cirugía de esófago', descripcion: 'Resección esofágica', grupoFonasa: '10' },
  { codigo: '1006', nombre: 'Toracoscopia', descripcion: 'Cirugía torácica por toracoscopia', grupoFonasa: '10' },
  { codigo: '1007', nombre: 'Pleurodesis', descripcion: 'Adhesión de pleura', grupoFonasa: '10' },
  { codigo: '1008', nombre: 'Biopsia pulmonar', descripcion: 'Biopsia quirúrgica de pulmón', grupoFonasa: '10' },
  { codigo: '1009', nombre: 'Cirugía de mediastino', descripcion: 'Resección de masa mediastínica', grupoFonasa: '10' },
  { codigo: '1010', nombre: 'Cirugía de diafragma', descripcion: 'Reparación de hernia diafragmática', grupoFonasa: '10' },
]

/** Obtiene el grupo Fonasa (2 dígitos) para un código de operación. Si el código tiene 7 dígitos tipo Fonasa, usa los 2 primeros; si no, busca en codigosOperaciones. */
export function getGrupoFonasaByCodigo(codigo) {
  if (!codigo) return null
  const s = String(codigo).trim()
  if (s.length >= 2 && /^\d+$/.test(s)) {
    if (s.length >= 7) return s.slice(0, 2)
    const item = codigosOperaciones.find(c => c.codigo === s)
    return item?.grupoFonasa ?? null
  }
  const item = codigosOperaciones.find(c => c.codigo === s)
  return item?.grupoFonasa ?? null
}

/** Indica si un insumo aplica para el grupo Fonasa de una cirugía. gruposFonasaInsumo = string "18,80" o null/undefined (aplica a todos). */
export function insumoAplicaParaGrupo(gruposFonasaInsumo, grupoFonasaCirugia) {
  if (!grupoFonasaCirugia) return true
  if (!gruposFonasaInsumo || gruposFonasaInsumo.trim() === '') return true
  const grupos = gruposFonasaInsumo.split(',').map(g => g.trim()).filter(Boolean)
  return grupos.length === 0 || grupos.includes(grupoFonasaCirugia)
}
