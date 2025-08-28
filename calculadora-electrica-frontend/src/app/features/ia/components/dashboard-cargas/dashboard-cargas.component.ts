import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, ChartConfiguration, ChartType } from 'chart.js';
import { NgChartsModule } from 'ng2-charts';
import { IaService, Consumption } from '../../services/ia.service';

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string[];
    borderColor: string[];
    borderWidth: number;
  }[];
}

@Component({
  selector: 'app-dashboard-cargas',
  standalone: true,
  imports: [CommonModule, NgChartsModule],
  templateUrl: './dashboard-cargas.component.html',
  styleUrls: ['./dashboard-cargas.component.scss']
})
export class DashboardCargasComponent implements OnInit {
  private iaService = inject(IaService);

  // Signals
  isLoading = signal(false);
  chartData = signal<ChartData | null>(null);
  pieChartData = signal<ChartData | null>(null);
  barChartData = signal<ChartData | null>(null);

  // Datos de ejemplo
  sampleConsumptions: Consumption[] = [
    { nombre: 'Lámpara LED', ambiente: 'Sala', potencia_w: 15, tipo: 'iluminacion' },
    { nombre: 'TV Smart', ambiente: 'Sala', potencia_w: 120, tipo: 'entretenimiento' },
    { nombre: 'Refrigerador', ambiente: 'Cocina', potencia_w: 350, tipo: 'cocina' },
    { nombre: 'Microondas', ambiente: 'Cocina', potencia_w: 1100, tipo: 'cocina' },
    { nombre: 'Aire Acondicionado', ambiente: 'Dormitorio', potencia_w: 1500, tipo: 'climatizacion' },
    { nombre: 'Laptop', ambiente: 'Oficina', potencia_w: 65, tipo: 'otros' }
  ];

  ngOnInit() {
    this.generateCharts();
  }

  generateCharts() {
    this.isLoading.set(true);

    // Procesar datos
    const consumptionByType = this.groupByType(this.sampleConsumptions);
    const consumptionByEnvironment = this.groupByEnvironment(this.sampleConsumptions);

    // Gráfico de pastel por tipo de consumo
    this.pieChartData.set({
      labels: Object.keys(consumptionByType),
      datasets: [{
        label: 'Consumo por Tipo (W)',
        data: Object.values(consumptionByType),
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF'
        ],
        borderColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF'
        ],
        borderWidth: 2
      }]
    });

    // Gráfico de barras por ambiente
    this.barChartData.set({
      labels: Object.keys(consumptionByEnvironment),
      datasets: [{
        label: 'Consumo por Ambiente (W)',
        data: Object.values(consumptionByEnvironment),
        backgroundColor: [
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 99, 132, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)'
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(255, 99, 132, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)'
        ],
        borderWidth: 1
      }]
    });

    this.isLoading.set(false);
  }

  private groupByType(consumptions: Consumption[]): { [key: string]: number } {
    return consumptions.reduce((acc, consumption) => {
      const type = consumption.tipo;
      acc[type] = (acc[type] || 0) + consumption.potencia_w;
      return acc;
    }, {} as { [key: string]: number });
  }

  private groupByEnvironment(consumptions: Consumption[]): { [key: string]: number } {
    return consumptions.reduce((acc, consumption) => {
      const environment = consumption.ambiente;
      acc[environment] = (acc[environment] || 0) + consumption.potencia_w;
      return acc;
    }, {} as { [key: string]: number });
  }

  // Configuraciones de gráficos
  pieChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      title: {
        display: true,
        text: 'Distribución por Tipo de Consumo'
      }
    }
  };

  barChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Consumo por Ambiente'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Potencia (W)'
        }
      }
    }
  };

  // Métodos para exportar
  exportChartAsImage(chartType: 'pie' | 'bar') {
    // Implementar exportación de gráficos
    console.log(`Exportando gráfico ${chartType}`);
  }

  exportDataAsExcel() {
    // Implementar exportación a Excel
    console.log('Exportando datos a Excel');
  }

  getTypeBadgeClass(type: string): string {
    const classes = {
      'iluminacion': 'bg-primary',
      'entretenimiento': 'bg-success',
      'cocina': 'bg-warning',
      'climatizacion': 'bg-info',
      'otros': 'bg-secondary'
    };
    return classes[type as keyof typeof classes] || 'bg-secondary';
  }

  getPercentage(power: number): number {
    const total = this.getTotalPower();
    return total > 0 ? Math.round((power / total) * 100) : 0;
  }

  getTotalPower(): number {
    return this.sampleConsumptions.reduce((total, consumption) => total + consumption.potencia_w, 0);
  }
}
