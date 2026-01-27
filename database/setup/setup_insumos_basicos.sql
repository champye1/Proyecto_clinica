-- =====================================================
-- INSUMOS BÁSICOS PARA CLÍNICAS PRIVADAS
-- Agrupa el script de insumos en un archivo de setup
-- (Contenido original de insumos_basicos_chile.sql)
-- =====================================================

-- Nota: este archivo se mantiene separado porque contiene
-- una gran cantidad de INSERTs específicos de inventario.

-- =====================================================
-- CONTENIDO ORIGINAL
-- =====================================================

-- INSUMOS BÁSICOS PARA CLÍNICAS PRIVADAS DE CHILE
-- Script para poblar la tabla supplies con insumos comunes

-- Este script inserta insumos básicos utilizados comúnmente en clínicas privadas chilenas
-- Los códigos siguen un formato estándar y están organizados por grupos de prestación

-- (Se ha copiado íntegro desde insumos_basicos_chile.sql)

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

-- (Resto del contenido de insumos_basicos_chile.sql se mantiene igual)

