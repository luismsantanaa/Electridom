# Backend NestJS (Sprint 8)
## Modules
- `ProjectsModule`: listado paginado
- `AiModule`: evaluate/suggestions (provider mock con interfaz `AiProvider`)

## Endpoints
- GET `/projects?page&pageSize&sort&order&q` -> `{ data, total, page, pageSize }`
- POST `/ai/evaluate` -> `{ score, alerts: Alert[], hints: string[] }`
- GET `/ai/suggestions?projectId=...` -> `{ suggestions: Suggestion[] }`

## DTOs (class-validator)
```ts
export class ListProjectsQuery {
  @IsInt() @Min(1) page: number;
  @IsInt() @Min(1) @Max(100) pageSize: number;
  @IsOptional() @IsString() sort?: string;
  @IsOptional() @IsIn(['asc','desc']) order?: 'asc'|'desc';
  @IsOptional() @IsString() q?: string;
}
```

## Respuesta estándar
```ts
interface GridResponse<T> { data: T[]; total: number; page: number; pageSize: number; }
```