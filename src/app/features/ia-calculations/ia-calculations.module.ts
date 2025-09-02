import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

import { IACalculationsComponent } from './ia-calculations.component';
import { IACalculationsService } from './ia-calculations.service';

@NgModule({
  declarations: [
    IACalculationsComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule.forChild([
      {
        path: '',
        component: IACalculationsComponent
      }
    ])
  ],
  providers: [
    IACalculationsService
  ]
})
export class IACalculationsModule { }
