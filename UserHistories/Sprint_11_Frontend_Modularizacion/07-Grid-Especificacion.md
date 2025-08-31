# Especificación DataGrid Reutilizable

**Inputs**
- `columns: Array<{key: string, header: string, width?: string}>`
- `dataSourceFn: (query: {page: number; size: number; search?: string}) => Promise<{items: any[]; total: number}>`
- `actions: Array<'view'|'edit'|'delete'>`
- `pageSize: number`

**Outputs**
- `onView(id: number)`
- `onEdit(id: number)`
- `onDelete(id: number)`

**Búsqueda**
- Input de búsqueda simple que re-dispara `dataSourceFn`.
