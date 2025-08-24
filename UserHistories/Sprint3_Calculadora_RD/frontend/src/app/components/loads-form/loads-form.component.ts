import { Component, signal } from '@angular/core';
@Component({ selector:'app-loads-form', standalone:true, template:`<h3>Consumos</h3>` })
export class LoadsFormComponent { loads = signal<any[]>([]); }
