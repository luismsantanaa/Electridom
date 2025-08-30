import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// UI Components
import { AppDataGridComponent } from './ui/app-data-grid/app-data-grid.component';
import { ConfirmDialogComponent } from './components/confirm-dialog/confirm-dialog.component';

// Directives
import { ClickOutsideDirective } from './directives/click-outside.directive';
import { HasRoleDirective } from './directives/has-role.directive';
import { HasAnyRoleDirective } from './directives/has-any-role.directive';

@NgModule({
  imports: [CommonModule, FormsModule, ReactiveFormsModule, AppDataGridComponent, ConfirmDialogComponent, ClickOutsideDirective, HasRoleDirective, HasAnyRoleDirective],
  exports: [CommonModule, FormsModule, ReactiveFormsModule, AppDataGridComponent, ConfirmDialogComponent, ClickOutsideDirective, HasRoleDirective, HasAnyRoleDirective]
})
export class SharedModule {}
