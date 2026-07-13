import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, forkJoin } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { ProjectsService } from '../../../../core/services/projects/projects.service';
import { Project } from '../../../../shared/types/project.types';
import { AiService, AiEvaluation, AiSuggestion } from '../../../../core/services/ai/ai.service';

@Component({
  selector: 'app-project-detail',
  templateUrl: './project-detail.page.html',
  styleUrls: ['./project-detail.page.scss'],
  imports: [CommonModule],
  standalone: true
})
export class ProjectDetailPage implements OnInit {
  project: Project | null = null;
  aiEvaluation: AiEvaluation | null = null;
  aiSuggestions: AiSuggestion[] = [];
  loading = true;
  aiLoading = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private projectsService: ProjectsService,
    private aiService: AiService
  ) { }

  ngOnInit(): void {
    this.loadProject();
  }

  private loadProject(): void {
    this.route.params.pipe(
      switchMap(params => {
        const id = params['id'];
        return this.projectsService.getById(id);
      }),
      catchError(error => {
        console.error('Error loading project:', error);
        this.router.navigate(['/proyectos']);
        return of(null);
      })
    ).subscribe(project => {
      this.project = project;
      this.loading = false;
      
      if (project) {
        this.loadAiData(project.id);
      }
    });
  }

  private loadAiData(projectId: string): void {
    this.aiLoading = true;
    
    forkJoin({
      evaluation: this.aiService.evaluateProject(projectId).pipe(
        catchError(error => {
          console.error('Error loading AI evaluation:', error);
          return of(null);
        })
      ),
      suggestions: this.aiService.getSuggestions(projectId).pipe(
        catchError(error => {
          console.error('Error loading AI suggestions:', error);
          return of({ suggestions: [] });
        })
      )
    }).subscribe(result => {
      this.aiEvaluation = result.evaluation;
      this.aiSuggestions = result.suggestions.suggestions;
      this.aiLoading = false;
    });
  }

  onEdit(): void {
    if (this.project) {
      this.router.navigate(['/proyectos/edit', this.project.id]);
    }
  }

  onBack(): void {
    this.router.navigate(['/proyectos']);
  }

  getScoreColor(score: number): string {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    return 'text-danger';
  }

  getScoreIcon(score: number): string {
    if (score >= 80) return 'bi-check-circle-fill';
    if (score >= 60) return 'bi-exclamation-triangle-fill';
    return 'bi-x-circle-fill';
  }

  getAlertIcon(severity: string): string {
    switch (severity) {
      case 'error': return 'bi-exclamation-triangle-fill text-danger';
      case 'warn': return 'bi-exclamation-triangle-fill text-warning';
      case 'info': return 'bi-info-circle-fill text-info';
      default: return 'bi-info-circle-fill text-primary';
    }
  }

  getSuggestionIcon(type: string): string {
    switch (type) {
      case 'optimization': return 'bi-lightning-fill text-warning';
      case 'safety': return 'bi-shield-check text-success';
      case 'efficiency': return 'bi-speedometer2 text-info';
      case 'compliance': return 'bi-file-check text-primary';
      default: return 'bi-lightbulb text-secondary';
    }
  }
}
