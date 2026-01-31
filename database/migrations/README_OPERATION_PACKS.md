# Packs de Insumos por Código de Operación

## Descripción

La migración `add_operation_supply_packs.sql` crea la tabla `operation_supply_packs`, que permite:

- **Insumos recomendados**: insumos sugeridos para cada procedimiento (aparecen primero en el selector).
- **Pack preseleccionado**: insumos que se añaden automáticamente al elegir un código de operación.

Buenas prácticas aplicadas (estandarización de procedure packs, sistemas hospitalarios):

- Packs definidos en base de datos (auditables y mantenibles por el equipo).
- Solo Pabellón puede crear/editar/eliminar packs; Doctores solo leen.

## Uso

1. **Ejecutar la migración**  
   En Supabase SQL Editor o con tu cliente PostgreSQL:
   ```sql
   -- Ejecutar: database/migrations/add_operation_supply_packs.sql
   ```

2. **Opcional: datos de ejemplo**  
   Si tienes insumos en `supplies` con códigos como INS-001, INS-002, etc.:
   ```sql
   -- Ejecutar: database/setup/setup_operation_packs_ejemplo.sql
   ```
   Ajusta los códigos de insumos en ese script según tu inventario.

3. **Configurar packs por código**  
   - **cantidad >= 1**: el insumo se añade automáticamente al elegir ese código (pack).
   - **cantidad = 0**: solo “recomendado” (aparece primero en la lista, no se autoañade).

   Ejemplo para código `001` (Colecistectomía laparoscópica):
   ```sql
   INSERT INTO public.operation_supply_packs (codigo_operacion, supply_id, cantidad)
   SELECT '001', id, 2 FROM public.supplies WHERE codigo = 'INS-001' AND deleted_at IS NULL LIMIT 1
   ON CONFLICT (codigo_operacion, supply_id) DO UPDATE SET cantidad = EXCLUDED.cantidad;
   ```

## Tabla

| Columna           | Tipo   | Descripción                                      |
|-------------------|--------|--------------------------------------------------|
| codigo_operacion  | TEXT   | Código del procedimiento (ej. 001, 002)         |
| supply_id         | UUID   | Referencia a `supplies.id`                       |
| cantidad          | INT    | ≥1 = en pack (autoañadir); 0 = solo recomendado |

Primary key: `(codigo_operacion, supply_id)`.
