# agents-way

Repositorio para gestionar agentes y skills orientados a desarrollo web, con una interfaz web local para instalarlos en otros proyectos.

## Qué instala

En el proyecto destino, el instalador crea:

- `.codex/agents/*.md`
- `.codex/skills/*/SKILL.md`
- `AGENTS.md` en raíz del proyecto destino, con referencias `@...` para que Codex detecte los agentes/skills instalados.

## Uso local

1. Levantar la UI:

```bash
pnpm start
```

2. Abrir:

- [http://localhost:3030](http://localhost:3030)

3. Seleccionar agentes/skills y ruta absoluta del proyecto destino.

## Catálogo inicial

### Agentes
- `orchestrator-sdd`
- `frontend-engineer`
- `backend-engineer`
- `qa-automation`

### Skills
- `orchestration-sdd`
- `frontend-react`
- `backend-node`
- `testing-e2e`

## Estructura

- `catalog/agents`: definición de agentes
- `catalog/skills`: definición de skills
- `catalog/templates`: plantillas de planes para orquestación
- `app/server.js`: API + servidor estático
- `public`: interfaz web
