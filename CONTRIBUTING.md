# Guía de Contribución

## Flujo de trabajo

1. Fork + rama `feat/nombre` o `fix/nombre`.
2. [Conventional Commits](https://www.conventionalcommits.org): `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`.
3. Pull Request con descripción del cambio.
4. La CI (`lint` + `build`) debe pasar.

## Estándares

- TypeScript estricto.
- La API `/v1/systemone` no cambia su contrato sin actualizar `PORTABLE.md` y los tests.
- El modo offline debe seguir siendo determinista y auditable.

## Tests

```bash
npm run lint
npm run build
npm run smoke
```
