-- =====================================================
-- INSUMOS BÁSICOS PARA CLÍNICAS PRIVADAS DE CHILE
-- Script para poblar la tabla supplies con insumos comunes
-- =====================================================

-- Este script inserta insumos básicos utilizados comúnmente en clínicas privadas chilenas
-- Los códigos siguen un formato estándar y están organizados por grupos de prestación

-- =====================================================
-- MATERIAL DE PROTECCIÓN Y ASEPSIA
-- =====================================================

INSERT INTO public.supplies (nombre, codigo, grupo_prestacion, activo) VALUES
('Guantes quirúrgicos estériles talla 6.5', 'INS-001', 'Protección y Asepsia', true),
('Guantes quirúrgicos estériles talla 7', 'INS-002', 'Protección y Asepsia', true),
('Guantes quirúrgicos estériles talla 7.5', 'INS-003', 'Protección y Asepsia', true),
('Guantes quirúrgicos estériles talla 8', 'INS-004', 'Protección y Asepsia', true),
('Guantes quirúrgicos estériles talla 8.5', 'INS-005', 'Protección y Asepsia', true),
('Mascarilla quirúrgica desechable', 'INS-006', 'Protección y Asepsia', true),
('Mascarilla N95', 'INS-007', 'Protección y Asepsia', true),
('Gorro quirúrgico desechable', 'INS-008', 'Protección y Asepsia', true),
('Bata quirúrgica estéril talla S', 'INS-009', 'Protección y Asepsia', true),
('Bata quirúrgica estéril talla M', 'INS-010', 'Protección y Asepsia', true),
('Bata quirúrgica estéril talla L', 'INS-011', 'Protección y Asepsia', true),
('Bata quirúrgica estéril talla XL', 'INS-012', 'Protección y Asepsia', true),
('Cubrecalzado desechable', 'INS-013', 'Protección y Asepsia', true),
('Antiséptico yodado (Povidona yodada)', 'INS-014', 'Protección y Asepsia', true),
('Alcohol al 70%', 'INS-015', 'Protección y Asepsia', true),
('Clorhexidina al 2%', 'INS-016', 'Protección y Asepsia', true),
('Solución salina estéril 500ml', 'INS-017', 'Protección y Asepsia', true),
('Solución salina estéril 1000ml', 'INS-018', 'Protección y Asepsia', true);

-- =====================================================
-- MATERIAL DE INYECCIÓN Y VENOCLISIS
-- =====================================================

INSERT INTO public.supplies (nombre, codigo, grupo_prestacion, activo) VALUES
('Jeringa estéril 3ml', 'INS-101', 'Inyección y Venoclisis', true),
('Jeringa estéril 5ml', 'INS-102', 'Inyección y Venoclisis', true),
('Jeringa estéril 10ml', 'INS-103', 'Inyección y Venoclisis', true),
('Jeringa estéril 20ml', 'INS-104', 'Inyección y Venoclisis', true),
('Jeringa estéril 50ml', 'INS-105', 'Inyección y Venoclisis', true),
('Aguja 18G x 1.5"', 'INS-106', 'Inyección y Venoclisis', true),
('Aguja 20G x 1.5"', 'INS-107', 'Inyección y Venoclisis', true),
('Aguja 21G x 1.5"', 'INS-108', 'Inyección y Venoclisis', true),
('Aguja 22G x 1"', 'INS-109', 'Inyección y Venoclisis', true),
('Aguja 23G x 1"', 'INS-110', 'Inyección y Venoclisis', true),
('Aguja 25G x 5/8"', 'INS-111', 'Inyección y Venoclisis', true),
('Catéter venoso 18G', 'INS-112', 'Inyección y Venoclisis', true),
('Catéter venoso 20G', 'INS-113', 'Inyección y Venoclisis', true),
('Catéter venoso 22G', 'INS-114', 'Inyección y Venoclisis', true),
('Catéter venoso 24G', 'INS-115', 'Inyección y Venoclisis', true),
('Set de venoclisis estándar', 'INS-116', 'Inyección y Venoclisis', true),
('Tubing de venoclisis', 'INS-117', 'Inyección y Venoclisis', true),
('Llave de tres vías', 'INS-118', 'Inyección y Venoclisis', true),
('Llave de paso', 'INS-119', 'Inyección y Venoclisis', true),
('Torniquete desechable', 'INS-120', 'Inyección y Venoclisis', true);

