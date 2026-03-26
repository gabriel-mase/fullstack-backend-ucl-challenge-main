# Decisiones técnicas

Este documento describe las decisiones de arquitectura, los bugs corregidos, la funcionalidad agregada y los supuestos realizados durante la implementación.

---

## Arquitectura

### Domain-Driven Design con bounded contexts

El proyecto llegó con una estructura DDD implícita. La decisión fue hacerla explícita y consistente en todo el código nuevo.

Cada bounded context (`draw`, `matches`, `teams`) tiene el mismo esquema de capas:

```
contexts/<nombre>/
├── domain/          — entidades, interfaces de repositorio, servicios de dominio, excepciones
├── application/     — servicios de casos de uso (una clase por caso de uso)
├── infrastructure/  — implementaciones de repositorio con Prisma
└── presentation/    — router de Express + DTOs con Zod
```

**Por qué:** esta separación mantiene las reglas de negocio en `domain/`, la orquestación en `application/`, y las preocupaciones de I/O en `infrastructure/`. Cambiar la base de datos o el framework HTTP impacta solo una capa.

### Inyección de dependencias con InversifyJS

Todos los servicios y repositorios se resuelven a través de un contenedor de InversifyJS (`src/shared/container/`). Los consumidores nunca importan clases concretas directamente — solo interfaces y tokens de inyección (`TYPES`).

**Por qué:** bajo acoplamiento entre capas. Un test puede rebindear `TYPES.DrawRepository` a una implementación en memoria sin tocar el código de aplicación.

### Zod para validación de entrada en el borde

Cada endpoint HTTP valida sus entradas con un esquema Zod antes de pasar los datos a los servicios de aplicación. El esquema es la única fuente de verdad sobre lo que acepta la ruta.

**Por qué:** Zod coerciona y valida en un solo paso (`z.coerce.number()` sobre query params), y `.safeParse()` produce errores estructurados que se pueden reenviar como respuestas 400 sin necesidad de múltiples try/catch.

---

## Algoritmo de sorteo

### Problema con el original

El algoritmo original iteraba sobre los equipos en un orden fijo sin ninguna consideración de restricciones. Esto causaba deadlocks sistemáticos: los equipos procesados al final de la iteración no tenían rivales válidos disponibles porque los equipos anteriores los habían consumido sin considerar la disponibilidad futura.

### Solución: Minimum Remaining Values (MRV)

El algoritmo fue reescrito usando un enfoque de satisfacción de restricciones basado en la heurística MRV:

1. **Procesar primero el equipo más restringido.** En cada paso de cada fecha, se selecciona el equipo sin emparejar que tiene menos rivales válidos disponibles. Esto evita que un equipo muy restringido quede sin opciones al final.

2. **Elegir el rival más restringido.** Entre todos los rivales válidos para el equipo seleccionado, se prefiere el que tiene menos opciones restantes. Mismo principio: resolver los casos difíciles ahora, dejar los fáciles para después.

3. **Aleatorizar entre empates.** Cuando varios equipos tienen el mismo nivel de restricción, se elige uno al azar. Esto garantiza que cada ejecución de `POST /draw` produzca un sorteo diferente (pero siempre válido).

4. **Reintentar hasta 500 veces.** A pesar de MRV, caminos aleatorios poco frecuentes llevan a callejones sin salida. El bucle externo reintenta la generación completa. En la práctica, los sorteos válidos se encuentran en los primeros intentos.

### Aplicación de restricciones

Las cinco restricciones del dominio se verifican dentro del filtro de candidatos:

- `stateA.opponents.has(teamB.id)` — sin enfrentamientos repetidos
- `team.country.id === teamB.country.id` — sin enfrentamientos entre equipos del mismo país
- `opponentCountries.get(country) >= 2` — máximo 2 rivales del mismo país
- `stateA.home >= 4` / `stateA.away >= 4` — límite de 4 partidos de local y 4 de visitante
- `matchDays.has(matchDay)` — un partido por equipo por fecha (garantizado por construcción)

### Asignación de local/visitante

Cuando tanto local como visitante son posibles para un emparejamiento, el algoritmo elige el rol que acerca más al equipo a su objetivo de 4 partidos de local y 4 de visitante (`aHomeNeed > aAwayNeed`). Esto evita que se acumule un desbalance a lo largo de las fechas.

---

## Bugs corregidos

### 1. `MAX_COUNTRY_OPPONENTS = 3`

La constante que controla el número máximo de rivales del mismo país estaba configurada en `3` en lugar de `2`. Todos los sorteos generados con el código original violaban la regla del dominio.

**Corrección:** se cambió la constante a `2`.

### 2. Sin verificación de sorteo duplicado

`CreateDrawService` ejecutaba el algoritmo de sorteo y guardaba los resultados incondicionalmente — llamar a `POST /draw` dos veces creaba dos sorteos superpuestos en la base de datos.

**Corrección:** se agregó una verificación con `drawRepository.searchCurrent()` al inicio del servicio. Si ya existe un sorteo, se lanza `DrawAlreadyExistsError`.

### 3. `DrawAlreadyExistsError` no capturado en el router

La clase de error existía pero el router no tenía un handler para ella, por lo que caía en un 500 genérico.

**Corrección:** se agregó una rama `instanceof DrawAlreadyExistsError` que retorna `409 Conflict`.

### 4. Validación Zod definida pero nunca llamada en el router de matches

