# Generar Nuevo Módulo - Clínica Quirúrgica

Cuando el usuario invoque este skill, genera un nuevo módulo completo para el proyecto de clínica quirúrgica siguiendo los patrones establecidos del proyecto.

## Pregunta al usuario:
1. ¿Para qué rol es el módulo? (`pabellon` o `doctor`)
2. ¿Cuál es la entidad principal? (ej: `insumos`, `pacientes`, `cirugias`)
3. ¿Qué operaciones necesita? (listar, crear, editar, eliminar)

## Luego genera estos archivos siguiendo los patrones del proyecto:

### Hook (`src/hooks/use[Entidad].js`)
- Usa TanStack Query (`useQuery` para listar, `useMutation` para CUD)
- Queries a Supabase con `.select()`, `.insert()`, `.update()`, `.delete()`
- Filtra por rol si aplica (ej: `.eq('doctor_id', user.id)` para rol doctor)
- Invalida cache con `queryClient.invalidateQueries` en mutaciones

### Página (`src/pages/[rol]/[Entidad]Page.jsx`)
- Usa el layout correspondiente (`DoctorLayout` o `PabellonLayout`)
- Maneja estados loading/error con Spinner y mensaje de error
- Tabla de datos con acciones (editar, eliminar con confirmación)
- Botón para abrir modal de creación

### Formulario Modal (dentro de la página o componente separado si es complejo)
- Usa React Hook Form + Zod para validación
- Campos con estilos Tailwind consistentes con el resto del proyecto
- Maneja submit con la mutación del hook

### Registra la ruta en `src/App.jsx`
- Agrega la ruta bajo el rol correcto con autenticación

## Estilo de código a seguir:
- Componentes funcionales con arrow functions
- Tailwind para todos los estilos (sin CSS inline salvo excepciones)
- Nombres en español para variables de dominio (paciente, cirugia, pabellon)
- Nombres en inglés para variables técnicas (isLoading, handleSubmit, etc.)
- Comentarios solo donde la lógica no sea obvia
