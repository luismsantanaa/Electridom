import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirm-dialog.component.html',
  styleUrls: ['./confirm-dialog.component.scss']
})
export class ConfirmDialogComponent {
  @Input() title = 'Confirmar acción';
  @Input() message = '¿Está seguro de que desea realizar esta acción?';
  @Input() confirmText = 'Confirmar';
  @Input() cancelText = 'Cancelar';
  @Input() type: 'danger' | 'warning' | 'info' = 'warning';
  @Input() show = false;

  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
  @Output() showChange = new EventEmitter<boolean>();

  onConfirm() {
    this.confirm.emit();
    this.close();
  }

  onCancel() {
    this.cancel.emit();
    this.close();
  }

  private close() {
    this.show = false;
    this.showChange.emit(false);
  }

  getIconClass(): string {
    switch (this.type) {
      case 'danger':
        return 'bi-exclamation-triangle-fill text-danger';
      case 'warning':
        return 'bi-exclamation-triangle-fill text-warning';
      case 'info':
        return 'bi-info-circle-fill text-info';
      default:
        return 'bi-question-circle-fill text-primary';
    }
  }

  getButtonClass(): string {
    switch (this.type) {
      case 'danger':
        return 'btn-danger';
      case 'warning':
        return 'btn-warning';
      case 'info':
        return 'btn-info';
      default:
        return 'btn-primary';
    }
  }
}