-- =====================================================
-- MATERIAL DE CURACIÓN Y VENDAS
-- =====================================================

INSERT INTO public.supplies (nombre, codigo, grupo_prestacion, activo) VALUES
('Gasa estéril 10x10cm', 'INS-201', 'Curación y Vendajes', true),
('Gasa estéril 20x20cm', 'INS-202', 'Curación y Vendajes', true),
('Gasa estéril 30x30cm', 'INS-203', 'Curación y Vendajes', true),
('Compresa estéril 10x10cm', 'INS-204', 'Curación y Vendajes', true),
('Compresa estéril 20x20cm', 'INS-205', 'Curación y Vendajes', true),
('Venda elástica 10cm x 4.5m', 'INS-206', 'Curación y Vendajes', true),
('Venda elástica 15cm x 4.5m', 'INS-207', 'Curación y Vendajes', true),
('Venda de gasa 5cm x 5m', 'INS-208', 'Curación y Vendajes', true),
('Venda de gasa 10cm x 5m', 'INS-209', 'Curación y Vendajes', true),
('Venda adhesiva hipoalergénica 2.5cm', 'INS-210', 'Curación y Vendajes', true),
('Venda adhesiva hipoalergénica 5cm', 'INS-211', 'Curación y Vendajes', true),
('Venda adhesiva hipoalergénica 7.5cm', 'INS-212', 'Curación y Vendajes', true),
('Esparadrapo microporoso 2.5cm', 'INS-213', 'Curación y Vendajes', true),
('Esparadrapo microporoso 5cm', 'INS-214', 'Curación y Vendajes', true),
('Algodón estéril 100g', 'INS-215', 'Curación y Vendajes', true),
('Algodón estéril 500g', 'INS-216', 'Curación y Vendajes', true),
('Apósito adhesivo 5x7cm', 'INS-217', 'Curación y Vendajes', true),
('Apósito adhesivo 10x12cm', 'INS-218', 'Curación y Vendajes', true),
('Apósito hidrocoloide', 'INS-219', 'Curación y Vendajes', true),
('Tela adhesiva quirúrgica', 'INS-220', 'Curación y Vendajes', true);

-- =====================================================
-- SUTURAS Y MATERIAL DE CIERRE
-- =====================================================

INSERT INTO public.supplies (nombre, codigo, grupo_prestacion, activo) VALUES
('Sutura absorbible 2-0', 'INS-301', 'Suturas y Cierre', true),
('Sutura absorbible 3-0', 'INS-302', 'Suturas y Cierre', true),
('Sutura absorbible 4-0', 'INS-303', 'Suturas y Cierre', true),
('Sutura absorbible 5-0', 'INS-304', 'Suturas y Cierre', true),
('Sutura no absorbible 2-0', 'INS-305', 'Suturas y Cierre', true),
('Sutura no absorbible 3-0', 'INS-306', 'Suturas y Cierre', true),
('Sutura no absorbible 4-0', 'INS-307', 'Suturas y Cierre', true),
('Sutura no absorbible 5-0', 'INS-308', 'Suturas y Cierre', true),
('Aguja de sutura recta', 'INS-309', 'Suturas y Cierre', true),
('Aguja de sutura curva 1/2 círculo', 'INS-310', 'Suturas y Cierre', true),
('Aguja de sutura curva 3/8 círculo', 'INS-311', 'Suturas y Cierre', true),
('Grapas quirúrgicas', 'INS-312', 'Suturas y Cierre', true),
('Aplicador de grapas', 'INS-313', 'Suturas y Cierre', true),
('Retirador de grapas', 'INS-314', 'Suturas y Cierre', true),
('Cinta adhesiva quirúrgica', 'INS-315', 'Suturas y Cierre', true),
('Cierre adhesivo cutáneo', 'INS-316', 'Suturas y Cierre', true);

-- =====================================================
-- CAMPOS QUIRÚRGICOS Y PAÑOS
-- =====================================================

