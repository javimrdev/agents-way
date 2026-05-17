# Skill: Orchestration SDD

## Cuándo usar
Cuando se necesite coordinar múltiples subagentes en un flujo basado en especificación y ejecución iterativa.

## Checklist
- Definir especificación clara antes de delegar.
- Crear plan en `docs/plans/<timestamp>-execution-plan.md`.
- Gestionar `docs/specs/*.md` de forma incremental:
- Crear specs faltantes.
- Actualizar specs existentes cuando cambie el desarrollo.
- Eliminar specs obsoletos o inválidos para el alcance actual.
- Asignar `Work Package` por subagente con entregables verificables.
- Exigir que cada subagente actualice `Execution Log`, `Risks & Blockers` y `Decisions`.
- Validar cierre contra `Acceptance Criteria`.
