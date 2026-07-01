# API Flights Connector

Proyecto de practica hecho con NestJS para consultar vuelos desde multiples proveedores mockeados, unificar la respuesta y cachear el resultado en Redis para evitar trabajo repetido en busquedas iguales.

La idea es exponer un endpoint simple de consulta que reciba origen, destino y fecha opcional, dispare la busqueda contra varios adapters en paralelo y devuelva una lista normalizada de vuelos aunque alguno de los proveedores falle.

## Objetivo del proyecto

Este proyecto busca practicar conceptos basicos pero importantes para una API backend:

- Modularizar una aplicacion con NestJS.
- Separar responsabilidades entre controller, service, DTO y adapters.
- Validar datos de entrada antes de ejecutar la logica de negocio.
- Integrar NestJS con Redis usando `@nestjs/cache-manager`.
- Agregar resultados de varios proveedores con `Promise.allSettled`.
- Normalizar formatos distintos de fecha, hora y aerolinea a un contrato comun.
- Reducir latencia y llamadas repetidas devolviendo resultados desde cache.

No es un metabuscador productivo ni una integracion real con aerolineas. Es un proyecto de practica orientado a entender agregacion de datos, tolerancia parcial a fallos y cacheo de respuestas en un flujo simple de busqueda.

## Stack

- Node.js
- NestJS
- TypeScript
- Redis
- `@nestjs/cache-manager`
- `@keyv/redis`
- class-validator
- date-fns
- Axios
- Swagger

## Funcionamiento general

La API expone un endpoint principal:

```http
GET /flights
```

Recibe `origin`, `destination` y `date` opcional por query params:

```http
GET /flights?origin=EZE&destination=MAD&date=2026-07-01
```

El flujo interno es:

1. `FlightsController` recibe la peticion HTTP.
2. `ValidationPipe` valida los query params con `SearchFlightDto`.
3. `FlightsService` arma una cache key con `origin-destination-date`.
4. Si Redis ya tiene una respuesta para esa combinacion, la devuelve sin consultar proveedores.
5. Si no hay cache, ejecuta `searchFlights` de todos los providers en paralelo con `Promise.allSettled`.
6. Cada provider filtra sus mocks propios y transforma la salida al formato `FlightNormalized`.
7. Si un proveedor falla, el servicio registra el error y continua con los que si respondieron.
8. Si al menos un proveedor devolvio resultados, la lista agregada se guarda en Redis.
9. El servicio responde el arreglo unificado al cliente.
10. Si todos los proveedores fallan, la API responde `500`.

## Como funciona el cache aca

`FlightsService` usa `CACHE_MANAGER` para guardar y recuperar resultados de busqueda:

```ts
const cacheKey = `${origin}-${destination}-${date}`;
```

El comportamiento es:

- Primero intenta leer Redis con esa clave.
- Si encuentra datos, responde directamente desde cache.
- Si no encuentra datos, consulta los providers.
- Cuando termina de agregar resultados exitosos, guarda la respuesta en Redis.

En `FlightsModule` el cache se registra con Redis:

```ts
CacheModule.registerAsync({
  useFactory: async () => ({
    ttl: 300000,
    stores: [new KeyvRedis('redis://redis:6379')],
  }),
})
```

Ese `ttl` esta definido en el modulo y el servicio vuelve a setear el resultado usando el mismo valor `300000`.

## Como funciona la agregacion de proveedores aca

La aplicacion arma un arreglo `FLIGHT_PROVIDERS` con tres adapters:

- `ProviderA`
- `ProviderB`
- `ProviderC`

`FlightsService` los ejecuta en paralelo:

```ts
const results = await Promise.allSettled(
  this.providers.map((provider) =>
    provider.searchFlights(origin, destination, date),
  ),
);
```

Eso permite que:

- Un proveedor caido no rompa toda la busqueda si otro devuelve datos.
- La respuesta final se construya uniendo todos los resultados exitosos.
- Los errores queden logueados por proveedor.

Hoy `ProviderB` fuerza un fallo con `throw new Error('Proveedor no disponible temporalmente')`, asi que el proyecto tambien sirve para practicar degradacion parcial del servicio.

## Normalizacion de resultados

Cada proveedor usa un formato distinto en sus mocks, pero todos terminan devolviendo esta estructura:

```ts
export class FlightNormalized {
  code: string;
  origin: string;
  destination: string;
  date: string;
  hour: string;
  airline: string;
  price: number;
}
```

La normalizacion incluye:

- `DateNormalizerService` para convertir fechas ISO o formatos distintos a `yyyy-MM-dd`.
- `DateNormalizerService` para extraer la hora en formato `HH:mm:ss`.
- `AirlinesService` para resolver codigo de aerolinea a nombre legible cuando hace falta.

## Modulos principales

