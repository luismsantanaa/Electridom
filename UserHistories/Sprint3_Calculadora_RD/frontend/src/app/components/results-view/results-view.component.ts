import { Component, input } from '@angular/core';
@Component({ selector:'app-results-view', standalone:true, template:`<h3>Resultados</h3>` })
export class ResultsViewComponent { data = input<any>(); }
