# PYTO Base Para Generar Proyectos

Framework genérico, agnóstico de dominio, para generar aplicaciones web vista a vista
mediante un pipeline de agentes [Claude Code](https://claude.com/claude-code) coordinados
por un agente **Orquestador**, apoyado en una base de datos PostgreSQL real.

No genera una aplicación concreta por sí mismo: cada uso de este framework arranca un
proyecto nuevo, vista a vista, a partir de descripciones en lenguaje natural que el usuario
escribe — sin boceto visual, sin dominio predefinido.

## Cómo empezar

Habla con el Orquestador:

```
/orchestrator
```

Y dale una vista para diseñar:

```
lee vistas/<vista>/descripcion_vista_<vista>.md, tablas: [...]
```

A partir de ahí, el Orquestador se encarga de ejecutar el resto de agentes del pipeline —
parándose a pedir tu revisión en la fase de diseño, y corriendo de forma autónoma (hasta
10 ciclos) en la fase de construcción.

Ver [Pipeline](pipeline.md) para el detalle de las dos fases y los agentes implicados, y
[Architecture](architecture.md) para las decisiones de stack técnico.

## Estado del proyecto

- ✅ Esqueleto del pipeline (agentes, schemas, estructura de carpetas)
- ⏳ `DATABASE_URL` pendiente de configurar — ver `.env.example`
- ⏳ RAG (`knowledge_base` con pgvector + embeddings) — diseñado, no construido todavía
- ⏳ Sin ninguna vista generada todavía

## Fuente de verdad

Las reglas completas del proyecto viven en
[`CLAUDE.md`](https://github.com/dbetancorfp/PYTO_BASE_PARA_GENERAR_PROYECTOS/blob/main/CLAUDE.md)
en la raíz del repositorio — esta documentación lo resume para lectura humana, pero
`CLAUDE.md` manda en caso de discrepancia.