La aplicacion se divide principalmente en:

- `FlightsModule`: registra controller, service, providers y cache Redis.
- `FlightsController`: expone la busqueda HTTP por query params.
- `FlightsService`: centraliza cache, agregacion de providers y manejo de errores.

## Proveedores actuales

Los adapters implementan la interfaz `FlightProvider`:

```ts
export interface FlightProvider {
  searchFlights(origin: string, destination: string, date?: string): Promise<FlightNormalized[]>;
}
```

Resumen de cada provider:

- `ProviderA`: usa `GlobalTraxFlights` y toma `operator.name` como aerolinea.
- `ProviderB`: usa `OceanicFlights`, resuelve `airline_code` con `AirlinesService`, pero hoy falla de forma intencional.
- `ProviderC`: usa `SkyHighFlights` y normaliza la fecha antes de comparar con el filtro opcional.

## Datos mock actuales

Los mocks incluidos hoy contienen estos vuelos:

```json
[
  { "code": "GT-001", "origin": "EZE", "destination": "MAD" },
  { "code": "GT-005", "origin": "EZE", "destination": "JFK" },
  { "code": "OC-99", "origin": "EZE", "destination": "MAD" },
  { "code": "OC-88", "origin": "EZE", "destination": "BCN" },
  { "code": "SK-101", "origin": "EZE", "destination": "MAD" },
  { "code": "SK-102", "origin": "EZE", "destination": "MAD" }
]
```

Como `ProviderB` hoy lanza un error antes de responder, en la practica la busqueda se alimenta desde `ProviderA` y `ProviderC`.

## Validaciones del request

`SearchFlightDto` valida:

- `origin`: obligatorio, string y longitud exacta de 3.
- `destination`: obligatorio, string y longitud exacta de 3.
- `date`: opcional, string.

Ejemplo valido:

```http
GET /flights?origin=EZE&destination=MAD&date=2026-07-01
```

## Endpoints disponibles

Flights:

```http
GET /flights
```

Swagger:

```http
GET /docs
```

## Ejemplo de respuestas

Busqueda exitosa:

```json
[
  {
    "code": "GT-001",
    "origin": "EZE",
    "destination": "MAD",
    "date": "2026-07-01",
    "hour": "10:00:00",
    "airline": "Lufthansa",
    "price": 240
  },
  {
    "code": "SK-101",
    "origin": "EZE",
    "destination": "MAD",
    "date": "2026-07-01",
    "hour": "10:00:00",
    "airline": "American Airlines",
    "price": 250
  }
]
```

Error de validacion:

```json
{
  "message": [
    "origin must be longer than or equal to 3 characters",
    "origin must be shorter than or equal to 3 characters"
  ],
  "error": "Bad Request",
  "statusCode": 400
}
```

Fallo total de proveedores:

```json
{
  "message": "Flight providers returned results.",
  "error": "Internal Server Error",
  "statusCode": 500
}
```

## Estructura del proyecto

```bash
src/
├── app.module.ts
├── main.ts
├── common/
│   ├── airlines.service.ts
│   └── date-normalized.service.ts
└── flights/
    ├── adapters/
    │   ├── flight-provider-interface.ts
    │   ├── provider-a/
    │   ├── provider-b/
    │   └── provider-c/
    ├── dto/
    │   ├── flight-normalized.dto.ts
    │   └── search-flight.dto.ts
    ├── mocks/
    ├── flights.controller.ts
    ├── flights.module.ts
    └── flights.service.ts
```

## Instalacion

```bash
npm install
```

## Variables y dependencias externas

Este proyecto no usa archivo `.env` en el codigo actual, pero si depende de:

- Redis accesible en `redis://redis:6379`.
- Acceso HTTP saliente para que `AirlinesService` descargue el listado de aerolineas desde jsDelivr al iniciar el modulo.

Importante:

- Ese host `redis` funciona dentro de Docker Compose.
- Si corres la API directo en tu maquina con `npm run start:dev`, Redis no esta parametrizado y probablemente vas a necesitar ajustar manualmente esa URL o levantar un host con ese nombre.

## Ejecucion local

Modo desarrollo:

```bash
npm run start:dev
```

Build:

```bash
npm run build
```

Produccion:

```bash
npm run start:prod
```

## Ejecucion con Docker

Levantar API + Redis:

```bash
docker compose up --build
```

La compose actual expone:

- API en `http://localhost:3000`
- Redis en `localhost:6379`

Swagger queda disponible en:

```http
http://localhost:3000/docs
```

## Prueba rapida

Con la API levantada:

```bash
curl "http://localhost:3000/flights?origin=EZE&destination=MAD&date=2026-07-01"
```

La primera llamada consulta providers y guarda cache. Las siguientes deberian responder desde Redis mientras la clave siga vigente.
