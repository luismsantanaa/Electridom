import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { switchMap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { ProjectsService } from '../../../../core/services/projects/projects.service';
import { Project } from '../../../../shared/types/project.types';
import { UpdateProjectDto } from '../../../../core/services/projects/projects.service';

@Component({
  selector: 'app-project-edit',
  templateUrl: './project-edit.page.html',
  styleUrls: ['./project-edit.page.scss'],
  imports: [CommonModule, ReactiveFormsModule],
  standalone: true
})
export class ProjectEditPage implements OnInit {
  projectForm: FormGroup;
  project: Project | null = null;
  loading = true;
  saving = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private projectsService: ProjectsService
  ) {
    this.projectForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      owner: ['', [Validators.required]],
      apparentPowerKVA: [0, [Validators.required, Validators.min(0.1)]],
      circuits: [0, [Validators.required, Validators.min(1)]],
      description: [''],
      status: ['active', [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.loadProject();
  }

  private loadProject(): void {
    this.route.params
      .pipe(
        switchMap((params) => {
          const id = params['id'];
          return this.projectsService.getById(id);
        }),
        catchError((error) => {
          console.error('Error loading project:', error);
          this.router.navigate(['/proyectos']);
          return of(null);
        })
      )
      .subscribe((project) => {
        this.project = project;
        this.loading = false;

        if (project) {
          this.projectForm.patchValue({
            name: project.name,
            owner: project.owner,
            apparentPowerKVA: project.apparentPowerKVA,
            circuits: project.circuits,
            description: project.description || '',
            status: project.status
          });
        }
      });
  }

  onSubmit(): void {
    if (this.projectForm.valid && this.project) {
      this.saving = true;

      const updateData: UpdateProjectDto = this.projectForm.value;

      this.projectsService.update(this.project.id, updateData).subscribe({
        next: (updatedProject) => {
          this.saving = false;
          console.log('Proyecto actualizado exitosamente');
          this.router.navigate(['/proyectos/detail', updatedProject.id]);
        },
        error: (error) => {
          this.saving = false;
          console.error('Error updating project:', error);
          // Aquí podrías mostrar un toast o notificación de error
        }
      });
    }
  }

  onCancel(): void {
    if (this.project) {
      this.router.navigate(['/proyectos/detail', this.project.id]);
    } else {
      this.router.navigate(['/proyectos']);
    }
  }

  getErrorMessage(controlName: string): string {
    const control = this.projectForm.get(controlName);
    if (control?.errors) {
      if (control.errors['required']) {
        return 'Este campo es requerido';
      }
      if (control.errors['minlength']) {
        return `Mínimo ${control.errors['minlength'].requiredLength} caracteres`;
      }
      if (control.errors['min']) {
        return `El valor mínimo es ${control.errors['min'].min}`;
      }
    }
    return '';
  }
}
