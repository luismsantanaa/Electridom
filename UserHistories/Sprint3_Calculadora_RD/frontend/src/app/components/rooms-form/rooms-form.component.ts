import { Component, signal } from '@angular/core';
@Component({ selector:'app-rooms-form', standalone:true, template:`<h3>Ambientes</h3>` })
export class RoomsFormComponent { rooms = signal<{nombre:string, area_m2:number}[]>([]); }
