import { Component, Input, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiService } from '../../services/ai.service';
import { 
  AnalyzeRequest, 
  QuickQuestion, 
  AiAnalysisState 
} from '../../interfaces/ai.interface';

// Interfaces para los datos de entrada y salida
interface CalculationInput {
  system?: { voltage?: number; phases?: number; frequency?: number };
  superficies?: Array<{ nombre: string; area_m2: number }>;
  consumos?: Array<{ nombre: string; ambiente: string; potencia_w: number; fp?: number; tipo?: string }>;
  [key: string]: unknown;
}

interface CalculationOutput {
  ambientes?: Array<{ nombre: string; area_m2: number; carga_va: number; fp: number; observaciones?: string }>;
  totales?: { carga_total_va: number; carga_diversificada_va: number; corriente_total_a: number; tension_v: number; phases: number };
  [key: string]: unknown;
}

@Component({
  selector: 'app-ai-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ai-panel.component.html',
  styles: [`
    .ai-panel { background: #fff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); padding: 20px; margin: 0 auto; }
    .ai-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 1px solid #eee; }
    .ai-title { display: flex; align-items: center; gap: 10px; }
    .ai-title i { font-size: 20px; color: #007bff; }
    .ai-title h3 { margin: 0; color: #333; font-weight: 600; }
    .alert { margin-bottom: 15px; border-radius: 6px; padding: 10px; display: flex; align-items: center; gap: 8px; }
    .alert.alert-danger { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
    .quick-questions { margin-bottom: 20px; }
    .quick-questions h5 { margin-bottom: 15px; color: #333; font-weight: 600; }
    .questions-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 10px; }
    .question-btn { display: flex; align-items: center; gap: 10px; padding: 12px; border: 1px solid #ddd; border-radius: 6px; background: #fff; text-align: left; cursor: pointer; }
    .question-btn:hover:not(.disabled) { border-color: #007bff; background: #f8f9ff; }
    .question-btn.disabled { opacity: 0.6; cursor: not-allowed; }
    .question-icon { font-size: 18px; }
    .question-text { font-size: 13px; color: #333; }
    .custom-question { margin-bottom: 20px; }
    .custom-question h5 { margin-bottom: 15px; color: #333; font-weight: 600; }
    .input-group { display: flex; gap: 8px; }
    .form-control { flex: 1; padding: 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px; }
    .form-control:focus { border-color: #007bff; }
    .form-control:disabled { background: #f8f9fa; opacity: 0.6; }
    .btn { padding: 10px 15px; border-radius: 6px; font-weight: 500; display: flex; align-items: center; gap: 6px; }
    .btn.disabled { opacity: 0.6; cursor: not-allowed; }
    .analysis-results .results-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
    .analysis-results .results-header h5 { margin: 0; color: #333; font-weight: 600; }
    .summary-section { margin-bottom: 20px; }
    .summary-card { background: #f8f9ff; border: 1px solid #e3e6ff; border-radius: 6px; padding: 15px; }
    .summary-header { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
    .summary-header i { color: #007bff; font-size: 14px; }
    .summary-header h6 { margin: 0; color: #333; font-weight: 600; }
    .summary-text { margin: 0; color: #555; line-height: 1.5; font-size: 13px; }
    .recommendations-section { margin-bottom: 20px; }
    .recommendations-section h6 { margin-bottom: 15px; color: #333; font-weight: 600; }
    .recommendations-grid { display: grid; gap: 12px; }
    .recommendation-card { background: #fff; border: 1px solid #ddd; border-radius: 6px; padding: 12px; }
    .recommendation-card.priority-high { border-left: 3px solid #dc3545; }
    .recommendation-card.priority-medium { border-left: 3px solid #ffc107; }
    .recommendation-card.priority-low { border-left: 3px solid #17a2b8; }
    .rec-header { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
    .rec-icon { font-size: 16px; }
    .rec-title { flex: 1; font-weight: 600; color: #333; font-size: 13px; }
    .rec-priority { padding: 3px 6px; border-radius: 3px; font-size: 9px; font-weight: 600; text-transform: uppercase; }
    .rec-priority.badge-danger { background: #dc3545; color: #fff; }
    .rec-priority.badge-warning { background: #ffc107; color: #212529; }
    .rec-priority.badge-info { background: #17a2b8; color: #fff; }
    .rec-description { margin: 0 0 10px 0; color: #555; line-height: 1.4; font-size: 12px; }
    .rec-category { display: inline-block; padding: 3px 6px; background: #e9ecef; color: #6c757d; border-radius: 3px; font-size: 10px; text-transform: capitalize; }
    .analysis-stats { display: flex; justify-content: space-around; padding: 12px; background: #f8f9fa; border-radius: 6px; }
    .stat-item { display: flex; align-items: center; gap: 6px; color: #6c757d; font-size: 11px; }
    .stat-item i { color: #007bff; }
    .empty-state { text-align: center; padding: 30px 15px; color: #6c757d; }
    .empty-state i { font-size: 36px; color: #007bff; margin-bottom: 12px; }
    .empty-state h5 { margin-bottom: 10px; color: #333; }
    .empty-state p { margin: 0; line-height: 1.4; }
    @media (max-width: 768px) {
      .ai-panel { padding: 15px; }
      .ai-header { flex-direction: column; gap: 10px; align-items: flex-start; }
      .questions-grid { grid-template-columns: 1fr; }
      .input-group { flex-direction: column; }
      .input-group .btn { width: 100%; justify-content: center; }
      .analysis-stats { flex-direction: column; gap: 10px; align-items: center; }
    }
  `]
})
export class AiPanelComponent implements OnInit {
  @Input() inputData: CalculationInput | null = null;
  @Input() outputData: CalculationOutput | null = null;

