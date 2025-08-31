import { Component, Input, Output, EventEmitter, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface DataGridColumn {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'date' | 'boolean' | 'action';
  sortable?: boolean;
  width?: string;
  formatter?: (value: any) => string;
}

export interface DataGridAction {
  label: string;
  icon?: string;
  type: 'view' | 'edit' | 'delete' | 'custom';
  color?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info';
  disabled?: (item: any) => boolean;
}

export interface DataGridQuery {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  filters?: Record<string, any>;
}

export interface DataGridResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

@Component({
  selector: 'app-data-grid',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="data-grid-container">
      <!-- Search and Filters -->
      <div class="data-grid-header" *ngIf="showSearch || showFilters">
        <div class="search-section" *ngIf="showSearch">
          <input 
            type="text" 
            [(ngModel)]="searchTerm" 
            (input)="onSearchChange()"
            placeholder="Buscar..."
            class="form-control"
          >
        </div>
        <div class="filters-section" *ngIf="showFilters">
          <!-- Filters can be added here -->
        </div>
      </div>

      <!-- Table -->
      <div class="table-responsive">
        <table class="table table-striped table-hover">
          <thead>
            <tr>
              <th 
                *ngFor="let column of columns" 
                [style.width]="column.width"
                [class.sortable]="column.sortable"
                (click)="onSort(column.key)"
              >
                {{ column.label }}
                <i 
                  *ngIf="column.sortable" 
                  class="fas fa-sort"
                  [class.fa-sort-up]="sortBy() === column.key && sortOrder() === 'asc'"
                  [class.fa-sort-down]="sortBy() === column.key && sortOrder() === 'desc'"
                ></i>
              </th>
              <th *ngIf="actions.length > 0" class="actions-column">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of currentData()">
              <td *ngFor="let column of columns">
                <ng-container [ngSwitch]="column.type">
                  <span *ngSwitchCase="'date'">
                    {{ formatDate(item[column.key]) }}
                  </span>
                  <span *ngSwitchCase="'boolean'">
                    <i 
                      class="fas"
                      [class.fa-check]="item[column.key]"
                      [class.fa-times]="!item[column.key]"
                      [class.text-success]="item[column.key]"
                      [class.text-danger]="!item[column.key]"
                    ></i>
                  </span>
                  <span *ngSwitchDefault>
                    {{ column.formatter ? column.formatter(item[column.key]) : item[column.key] }}
                  </span>
                </ng-container>
              </td>
              <td *ngIf="actions.length > 0" class="actions-cell">
                <div class="btn-group" role="group">
                  <button 
                    *ngFor="let action of actions"
                    type="button"
                    class="btn btn-sm"
                    [class]="getActionClass(action)"
                    [disabled]="action.disabled ? action.disabled(item) : false"
                    (click)="onActionClick(action.type, item)"
                    [title]="action.label"
                  >
                    <i *ngIf="action.icon" [class]="action.icon"></i>
                    <span *ngIf="!action.icon">{{ action.label }}</span>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="data-grid-footer" *ngIf="showPagination">
        <div class="pagination-info">
          Mostrando {{ startIndex() + 1 }} - {{ endIndex() }} de {{ totalItems() }} registros
        </div>
        <nav aria-label="Paginación">
          <ul class="pagination pagination-sm">
            <li class="page-item" [class.disabled]="currentPage() === 1">
              <a class="page-link" (click)="onPageChange(currentPage() - 1)" href="javascript:void(0)">
                <i class="fas fa-chevron-left"></i>
              </a>
            </li>
            
            <li 
              *ngFor="let page of visiblePages()" 
              class="page-item"
              [class.active]="page === currentPage()"
            >
              <a class="page-link" (click)="onPageChange(page)" href="javascript:void(0)">
                {{ page }}
              </a>
            </li>
            
            <li class="page-item" [class.disabled]="currentPage() === totalPages()">
              <a class="page-link" (click)="onPageChange(currentPage() + 1)" href="javascript:void(0)">
                <i class="fas fa-chevron-right"></i>
              </a>
            </li>
          </ul>
        </nav>
        <div class="page-size-selector">
          <select [(ngModel)]="pageSize" (change)="onPageSizeChange()" class="form-select form-select-sm">
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
          <span class="ms-2">por página</span>
        </div>
      </div>

      <!-- Loading State -->
      <div class="loading-overlay" *ngIf="loading()">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Cargando...</span>
        </div>
      </div>

      <!-- Empty State -->
      <div class="empty-state" *ngIf="!loading() && currentData().length === 0">
        <i class="fas fa-inbox fa-3x text-muted"></i>
        <p class="text-muted">No se encontraron registros</p>
      </div>
    </div>
  `,
  styles: [`
    .data-grid-container {
      position: relative;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .data-grid-header {
      padding: 1rem;
      border-bottom: 1px solid #e9ecef;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .search-section input {
      max-width: 300px;
    }

    .table {
      margin-bottom: 0;
    }

    .table th {
      background-color: #f8f9fa;
      border-bottom: 2px solid #dee2e6;
      font-weight: 600;
      cursor: pointer;
      user-select: none;
    }

    .table th.sortable:hover {
      background-color: #e9ecef;
    }

    .table th.sortable i {
      margin-left: 0.5rem;
      opacity: 0.5;
    }

    .table th.sortable i.fa-sort-up,
    .table th.sortable i.fa-sort-down {
      opacity: 1;
    }

    .actions-column {
      width: 120px;
      text-align: center;
    }

    .actions-cell {
      text-align: center;
    }

    .btn-group .btn {
      margin-right: 0.25rem;
    }

    .btn-group .btn:last-child {
      margin-right: 0;
    }

    .data-grid-footer {
      padding: 1rem;
      border-top: 1px solid #e9ecef;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .pagination {
      margin-bottom: 0;
    }

    .page-link {
      cursor: pointer;
    }

    .page-size-selector {
      display: flex;
      align-items: center;
    }

    .page-size-selector select {
      width: auto;
    }

    .loading-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(255,255,255,0.8);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }

    .empty-state {
      padding: 3rem;
      text-align: center;
    }

    .empty-state i {
      margin-bottom: 1rem;
    }

    @media (max-width: 768px) {
      .data-grid-footer {
        flex-direction: column;
        align-items: stretch;
      }
      
      .pagination-info,
      .page-size-selector {
        text-align: center;
      }
    }
  `]
})
export class DataGridComponent<T = any> implements OnInit {
  @Input() columns: DataGridColumn[] = [];
  @Input() dataSourceFn!: (query: DataGridQuery) => Promise<DataGridResponse<T>>;
  @Input() actions: DataGridAction[] = [];
  @Input() pageSize = 25;
  @Input() showSearch = true;
  @Input() showFilters = false;
  @Input() showPagination = true;

  @Output() onView = new EventEmitter<T>();
  @Output() onEdit = new EventEmitter<T>();
  @Output() onDelete = new EventEmitter<T>();
  @Output() onAction = new EventEmitter<{ action: string; item: T }>();

  // Signals
  loading = signal(false);
  currentData = signal<T[]>([]);
  totalItems = signal(0);
  currentPage = signal(1);
  sortBy = signal<string>('');
  sortOrder = signal<'asc' | 'desc'>('asc');
  searchTerm = '';

  // Computed values
  totalPages = computed(() => Math.ceil(this.totalItems() / this.pageSize));
  startIndex = computed(() => (this.currentPage() - 1) * this.pageSize);
  endIndex = computed(() => Math.min(this.startIndex() + this.pageSize, this.totalItems()));

  visiblePages = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: number[] = [];

    if (total <= 7) {
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
    } else {
      if (current <= 4) {
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
        pages.push(-1); // Ellipsis
        pages.push(total);
      } else if (current >= total - 3) {
        pages.push(1);
        pages.push(-1); // Ellipsis
        for (let i = total - 4; i <= total; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push(-1); // Ellipsis
        for (let i = current - 1; i <= current + 1; i++) {
          pages.push(i);
        }
        pages.push(-1); // Ellipsis
        pages.push(total);
      }
    }

    return pages;
  });

  ngOnInit() {
    this.loadData();
  }

  async loadData() {
    this.loading.set(true);
    try {
      const query: DataGridQuery = {
        page: this.currentPage(),
        pageSize: this.pageSize,
        sortBy: this.sortBy(),
        sortOrder: this.sortOrder(),
        search: this.searchTerm || undefined
      };

      const response = await this.dataSourceFn(query);
      
      this.currentData.set(response.data);
      this.totalItems.set(response.total);
      this.currentPage.set(response.page);
    } catch (error) {
      console.error('Error loading data:', error);
      this.currentData.set([]);
      this.totalItems.set(0);
    } finally {
      this.loading.set(false);
    }
  }

  onSort(columnKey: string) {
    if (this.sortBy() === columnKey) {
      this.sortOrder.set(this.sortOrder() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortBy.set(columnKey);
      this.sortOrder.set('asc');
    }
    this.currentPage.set(1);
    this.loadData();
  }

  onSearchChange() {
    this.currentPage.set(1);
    this.loadData();
  }

  onPageChange(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.loadData();
    }
  }

  onPageSizeChange() {
    this.currentPage.set(1);
    this.loadData();
  }

  onActionClick(actionType: string, item: T) {
    switch (actionType) {
      case 'view':
        this.onView.emit(item);
        break;
      case 'edit':
        this.onEdit.emit(item);
        break;
      case 'delete':
        this.onDelete.emit(item);
        break;
      default:
        this.onAction.emit({ action: actionType, item });
    }
  }

  getActionClass(action: DataGridAction): string {
    const baseClass = 'btn-';
    switch (action.color) {
      case 'primary': return baseClass + 'primary';
      case 'secondary': return baseClass + 'secondary';
      case 'success': return baseClass + 'success';
      case 'danger': return baseClass + 'danger';
      case 'warning': return baseClass + 'warning';
      case 'info': return baseClass + 'info';
      default: return baseClass + 'outline-secondary';
    }
  }

  formatDate(value: any): string {
    if (!value) return '';
    const date = new Date(value);
    return date.toLocaleDateString('es-ES');
  }
}
