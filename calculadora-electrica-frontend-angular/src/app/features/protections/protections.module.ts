import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ProtectionsComponent } from './protections.component';
import { ProtectionsService } from './protections.service';
import { AppDataGridComponent } from '../../shared/components/app-data-grid/app-data-grid.component';
import { ProtectionsValidationComponent } from './protections-validation/protections-validation.component';
import { UnifilarExportComponent } from './unifilar-export/unifilar-export.component';

@NgModule({
  declarations: [
    ProtectionsComponent,
    ProtectionsValidationComponent,
    UnifilarExportComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    AppDataGridComponent,
    RouterModule.forChild([
      {
        path: '',
        component: ProtectionsComponent
      },
      {
        path: 'validation',
        component: ProtectionsValidationComponent
      },
      {
        path: 'unifilar',
        component: UnifilarExportComponent
      }
    ])
  ],
  providers: [
    ProtectionsService
  ]
})
export class ProtectionsModule { }
