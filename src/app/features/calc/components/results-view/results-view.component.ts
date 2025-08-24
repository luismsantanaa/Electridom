import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface CalcRoomsResponse {
	ambientes: Array<{
		nombre: string;
		area_m2: number;
		carga_va: number;
		fp: number;
		observaciones: string;
	}>;
	totales: {
		carga_total_va: number;
		carga_diversificada_va: number;
		corriente_total_a: number;
		tension_v: number;
		phases: number;
	};
}

@Component({
	selector: 'app-results-view',
	standalone: true,
	imports: [CommonModule],
	template: `
		<div class="card" *ngIf="results()">
			<div class="card-header">
				<h5>Resultados del Cálculo</h5>
			</div>
			<div class="card-body">
				<!-- Totales -->
				<div class="row mb-4">
					<div class="col-md-12">
						<h6>Resumen General</h6>
						<div class="table-responsive">
							<table class="table table-bordered">
								<tbody>
									<tr>
										<td><strong>Carga Total (VA)</strong></td>
										<td>
											{{ results()?.totales.carga_total_va | number : '1.2-2' }}
										</td>
									</tr>
									<tr>
										<td><strong>Carga Diversificada (VA)</strong></td>
										<td>
											{{
												results()?.totales.carga_diversificada_va
													| number : '1.2-2'
											}}
										</td>
									</tr>
									<tr>
										<td><strong>Corriente Total (A)</strong></td>
										<td>
											{{
												results()?.totales.corriente_total_a | number : '1.2-2'
											}}
										</td>
									</tr>
									<tr>
										<td><strong>Tensión (V)</strong></td>
										<td>{{ results()?.totales.tension_v }}</td>
									</tr>
									<tr>
										<td><strong>Fases</strong></td>
										<td>{{ results()?.totales.phases }}</td>
									</tr>
								</tbody>
							</table>
						</div>
					</div>
				</div>

				<!-- Ambientes -->
				<div class="row">
					<div class="col-md-12">
						<h6>Detalle por Ambiente</h6>
						<div class="table-responsive">
							<table class="table table-striped">
								<thead>
									<tr>
										<th>Ambiente</th>
										<th>Área (m²)</th>
										<th>Carga (VA)</th>
										<th>Factor de Potencia</th>
										<th>Observaciones</th>
									</tr>
								</thead>
								<tbody>
									<tr *ngFor="let ambiente of results()?.ambientes">
										<td>{{ ambiente.nombre }}</td>
										<td>{{ ambiente.area_m2 | number : '1.2-2' }}</td>
										<td>{{ ambiente.carga_va | number : '1.2-2' }}</td>
										<td>{{ ambiente.fp | number : '1.2-2' }}</td>
										<td>{{ ambiente.observaciones }}</td>
									</tr>
								</tbody>
							</table>
						</div>
					</div>
				</div>

				<!-- Botones de Acción -->
				<div class="row mt-4">
					<div class="col-md-12">
						<button
							class="btn btn-success me-2"
							(click)="downloadReport('pdf')"
						>
							<i class="fas fa-file-pdf"></i> Descargar PDF
						</button>
						<button class="btn btn-info me-2" (click)="downloadReport('xlsx')">
							<i class="fas fa-file-excel"></i> Descargar Excel
						</button>
						<button class="btn btn-secondary" (click)="resetResults()">
							<i class="fas fa-refresh"></i> Nuevo Cálculo
						</button>
					</div>
				</div>
			</div>
		</div>

		<!-- Estado de carga -->
		<div class="card" *ngIf="loading()">
			<div class="card-body text-center">
				<div class="spinner-border" role="status">
					<span class="visually-hidden">Calculando...</span>
				</div>
				<p class="mt-2">Calculando cargas eléctricas...</p>
			</div>
		</div>

		<!-- Estado de error -->
		<div class="alert alert-danger" *ngIf="error()">
			<strong>Error:</strong> {{ error() }}
		</div>
	`,
	styles: [
		`
			.card {
				margin-bottom: 20px;
			}
			.table th {
				background-color: #f8f9fa;
			}
		`,
	],
})
export class ResultsViewComponent {
	results = input<CalcRoomsResponse | null>(null);
	loading = input<boolean>(false);
	error = input<string | null>(null);

	downloadReport(type: 'pdf' | 'xlsx') {
		// Implementar descarga de reportes
		console.log(`Descargando reporte en formato ${type}`);
	}

	resetResults() {
		// Implementar reset de resultados
		console.log('Reseteando resultados');
	}
}
