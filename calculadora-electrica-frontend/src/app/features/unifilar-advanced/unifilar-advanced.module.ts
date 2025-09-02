import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { UnifilarAdvancedComponent } from './unifilar-advanced.component';
import { UnifilarAdvancedService } from './unifilar-advanced.service';

@NgModule({
  declarations: [
    UnifilarAdvancedComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule.forChild([
      {
        path: '',
        component: UnifilarAdvancedComponent
      }
    ])
  ],
  providers: [
    UnifilarAdvancedService
  ],
  exports: [
    UnifilarAdvancedComponent
  ]
})
export class UnifilarAdvancedModule {}