INSERT INTO public.supplies (nombre, codigo, grupo_prestacion, activo) VALUES
('Campo quirúrgico fenestrado pequeño', 'INS-401', 'Campos Quirúrgicos', true),
('Campo quirúrgico fenestrado mediano', 'INS-402', 'Campos Quirúrgicos', true),
('Campo quirúrgico fenestrado grande', 'INS-403', 'Campos Quirúrgicos', true),
('Paño quirúrgico estéril 50x70cm', 'INS-404', 'Campos Quirúrgicos', true),
('Paño quirúrgico estéril 70x90cm', 'INS-405', 'Campos Quirúrgicos', true),
('Paño quirúrgico estéril 90x120cm', 'INS-406', 'Campos Quirúrgicos', true),
('Compresa quirúrgica grande', 'INS-407', 'Campos Quirúrgicos', true),
('Compresa quirúrgica mediana', 'INS-408', 'Campos Quirúrgicos', true),
('Compresa quirúrgica pequeña', 'INS-409', 'Campos Quirúrgicos', true),
('Drape quirúrgico adhesivo', 'INS-410', 'Campos Quirúrgicos', true);

-- =====================================================
-- MATERIAL DE ANESTESIA
-- =====================================================

INSERT INTO public.supplies (nombre, codigo, grupo_prestacion, activo) VALUES
('Mascarilla facial para oxígeno', 'INS-501', 'Anestesia', true),
('Cánula nasal para oxígeno', 'INS-502', 'Anestesia', true),
('Tubo endotraqueal 6.0', 'INS-503', 'Anestesia', true),
('Tubo endotraqueal 6.5', 'INS-504', 'Anestesia', true),
('Tubo endotraqueal 7.0', 'INS-505', 'Anestesia', true),
('Tubo endotraqueal 7.5', 'INS-506', 'Anestesia', true),
('Tubo endotraqueal 8.0', 'INS-507', 'Anestesia', true),
('Tubo endotraqueal 8.5', 'INS-508', 'Anestesia', true),
('Laringoscopio con hoja curva', 'INS-509', 'Anestesia', true),
('Laringoscopio con hoja recta', 'INS-510', 'Anestesia', true),
('Hoja de laringoscopio talla 3', 'INS-511', 'Anestesia', true),
('Hoja de laringoscopio talla 4', 'INS-512', 'Anestesia', true),
('Estilete para tubo endotraqueal', 'INS-513', 'Anestesia', true),
('Filtro de anestesia', 'INS-514', 'Anestesia', true),
('Circuito de anestesia pediátrico', 'INS-515', 'Anestesia', true),
('Circuito de anestesia adulto', 'INS-516', 'Anestesia', true),
('Bolsas reservorio', 'INS-517', 'Anestesia', true),
('Válvula unidireccional', 'INS-518', 'Anestesia', true);

-- =====================================================
-- MATERIAL DE DRENAJE
-- =====================================================

INSERT INTO public.supplies (nombre, codigo, grupo_prestacion, activo) VALUES
('Drenaje tipo Penrose 1/4"', 'INS-601', 'Drenajes', true),
('Drenaje tipo Penrose 1/2"', 'INS-602', 'Drenajes', true),
('Drenaje tipo Penrose 3/4"', 'INS-603', 'Drenajes', true),
('Drenaje tipo Jackson-Pratt 100ml', 'INS-604', 'Drenajes', true),
('Drenaje tipo Jackson-Pratt 200ml', 'INS-605', 'Drenajes', true),
('Drenaje tipo Jackson-Pratt 400ml', 'INS-606', 'Drenajes', true),
('Drenaje tipo Blake 19Fr', 'INS-607', 'Drenajes', true),
('Drenaje tipo Blake 24Fr', 'INS-608', 'Drenajes', true),
('Drenaje tipo Blake 28Fr', 'INS-609', 'Drenajes', true),
('Sonda nasogástrica 16Fr', 'INS-610', 'Drenajes', true),
('Sonda nasogástrica 18Fr', 'INS-611', 'Drenajes', true),
('Sonda nasogástrica 20Fr', 'INS-612', 'Drenajes', true),
('Sonda Foley 14Fr', 'INS-613', 'Drenajes', true),
('Sonda Foley 16Fr', 'INS-614', 'Drenajes', true),
('Sonda Foley 18Fr', 'INS-615', 'Drenajes', true),
('Sonda Foley 20Fr', 'INS-616', 'Drenajes', true),
('Bolsa de drenaje urinario', 'INS-617', 'Drenajes', true);