`SearchMatchesQuerySchema` estaba importado pero `safeParse` nunca se invocaba. Los query params pasaban directamente al servicio sin ninguna validación.

**Corrección:** se conectó `safeParse` con una respuesta 400 en caso de fallo. También se corrigió `.errors` → `.issues` (breaking change de Zod v4).

### 5. Sin validaciones de paginación en `SearchMatchesService`

No había verificación de límite inferior en `page` (podía ser `0` o negativo) ni tope de límite superior en `limit` (podía solicitar miles de filas en una sola consulta).

**Corrección:** se agregó la validación `page < 1` y un tope de `limit > 100`.

### 6. `drawId` pasado como string a `Match.create()`

El draw assigner llamaba `Match.create(..., String(drawId), ...)`. La entidad de dominio `Match` espera `drawId` como `number`, por lo que el contrato de tipos se violaba silenciosamente.

**Corrección:** se eliminó el cast `String()`.

### 7. Endpoint `DELETE /draw` faltante

No había forma de resetear el sorteo y ejecutar uno nuevo.

**Corrección:** se implementó `DELETE /draw`. Verifica la existencia del sorteo primero (404 si no existe), luego elimina todos los partidos y el registro del sorteo.

### 8. Endpoint `GET /health` faltante

**Corrección:** se agregó un health check que retorna `{ status, service, timestamp }`. Este endpoint no es consumido por el frontend — está pensado para uso de infraestructura: load balancers, orquestación de contenedores (`HEALTHCHECK` en Docker), pipelines de deployment y herramientas de monitoreo de disponibilidad.

---

## Endpoints nuevos

### `GET /teams`

El frontend necesita poblar los dropdowns de filtro de equipos y mostrar páginas de detalle por equipo. No existía ningún endpoint para listar equipos.

Se creó un bounded context dedicado `teams` (`src/contexts/teams/`) con su propia interfaz de repositorio, implementación Prisma, servicio de aplicación y router. Esto mantiene las responsabilidades de listado de equipos separadas de la lógica del sorteo, aunque ambas accedan a la misma tabla `Team`.

### `GET /matches/:id`

Permite obtener un partido individual por ID. Útil para links directos y para vistas de detalle futuras.

### `GET /draw/statistics`

Retorna datos agregados: total de partidos, fechas, partidos por fecha, total de equipos, países representados y un desglose por país. Esto alimenta el resumen del dashboard en el frontend sin requerir que el cliente lo derive de la lista completa de partidos.

---

## Frontend

### Next.js App Router

Se eligió el App Router por su routing basado en sistema de archivos y el soporte nativo para React Server Components. Todas las páginas con interactividad del lado del cliente (filtros, URL params) están marcadas como `'use client'`.

### TanStack Query

Todas las llamadas a la API se gestionan con TanStack Query. Provee caché, deduplicación y estados de carga/error con mínimo boilerplate. Cada combinación única de filtros se mapea a una query key, por lo que cambiar de filtros reutiliza el caché al volver.

### Cliente de API centralizado

Todas las llamadas a `fetch` viven en `frontend/src/services/api.ts`. Los componentes importan funciones `api.*` — nunca construyen URLs ni llaman a `fetch` directamente. Los tipos TypeScript compartidos viven en `frontend/src/types/index.ts`.

### Diseño de filtros

- **Filtro de equipo:** un select dropdown poblado desde `GET /teams`.
- **Filtro de fecha:** botones toggle (1–8) para acceso rápido.
- **Filtro local/visitante:** aparece solo cuando se selecciona un equipo específico, ya que el concepto de "local o visitante" solo tiene sentido en relación a un equipo. Cuando se selecciona un equipo, todos sus partidos se traen en una sola request y el filtro de rol se aplica del lado del cliente, evitando un round-trip adicional.

### Página de detalle de equipo (`/teams/[id]`)

Muestra el calendario completo de 8 partidos de un equipo agrupado por fecha, con rival, condición (L/V) y país. Permite explorar el fixture de cada equipo sin salir de la app.

---

## Supuestos

### País como proxy de confederación

El esquema de base de datos usa un campo `Country` (renombrado desde la columna original `Confederation` por migración). La restricción del dominio — "dos equipos de la misma confederación no pueden enfrentarse, máximo 2 por equipo" — se aplica a nivel de `country`.

En la práctica, para este conjunto de 36 equipos, cada país se mapea inequívocamente a una sola asociación futbolística (ej: España → clubes de LaLiga, Alemania → clubes de Bundesliga). El supuesto es válido para los datos actuales, pero requeriría revisión si se agregaran equipos de múltiples ligas dentro de la misma asociación futbolística.

### El sorteo es un singleton

Solo puede existir un sorteo a la vez. El sistema opera como una máquina de estados simple: o existe un sorteo o no existe. `POST /draw` lo crea, `DELETE /draw` lo resetea. Esto es intencional — el dominio del challenge describe un sorteo estacional de una sola vez, no un sistema de historial de múltiples sorteos.

### Asignación de bombo es posicional

`PotAssigner` asigna bombos según el orden en que aparecen los equipos en el archivo de seed (primeros 9 → Bombo 1, siguientes 9 → Bombo 2, etc.). El challenge no especificó criterios de asignación de bombos, por lo que se usó un enfoque posicional determinístico. Los datos de bombo se persisten pero no se usan actualmente como restricción en el algoritmo de sorteo, dado que las reglas del dominio no hacen referencia a restricciones de bombo.
