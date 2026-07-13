import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable, Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';

export interface ColumnDef {
  key: string;
  header: string;
  sortable?: boolean;
  width?: string;
  cell?: (row: any) => string;
}

export interface ActionDef {
  label: string;
  icon: string;
  onClick: (row: any) => void;
  confirm?: boolean;
  disabled?: (row: any) => boolean;
}

export interface GridParams {
  page: number;
  pageSize: number;
  sort?: string;
  order?: 'asc' | 'desc';
  q?: string;
  filters?: Record<string, any>;
}

export interface GridResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

@Component({
  selector: 'app-data-grid',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app-data-grid.component.html',
  styleUrls: ['./app-data-grid.component.scss']
})
export class AppDataGridComponent<T = any> implements OnInit, OnDestroy {
  @Input() columns: ColumnDef[] = [];
  @Input() fetch!: (params: GridParams) => Observable<GridResponse<T>>;
  @Input() actions: ActionDef[] = [];
  @Input() loading = false;
  @Input() emptyState = 'No hay datos disponibles';

  @Output() rowClick = new EventEmitter<T>();

  data: T[] = [];
  total = 0;
  page = 1;
  pageSize = 10;
  sort = '';
  order: 'asc' | 'desc' = 'asc';
  searchQuery = '';

  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  ngOnInit() {
    this.setupSearch();
    this.loadData();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupSearch() {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(query => {
      this.searchQuery = query;
      this.page = 1;
      this.loadData();
    });
  }

  onSearchChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.searchSubject.next(target.value);
  }

  onSort(column: ColumnDef) {
    if (!column.sortable) return;

    if (this.sort === column.key) {
      this.order = this.order === 'asc' ? 'desc' : 'asc';
    } else {
      this.sort = column.key;
      this.order = 'asc';
    }

    this.loadData();
  }

  onPageChange(newPage: number) {
    this.page = newPage;
    this.loadData();
  }

  onPageSizeChange(newPageSize: number) {
    this.pageSize = newPageSize;
    this.page = 1;
    this.loadData();
  }

  onPageSizeChangeEvent(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.onPageSizeChange(+target.value);
  }

  onRowClick(row: T) {
    this.rowClick.emit(row);
  }

  onActionClick(action: ActionDef, row: T, event: Event) {
    event.stopPropagation();
    
    if (action.disabled && action.disabled(row)) {
      return;
    }

    if (action.confirm) {
      if (confirm(`¿Está seguro de que desea ${action.label.toLowerCase()} este elemento?`)) {
        action.onClick(row);
      }
    } else {
      action.onClick(row);
    }
  }

  private loadData() {
    this.loading = true;
    
    const params: GridParams = {
      page: this.page,
      pageSize: this.pageSize,
      sort: this.sort || undefined,
      order: this.order,
      q: this.searchQuery || undefined
    };

    this.fetch(params).subscribe({
      next: (response) => {
        this.data = response.data;
        this.total = response.total;
        this.page = response.page;
        this.pageSize = response.pageSize;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading data:', error);
        this.loading = false;
      }
    });
  }

  getCellValue(row: any, column: ColumnDef): string {
    if (column.cell) {
      return column.cell(row);
    }
    return row[column.key] || '';
  }

  get totalPages(): number {
    return Math.ceil(this.total / this.pageSize);
  }

  get pageNumbers(): number[] {
    const pages: number[] = [];
    const maxPages = Math.min(5, this.totalPages);
    const start = Math.max(1, this.page - Math.floor(maxPages / 2));
    
    for (let i = 0; i < maxPages; i++) {
      pages.push(start + i);
    }
    
    return pages;
  }

  getSortIcon(column: ColumnDef): string {
    if (!column.sortable || this.sort !== column.key) {
      return 'bi-arrow-down-up';
    }
    return this.order === 'asc' ? 'bi-arrow-up' : 'bi-arrow-down';
  }

  trackByFn(index: number, item: any): any {
    return item.id || index;
  }
}
