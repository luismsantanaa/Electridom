import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { IaRoutingModule } from './ia-routing-module';
import { IaService } from './services/ia.service';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    HttpClientModule,
    IaRoutingModule
  ],
  providers: [IaService]
})
export class IaModule { }
