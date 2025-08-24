import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
	RoomsFormComponent,
	Superficie,
} from '../components/rooms-form/rooms-form.component';
import {
	LoadsFormComponent,
	Consumo,
} from '../components/loads-form/loads-form.component';
import {
	ResultsViewComponent,
	CalcRoomsResponse,
} from '../components/results-view/results-view.component';
import { CalcApiService, CalcRoomsRequest } from '../services/calc-api.service';

@Component({
	selector: 'app-calc-page',
	standalone: true,
	imports: [
		CommonModule,
		RoomsFormComponent,
		LoadsFormComponent,
		ResultsViewComponent,
	],
	template: `
		<div class="container-fluid">
			<div class="row">
				<div class="col-12">
					<div class="page-title">
						<div class="row align-items-center">
							<div class="col-xl-4">
								<div class="page-title-content">
									<h3>Calculadora Eléctrica RD</h3>
									<p class="mb-2">
										Cálculo de cargas eléctricas residenciales, comerciales e
										industriales
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			<div class="row">
				<!-- Formularios -->
				<div class="col-xl-8" *ngIf="!results()">
					<app-rooms-form
						#roomsForm
						(superficiesChange)="onSuperficiesChange($event)"
					>
					</app-rooms-form>

					<app-loads-form
						#loadsForm
						[superficies]="superficies()"
						(consumosChange)="onConsumosChange($event)"
					>
					</app-loads-form>

					<!-- Configuración del Sistema -->
					<div class="card">
						<div class="card-header">
							<h5>Configuración del Sistema</h5>
						</div>
						<div class="card-body">
							<div class="row">
								<div class="col-md-4">
									<div class="form-group">
										<label for="voltage">Tensión (V)</label>
										<select
											class="form-control"
											id="voltage"
											[(ngModel)]="systemConfig.voltage"
										>
											<option value="120">120V</option>
											<option value="208">208V</option>
											<option value="240">240V</option>
											<option value="277">277V</option>
											<option value="480">480V</option>
										</select>
									</div>
								</div>
								<div class="col-md-4">
									<div class="form-group">
										<label for="phases">Fases</label>
										<select
											class="form-control"
											id="phases"
											[(ngModel)]="systemConfig.phases"
										>
											<option value="1">Monofásico</option>
											<option value="3">Trifásico</option>
										</select>
									</div>
								</div>
								<div class="col-md-4">
									<div class="form-group">
										<label for="frequency">Frecuencia (Hz)</label>
										<input
											type="number"
											class="form-control"
											id="frequency"
											[(ngModel)]="systemConfig.frequency"
											value="60"
											readonly
										/>
									</div>
								</div>
							</div>
						</div>
					</div>

					<!-- Botón de Cálculo -->
					<div class="card">
						<div class="card-body text-center">
							<button
								class="btn btn-primary btn-lg"
								(click)="calculateLoads()"
								[disabled]="!canCalculate() || loading()"
							>
								<i class="fas fa-calculator"></i> Calcular Cargas
							</button>
						</div>
					</div>
				</div>

				<!-- Resultados -->
				<div class="col-xl-12" *ngIf="results()">
					<app-results-view
						[results]="results()"
						[loading]="loading()"
						[error]="error()"
					>
					</app-results-view>
				</div>
			</div>
		</div>
	`,
	styles: [
		`
			.page-title {
				margin-bottom: 30px;
			}
			.card {
				margin-bottom: 20px;
			}
			.form-group {
				margin-bottom: 15px;
			}
		`,
	],
})
export class CalcPage {
	superficies = signal<Superficie[]>([]);
	consumos = signal<Consumo[]>([]);
	results = signal<CalcRoomsResponse | null>(null);
	loading = signal<boolean>(false);
	error = signal<string | null>(null);

	systemConfig = {
		voltage: 120,
		phases: 1,
		frequency: 60,
	};

	constructor(private calcApiService: CalcApiService) {}

	onSuperficiesChange(superficies: Superficie[]) {
		this.superficies.set(superficies);
	}

	onConsumosChange(consumos: Consumo[]) {
		this.consumos.set(consumos);
	}

	canCalculate(): boolean {
		return this.superficies().length > 0 && this.consumos().length > 0;
	}

	async calculateLoads() {
		if (!this.canCalculate()) return;

		this.loading.set(true);
		this.error.set(null);

		try {
			const request: CalcRoomsRequest = {
				system: {
					voltage: this.systemConfig.voltage,
					phases: this.systemConfig.phases,
					frequency: this.systemConfig.frequency,
				},
				superficies: this.superficies(),
				consumos: this.consumos(),
			};

			const response = await this.calcApiService
				.calcRoomsPreview(request)
				.toPromise();
			this.results.set(response || null);
		} catch (err: any) {
			this.error.set(err.message || 'Error al calcular las cargas');
			console.error('Error en cálculo:', err);
		} finally {
			this.loading.set(false);
		}
	}
}
