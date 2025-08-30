# AppDataGrid — API del componente
## Props mínimas
- `columns: ColumnDef[]` -> { key, header, sortable?, width?, cell?(row) }
- `fetch: (params: {page,pageSize,sort,order,q,filters}) => Observable<GridResponse<T>>`
- `actions?: ActionDef[]` -> { label, icon, onClick(row), confirm? }
- `loading`, `emptyState`

## Comportamiento
- Paginación server-side, orden por columna, filtro rápido por texto.
- Acciones fila: **Ver**, **Editar**, **Eliminar** (con ConfirmDialog).

## Ejemplo de uso (Proyectos)
```ts
columns = [
  { key: 'name', header: 'Nombre', sortable: true },
  { key: 'owner', header: 'Propietario', sortable: true },
  { key: 'apparentPowerKVA', header: 'kVA', sortable: true },
  { key: 'circuits', header: 'Circuitos', sortable: true },
  { key: 'updatedAt', header: 'Actualizado', sortable: true },
];
fetch = (p) => this.projectsApi.list(p);
actions = [
  { label: 'Ver', icon: 'eye', onClick: r => this.router.navigate(['/proyectos/detail', r.id]) },
  { label: 'Editar', icon: 'edit', onClick: r => this.router.navigate(['/proyectos/edit', r.id]) },
  { label: 'Eliminar', icon: 'trash', confirm: true, onClick: r => this.projectsApi.delete(r.id).subscribe(() => this.reload()) },
];
```