-- =====================================================
-- MATERIAL DE ELECTROCIRUGÍA
-- =====================================================

INSERT INTO public.supplies (nombre, codigo, grupo_prestacion, activo) VALUES
('Placa de electrodo desechable', 'INS-701', 'Electrocirugía', true),
('Electrodo bipolar', 'INS-702', 'Electrocirugía', true),
('Electrodo monopolar', 'INS-703', 'Electrocirugía', true),
('Cable de conexión para bisturí eléctrico', 'INS-704', 'Electrocirugía', true),
('Gel conductor para electrodo', 'INS-705', 'Electrocirugía', true);

-- =====================================================
-- MATERIAL DE HEMOSTASIA
-- =====================================================

INSERT INTO public.supplies (nombre, codigo, grupo_prestacion, activo) VALUES
('Esponja hemostática', 'INS-801', 'Hemostasia', true),
('Gelatina absorbible', 'INS-802', 'Hemostasia', true),
('Fibrina tópica', 'INS-803', 'Hemostasia', true),
('Trombina tópica', 'INS-804', 'Hemostasia', true),
('Clips hemostáticos pequeños', 'INS-805', 'Hemostasia', true),
('Clips hemostáticos medianos', 'INS-806', 'Hemostasia', true),
('Clips hemostáticos grandes', 'INS-807', 'Hemostasia', true),
('Aplicador de clips', 'INS-808', 'Hemostasia', true);

-- =====================================================
-- MATERIAL DE MONITOREO Y DIAGNÓSTICO
-- =====================================================

INSERT INTO public.supplies (nombre, codigo, grupo_prestacion, activo) VALUES
('Electrodo para ECG', 'INS-901', 'Monitoreo', true),
('Cable para ECG', 'INS-902', 'Monitoreo', true),
('Gel para ECG', 'INS-903', 'Monitoreo', true),
('Sensor de presión arterial no invasiva', 'INS-904', 'Monitoreo', true),
('Sensor de saturación de oxígeno', 'INS-905', 'Monitoreo', true),
('Cable para monitor multiparamétrico', 'INS-906', 'Monitoreo', true),
('Sonda de temperatura desechable', 'INS-907', 'Monitoreo', true);

-- =====================================================
-- MATERIAL ESPECIALIZADO
-- =====================================================

INSERT INTO public.supplies (nombre, codigo, grupo_prestacion, activo) VALUES
('Lente intraocular', 'INS-1001', 'Especializado', true),
('Implante de mama', 'INS-1002', 'Especializado', true),
('Prótesis de cadera', 'INS-1003', 'Especializado', true),
('Prótesis de rodilla', 'INS-1004', 'Especializado', true),
('Malla quirúrgica', 'INS-1005', 'Especializado', true),
('Stent vascular', 'INS-1006', 'Especializado', true),
('Válvula cardíaca', 'INS-1007', 'Especializado', true),
('Marcapasos', 'INS-1008', 'Especializado', true);

-- =====================================================
-- MATERIAL DE LIMPIEZA Y DESINFECCIÓN
-- =====================================================

INSERT INTO public.supplies (nombre, codigo, grupo_prestacion, activo) VALUES
('Detergente enzimático', 'INS-1101', 'Limpieza', true),
('Desinfectante de alto nivel', 'INS-1102', 'Limpieza', true),
('Alcohol isopropílico', 'INS-1103', 'Limpieza', true),
('Toallas desinfectantes', 'INS-1104', 'Limpieza', true),
('Esponja quirúrgica', 'INS-1105', 'Limpieza', true);

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

-- Verificar que todos los insumos se insertaron correctamente
SELECT 
    grupo_prestacion,
    COUNT(*) as total_insumos
FROM public.supplies
WHERE deleted_at IS NULL
GROUP BY grupo_prestacion
ORDER BY grupo_prestacion;

-- Mostrar total de insumos insertados
SELECT COUNT(*) as total_insumos_insertados
FROM public.supplies
WHERE deleted_at IS NULL;