  // Inyección de dependencias moderna
  private aiService = inject(AiService);

  // Signals
  state = signal<AiAnalysisState>({
    isAnalyzing: false,
    analysis: null,
    error: null,
    lastQuestion: null
  });

  // Computed signals
  isAnalyzing = computed(() => this.state().isAnalyzing);
  analysis = computed(() => this.state().analysis);
  error = computed(() => this.state().error);
  hasAnalysis = computed(() => !!this.state().analysis);

  // Form data
  customQuestion = '';

  // Quick questions
  quickQuestions: QuickQuestion[] = [
    {
      id: 'system-analysis',
      text: '¿Cómo está configurado el sistema eléctrico?',
      category: 'system',
      icon: '⚡'
    },
    {
      id: 'demand-check',
      text: '¿Es correcto el factor de demanda aplicado?',
      category: 'demand',
      icon: '📊'
    },
    {
      id: 'protection-adequacy',
      text: '¿Las protecciones son adecuadas?',
      category: 'protection',
      icon: '🛡️'
    },
    {
      id: 'grounding-compliance',
      text: '¿Cumple con las normativas de puesta a tierra?',
      category: 'grounding',
      icon: '🔌'
    },
    {
      id: 'efficiency-optimization',
      text: '¿Hay oportunidades de optimización?',
      category: 'general',
      icon: '💡'
    },
    {
      id: 'cost-analysis',
      text: '¿Cuáles son las consideraciones de costo?',
      category: 'general',
      icon: '💰'
    }
  ];

  ngOnInit(): void {
    // Auto-analyze when data is available
    if (this.inputData && this.outputData) {
      this.analyzeWithQuestion('Analiza este cálculo eléctrico y proporciona recomendaciones generales.');
    }
  }

  /**
   * Analiza con una pregunta específica
   */
  analyzeWithQuestion(question: string): void {
    if (!this.inputData || !this.outputData) {
      this.setState({ error: 'No hay datos disponibles para analizar' });
      return;
    }

    this.setState({ 
      isAnalyzing: true, 
      error: null, 
      lastQuestion: question 
    });

    const request: AnalyzeRequest = {
      input: this.inputData,
      output: this.outputData,
      question: question
    };

    this.aiService.analyzeCalculation(request).subscribe({
      next: (response) => {
        this.setState({
          isAnalyzing: false,
          analysis: response,
          error: null
        });
      },
      error: (error) => {
        this.setState({
          isAnalyzing: false,
          error: error.message
        });
      }
    });
  }

  /**
   * Analiza con pregunta personalizada
   */
  analyzeWithCustomQuestion(): void {
    if (!this.customQuestion.trim()) {
      this.setState({ error: 'Por favor ingresa una pregunta' });
      return;
    }

    this.analyzeWithQuestion(this.customQuestion.trim());
    this.customQuestion = '';
  }

  /**
   * Limpia el análisis actual
   */
  clearAnalysis(): void {
    this.setState({
      analysis: null,
      error: null,
      lastQuestion: null
    });
  }

  /**
   * Actualiza el estado usando signal
   */
  private setState(updates: Partial<AiAnalysisState>): void {
    this.state.update(current => ({ ...current, ...updates }));
  }

  /**
   * Obtiene el color de prioridad
   */
  getPriorityColor(priority: string): string {
    switch (priority) {
      case 'high': return 'danger';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'secondary';
    }
  }

  /**
   * Obtiene el icono de categoría
   */
  getCategoryIcon(category: string): string {
    switch (category) {
      case 'safety': return '🛡️';
      case 'compliance': return '📋';
      case 'efficiency': return '⚡';
      case 'cost': return '💰';
      default: return '💡';
    }
  }

  /**
   * TrackBy function para recomendaciones
   */
  trackByRecommendation(index: number, rec: { title: string }): string {
    return rec.title + index;
  }
}
