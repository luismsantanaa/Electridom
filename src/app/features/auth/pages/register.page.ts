import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container">
      <div class="row justify-content-center">
        <div class="col-md-6">
          <div class="card mt-5">
            <div class="card-header">
              <h4>Registro</h4>
            </div>
            <div class="card-body">
              <p>Página de registro en desarrollo...</p>
              <a routerLink="/calc" class="btn btn-primary">Ir a Calculadora</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class RegisterPage {}
